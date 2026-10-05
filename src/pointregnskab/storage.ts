import type { Item } from '../engine/leitner';
import { emptyStreak, type Streak } from '../engine/streak';
import { EXERCISES, type Exercise, type Level } from './model/generator';
import { RUNNING_MS } from './training/scoring';

/**
 * Pointregnskabets tilstand under sin egen nøgle (SPEC-pointregnskab.md, Data). Andre nøgler læses og skrives ikke,
 * og sproget gemmes ikke her; det læses med `getLang()`.
 *
 * TYPEN AFVENTER FRANKS GODKENDELSE, før brugerfladen bygges.
 */
export const PR_STORAGE_KEY = 'pointregnskab:v1';

/** Her lægges en kopi af gemte data, der ikke kunne læses, så intet går tabt. */
export const PR_BACKUP_KEY = `${PR_STORAGE_KEY}:kopi`;

export const PR_SCHEMA_VERSION = 1;

export interface PrSessionRecord {
  day: string;
  ms: number;
  /** Summen af scorerne; et halvt rigtigt svar i løbende tælling tæller 0,5. */
  correct: number;
  total: number;
  xp: number;
  /** Niveauet ved sessionens slutning. */
  level: Level;
  /** Ugens boss (hver 7. session): Fuldt regnskab med dobbelt XP. */
  boss: boolean;
}

export interface PrSaved {
  version: 1;
  settings: {
    sessionSeconds: 300;
    dayStartsAtHour: 4;
  };
  /** Det aktuelle niveau, 1–5. */
  level: Level;
  /** Scorerne (1, 0,5 eller 0) i niveaufasen siden seneste niveauskift, højst de seneste 20. */
  levelLog: number[];
  /** Glidende træfsikkerhed pr. øvelse: de seneste 20 scorer. */
  accuracy: Partial<Record<Exercise, number[]>>;
  /** Visningstiden pr. kort i løbende tælling: 800–4.000 ms, start 2.000. */
  runningMs: number;
  /** Leitner-emner for blokke ("blok:EK") og intervalkort ("interval:opening-1NT"). */
  items: Record<string, Item>;
  xp: number;
  streak: Streak;
  sessions: PrSessionRecord[];
  /** Dagen for den seneste eksport; til påmindelsen om at gemme en kopi. Valgfrit felt. */
  lastExport?: string;
}

export function defaultPrSaved(): PrSaved {
  return {
    version: 1,
    settings: { sessionSeconds: 300, dayStartsAtHour: 4 },
    level: 1,
    levelLog: [],
    accuracy: {},
    runningMs: RUNNING_MS.start,
    items: {},
    xp: 0,
    streak: emptyStreak(),
    sessions: [],
  };
}

type Raw = Record<string, unknown>;

const isObject = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isCount = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0;
const isString = (v: unknown): v is string => typeof v === 'string';
const isDay = (v: unknown): v is string => isString(v) && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isScore = (v: unknown) => v === 0 || v === 0.5 || v === 1;
const isLevel = (v: unknown): v is Level => [1, 2, 3, 4, 5].includes(v as number);
const isScores = (v: unknown): v is number[] => Array.isArray(v) && v.length <= 20 && v.every(isScore);

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

const isSession = (v: unknown): v is PrSessionRecord =>
  isObject(v) &&
  isDay(v.day) &&
  isCount(v.ms) &&
  isNumber(v.correct) &&
  v.correct >= 0 &&
  isCount(v.total) &&
  isNumber(v.xp) &&
  isLevel(v.level) &&
  typeof v.boss === 'boolean';

// Ved en ny skemaversion: tilføj et trin, der løfter data fra version n til n + 1 og bevarer ukendte felter.
const MIGRATIONS: Record<number, (data: Raw) => Raw> = {};

function migrate(data: Raw): Raw {
  let current = data;
  while (isNumber(current.version) && current.version < PR_SCHEMA_VERSION) {
    const step = MIGRATIONS[current.version];
    if (!step) break;
    current = step(current);
  }
  return current;
}

