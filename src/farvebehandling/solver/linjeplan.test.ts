import { describe, expect, it } from 'vitest';
import solutionsText from '../content/solutions.json?raw';
import { parseCards } from '../model/cards';
import type { CombinationSolution } from '../precompute';
import { buildGame } from './game';
import { validateLine } from './lines';
import { solveLine } from './solve';

/**
 * De 65 kombinationer, hvor tjekket "et trin skal følge løserens valg på alle grene" gjorde en gemt linje kortere med
 * LINES_VERSION 5 (SPEC-linjeplan-23.md). Hver linje står som mål#udspil:antal trin. Hele banken tjekkes af
 * `node scripts/tjek-linjer.ts`; her ligger de kombinationer, tjekket faktisk ramte.
 */
const AFKORTET: Record<string, string> = {
  '-AKJT2': '4#1:3 flest#1:3',
  '2-AJ9843': '4#2:2 4#3:2 flest#2:2 flest#3:2',
  '2-AJT843': '4#3:2',
  '2-AJT93': '3#2:2 flest#2:2',
  '2-AQJ93': '3#2:2 3#3:2',
  '2-AQJ943': '5#2:2 flest#2:2',
  '2-AQJ983': '5#2:2 flest#2:2',
  '2-KQ9843': 'flest#1:2',
  '2-KQJ943': '5#0:2 5#1:2 flest#0:2 flest#1:2',
  '2-QJT8': 'flest#1:2',
  '32-AT654': '3#1:1 flest#1:1',
  '32-AT954': '2#1:1',
  '32-AT97654': '6#1:1 flest#1:1',
  '32-AT984': '3#1:1',
  '32-AT9854': '4#1:1 flest#1:1',
  '32-JT54': '1#0:1',
  '32-JT84': '1#1:1',
  '32-JT94': '1#1:1 flest#1:1',
  '32-QT54': '1#1:1',
  '32-QT654': '2#1:1',
  '32-QT84': '1#1:1',
  '432-AQJ5': '3#2:2 flest#2:2',
  '432-AT65': 'flest#2:2',
  '432-JT65': '1#0:1',
  '432-JT85': '1#0:1 1#3:1',
  '432-K987': '1#1:2 flest#1:2',
  '432-KT965': '2#1:1',
  '432-KT9765': '4#1:1',
  '432-Q965': '1#1:1',
  '432-Q985': '1#1:2 flest#1:2',
  '432-Q9865': '2#1:1',
  '432-Q987': '1#1:2',
  '432-QT765': '2#1:1',
  '432-QT95': '1#1:1',
  '432-QT965': '2#1:1',
  '5432-J876': '1#0:1 flest#0:1 flest#2:1',
  '5432-JT76': '1#0:1 1#1:1',
  '5432-KT76': '1#1:1',
  '5432-QT76': '1#1:1',
  '5432-QT976': '3#1:1',
  '92-AJ843': '4#2:0',
  'A2-QJ943': '4#1:2 flest#1:2',
  'A2-QJ987': '4#1:1 flest#1:1',
  'A432-QJ95': '3#1:1 flest#1:1',
  'AJT2-K96543': '6#0:0 6#3:0 flest#0:0 flest#3:0',
  'AQ2-J543': '3#1:2 flest#1:2',
  'AQ2-J943': '3#1:2 3#2:2 flest#1:2 flest#2:2',
  'AQ2-J983': '3#1:2 3#2:2 flest#1:2 flest#2:2',
  'AQ2-J987': '3#1:2 3#2:2 flest#1:2 flest#2:2',
  'J2-AQ9543': 'flest#1:1',
  'J2-AQ9843': 'flest#1:1',
  'K32-AT954': '3#0:0 4#1:1',
  'K432-AT98': '3#0:0 3#2:0',
  'K82-AT93': '3#0:0 3#1:1 3#3:0 flest#1:1',
  'K9-AT432': '3#2:0',
  'K9-AT5432': '4#2:0 5#2:0',
  'K92-AT543': '4#1:1',
  'K932-AT54': '3#1:1',
  'K987-AJ432': '4#0:0 4#2:0',
  'KJ92-AT83': '4#0:0 4#3:0 flest#0:0 flest#3:0',
  'KT32-AJ954': '5#0:0 5#3:0 flest#0:0 flest#3:0',
  'KT432-AJ965': '5#0:0 5#3:0 flest#0:0 flest#3:0',
  'Q932-AKT4': '4#0:0 4#3:0 flest#0:0 flest#3:0',
  'QJ9-A5432': 'flest#0:1',
  'QT-AK432': '4#2:0 5#2:0 flest#2:0',
};

