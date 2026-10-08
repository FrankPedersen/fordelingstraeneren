import { daysBetween } from '../engine/dates';
import type { Item } from '../engine/leitner';
import { emptyStreak, type Streak } from '../engine/streak';
import { EXERCISES, type Exercise, type Level } from './model/generator';

/**
 * Håndevalueringens tilstand under sin egen nøgle (SPEC-haandevaluering.md, Session, scoring og data). Andre nøgler
 * læses og skrives ikke, og sproget gemmes ikke her; det læses med `getLang()`.
 *
 * TYPEN AFVENTER FRANKS GODKENDELSE, før brugerfladen bygges.
 */
export const HE_STORAGE_KEY = 'haandevaluering:v1';

/** Her lægges en kopi af gemte data, der ikke kunne læses, så intet går tabt. */
export const HE_BACKUP_KEY = `${HE_STORAGE_KEY}:kopi`;

export const HE_SCHEMA_VERSION = 1;

export interface HeSessionRecord {
  day: string;
  ms: number;
  /** Antal rigtige svar i sessionen (opvarmning, lynrunde og niveauopgaver). */
  correct: number;
  total: number;
  xp: number;
  /** Niveauet ved sessionens slutning. */
  level: Level;
}

/** Et svar i lynrunden eller niveaufasen (ikke opvarmningen), til statistikken som i farvebehandling. */
export interface HeAnswerEntry {
  day: string;
  exercise: Exercise;
  level: Level;
  /** 1 = rigtigt, 0 = forkert. */
  score: number;
  ms: number;
  /** Opgavens seed, så den kan genskabes (SPEC, Generator 4). */
  seed: number;
  phase: 'lightning' | 'level';
}

/** Svarloggen gemmer de seneste så mange svar. */
export const ANSWER_LOG_SIZE = 2000;

export interface HeSaved {
  version: 1;
  settings: {
    sessionSeconds: 300;
    dayStartsAtHour: 4;
  };
  /** Det aktuelle niveau, 1–5. */
  level: Level;
  /** Scorerne (1 eller 0) i niveaufasen siden seneste niveauskift, højst de seneste 20. */
  levelLog: number[];
  /** Glidende træfsikkerhed pr. øvelse: de seneste 20 scorer. */
  accuracy: Partial<Record<Exercise, number[]>>;
  /**
   * Leitner-bunken: ankrene ("anker:game"), korthed 5-3-1 ("korthed:0"), genvejens led ("genvej:queen"), kortfarvepoint
   * pr. mønster ("moenster:5-4-3-1"), makkers krav ("makker:16") og stikformlen ("stik").
   */
  items: Record<string, Item>;
  xp: number;
  streak: Streak;
  sessions: HeSessionRecord[];
  /** Svarloggen: de seneste 2000 svar, til statistikken. Valgfrit felt. */
  answers?: HeAnswerEntry[];
  /** Dagen for den seneste eksport; til påmindelsen om at gemme en kopi. Valgfrit felt. */
  lastExport?: string;
}

