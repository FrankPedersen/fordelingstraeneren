import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { deal } from '../../domain/dealer';
import { mulberry32 } from '../../engine/rng';
import { ROOT } from '../../sprog/danskTekst';
import {
  alleOpfyldt,
  fordeling,
  fraPbn,
  laes,
  opfyldt,
  raaSti,
  situationsfil,
  tableFeeling,
  variantfil,
  variantKrav,
  variantSti,
  type Farve,
  type Krav,
  type Raa,
  type Variant,
  type VariantRaa,
} from './hjaelp';

/*
 * Accepttest 1, 2, 3 og 8 i SPEC-udspilsraad.md. Test 1 (dataene) og 3 er røde, indtil Frank har kørt varianterne
 * (`python tools/udspil/generer.py --varianter`), som skriver tools/udspil/raa/varianter/<variant>.json.
 *
 * 1. Varianterne: varianter.json har de syv varianter med situation, ekstra krav og seed. TS genskaber hver hånd med
 *    appens deal(seed) og hver fordeling med shuffle og tjekker situationens krav og variantens ekstra krav med egen
 *    TS-kode (hjaelp.ts; `tableFeeling` med appens `muligeUdspil`), uafhængigt af Python. For den første hånd pr. variant
 *    tjekkes også, at de seeds, generatoren sprang over, virkelig ikke opfylder kravene.
 * 2. De otte situationer er uændrede: tools/udspil/raa/S*.json og src/modspil/content/udspil/ er som ved tagget (git diff
 *    mod `v50-foer-udspilsraad`, så linjeskift i arbejdsmappen tæller ikke; ingen nye filer), og `generer.py --situation
 *    S1-1nt-3nt --antal 1 --ud <tmp>` giver den samme første opgave som i raa/S1-1nt-3nt.json (springes over med en
 *    besked, hvis Python med endplay ikke findes i tools/udspil/.venv).
 * 3. Variantdataene: 150 hænder pr. variant, 100 fordelinger pr. hånd, 13 kort pr. fordeling og stik mellem 0 og 13.
 * 8. Intet andet er ændret siden `v50-foer-udspilsraad` end filerne i Afgrænsningen og specen (se `ulovlige`).
 *
 * Tunge løkker har tidsgrænsen 300 s pr. variant.
 */

const TUNG = { timeout: 300_000 };
const TAG = 'v50-foer-udspilsraad';
const sit = situationsfil();
const vfil = variantfil();
const situation = (id: string) => sit.situationer.find((s) => s.id === id)!;

// ---------------------------------------------------------------- accepttest 1: varianterne

const SIDE_S4: Farve[] = ['S', 'D', 'C'];
const SIDE_S: Farve[] = ['H', 'D', 'C'];
const singleton = (blandt: Farve[]): Krav => ({
  farveMed: [
    { blandt, laengde: [1, 1], honnoerer: [0, 1] },
    { blandt, laengde: [3, 13], honnoerer: [0, 0] },
  ],
});
const doubleton = (blandt: Farve[]): Krav => ({
  farveMed: [
    { blandt, laengde: [2, 2], honnoerer: [0, 0] },
    { blandt, laengde: [3, 13], honnoerer: [0, 0] },
  ],
});
const TF: Krav = { tableFeeling: { blandt: ['S', 'H', 'D', 'C'], min: 3 } };

/** Specens tabel (Varianterne): id, situation og Vests ekstra krav. */
const FORVENTET: [string, string, Krav][] = [
  ['S4-singleton', 'S4-kun-en-farve', singleton(SIDE_S4)],
  ['S5-singleton', 'S5-sidefarve', singleton(SIDE_S)],
  ['S8-singleton', 'S8-delkontrakt', singleton(SIDE_S)],
  ['S4-doubleton', 'S4-kun-en-farve', doubleton(SIDE_S4)],
  ['S8-doubleton', 'S8-delkontrakt', doubleton(SIDE_S)],
  ['S1-tablefeeling', 'S1-1nt-3nt', TF],
  ['S2-tablefeeling', 'S2-stayman', TF],
];