/** De 23 linjer, der spilledes forkert som helhed før rettelsen. */
const SPILLET_FORKERT = [
  '2-AJ9843 4#2', '2-AJ9843 flest#2', '2-KQ9843 flest#1', '32-AT9854 4#1',
  '32-AT9854 flest#1', '32-JT54 1#0', '32-JT84 1#1', '32-JT94 1#1',
  '32-JT94 flest#1', '32-QT54 1#1', '32-QT84 1#1', '432-JT85 1#3',
  '432-KT9765 4#1', '432-Q985 1#1', '432-Q985 flest#1', '432-Q9865 2#1',
  '5432-J876 1#0', '5432-J876 flest#0', '5432-J876 flest#2', '5432-QT976 3#1',
  'J2-AQ9543 flest#1', 'J2-AQ9843 flest#1', 'QJ9-A5432 flest#0',
];

const solutions = JSON.parse(solutionsText).combinations as Record<string, CombinationSolution>;
const rækker = Object.entries(AFKORTET).flatMap(([id, linjer]) =>
  linjer.split(' ').map((x) => {
    const [, mål, i, trin] = /^(\w+)#(\d+):(\d+)$/.exec(x)!;
    return { id, mål, i: Number(i), trin: Number(trin) };
  }),
);
const målet = (id: string, mål: string) => (mål === 'flest' ? solutions[id].tricks! : solutions[id].goals[mål]);
const spillet = (id: string, mål: string) =>
  buildGame(parseCards(solutions[id].north), parseCards(solutions[id].south), { objective: mål === 'flest' ? { kind: 'tricks' } : { kind: 'goal', goal: Number(mål) } });

describe('Linjerne følger løserens plan (SPEC-linjeplan-23.md)', { timeout: 300_000 }, () => {
  it('de 124 linjer i de 65 kombinationer har det antal trin, tjekket giver', () => {
    expect(rækker.length).toBe(124);
    expect(Object.keys(AFKORTET).length).toBe(65);
    const forkerte = rækker.filter((r) => målet(r.id, r.mål).leads[r.i].line.length !== r.trin).map((r) => `${r.id} ${r.mål}#${r.i}`);
    expect(forkerte).toEqual([]);
  });

  it('banken har 8.500 udspil, 6.940 gemte linjer og 1.560 uden trin', () => {
    const leads = Object.values(solutions).flatMap((c) => [...Object.values(c.goals), ...(c.tricks ? [c.tricks] : [])]).flatMap((g) => g.leads);
    expect(leads.length).toBe(8500);
    expect(leads.filter((l) => l.line.length).length).toBe(6940);
  });

  it('linjeformatet afviser ingen af linjerne, og en linje for et mål kan også spilles i spillet med flest stik', () => {
    const fejl: string[] = [];
    for (const r of rækker) {
      const { line } = målet(r.id, r.mål).leads[r.i];
      if (!line.length) continue;
      for (const mål of new Set([r.mål, 'flest'])) {
        for (const e of validateLine(spillet(r.id, mål), { id: 'x', text: '', steps: line })) fejl.push(`${r.id} ${r.mål}#${r.i} i ${mål}: ${e}`);
      }
    }
    expect(fejl).toEqual([]);
  });

  it('de 23 linjer giver den gemte chance, når de spilles som helhed', () => {
    const fejl: string[] = [];
    for (const navn of SPILLET_FORKERT) {
      const [id, rest] = navn.split(' ');
      const [mål, i] = rest.split('#');
      const lead = målet(id, mål).leads[Number(i)];
      const value = solveLine(spillet(id, mål), { id: 'x', text: '', steps: lead.line }).value;
      if (Math.abs(value - lead.value) > 1e-6) fejl.push(`${navn}: ${value}, gemt ${lead.value}`);
    }
    expect(fejl).toEqual([]);
  });
});
