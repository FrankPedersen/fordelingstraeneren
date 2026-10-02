import type { Item, LogEntry } from './leitner';
import { emptyStreak, type Streak } from './streak';

export const STORAGE_KEY = 'fordelingstraener:v1';

/** Her lægges en kopi af gemte data, der ikke kunne læses, så intet går tabt. */
export const BACKUP_KEY = `${STORAGE_KEY}:kopi`;

export const SCHEMA_VERSION = 1;

export type Skill = 'rank' | 'compare' | 'read' | 'complete';
export const SKILLS: readonly Skill[] = ['rank', 'compare', 'read', 'complete'];

export interface SessionRecord {
  day: string;
  ms: number;
  correct: number;
  total: number;
  /** Korrekte svar pr. minut i lynrunden. */
  cpm: number;
}

/** Skemaet fra SPEC.md (Data og lagring). */
export interface Saved {
  version: 1;
  settings: { sessionSeconds: 300; dayStartsAtHour: 4; fastMs: Record<Skill, number> };
  palace: {
    rooms: { name: string }[];
    stations: { name: string; room: number; patternId: string; scene?: string }[];
  };
  /** patternId -> eget billede; ellers standardbilledet. */
  images: Record<string, string>;
  /** Nøgle: `${patternId}:${skill}`. */
  items: Record<string, Item>;
  album: Record<string, { first: string; count: number }>;
  streak: Streak;
  xp: number;
  sessions: SessionRecord[];
}

export function defaultSaved(): Saved {
  return {
    version: 1,
    settings: {
      sessionSeconds: 300,
      dayStartsAtHour: 4,
      // "read" (lynaflæsning) får sin tærskel i trin 4; 3 s er en pladsholder.
      fastMs: { rank: 3000, compare: 3000, read: 3000, complete: 10_000 },
    },
    palace: { rooms: [], stations: [] },
    images: {},
    items: {},
    album: {},
    streak: emptyStreak(),
    xp: 0,
    sessions: [],
  };
}

type Raw = Record<string, unknown>;

const isObject = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isCount = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0;
const isString = (v: unknown): v is string => typeof v === 'string';
const isDay = (v: unknown): v is string => isString(v) && /^\d{4}-\d{2}-\d{2}$/.test(v);

const isLogEntry = (v: unknown): v is LogEntry =>
  isObject(v) &&
  isNumber(v.t) &&
  typeof v.ok === 'boolean' &&
  isNumber(v.ms) &&
  (v.sure === undefined || typeof v.sure === 'boolean');

const isItem = (v: unknown): v is Item =>
  isObject(v) &&
  [1, 2, 3, 4, 5].includes(v.box as number) &&
  isDay(v.due) &&
  [0, 1, 2, 3].includes(v.support as number) &&
  Array.isArray(v.log) &&
  v.log.every(isLogEntry);

const isStreak = (v: unknown): v is Streak =>
  isObject(v) &&
  isCount(v.current) &&
  isCount(v.best) &&
  (v.lastDay === '' || isDay(v.lastDay)) &&
  (v.jokerWeek === undefined || (isString(v.jokerWeek) && /^\d{4}-W\d{2}$/.test(v.jokerWeek)));

const isSession = (v: unknown): v is SessionRecord =>
  isObject(v) &&
  isDay(v.day) &&
  isCount(v.ms) &&
  isCount(v.correct) &&
  isCount(v.total) &&
  isNumber(v.cpm);

const isAlbumEntry = (v: unknown) => isObject(v) && isDay(v.first) && isCount(v.count);

const isRooms = (v: unknown) => Array.isArray(v) && v.every((r) => isObject(r) && isString(r.name));

const isStations = (v: unknown) =>
  Array.isArray(v) &&
  v.every(
    (s) =>
      isObject(s) &&
      isString(s.name) &&
      isCount(s.room) &&
      isString(s.patternId) &&
      (s.scene === undefined || isString(s.scene)),
  );

const isStringRecord = (v: unknown) => isObject(v) && Object.values(v).every(isString);

// Ved en ny skemaversion: tilføj et trin, der løfter data fra version n til n + 1 og bevarer ukendte felter.
const MIGRATIONS: Record<number, (data: Raw) => Raw> = {};

function migrate(data: Raw): Raw {
  let current = data;
  while (isNumber(current.version) && current.version < SCHEMA_VERSION) {
    const step = MIGRATIONS[current.version];
    if (!step) break;
    current = step(current);
  }
  return current;
}

/**
 * Læser gemte data. Ugyldige dele erstattes af standardværdier og noteres i `problems`;
 * ukendte felter bevares.
 */
