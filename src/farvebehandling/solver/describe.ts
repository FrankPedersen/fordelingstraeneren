import { cardsData, JACK, TEN, type Rank } from '../model/cards';
import { END, LEAD, THIRD, type Game, type Hand } from './game';
import { lineMask, secondPlaysLow, type Line, type LineStep, type ThirdRule } from './lines';
import { itemValues } from './natural';

/**
 * Oversætter en ren linje fra løseren til nummererede trin på dansk og til linjeformatet.
 *
 * Beskrivelsen følger hovedvejen, som man selv ville fortælle linjen: 2. hånd lægger lavt, og 4. hånd stikker så
 * billigt som muligt, når den kan. Lægger 2. hånd en honnør, og ændrer det 3. håndens kort, nævnes det som en gren.
 * Beskrivelsen stopper, når resultatet er afgjort i alle sidninger. Linjeformatet får trinene frem til det første
 * sted, hvor næste udspil afhænger af, hvad modspillet lagde; derefter spiller løseren videre ("Efter sidste trin").
 *
 * Efter en kipning (SPEC-esset-slaas.md, A og E) følger hovedvejen den gren, hvor målet endnu ikke er afgjort: lykkes
 * kipningen (4. hånd kan ikke stikke over), eller mislykkes den. Er målet åbent på begge grene, følger hovedvejen den mest
 * sandsynlige; ved lige stand stikker 4. hånd over som før. Teksten, der fortsætter, siger hvilken gren: "Lykkes
 * kipningen, …" eller "Mislykkes kipningen, …". Går to kipninger forud, nævner mærket kortet: "Lykkes kipningen mod
 * knægten, …" (H, Franks afgørelse 6. november 2026).
 *
 * Et sikkert stik hedder "indkasseres", og høje kort, der spilles for at fælde en honnør, "toppes" (D): hører
 * målet (eller antallet af stik) til de sidninger, hvor en af modpartens honnører falder under kortene, er det
 * "Farven toppes med esset og kongen." 10'eren er honnør, når den er det eneste kort, der skal falde (G). Trin i træk med samme ord og trin med lille fra begge hænder lægges sammen (F).
 *
 * Med begrænsede forbindelser (SPEC-forbindelser.md) begynder et udspil, der bruger en indgang, med "Hånden (bordet)
 * nås med en sideindgang, og der spilles …"; hånden står så ikke igen efter kortet. Uden begrænsning er teksterne som før.
 *
 * Trinene står i beskrivende form (SPEC-sprog-kipning-toppe, Franks valg 31. oktober 2026): "Esset indkasseres.",
 * "ellers løber den" og "ellers lægges 9'eren".
 */
export interface LineDescription {
  steps: string[];
  line: Line;
}

export interface DescribeOptions {
  /** Hovedvejen efter en kipning (A), mærket for grenen (E) og "to gange" (F). Hvad nu? bruger dem ikke. */
  branches?: boolean;
  /** Modspillets kort, der allerede er spillet (Hvad nu?: kortene i første runde), så de ikke tælles som honnører. */
  gone?: ReadonlySet<Rank>;
}

/** Tællere til SPEC-esset-slaas.md, Resultat; løseren nulstiller dem ikke. */
export const DESCRIBE_STATS = { kipninger: 0, enGren: 0, skift: 0, sandsynlig: 0, stop: 0, toppes: 0, indkasseres: 0, spilles: 0, thirdIf: 0 };

// Med FB_DESCRIBE_STATS skrives tællerne, når processen slutter (bankens løsning i scripts/solve.ts); i browseren og
// i testene sker intet.
const proces = (globalThis as { process?: { env?: Record<string, string | undefined>; on?(event: string, f: () => void): void } }).process;
if (proces?.env?.FB_DESCRIBE_STATS && proces.on) proces.on('exit', () => console.log(`beskrivelser ${JSON.stringify(DESCRIBE_STATS)}`));

/** Stillingen undervejs: spilførerens abstrakte kort, hullerne og de fysiske kort i hver hånd. */
export interface WalkState {
  decl: { rank: Rank; hand: Hand }[];
  gaps: number[];
  physical: Record<Hand, Rank[]>;
}

export interface Choice {
  rank: Rank; // fysisk kort
  winner: boolean;
  lowest: boolean;
}

const HONOR_NAME: Record<number, string> = { 14: 'esset', 13: 'kongen', 12: 'damen', 11: 'knægten', 10: "10'eren" };
const HAND_NAME: Record<Hand, string> = { N: 'bordet', S: 'hånden' };
const MAX_ROUNDS = 4;

const other = (h: Hand): Hand => (h === 'N' ? 'S' : 'N');
const capital = (s: string) => s[0].toUpperCase() + s.slice(1);
export const cardName = (rank: Rank) => HONOR_NAME[rank] ?? `${rank}'eren`;

