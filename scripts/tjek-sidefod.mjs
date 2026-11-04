// Accepttest (SPEC-sidefod.md): sidefoden er ens med forsidens efter målene under Afklaret i
// ../Forside/docs/specs/SPEC-ny-forside.md. Appen startes med Vite og åbnes i Chrome eller Edge uden vindue.
//
//   node scripts/tjek-sidefod.mjs                    tjekker
//   node scripts/tjek-sidefod.mjs --billeder=mappe   gemmer også sidefoden ved 1280 og 390 px
//
// Kræver Node 22+ og Chrome eller Edge.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const ROD = fileURLToPath(new URL('..', import.meta.url));
const BILLEDER = process.argv.find((a) => a.startsWith('--billeder='))?.slice('--billeder='.length);
const SKÆRME = ['', '#fordeling', '#pointregnskab', '#farvebehandling', '#haandevaluering', '#analyse'];
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean).find((p) => existsSync(p));
if (!CHROME) {
  console.error('Fandt hverken Chrome eller Edge; sæt CHROME til stien.');
  process.exit(2);
}

const vent = (ms) => new Promise((r) => setTimeout(r, ms));
let fejl = 0;
const tjek = (ok, navn, detalje = '') => {
  if (!ok) fejl++;
  console.log(`${ok ? 'ok  ' : 'FEJL'} ${navn}${!ok && detalje ? ` – ${detalje}` : ''}`);
};

