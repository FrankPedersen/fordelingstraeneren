import { describe, expect, it } from 'vitest';
import { dealWith, SEATS, type Seat } from '../../domain/dealer';
import { mulberry32 } from '../../engine/rng';
import { chooseCall, hcpOf, SYSTEM } from '../../system/interpreter';
import { allowedFor, bid, isDefender, limitAllowed, OPENING_PASS, PASS_RULES, passRule } from './bidding';
import { directlyReadable, explain } from './explain';
import { makeTask, type Exercise, type Level, type PlacementTask } from './generator';
import { allowedOf, allows, ANY, intersect, limits, opponentsPoints, panelRest } from './points';
import { solve, type Ledger } from './solver';

/** Kort ud fra farve og navn, fx card('♠', 'E'). */
const RANKS = '23456789TBDKE';
const card = (suit: string, rank: string) => '♠♥♦♣'.indexOf(suit) * 13 + RANKS.indexOf(rank);

const rule = (context: string, call: string) => SYSTEM.find((r) => r.context === context && r.call === call)!;

describe('Model', () => {
  it('modpartens point = 40 − (Nords hp + Syds hp) for 10.000 tilfældige fordelinger', () => {
    const rng = mulberry32(1);
    for (let i = 0; i < 10_000; i++) {
      const hands = dealWith(rng);
      const m = opponentsPoints(hands.N, hands.S);
      expect(m).toBe(40 - hcpOf(hands.N) - hcpOf(hands.S));
      expect(m).toBe(hcpOf(hands.E) + hcpOf(hands.W));
    }
  });

  it('tilladte point er mængder: Michaels er 8–15 eller 17+, og fællesmængden af to meldinger', () => {
    const michaels = allowedOf(rule('over-1H', '2H').hcp);
    expect(michaels).toEqual([
      [8, 15],
      [17, 40],
    ]);
    expect(allows(michaels, 16)).toBe(false);
    expect(allows(michaels, 17)).toBe(true);
    expect(intersect(OPENING_PASS, allowedOf(passRule('responder-pass-after-1-suit').hcp))).toEqual([[0, 5]]);
    expect(intersect(michaels, [[0, 11]])).toEqual([[8, 11]]);
    expect(limits([[0, 11]], 10)).toBe(false);
    expect(limits([[0, 11]], 12)).toBe(true);
    expect(limits(ANY, 20)).toBe(false);
  });

  it('Regnskabspanelets rest er altid de tilladte point minus det viste, aldrig løserens slutning', () => {
    expect(panelRest([[15, 17]], 10)).toEqual([[5, 7]]);
    expect(panelRest([[8, 15], [17, 40]], 10)).toEqual([
      [0, 5],
      [7, 30],
    ]);
    expect(panelRest([[8, 15], [17, 40]], 15)).toEqual([
      [0, 0],
      [2, 25],
    ]);
    expect(panelRest([[8, 15], [17, 40]], 16)).toEqual([[1, 24]]);
    // Løseren ved, at Vest har præcis 6 tilbage; panelet viser stadig 5–7.
    const ledger = oneNotrump([[15, 17]]);
    expect(solve(ledger).rest.W).toEqual({ min: 6, max: 6 });
    expect(panelRest(ledger.W.allowed, 10)).toEqual([[5, 7]]);
    for (const task of tasks(300)) {
      for (const d of ['W', 'E'] as const) {
        const shown = task.ledger[d].shown.reduce((s, c) => s + Math.max(0, (c % 13) - 8), 0);
        const rest = panelRest(task.ledger[d].allowed, shown);
        const expected = task.ledger[d].allowed
          .filter(([, hi]) => hi >= shown)
          .map(([lo, hi]) => [Math.max(0, lo - shown), hi - shown]);
        expect(rest).toEqual(expected);
      }
    }
  });
});

/** Specens eksempel: Vest har vist ♠E, ♠K og ♥K (10), Øst passede (0–5), og ♣D og ♦E er usete. */
function oneNotrump(west: [number, number][]): Ledger {
  return {
    W: { allowed: west, shown: [card('♠', 'E'), card('♠', 'K'), card('♥', 'K')] },
    E: { allowed: [[0, 5]], shown: [] },
    unseen: [card('♣', 'D'), card('♦', 'E')],
  };
}