/** Den abstrakte gruppe, der indeholder kortet med rang `rank` i hånden `hand`. */
function group(state: WalkState, hand: Hand, rank: Rank): number[] {
  const j = state.decl.findIndex((d) => d.rank === rank && d.hand === hand);
  const g = [j];
  for (let k = j - 1; k >= 0 && state.gaps[k + 1] === 0; k--) if (state.decl[k].hand === hand) g.unshift(k);
  for (let k = j + 1; k < state.decl.length && state.gaps[k] === 0; k++) if (state.decl[k].hand === hand) g.push(k);
  return g;
}

export function choice(state: WalkState, hand: Hand, abstractLow: Rank): Choice {
  const g = group(state, hand, abstractLow);
  const abstract = state.decl.filter((d) => d.hand === hand).map((d) => d.rank);
  const phys = [...state.physical[hand]].sort((a, b) => b - a);
  const ranks = g.map((j) => phys[abstract.indexOf(state.decl[j].rank)]);
  let winner = true;
  for (let q = 0; q <= g[0]; q++) if (state.gaps[q] > 0) winner = false;
  const last = g[g.length - 1];
  return {
    rank: Math.max(...ranks),
    winner,
    lowest: !state.decl.slice(last + 1).some((d) => d.hand === hand),
  };
}

function gapIndex(state: WalkState, high: Rank): number {
  return high === 0 ? -1 : state.decl.filter((d) => d.rank > high).length;
}

function removeDeclarer(state: WalkState, rank: Rank) {
  const j = state.decl.findIndex((d) => d.rank === rank);
  state.decl.splice(j, 1);
  state.gaps.splice(j, 2, state.gaps[j] + state.gaps[j + 1]);
}

/** Er resultatet afgjort ved knuden: samme værdi i alle sidninger? */
function decided(game: Game, node: number, values: Int32Array): boolean {
  const st = game.nodeItemStart[node], cnt = game.nodeItemCount[node];
  for (let i = st + 1; i < st + cnt; i++) if (values[i] !== values[st]) return false;
  return true;
}

export function initialState(game: Game): WalkState {
  return {
    decl: game.declarer.map((d) => ({ ...d })),
    gaps: [...game.gaps],
    physical: { N: [...game.north], S: [...game.south] },
  };
}

const cloneState = (s: WalkState): WalkState => ({ decl: s.decl.map((d) => ({ ...d })), gaps: [...s.gaps], physical: { N: [...s.physical.N], S: [...s.physical.S] } });

/**
 * Spiller et stik i stillingen: udspillet (`slot` ved en LEAD-knude), 2. hånd (`s2`), 3. hånd (`s3`) og 4. hånd (`s4`).
 * Giver de fysiske kort, spilføreren lagde.
 */
export function playTrick(game: Game, state: WalkState, slot: number, s2: number, s3: number, s4: number): { led: Choice; third: Choice | null } {
  const hand: Hand = game.slotHand[slot] === 0 ? 'N' : 'S';
  const partner = other(hand);
  const led = choice(state, hand, game.slotLow[slot]);
  const third = game.slotHigh[s3] === 0 ? null : choice(state, partner, game.slotLow[s3]);
  const q2 = gapIndex(state, game.slotHigh[s2]);
  const q4 = gapIndex(state, game.slotHigh[s4]);
  if (q2 >= 0) state.gaps[q2]--;
  if (q4 >= 0) state.gaps[q4]--;
  state.physical[hand] = state.physical[hand].filter((r) => r !== led.rank);
  if (third) state.physical[partner] = state.physical[partner].filter((r) => r !== third.rank);
  for (const r of [game.slotLow[slot], third ? game.slotLow[s3] : 0].filter((r) => r > 0).sort((a, b) => a - b)) {
    removeDeclarer(state, r);
  }
  return { led, third };
}

export function describeLine(game: Game, strategy: Int8Array, leadSlot: number): LineDescription {
  const described = describeFrom(game, strategy, leadSlot, initialState(game), itemValues(game, game.root, strategy), { branches: true });
  return { ...described, line: { ...described.line, steps: playableSteps(game, strategy, leadSlot, described.line.steps) } };
}

const lineOf = (steps: LineStep[]) => ({ id: '', text: '', steps });
const isConcrete = (card: string) => card !== 'low' && card !== 'high';

/**
 * Trinet med færrest mulige kort udskiftet med "high", så det kan spilles på alle grene. `earlier` er trinene før det.
 * null, hvis det ikke kan lade sig gøre.
 */
function playableStep(game: Game, earlier: LineStep[], step: LineStep): LineStep | null {
  const fields: ((s: LineStep) => void)[] = [];
  if (isConcrete(step.card)) fields.push((s) => { s.card = 'high'; });
  if (step.third && isConcrete(step.third.play)) fields.push((s) => { s.third!.play = 'high'; });
  if (step.third && isConcrete(step.third.else)) fields.push((s) => { s.third!.else = 'high'; });
  const subsets = Array.from({ length: 1 << fields.length }, (_, m) => m).sort((a, b) => bitCount(a) - bitCount(b) || a - b);
  for (const subset of subsets) {
    const candidate: LineStep = { ...step, ...(step.third ? { third: { ...step.third } } : {}) };
    fields.forEach((change, i) => { if (subset & (1 << i)) change(candidate); });
    if (!lineMask(game, lineOf([...earlier, candidate])).errors.length) return candidate;
  }
  return null;
}

