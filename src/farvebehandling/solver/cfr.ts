import { END, FOURTH, LEAD, SECOND, THIRD, type Game } from './game';
import { naturalize } from './natural';

/**
 * Optimalt modspil: et tospersonersspil med skjult information. Spilføreren maksimerer og ser kun de spillede kort;
 * modspillet minimerer og kender alle kort. Spillet løses med CFR+ (counterfactual regret minimization), der lærer
 * begge siders blandede strategier.
 *
 * Grænser: modspillets bedste svar på spilførerens gennemsnitlige strategi giver en nedre grænse for værdien,
 * spilførerens bedste svar på modspillets gennemsnitlige strategi en øvre grænse.
 *
 * Certificering: løseren søger en ren linje (ét valg i hver af spilførerens knuder). Linjens garanti regnes eksakt med
 * BigInt: modspillet vælger i hver sidning det værste for spilføreren. Ligger garantien inden for `tolerance` af den
 * øvre grænse, er linjen optimal på nær `tolerance`, og dens eksakte værdi er resultatet.
 */
export interface SubgameOptions {
  /** Tilladte barn-slots for spilføreren (1 = tilladt); udeladt = alle. Bruges til håndskrevne linjer. */
  allowed?: Uint8Array;
  /** En ren linje er certificeret, når dens garanti ligger så tæt på den øvre grænse. */
  tolerance?: number;
  /**
   * Løseren stopper også, når grænserne ligger så tæt, selv uden en certificeret ren linje. Så kræver det optimale
   * spil, at spilføreren blander (fx om en honnør skal dækkes), og værdien er midten af grænserne.
   */
  gapTolerance?: number;
  maxIterations?: number;
}

export interface SubgameSolution {
  root: number;
  /** Den rene linjes garanti (eller midten af grænserne, hvis ingen ren linje er certificeret). */
  value: number;
  /** Den rene linjes garanti som tæller over game.denominator (vægtet med sidningernes chance). */
  exact: bigint;
  /** Summen af sidningernes vægt i delspillet (normalt game.denominator). */
  weight: bigint;
  lower: number;
  upper: number;
  certified: boolean;
  iterations: number;
  /** Valgt barn i hver af spilførerens knuder i delspillet; −1 uden for. */
  strategy: Int8Array;
  /** Garantien pr. sidning (indeks i game.layouts): 1/0 for et mål, stik for parturnering. */
  layoutValues: Int32Array;
}

const isDeclarer = (k: number) => k === LEAD || k === THIRD;
const isDefender = (k: number) => k === SECOND || k === FOURTH;

