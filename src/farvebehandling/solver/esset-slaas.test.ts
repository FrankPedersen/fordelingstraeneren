import { describe, expect, it } from 'vitest';
import { parseCards, type Rank } from '../model/cards';
import { englishStep } from '../lineText';
import { followsLine } from '../play/play';
import { describeLine } from './describe';
import { buildGame, type Game } from './game';
import { validateLine, type Line, type LineStep } from './lines';
import { solveGame, solveLine } from './solve';
import { TEST_BANK } from '../testBank';

// Accepttest for SPEC-esset-slaas.md: hovedvejen efter en kipning (A), 3. hånds kort pr. gren (B), de nye ord (D),
// mærket for grenen (E) og "lille fra begge hænder" lagt sammen (F). Chancerne må ikke ændre sig.

const goal = (n: number) => ({ kind: 'goal', goal: n }) as const;

/** Løserens bedste linje for et mål og dens beskrivelse. Bordet (Nord) først, så hånden (Syd). */
function bestLine(north: string, south: string, n: number) {
  const game = buildGame(parseCards(north), parseCards(south), { objective: goal(n) });
  const solution = solveGame(game);
  const lead = solution.leads[solution.best];
  const text = describeLine(game, lead.strategy, lead.slot);
  // En linje uden trin kan ikke spilles som helhed (løseren spiller det hele); så er værdien NaN.
  return { game, lead, text, value: text.line.steps.length ? solveLine(game, { ...text.line, id: 'A' }).value : Number.NaN };
}

// Banken og løserens skabeloner, læst som tekst.
const BANK_FILES = import.meta.glob<string>(['../content/app/side-*.json', '../content/solutions.json', '../content/hvad-nu.json', '../content/suit-combinations.json'], { query: '?raw', import: 'default', eager: true });
const SKABELONER = import.meta.glob<string>(['./describe.ts', './whatnow.ts', './lines.ts', '../lineText.ts'], { query: '?raw', import: 'default', eager: true });
const udenKommentarer = (kode: string) => kode.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');

/** Kort til followsLine: rang pr. hånd, højeste først. */
const ranks = (s: string): Rank[] => [...parseCards(s)].sort((a, b) => b - a);