describe('Varianterne (accepttest 1)', () => {
  it('varianter.json har de syv varianter med situation, ekstra krav og seed og 150 hænder pr. variant', () => {
    expect(vfil.opgaver).toBe(150);
    expect(vfil.varianter.map((v) => [v.id, v.situation, v.ekstra])).toEqual(FORVENTET);
    const seeds = vfil.varianter.map((v) => v.seed);
    for (const s of seeds) expect(Number.isInteger(s) && s >= 0 && s < 2 ** 32).toBe(true);
    // Hver variant har sit eget seed, også forskelligt fra situationernes.
    expect(new Set([...seeds, ...sit.situationer.map((s) => s.seed)]).size).toBe(seeds.length + sit.situationer.length);
  });

  it('det ekstra krav har andre nøgler end situationens krav til Vest, og farveMed-elementerne kan ikke være samme farve', () => {
    for (const v of vfil.varianter) {
      const vest = situation(v.situation).krav.W;
      for (const n of Object.keys(v.ekstra)) expect(Object.keys(vest), `${v.id}: ${n}`).not.toContain(n);
      const [e1, e2] = v.ekstra.farveMed ?? [];
      if (e1 && e2) expect(e1.laengde[1] < e2.laengde[0] || e2.laengde[1] < e1.laengde[0], v.id).toBe(true);
    }
  });

  it('tableFeeling: E K 7 4, K D 8 5 3, D B 6 2 og E K 7 giver to kort; E K D 4, K D 10 9, E K B 4, D B 9 4, B 10 6 2 og E K ikke', () => {
    for (const v of [[14, 13, 7, 4], [13, 12, 8, 5, 3], [12, 11, 6, 2], [14, 13, 7]]) expect(tableFeeling(v), v.join(' ')).toBe(true);
    for (const v of [[14, 13, 12, 4], [13, 12, 10, 9], [14, 13, 11, 4], [12, 11, 9, 4], [11, 10, 6, 2], [14, 13], [10, 9, 8, 2]]) {
      expect(tableFeeling(v), v.join(' ')).toBe(false);
    }
  });

  it('de ekstra krav i TS på faste hænder (♠.♥.♦.♣)', () => {
    const [s4sing, , , s4doub] = FORVENTET.map((f) => f[2]);
    // Singleton i en sidefarve (også en honnør) og en anden sidefarve med 3+ kort uden honnør.
    expect(opfyldt(fraPbn('7.K8643.9762.K92'), s4sing)).toBe(true);
    expect(opfyldt(fraPbn('K.8643.97632.T92'), s4sing)).toBe(true);
    expect(opfyldt(fraPbn('7.K8643.KJ62.Q92'), s4sing), 'ingen sidefarve uden honnør').toBe(false);
    expect(opfyldt(fraPbn('AJ72.K.97652.T93'), s4sing), 'singleton kun i trumf').toBe(false);
    // Doubleton uden honnør (10 er ikke en honnør) og en anden sidefarve med 3+ kort uden honnør.
    expect(opfyldt(fraPbn('72.K864.9762.KJ2'), s4doub)).toBe(true);
    expect(opfyldt(fraPbn('T2.Q864.9762.KJ2'), s4doub)).toBe(true);
    expect(opfyldt(fraPbn('K2.Q864.9762.T92'), s4doub), 'doubleton med honnør').toBe(false);
    expect(opfyldt(fraPbn('92.KQ864.Q62.AJ2'), s4doub), 'ingen sidefarve med 3+ kort uden honnør').toBe(false);
    // "Table feeling" i en farve med 3+ kort.
    expect(opfyldt(fraPbn('KJ76.AK43.T863.J'), TF), 'S1 opgave 55: ♥ E K 4 3').toBe(true);
    expect(opfyldt(fraPbn('JT62.863.Q985.A2'), TF), '♠ B 10 6 2').toBe(false);
    expect(opfyldt(fraPbn('AK.86432.Q985.62'), TF), '♠ E K doubleton').toBe(false);
  });
});

