// Accepttest i en rigtig browser (SPEC-sorte-tal.md): i Fordelings sorterede hånd (facit efter Lynaflæsning) har ♥ og ♦
// kortenes røde farve (--card-red) i lys og mørk tilstand, og kortene og (antal) har samme farve som i ♠ og ♣.
// Spillekortenes røde kort har samme farve som før. Testsiden scripts/sorte-tal.html viser facit og samme hånd med
// spillekort; den startes med Vite fra arbejdsmappen, og referencen (tagget v39-foer-sorte-tal) lægges i en
// midlertidig git worktree med samme testside. Kræver Node 22+, git og Chrome eller Edge.
//
//   node scripts/tjek-sorte-tal.mjs                    tjekker
//   node scripts/tjek-sorte-tal.mjs --billeder=mappe   gemmer også den sorterede hånd før og efter i lys og mørk tilstand
import { spawn, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const ROD = fileURLToPath(new URL('..', import.meta.url));
const TAG = 'v39-foer-sorte-tal';
const SIDE = 'scripts/sorte-tal.html';
const BILLEDER = process.argv.find((a) => a.startsWith('--billeder='))?.slice('--billeder='.length);
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

let fejl = 0;
const tjek = (ok, navn, detalje = '') => {
  if (!ok) fejl++;
  console.log(`${ok ? 'ok  ' : 'FEJL'} ${navn}${!ok && detalje ? ` – ${detalje}` : ''}`);
};
const vent = (ms) => new Promise((r) => setTimeout(r, ms));
const rgb = (hex) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;

// Appen før: en worktree af tagget med node_modules lånt fra arbejdsmappen og samme testside.
function lavFør() {
  const mappe = mkdtempSync(join(tmpdir(), 'sorte-tal-foer-'));
  rmSync(mappe, { recursive: true, force: true });
  const r = spawnSync('git', ['worktree', 'add', '--detach', mappe, TAG], { cwd: ROD, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`git worktree add: ${r.stderr}`);
  symlinkSync(join(ROD, 'node_modules'), join(mappe, 'node_modules'), 'junction');
  copyFileSync(join(ROD, SIDE), join(mappe, SIDE));
  return mappe;
}
function fjernFør(mappe) {
  const link = join(mappe, 'node_modules');
  // Kun linket fjernes; arbejdsmappens node_modules røres ikke.
  if (existsSync(link) && lstatSync(link).isSymbolicLink()) unlinkSync(link);
  if (existsSync(link)) return console.log(`Bemærk: ${mappe} blev ikke fjernet (node_modules er ikke et link).`);
  spawnSync('git', ['worktree', 'remove', '--force', mappe], { cwd: ROD });
}

const cache = mkdtempSync(join(tmpdir(), 'sorte-tal-vite-'));
const serverNu = await createServer({ root: ROD, cacheDir: join(cache, 'nu'), logLevel: 'silent', server: { port: 5193 } });
await serverNu.listen();
const førMappe = lavFør();
const serverFør = await createServer({ root: førMappe, configFile: join(førMappe, 'vite.config.ts'), cacheDir: join(cache, 'foer'), logLevel: 'silent', server: { port: 5194 } });
await serverFør.listen();
const NU = serverNu.resolvedUrls.local[0];
const FØR = serverFør.resolvedUrls.local[0];

const port = 9300 + Math.floor(Math.random() * 400);
const profil = mkdtempSync(join(tmpdir(), 'sorte-tal-'));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profil}`, '--no-first-run',
  '--hide-scrollbars', '--force-color-profile=srgb', '--lang=da-DK', 'about:blank'], { stdio: 'ignore' });
let version;
for (let i = 0; i < 100 && !version; i++) {
  try { version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await vent(200); }
}
const browser = new WebSocket(version.webSocketDebuggerUrl);
await new Promise((ok, nej) => { browser.onopen = ok; browser.onerror = nej; });
let næste = 0;
const venter = new Map();
browser.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && venter.has(d.id)) { venter.get(d.id)(d); venter.delete(d.id); } };
const send = (method, params = {}, sessionId) => new Promise((ok, nej) => {
  const n = ++næste;
  const ur = setTimeout(() => { venter.delete(n); nej(new Error(`${method} svarede ikke inden for 60 s`)); }, 60000);
  venter.set(n, (d) => { clearTimeout(ur); if (d.error) nej(new Error(`${method}: ${d.error.message}`)); else ok(d.result); });
  browser.send(JSON.stringify(sessionId ? { id: n, method, params, sessionId } : { id: n, method, params }));
});

/** Testsiden i sin egen browserkontekst i lys eller mørk tilstand; målene og evt. et billede af den sorterede hånd. */
async function mål(url, tilstand, fil) {
  const { browserContextId } = await send('Target.createBrowserContext');
  const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId, newWindow: true });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const s = (m, p) => send(m, p, sessionId);
  const kør = async (expression) => {
    const d = await s('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (d.exceptionDetails) throw new Error(`${expression.slice(0, 60)}: ${d.exceptionDetails.exception?.description}`);
    return d.result?.value;
  };
  try {
    await s('Page.enable');
    await s('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: tilstand }, { name: 'prefers-reduced-motion', value: 'reduce' }] });
    await s('Page.navigate', { url: `${url}${SIDE}` });
    // Vite kan optimere afhængigheder første gang og genindlæse siden, så der ventes på begge visninger.
    for (let i = 0; i < 200; i++) {
      await vent(100);
      if (await kør(`!!document.querySelector('#facit .sorted-hand > p') && !!document.querySelector('#kort .playing-card')`).catch(() => false)) break;
    }
    await kør('document.fonts.ready.then(() => true)');
    await vent(200);
    const r = await kør(`(() => {
      const c = (e) => e && getComputedStyle(e).color;
      const rækker = [...document.querySelectorAll('#facit .sorted-hand > p')].map((p) => ({
        farve: p.querySelector('.suit').textContent, symbol: c(p.querySelector('.suit')), kort: c(p), antal: c(p.querySelector('.muted')) }));
      const kortRød = getComputedStyle(document.documentElement).getPropertyValue('--card-red').trim();
      return { rækker, kortRød, røde: [...new Set([...document.querySelectorAll('#kort .playing-card.red')].map(c))], sorte: [...new Set([...document.querySelectorAll('#kort .playing-card:not(.red):not(.back)')].map(c))] };
    })()`);
    if (fil) {
      const k = await kør(`(() => { const b = document.querySelector('#facit .sorted-hand').getBoundingClientRect(); return { x: b.left - 12, y: b.top + scrollY - 12, w: b.width + 24, h: b.height + 24 }; })()`);
      const b = await s('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: k.x, y: k.y, width: k.w, height: k.h, scale: 1 } });
      writeFileSync(join(BILLEDER, fil), Buffer.from(b.data, 'base64'));
    }
    return r;
  } finally {
    await send('Target.disposeBrowserContext', { browserContextId }).catch(() => {});
  }
}

try {
  if (BILLEDER) mkdirSync(BILLEDER, { recursive: true });
  for (const tilstand of ['light', 'dark']) {
    const navn = tilstand === 'light' ? 'lys' : 'mørk';
    const fil = (hvornår) => BILLEDER && `${tilstand === 'light' ? 'lys' : 'moerk'}-${hvornår}.png`;
    const før = await mål(FØR, tilstand, fil('foer'));
    const nu = await mål(NU, tilstand, fil('efter'));
    const [spar, hjerter, ruder, klør] = nu.rækker;
    tjek(nu.rækker.map((r) => r.farve).join('') === '♠♥♦♣', `${navn}: den sorterede hånd har fire rækker`, JSON.stringify(nu.rækker));
    tjek(nu.kortRød === '#c62828' && hjerter.symbol === rgb(nu.kortRød) && ruder.symbol === rgb(nu.kortRød),
      `${navn}: ♥ og ♦ har kortenes røde farve (--card-red)`, `${hjerter.symbol}, ${ruder.symbol}; --card-red ${nu.kortRød}`);
    tjek(spar.symbol === spar.kort && klør.symbol === klør.kort && spar.symbol !== hjerter.symbol, `${navn}: ♠ og ♣ står i kortenes sorte farve`, JSON.stringify([spar, klør]));
    tjek(new Set(nu.rækker.map((r) => r.kort)).size === 1, `${navn}: kortene i ♥ og ♦ har samme farve som i ♠ og ♣`, nu.rækker.map((r) => `${r.farve} ${r.kort}`).join(', '));
    tjek(new Set(nu.rækker.map((r) => r.antal)).size === 1, `${navn}: (antal) har samme farve i alle fire rækker`, nu.rækker.map((r) => `${r.farve} ${r.antal}`).join(', '));
    tjek(JSON.stringify(nu.røde) === JSON.stringify(før.røde) && JSON.stringify(nu.sorte) === JSON.stringify(før.sorte) && nu.røde[0] === rgb('#c62828'),
      `${navn}: spillekortene har samme farver som før`, `røde ${nu.røde} (før ${før.røde}), sorte ${nu.sorte} (før ${før.sorte})`);
    console.log(`     ${navn} før: ${før.rækker.map((r) => `${r.farve} symbol ${r.symbol}, kort ${r.kort}`).join('; ')}`);
  }
} catch (e) {
  tjek(false, 'testen kørte færdig', e.message);
} finally {
  browser.close();
  proc.kill();
  await serverNu.close();
  await serverFør.close();
  fjernFør(førMappe);
  await vent(300);
  try { rmSync(profil, { recursive: true, force: true }); rmSync(cache, { recursive: true, force: true }); } catch {}
}
console.log(fejl ? `\n${fejl} fejl` : '\nAlt er grønt');
process.exit(fejl ? 1 : 0);