function bitCount(n: number): number {
  let count = 0;
  for (let m = n; m; m >>= 1) count += m & 1;
  return count;
}

/** Tillader trinene løserens eget valg på alle de grene, løseren kan komme ud på? */
function followsStrategy(game: Game, strategy: Int8Array, leadSlot: number, steps: LineStep[]): boolean {
  const { allowed } = lineMask(game, lineOf(steps));
  const visit = (node: number): boolean => {
    const kind = game.kind[node];
    if (kind === END) return true;
    const start = game.childStart[node];
    if (kind === LEAD || kind === THIRD) {
      const slot = start + strategy[node];
      return allowed[slot] === 1 && visit(game.children[slot]);
    }
    for (let x = 0; x < game.childCount[node]; x++) if (!visit(game.children[start + x])) return false;
    return true;
  };
  return allowed[leadSlot] === 1 && visit(game.children[leadSlot]);
}

/**
 * Trinene skrives fra hovedvejen, men gælder på alle grene. Ligeværdige kort er ét kort i løserens træ, så et konkret
 * kort kan være brugt på en anden gren: i 2 / E K B 5 4 3 tager esset en honnør fra Øst i trin 1, og trin 2 er så kongen.
 * Sådan et kort bliver "high" (SPEC-linjeformat-39.md). Følger et trin ikke løserens valg for 3. hånd på alle grene,
 * får det regler pr. gren (`thirdIf`, SPEC-esset-slaas.md, B), når grenene kan skelnes på de kort, der er faldet. Ellers
 * slutter linjen før trinet; derefter spiller løseren videre, og linjen kan ende uden trin (SPEC-linjeplan-23.md).
 */
function playableSteps(game: Game, strategy: Int8Array, leadSlot: number, steps: LineStep[]): LineStep[] {
  const playable: LineStep[] = [];
  for (const step of steps) {
    const next = playableStep(game, playable, step);
    if (!next) break;
    if (followsStrategy(game, strategy, leadSlot, [...playable, next])) {
      playable.push(next);
      continue;
    }
    const perBranch = branchThirds(game, strategy, leadSlot, playable, next);
    if (perBranch && !lineMask(game, lineOf([...playable, perBranch])).errors.length && followsStrategy(game, strategy, leadSlot, [...playable, perBranch])) {
      DESCRIBE_STATS.thirdIf++;
      playable.push(perBranch);
      continue;
    }
    break;
  }
  return playable;
}

/** En stilling, hvor et trin spilles: LEAD-knuden, spilførerens kort og modspillets enkeltkort, der er faldet. */
interface Position {
  node: number;
  state: WalkState;
  fallen: Set<Rank>;
}

/** Stillingerne efter `depth` stik: løserens valg hos spilføreren og alle modspillets kort (ikke renoncer). */
function positionsAt(game: Game, strategy: Int8Array, leadSlot: number, depth: number): Position[] {
  let positions: Position[] = [{ node: game.root, state: initialState(game), fallen: new Set() }];
  for (let d = 0; d < depth; d++) {
    const next: Position[] = [];
    for (const pos of positions) {
      const slot = d === 0 ? leadSlot : game.childStart[pos.node] + strategy[pos.node];
      const second = game.children[slot];
      for (let x = 0; x < game.childCount[second]; x++) {
        const s2 = game.childStart[second] + x;
        if (game.slotHigh[s2] === 0) continue;
        const third = game.children[s2];
        const s3 = game.childStart[third] + strategy[third];
        const fourth = game.children[s3];
        for (let y = 0; y < game.childCount[fourth]; y++) {
          const s4 = game.childStart[fourth] + y;
          if (game.slotHigh[s4] === 0) continue;
          const lead = game.children[s4];
          if (game.kind[lead] !== LEAD) continue;
          const state = cloneState(pos.state);
          playTrick(game, state, slot, s2, s3, s4);
          const fallen = new Set(pos.fallen);
          for (const s of [s2, s4]) {
            const card = opponentCard(game, s, fallen);
            if (card) fallen.add(card);
          }
          next.push({ node: lead, state, fallen });
        }
      }
    }
    positions = next;
  }
  return positions;
}

/**
 * Modspillets kort i hullet `slot`, når hullet kun kan være ét kort. Hullets interval kan række over spilførerens
 * spillede kort (fx 13..12 for damen, når kongen er taget ud af gruppen esset-kongen), så kortet findes blandt de
 * manglende kort i intervallet, der ikke er spillet.
 */
