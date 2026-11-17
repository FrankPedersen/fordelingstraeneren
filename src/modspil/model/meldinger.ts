import type { Card } from '../../domain/cards';
import { SEATS, type Hands, type Seat } from '../../domain/dealer';
import type { Rng } from '../../engine/rng';
import { OPENING_PASS } from '../../pointregnskab/model/bidding';
import { allowedOf, allows, honorPoints, intersect, type Allowed } from '../../pointregnskab/model/points';
import { chooseCall, hcpOf, theirSuit } from '../../system/interpreter';
import type { Kontrakt } from './udspil';

/**
 * Meldeforløbet i Modspil (SPEC-modspil.md, "Løser, generator og facit" punkt 2): kort og naturligt. Øst og Vest passer
 * hele vejen, Syd åbner som den første, der kan åbne efter systemfilen, og Nord melder kontrakten i Syds åbningsfarve
 * (3NT, 4♥ eller 4♠), så Syd er spilfører. Pas i åbningsposition fra Øst eller Vest viser 0–11 hp (som Pointregnskab),
 * og Syds åbning viser systemfilens interval; de andre meldinger viser intet.
 */

export interface Melding {
  plads: Seat;
  /** 'P' for pas, ellers meldingen som i systemfilen, fx '1NT', '1H' eller '4S'. */
  melding: string;
  /** Det, meldingen viser om pladsens hp; uden hp ingen grænse. */
  hp?: Allowed;
}

export interface Meldeforloeb {
  giver: Seat;
  meldinger: Melding[];
}

/** Nord–Syd har mindst så mange hp, så udgangen er naturlig. */
export const MINDST_NS_HP = 23;

const KONTRAKTER: Readonly<Record<string, Kontrakt>> = { NT: '3NT', H: '4H', S: '4S' };

const efter = (plads: Seat, n = 1): Seat => SEATS[(SEATS.indexOf(plads) + n) % 4];

const laengde = (haand: readonly Card[], farve: number): number => haand.filter((c) => Math.floor(c / 13) === farve).length;

/**
 * Meldeforløbet for hænderne, eller null, når hænderne ikke giver et kort og naturligt forløb: Syd skal åbne i sans, ♥
 * eller ♠, Nord–Syd skal have mindst `MINDST_NS_HP` og mod farve mindst otte trumf, og Vest må ikke have en indmelding
 * efter systemfilen. Giveren vælges blandt dem, der lader Syd åbne som den første.
 */
export function meld(haender: Hands, rng: Rng): { meldeforloeb: Meldeforloeb; kontrakt: Kontrakt } | null {
  const aabning = chooseCall('opening', haender.S);
  if (!aabning) return null;
  const kontrakt = KONTRAKTER[aabning.call.replace(/^\d/, '')];
  if (!kontrakt) return null;
  if (hcpOf(haender.N) + hcpOf(haender.S) < MINDST_NS_HP) return null;
  if (kontrakt !== '3NT') {
    const t = kontrakt === '4S' ? 0 : 1;
    if (laengde(haender.N, t) + laengde(haender.S, t) < 8) return null;
  }
  const sammenhaeng = `over-${aabning.call}`;
  if (/^1(NT|[SHDC])$/.test(aabning.call) && chooseCall(sammenhaeng, haender.W, theirSuit(sammenhaeng))) return null;

  // Giveren: Syd selv, eller en plads før Syd, når ingen af pladserne fra giveren til Syd kan åbne.
  const givere: Seat[] = ['S'];
  for (const plads of ['E', 'N', 'W'] as const) {
    if (chooseCall('opening', haender[plads])) break;
    givere.push(plads);
  }
  const giver = givere[rng.int(givere.length)];

  const meldinger: Melding[] = [];
  for (let plads = giver; plads !== 'S'; plads = efter(plads)) {
    meldinger.push(plads === 'N' ? { plads, melding: 'P' } : { plads, melding: 'P', hp: OPENING_PASS });
  }
  meldinger.push({ plads: 'S', melding: aabning.call, hp: allowedOf(aabning.hcp) });
  meldinger.push({ plads: 'W', melding: 'P' }, { plads: 'N', melding: kontrakt }, { plads: 'E', melding: 'P' }, { plads: 'S', melding: 'P' }, { plads: 'W', melding: 'P' });
  return { meldeforloeb: { giver, meldinger }, kontrakt };
}