export function defaultHeSaved(): HeSaved {
  return {
    version: 1,
    settings: { sessionSeconds: 300, dayStartsAtHour: 4 },
    level: 1,
    levelLog: [],
    accuracy: {},
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
const isScore = (v: unknown) => v === 0 || v === 1;
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

const isAnswer = (v: unknown): v is HeAnswerEntry =>
  isObject(v) &&
  isDay(v.day) &&
  EXERCISES.includes(v.exercise as Exercise) &&
  isLevel(v.level) &&
  isScore(v.score) &&
  isCount(v.ms) &&
  Number.isInteger(v.seed) &&
  (v.seed as number) >= 0 &&
  (v.seed as number) < 2 ** 32 &&
  (v.phase === 'lightning' || v.phase === 'level');

const isSession = (v: unknown): v is HeSessionRecord =>
  isObject(v) &&
  isDay(v.day) &&
  isCount(v.ms) &&
  isCount(v.correct) &&
  isCount(v.total) &&
  isNumber(v.xp) &&
  isLevel(v.level);

// Ved en ny skemaversion: tilføj et trin, der løfter data fra version n til n + 1 og bevarer ukendte felter.
const MIGRATIONS: Record<number, (data: Raw) => Raw> = {};

function migrate(data: Raw): Raw {
  let current = data;
  while (isNumber(current.version) && current.version < HE_SCHEMA_VERSION) {
    const step = MIGRATIONS[current.version];
    if (!step) break;
    current = step(current);
  }
  return current;
}

/** Læser gemte data. Ugyldige dele erstattes af standardværdier og noteres i `problems`; ukendte felter bevares. */
export function readHeSaved(input: unknown): { saved: HeSaved; problems: string[] } {
  const problems: string[] = [];
  const fallback = defaultHeSaved();
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

  if (raw.version !== HE_SCHEMA_VERSION) problems.push('version er ugyldig');
  const settingsIn = check<Raw>('settings', raw.settings, isObject, {});
  const accuracyIn = record<number[]>('accuracy', raw.accuracy, isScores);
  const accuracy: Partial<Record<Exercise, number[]>> = {};
  for (const [key, log] of Object.entries(accuracyIn)) {
    if (EXERCISES.includes(key as Exercise)) accuracy[key as Exercise] = log;
    else problems.push(`accuracy["${key}"] er ugyldig`);
  }
  // Valgfrie felter: de kontrolleres kun, når de findes.
  const { answers: answersIn, lastExport: lastExportIn, ...rest } = raw;
  const answers = answersIn === undefined ? undefined : list<HeAnswerEntry>('answers', answersIn, isAnswer);
  const lastExport = lastExportIn === undefined ? undefined : check<string | undefined>('lastExport', lastExportIn, isDay, undefined);
  const saved: HeSaved = {
    ...rest,
    version: 1,
    settings: { ...settingsIn, sessionSeconds: 300, dayStartsAtHour: 4 },
    level: check('level', raw.level, isLevel, fallback.level),
    levelLog: check('levelLog', raw.levelLog, isScores, []),
    accuracy,
    items: record('items', raw.items, isItem),
    xp: check('xp', raw.xp, (v) => isNumber(v) && v >= 0, 0),
    streak: check('streak', raw.streak, isStreak, fallback.streak),
    sessions: list('sessions', raw.sessions, isSession),
    ...(answers ? { answers } : {}),
    ...(lastExport ? { lastExport } : {}),
  };
  return { saved, problems };
}

type Storage = { getItem(key: string): string | null; setItem(key: string, value: string): void };

/** Indlæser tilstanden. Data, der ikke kan læses helt, kopieres til HE_BACKUP_KEY, før noget overskrives. */
export function loadHeSaved(storage: Storage): HeSaved {
  const text = storage.getItem(HE_STORAGE_KEY);
  if (text === null) return defaultHeSaved();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    storage.setItem(HE_BACKUP_KEY, text);
    return defaultHeSaved();
  }
  const { saved, problems } = readHeSaved(parsed);
  if (problems.length > 0) {
    console.warn('Håndevalueringens gemte data var delvist ugyldige:', problems);
    storage.setItem(HE_BACKUP_KEY, text);
  }
  return saved;
}

export function saveHeSaved(storage: Storage, saved: HeSaved): boolean {
  try {
    storage.setItem(HE_STORAGE_KEY, JSON.stringify(saved));
    return true;
  } catch {
    return false;
  }
}

/** Fejl ved import; teksterne ligger i brugerfladens tekstfil. */
export type HeImportError = 'json' | 'not-haandevaluering' | 'newer' | 'invalid';

export type HeImportResult = { ok: true; saved: HeSaved } | { ok: false; error: HeImportError; problems?: string[] };

/** Validerer en eksporteret fil. Intet overskrives her; brugeren ser først et resumé. */
export function parseHeImport(text: string): HeImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'json' };
  }
  if (!isObject(parsed) || !isNumber(parsed.version) || !isLevel(parsed.level) || !isObject(parsed.items)) {
    return { ok: false, error: 'not-haandevaluering' };
  }
  if (parsed.version > HE_SCHEMA_VERSION) return { ok: false, error: 'newer' };
  const { saved, problems } = readHeSaved(parsed);
  if (problems.length > 0) return { ok: false, error: 'invalid', problems };
  return { ok: true, saved };
}

export function heExportFileName(today: string): string {
  return `haandevaluering-${today}.json`;
}

/** Påmindelsen om eksport kommer, når den seneste eksport (eller den første session) er så mange dage gammel. */
export const EXPORT_REMINDER_DAYS = 30;

/** Skal brugeren mindes om at gemme en kopi? Kun når der er en session at miste. */
export function heExportDue(saved: HeSaved, today: string): boolean {
  const first = saved.sessions.map((s) => s.day).sort()[0];
  if (!first) return false;
  return daysBetween(saved.lastExport ?? first, today) >= EXPORT_REMINDER_DAYS;
}
