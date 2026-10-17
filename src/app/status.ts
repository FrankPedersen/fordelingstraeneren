/**
 * Status fra sporene til forsiden (SPEC-forside-spor.md, "Status fra sporene"). Læser kun: hvert spors data læses med
 * sporets egen læsefunktion (`readPrSaved` osv., så migreringer håndteres som i sporet), men aldrig med `load…`, fordi
 * den skriver en kopi af ulæselige data. Forsiden ændrer derfor ingen nøgle i localStorage.
 */
import { dayOf } from '../engine/dates';
import { isDue, type Item } from '../engine/leitner';
import type { Saved } from '../engine/storage';
import { streakOn, type Streak } from '../engine/streak';
import type { Grade } from '../domain/patterns';
import { FB_STORAGE_KEY, readFbSaved } from '../farvebehandling/storage';
import { HE_STORAGE_KEY, readHeSaved } from '../haandevaluering/storage';
import { warmupQueue as heWarmup } from '../haandevaluering/training/deck';
import { PR_STORAGE_KEY, readPrSaved } from '../pointregnskab/storage';
import { warmupQueue as prWarmup } from '../pointregnskab/training/deck';
import { dueItemKeys, gradeProgress, newPatternsToday } from './progression';

type ReadOnlyStorage = { getItem(key: string): string | null };

/** Et spors status på forsiden. Uden data (eller med data, der ikke kan læses) er sporet "ikke startet". */
export interface TrackStatus {
  track: string;
  started: boolean;
  /** Streak i dag (`streakOn`). */
  streak: number;
  /** Niveauet; null, hvis sporet ikke har niveauer (Farvebehandling). */
  level: number | null;
  /** Mønstrenes grad (kun Fordeling), fx "ualmindelig". */
  grade: Grade | null;
  /** Dagens session er gennemført (`streak.lastDay === today`). */
  doneToday: boolean;
  /** Emner til repetition i dag. */
  due: number;
  /** Nye mønstre, der venter i dag (kun Fordeling). */
  fresh: number;
}

const notStarted = (track: string): TrackStatus => ({ track, started: false, streak: 0, level: null, grade: null, doneToday: false, due: 0, fresh: 0 });

interface TrackData {
  settings: { dayStartsAtHour: number };
  streak: Streak;
  sessions: unknown[];
  items: Record<string, Item>;
}

/** Læser et spors data uden at skrive noget. null, hvis der ingen data er, eller de ikke kan læses. */
function readTrack<T extends TrackData>(storage: ReadOnlyStorage, key: string, read: (input: unknown) => { saved: T }): T | null {
  try {
    const text = storage.getItem(key);
    if (text === null) return null;
    return read(JSON.parse(text)).saved;
  } catch {
    return null;
  }
}

/** Fælles for sporene: streak, dagens session og forfaldne emner ud fra sporets egen dag (dagen skifter kl. 04). */
function common(track: string, data: TrackData, now: number): TrackStatus {
  if (data.sessions.length === 0 && Object.keys(data.items).length === 0) return notStarted(track);
  const today = dayOf(now, data.settings.dayStartsAtHour);
  return {
    track,
    started: true,
    streak: streakOn(data.streak, today).current,
    level: null,
    grade: null,
    doneToday: data.streak.lastDay === today,
    due: Object.values(data.items).filter((item) => isDue(item, today)).length,
    fresh: 0,
  };
}

/** Pointregnskab og Håndevaluering: niveauet og de forfaldne kort i sporets bunke (opvarmningens kø uden de nye kort). */
function withDeck(
  status: TrackStatus,
  data: TrackData & { level: number },
  warmup: (items: Record<string, Item>, today: string) => string[],
  now: number,
): TrackStatus {
  if (!status.started) return status;
  const today = dayOf(now, data.settings.dayStartsAtHour);
  return { ...status, level: data.level, due: warmup(data.items, today).filter((key) => key in data.items).length };
}

/** Status for de fire spor. Fordelingssporets data er dem, appen allerede har indlæst. */
export function trackStatuses(saved: Saved, storage: ReadOnlyStorage, now: number): Record<string, TrackStatus> {
  const today = dayOf(now, saved.settings.dayStartsAtHour);
  const progress = gradeProgress(saved);
  const fordeling: TrackStatus =
    saved.sessions.length === 0 && Object.keys(saved.items).length === 0
      ? notStarted('fordeling')
      : {
          track: 'fordeling',
          started: true,
          streak: streakOn(saved.streak, today).current,
          level: progress.level,
          grade: progress.grade,
          doneToday: saved.streak.lastDay === today,
          due: dueItemKeys(saved, today).length,
          fresh: newPatternsToday(saved, today),
        };

  const pr = readTrack(storage, PR_STORAGE_KEY, readPrSaved);
  // Farvebehandling: forfaldne emner som i sporets `dueItems`, uden at hente opgavebanken.
  const fb = readTrack(storage, FB_STORAGE_KEY, readFbSaved);
  const he = readTrack(storage, HE_STORAGE_KEY, readHeSaved);
  return {
    fordeling,
    pointregnskab: pr ? withDeck(common('pointregnskab', pr, now), pr, prWarmup, now) : notStarted('pointregnskab'),
    farvebehandling: fb ? common('farvebehandling', fb, now) : notStarted('farvebehandling'),
    haandevaluering: he ? withDeck(common('haandevaluering', he, now), he, heWarmup, now) : notStarted('haandevaluering'),
  };
}

/** Antal spor, der er trænet i dag, og det næste: det første i forsidens rækkefølge, der ikke er trænet i dag. */
export function todayOverview(order: readonly string[], statuses: Record<string, TrackStatus>): { done: number; total: number; next: string | null } {
  return {
    done: order.filter((track) => statuses[track]?.doneToday).length,
    total: order.length,
    next: order.find((track) => !statuses[track]?.doneToday) ?? null,
  };
}
