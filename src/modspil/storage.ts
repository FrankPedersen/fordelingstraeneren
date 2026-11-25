import { daysBetween } from '../engine/dates';
import type { Item } from '../engine/leitner';
import { emptyStreak, type Streak } from '../engine/streak';
import { OVELSER, type Niveau, type Ovelse } from './model/generator';
import { KATEGORI_DATA, profil, profilId, type KategoriId, type ProfilId, type Valg } from './model/metoder';

/**
 * Modspils tilstand under sin egen nøgle (SPEC-modspil.md, Afgrænsning (trin 2)): profil og metoder, niveau,
 * Leitner-bunke, streak og XP, med eksport og import som Pointregnskab. Andre nøgler læses og skrives ikke, og sproget
 * gemmes ikke her; det læses med `getLang()`.
 */
export const MS_STORAGE_KEY = 'modspil:v1';

/** Her lægges en kopi af gemte data, der ikke kunne læses, så intet går tabt. */
export const MS_BACKUP_KEY = `${MS_STORAGE_KEY}:kopi`;

export const MS_SCHEMA_VERSION = 1;

export interface MsSessionRecord {
  day: string;
  ms: number;
  correct: number;
  total: number;
  xp: number;
  /** Niveauet ved sessionens slutning. */
  level: Niveau;
}

/** Et svar i sessionen, til statistikken som i Pointregnskab. */
export interface MsAnswerEntry {
  day: string;
  ovelse: Ovelse;
  level: Niveau;
  /** 1 = rigtigt, 0 = forkert. */
  score: number;
  ms: number;
}

/** Svarloggen gemmer de seneste så mange svar. */
export const ANSWER_LOG_SIZE = 2000;

export interface MsSaved {
  version: 1;
  settings: { dayStartsAtHour: 4 };
  /** Profilen, metoderne svarer til, eller "egen" (regnes altid fra `metoder`, når data læses). */
  profil: ProfilId | 'egen';
  /** Én metode pr. kategori (metodernes id fra content/metoder.json). */
  metoder: Valg;
  /** Det aktuelle niveau, 1–5. */
  level: Niveau;
  /** Scorerne i niveaufasen siden seneste niveauskift, højst de seneste 20. */
  levelLog: number[];
  /** Leitner-emner: ét pr. øvelse ("ovelse:regel11"). */
  items: Record<string, Item>;
  xp: number;
  streak: Streak;
  sessions: MsSessionRecord[];
  /** Svarloggen: de seneste 2000 svar. Valgfrit felt. */
  answers?: MsAnswerEntry[];
  /** Dagen for den seneste eksport; til påmindelsen om at gemme en kopi. Valgfrit felt. */
  lastExport?: string;
  /**
   * Øvelse 8's Leitner-post, "Find udspillet" (SPEC-modspil-v2.md, trin 3). Valgfrit felt: det står her og ikke i
   * `items`, fordi `items` kun godtager v1's syv øvelser. Læses og skrives med `udspilPost` og `medUdspilPost` i
   * `training/findUdspil.ts`.
   */
  findUdspil?: Item;
}

