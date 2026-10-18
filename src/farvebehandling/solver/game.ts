import { binomial } from '../../domain/combinatorics';
import { missingCards, type Rank } from '../model/cards';
import { A_PRIORI, type Vacant } from '../model/layouts';
import { honorPoints } from '../model/situation';

/**
 * Spiltræet for én farve.
 *
 * Spilføreren styrer Nord (bordet) og Syd (hånden) og ser kun de spillede kort. Modspillet kender alle kort.
 * Forbindelserne er ubegrænsede: spilføreren spiller altid ud fra den hånd, han vil, og modspillet spiller aldrig farven.
 *
 * Abstraktion: modpartens kort, der ligger mellem to af spilførerens kort (et "hul"), er ligeværdige. Derfor tæller
 * kun, hvor mange kort Vest og Øst har i hvert hul. Det ændrer ikke spillets værdi, og begrænset valg følger af tællingen.
 *
 * Deling af huller (SPEC-analyse-situation.md): med en hp-grænse er kort med forskellige honnørpoint ikke længere
 * ligeværdige, fordi sidningernes vægt afhænger af, hvem der har hvilken honnør. Med `splitHonors` deles hvert hul
 * derfor i dele efter honnørpoint: hver honnør står for sig, og 10'eren og lavere står samlet. Delene beholdes, når
 * hullerne slås sammen undervejs; kun dele med samme honnørpoint slås sammen. Uden `splitHonors` er der én del pr. hul,
 * og spillet er præcis som før.
 *
 * Træet har to slags knuder. En knude er en offentlig spilsituation (det, spilføreren ved); et "item" er en knude
 * sammen med én sidning (det, modspillet ved). Knuder og items er nummereret i dybde-først rækkefølge, så et deltræ
 * fylder et sammenhængende interval, og en forælder altid har lavere nummer end sine børn.
 */

export type Hand = 'N' | 'S';
export type Objective = { kind: 'goal'; goal: number } | { kind: 'tricks' };

/** Knudetyper. */
export const LEAD = 0; // spilføreren vælger hånd og udspil
export const SECOND = 1; // 2. hånd (modspiller) lægger et kort
export const THIRD = 2; // spilføreren vælger 3. håndens kort
export const FOURTH = 3; // 4. hånd (modspiller) lægger et kort
export const END = 4;

export interface DeclarerCard {
  rank: Rank;
  hand: Hand;
}

export interface Layout {
  /** Antal modpartskort hos Vest i hvert hul i startpositionen. */
  west: readonly number[];
  /** Antal kort hos Vest i alt. */
  count: number;
  /** Tæller over `Game.denominator`: antal konkrete sidninger gange chancen for hver. */
  weight: bigint;
  /** Antal kort hos Vest i hver del (`Game.parts`); uden deling det samme som `west`. */
  parts: readonly number[];
}

/** En del af et hul i startpositionen: kort med samme honnørpoint, eller hele hullet uden deling. */
export interface GamePart {
  hole: number;
  /** Højeste og laveste kort i delen (uden deling hullets interval). */
  high: Rank;
  low: Rank;
  size: number;
  /** Honnørpoint pr. kort, når alle delens kort har de samme; null, hvis delen blander. */
  hp: number | null;
}

export interface Game {
  north: readonly Rank[];
  south: readonly Rank[];
  missing: readonly Rank[];
  vacant: Vacant;
  objective: Objective;
  /** Spilførerens kort, højeste først. */
  declarer: readonly DeclarerCard[];
  /** Antal modpartskort over hvert af spilførerens kort og under det laveste. */
  gaps: readonly number[];
  /** Hullernes dele; uden deling én pr. hul. */
  parts: readonly GamePart[];
  layouts: readonly Layout[];
  denominator: bigint;
  layoutWeight: Float64Array;