describe('Esset slås (SPEC-esset-slaas.md)', { timeout: 300_000 }, () => {
  it('nr. 1: 4 3 2 / E D 6 5, 3 stik: lykkes kipningen, indkasseres esset', () => {
    const r = bestLine('432', 'AQ65', 3);
    expect(r.text.steps[1]).toBe('Lykkes kipningen, indkasseres esset.');
    expect(r.value).toBeCloseTo(r.lead.value, 9);
  });

  it('nr. 3: 4 3 2 / E K B 5, 4 stik: lykkes kipningen, toppes farven med esset og kongen', () => {
    const r = bestLine('432', 'AKJ5', 4);
    expect(r.text.steps[1]).toBe('Lykkes kipningen, toppes farven med esset og kongen.');
    expect(r.value).toBeCloseTo(r.lead.value, 9);
  });

  it('nr. 4: 4 3 2 / K 7 6 5, 2 stik: lille fra begge hænder lægges sammen efter mærket', () => {
    const r = bestLine('432', 'K765', 2);
    expect(r.text.steps[1]).toBe('Lykkes kipningen, spilles der lille fra begge hænder to gange.');
    expect(r.value).toBeCloseTo(r.lead.value, 9);
  });

  it('nr. 7: B 3 2 / E K 5 4, 3 stik: mislykkes kipningen, indkasseres kongen', () => {
    const r = bestLine('J32', 'AK54', 3);
    expect(r.text.steps.at(-1)).toBe('Mislykkes kipningen, indkasseres kongen.');
    expect(r.value).toBeCloseTo(r.lead.value, 9);
  });

  it('nr. 8: B 3 2 / K 5 4, 1 stik: mislykkes kipningen, går teksten videre med den næste kipning', () => {
    const r = bestLine('J32', 'K54', 1);
    expect(r.text.steps[1]).toMatch(/^Mislykkes kipningen, spilles der lille fra hånden mod knægten \(kipning\)/);
    // En linje uden trin spilles helt af løseren og kan ikke spilles som helhed.
    if (r.text.line.steps.length) expect(r.value).toBeCloseTo(r.lead.value, 9);
  });

  it("G: 10'eren er honnør, når den er det eneste kort, der skal falde: E 2 / D B 9 8 7 (4 stik) og E D 2 / B 9 8 7 (3 stik) toppes", () => {
    const r = bestLine('A2', 'QJ987', 4);
    expect(r.text.steps.at(-1)).toBe('Mislykkes kipningen, toppes farven med knægten.');
    expect(englishStep(r.text.steps.at(-1)!)).toBe('If the finesse fails, the jack is played for the drop.');
    expect(r.value).toBeCloseTo(r.lead.value, 9);
    const s = bestLine('AQ2', 'J987', 3);
    expect(s.text.steps.at(-1)).toBe('Mislykkes kipningen, toppes farven med esset og knægten.');
    expect(s.value).toBeCloseTo(s.lead.value, 9);
  });

  it('G: skal også mindre kort falde, er det fordelingen: B 3 2 / E K 5 4 og E 3 2 / D B 5 4 (3 stik) indkasseres', () => {
    expect(bestLine('J32', 'AK54', 3).text.steps.at(-1)).toBe('Mislykkes kipningen, indkasseres kongen.');
    expect(bestLine('A32', 'QJ54', 3).text.steps.at(-1)).toBe('Mislykkes kipningen, indkasseres knægten.');
  });

  it('H: når to kipninger går forud, nævner mærket kortet: B 3 2 / K 6 5 4 (2 stik)', () => {
    const r = bestLine('J32', 'K654', 2);
    // Én kipning forud: mærket er uændret.
    expect(r.text.steps[1]).toMatch(/^Mislykkes kipningen, spilles der lille fra hånden mod knægten \(kipning\)/);
    expect(r.text.steps[2]).toBe('Lykkes kipningen mod knægten, spilles der lille fra begge hænder.');
    expect(englishStep(r.text.steps[2])).toBe('If the finesse towards the jack succeeds, low from both hands.');
    expect(englishStep("Mislykkes kipningen mod 10'eren, indkasseres esset.")).toBe('If the finesse towards the 10 fails, the ace is cashed.');
    expect(r.value).toBeCloseTo(r.lead.value, 9);
  });

  it('teksten fortsætter efter en kipning altid med mærket, også på engelsk', () => {
    for (const [n, s, g] of [['432', 'AQ65', 3], ['432', 'AKJ5', 4], ['432', 'K765', 2], ['J32', 'AK54', 3], ['J32', 'K54', 1], ['432', 'KQ8765', 5], ['432', 'AT65', 2], ['432', 'JT85', 1]] as const) {
      const { steps } = bestLine(n, s, g).text;
      steps.forEach((step, i) => {
        if (i > 0 && steps[i - 1].includes('(kipning)')) {
          expect(step, `${n} / ${s}, ${g} stik`).toMatch(/^(Lykkes|Mislykkes) kipningen(?: mod \S+)?, /);
          expect(englishStep(step)).toMatch(/^If the finesse (?:towards the \S+ )?(succeeds|fails), /);
        }
      });
    }
  });

  it('ingen tekst siger "slås", og de nye ord har engelsk', () => {
    for (const [n, s, g] of [['J432', 'AT65', 3], ['AKJ32', '7654', 5], ['2', 'AKJ543', 5], ['432', 'AQ65', 3], ['432', 'AKJ5', 4], ['QT', 'AK432', 4]] as const) {
      for (const step of bestLine(n, s, g).text.steps) {
        expect(step).not.toMatch(/\bslås\b/);
        expect(englishStep(step)).not.toMatch(/[æøå]|\b(og|fra|lille|indkasseres|toppes|spilles)\b/);
      }
    }
    expect(englishStep('Esset og kongen indkasseres.')).toBe('The ace and king are cashed.');
    expect(englishStep('Farven toppes med esset og kongen.')).toBe('The ace and king are played for the drop.');
    expect(englishStep('Farven toppes med esset.')).toBe('The ace is played for the drop.');
    expect(englishStep('Damen spilles fra hånden.')).toBe('The queen is played from hand.');
    expect(englishStep('Lille fra begge hænder to gange.')).toBe('Low from both hands twice.');
    expect(englishStep('Lille fra begge hænder tre gange.')).toBe('Low from both hands three times.');
  });

  it('2 / E K B 5 4 3 (5 stik) og 3 2 / B 10 5 4 (1 stik) giver 59,75 % og 24,73 %, når linjen spilles som helhed', () => {
    const a = bestLine('2', 'AKJ543', 5);
    expect(a.value).toBeCloseTo(a.lead.value, 9);
    expect(Math.round(a.value * 10000) / 100).toBe(59.75);
    const b = bestLine('32', 'JT54', 1);
    expect(b.value).toBeCloseTo(b.lead.value, 9);
    expect(Math.round(b.value * 10000) / 100).toBe(24.73);
  });

  it('linjer fra gruppe C i SPEC-linjeplan-23.md får trin igen og giver den gemte chance', () => {
    for (const [n, s, g] of [['KJ92', 'AT83', 4], ['QT', 'AK432', 4], ['K32', 'AT954', 3]] as const) {
      const r = bestLine(n, s, g);
      expect(r.text.line.steps.length, `${n} / ${s}, ${g} stik`).toBeGreaterThan(0);
      expect(r.value).toBeCloseTo(r.lead.value, 9);
    }
  });

  it('3. hånds kort pr. gren: en linje med thirdIf læses af lineMask og følges af followsLine', () => {
    // B 3 2 / E K 5 4: lille til esset; derefter lille mod knægten, men er damen faldet, lægges kongen.
    const game: Game = buildGame(parseCards('J32'), parseCards('AK54'), { objective: goal(3) });
    const steps: LineStep[] = [
      { leadFrom: 'N', card: 'low', third: { ifSecondPlays: 'low', play: 'A', else: 'A' } },
      { leadFrom: 'S', card: 'low', third: { ifSecondPlays: 'low', play: 'J', else: 'low' }, thirdIf: [{ if: { fallen: ['Q'] }, third: { ifSecondPlays: 'low', play: 'low', else: 'low' } }] },
    ];
    const line: Line = { id: 'X', text: '', steps };
    expect(validateLine(game, line)).toEqual([]);
    const start = { north: ranks('J32'), south: ranks('AK54'), west: ranks('Q876'), east: ranks('T9') };
    // Damen falder ikke i første stik (Øst lægger 9'eren), så trin 2 er lille mod knægten.
    expect(followsLine(steps, [
      { leader: 'N', lead: 2, second: 9, third: 14, fourth: 6, winner: 'S' },
      { leader: 'S', lead: 4, second: 7, third: 11, fourth: 10, winner: 'N' },
    ], start)).toBe(true);
    // Lægger Øst damen i første stik, er trin 2 lille fra begge hænder, ikke knægten.
    const start2 = { north: ranks('J32'), south: ranks('AK54'), west: ranks('T987'), east: ranks('Q6') };
    const første = { leader: 'N', lead: 2, second: 12, third: 14, fourth: 7, winner: 'S' } as const;
    expect(followsLine(steps, [første, { leader: 'S', lead: 4, second: 8, third: 3, fourth: 6, winner: 'V' }], start2)).toBe(true);
    expect(followsLine(steps, [første, { leader: 'S', lead: 4, second: 8, third: 11, fourth: 6, winner: 'N' }], start2)).toBe(false);
  });

  it('Spil den selv: den, der følger linjen på hovedvejen og på sidegrenen, har fulgt den; den, der ikke gør, har ikke', () => {
    // Linjen spilles som stik: spilføreren efter trinene (også thirdIf), 2. hånd lavt og 4. hånd billigst over, ellers lavt.
    const spil = (steps: LineStep[], hands: Record<'N' | 'S' | 'V' | 'Ø', Rank[]>, afvig?: (third: Rank, hand: Rank[]) => Rank) => {
      const h = { N: [...hands.N], S: [...hands.S], V: [...hands.V], Ø: [...hands.Ø] };
      const played = new Set<Rank>();
      const pick = (cards: Rank[], card: string): Rank => (card === 'low' ? Math.min(...cards) : card === 'high' ? Math.max(...cards) : parseCards(card)[0]) as Rank;
      const tricks = [];
      for (const s of steps) {
        const leader = s.leadFrom, partner = leader === 'N' ? 'S' : 'N';
        const [second, fourth] = leader === 'N' ? (['Ø', 'V'] as const) : (['V', 'Ø'] as const);
        const lead = pick(h[leader], s.card);
        const sc = h[second].length ? (Math.min(...h[second]) as Rank) : (0 as Rank);
        const rule = (s.thirdIf ?? []).find((r) => (r.if.fallen ?? []).every((c) => played.has(parseCards(c)[0] as Rank)))?.third ?? s.third;
        let third = h[partner].length ? pick(h[partner], rule ? (sc < 11 ? rule.play : rule.else) : 'low') : (0 as Rank);
        if (afvig && tricks.length === 0) third = afvig(third, h[partner]);
        const top = Math.max(lead, third, sc);
        const over = h[fourth].filter((c) => c > top);
        const fc = (over.length ? Math.min(...over) : h[fourth].length ? Math.min(...h[fourth]) : 0) as Rank;
        tricks.push({ leader, lead, second: sc, third, fourth: fc, winner: leader });
        for (const [seat, c] of [[leader, lead], [second, sc], [partner, third], [fourth, fc]] as const) {
          h[seat] = h[seat].filter((x) => x !== c);
          if (c) played.add(c);
        }
        if (!sc || !fc) break;
      }
      return tricks;
    };
    const start = (n: string, s: string, w: string, e: string) => ({ north: ranks(n), south: ranks(s), west: ranks(w), east: ranks(e) });
    for (const [n, s, g, hoved, side] of [
      // nr. 1: kipningen mod damen lykkes, når Øst har kongen, og mislykkes, når Vest har den.
      ['432', 'AQ65', 3, ['T98', 'KJ7'], ['KJ7', 'T98']],
      // nr. 7: kipningen mod knægten mislykkes, når Øst har damen, og lykkes, når Vest har den.
      ['J32', 'AK54', 3, ['T987', 'Q6'], ['Q876', 'T9']],
    ] as const) {
      const { text } = bestLine(n, s, g);
      for (const [w, e] of [hoved, side]) {
        const hands = { N: ranks(n), S: ranks(s), V: ranks(w), Ø: ranks(e) };
        expect(followsLine(text.line.steps, spil(text.line.steps, hands), start(n, s, w, e)), `${n} / ${s}: fulgt`).toBe(true);
        // Afviger 3. hånd i første stik (det højeste kort i stedet for trinets kort), er linjen ikke fulgt.
        const afvigende = spil(text.line.steps, hands, (third, hand) => (Math.max(...hand) !== third ? (Math.max(...hand) as Rank) : (Math.min(...hand) as Rank)));
        expect(followsLine(text.line.steps, afvigende, start(n, s, w, e)), `${n} / ${s}: ikke fulgt`).toBe(false);
      }
    }
  });

  it('gamle linjer uden thirdIf læses og spilles uændret', () => {
    const game = buildGame(parseCards('J432'), parseCards('AT65'), { objective: goal(3) });
    const old: Line = { id: 'A', text: '', steps: [{ leadFrom: 'N', card: 'low', third: { ifSecondPlays: 'low', play: 'T', else: 'A' } }, { leadFrom: 'S', card: 'high' }] };
    expect(validateLine(game, old)).toEqual([]);
    expect(solveLine(game, old).value).toBeGreaterThan(0);
  });

  it('ingen linjetekst i banken og ingen af løserens skabeloner indeholder "slås"', () => {
    // Testen skal læse alle filerne; en tom glob ville ellers give grønt.
    expect(Object.keys(BANK_FILES).length).toBe(13);
    expect(Object.keys(SKABELONER).length).toBe(4);
    for (const [fil, tekst] of Object.entries(BANK_FILES)) expect(tekst.match(/.{0,40}\bslås\b.{0,10}/)?.[0], fil).toBeUndefined();
    for (const [fil, kode] of Object.entries(SKABELONER)) expect(udenKommentarer(kode).match(/.{0,40}\bslås\b.{0,10}/)?.[0], fil).toBeUndefined();
  });

  it('hver tekst i banken, der fortsætter efter en kipning, siger, hvilken gren den fortsætter på', () => {
    const fejl: string[] = [];
    for (const item of TEST_BANK) {
      for (const [mål, g] of Object.entries(item.solution.goals)) {
        for (const lead of g.leads) {
          lead.steps.forEach((step, i) => {
            if (i > 0 && lead.steps[i - 1].includes('(kipning)') && !/^(Lykkes|Mislykkes) kipningen(?: mod \S+)?, /.test(step)) fejl.push(`${item.combination.id} ${mål}: ${step}`);
          });
        }
      }
    }
    expect(fejl.slice(0, 5)).toEqual([]);
  });

  it('H i banken: mærket nævner kortet præcis, når to kipninger går forud (130 udspil)', () => {
    const fejl: string[] = [];
    let medKort = 0;
    for (const item of TEST_BANK) {
      const goals = [...Object.entries(item.solution.goals), ...(item.solution.tricks ? [['tricks', item.solution.tricks] as const] : [])];
      for (const [mål, g] of goals) {
        for (const lead of g.leads) {
          lead.steps.forEach((step, i) => {
            const m = /^(?:Lykkes|Mislykkes) kipningen(?: mod (\S+))?, /.exec(step);
            if (!m) return;
            const forud = lead.steps.slice(0, i).filter((s) => s.includes('(kipning)')).length;
            // Kortet er kipningens kort i trinet lige før mærket.
            const kort = / mod (\S+) \(kipning\)/.exec(lead.steps[i - 1])?.[1];
            if ((forud >= 2 ? kort : undefined) !== m[1]) fejl.push(`${item.combination.id} ${mål}: ${step}`);
            if (m[1]) medKort++;
          });
        }
      }
    }
    expect(fejl.slice(0, 5)).toEqual([]);
    expect(medKort).toBe(130);
  });

  it('eksemplerne i specens tabel står i banken med deres tekst og antal trin', () => {
    // [kombination, mål, udspil, tekst, antal trin] fra banken efter LINES_VERSION 7 (SPEC-esset-slaas.md, Resultat; G og H).
    const EKSEMPLER: [string, string, number, string[], number][] = [
    ["432-AQ65", "3", 0, ["Lille fra bordet mod damen (kipning); lægger Øst en honnør, tages den med esset.", "Lykkes kipningen, indkasseres esset.", "Lille fra begge hænder."], 1],
    ["432-AQ765", "4", 0, ["Lille fra bordet mod damen (kipning); lægger Øst en honnør, tages den med esset.", "Lykkes kipningen, indkasseres esset."], 1],
    ["432-AKJ5", "4", 0, ["Lille fra bordet mod knægten (kipning); lægger Øst en honnør, tages den med esset.", "Lykkes kipningen, toppes farven med esset og kongen."], 3],
    ["432-K765", "2", 0, ["Lille fra bordet mod kongen (kipning); lægger Øst en honnør, lægges der lille.", "Lykkes kipningen, spilles der lille fra begge hænder to gange."], 1],
    ["32-AKQ94", "4", 0, ["Lille fra bordet mod 9'eren (kipning); lægger Øst en honnør, tages den med esset.", "Mislykkes kipningen, indkasseres esset."], 1],
    ["2-AKJ543", "5", 0, ["Lille fra bordet mod knægten (kipning); lægger Øst en honnør, tages den med esset.", "Mislykkes kipningen, indkasseres esset og kongen."], 3],
    ["J32-AK54", "3", 1, ["Lille fra bordet til esset.", "Lille fra hånden mod knægten (kipning); lægger Vest en honnør, lægges der lille.", "Mislykkes kipningen, indkasseres kongen."], 1],
    ["J32-K54", "1", 1, ["Lille fra bordet mod kongen (kipning); lægger Øst en honnør, lægges der lille.", "Mislykkes kipningen, spilles der lille fra hånden mod knægten (kipning); lægger Vest en honnør, lægges der lille."], 0],
    ["432-QJ965", "3", 0, ["Lille fra bordet mod damen (kipning); lægger Øst en honnør, lægges der lille.", "Mislykkes kipningen, spilles der lille fra bordet mod 9'eren (kipning); lægger Øst en honnør, lægges der lille."], 1],
    ["432-KQ8765", "5", 0, ["Lille fra bordet mod kongen (kipning); lægger Øst en honnør, lægges der lille.", "Mislykkes kipningen, toppes farven med damen."], 1],
    ["KJ92-AT83", "4", 0, ["Kongen indkasseres.", "Lille fra bordet mod 10'eren (kipning); lægger Øst en honnør, tages den med esset."], 1],
    ["QT-AK432", "4", 2, ["Esset indkasseres.", "Lille fra hånden til damen."], 1],
    ["K32-AT954", "3", 0, ["Kongen indkasseres."], 1],
    ["AJT2-K96543", "6", 0, ["Esset indkasseres."], 1],
    ["A2-QJ987", "4", 0, ["Esset indkasseres.", "Lille fra bordet mod damen (kipning); lægger Øst en honnør, lægges der lille.", "Mislykkes kipningen, toppes farven med knægten."], 1],
    ["432-Q965", "1", 0, ["Lille fra begge hænder.", "Lille fra bordet mod damen (kipning); lægger Øst en honnør, lægges der lille.", "Mislykkes kipningen, spilles der lille fra begge hænder."], 1],
    ["32-JT54", "1", 0, ["Lille fra bordet mod knægten (kipning); lægger Øst en honnør, lægges der lille.", "Mislykkes kipningen, spilles der lille fra begge hænder."], 1],
    ["J32-Q654", "2", 1, ["Lille fra bordet mod damen (kipning); lægger Øst en honnør, lægges der lille.", "Mislykkes kipningen, spilles der lille fra hånden mod knægten (kipning); lægger Vest en honnør, lægges der lille.", "Lykkes kipningen mod knægten, spilles der lille fra begge hænder."], 1],
    ["-AKJ5432", "6", 0, ["Esset og kongen indkasseres.", "Lille fra hånden."], 2],
    ["32-AT654", "3", 0, ["Lille fra begge hænder; lægger Øst en honnør, tages den med esset.", "Esset indkasseres.", "10'eren spilles fra hånden."], 1],
    ];
    for (const [id, mål, i, steps, trin] of EKSEMPLER) {
      const lead = JSON.parse(BANK_FILES['../content/solutions.json']).combinations[id].goals[mål].leads[i];
      expect(lead.steps, `${id} ${mål}`).toEqual(steps);
      expect(lead.line.length, `${id} ${mål}`).toBe(trin);
    }
  });
});
