/**
 * Appens sprog: dansk som standard, engelsk efter valg med knappen på forsiden. Valget gemmes i
 * `fordelingstraener:v1` som `settings.language` (SPEC.md, Data og lagring). Teksterne står på begge sprog ved
 * siden af hinanden: `tx('Start dagens session', "Start today's session")`.
 */
export type Lang = 'da' | 'en';

let current: Lang = 'da';
const listeners = new Set<() => void>();

export function getLang(): Lang {
  return current;
}

/** Skifter sprog; komponenter, der bruger `useLang` (src/ui/useLang.ts), tegnes igen; App gør det for hele træet. */
export function setLang(next: Lang): void {
  if (next === current) return;
  current = next;
  if (typeof document !== 'undefined') document.documentElement.lang = next;
  for (const listener of listeners) listener();
}

/** Lytter efter sprogskift (bruges af `useLang` i src/ui/useLang.ts). Modulet er uden React, så løserens Web Worker kan bruge det. */
export function subscribeLang(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Teksten på det aktuelle sprog. */
export function tx<T>(da: T, en: T): T {
  return current === 'en' ? en : da;
}