  kind: Int8Array;
  /** Udbetaling i slutknuder: 1/0 for et mål, antal stik for parturnering. */
  payoff: Int16Array;
  /** Antal vundne stik ved knuden. */
  tricks: Int8Array;
  /** Modpartens højest mulige kort ved knuden (0 = ingen kort tilbage). Et kort over det er en sikker vinder. */
  opponentHigh: Int8Array;
  parent: Int32Array;
  parentSlot: Int8Array;
  childStart: Int32Array;
  childCount: Int8Array;
  children: Int32Array;
  /** Første knude efter deltræet. */
  subtreeEnd: Int32Array;
  /**
   * Handling pr. barn-slot. LEAD: hånd (0 = Nord, 1 = Syd); LEAD og THIRD: højeste og laveste kort i den spillede
   * gruppe af ligeværdige kort (0 = intet kort). SECOND og FOURTH: hullets højeste og laveste rang (0 = kan ikke bekende).
   */
  slotHand: Int8Array;
  slotHigh: Int8Array;
  slotLow: Int8Array;

  itemLayout: Int32Array;
  itemNode: Int32Array;
  itemChildStart: Int32Array;
  /** Barn-item pr. barn-slot, −1 hvis modspilleren ikke har et kort i det hul. */
  itemChildren: Int32Array;
  nodeItemStart: Int32Array;
  nodeItemCount: Int32Array;
  root: number;
}

export interface GameOptions {
  vacant?: Vacant;
  objective: Objective;
  /** Del hullerne efter honnørpoint (når en hp-grænse binder). */
  splitHonors?: boolean;
}

/** En del undervejs: hul, klasse (honnørpoint, uden deling 0), interval og antal modpartskort. */
interface PartState {
  hole: number;
  cls: number;
  high: Rank;
  low: Rank;
  size: number;
}

interface State {
  decl: DeclarerCard[];
  gaps: number[];
  parts: PartState[];
  tricks: number;
}

interface ItemState {
  layout: number;
  /** Vests antal kort i hver del. */
  west: number[];
}

interface Built {
  id: number;
  items: Map<number, number>;
}