describe.each(vfil.varianter.map((v) => [v.id, v] as const))('%s', (id, v: Variant) => {
  const s = situation(v.situation);
  const krav = variantKrav(s, v);

  it('hænderne og fordelingerne genskabes i TS og opfylder situationens og variantens krav (accepttest 1)', TUNG, () => {
    const raa = laes<VariantRaa>(variantSti(id));
    expect(raa.variant).toBe(id);
    expect(raa.id).toBe(v.situation);
    expect(raa.ekstra).toEqual(v.ekstra);
    expect(raa.kontrakt).toBe(s.kontrakt);
    for (const o of raa.opgaver) {
      const h = deal(o.seed);
      expect([...h.W].sort((a, b) => a - b), `hånd ${o.seed}: Vests kort`).toEqual(o.vest);
      expect(alleOpfyldt(h, krav), `hånd ${o.seed}: kravene til de fire hænder`).toBe(true);
      for (const f of o.fordelinger) {
        const fh = fordeling(o.vest, f);
        expect(new Set([...fh.N, ...fh.E, ...fh.S, ...fh.W]).size).toBe(52);
        if (!alleOpfyldt(fh, krav, ['N', 'E', 'S'])) throw new Error(`${id}, hånd ${o.seed}: fordelingen ${f} opfylder ikke kravene`);
      }
    }
  });

  it('de seeds, generatoren sprang over, opfylder ikke kravene (første hånd; accepttest 1)', TUNG, () => {
    const raa = laes<VariantRaa>(variantSti(id));
    const foerste = raa.opgaver[0];
    const rng = mulberry32(v.seed);
    let seed = rng.uint32();
    let sprunget = 0;
    while (seed !== foerste.seed) {
      if (alleOpfyldt(deal(seed), krav)) throw new Error(`${id}: seed ${seed} opfylder kravene, men blev sprunget over`);
      seed = rng.uint32();
      if (++sprunget > 10_000_000) throw new Error(`${id}: den første hånds seed findes ikke i variantens række`);
    }
    const r = mulberry32(foerste.seed);
    const brugt: number[] = [];
    let forsoeg = 0;
    while (brugt.length < foerste.fordelinger.length) {
      const f = r.uint32();
      forsoeg++;
      if (alleOpfyldt(fordeling(foerste.vest, f), krav, ['N', 'E', 'S'])) brugt.push(f);
    }
    expect(brugt).toEqual(foerste.fordelinger);
    expect(forsoeg).toBe(foerste.forsoeg);
  });

  it('antallet: 150 hænder, 100 fordelinger, 13 kort og stik mellem 0 og 13 (accepttest 3)', () => {
    const raa = laes<VariantRaa>(variantSti(id));
    expect(raa.fordelinger).toBe(sit.fordelinger);
    expect(raa.opgaver).toHaveLength(vfil.opgaver);
    expect(new Set(raa.opgaver.map((o) => o.seed)).size).toBe(vfil.opgaver);
    expect(raa.eksempler).toEqual([]);
    for (const o of raa.opgaver) {
      expect(o.vest).toHaveLength(13);
      expect(o.fordelinger).toHaveLength(sit.fordelinger);
      expect(o.stik).toHaveLength(sit.fordelinger);
      for (const r of o.stik) {
        expect(r).toHaveLength(13);
        for (const x of r) expect(Number.isInteger(x) && x >= 0 && x <= 13).toBe(true);
      }
    }
  }, 30_000);
});

// ---------------------------------------------------------------- git (accepttest 2 og 8)

const git = (...args: string[]): string => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

