import { daysBetween } from '../engine/dates';
import type { Item } from '../engine/leitner';
import { emptyStreak, type Streak } from '../engine/streak';
import type { LineStep } from './solver/lines';

/**
 * Farvebehandlingens tilstand under sin egen nøgle (SPEC-farvebehandling.md, Data og lagring); typen er godkendt.
 * `fordelingstraener:v1` læses og skrives ikke.
 */
export const FB_STORAGE_KEY = 'farvebehandling:v1';

/** Her lægges en kopi af gemte data, der ikke kunne læses, så intet går tabt. */
export const FB_BACKUP_KEY = `${FB_STORAGE_KEY}:kopi`;

export const FB_SCHEMA_VERSION = 1;

/** Opgavetyperne 1–9 fra specen. */
export type TaskType =
  | 'vælg-linjen'
  | 'chancen'
  | 'linje-mod-linje'
  | 'nyt-mål'
  | 'hvad-nu'
  | 'find-hullet'
  | 'spil-selv'
  | 'optælling'
  | 'hold-eller-par';

export interface FbSessionRecord {
  day: string;
  ms: number;
  /** Rigtige svar; et halvt rigtigt svar (rigtig linje, forkert interval) tæller 0,5. */
  correct: number;
  total: number;
  xp: number;
}

/** Et svar i Selvvalgt (logges, men ændrer ikke dagsplanen) eller i Træning (til statistikken). */
export interface PracticeEntry {
  day: string;
  /** Emne: `${kombination}:${mål}`. */
  item: string;
  task: TaskType;
  /** 1 = rigtigt, 0,5 = halvt, 0 = forkert. */
  score: number;
  ms: number;
}

export interface OwnLine {
  /** Kombinationens id i banken, fx "J32-AK54". */
  combination: string;
  id: string;
  text: string;
  steps: LineStep[];
}

export interface FbSaved {
  version: 1;
  settings: {
    sessionSeconds: 300;
    dayStartsAtHour: 4;
    /** Hurtigt svar: hele opgaven på under så mange ms (specen: 20 s). */
    fastMs: number;
    /** Højst så mange nye kombinationer pr. dag (specen: 2). */
    newPerDay: number;
  };
  /** Ét emne er en kombination × et mål. Nøgle: `${kombination}:${mål}`, fx "J32-AK54:3". */
  items: Record<string, Item>;
  /** Dagen, en kombination blev introduceret (til "højst 2 nye pr. dag" og oplåsning i hyppighedsorden). */
  introduced: Record<string, string>;
  palace: {
    /** Teknik-id → eget billede og egen huskeregel; ellers standard fra techniques.json. */
    techniques: Record<string, { image?: string; rule?: string }>;
    /** Kombination → station i teknikkens rum: rækkefølge og egen scene. */
    stations: Record<string, { technique: string; order: number; scene?: string }>;
  };
  ownLines: OwnLine[];
  practice: PracticeEntry[];
  /** Svar i Træning (repetition og niveau, ikke lynrunden), de seneste 2000; til statistikken. Valgfrit felt. */
  training?: PracticeEntry[];
  /** Dagen for den seneste eksport; til påmindelsen om at gemme en kopi. Valgfrit felt. */
  lastExport?: string;
  streak: Streak;
  xp: number;
  sessions: FbSessionRecord[];
}

export function defaultFbSaved(): FbSaved {
  return {
    version: 1,
    settings: { sessionSeconds: 300, dayStartsAtHour: 4, fastMs: 20_000, newPerDay: 2 },
    items: {},
    introduced: {},
    palace: { techniques: {}, stations: {} },
    ownLines: [],
    practice: [],
    streak: emptyStreak(),
    xp: 0,
    sessions: [],
  };
}

export const TASK_TYPES: readonly TaskType[] = [
  'vælg-linjen',
  'chancen',
  'linje-mod-linje',
  'nyt-mål',
  'hvad-nu',
  'find-hullet',
  'spil-selv',
  'optælling',
  'hold-eller-par',
];

type Raw = Record<string, unknown>;

const isObject = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isCount = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0;
const isString = (v: unknown): v is string => typeof v === 'string';
const isDay = (v: unknown): v is string => isString(v) && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isScore = (v: unknown) => v === 0 || v === 0.5 || v === 1;