export function readSaved(input: unknown): { saved: Saved; problems: string[] } {
  const problems: string[] = [];
  const fallback = defaultSaved();
  if (!isObject(input)) return { saved: fallback, problems: ['data mangler'] };
  const raw = migrate(input);

  function check<T>(name: string, value: unknown, valid: (v: unknown) => boolean, def: T): T {
    if (valid(value)) return value as T;
    problems.push(value === undefined ? `${name} mangler` : `${name} er ugyldig`);
    return def;
  }

  function record<T>(name: string, value: unknown, valid: (v: unknown) => boolean): Record<string, T> {
    const entries = check<Raw>(name, value, isObject, {});
    const result: Record<string, T> = {};
    for (const [key, entry] of Object.entries(entries)) {
      if (valid(entry)) result[key] = entry as T;
      else problems.push(`${name}["${key}"] er ugyldig`);
    }
    return result;
  }

  function list<T>(name: string, value: unknown, valid: (v: unknown) => boolean): T[] {
    const entries = check<unknown[]>(name, value, Array.isArray, []);
    entries.forEach((entry, i) => valid(entry) || problems.push(`${name}[${i}] er ugyldig`));
    return entries.filter(valid) as T[];
  }

  if (raw.version !== SCHEMA_VERSION) problems.push('version er ugyldig');

  const settingsIn = check<Raw>('settings', raw.settings, isObject, {});
  const fastIn = check<Raw>('settings.fastMs', settingsIn.fastMs, isObject, {});
  const fastMs = { ...fastIn } as Record<Skill, number>;
  for (const skill of SKILLS) {
    const valid = (v: unknown) => isNumber(v) && v > 0;
    fastMs[skill] = check(`settings.fastMs.${skill}`, fastIn[skill], valid, fallback.settings.fastMs[skill]);
  }

  const palaceIn = check<Raw>('palace', raw.palace, isObject, {});

  const saved: Saved = {
    ...raw,
    version: 1,
    settings: { ...settingsIn, sessionSeconds: 300, dayStartsAtHour: 4, fastMs },
    palace: {
      ...palaceIn,
      rooms: check('palace.rooms', palaceIn.rooms, isRooms, []),
      stations: check('palace.stations', palaceIn.stations, isStations, []),
    },
    images: check('images', raw.images, isStringRecord, {}),
    items: record('items', raw.items, isItem),
    album: record('album', raw.album, isAlbumEntry),
    streak: check('streak', raw.streak, isStreak, fallback.streak),
    xp: check('xp', raw.xp, (v) => isNumber(v) && v >= 0, 0),
    sessions: list('sessions', raw.sessions, isSession),
  };
  return { saved, problems };
}

type Storage = { getItem(key: string): string | null; setItem(key: string, value: string): void };

/** Indlæser tilstanden. Data, der ikke kan læses helt, kopieres til BACKUP_KEY, før noget overskrives. */
export function loadSaved(storage: Storage): Saved {
  const text = storage.getItem(STORAGE_KEY);
  if (text === null) return defaultSaved();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    storage.setItem(BACKUP_KEY, text);
    return defaultSaved();
  }
  const { saved, problems } = readSaved(parsed);
  if (problems.length > 0) {
    console.warn('Gemte data var delvist ugyldige:', problems);
    storage.setItem(BACKUP_KEY, text);
  }
  return saved;
}

export function saveSaved(storage: Storage, saved: Saved): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(saved));
    return true;
  } catch {
    return false;
  }
}

export type ImportResult = { ok: true; saved: Saved } | { ok: false; error: string };

/** Validerer en eksporteret fil. Intet overskrives her; brugeren ser først et resumé. */
export function parseImport(text: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Filen er ikke gyldig JSON.' };
  }
  if (!isObject(parsed) || !isNumber(parsed.version)) {
    return { ok: false, error: 'Filen indeholder ikke data fra Fordelingstræneren.' };
  }
  if (parsed.version > SCHEMA_VERSION) {
    return { ok: false, error: 'Filen er fra en nyere version af appen.' };
  }
  const { saved, problems } = readSaved(parsed);
  if (problems.length > 0) {
    const shown = problems.slice(0, 3).join('; ');
    return { ok: false, error: `Filen er ugyldig: ${shown}${problems.length > 3 ? ' …' : ''}` };
  }
  return { ok: true, saved };
}

export interface Summary {
  xp: number;
  streak: number;
  best: number;
  items: number;
  sessions: number;
  lastDay: string;
}

export function summarize(saved: Saved): Summary {
  return {
    xp: saved.xp,
    streak: saved.streak.current,
    best: saved.streak.best,
    items: Object.keys(saved.items).length,
    sessions: saved.sessions.length,
    lastDay: saved.streak.lastDay,
  };
}

export function exportFileName(today: string): string {
  return `fordelingstraener-${today}.json`;
}