function opponentCard(game: Game, slot: number, gone: ReadonlySet<Rank>): Rank | null {
  if (game.slotHigh[slot] === 0) return null;
  const cards = game.missing.filter((m) => m >= game.slotLow[slot] && m <= game.slotHigh[slot] && !gone.has(m));
  return cards.length === 1 ? cards[0] : null;
}

const ruleKey = (r: ThirdRule) => `${r.ifSecondPlays}|${r.play}|${r.else}`;

/** Løserens regel for 3. hånd i stillingen, eller null, når den ikke kan skrives som én regel. */
function solverRule(game: Game, strategy: Int8Array, pos: Position): ThirdRule | null {
  const lead = game.childStart[pos.node] + strategy[pos.node];
  const hand: Hand = game.slotHand[lead] === 0 ? 'N' : 'S';
  const partner = other(hand);
  const second = game.children[lead];
  const thirdFor = (s2: number): Choice | null => {
    const third = game.children[s2];
    const s3 = game.childStart[third] + strategy[third];
    return game.slotHigh[s3] === 0 ? null : choice(pos.state, partner, game.slotLow[s3]);
  };
  return consistentThird(game, second, thirdFor) ? ruleFrom(game, second, thirdFor) : null;
}

/**
 * 3. hånds regel i linjeformatet ud fra løserens valg: ét kort, når 2. hånd lægger lavt, og ét, når den lægger en
 * honnør, også en honnør under udspillet (fx damen fra Øst under bordets konge). Kræver consistentThird.
 */
function ruleFrom(game: Game, second: number, thirdFor: (slot: number) => Choice | null): ThirdRule {
  let low: Choice | null | undefined, high: Choice | null | undefined;
  for (let x = 0; x < game.childCount[second]; x++) {
    const s = game.childStart[second] + x;
    if (game.slotHigh[s] === 0) continue;
    if (secondPlaysLow(game, second, s)) low ??= thirdFor(s);
    else high ??= thirdFor(s);
  }
  const lowCard = low ? (low.lowest ? 'low' : cardsData([low.rank])) : 'low';
  const highCard = high ? (high.lowest ? 'low' : cardsData([high.rank])) : lowCard;
  return { ifSecondPlays: 'low', play: lowCard, else: highCard };
}

/**
 * Trinet med regler pr. gren for 3. hånd (B): de grene, hvor løserens 3. hånd gør noget andet end trinets regel, får
 * deres egen regel med en betingelse på de enkeltkort, modspillet har lagt i de tidligere stik. null, hvis grenene
 * ikke kan skelnes sådan.
 */
function branchThirds(game: Game, strategy: Int8Array, leadSlot: number, earlier: LineStep[], step: LineStep): LineStep | null {
  const positions = positionsAt(game, strategy, leadSlot, earlier.length);
  const base: ThirdRule = step.third ?? { ifSecondPlays: 'low', play: 'low', else: 'low' };
  const rules = positions.map((p) => solverRule(game, strategy, p));
  if (rules.some((r) => r === null)) return null;
  const groups = new Map<string, { rule: ThirdRule; members: number[] }>();
  rules.forEach((r, i) => {
    if (ruleKey(r!) === ruleKey(base)) return;
    const g = groups.get(ruleKey(r!)) ?? { rule: r!, members: [] };
    g.members.push(i);
    groups.set(ruleKey(r!), g);
  });
  if (!groups.size) return null;
  const thirdIf: NonNullable<LineStep['thirdIf']> = [];
  for (const g of groups.values()) {
    const inside = new Set(g.members);
    const common = [...positions[g.members[0]].fallen].filter((c) => g.members.every((m) => positions[m].fallen.has(c)));
    const outside = positions.filter((_, i) => !inside.has(i));
    const separates = (cards: Rank[]) => !outside.some((p) => cards.every((c) => p.fallen.has(c)));
    let cond: Rank[] | null = null;
    for (const c of common) if (!cond && separates([c])) cond = [c];
    for (let a = 0; !cond && a < common.length; a++) for (let b = a + 1; !cond && b < common.length; b++) if (separates([common[a], common[b]])) cond = [common[a], common[b]];
    if (!cond) return null;
    thirdIf.push({ if: { fallen: cond.sort((x, y) => y - x).map((r) => cardsData([r])) }, third: g.rule });
  }
  return { ...step, thirdIf };
}

/** En del af beskrivelsen; teksterne står med lille begyndelsesbogstav og uden punktum. */
interface Part {
  text: string;
  /** Formen efter "Lykkes kipningen, " (fx "spilles der lille fra begge hænder"). */
  after: string;
  /** Et sikkert stik, der spilles ud; lægges sammen med de næste. */
  cash: Rank | null;
  /** Udspillet og stillingen før stikket for et sikkert stik, så ordet (indkasseres eller toppes) kan regnes. */
  slot: number;
  state: WalkState | null;
  /** Modspillets kort, der er spillet på hovedvejen før stikket (enkeltkort i et hul). */
  gone: Set<Rank>;
  /** Hånden, der nås med en sideindgang; et sikkert stik med indgang lægges ikke sammen med andre. */
  entry: string | null;
  /** "lille fra begge hænder" uden mere; lægges sammen til "to gange". */
  lowBoth: boolean;
  label: 'Lykkes' | 'Mislykkes' | null;
  /** Kipningens kort i mærket, når to kipninger går forud (H): "Lykkes kipningen mod knægten, …". */
  labelCard: Rank | null;
}