const isLogEntry = (v: unknown) =>
  isObject(v) && isNumber(v.t) && typeof v.ok === 'boolean' && isNumber(v.ms) && (v.sure === undefined || typeof v.sure === 'boolean');

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

const isSession = (v: unknown): v is FbSessionRecord =>
  isObject(v) && isDay(v.day) && isCount(v.ms) && isNumber(v.correct) && v.correct >= 0 && isCount(v.total) && isNumber(v.xp);

const isPractice = (v: unknown): v is PracticeEntry =>
  isObject(v) && isDay(v.day) && isString(v.item) && TASK_TYPES.includes(v.task as TaskType) && isScore(v.score) && isCount(v.ms);

const isStep = (v: unknown) => isObject(v) && (v.leadFrom === 'N' || v.leadFrom === 'S') && isString(v.card);

const isOwnLine = (v: unknown): v is OwnLine =>
  isObject(v) && isString(v.combination) && isString(v.id) && isString(v.text) && Array.isArray(v.steps) && v.steps.every(isStep);

const isTechniqueOverride = (v: unknown) =>
  isObject(v) && (v.image === undefined || isString(v.image)) && (v.rule === undefined || isString(v.rule));

const isStation = (v: unknown) =>
  isObject(v) && isString(v.technique) && isCount(v.order) && (v.scene === undefined || isString(v.scene));

// Ved en ny skemaversion: tilføj et trin, der løfter data fra version n til n + 1 og bevarer ukendte felter.
const MIGRATIONS: Record<number, (data: Raw) => Raw> = {};

function migrate(data: Raw): Raw {
  let current = data;
  while (isNumber(current.version) && current.version < FB_SCHEMA_VERSION) {
    const step = MIGRATIONS[current.version];
    if (!step) break;
    current = step(current);
  }
  return current;
}

/** Læser gemte data. Ugyldige dele erstattes af standardværdier og noteres i `problems`; ukendte felter bevares. */
export function readFbSaved(input: unknown): { saved: FbSaved; problems: string[] } {
  const problems: string[] = [];
  const fallback = defaultFbSaved();
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

  if (raw.version !== FB_SCHEMA_VERSION) problems.push('version er ugyldig');
  const settingsIn = check<Raw>('settings', raw.settings, isObject, {});
  const palaceIn = check<Raw>('palace', raw.palace, isObject, {});
  // Valgfrie felter: de kontrolleres kun, når de findes.
  const { training: trainingIn, lastExport: lastExportIn, ...rest } = raw;
  const training = trainingIn === undefined ? undefined : list<PracticeEntry>('training', trainingIn, isPractice);
  const lastExport = lastExportIn === undefined ? undefined : check<string | undefined>('lastExport', lastExportIn, isDay, undefined);
  const saved: FbSaved = {
    ...rest,
    version: 1,
    settings: {
      ...settingsIn,
      sessionSeconds: 300,
      dayStartsAtHour: 4,
      fastMs: check('settings.fastMs', settingsIn.fastMs, (v) => isNumber(v) && v > 0, fallback.settings.fastMs),
      newPerDay: check('settings.newPerDay', settingsIn.newPerDay, (v) => isCount(v) && v <= 10, fallback.settings.newPerDay),
    },
    items: record('items', raw.items, isItem),
    introduced: record('introduced', raw.introduced, isDay),
    palace: {
      ...palaceIn,
      techniques: record('palace.techniques', palaceIn.techniques, isTechniqueOverride),
      stations: record('palace.stations', palaceIn.stations, isStation),
    },
    ownLines: list('ownLines', raw.ownLines, isOwnLine),
    practice: list('practice', raw.practice, isPractice),
    ...(training ? { training } : {}),
    ...(lastExport ? { lastExport } : {}),
    streak: check('streak', raw.streak, isStreak, fallback.streak),
    xp: check('xp', raw.xp, (v) => isNumber(v) && v >= 0, 0),
    sessions: list('sessions', raw.sessions, isSession),
  };
  return { saved, problems };
}

type Storage = { getItem(key: string): string | null; setItem(key: string, value: string): void };

