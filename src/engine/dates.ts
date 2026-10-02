// Datoer er kalenderdage på formen YYYY-MM-DD i lokal tid.

const pad = (n: number) => String(n).padStart(2, '0');

const DAY_MS = 86_400_000;

/** Dagen for et tidspunkt; dagen skifter kl. `startHour` lokal tid. */
export function dayOf(t: number, startHour = 4): string {
  const d = new Date(t);
  if (d.getHours() < startHour) d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Regn i UTC, så sommertid ikke giver dage på 23 eller 25 timer.
function toUtc(day: string): number {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUtc(t: number): string {
  const d = new Date(t);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function addDays(day: string, n: number): string {
  return fromUtc(toUtc(day) + n * DAY_MS);
}

/** Antal dage fra `a` til `b`. */
export function daysBetween(a: string, b: string): number {
  return Math.round((toUtc(b) - toUtc(a)) / DAY_MS);
}

/** Kalenderugen (ISO 8601, mandag–søndag), fx "2026-W40". */
export function isoWeek(day: string): string {
  const t = toUtc(day);
  const weekday = (new Date(t).getUTCDay() + 6) % 7; // mandag = 0
  // Ugen hører til det år, dens torsdag ligger i.
  const thursday = new Date(t + (3 - weekday) * DAY_MS);
  const year = thursday.getUTCFullYear();
  const week = Math.floor((thursday.getTime() - Date.UTC(year, 0, 1)) / DAY_MS / 7) + 1;
  return `${year}-W${pad(week)}`;
}