/** Beskriver linjen fra udspillet `leadSlot` i stillingen `state`; `values` er strategiens værdi pr. item. */
export function describeFrom(game: Game, strategy: Int8Array, leadSlot: number, state: WalkState, values: Int32Array, options: DescribeOptions = {}): LineDescription {
  const parts: Part[] = [];
  const lineSteps: LineStep[] = [];
  let lineOpen = true;
  let slot = leadSlot;
  let pendingLabel: Part['label'] = null;
  let pendingCard: Rank | null = null;
  // Kipningerne på hovedvejen indtil nu; ved to eller flere nævner mærket kortet (H).
  let finesses = 0;
  const gone = new Set<Rank>(options.gone ?? []);
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const hand: Hand = game.slotHand[slot] === 0 ? 'N' : 'S';
    const partner = other(hand);
    const seat2 = hand === 'N' ? 'Øst' : 'Vest';
    const led = choice(state, hand, game.slotLow[slot]);
    const second = game.children[slot];
    const cs2 = game.childStart[second], cc2 = game.childCount[second];

    // 3. håndens kort, når 2. hånd lægger lavt og når den lægger en honnør (knægten eller højere).
    const thirdFor = (s2: number): Choice | null => {
      const third = game.children[s2];
      const s3 = game.childStart[third] + strategy[third];
      return game.slotHigh[s3] === 0 ? null : choice(state, partner, game.slotLow[s3]);
    };
    let lowSlot = -1, highSlot = -1;
    for (let x = 0; x < cc2; x++) {
      const s = cs2 + x;
      if (game.slotHigh[s] === 0) continue;
      if (secondPlaysLow(game, second, s)) lowSlot = s; // det laveste lave kort (sidste)
      else if (highSlot < 0 && game.slotLow[s] > led.rank) highSlot = s; // en honnør over udspillet
      else if (highSlot < 0 && !led.winner) highSlot = s;
    }
    const mainSlot = lowSlot >= 0 ? lowSlot : (() => {
      for (let x = cc2 - 1; x >= 0; x--) if (game.slotHigh[cs2 + x] !== 0) return cs2 + x;
      return -1;
    })();
    if (mainSlot < 0) break;
    const low = lowSlot >= 0 ? thirdFor(lowSlot) : null;
    const high = highSlot >= 0 ? thirdFor(highSlot) : null;
    const covers = highSlot >= 0 && game.slotLow[highSlot] > led.rank;

    let text = '';
    let cash: Rank | null = null;
    let kipning = false;
    let finesseCard: Rank | null = null;
    let lowBoth = false;
    const ledLow = led.lowest && led.rank < TEN;
    // Et udspil, der bruger en indgang, nævner hånden i "Hånden nås …", ikke efter kortet.
    const entry = game.slotEntry[slot] === 1;
    const from = entry ? '' : ` fra ${HAND_NAME[hand]}`;
    let after: string | null = null;
    if (led.winner && (!low || low.lowest) && (!high || high.lowest)) {
      if (ledLow) text = `lille${from}`;
      else cash = led.rank;
    } else if (ledLow) {
      const toward = low ?? high;
      if (!toward) text = `lille${from}`;
      else if (toward.winner) text = `lille${from} til ${cardName(toward.rank)}`;
      // Det laveste kort er kun "lille" under 10; en honnør, der ikke er sikker vinder, er en kipning (fx E D 10 / 3 2).
      else if (toward.lowest && toward.rank < TEN) {
        text = 'lille fra begge hænder';
        lowBoth = !entry;
      } else {
        text = `lille${from} mod ${cardName(toward.rank)} (kipning)`;
        kipning = true;
        finesseCard = toward.rank;
        finesses++;
      }
      if (low && high && high.rank !== low.rank) {
        text += `; lægger ${seat2} en honnør, ${high.lowest ? 'lægges der lille' : `tages den med ${cardName(high.rank)}`}`;
        lowBoth = false;
      }
    } else {
      text = `${cardName(led.rank)}${from}`;
      if (covers && high) text += `; dækker ${seat2}, ${high.lowest ? 'lægges der lille' : `tages stikket med ${cardName(high.rank)}`}`;
      if (low && covers && high) text += `, ellers ${low.lowest ? 'løber den' : `lægges ${cardName(low.rank)}`}`;
      else if (low) text += `; ${low.lowest ? 'den løber' : `${cardName(low.rank)} lægges`}`;
      // En honnør uden mere at sige om stikket (D): "Damen spilles fra hånden."
      if (!(covers && high) && !low && !entry) {
        text = `${cardName(led.rank)} spilles${from}`;
        after = `spilles ${cardName(led.rank)}${from}`;
        DESCRIBE_STATS.spilles++;
      }
    }
    let entryHand: string | null = null;
    if (entry) {
      entryHand = HAND_NAME[hand];
      if (cash === null) {
        after = `nås ${HAND_NAME[hand]} med en sideindgang, og der spilles ${text}`;
        text = `${HAND_NAME[hand]} nås med en sideindgang, og der spilles ${text}`;
      }
    }
    parts.push({ text, after: after ?? (text.startsWith('lille') ? `spilles der ${text}` : `spilles ${text}`), cash, slot, state: cash !== null ? cloneState(state) : null, gone: new Set(gone), entry: entryHand, lowBoth, label: pendingLabel, labelCard: pendingLabel ? pendingCard : null });
    pendingLabel = null;
    pendingCard = null;

    // Linjeformatet: trinet skrives, så længe 3. hånd følger én regel for lave kort og én for honnører.
    if (lineOpen) {
      if (consistentThird(game, second, thirdFor)) {
        const step: LineStep = { leadFrom: hand, card: ledLow ? 'low' : cardsData([led.rank]) };
        const rule = ruleFrom(game, second, thirdFor);
        if (rule.play !== 'low' || rule.else !== 'low') step.third = rule;
        lineSteps.push(step);
      } else lineOpen = false;
    }

    // Hovedvejen: 3. hånd efter strategien, 4. hånd stikker billigst, ellers lavt.
    const third = game.children[mainSlot];
    const s3 = game.childStart[third] + strategy[third];
    const thirdChoice = game.slotHigh[s3] === 0 ? null : choice(state, partner, game.slotLow[s3]);
    const fourth = game.children[s3];
    const ours = Math.max(led.rank, thirdChoice ? thirdChoice.rank : 0);
    const partnerWins = game.slotLow[mainSlot] > ours;
    const cs4 = game.childStart[fourth], cc4 = game.childCount[fourth];
    let s4 = -1;
    let stopHere = false;
    // Efter en kipning (A): den gren, hvor målet ikke er afgjort; er begge åbne, den mest sandsynlige.
    if (kipning && options.branches && !partnerWins) {
      pendingCard = finesses >= 2 ? finesseCard : null;
      const choiceAfter = afterFinesse(game, fourth, ours, values);
      if (choiceAfter?.one) {
        // Kun én gren: hovedvejen er dagens, men teksten siger stadig hvilken (E).
        DESCRIBE_STATS.enGren++;
        pendingLabel = choiceAfter.label;
      } else if (choiceAfter) {
        DESCRIBE_STATS.kipninger++;
        if (choiceAfter.stop) {
          stopHere = true;
          DESCRIBE_STATS.stop++;
        } else {
          s4 = choiceAfter.slot;
          pendingLabel = choiceAfter.label;
          if (choiceAfter.label === 'Lykkes') DESCRIBE_STATS.skift++;
          if (choiceAfter.byWeight) DESCRIBE_STATS.sandsynlig++;
        }
      }
    }
    if (s4 < 0 && !partnerWins) for (let x = cc4 - 1; x >= 0; x--) if (game.slotHigh[cs4 + x] !== 0 && game.slotLow[cs4 + x] > ours) { s4 = cs4 + x; break; }
    if (s4 < 0) for (let x = cc4 - 1; x >= 0; x--) if (game.slotHigh[cs4 + x] !== 0) { s4 = cs4 + x; break; }
    if (s4 < 0) break; // 4. hånd kan ikke bekende: kendt sidning
    const next = game.children[s4];

    // Linjen slutter, hvis næste udspil afhænger af, hvad modspillet lagde.
    if (lineOpen && !sameNextLead(game, strategy, second)) lineOpen = false;

    // Opdater tilstanden efter stikket; et enkeltkort fra modspillet er spillet.
    playTrick(game, state, slot, mainSlot, s3, s4);
    for (const s of [mainSlot, s4]) {
      const card = opponentCard(game, s, gone);
      if (card) gone.add(card);
    }

    if (stopHere || game.kind[next] !== LEAD || decided(game, next, values)) {
      pendingLabel = null;
      break;
    }
    slot = game.childStart[next] + strategy[next];
  }
  return { steps: joinParts(game, strategy, values, parts, options), line: { id: '', text: '', steps: lineSteps } };
}