const cache = mkdtempSync(join(tmpdir(), 'sidefod-vite-'));
const server = await createServer({ root: ROD, cacheDir: cache, logLevel: 'silent', server: { port: 5196 } });
await server.listen();
const UD = server.resolvedUrls.local[0];
const profil = mkdtempSync(join(tmpdir(), 'sidefod-'));
const port = 9300 + Math.floor(Math.random() * 500);
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profil}`, '--no-first-run', '--hide-scrollbars', '--force-color-profile=srgb', '--lang=da-DK', 'about:blank'], { stdio: 'ignore' });
let targets;
for (let i = 0; i < 100 && !targets; i++) {
  try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { await vent(200); }
}
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((ok, nej) => { ws.onopen = ok; ws.onerror = nej; });
let id = 0;
const venter = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && venter.has(d.id)) { venter.get(d.id)(d); venter.delete(d.id); } };
const send = (method, params = {}) => new Promise((ok) => { const n = ++id; venter.set(n, ok); ws.send(JSON.stringify({ id: n, method, params })); });
const kør = async (expression) => {
  const d = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (d.result?.exceptionDetails) throw new Error(`${expression.slice(0, 80)}: ${d.result.exceptionDetails.exception?.description}`);
  return d.result?.result?.value;
};
await send('Page.enable');
const åbn = async (skærm, bredde, højde = 900) => {
  await send('Emulation.setDeviceMetricsOverride', { width: bredde, height: højde, deviceScaleFactor: 1, mobile: bredde < 600 });
  await send('Page.navigate', { url: 'about:blank' });
  await send('Page.navigate', { url: UD + skærm });
  for (let i = 0; i < 80; i++) {
    await vent(200);
    if (await kør(`!!document.querySelector('footer.site-footer')`)) break;
  }
  await kør('document.fonts.ready.then(() => true)');
  await vent(200);
};
const MÅL = `(() => {
  const f = document.querySelector('footer.site-footer');
  const t = (e) => e.textContent.replace(/\\s+/g, ' ').trim();
  const k = (e) => e.getBoundingClientRect();
  const cs = getComputedStyle(f);
  const logo = f.querySelector('.kb-logo');
  const links = [...f.querySelectorAll('nav a')];
  const li = [...f.querySelectorAll('nav li')];
  const knap = f.querySelector('.site-footer-cta');
  const navn = f.querySelector('.site-footer-name');
  const titel = f.querySelector('nav h2');
  const logoCs = getComputedStyle(logo);
  return {
    højde: Math.round(k(f).height),
    kolonner: [...f.querySelectorAll('nav')].map((n) => ({ titel: t(n.querySelector('h2')), links: [...n.querySelectorAll('a')].map((a) => [t(a), a.getAttribute('href')]) })),
    polstring: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].join(' '),
    skrift: cs.fontSize + '/' + cs.lineHeight,
    hjørne: cs.borderTopLeftRadius,
    logo: [Math.round(k(logo).width), Math.round(k(logo).height), logoCs.fontSize],
    rækker: li.map((a) => Math.round(k(a).height)),
    afstand: Math.round(k(li[1]).top - k(li[0]).bottom),
    titel: getComputedStyle(titel).fontSize + '/' + getComputedStyle(titel).lineHeight,
    samme: Math.abs((k(knap).top + k(knap).height / 2) - (k(navn).top + k(navn).height / 2)) < 2,
    knapHøjde: Math.round(k(knap).height),
    knap: knap.innerText.replace(/\\s+/g, ' ').trim(),
    linje: f.querySelector('.site-footer-about p').getClientRects().length > 0,
    legal: f.querySelector('.site-footer-legal').innerText.replace(/\\s+/g, ' ').trim(),
    ud: document.documentElement.scrollWidth - innerWidth,
    tekst: t(f),
  };
})()`;
const KOLONNER = JSON.stringify([
  { titel: 'Trænere', links: [['Konventionstræner', '/konventionstraener/'], ['Fordeling', '#fordeling'], ['Pointregnskab', '#pointregnskab'], ['Farvebehandling', '#farvebehandling'], ['Håndevaluering', '#haandevaluering']] },
  { titel: 'Opslag', links: [['Analyse', '#analyse'], ['Bridgeordbog', '/ordbog/'], ['Scoring i bridge', '/scoring/']] },
]);

try {
  for (const skærm of SKÆRME) {
    for (const bredde of [1280, 390]) {
      await åbn(skærm, bredde);
      const f = await kør(MÅL);
      const hvor = `${skærm || 'forsiden'} ved ${bredde} px`;
      tjek(JSON.stringify(f.kolonner) === KOLONNER, `${hvor}: Trænere og Opslag i rigtig rækkefølge`, JSON.stringify(f.kolonner));
      tjek(f.skrift === '14px/20px' && f.titel === '11px/16px' && f.hjørne === '20px', `${hvor}: 14/20 px, titler 11/16 px og hjørner 20 px`, JSON.stringify([f.skrift, f.titel, f.hjørne]));
      tjek(!/bridgeentusiast|Skriv til mig/.test(f.tekst), `${hvor}: Om mig og Kontakt er væk`, f.tekst.slice(0, 120));
      if (bredde === 1280) {
        tjek(f.polstring === '24px 28px 18px 28px' && f.logo[0] === 32 && f.logo[2] === '12px' && f.afstand === 4 && f.knapHøjde === 36 && f.linje, `${hvor}: polstring 24/28 px, logo 32 px, 4 px mellem links, knappen 36 px og linjen`, JSON.stringify([f.polstring, f.logo, f.afstand, f.knapHøjde, f.linje]));
        tjek(f.legal === '© 2026 Frank Pedersen' && f.knap === 'Om mig og kontakt →', `${hvor}: ©-linjen og knappen med pil`, JSON.stringify([f.legal, f.knap]));
      } else {
        tjek(f.polstring === '18px 18px 14px 18px' && f.logo[0] === 30 && f.logo[2] === '11px' && f.afstand === 2 && !f.linje, `${hvor}: polstring 18 px, logo 30 px, 2 px mellem links og uden linjen`, JSON.stringify([f.polstring, f.logo, f.afstand, f.linje]));
        tjek(f.samme && f.knapHøjde >= 44, `${hvor}: logo og knappen på én række, med en trykflade på 44 px`, JSON.stringify([f.samme, f.knapHøjde]));
        tjek(f.rækker.every((h) => h >= 24), `${hvor}: alle links har mindst 24 px rækkehøjde`, f.rækker.join());
        tjek(f.legal === '© 2026 Frank Pedersen · Gratis bridgetræning i browseren' && f.knap === 'Om mig og kontakt', `${hvor}: ©-linjen og knappen uden pil`, JSON.stringify([f.legal, f.knap]));
      }
      tjek(f.ud <= 0, `${hvor}: intet stikker ud`, `${f.ud} px`);
    }
    await åbn(skærm, 320, 700);
    const ud = await kør('document.documentElement.scrollWidth - innerWidth');
    tjek(ud <= 0, `${skærm || 'forsiden'} ved 320 px: intet stikker ud`, `${ud} px`);
  }
  // Ens i mørk tilstand.
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
  await åbn('', 1280);
  const mørk = await kør(`getComputedStyle(document.querySelector('footer.site-footer')).backgroundColor`);
  tjek(mørk === 'rgb(26, 26, 26)', 'Mørk tilstand: samme mørke flade', mørk);
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });

  if (BILLEDER) {
    mkdirSync(BILLEDER, { recursive: true });
    for (const bredde of [1280, 390]) {
      await åbn('', bredde);
      const r = await kør(`(() => { const k = document.querySelector('footer.site-footer').getBoundingClientRect(); return { x: 0, y: k.top + scrollY - 16, width: innerWidth, height: k.height + 32, scale: 1 }; })()`);
      const b = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: r });
      writeFileSync(join(BILLEDER, `${bredde}-fordelingstraeneren-sidefod.png`), Buffer.from(b.result.data, 'base64'));
    }
  }
} catch (e) {
  tjek(false, 'testen kørte færdig', e.message);
} finally {
  proc.kill();
  await server.close();
  try { rmSync(profil, { recursive: true, force: true }); rmSync(cache, { recursive: true, force: true }); } catch {}
}
console.log(fejl ? `\n${fejl} FEJL` : '\nAlt i orden');
process.exit(fejl ? 1 : 0);