/** Læser gemte data. Ugyldige dele erstattes af standardværdier og noteres i `problems`; ukendte felter bevares. */
export function readPrSaved(input: unknown): { saved: PrSaved; problems: string[] } {
  const problems: string[] = [];
  const fallback = defaultPrSaved();
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

  if (raw.version !== PR_SCHEMA_VERSION) problems.push('version er ugyldig');
  const settingsIn = check<Raw>('settings', raw.settings, isObject, {});
  const accuracyIn = record<number[]>('accuracy', raw.accuracy, isScores);
  const accuracy: Partial<Record<Exercise, number[]>> = {};
  for (const [key, log] of Object.entries(accuracyIn)) {
    if (EXERCISES.includes(key as Exercise)) accuracy[key as Exercise] = log;
    else problems.push(`accuracy["${key}"] er ugyldig`);
  }
  // Valgfrit felt: det kontrolleres kun, når det findes.
  const { lastExport: lastExportIn, ...rest } = raw;
  const lastExport = lastExportIn === undefined ? undefined : check<string | undefined>('lastExport', lastExportIn, isDay, undefined);
  const sessionsIn = check<unknown[]>('sessions', raw.sessions, Array.isArray, []);
  sessionsIn.forEach((s, i) => isSession(s) || problems.push(`sessions[${i}] er ugyldig`));
  const saved: PrSaved = {
    ...rest,
    version: 1,
    settings: { ...settingsIn, sessionSeconds: 300, dayStartsAtHour: 4 },
    level: check('level', raw.level, isLevel, fallback.level),
    levelLog: check('levelLog', raw.levelLog, isScores, []),
    accuracy,
    runningMs: check(
      'runningMs',
      raw.runningMs,
      (v) => isNumber(v) && v >= RUNNING_MS.min && v <= RUNNING_MS.max,
      fallback.runningMs,
    ),
    items: record('items', raw.items, isItem),
    xp: check('xp', raw.xp, (v) => isNumber(v) && v >= 0, 0),
    streak: check('streak', raw.streak, isStreak, fallback.streak),
    sessions: sessionsIn.filter(isSession),
    ...(lastExport ? { lastExport } : {}),
  };
  return { saved, problems };
}

type Storage = { getItem(key: string): string | null; setItem(key: string, value: string): void };

/** Indlæser tilstanden. Data, der ikke kan læses helt, kopieres til PR_BACKUP_KEY, før noget overskrives. */
export function loadPrSaved(storage: Storage): PrSaved {
  const text = storage.getItem(PR_STORAGE_KEY);
  if (text === null) return defaultPrSaved();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    storage.setItem(PR_BACKUP_KEY, text);
    return defaultPrSaved();
  }
  const { saved, problems } = readPrSaved(parsed);
  if (problems.length > 0) {
    console.warn('Pointregnskabets gemte data var delvist ugyldige:', problems);
    storage.setItem(PR_BACKUP_KEY, text);
  }
  return saved;
}

export function savePrSaved(storage: Storage, saved: PrSaved): boolean {
  try {
    storage.setItem(PR_STORAGE_KEY, JSON.stringify(saved));
    return true;
  } catch {
    return false;
  }
}

/** Fejl ved import; teksterne ligger i brugerfladens tekstfil. */
export type PrImportError = 'json' | 'not-pointregnskab' | 'newer' | 'invalid';

export type PrImportResult = { ok: true; saved: PrSaved } | { ok: false; error: PrImportError; problems?: string[] };

/** Validerer en eksporteret fil. Intet overskrives her; brugeren ser først et resumé. */
export function parsePrImport(text: string): PrImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'json' };
  }
  if (!isObject(parsed) || !isNumber(parsed.version) || !isLevel(parsed.level) || !isObject(parsed.items)) {
    return { ok: false, error: 'not-pointregnskab' };
  }
  if (parsed.version > PR_SCHEMA_VERSION) return { ok: false, error: 'newer' };
  const { saved, problems } = readPrSaved(parsed);
  if (problems.length > 0) return { ok: false, error: 'invalid', problems };
  return { ok: true, saved };
}

export function prExportFileName(today: string): string {
  return `pointregnskab-${today}.json`;
}
