import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ROOT } from '../../sprog/danskTekst';
import { laes, raaSti, variantSti, type Raa } from '../udspil/hjaelp';
import { analyser, appTal, SITUATIONER, VARIANTER, type AppRaekke, type AppTal, type Datasaet } from '../udspil/raadanalyse';

/*
 * Accepttest 1 i SPEC-udspilstal.md: tallene i appen. `src/modspil/content/udspil/raadtal.json` er lig
 * `appTal(analyser(…))` på rådataene i tools/udspil/raa/, og filen er skrevet af `node tools/udspil/raadanalyse.mjs --app`.
 * Hvert tal i filen giver, afrundet som i afsnit 7a (stik med to decimaler, sætter i procentpoint med én decimal, andele
 * i hele procent), det samme som tabellerne mellem markørerne i docs/MODEL.md. Testen læser og tolker selv tabellerne,
 * uafhængigt af raadanalyse.ts's markdown. `--json` og `--markdown` er uændrede (markdown holdes fast af accepttest 7
 * i src/modspil/udspil/raadanalyse.test.ts).
 */

const TUNG = { timeout: 300_000 };
const FIL = 'src/modspil/content/udspil/raadtal.json';
const fil = (): AppTal => JSON.parse(readFileSync(ROOT + FIL, 'utf8')) as AppTal;

let cache: Datasaet | null = null;
function data(): Datasaet {
  cache ??= {
    base: Object.fromEntries(SITUATIONER.map((id) => [id, laes<Raa>(raaSti(id))])),
    varianter: Object.fromEntries(VARIANTER.map((id) => [id, laes<Raa>(variantSti(id))])),
  };
  return cache;
}

const script = (arg: string): string => execFileSync(process.execPath, ['tools/udspil/raadanalyse.mjs', arg], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

// ---------------------------------------------------------------- filen og analysen

describe('raadtal.json kommer fra analysen (accepttest 1)', () => {
  it('raadtal.json er lig appTal(analyser(…)) på rådataene', TUNG, () => {
    expect(fil()).toEqual(appTal(analyser(data())));
  });

  it('node tools/udspil/raadanalyse.mjs --app skriver det, der står i raadtal.json', TUNG, () => {
    expect(JSON.parse(script('--app'))).toEqual(fil());
  });

  it('--json er stadig hele analysen', TUNG, () => {
    expect(JSON.parse(script('--json'))).toEqual(JSON.parse(JSON.stringify(analyser(data()))));
  });

  it('filen har netop de rækker, situationer og grupper, appen bruger', () => {
    const noegler = fil().raekker.map((r) => `${r.raekke}|${r.situation ?? '-'}|${r.gruppe ?? '-'}`);
    expect(noegler).toEqual([
      'P1|-|-',
      'P2|-|-',
      'P3-D|-|-',
      'P3-C|-|-',
      'P4|-|-',
      'P5|S4-kun-en-farve|-',
      'P5|S5-sidefarve|-',
      'P5|S8-delkontrakt|-',
      'P6|S4-kun-en-farve|-',
      'P6|S8-delkontrakt|-',
      'P7|-|-',
      'P8-S|S6-trumf|-',
      'P8-S|S4-kun-en-farve|-',
      'P8-H|S6-trumf|-',
      'P8-H|S8-delkontrakt|-',
      'P8-D|S6-trumf|-',
      'P8-D|S4-kun-en-farve|-',
      'P8-D|S8-delkontrakt|-',
      'P8-C|S4-kun-en-farve|-',
      'P8-C|S8-delkontrakt|-',
      'P9|-|E K',
      'P9|-|K D',
      'P9|-|D B',
    ]);
    for (const r of fil().raekker) {
      expect(Object.keys(r).sort(), r.raekke).toEqual(['dom', 'forskel', 'gruppe', 'n', 'raekke', 'saetForskel', 'situation', 'udenPraktiskBetydning']);
    }
    expect(fil().trumfBedst.situation).toBe('S6-trumf');
  });
});

// ---------------------------------------------------------------- MODEL.md

const START = '<!-- raadanalyse:start -->';
const SLUT = '<!-- raadanalyse:slut -->';

/** Teksten mellem markørerne i afsnit 7a. */
function afsnit7a(): string {
  const t = readFileSync(ROOT + 'docs/MODEL.md', 'utf8').replace(/\r\n/g, '\n');
  const fra = t.indexOf(START);
  const til = t.indexOf(SLUT);
  expect(fra).toBeGreaterThan(-1);
  expect(til).toBeGreaterThan(fra);
  return t.slice(fra + START.length, til);
}

/** Tabellen under overskriften "### <overskrift>" som rækker af celler, uden hovedet og stregen. */
function tabel(tekst: string, overskrift: string): string[][] {
  const i = tekst.indexOf(`\n### ${overskrift}\n`);
  expect(i, overskrift).toBeGreaterThan(-1);
  const linjer = tekst.slice(i).split('\n').slice(2);
  const start = linjer.findIndex((l) => l.startsWith('|'));
  const ud: string[][] = [];
  for (const l of linjer.slice(start)) {
    if (!l.startsWith('|')) break;
    ud.push(l.slice(1, -1).split('|').map((c) => c.trim()));
  }
  return ud.slice(2);
}

const SYM: Record<string, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };

/** Rækkens navn i tabellen Resultaterne: "P1", "P3 · ♦", "P8 · ♠" eller "P9 · E K". */
function etiket(r: AppRaekke): string {
  const [p, f] = r.raekke.split('-');
  if (r.gruppe !== null) return `${p} · ${r.gruppe}`;
  return f ? `${p} · ${SYM[f]}` : p;
}

/** Et tal som i 7a: fortegn (+ eller −) og komma; nul uden fortegn. */
function som7a(x: number, decimaler: number): string {
  const t = Math.abs(x).toFixed(decimaler).replace('.', ',');
  if (Number(Math.abs(x).toFixed(decimaler)) === 0) return t;
  return (x > 0 ? '+' : '−') + t;
}

/** Dommen i 7a's ordlyd tilbage til analysens `dom` og `udenPraktiskBetydning`, med Kompendiets retning. */
function domAf(tekst: string, retning: string): Pick<AppRaekke, 'dom' | 'udenPraktiskBetydning'> {
  const hale = ', uden praktisk betydning';
  const uden = tekst.endsWith(hale);
  const kerne = uden ? tekst.slice(0, -hale.length) : tekst;
  const dom: Record<string, AppRaekke['dom']> = {
    'For få hænder': 'for-faa',
    'Ingen forskel påvist': 'ingen-forskel',
    'A bedre': 'holder',
    'B bedre': 'modsat',
    'Kompendiet holder': retning === 'B' ? 'modsat' : 'holder',
    'Kompendiet tager fejl': retning === 'B' ? 'holder' : 'modsat',
  };
  expect(dom[kerne], `dommen "${tekst}"`).toBeDefined();
  return { dom: dom[kerne], udenPraktiskBetydning: uden };
}

describe('Tallene er afsnit 7a\'s (accepttest 1)', () => {
  it('hver række giver, afrundet som i 7a, tabellen Resultaterne: hænder, A − B, sætter og dommen', () => {
    const resultater = tabel(afsnit7a(), 'Resultaterne');
    expect(resultater.length).toBeGreaterThan(20);
    for (const r of fil().raekker) {
      const navn = etiket(r);
      const fundet = resultater.filter((c) => c[0] === navn && (r.situation === null || c[1] === r.situation.slice(0, 2)));
      expect(fundet, `${navn} ${r.situation ?? ''}`).toHaveLength(1);
      const c = fundet[0];
      const hvor = `${navn} · ${c[1]}`;
      expect(r.n, `${hvor}: hænder`).toBe(Number(c[3].split('=').pop()!.trim()));
      expect(som7a(r.forskel, 2), `${hvor}: A − B`).toBe(c[5]);
      expect(som7a(r.saetForskel, 1), `${hvor}: sætter`).toBe(c[9]);
      expect({ dom: r.dom, udenPraktiskBetydning: r.udenPraktiskBetydning }, `${hvor}: dommen`).toEqual(domAf(c[10], c[2]));
    }
  });

  it('S6: andelen, hvor trumf er den bedste farve, er kolonnen "1." i tabellen "Trumfs plads"', () => {
    const plads = tabel(afsnit7a(), 'Trumfs plads blandt Vests farver (P8)');
    const s6 = plads.find((c) => c[0] === 'S6');
    expect(s6).toBeDefined();
    const { n, andel } = fil().trumfBedst;
    expect(n).toBe(Number(s6![2]));
    const m = s6![3].match(/^(\d+) \((\d+) %\)$/);
    expect(m).not.toBeNull();
    expect(Math.round(andel * n)).toBe(Number(m![1]));
    expect(Math.round(andel * 100)).toBe(Number(m![2]));
  });

  it('testen kan se forskel: afrunding og dom som i 7a', () => {
    expect(som7a(-0.1032, 2)).toBe('−0,10');
    expect(som7a(0.8277, 2)).toBe('+0,83');
    expect(som7a(0.001, 2)).toBe('0,00');
    expect(som7a(-1.8167, 1)).toBe('−1,8');
    expect(domAf('Kompendiet holder', 'B')).toEqual({ dom: 'modsat', udenPraktiskBetydning: false });
    expect(domAf('Kompendiet tager fejl', 'A')).toEqual({ dom: 'modsat', udenPraktiskBetydning: false });
    expect(domAf('B bedre, uden praktisk betydning', '–')).toEqual({ dom: 'modsat', udenPraktiskBetydning: true });
    expect(domAf('Ingen forskel påvist, uden praktisk betydning', 'A')).toEqual({ dom: 'ingen-forskel', udenPraktiskBetydning: true });
  });
});