/**
 * Grenene efter en kipning ved 4. håndens knude: kipningen mislykkes i de sidninger, hvor 4. hånd kan stikke over, og
 * lykkes i resten. Findes kun den ene gren (`one`), er der intet at vælge: hovedvejen er dagens, og mærket er grenens.
 */
function afterFinesse(game: Game, fourth: number, ours: number, values: Int32Array): { stop: boolean; slot: number; label: 'Lykkes' | 'Mislykkes'; byWeight: boolean; one?: boolean } | null {
  const cs = game.childStart[fourth], cc = game.childCount[fourth];
  const over: number[] = [], under: number[] = [];
  for (let x = 0; x < cc; x++) {
    if (game.slotHigh[cs + x] === 0) continue;
    (game.slotLow[cs + x] > ours ? over : under).push(x);
  }
  if (!over.length && !under.length) return null;
  if (!over.length) return { stop: false, slot: -1, label: 'Lykkes', byWeight: false, one: true };
  if (!under.length) return { stop: false, slot: -1, label: 'Mislykkes', byWeight: false, one: true };
  const st = game.nodeItemStart[fourth], cnt = game.nodeItemCount[fourth];
  const fail: number[] = [], success: number[] = [];
  for (let i = st; i < st + cnt; i++) {
    const ics = game.itemChildStart[i];
    (over.some((x) => game.itemChildren[ics + x] >= 0) ? fail : success).push(i);
  }
  if (!fail.length) return { stop: false, slot: -1, label: 'Lykkes', byWeight: false, one: true };
  if (!success.length) return { stop: false, slot: -1, label: 'Mislykkes', byWeight: false, one: true };
  const same = (items: number[]) => items.every((i) => values[i] === values[items[0]]);
  const weight = (items: number[]) => items.reduce((sum, i) => sum + game.layoutWeight[game.itemLayout[i]], 0);
  const cheapestOver = cs + over[over.length - 1];
  const lowestUnder = cs + under[under.length - 1];
  const dFail = same(fail), dSuccess = same(success);
  if (dFail && dSuccess) return { stop: true, slot: -1, label: 'Mislykkes', byWeight: false };
  if (dFail) return { stop: false, slot: lowestUnder, label: 'Lykkes', byWeight: false };
  if (dSuccess) return { stop: false, slot: cheapestOver, label: 'Mislykkes', byWeight: false };
  const wFail = weight(fail), wSuccess = weight(success);
  // Ved lige stand gælder dagens regel: 4. hånd stikker så billigt som muligt.
  if (wSuccess > wFail) return { stop: false, slot: lowestUnder, label: 'Lykkes', byWeight: true };
  return { stop: false, slot: cheapestOver, label: 'Mislykkes', byWeight: wFail > wSuccess };
}