/** Indlæser tilstanden. Data, der ikke kan læses helt, kopieres til FB_BACKUP_KEY, før noget overskrives. */
export function loadFbSaved(storage: Storage): FbSaved {
  const text = storage.getItem(FB_STORAGE_KEY);
  if (text === null) return defaultFbSaved();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    storage.setItem(FB_BACKUP_KEY, text);
    return defaultFbSaved();
  }
  const { saved, problems } = readFbSaved(parsed);
  if (problems.length > 0) {
    console.warn('Farvebehandlingens gemte data var delvist ugyldige:', problems);
    storage.setItem(FB_BACKUP_KEY, text);
  }
  return saved;
}

export function saveFbSaved(storage: Storage, saved: FbSaved): boolean {
  try {
    storage.setItem(FB_STORAGE_KEY, JSON.stringify(saved));
    return true;
  } catch {
    return false;
  }
}

export type FbImportResult = { ok: true; saved: FbSaved } | { ok: false; error: string };

/** Validerer en eksporteret fil. Intet overskrives her; brugeren ser først et resumé. */
export function parseFbImport(text: string): FbImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Filen er ikke gyldig JSON.' };
  }
  if (!isObject(parsed) || !isNumber(parsed.version) || !isObject(parsed.palace) || !Array.isArray(parsed.ownLines)) {
    return { ok: false, error: 'Filen indeholder ikke data fra farvebehandling.' };
  }
  if (parsed.version > FB_SCHEMA_VERSION) return { ok: false, error: 'Filen er fra en nyere version af appen.' };
  const { saved, problems } = readFbSaved(parsed);
  if (problems.length > 0) {
    const shown = problems.slice(0, 3).join('; ');
    return { ok: false, error: `Filen er ugyldig: ${shown}${problems.length > 3 ? ' …' : ''}` };
  }
  return { ok: true, saved };
}

export interface FbSummary {
  xp: number;
  streak: number;
  best: number;
  items: number;
  sessions: number;
  lastDay: string;
}

export function fbSummary(saved: FbSaved): FbSummary {
  return {
    xp: saved.xp,
    streak: saved.streak.current,
    best: saved.streak.best,
    items: Object.keys(saved.items).length,
    sessions: saved.sessions.length,
    lastDay: saved.streak.lastDay,
  };
}

export function fbExportFileName(today: string): string {
  return `farvebehandling-${today}.json`;
}

// ---------- Fast lagring og påmindelse om eksport ----------

/** Påmindelsen om eksport kommer, når den seneste eksport (eller den første aktivitet) er så mange dage gammel. */
export const EXPORT_REMINDER_DAYS = 30;

/** Skal brugeren mindes om at gemme en kopi? Kun når der er noget at miste: en session eller et svar i Selvvalgt. */
export function exportDue(saved: FbSaved, today: string): boolean {
  const activity = [...saved.sessions.map((s) => s.day), ...saved.practice.map((p) => p.day)].sort();
  if (!activity.length) return false;
  return daysBetween(saved.lastExport ?? activity[0], today) >= EXPORT_REMINDER_DAYS;
}

/** Fast lagring: browseren rydder ikke dataene af sig selv. "ukendt", når browseren ikke kan oplyse det. */
export type Persistence = 'fast' | 'midlertidig' | 'ukendt';

interface StorageManagerLike {
  persisted?(): Promise<boolean>;
  persist?(): Promise<boolean>;
}

const storageManager = (): StorageManagerLike | undefined =>
  typeof navigator === 'undefined' ? undefined : (navigator as { storage?: StorageManagerLike }).storage;

export async function persistence(manager = storageManager()): Promise<Persistence> {
  try {
    if (!manager?.persisted) return 'ukendt';
    return (await manager.persisted()) ? 'fast' : 'midlertidig';
  } catch {
    return 'ukendt';
  }
}

/**
 * Beder browseren om fast lagring, så den ikke rydder data, fx når telefonen mangler plads. Det gælder hele appen,
 * også fordelingssporets data. Svaret er resultatet; en browser uden funktionen giver "ukendt".
 */
export async function requestPersistence(manager = storageManager()): Promise<Persistence> {
  try {
    if (!manager?.persist) return 'ukendt';
    if (manager.persisted && (await manager.persisted())) return 'fast';
    return (await manager.persist()) ? 'fast' : 'midlertidig';
  } catch {
    return 'ukendt';
  }
}