export function buildGame(north: readonly Rank[], south: readonly Rank[], options: GameOptions): Game {
  const vacant = options.vacant ?? A_PRIORI;
  const objective = options.objective;
  const missing = missingCards(north, south);
  const owner = new Map<Rank, Hand>();
  for (const r of north) owner.set(r, 'N');
  for (const r of south) owner.set(r, 'S');
  const split = options.splitHonors === true;
  const decl0: DeclarerCard[] = [];
  const gaps0 = [0];
  const holeCards: Rank[][] = [[]];
  for (let r = 14; r >= 2; r--) {
    const hand = owner.get(r);
    if (hand) {
      decl0.push({ rank: r, hand });
      gaps0.push(0);
      holeCards.push([]);
    } else {
      gaps0[gaps0.length - 1]++;
      holeCards[holeCards.length - 1].push(r);
    }
  }

  // Delene: uden deling ét pr. hul med hullets interval; med deling hvert huls kort grupperet efter honnørpoint.
  const holeRange = (q: number) => ({
    high: q === 0 ? 14 : decl0[q - 1].rank - 1,
    low: q === decl0.length ? 2 : decl0[q].rank + 1,
  });
  const parts0: PartState[] = [];
  const partHp: (number | null)[] = [];
  holeCards.forEach((cards, q) => {
    if (!split) {
      parts0.push({ hole: q, cls: 0, ...holeRange(q), size: cards.length });
      const hps = new Set(cards.map(honorPoints));
      partHp.push(hps.size === 0 ? 0 : hps.size === 1 ? [...hps][0] : null);
      return;
    }
    for (const r of cards) {
      const cls = honorPoints(r);
      const part = parts0.find((p) => p.hole === q && p.cls === cls);
      if (part) {
        part.low = r;
        part.size++;
      } else {
        parts0.push({ hole: q, cls, high: r, low: r, size: 1 });
        partHp.push(cls);
      }
    }
  });

  // Sidninger: Vests antal i hver del. Vægt = C(U − n, v_V − k) · ∏ C(del, w).
  const n = missing.length;
  const u = vacant.west + vacant.east;
  if (n > u) throw new Error('Flere manglende kort end ledige pladser');
  let counts: number[][] = [[]];
  for (const { size } of parts0) {
    const next: number[][] = [];
    for (const c of counts) for (let w = 0; w <= size; w++) next.push([...c, w]);
    counts = next;
  }
  const layouts: Layout[] = [];
  for (const parts of counts) {
    const k = parts.reduce((a, b) => a + b, 0);
    let weight = binomial(u - n, vacant.west - k);
    for (let p = 0; p < parts0.length; p++) weight *= binomial(parts0[p].size, parts[p]);
    const west = gaps0.map(() => 0);
    parts.forEach((w, p) => (west[parts0[p].hole] += w));
    if (weight > 0n) layouts.push({ west, count: k, weight, parts });
  }
  const denominator = binomial(u, vacant.west);

  // Træet bygges i almindelige arrays og pakkes bagefter.
  const kind: number[] = [], payoff: number[] = [], tricks: number[] = [], parent: number[] = [], parentSlot: number[] = [];
  const opponentHigh: number[] = [];
  const childStart: number[] = [], childCount: number[] = [], children: number[] = [];
  const slotHand: number[] = [], slotHigh: number[] = [], slotLow: number[] = [];
  const itemLayout: number[] = [], itemNode: number[] = [], itemChildStart: number[] = [], itemChildren: number[] = [];
  const nodeItemStart: number[] = [], nodeItemCount: number[] = [];

  function newNode(k: number, st: State, items: readonly ItemState[]): Built {
    const id = kind.length;
    kind.push(k);
    payoff.push(0);
    tricks.push(st.tricks);
    const q = st.gaps.findIndex((g) => g > 0);
    opponentHigh.push(q < 0 ? 0 : q === 0 ? 14 : st.decl[q - 1].rank - 1);
    parent.push(-1);
    parentSlot.push(-1);
    childStart.push(0);
    childCount.push(0);
    nodeItemStart.push(itemLayout.length);
    nodeItemCount.push(items.length);
    const map = new Map<number, number>();
    for (const it of items) {
      map.set(it.layout, itemLayout.length);
      itemLayout.push(it.layout);
      itemNode.push(id);
      itemChildStart.push(-1);
    }
    return { id, items: map };
  }

  interface Slot {
    hand: number;
    high: number;
    low: number;
  }

  /** Reserverer barn-slots, bygger børnene og kobler items. */
  function attach(node: Built, slots: readonly Slot[], build: (i: number) => Built) {
    const start = children.length;
    childStart[node.id] = start;
    childCount[node.id] = slots.length;
    for (const s of slots) {
      children.push(-1);
      slotHand.push(s.hand);
      slotHigh.push(s.high);
      slotLow.push(s.low);
    }
    const kids: Built[] = [];
    for (let i = 0; i < slots.length; i++) {
      const kid = build(i);
      children[start + i] = kid.id;
      parent[kid.id] = node.id;
      parentSlot[kid.id] = i;
      kids.push(kid);
    }
    for (const [layout, item] of node.items) {
      itemChildStart[item] = itemChildren.length;
      for (const kid of kids) itemChildren.push(kid.items.get(layout) ?? -1);
    }
  }

  /** Grupper af ligeværdige kort i en hånd: kort i samme hånd uden modpartskort imellem. Indeks i st.decl. */
  function groups(st: State, hand: Hand): { top: number; bottom: number }[] {
    const out: { top: number; bottom: number }[] = [];
    for (let j = 0; j < st.decl.length; j++) {
      if (st.decl[j].hand !== hand) continue;
      const last = out[out.length - 1];
      if (last) {
        let empty = true;
        for (let q = last.bottom + 1; q <= j; q++) if (st.gaps[q] > 0) empty = false;
        if (empty) {
          last.bottom = j;
          continue;
        }
      }
      out.push({ top: j, bottom: j });
    }
    return out;
  }
  const countIn = (st: State, hand: Hand) => st.decl.reduce((a, d) => a + (d.hand === hand ? 1 : 0), 0);

  function terminal(st: State): number | null {
    const rounds = Math.max(countIn(st, 'N'), countIn(st, 'S'));
    const opponents = st.gaps.reduce((a, b) => a + b, 0);
    let final: number | null = null;
    if (st.decl.length === 0) final = st.tricks;
    // Modparten har ingen kort, eller kun kort under alle spilførerens: spilføreren vinder resten af runderne.
    else if (opponents === st.gaps[st.gaps.length - 1]) final = st.tricks + rounds;
    if (objective.kind === 'tricks') return final;
    const goal = objective.goal;
    if (final !== null) return final >= goal ? 1 : 0;
    if (st.tricks >= goal) return 1;
    if (st.tricks + rounds < goal) return 0;
    return null;
  }

  function buildLead(st: State, items: ItemState[]): Built {
    const end = terminal(st);
    if (end !== null) {
      const node = newNode(END, st, items);
      payoff[node.id] = end;
      return node;
    }
    const options: { hand: Hand; top: number; bottom: number }[] = [];
    for (const hand of ['N', 'S'] as const) for (const grp of groups(st, hand)) options.push({ hand, ...grp });
    const node = newNode(LEAD, st, items);
    attach(
      node,
      options.map((o) => ({ hand: o.hand === 'N' ? 0 : 1, high: st.decl[o.top].rank, low: st.decl[o.bottom].rank })),
      (i) => buildDefender(st, options[i].hand, options[i].bottom, items, -1, -1),
    );
    return node;
  }

  function gapRange(st: State, q: number): Slot {
    if (q < 0) return { hand: -1, high: 0, low: 0 };
    const high = q === 0 ? 14 : st.decl[q - 1].rank - 1;
    const low = q === st.decl.length ? 2 : st.decl[q].rank + 1;
    return { hand: -1, high, low };
  }

  /** Et modpartskort fra delen p: hullets interval, når hullet kun har én del (altid uden deling), ellers delens. */
  function partRange(st: State, p: number): Slot {
    if (p < 0) return gapRange(st, -1);
    const part = st.parts[p];
    if (st.parts.filter((x) => x.hole === part.hole).length === 1) return gapRange(st, part.hole);
    return { hand: -1, high: part.high, low: part.low };
  }

  /** 2. hånd (second < 0) eller 4. hånd efter 3. håndens kort. */
  function buildDefender(st: State, leader: Hand, lead: number, items: ItemState[], second: number, third: number): Built {
    const isSecond = third === -1 && second === -1;
    const seat = isSecond ? (leader === 'N' ? 'E' : 'W') : leader === 'N' ? 'W' : 'E';
    // Handlingerne er pr. del: uden deling er en del et hul.
    const gapsNow = st.parts.map((p) => p.size);
    if (!isSecond && second >= 0) gapsNow[second]--;
    const byGap = new Map<number, ItemState[]>();
    for (const it of items) {
      let any = false;
      for (let q = 0; q < gapsNow.length; q++) {
        const have = seat === 'W' ? it.west[q] : gapsNow[q] - it.west[q];
        if (have > 0) {
          any = true;
          const west = it.west.slice();
          if (seat === 'W') west[q]--;
          let list = byGap.get(q);
          if (!list) byGap.set(q, (list = []));
          list.push({ layout: it.layout, west });
        }
      }
      if (!any) {
        let list = byGap.get(-1);
        if (!list) byGap.set(-1, (list = []));
        list.push({ layout: it.layout, west: it.west });
      }
    }
    const actions = [...byGap.keys()].sort((a, b) => (a < 0 ? 99 : a) - (b < 0 ? 99 : b));
    const node = newNode(isSecond ? SECOND : FOURTH, st, items);
    attach(
      node,
      actions.map((q) => partRange(st, q)),
      (i) =>
        isSecond
          ? buildThird(st, leader, lead, actions[i], byGap.get(actions[i])!)
          : finishTrick(st, lead, second, third, actions[i], byGap.get(actions[i])!),
    );
    return node;
  }

  function buildThird(st: State, leader: Hand, lead: number, second: number, items: ItemState[]): Built {
    const options = groups(st, leader === 'N' ? 'S' : 'N');
    const node = newNode(THIRD, st, items);
    if (!options.length) {
      attach(node, [{ hand: -1, high: 0, low: 0 }], () => buildDefender(st, leader, lead, items, second, -2));
    } else {
      attach(
        node,
        options.map((o) => ({ hand: -1, high: st.decl[o.top].rank, low: st.decl[o.bottom].rank })),
        (i) => buildDefender(st, leader, lead, items, second, options[i].bottom),
      );
    }
    return node;
  }

  function finishTrick(st: State, lead: number, second: number, third: number, fourth: number, items: ItemState[]): Built {
    // Spilførerens kort med indeks j slår et modpartskort i hul q, når j < q. 2. og 4. hånd spiller fra en del.
    const holeOf = (p: number) => (p >= 0 ? st.parts[p].hole : 99);
    const ours = Math.min(lead, third >= 0 ? third : 99);
    const theirs = Math.min(holeOf(second), holeOf(fourth));
    const won = ours < theirs;
    const gaps = st.gaps.slice();
    const parts = st.parts.map((p) => ({ ...p }));
    for (const p of [second, fourth]) {
      if (p < 0) continue;
      gaps[parts[p].hole]--;
      parts[p].size--;
    }
    const decl = st.decl.slice();
    const next = items.map((it) => ({ layout: it.layout, west: it.west.slice() }));
    for (const j of [lead, third].filter((x) => x >= 0).sort((a, b) => b - a)) {
      decl.splice(j, 1);
      gaps.splice(j, 2, gaps[j] + gaps[j + 1]);
      // Hul j og j + 1 bliver ét. Dele med samme klasse slås sammen; uden deling er det de to huller.
      for (const p of parts) if (p.hole > j) p.hole--;
      for (let a = 0; a < parts.length; a++) {
        if (parts[a].hole !== j) continue;
        for (let b = a + 1; b < parts.length; b++) {
          if (parts[b].hole !== j || parts[b].cls !== parts[a].cls) continue;
          const size = parts[a].size + parts[b].size;
          parts[a] = { ...parts[a], high: Math.max(parts[a].high, parts[b].high), low: Math.min(parts[a].low, parts[b].low), size };
          parts.splice(b, 1);
          for (const it of next) it.west.splice(a, 1, it.west[a] + it.west.splice(b, 1)[0]);
          b--;
        }
      }
    }
    return buildLead({ decl, gaps, parts, tricks: st.tricks + (won ? 1 : 0) }, next);
  }

  const root = buildLead(
    { decl: decl0, gaps: gaps0, parts: parts0.map((p) => ({ ...p })), tricks: 0 },
    layouts.map((l, i) => ({ layout: i, west: [...l.parts] })),
  ).id;

  const nodes = kind.length;
  const subtreeEnd = new Int32Array(nodes);
  for (let node = nodes - 1; node >= 0; node--) {
    let end = node + 1;
    if (kind[node] !== END) {
      for (let x = 0; x < childCount[node]; x++) end = Math.max(end, subtreeEnd[children[childStart[node] + x]]);
    }
    subtreeEnd[node] = end;
  }

  return {
    north,
    south,
    missing,
    vacant,
    objective,
    declarer: decl0,
    gaps: gaps0,
    parts: parts0.map((p, i) => ({ hole: p.hole, high: p.high, low: p.low, size: p.size, hp: partHp[i] })),
    layouts,
    denominator,
    layoutWeight: Float64Array.from(layouts.map((l) => Number(l.weight) / Number(denominator))),
    kind: Int8Array.from(kind),
    payoff: Int16Array.from(payoff),
    tricks: Int8Array.from(tricks),
    opponentHigh: Int8Array.from(opponentHigh),
    parent: Int32Array.from(parent),
    parentSlot: Int8Array.from(parentSlot),
    childStart: Int32Array.from(childStart),
    childCount: Int8Array.from(childCount),
    children: Int32Array.from(children),
    subtreeEnd,
    slotHand: Int8Array.from(slotHand),
    slotHigh: Int8Array.from(slotHigh),
    slotLow: Int8Array.from(slotLow),
    itemLayout: Int32Array.from(itemLayout),
    itemNode: Int32Array.from(itemNode),
    itemChildStart: Int32Array.from(itemChildStart),
    itemChildren: Int32Array.from(itemChildren),
    nodeItemStart: Int32Array.from(nodeItemStart),
    nodeItemCount: Int32Array.from(nodeItemCount),
    root,
  };
}

/** Sidningen (indeks i game.layouts), hvor Vest har netop disse af de manglende kort. */
export function layoutOf(game: Game, westCards: readonly Rank[]): number {
  const west = game.parts.map(() => 0);
  for (const r of westCards) {
    if (!game.missing.includes(r)) throw new Error(`Vest kan ikke have ${r}`);
    // hullet: antal af spilførerens kort over r; delen: den i hullet, hvis interval rummer r
    const q = game.declarer.filter((d) => d.rank > r).length;
    west[game.parts.findIndex((p) => p.hole === q && p.high >= r && r >= p.low)]++;
  }
  const index = game.layouts.findIndex((l) => l.parts.every((w, p) => w === west[p]));
  if (index < 0) throw new Error('Sidningen er umulig med de ledige pladser');
  return index;
}
