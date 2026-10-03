import { END, LEAD, SECOND, THIRD, FOURTH, type Game } from './game';

/**
 * Værdien pr. item for en ren strategi i et delspil: modspillet vælger i hver sidning det værste for spilføreren.
 * Værdierne er heltal (1/0 for et mål, stik for parturnering).
 */
export function itemValues(game: Game, root: number, strategy: Int8Array): Int32Array {
  const values = new Int32Array(game.itemNode.length);
  const n1 = game.subtreeEnd[root];
  for (let node = n1 - 1; node >= root; node--) computeNode(game, node, strategy, values);
  return values;
}

function computeNode(game: Game, node: number, strategy: Int8Array, values: Int32Array) {
  const k = game.kind[node];
  const st = game.nodeItemStart[node], cnt = game.nodeItemCount[node], cc = game.childCount[node];
  for (let i = st; i < st + cnt; i++) {
    if (k === END) values[i] = game.payoff[node];
    else if (k === SECOND || k === FOURTH) {
      let b = 1 << 30;
      const cs = game.itemChildStart[i];
      for (let x = 0; x < cc; x++) {
        const c = game.itemChildren[cs + x];
        if (c >= 0 && values[c] < b) b = values[c];
      }
      values[i] = b;
    } else values[i] = values[game.itemChildren[game.itemChildStart[i] + strategy[node]]];
  }
}

/**
 * Gør en ren linje naturlig uden at gøre den dårligere. Er flere træk lige gode, vælger løseren tilfældigt mellem dem;
 * her vælges i hver af spilførerens knuder blandt de træk, der er mindst lige så gode i alle sidninger, det mest
 * naturlige:
 * - 3. hånd lægger det laveste kort.
 * - Et udspil foretrækkes som sikker vinder ("slå esset"), dernæst som et lille kort og til sidst som andre kort.
 * Da intet træk bliver dårligere i nogen sidning, kan garantien kun stige.
 */
export function naturalize(game: Game, root: number, strategy: Int8Array, allowed?: Uint8Array): { strategy: Int8Array; values: Int32Array } {
  const result = strategy.slice();
  const values = new Int32Array(game.itemNode.length);
  const n1 = game.subtreeEnd[root];
  for (let node = n1 - 1; node >= root; node--) {
    const k = game.kind[node];
    if (k === LEAD || k === THIRD) {
      const cs = game.childStart[node], cc = game.childCount[node];
      const st = game.nodeItemStart[node], cnt = game.nodeItemCount[node];
      const current = result[node];
      const atLeastAsGood = (x: number) => {
        if (allowed && !allowed[cs + x]) return false;
        for (let i = st; i < st + cnt; i++) {
          const ics = game.itemChildStart[i];
          if (values[game.itemChildren[ics + x]] < values[game.itemChildren[ics + current]]) return false;
        }
        return true;
      };
      const candidates: number[] = [];
      for (let x = 0; x < cc; x++) if (x === current || atLeastAsGood(x)) candidates.push(x);
      result[node] = k === THIRD ? preferredThird(game, node, candidates) : preferredLead(game, node, candidates, current);
    }
    computeNode(game, node, result, values);
  }
  return { strategy: result, values };
}

/**
 * 3. hånd: har 2. hånd lagt en honnør (knægten eller højere), tages den med det billigste kort, der slår den;
 * ellers lægges det laveste kort.
 */
function preferredThird(game: Game, node: number, candidates: number[]): number {
  const secondSlot = game.childStart[game.parent[node]] + game.parentSlot[node];
  const secondHigh = game.slotHigh[secondSlot];
  const cs = game.childStart[node];
  if (secondHigh >= 11) {
    // Kandidaterne står fra højeste til laveste kort; det billigste, der slår honnøren, er det sidste over den.
    let cheapest = -1;
    for (const x of candidates) if (game.slotLow[cs + x] > secondHigh) cheapest = x;
    if (cheapest >= 0) return cheapest;
  }
  return candidates[candidates.length - 1];
}

/** Sikker vinder < laveste kort i hånden < andre; ellers løserens eget valg. */
function preferredLead(game: Game, node: number, candidates: number[], current: number): number {
  const cs = game.childStart[node], cc = game.childCount[node];
  const category = (x: number) => {
    const slot = cs + x;
    if (game.slotHigh[slot] > game.opponentHigh[node]) return 0;
    // Laveste gruppe i hånden: sidste slot med samme hånd.
    const lastOfHand = (() => {
      let last = -1;
      for (let y = 0; y < cc; y++) if (game.slotHand[cs + y] === game.slotHand[slot]) last = y;
      return last;
    })();
    return x === lastOfHand ? 1 : 2;
  };
  let best = current;
  for (const x of candidates) {
    const cx = category(x), cb = category(best);
    if (cx < cb) best = x;
  }
  return best;
}
