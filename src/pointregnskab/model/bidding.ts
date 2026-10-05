import type { Card } from '../../domain/cards';
import { SEATS, type Hands, type Seat } from '../../domain/dealer';
import { chooseCall, hcpOf, theirSuit, type Rule } from '../../system/interpreter';
import passFile from '../content/pas-regler.json';
import { allowedOf, allows, intersect, type Allowed, type Defender } from './points';

/**
 * Meldeforløbet (SPEC-pointregnskab.md, Generator punkt 3): Pointregnskabet bygger selv Øst–Vests meldinger med
 * `chooseCall` som bibliotek, fordi `simulateAuction` kun melder den første åbning og én indmelding.
 */

export type PassContext = 'responder-pass-after-1-suit' | 'responder-pass-after-1NT';

/** En pas-regel uden for systemfilen (`content/pas-regler.json`). */
export interface PassRule {
  context: PassContext;
  hcp: [number, number];
  text: string;
  textEn: string;
}

export const PASS_RULES: readonly PassRule[] = passFile.rules as PassRule[];

export const passRule = (context: PassContext): PassRule => PASS_RULES.find((r) => r.context === context)!;

/** Pas i åbningsposition: højst 11 hp, fordi en hånd med 12 hp eller mere altid har en åbning i systemfilen. */
export const OPENING_PASS: Allowed = [[0, 11]];

/** Hvad en melding fra Øst eller Vest viser. */
export type Limit =
  /** En åbning eller indmelding fra systemfilen. */
  | { kind: 'call'; rule: Rule }
  /** Pas i åbningsposition (0–11). */
  | { kind: 'opening-pass' }
  /** Svarerens pas efter en pas-regel; kun når Nord–Syd har passet imellem. */
  | { kind: 'responder-pass'; rule: PassRule }
  /** Pas uden grænse: efter Nord–Syds åbning, eller efter Nord–Syds indmelding eller dobling. */
  | { kind: 'free-pass' };

export interface AuctionCall {
  seat: Seat;
  /** 'P' for pas, ellers meldingen som i systemfilen, fx '1NT', '2D' eller 'X'. */
  call: string;
  /** Kun for Øst og Vest. Nord–Syds meldinger indgår ikke i regnskabet. */
  limit?: Limit;
}

export interface Auction {
  dealer: Seat;
  /** Meldingerne i rækkefølge fra giveren; forløbet vises kun til og med Øst–Vests sidste melding. */
  calls: AuctionCall[];
  /** Kontrakten, fx '4S' eller '3NT'. Syd spiller altid. */
  contract: string;
}

export const isDefender = (seat: Seat): seat is Defender => seat === 'E' || seat === 'W';

const after = (seat: Seat, n = 1): Seat => SEATS[(SEATS.indexOf(seat) + n) % 4];

/** Åbninger, som systemfilen har indmeldinger efter (`over-1C` … `over-1NT`). */
const ONE_LEVEL = /^1(NT|[SHDC])$/;

/**
 * Melder fra giveren. Den første, der kan åbne, åbner; de foregående har passet i åbningsposition.
 * - Åbner Øst eller Vest i 1 farve eller 1NT, kan næste modstander melde ind. Passer han, passer svareren efter
 *   pas-reglen, og fordelingen bruges kun, hvis svarerens point ligger i reglens interval (ellers returneres null).
 *   Har Nord eller Syd meldt ind eller doblet, giver svarerens pas ingen grænse.
 * - Åbner Øst eller Vest højere, vises svarerens tur ikke: systemfilen har ingen indmeldinger efter dem.
 * - Åbner Nord eller Syd, kan næste modspiller melde ind efter `over-…`; ellers passer han uden grænse.
 * Fire pas giver null.
 */