describe('Løseren', () => {
  it('Vest åbnede 1NT (15–17) og har vist 10, Øst passede (0–5): ♣D og ♦E sidder sikkert hos Vest', () => {
    const ledger = oneNotrump(allowedOf(rule('opening', '1NT').hcp) as [number, number][]);
    const { answer, feasible } = solve(ledger);
    expect(answer.get(card('♣', 'D'))).toBe('W');
    expect(answer.get(card('♦', 'E'))).toBe('W');
    expect(feasible).toEqual([['W', 'W']]);
    expect(explain(ledger, card('♣', 'D'))).toEqual({
      kind: 'must-have',
      card: card('♣', 'D'),
      holder: 'W',
      rest: [[5, 7]],
      cards: [card('♣', 'D'), card('♦', 'E')],
    });
  });

  it('samme situation, men Vest åbnede 1♥ (12–21): ♣D og ♦E kan ikke afgøres', () => {
    const ledger = oneNotrump(allowedOf(rule('opening', '1H').hcp) as [number, number][]);
    const { answer } = solve(ledger);
    expect(answer.get(card('♣', 'D'))).toBe('open');
    expect(answer.get(card('♦', 'E'))).toBe('open');
    expect(explain(ledger, card('♣', 'D'))?.kind).toBe('open');
  });

  it('to intervaller: Øst meldte Michaels (8–15 eller 17+) og har vist 15, så ♦B sidder hos Vest', () => {
    const ledger: Ledger = {
      W: { allowed: ANY, shown: [] },
      E: { allowed: allowedOf(rule('over-1H', '2H').hcp), shown: [card('♠', 'E'), card('♠', 'K'), card('♣', 'E'), card('♣', 'K'), card('♥', 'B')] },
      unseen: [card('♦', 'B')],
    };
    expect(solve(ledger).answer.get(card('♦', 'B'))).toBe('W');
    expect(explain(ledger, card('♦', 'B'))).toMatchObject({ kind: 'other-cannot', holder: 'W', other: 'E', gap: true });
    // Tillader Vests interval det ikke, er der ingen mulig placering.
    expect(solve({ ...ledger, W: { allowed: [[12, 40]], shown: [] } }).feasible).toEqual([]);
  });

  it('Fuldt regnskab: en modspiller med 1 kort i en farve kan ikke få to honnører i den', () => {
    const unseen = [card('♠', 'E'), card('♠', 'K'), card('♥', 'D')];
    const free: Ledger = { W: { allowed: ANY, shown: [] }, E: { allowed: ANY, shown: [] }, unseen };
    expect(solve(free).feasible).toContainEqual(['W', 'W', 'W']);
    const ledger: Ledger = {
      W: { allowed: ANY, shown: [], lengths: [1, 4, 4, 4] },
      E: { allowed: ANY, shown: [], lengths: [4, 3, 3, 3] },
      unseen,
    };
    const { feasible } = solve(ledger);
    expect(feasible.length).toBe(6);
    for (const a of feasible) expect(a[0] === 'W' && a[1] === 'W').toBe(false);
    // Skal Vest have 7, kan han kun nå det med begge spar-honnører, og dem kan han ikke have.
    expect(solve({ ...ledger, W: { ...ledger.W, allowed: [[7, 7]] } }).feasible).toEqual([]);
  });
});