export function solveSubgame(game: Game, root: number, options: SubgameOptions = {}): SubgameSolution {
  const { kind, childStart, childCount, children, itemNode, itemChildStart, itemChildren, nodeItemStart, nodeItemCount, itemLayout, layoutWeight, payoff } = game;
  const allowed = options.allowed;
  const tolerance = options.tolerance ?? 2e-5;
  const gapTolerance = options.gapTolerance ?? 1e-4;
  const maxIterations = options.maxIterations ?? 20_000;
  const n0 = root, n1 = game.subtreeEnd[root];
  const i0 = nodeItemStart[n0];
  const i1 = n1 < kind.length ? nodeItemStart[n1] : itemNode.length;
  const rS = nodeItemStart[n0], rC = nodeItemCount[n0];
  const slotsD = children.length, slotsF = itemChildren.length;
  const regD = new Float64Array(slotsD), avgD = new Float64Array(slotsD), sigD = new Float64Array(slotsD);
  const regF = new Float64Array(slotsF), avgF = new Float64Array(slotsF), sigF = new Float64Array(slotsF);
  const nodesN = kind.length, itemsN = itemNode.length;
  const q = new Float64Array(itemsN), W = new Float64Array(nodesN), piD = new Float64Array(nodesN);
  const piO = new Float64Array(itemsN), piF = new Float64Array(itemsN), u = new Float64Array(itemsN);
  const ok = (slot: number) => !allowed || allowed[slot] === 1;

  let rootWeight = 0, rootExactWeight = 0n;
  for (let x = 0; x < rC; x++) {
    rootWeight += layoutWeight[itemLayout[rS + x]];
    rootExactWeight += game.layouts[itemLayout[rS + x]].weight;
  }

  function declarerStrategy(source: Float64Array, target: Float64Array) {
    for (let node = n0; node < n1; node++) {
      if (!isDeclarer(kind[node])) continue;
      const cs = childStart[node], cc = childCount[node];
      let s = 0, m = 0;
      for (let x = 0; x < cc; x++) if (ok(cs + x)) { s += source[cs + x]; m++; }
      for (let x = 0; x < cc; x++) target[cs + x] = !ok(cs + x) ? 0 : s > 0 ? source[cs + x] / s : 1 / m;
    }
  }
  function defenderStrategy(source: Float64Array, target: Float64Array) {
    for (let i = i0; i < i1; i++) {
      const node = itemNode[i];
      if (!isDefender(kind[node])) continue;
      const cs = itemChildStart[i], cc = childCount[node];
      let s = 0, m = 0;
      for (let x = 0; x < cc; x++) if (itemChildren[cs + x] >= 0) { s += source[cs + x]; m++; }
      for (let x = 0; x < cc; x++) target[cs + x] = itemChildren[cs + x] < 0 ? 0 : s > 0 ? source[cs + x] / s : 1 / m;
    }
  }

  function iterate(t: number) {
    // Spilføreren opdaterer mod modspillets nuværende strategi.
    defenderStrategy(regF, sigF);
    declarerStrategy(regD, sigD);
    for (let i = i0; i < i1; i++) q[i] = 0;
    for (let x = 0; x < rC; x++) q[rS + x] = layoutWeight[itemLayout[rS + x]];
    for (let i = i0; i < i1; i++) {
      const qi = q[i];
      if (qi === 0) continue;
      const node = itemNode[i], k = kind[node];
      if (k === END) continue;
      const cs = itemChildStart[i], cc = childCount[node];
      if (isDefender(k)) {
        for (let x = 0; x < cc; x++) { const c = itemChildren[cs + x]; if (c >= 0) q[c] += qi * sigF[cs + x]; }
      } else for (let x = 0; x < cc; x++) q[itemChildren[cs + x]] += qi;
    }
    for (let node = n0; node < n1; node++) piD[node] = 0;
    piD[n0] = 1;
    for (let node = n0; node < n1; node++) {
      const p = piD[node];
      if (p === 0) continue;
      const k = kind[node];
      if (k === END) continue;
      const cs = childStart[node], cc = childCount[node];
      if (isDeclarer(k)) {
        for (let x = 0; x < cc; x++) { const s = sigD[cs + x]; piD[children[cs + x]] += p * s; avgD[cs + x] += t * p * s; }
      } else for (let x = 0; x < cc; x++) piD[children[cs + x]] += p;
    }
    for (let node = n1 - 1; node >= n0; node--) {
      const k = kind[node];
      if (k === END) {
        let a = 0;
        const st = nodeItemStart[node], c = nodeItemCount[node];
        for (let i = st; i < st + c; i++) a += q[i];
        W[node] = a * payoff[node];
        continue;
      }
      const cs = childStart[node], cc = childCount[node];
      if (isDefender(k)) {
        let a = 0;
        for (let x = 0; x < cc; x++) a += W[children[cs + x]];
        W[node] = a;
      } else {
        let a = 0;
        for (let x = 0; x < cc; x++) a += sigD[cs + x] * W[children[cs + x]];
        W[node] = a;
        for (let x = 0; x < cc; x++) {
          if (!ok(cs + x)) continue;
          const r = regD[cs + x] + W[children[cs + x]] - a;
          regD[cs + x] = r > 0 ? r : 0;
        }
      }
    }
    // Modspillet opdaterer mod spilførerens nye strategi.
    declarerStrategy(regD, sigD);
    for (let i = i0; i < i1; i++) { piO[i] = 0; piF[i] = 0; }
    for (let x = 0; x < rC; x++) { piO[rS + x] = layoutWeight[itemLayout[rS + x]]; piF[rS + x] = 1; }
    for (let i = i0; i < i1; i++) {
      const po = piO[i], pf = piF[i];
      if (po === 0 && pf === 0) continue;
      const node = itemNode[i], k = kind[node];
      if (k === END) continue;
      const cs = itemChildStart[i], cc = childCount[node];
      if (isDefender(k)) {
        for (let x = 0; x < cc; x++) {
          const c = itemChildren[cs + x];
          if (c < 0) continue;
          const s = sigF[cs + x];
          piO[c] += po;
          piF[c] += pf * s;
          avgF[cs + x] += t * pf * s;
        }
      } else {
        const ns = childStart[node];
        for (let x = 0; x < cc; x++) { const c = itemChildren[cs + x]; piO[c] += po * sigD[ns + x]; piF[c] += pf; }
      }
    }
    for (let i = i1 - 1; i >= i0; i--) {
      const node = itemNode[i], k = kind[node];
      if (k === END) { u[i] = payoff[node]; continue; }
      const cs = itemChildStart[i], cc = childCount[node];
      if (isDefender(k)) {
        let a = 0;
        for (let x = 0; x < cc; x++) { const c = itemChildren[cs + x]; if (c >= 0) a += sigF[cs + x] * u[c]; }
        u[i] = a;
        const po = piO[i];
        if (po > 0) {
          for (let x = 0; x < cc; x++) {
            const c = itemChildren[cs + x];
            if (c < 0) continue;
            const r = regF[cs + x] + po * (a - u[c]);
            regF[cs + x] = r > 0 ? r : 0;
          }
        }
      } else {
        const ns = childStart[node];
        let a = 0;
        for (let x = 0; x < cc; x++) a += sigD[ns + x] * u[itemChildren[cs + x]];
        u[i] = a;
      }
    }
  }

  const v = new Float64Array(itemsN), rw = new Float64Array(itemsN), V = new Float64Array(nodesN);
  const exactValues = new Int32Array(itemsN);

  function bounds() {
    declarerStrategy(avgD, sigD);
    defenderStrategy(avgF, sigF);
    // Nedre grænse: modspillet svarer bedst pr. sidning på spilførerens gennemsnit.
    for (let i = i1 - 1; i >= i0; i--) {
      const node = itemNode[i], k = kind[node];
      if (k === END) { v[i] = payoff[node]; continue; }
      const cs = itemChildStart[i], cc = childCount[node];
      if (isDefender(k)) {
        let b = Infinity;
        for (let x = 0; x < cc; x++) { const c = itemChildren[cs + x]; if (c >= 0 && v[c] < b) b = v[c]; }
        v[i] = b;
      } else {
        const ns = childStart[node];
        let a = 0;
        for (let x = 0; x < cc; x++) a += sigD[ns + x] * v[itemChildren[cs + x]];
        v[i] = a;
      }
    }
    let lower = 0;
    for (let x = 0; x < rC; x++) lower += layoutWeight[itemLayout[rS + x]] * v[rS + x];
    // Øvre grænse: spilføreren svarer bedst på modspillets gennemsnit.
    for (let i = i0; i < i1; i++) rw[i] = 0;
    for (let x = 0; x < rC; x++) rw[rS + x] = layoutWeight[itemLayout[rS + x]];
    for (let i = i0; i < i1; i++) {
      const r = rw[i];
      if (r === 0) continue;
      const node = itemNode[i], k = kind[node];
      if (k === END) continue;
      const cs = itemChildStart[i], cc = childCount[node];
      if (isDefender(k)) {
        for (let x = 0; x < cc; x++) { const c = itemChildren[cs + x]; if (c >= 0) rw[c] += r * sigF[cs + x]; }
      } else for (let x = 0; x < cc; x++) rw[itemChildren[cs + x]] += r;
    }
    const pureBest = new Int8Array(nodesN).fill(-1), pureAverage = new Int8Array(nodesN).fill(-1);
    for (let node = n1 - 1; node >= n0; node--) {
      const k = kind[node];
      if (k === END) {
        let a = 0;
        const st = nodeItemStart[node], c = nodeItemCount[node];
        for (let i = st; i < st + c; i++) a += rw[i];
        V[node] = a * payoff[node];
        continue;
      }
      const cs = childStart[node], cc = childCount[node];
      if (isDefender(k)) {
        let a = 0;
        for (let x = 0; x < cc; x++) a += V[children[cs + x]];
        V[node] = a;
      } else {
        let best = -Infinity, bestX = -1, avg = -1, avgX = -1;
        for (let x = 0; x < cc; x++) {
          if (!ok(cs + x)) continue;
          const c = V[children[cs + x]];
          if (c > best + 1e-13) { best = c; bestX = x; }
          if (sigD[cs + x] > avg) { avg = sigD[cs + x]; avgX = x; }
        }
        V[node] = best;
        pureBest[node] = bestX;
        pureAverage[node] = avgX;
      }
    }
    return { lower: lower / rootWeight, upper: V[n0] / rootWeight, pureBest, pureAverage };
  }

  /** Eksakt garanti for en ren strategi: tæller over game.denominator. */
  function guarantee(pure: Int8Array): bigint {
    for (let i = i1 - 1; i >= i0; i--) {
      const node = itemNode[i], k = kind[node];
      if (k === END) { exactValues[i] = payoff[node]; continue; }
      const cs = itemChildStart[i], cc = childCount[node];
      if (isDefender(k)) {
        let b = 1 << 30;
        for (let x = 0; x < cc; x++) { const c = itemChildren[cs + x]; if (c >= 0 && exactValues[c] < b) b = exactValues[c]; }
        exactValues[i] = b;
      } else exactValues[i] = exactValues[itemChildren[cs + pure[node]]];
    }
    let num = 0n;
    for (let x = 0; x < rC; x++) num += game.layouts[itemLayout[rS + x]].weight * BigInt(exactValues[rS + x]);
    return num;
  }

  let best: { exact: bigint; value: number; strategy: Int8Array; layoutValues: Int32Array } | null = null;
  let cfrLower = 0, upper = Infinity, iterations = 0;
  const first = 50, every = 50;
  for (let t = 1; t <= maxIterations; t++) {
    iterate(t);
    iterations = t;
    if (t < first || (t % every !== 0 && t !== maxIterations)) continue;
    const b = bounds();
    cfrLower = Math.max(cfrLower, b.lower);
    upper = Math.min(upper, b.upper);
    for (const pure of [b.pureAverage, b.pureBest]) {
      const exact = guarantee(pure);
      const value = Number(exact) / Number(rootExactWeight);
      if (!best || value > best.value) {
        const layoutValues = new Int32Array(game.layouts.length);
        for (let x = 0; x < rC; x++) layoutValues[itemLayout[rS + x]] = exactValues[rS + x];
        best = { exact, value, strategy: pure.slice(), layoutValues };
      }
    }
    // Ren linje certificeret.
    if (best!.value >= upper - tolerance) break;
    const gap = upper - Math.max(cfrLower, best!.value);
    // Grænserne er mødtes uden en ren linje inden for tolerancen.
    if (gap <= tolerance) break;
    // Spilføreren skal blande: grænserne er tæt på hinanden, og den bedste rene linje ligger klart under.
    if (gap <= gapTolerance && best!.value < cfrLower - gapTolerance) break;
  }
  // Lige gode træk erstattes af de mest naturlige; garantien kan kun stige.
  const natural = naturalize(game, root, best!.strategy, allowed);
  let exact = 0n;
  const layoutValues = new Int32Array(game.layouts.length);
  for (let x = 0; x < rC; x++) {
    const v = natural.values[rS + x];
    layoutValues[itemLayout[rS + x]] = v;
    exact += game.layouts[itemLayout[rS + x]].weight * BigInt(v);
  }
  const pureValue = Number(exact) / Number(rootExactWeight);
  const lower = Math.max(cfrLower, pureValue);
  const certified = pureValue >= upper - tolerance;
  return {
    root,
    value: certified ? pureValue : (lower + upper) / 2,
    exact,
    weight: rootExactWeight,
    lower,
    upper,
    certified,
    iterations,
    strategy: natural.strategy,
    layoutValues,
  };
}