/** Det, pladsens meldinger tillader: fællesmængden af deres hp; uden melding ingen grænse (0–40). */
export function tilladt(forloeb: Meldeforloeb, plads: Seat): Allowed {
  let a: Allowed | null = null;
  for (const m of forloeb.meldinger) if (m.plads === plads && m.hp) a = a ? intersect(a, m.hp) : m.hp;
  return a ?? [[0, 40]];
}

/** Summerne, en delmængde af pointene kan give (0 til summen), som en tabel over, hvilke summer der kan nås. */
function delsummer(point: readonly number[]): boolean[] {
  const total = point.reduce((s, p) => s + p, 0);
  const kan = new Array<boolean>(total + 1).fill(false);
  kan[0] = true;
  for (const p of point) for (let x = total - p; x >= 0; x--) if (kan[x]) kan[x + p] = true;
  return kan;
}

/** Honnørpointene i kortene, ingen af de kendte hænder har (Øst og Nord), eventuelt uden én farve. */
function usetePoint(haender: Hands, udenFarve?: number): number[] {
  const kendt = new Set([...haender.E, ...haender.N]);
  const ud: number[] = [];
  for (let c = 0; c < 52; c++) {
    if (kendt.has(c) || Math.floor(c / 13) === udenFarve) continue;
    const p = honorPoints(c);
    if (p > 0) ud.push(p);
  }
  return ud;
}

/**
 * Makkers point (øvelse 1): Vests mulige hp, når de usete honnører fordeles på Vest og Syd, og begge ligger i deres
 * intervaller fra meldingerne. Null, når meldingerne ikke kan passe (sker ikke med rigtige hænder).
 */
export function makkersPoint(haender: Hands, forloeb: Meldeforloeb): { min: number; max: number; total: number } | null {
  const point = usetePoint(haender);
  const kan = delsummer(point);
  const total = kan.length - 1;
  const vest = tilladt(forloeb, 'W');
  const syd = tilladt(forloeb, 'S');
  let min = Infinity;
  let max = -Infinity;
  kan.forEach((ja, x) => {
    if (!ja || !allows(vest, x) || !allows(syd, total - x)) return;
    min = Math.min(min, x);
    max = Math.max(max, x);
  });
  return min <= max ? { min, max, total } : null;
}

/**
 * Hp-kravet i øvelse 2 og 3 fra niveau 4: en fordeling af farven passer, når de usete honnører uden for farven kan
 * fordeles på Vest og Syd, så begge ligger i deres intervaller fra meldingerne.
 */
export function hpKrav(haender: Hands, forloeb: Meldeforloeb, farve: number): (vestHp: number, sydHp: number) => boolean {
  const kan = delsummer(usetePoint(haender, farve));
  const total = kan.length - 1;
  const vest = tilladt(forloeb, 'W');
  const syd = tilladt(forloeb, 'S');
  const svar = new Map<number, boolean>();
  return (a, b) => {
    const noegle = a * 64 + b;
    let ja = svar.get(noegle);
    if (ja === undefined) {
      ja = kan.some((mulig, x) => mulig && allows(vest, a + x) && allows(syd, b + total - x));
      svar.set(noegle, ja);
    }
    return ja;
  };
}

/** Meldingen med farvesymbol, fx 1♥ og 3NT; pas skrives "pas" eller "pass". */
export function meldingTekst(melding: string, sprog: 'da' | 'en'): string {
  if (melding === 'P') return sprog === 'en' ? 'pass' : 'pas';
  return melding.replace(/[SHDC]$/, (s) => ({ S: '♠', H: '♥', D: '♦', C: '♣' })[s as 'S' | 'H' | 'D' | 'C']);
}