describe('Meldeforløbet', () => {
  it('ingen af 100.000 tilfældige hænder med 12 hp eller mere passer i åbningsposition', () => {
    const rng = mulberry32(12);
    let n = 0;
    while (n < 100_000) {
      const hands = dealWith(rng);
      for (const seat of SEATS) {
        if (hcpOf(hands[seat]) < 12) continue;
        n++;
        expect(chooseCall('opening', hands[seat]), `${hands[seat]}`).not.toBeNull();
      }
    }
  }, 60_000);

  /** Fordelinger med et meldeforløb. */
  function* auctions(count: number, seed = 7) {
    const rng = mulberry32(seed);
    for (let i = 0; i < count; i++) {
      const hands = dealWith(rng);
      const dealer: Seat = SEATS[rng.int(4)];
      const auction = bid(hands, dealer);
      if (auction) yield { hands, auction, m: opponentsPoints(hands.N, hands.S) };
    }
  }

  it('hvert vist pas passer med sin regel, og Nord–Syds meldinger indgår ikke i regnskabet', () => {
    let openingPasses = 0;
    let responderPasses = 0;
    for (const { hands, auction, m } of auctions(20_000)) {
      for (const call of auction.calls) {
        const points = hcpOf(hands[call.seat]);
        if (!isDefender(call.seat)) {
          expect(call.limit).toBeUndefined();
          continue;
        }
        expect(call.limit).toBeDefined();
        if (call.limit!.kind === 'opening-pass') {
          openingPasses++;
          expect(points).toBeLessThanOrEqual(11);
        }
        if (call.limit!.kind === 'responder-pass') {
          responderPasses++;
          expect(allows(allowedOf(call.limit!.rule.hcp), points)).toBe(true);
        }
        if (call.limit!.kind === 'call') expect(allows(allowedOf(call.limit!.rule.hcp), points)).toBe(true);
      }
      for (const d of ['W', 'E'] as const) expect(allows(allowedFor(auction, d, m), hcpOf(hands[d]))).toBe(true);
      // Nord–Syds kort og meldinger ændrer ikke modspillernes tilladte point.
      const withoutNS = { ...auction, calls: auction.calls.filter((c) => isDefender(c.seat)) };
      for (const d of ['W', 'E'] as const) expect(allowedFor(withoutNS, d, m)).toEqual(allowedFor(auction, d, m));
    }
    expect(openingPasses).toBeGreaterThan(1000);
    expect(responderPasses).toBeGreaterThan(100);
  });

  it('pas-reglerne har tekst på begge sprog: 0–5 efter 1 i farve og 0–7 efter 1NT', () => {
    expect(PASS_RULES.map((r) => [r.context, r.hcp])).toEqual([
      ['responder-pass-after-1-suit', [0, 5]],
      ['responder-pass-after-1NT', [0, 7]],
    ]);
    for (const r of PASS_RULES) {
      expect(r.text).toBeTruthy();
      expect(r.textEn).toBeTruthy();
    }
  });

  it('har Nord eller Syd meldt ind eller doblet efter Øst–Vests åbning, giver svarerens pas tilladte point [0, M]', () => {
    let seen = 0;
    for (const { auction, m } of auctions(20_000, 8)) {
      const openerIndex = auction.calls.findIndex((c) => c.call !== 'P');
      const opener = auction.calls[openerIndex];
      const overcall = auction.calls[openerIndex + 1];
      if (!isDefender(opener.seat) || !overcall || overcall.call === 'P') continue;
      const responder = auction.calls[openerIndex + 2];
      expect(responder.call).toBe('P');
      expect(responder.limit).toEqual({ kind: 'free-pass' });
      expect(limitAllowed(responder.limit!)).toBeNull();
      const passedBefore = auction.calls.slice(0, openerIndex).some((c) => c.seat === responder.seat);
      if (!passedBefore) {
        expect(allowedFor(auction, responder.seat as 'W' | 'E', m)).toEqual([[0, m]]);
        seen++;
      }
    }
    expect(seen).toBeGreaterThan(50);
  });

  it('svarerens pas efter Nord–Syds pas giver pas-reglens interval, også sammen med pas i åbningsposition', () => {
    const rng = mulberry32(3);
    let found = 0;
    for (let i = 0; i < 20_000 && found < 20; i++) {
      const hands = dealWith(rng);
      const auction = bid(hands, 'E');
      if (!auction) continue;
      const [e, s, w, n, e2] = auction.calls;
      if (e?.call !== 'P' || s?.call !== 'P' || !w || !/^1[SHDC]$/.test(w.call) || n?.call !== 'P' || !e2) continue;
      found++;
      expect(e2.limit).toEqual({ kind: 'responder-pass', rule: passRule('responder-pass-after-1-suit') });
      expect(allowedFor(auction, 'E', opponentsPoints(hands.N, hands.S))).toEqual([[0, 5]]);
    }
    expect(found).toBe(20);
  });
});