/** Standardprofilen er valgt for nye brugere (SPEC-modspil.md, Metoderne og profilerne). */
export function defaultMsSaved(): MsSaved {
  return {
    version: 1,
    settings: { dayStartsAtHour: 4 },
    profil: 'standard',
    metoder: { ...profil('standard').valg },
    level: 1,
    levelLog: [],
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
const isLevel = (v: unknown): v is Niveau => [1, 2, 3, 4, 5].includes(v as number);
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

const isAnswer = (v: unknown): v is MsAnswerEntry =>
  isObject(v) && isDay(v.day) && OVELSER.includes(v.ovelse as Ovelse) && isLevel(v.level) && isScore(v.score) && isCount(v.ms);

const isSession = (v: unknown): v is MsSessionRecord =>
  isObject(v) && isDay(v.day) && isCount(v.ms) && isCount(v.correct) && isCount(v.total) && isNumber(v.xp) && isLevel(v.level);

/** Nøglen til en øvelses Leitner-emne. */
const ITEM_KEY = /^ovelse:(.+)$/;
const isItemKey = (key: string) => OVELSER.includes((key.match(ITEM_KEY)?.[1] ?? '') as Ovelse);

// Ved en ny skemaversion: tilføj et trin, der løfter data fra version n til n + 1 og bevarer ukendte felter.
const MIGRATIONS: Record<number, (data: Raw) => Raw> = {};

function migrate(data: Raw): Raw {
  let current = data;
  while (isNumber(current.version) && current.version < MS_SCHEMA_VERSION) {
    const step = MIGRATIONS[current.version];
    if (!step) break;
    current = step(current);
  }
  return current;
}

/** Læser gemte data. Ugyldige dele erstattes af standardværdier og noteres i `problems`; ukendte felter bevares. */
export function readMsSaved(input: unknown): { saved: MsSaved; problems: string[] } {
  const problems: string[] = [];
  const fallback = defaultMsSaved();
  if (!isObject(input)) return { saved: fallback, problems: ['data mangler'] };
  const raw = migrate(input);

  function check<T>(name: string, value: unknown, valid: (v: unknown) => boolean, def: T): T {
    if (valid(value)) return value as T;
    problems.push(value === undefined ? `${name} mangler` : `${name} er ugyldig`);
    return def;
  }
  function list<T>(name: string, value: unknown, valid: (v: unknown) => boolean): T[] {
    const entries = check<unknown[]>(name, value, Array.isArray, []);
    entries.forEach((entry, i) => valid(entry) || problems.push(`${name}[${i}] er ugyldig`));
    return entries.filter(valid) as T[];
  }

  if (raw.version !== MS_SCHEMA_VERSION) problems.push('version er ugyldig');
  const settingsIn = check<Raw>('settings', raw.settings, isObject, {});

  // Metoderne: én gyldig metode pr. kategori; en ugyldig erstattes af Standards.
  const metoderIn = check<Raw>('metoder', raw.metoder, isObject, {});
  const metoder = {} as Record<KategoriId, string>;
  for (const k of KATEGORI_DATA) {
    const id = metoderIn[k.id];
    if (isString(id) && k.metoder.some((m) => m.id === id)) metoder[k.id] = id;
    else {
      if (isObject(raw.metoder)) problems.push(`metoder["${k.id}"] er ugyldig`);
      metoder[k.id] = fallback.metoder[k.id];
    }
  }

  const itemsIn = check<Raw>('items', raw.items, isObject, {});
  const items: Record<string, Item> = {};
  for (const [key, entry] of Object.entries(itemsIn)) {
    if (isItemKey(key) && isItem(entry)) items[key] = entry;
    else problems.push(`items["${key}"] er ugyldig`);
  }

  // Valgfrie felter: de kontrolleres kun, når de findes.
  const { answers: answersIn, lastExport: lastExportIn, findUdspil: findUdspilIn, ...rest } = raw;
  const answers = answersIn === undefined ? undefined : list<MsAnswerEntry>('answers', answersIn, isAnswer);
  const lastExport = lastExportIn === undefined ? undefined : check<string | undefined>('lastExport', lastExportIn, isDay, undefined);
  // Øvelse 8's post (Modspil v2): en ugyldig post læses som manglende og noteres.
  const findUdspil = findUdspilIn === undefined ? undefined : check<Item | undefined>('findUdspil', findUdspilIn, isItem, undefined);
  const saved: MsSaved = {
    ...rest,
    version: 1,
    settings: { ...settingsIn, dayStartsAtHour: 4 },
    profil: profilId(metoder),
    metoder,
    level: check('level', raw.level, isLevel, fallback.level),
    levelLog: check('levelLog', raw.levelLog, isScores, []),
    items,
    xp: check('xp', raw.xp, (v) => isNumber(v) && v >= 0, 0),
    streak: check('streak', raw.streak, isStreak, fallback.streak),
    sessions: list('sessions', raw.sessions, isSession),
    ...(answers ? { answers } : {}),
    ...(lastExport ? { lastExport } : {}),
    ...(findUdspil ? { findUdspil } : {}),
  };
  return { saved, problems };
}

type Storage = { getItem(key: string): string | null; setItem(key: string, value: string): void };

/** Indlæser tilstanden. Data, der ikke kan læses helt, kopieres til MS_BACKUP_KEY, før noget overskrives. */
export function loadMsSaved(storage: Storage): MsSaved {
  const text = storage.getItem(MS_STORAGE_KEY);
  if (text === null) return defaultMsSaved();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    storage.setItem(MS_BACKUP_KEY, text);
    return defaultMsSaved();
  }
  const { saved, problems } = readMsSaved(parsed);
  if (problems.length > 0) {
    console.warn('Modspils gemte data var delvist ugyldige:', problems);
    storage.setItem(MS_BACKUP_KEY, text);
  }
  return saved;
}

export function saveMsSaved(storage: Storage, saved: MsSaved): boolean {
  try {
    storage.setItem(MS_STORAGE_KEY, JSON.stringify(saved));
    return true;
  } catch {
    return false;
  }
}

/** Fejl ved import; teksterne ligger i brugerfladens tekstfil. */
export type MsImportError = 'json' | 'not-modspil' | 'newer' | 'invalid';

export type MsImportResult = { ok: true; saved: MsSaved } | { ok: false; error: MsImportError; problems?: string[] };

/** Validerer en eksporteret fil. Intet overskrives her; brugeren ser først et resumé. */
export function parseMsImport(text: string): MsImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'json' };
  }
  if (!isObject(parsed) || !isNumber(parsed.version) || !isObject(parsed.metoder) || !isLevel(parsed.level) || !isObject(parsed.items)) {
    return { ok: false, error: 'not-modspil' };
  }
  if (parsed.version > MS_SCHEMA_VERSION) return { ok: false, error: 'newer' };
  const { saved, problems } = readMsSaved(parsed);
  if (problems.length > 0) return { ok: false, error: 'invalid', problems };
  return { ok: true, saved };
}

export function msExportFileName(today: string): string {
  return `modspil-${today}.json`;
}

/** Påmindelsen om eksport kommer, når den seneste eksport (eller den første session) er så mange dage gammel. */
export const EXPORT_REMINDER_DAYS = 30;

/** Skal brugeren mindes om at gemme en kopi? Kun når der er en session at miste. */
export function msExportDue(saved: MsSaved, today: string): boolean {
  const first = saved.sessions.map((s) => s.day).sort()[0];
  if (!first) return false;
  return daysBetween(saved.lastExport ?? first, today) >= EXPORT_REMINDER_DAYS;
}