function harTag(): boolean {
  try {
    git('rev-parse', '--verify', '--quiet', `refs/tags/${TAG}^{commit}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Den næste grens tag (`v51-foer-…`, main efter denne gren), når det findes: så sammenlignes tagget med det i stedet for
 * arbejdsmappen, så senere grene ikke gør vagterne røde.
 */
function naeste(): string[] {
  return git('tag', '--list', 'v51-foer-*').split('\n').filter(Boolean).slice(0, 1);
}

/** Ændringerne siden tagget som [status, fil]; mod arbejdsmappen tæller ikke-committede og nye, usporede filer med. */
function aendringer(...stier: string[]): [string, string][] {
  const til = naeste();
  const felter = git('diff', '--name-status', '-z', '--no-renames', TAG, ...til, '--', ...stier).split('\0').filter(Boolean);
  const ud: [string, string][] = [];
  for (let i = 0; i < felter.length; i += 2) ud.push([felter[i], felter[i + 1]]);
  if (til.length === 0) for (const f of git('ls-files', '--others', '--exclude-standard', '-z', '--', ...stier).split('\0').filter(Boolean)) ud.push(['?', f]);
  return ud;
}

// ---------------------------------------------------------------- accepttest 2: de otte situationer er uændrede

const SITUATIONSDATA = (f: string) => /^tools\/udspil\/raa\/S[^/]*\.json$/.test(f) || f.startsWith('src/modspil/content/udspil/');
const PYTHON = ['tools/udspil/.venv/Scripts/python.exe', 'tools/udspil/.venv/bin/python'].map((p) => ROOT + p).find((p) => existsSync(p));

describe('De otte situationer er uændrede (accepttest 2)', () => {
  it('tools/udspil/raa/S*.json og src/modspil/content/udspil/ er som ved tagget', (ctx) => {
    if (!harTag()) ctx.skip(`Tagget ${TAG} findes ikke her (fx i GitHub Actions, der henter uden tags), så testen kører kun lokalt.`);
    const aendrede = aendringer('tools/udspil/raa/', 'src/modspil/content/udspil/').filter(([, f]) => SITUATIONSDATA(f));
    expect(aendrede).toEqual([]);
  });

  it('generer.py --situation S1-1nt-3nt --antal 1 giver den samme første opgave som raa/S1-1nt-3nt.json', TUNG, (ctx) => {
    if (!PYTHON) ctx.skip('Python med endplay findes ikke i tools/udspil/.venv her; se tools/udspil/README.md.');
    const ud = mkdtempSync(join(tmpdir(), 'udspilsraad-'));
    try {
      execFileSync(PYTHON!, ['tools/udspil/generer.py', '--situation', 'S1-1nt-3nt', '--antal', '1', '--ud', ud], {
        cwd: ROOT,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
      });
      const ny = JSON.parse(readFileSync(join(ud, 'raa', 'S1-1nt-3nt.json'), 'utf8')) as Raa;
      const gammel = laes<Raa>(raaSti('S1-1nt-3nt'));
      expect(ny.opgaver).toHaveLength(1);
      expect(ny.opgaver[0]).toEqual(gammel.opgaver[0]);
      expect({ ...ny, dato: '', opgaver: [], eksempler: [] }).toEqual({ ...gammel, dato: '', opgaver: [], eksempler: [] });
      expect(Object.keys(ny)).toEqual(Object.keys(gammel));
    } finally {
      rmSync(ud, { recursive: true, force: true });
    }
  });

  it('testen kan se forskel: en ændret situationsfil ville blive fanget, varianternes filer ikke', () => {
    expect(
      ['tools/udspil/raa/S1-1nt-3nt.json', 'tools/udspil/raa/varianter/S4-singleton.json', 'tools/udspil/raa/stabilitet/S1-1nt-3nt.json', 'src/modspil/content/udspil/S2-stayman.json'].filter(
        SITUATIONSDATA,
      ),
    ).toEqual(['tools/udspil/raa/S1-1nt-3nt.json', 'src/modspil/content/udspil/S2-stayman.json']);
  });
});

// ---------------------------------------------------------------- accepttest 8: intet andet er ændret

/** Filerne i Afgrænsningen og specen (også arkiveret i docs/specs/ med sin linje i README.md, session 3). */
const FILER = [
  'tools/udspil/varianter.json',
  'tools/udspil/krav.py',
  'tools/udspil/generer.py',
  'tools/udspil/kontrol.py',
  'tools/udspil/README.md',
  'tools/udspil/raadanalyse.mjs',
  'src/modspil/udspil/hjaelp.ts',
  'docs/MODEL.md',
  'CLAUDE.md',
  'scripts/ordliste.txt',
  'SPEC-udspilsraad.md',
  'docs/specs/SPEC-udspilsraad.md',
  'docs/specs/README.md',
];
const MAPPER = ['tools/udspil/raa/varianter/'];

/**
 * Ændringer, der ikke er tilladt: alt uden for FILER og MAPPER, bortset fra nye filer i src/modspil/udspil/
 * (`raadanalyse.ts` og de nye tests). Eksisterende tests i src/modspil/udspil/ må ikke ændres eller slettes, og ingen
 * tilladt fil må slettes.
 */
function ulovlige(aendringer: readonly (readonly [string, string])[]): string[] {
  return aendringer
    .filter(([status, f]) => {
      if (MAPPER.some((m) => f.startsWith(m))) return false;
      if (f.startsWith('src/modspil/udspil/') && (status === 'A' || status === '?')) return false;
      return !(FILER.includes(f) && status !== 'D');
    })
    .map(([s, f]) => `${s} ${f}`);
}

describe('Intet andet er ændret (accepttest 8)', () => {
  it('kun filerne i Afgrænsningen og specen er ændret siden main før ændringen', (ctx) => {
    if (!harTag()) ctx.skip(`Tagget ${TAG} findes ikke her (fx i GitHub Actions, der henter uden tags), så testen kører kun lokalt.`);
    expect(ulovlige(aendringer())).toEqual([]);
  });

  it('CLAUDE.md har højst én ny linje (om analysen) og ingen rettede eller fjernede', (ctx) => {
    if (!harTag()) ctx.skip(`Tagget ${TAG} findes ikke her.`);
    const linjer = git('diff', '-U0', TAG, ...naeste(), '--', 'CLAUDE.md').split('\n');
    expect(linjer.filter((l) => l.startsWith('-') && !l.startsWith('---'))).toEqual([]);
    expect(linjer.filter((l) => l.startsWith('+') && !l.startsWith('+++')).length).toBeLessThanOrEqual(1);
  });

  it('testen kan se forskel: en fil uden for Afgrænsningen eller en ændret eksisterende test ville blive fanget', () => {
    expect(
      ulovlige([
        ['A', 'tools/udspil/varianter.json'],
        ['M', 'tools/udspil/generer.py'],
        ['A', 'tools/udspil/raa/varianter/S4-singleton.json'],
        ['?', 'tools/udspil/raa/varianter/S4-singleton.tmp'],
        ['A', 'src/modspil/udspil/raadanalyse.ts'],
        ['?', 'src/modspil/udspil/varianter.test.ts'],
        ['M', 'src/modspil/udspil/hjaelp.ts'],
        ['M', 'docs/MODEL.md'],
        ['A', 'docs/specs/SPEC-udspilsraad.md'],
        ['M', 'src/modspil/udspil/data.test.ts'],
        ['D', 'src/modspil/udspil/stabilitet.test.ts'],
        ['M', 'tools/udspil/raa/S1-1nt-3nt.json'],
        ['M', 'src/modspil/content/udspil/S1-1nt-3nt.json'],
        ['M', 'src/modspil/model/findUdspil.ts'],
        ['D', 'tools/udspil/krav.py'],
        ['?', 'scripts/noget.mjs'],
      ]),
    ).toEqual([
      'M src/modspil/udspil/data.test.ts',
      'D src/modspil/udspil/stabilitet.test.ts',
      'M tools/udspil/raa/S1-1nt-3nt.json',
      'M src/modspil/content/udspil/S1-1nt-3nt.json',
      'M src/modspil/model/findUdspil.ts',
      'D tools/udspil/krav.py',
      '? scripts/noget.mjs',
    ]);
  });
});