/**
 * Ordet for et eller flere sikre stik i træk (D), spillet fra udspillet `slot` i stillingen `start`. Honnøren er et
 * af modpartens kort, der er knægten eller højere, ikke er spillet (`gone`) og ligger mellem det laveste af kortene og
 * spilførerens næste kort. 10'eren tæller også, når den er det eneste af modpartens kort dér (G, Franks afgørelse
 * 6. november 2026); skal også mindre kort falde, er det fordelingen, og ordet er "indkasseres".
 * Den er faldet, når modparten efter de `tricks` stik ikke har noget kort over spilførerens højeste kort: i løserens
 * træ er kortene i et hul ligeværdige, så "damen falder" er det samme som "hullet med damen er tømt". Det hedder
 * "toppes", når det bedste resultat i de sidninger, hvor honnøren ikke falder, er dårligere end i dem, hvor den falder;
 * ellers "indkasseres". Modspillet lægger, som det er værst for spilføreren, og ved lige stand det laveste kort.
 */
function wordFor(game: Game, strategy: Int8Array, values: Int32Array, slot: number, start: WalkState, cards: Rank[], gone: ReadonlySet<Rank>): 'toppes' | 'indkasseres' {
  const lowest = Math.min(...cards);
  const ours = [...start.physical.N, ...start.physical.S].filter((r) => !cards.includes(r));
  const next = Math.max(0, ...ours.filter((r) => r < lowest));
  const between = game.missing.filter((m) => !gone.has(m) && m < lowest && m > next);
  if (!between.some((m) => m >= JACK) && !(between.length === 1 && between[0] === TEN)) return 'indkasseres';
  const node = game.parent[game.children[slot]];
  const st = game.nodeItemStart[node], cnt = game.nodeItemCount[node];
  let maxFell = -Infinity, maxKept = -Infinity, nFell = 0, nKept = 0;
  for (let i = st; i < st + cnt; i++) {
    const state = cloneState(start);
    let item = i, at = node, value: number | null = null;
    for (let t = 0; t < cards.length && game.kind[at] === LEAD; t++) {
      // Et stik: udspillet (det beskrevne i første stik), 2. hånd, 3. hånd og 4. hånd for denne sidning.
      const plays: number[] = [];
      for (let k = 0; k < 4 && game.kind[at] !== END; k++) {
        const kind = game.kind[at];
        const cs = game.childStart[at];
        const ics = game.itemChildStart[item];
        let x = -1;
        if (kind === LEAD) x = t === 0 ? slot - cs : strategy[at];
        else if (kind === THIRD) x = strategy[at];
        else {
          let best = Infinity;
          for (let y = 0; y < game.childCount[at]; y++) {
            const c = game.itemChildren[ics + y];
            if (c >= 0 && values[c] <= best) { best = values[c]; x = y; }
          }
        }
        if (x < 0) break;
        const child = game.itemChildren[ics + x];
        if (child < 0) break;
        plays.push(cs + x);
        // Sidningens værdi med det beskrevne udspil (strategien ved roden kan vælge et andet).
        if (value === null) value = values[child];
        item = child;
        at = game.children[cs + x];
      }
      if (plays.length < 4) break;
      playTrick(game, state, plays[0], plays[1], plays[2], plays[3]);
    }
    if (value === null) continue;
    const fell = state.gaps[0] === 0;
    if (fell) { nFell++; maxFell = Math.max(maxFell, value); } else { nKept++; maxKept = Math.max(maxKept, value); }
  }
  return nFell > 0 && nKept > 0 && maxKept < maxFell ? 'toppes' : 'indkasseres';
}