export function bid(hands: Hands, dealer: Seat): Auction | null {
  const calls: AuctionCall[] = [];
  let opener: Seat | null = null;
  let opening: Rule | null = null;
  for (let i = 0; i < 4; i++) {
    const seat = after(dealer, i);
    const rule = chooseCall('opening', hands[seat]);
    if (rule) {
      calls.push(isDefender(seat) ? { seat, call: rule.call, limit: { kind: 'call', rule } } : { seat, call: rule.call });
      opener = seat;
      opening = rule;
      break;
    }
    calls.push(isDefender(seat) ? { seat, call: 'P', limit: { kind: 'opening-pass' } } : { seat, call: 'P' });
  }
  if (!opener || !opening) return null;

  const next = after(opener);
  const context = `over-${opening.call}`;
  const overcall = ONE_LEVEL.test(opening.call) ? chooseCall(context, hands[next], theirSuit(context)) : null;
  if (isDefender(opener)) {
    if (ONE_LEVEL.test(opening.call)) {
      calls.push({ seat: next, call: overcall ? overcall.call : 'P' });
      const responder = after(opener, 2);
      if (overcall) {
        calls.push({ seat: responder, call: 'P', limit: { kind: 'free-pass' } });
      } else {
        const rule = passRule(opening.call === '1NT' ? 'responder-pass-after-1NT' : 'responder-pass-after-1-suit');
        if (!allows(allowedOf(rule.hcp), hcpOf(hands[responder]))) return null;
        calls.push({ seat: responder, call: 'P', limit: { kind: 'responder-pass', rule } });
      }
    }
  } else {
    calls.push(
      overcall ? { seat: next, call: overcall.call, limit: { kind: 'call', rule: overcall } } : { seat: next, call: 'P', limit: { kind: 'free-pass' } },
    );
  }
  return { dealer, calls, contract: contractFor(hands.N, hands.S) };
}

/** Det, en grænse tillader; null = ingen grænse. */
export function limitAllowed(limit: Limit): Allowed | null {
  switch (limit.kind) {
    case 'call':
      return allowedOf(limit.rule.hcp);
    case 'opening-pass':
      return OPENING_PASS;
    case 'responder-pass':
      return allowedOf(limit.rule.hcp);
    case 'free-pass':
      return null;
  }
}

/**
 * En modspillers tilladte point: fællesmængden af det, hans meldinger viser, fx pas i åbningsposition og senere pas
 * som svarer. Uden grænse er mængden [0, M].
 */
export function allowedFor(auction: Auction, defender: Defender, m: number): Allowed {
  let allowed: Allowed | null = null;
  for (const call of auction.calls) {
    if (call.seat !== defender || !call.limit) continue;
    const a = limitAllowed(call.limit);
    if (a) allowed = allowed ? intersect(allowed, a) : a;
  }
  return allowed ?? [[0, m]];
}

/**
 * Kontrakten vises kun kort (Syd spiller). En enkel regel ud fra Nord–Syds hp og fits: major med 8+ kort, ellers NT,
 * og en minor med 9+ kort fra 29 hp. Den indgår ikke i regnskabet.
 */
export function contractFor(north: readonly Card[], south: readonly Card[]): string {
  const hcp = hcpOf(north) + hcpOf(south);
  const length = (suit: number) => [...north, ...south].filter((c) => Math.floor(c / 13) === suit).length;
  const level = hcp >= 33 ? 6 : hcp >= 25 ? 4 : hcp >= 22 ? 3 : 2;
  const major = [0, 1].filter((s) => length(s) >= 8).sort((a, b) => length(b) - length(a))[0];
  if (major !== undefined) return `${level}${'SH'[major]}`;
  const minor = [2, 3].filter((s) => length(s) >= 9).sort((a, b) => length(b) - length(a))[0];
  if (minor !== undefined && hcp >= 29) return `${hcp >= 33 ? 6 : 5}${'SHDC'[minor]}`;
  return `${hcp >= 33 ? 6 : hcp >= 25 ? 3 : hcp >= 22 ? 2 : 1}NT`;
}