/** Opgaver af type 3–5 på niveau 1–4. */
function tasks(count: number): PlacementTask[] {
  const exercises: Exercise[] = ['can', 'who', 'finesse'];
  return Array.from({ length: count }, (_, i) => makeTask(exercises[i % 3], ((i % 4) + 1) as Level, i + 1) as PlacementTask);
}

describe('Generatoren', () => {
  const all = tasks(1000);

  it('20–30 % af 1.000 opgaver har facit "kan ikke afgøres"', () => {
    const open = all.filter((t) => t.placement === 'open').length;
    expect(open).toBeGreaterThanOrEqual(200);
    expect(open).toBeLessThanOrEqual(300);
  });

  it('ingen opgave kan aflæses direkte, og fra niveau 2 er mindst én honnør sikkert placeret uden at være set', () => {
    for (const t of all) {
      expect(directlyReadable(t.ledger)).toBe(false);
      if (t.level >= 2) expect([...solve(t.ledger).answer.values()].some((p) => p !== 'open')).toBe(true);
      if (t.level === 1) expect(t.ledger.unseen).toHaveLength(1);
    }
  });

  it('kravene til meldingerne: niveau 1–2 har én modspiller med en grænse, fra niveau 3 begge', () => {
    for (const t of all) {
      const limited = (['W', 'E'] as const).filter((d) => limits(t.ledger[d].allowed, t.m)).length;
      expect(limited).toBe(t.level <= 2 ? 1 : 2);
      expect(hcpOf(t.hands.N) + hcpOf(t.hands.S)).toBeGreaterThanOrEqual(20);
    }
  });

  it('facit kommer fra løseren og har en sætning fra en af skabelonerne', () => {
    for (const t of all) {
      const solution = solve(t.ledger);
      expect(t.placement).toBe(solution.answer.get(t.card));
      expect(t.ledger.unseen).toContain(t.card);
      const e = t.explanation;
      expect(explain(t.ledger, t.card)).toEqual(e);
      if (t.placement === 'open') expect(e.kind).toBe('open');
      else {
        expect(e.kind).not.toBe('open');
        if (e.kind !== 'open') expect(e.holder).toBe(t.placement);
      }
      // Ledetrådene er modspillernes egne honnører, og de usete sidder virkelig hos dem.
      for (const c of t.clues) expect(t.hands[c.seat]).toContain(c.card);
      for (const u of t.ledger.unseen) expect([...t.hands.W, ...t.hands.E]).toContain(u);
      if (t.placement !== 'open') expect(t.hands[t.placement]).toContain(t.card);
    }
  });

  it('samme seed giver samme opgave', () => {
    for (const exercise of ['sum', 'running', 'can', 'who', 'finesse'] as const) {
      for (const level of [1, 2, 3, 4] as const) {
        expect(makeTask(exercise, level, 4711)).toEqual(makeTask(exercise, level, 4711));
      }
    }
    expect(makeTask('who', 3, 1)).not.toEqual(makeTask('who', 3, 2));
  });

  it('Kipningsretning spørger kun om honnører, Nord–Syd kan kippe mod', () => {
    for (const t of all.filter((t) => t.exercise === 'finesse')) {
      const ns = [...t.hands.N, ...t.hands.S];
      expect(ns).toContain(t.card - 1);
    }
  });

  it('Regnestykket og Løbende tælling regner med alle fire hænder', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const sum = makeTask('sum', 1, seed);
      expect(sum.m).toBe(hcpOf(sum.hands.E) + hcpOf(sum.hands.W));
      const running = makeTask('running', ((seed % 4) + 1) as Level, seed);
      if (running.exercise !== 'running') throw new Error();
      expect(running.clues.length).toBeLessThanOrEqual(2 + running.level);
      for (const d of ['W', 'E'] as const) {
        const shown = running.clues.filter((c) => c.seat === d).reduce((s, c) => s + Math.max(0, (c.card % 13) - 8), 0);
        expect(running.shown[d]).toBe(shown);
      }
    }
  });
});