const listOf = (names: string[]) => (names.length > 1 ? `${names.slice(0, -1).join(', ')} og ${names[names.length - 1]}` : names[0]);
const TIMES: Record<number, string> = { 2: ' to gange', 3: ' tre gange' };

/**
 * Delene som sætninger: sikre stik i træk lægges sammen ("Esset og kongen indkasseres.", "Farven toppes med esset og
 * kongen."), og med `branches` også lille fra begge hænder ("Lille fra begge hænder to gange."). En del med mærket
 * begynder en ny sætning: "Lykkes kipningen, indkasseres esset."
 */
function joinParts(game: Game, strategy: Int8Array, values: Int32Array, parts: Part[], options: DescribeOptions): string[] {
  const groups: Part[][] = [];
  for (const p of parts) {
    const last = groups.at(-1);
    const head = last?.[0];
    if (last && head && !p.label && p.cash !== null && !p.entry && head.cash !== null && !head.entry) last.push(p);
    else if (last && head && !p.label && options.branches && p.lowBoth && head.lowBoth) last.push(p);
    else groups.push([p]);
  }
  return groups.map((g) => {
    const head = g[0];
    let text: string, after: string;
    if (head.cash !== null) {
      const word = wordFor(game, strategy, values, head.slot, head.state!, g.map((p) => p.cash!), head.gone);
      DESCRIBE_STATS[word]++;
      const list = listOf(g.map((p) => cardName(p.cash!)));
      const inner = word === 'toppes' ? `farven toppes med ${list}` : `${list} indkasseres`;
      const innerAfter = word === 'toppes' ? `toppes farven med ${list}` : `indkasseres ${list}`;
      if (head.entry) {
        text = `${head.entry} nås med en sideindgang, og ${inner}`;
        after = `nås ${head.entry} med en sideindgang, og ${inner}`;
      } else {
        text = inner;
        after = innerAfter;
      }
    } else if (head.lowBoth && g.length > 1) {
      const times = TIMES[g.length] ?? ` ${g.length} gange`;
      text = `lille fra begge hænder${times}`;
      after = `spilles der lille fra begge hænder${times}`;
    } else {
      text = head.text;
      after = head.after;
    }
    const label = head.labelCard ? `${head.label} kipningen mod ${cardName(head.labelCard)}` : `${head.label} kipningen`;
    return head.label ? `${label}, ${after}.` : `${capital(text)}.`;
  });
}

/** Følger 3. hånd én regel for lave kort og én for honnører fra 2. hånd? */
function consistentThird(game: Game, second: number, thirdFor: (slot: number) => Choice | null): boolean {
  const lows = new Set<number>(), highs = new Set<number>();
  for (let x = 0; x < game.childCount[second]; x++) {
    const s = game.childStart[second] + x;
    if (game.slotHigh[s] === 0) continue; // kendt sidning: linjen slutter
    const c = thirdFor(s);
    (secondPlaysLow(game, second, s) ? lows : highs).add(c ? c.rank : 0);
  }
  return lows.size <= 1 && highs.size <= 1;
}

/** Er næste udspil det samme, uanset hvad modspillet lagde i stikket (bortset fra renoncer)? */
function sameNextLead(game: Game, strategy: Int8Array, second: number): boolean {
  let signature: string | null = null;
  for (let x = 0; x < game.childCount[second]; x++) {
    const s2 = game.childStart[second] + x;
    if (game.slotHigh[s2] === 0) continue;
    const third = game.children[s2];
    const fourth = game.children[game.childStart[third] + strategy[third]];
    for (let y = 0; y < game.childCount[fourth]; y++) {
      const s4 = game.childStart[fourth] + y;
      if (game.slotHigh[s4] === 0) continue;
      const next = game.children[s4];
      if (game.kind[next] === END) continue;
      const s = game.childStart[next] + strategy[next];
      const sig = `${game.slotHand[s]}:${game.slotHigh[s]}`;
      if (signature === null) signature = sig;
      else if (sig !== signature) return false;
    }
  }
  return true;
}
