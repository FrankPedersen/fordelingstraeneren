import type { Item } from '../engine/leitner';
import { emptyStreak, type Streak } from '../engine/streak';
import type { LineStep } from './solver/lines';

/**
 * UDKAST til godkendelse (SPEC-farvebehandling.md, Data og lagring): farvebehandlingens tilstand under sin egen nøgle.
 * `fordelingstraener:v1` læses og skrives ikke. Typen bruges først, når den er godkendt.
 */
export const FB_STORAGE_KEY = 'farvebehandling:v1';

/** Her lægges en kopi af gemte data, der ikke kunne læses, så intet går tabt. */
export const FB_BACKUP_KEY = `${FB_STORAGE_KEY}:kopi`;

export const FB_SCHEMA_VERSION = 1;

/** Opgavetyperne 1–8 fra specen. */
export type TaskType = 'vælg-linjen' | 'chancen' | 'linje-mod-linje' | 'nyt-mål' | 'hvad-nu' | 'find-hullet' | 'spil-selv' | 'optælling';

export interface FbSessionRecord {
  day: string;
  ms: number;
  /** Rigtige svar; et halvt rigtigt svar (rigtig linje, forkert interval) tæller 0,5. */
  correct: number;
  total: number;
  xp: number;
}

/** Et svar i Selvvalgt: logges, men ændrer ikke dagsplanen. */
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
