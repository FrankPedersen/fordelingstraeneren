// Accepttest (SPEC-design-som-forsiden.md, Del 1): forsidens farver, skrift og hjørner i en rigtig browser. Appen startes
// med Vite fra arbejdsmappen og åbnes i Chrome eller Edge uden vindue, ved 1280 og 390 px, i lys og mørk tilstand, med
// låste tilfældigheder og en tom lagring pr. skærm. På hver skærm kigges på alle synlige elementer:
//
//   - skriften er hentet (Inter 400 og 600 og Manrope 800), og ingen tekst står i en anden skrift eller vægt;
//   - ingen af de gamle farver er i brug;
//   - tekst har kontrast 4,5:1 mod sin flade, også gennem gennemsigtige flader;
//   - intet stikker ud til siden, og ingen knap klipper sin tekst.
//
// Skærmbillederne af Forsiden, Træning, Analyse og Pointregnskab gemmes i ../skaermbilleder/design-forsiden/.
//
//   node scripts/tjek-design-forsiden.mjs                alle skærme
//   node scripts/tjek-design-forsiden.mjs analyse facit  kun de nævnte skærme
//
// Kræver Node 22+ og Chrome eller Edge.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const ROD = fileURLToPath(new URL('..', import.meta.url));
const BILLEDER = join(ROD, '..', 'skaermbilleder', 'design-forsiden');
const KUN = process.argv.slice(2);
const SAMTIDIGE = 4;
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

// Faste seeds og et fast tidspunkt, så opgaverne og datoerne er de samme hver gang.
const FAST = `(() => {
  let s = 12345;
  const next = () => { s = (s * 1103515245 + 12345) >>> 0; return s; };
  crypto.getRandomValues = (a) => { for (let i = 0; i < a.length; i++) a[i] = next() % (2 ** (8 * a.BYTES_PER_ELEMENT)); return a; };
  Math.random = () => next() / 4294967296;
  const T = Date.UTC(2026, 9, 31, 9, 0, 0);
  const Real = Date;
  class FastDate extends Real { constructor(...a) { super(...(a.length ? a : [T])); } static now() { return T; } }
  globalThis.Date = FastDate;
})();`;

async function chrome() {
  const port = 9300 + Math.floor(Math.random() * 400);
  const profil = mkdtempSync(join(tmpdir(), 'design-'));
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profil}`, '--no-first-run',
    '--hide-scrollbars', '--force-color-profile=srgb', '--lang=da-DK', 'about:blank'], { stdio: 'ignore' });
  let version;
  for (let i = 0; i < 100 && !version; i++) {
    try { version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await vent(200); }
  }
  if (!version) throw new Error('Browseren svarer ikke');
  const forbind = async (url) => {
    const ws = new WebSocket(url);
    await new Promise((ok, nej) => { ws.onopen = ok; ws.onerror = nej; });
    let id = 0;
    const venter = new Map();
    ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && venter.has(d.id)) { venter.get(d.id)(d); venter.delete(d.id); } };
    const send = (method, params = {}) => new Promise((ok) => { const n = ++id; venter.set(n, ok); ws.send(JSON.stringify({ id: n, method, params })); });
    return { ws, send };
  };
  const browser = await forbind(version.webSocketDebuggerUrl);
  return {
    luk() {
      proc.kill();
      try { rmSync(profil, { recursive: true, force: true }); } catch {}
    },
    /** En fane i sin egen kontekst (tom lagring). */
    async fane(bredde, tilstand) {
      const { result: { browserContextId } } = await browser.send('Target.createBrowserContext');
      const { result: { targetId } } = await browser.send('Target.createTarget', { url: 'about:blank', browserContextId });
      const { ws, send } = await forbind(`ws://127.0.0.1:${port}/devtools/page/${targetId}`);
      const kør = async (expression) => {
        const d = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
        if (d.result?.exceptionDetails) throw new Error(`${expression.slice(0, 80)}: ${d.result.exceptionDetails.exception?.description}`);
        return d.result?.result?.value;
      };
      await send('Page.enable');
      await send('Emulation.setDeviceMetricsOverride', { width: bredde, height: 900, deviceScaleFactor: 1, mobile: bredde < 600 });
      await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: tilstand }, { name: 'prefers-reduced-motion', value: 'reduce' }] });
      await send('Page.addScriptToEvaluateOnNewDocument', { source: FAST });
      return {
        kør,
        async gå(url) {
          await send('Page.navigate', { url });
          for (let i = 0; i < 100; i++) { await vent(100); if ((await kør('document.readyState')) === 'complete') break; }
          await kør('document.fonts.ready');
          await vent(500);
        },
        /** Klikker på den første synlige knap, hvis tekst (eller aria-label) er teksten; "~tekst" er en del af teksten. */
        async klik(tekst) {
          const del = tekst.startsWith('~');
          const t = del ? tekst.slice(1) : tekst;
          for (let i = 0; i < 30; i++) {
            const ok = await kør(`(() => {
              const el = [...document.querySelectorAll('button, a, [role=button], [role=tab]')].find((b) => {
                const s = (b.getAttribute('aria-label') || b.textContent || '').replace(/\\s+/g, ' ').trim();
                return b.offsetParent !== null && !b.disabled && (${del} ? s.includes(${JSON.stringify(t)}) : s === ${JSON.stringify(t)});
              });
              if (el) el.click();
              return !!el;
            })()`);
            if (ok) { await vent(350); return; }
            await vent(200);
          }
          throw new Error(`Fandt ikke "${tekst}"`);
        },
        knapper: () => kør(`[...document.querySelectorAll('button, a, [role=tab]')].filter((b) => b.offsetParent !== null).map((b) => (b.getAttribute('aria-label') || b.textContent).replace(/\\s+/g, ' ').trim())`),
        /** Hele siden, når den står stille. */
        async billede() {
          await kør('window.scrollTo(0, 0)');
          let forrige;
          for (let i = 0; i < 8; i++) {
            await vent(400);
            const h = await kør('Math.max(document.documentElement.scrollHeight, innerHeight)');
            const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: bredde, height: h, scale: 1 } });
            if (r.result.data === forrige) break;
            forrige = r.result.data;
          }
          return forrige;
        },
        async luk() {
          ws.close();
          await browser.send('Target.disposeBrowserContext', { browserContextId });
        },
      };
    },
  };
}

async function svarIndtil(s, selector) {
  for (let i = 0; i < 60; i++) {
    if (await s.kør(`!!document.querySelector(${JSON.stringify(selector)})`)) return;
    const knapper = await s.knapper();
    if (knapper.includes('Næste')) await s.klik('Næste');
    else if (knapper.includes('3')) {
      await s.klik('3');
      if ((await s.knapper()).includes('OK')) await s.klik('OK');
    } else {
      const valg = knapper.find((k) => !/^(Hjælp|Tilbage|Afbryd|Vis ledetråd|Niveau|7NT)/.test(k));
      if (!valg) break;
      await s.klik(valg);
    }
  }
  throw new Error(`Kom ikke frem til ${selector}`);
}

const SKÆRME = {
  forside: async (s, u) => { await s.gå(u); },
  fordeling: async (s, u) => { await s.gå(`${u}#fordeling`); },
  nytMønster: async (s, u) => { await s.gå(`${u}#fordeling`); await s.klik('Start dagens session'); },
  tastatur: async (s, u) => { await s.gå(`${u}#fordeling`); await s.klik('Start dagens session'); await s.klik('Videre'); },
  huskepalads: async (s, u) => { await s.gå(`${u}#fordeling`); await s.klik('Huskepalads'); },
  album: async (s, u) => { await s.gå(`${u}#fordeling`); await s.klik('Album'); },
  kurver: async (s, u) => { await s.gå(`${u}#fordeling`); await s.klik('Kurver'); },
  klubaften: async (s, u) => { await s.gå(`${u}#fordeling`); await s.klik('Klubaften'); },
  vejledning: async (s, u) => { await s.gå(u); await s.klik('Læs vejledningen'); },
  indstillinger: async (s, u) => { await s.gå(u); await s.klik('Indstillinger'); },
  farvebehandling: async (s, u) => { await s.gå(`${u}#farvebehandling`); },
  introduktion: async (s, u) => { await s.gå(`${u}#farvebehandling`); await s.klik('Start dagens session'); },
  træning: async (s, u) => { await s.gå(`${u}#farvebehandling`); await s.klik('Start dagens session'); await s.klik('Prøv den'); },
  facit: async (s, u) => { await SKÆRME.træning(s, u); await s.klik('~Linje A:'); await s.klik('50–75 %'); await s.klik('Svar'); },
  spilSelv: async (s, u) => { await SKÆRME.facit(s, u); await s.klik('Spil den selv ▶'); },
  selvvalgt: async (s, u) => { await s.gå(`${u}#farvebehandling`); await s.klik('Selvvalgt'); await s.klik('~Start ·'); },
  paladset: async (s, u) => { await s.gå(`${u}#farvebehandling`); await s.klik('Paladset'); },
  fbKlubaften: async (s, u) => { await s.gå(`${u}#farvebehandling`); await s.klik('Klubaften'); },
  statistik: async (s, u) => { await s.gå(`${u}#farvebehandling`); await s.klik('Statistik'); },
  data: async (s, u) => { await s.gå(`${u}#farvebehandling`); await s.klik('~Dine data'); },
  analyse: async (s, u) => { await s.gå(`${u}#farvebehandling`); await s.klik('Analyse'); await s.klik('~3. E D 6 5'); },
  guide: async (s, u) => { await s.gå(`${u}#analyse`); await s.klik('Guide'); },
  pointregnskabStart: async (s, u) => { await s.gå(`${u}#pointregnskab`); },
  prOpvarmning: async (s, u) => { await s.gå(`${u}#pointregnskab`); await s.klik('Start dagens session'); },
  pointregnskab: async (s, u) => { await SKÆRME.prOpvarmning(s, u); await svarIndtil(s, '.pr-hand'); },
  prIndstillinger: async (s, u) => { await s.gå(`${u}#pointregnskab`); await s.klik('Indstillinger'); },
  håndevalueringStart: async (s, u) => { await s.gå(`${u}#haandevaluering`); },
  heOpvarmning: async (s, u) => { await s.gå(`${u}#haandevaluering`); await s.klik('Start dagens session'); },
  håndevaluering: async (s, u) => { await SKÆRME.heOpvarmning(s, u); await svarIndtil(s, '.he-hands'); },
  heIndstillinger: async (s, u) => { await s.gå(`${u}#haandevaluering`); await s.klik('Indstillinger'); },
};

/** Skærmene, Frank får billeder af (specens sidste afsnit). */
const BILLEDE = { forside: 'forside', træning: 'traening', analyse: 'analyse', pointregnskab: 'pointregnskab' };

// Kører i siden: ser på alle synlige elementer.
const UNDERSØG = `(() => {
  const GAMLE = ['rgb(91, 107, 130)', 'rgb(159, 176, 198)', 'rgb(42, 52, 66)', 'rgb(227, 233, 241)', 'rgb(245, 246, 248)', 'rgb(24, 32, 43)', 'rgb(216, 221, 229)', 'rgb(38, 50, 65)'];
  const parse = (c) => {
    const m = c && c.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const p = m[1].split(/[ ,/]+/).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] };
  };
  const læg = (top, bund) => ({ r: top.r * top.a + bund.r * (1 - top.a), g: top.g * top.a + bund.g * (1 - top.a), b: top.b * top.a + bund.b * (1 - top.a), a: 1 });
  const lum = ({ r, g, b }) => {
    const l = (c) => (c / 255 <= 0.03928 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4);
    return 0.2126 * l(r) + 0.7152 * l(g) + 0.0722 * l(b);
  };
  const lærred = matchMedia('(prefers-color-scheme: dark)').matches ? { r: 18, g: 22, b: 28, a: 1 } : { r: 242, g: 243, b: 244, a: 1 };
  const flade = (el) => {
    const lag = [];
    // En flade tæller kun, hvis teksten ligger på den: tallene over søjlerne står uden for søjlen.
    const k = el.getBoundingClientRect();
    const x = k.left + k.width / 2, y = k.top + k.height / 2;
    for (let e = el; e; e = e.parentElement) {
      const f = e.getBoundingClientRect();
      if (e !== document.body && e !== document.documentElement && (x < f.left || x > f.right || y < f.top || y > f.bottom)) continue;
      const c = parse(getComputedStyle(e).backgroundColor);
      if (c && c.a > 0) { lag.push(c); if (c.a === 1) break; }
    }
    return lag.reverse().reduce((bund, top) => læg(top, bund), lærred);
  };
  const navn = (el) => el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\\s+/).join('.') : '');
  const ud = { farve: new Set(), skrift: new Set(), vægt: new Set(), kontrast: new Map(), klippet: new Set() };
  for (const el of document.querySelectorAll('body, body *')) {
    if (!el.getClientRects().length) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden') continue;
    for (const v of [cs.color, cs.backgroundColor, cs.borderTopColor, cs.borderRightColor, cs.borderBottomColor, cs.borderLeftColor, cs.outlineColor]) {
      if (GAMLE.includes(v)) ud.farve.add(navn(el) + ': ' + v);
    }
    const tekst = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent.trim()).join(' ');
    if (!tekst) continue;
    const først = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
    // Kode i Guiden (linjeformatet) står i fast bredde.
    if (!el.closest('code') && (/system-ui/.test(cs.fontFamily) || !['Inter', 'Manrope', 'Georgia'].includes(først))) ud.skrift.add(navn(el) + ': ' + cs.fontFamily.slice(0, 40));
    if (!['400', '600', '800'].includes(cs.fontWeight) || (cs.fontWeight === '800' && først !== 'Manrope')) ud.vægt.add(navn(el) + ': ' + først + ' ' + cs.fontWeight);
    if (el.tagName === 'BUTTON' && el.scrollWidth > el.clientWidth + 1) ud.klippet.add(navn(el) + ': ' + tekst.slice(0, 30));
    if (el.closest('[disabled], [aria-disabled="true"], svg')) continue;
    const c = parse(cs.color);
    if (!c || c.a === 0) continue;
    const bund = flade(el);
    const [hi, lo] = [lum(læg(c, bund)), lum(bund)].sort((a, b) => b - a);
    const k = (hi + 0.05) / (lo + 0.05);
    if (k < 4.5) ud.kontrast.set(navn(el), k.toFixed(2) + ' "' + tekst.slice(0, 24) + '"');
  }
  const hentet = [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/["']/g, '') + ' ' + f.weight);
  return {
    farve: [...ud.farve], skrift: [...ud.skrift], vægt: [...ud.vægt], klippet: [...ud.klippet],
    kontrast: [...ud.kontrast].map(([k, v]) => k + ' ' + v),
    hentet: [...new Set(hentet)],
    forBred: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    bg: getComputedStyle(document.body).backgroundColor,
  };
})()`;

mkdirSync(BILLEDER, { recursive: true });
const cache = mkdtempSync(join(tmpdir(), 'design-vite-'));
const server = await createServer({ root: ROD, cacheDir: cache, logLevel: 'silent', server: { port: 5195 } });
await server.listen();
const NU = server.resolvedUrls.local[0];
const b = await chrome();

let fejl = 0;
const set = new Set();
const opgaver = [];
for (const bredde of [1280, 390]) {
  for (const tilstand of ['light', 'dark']) {
    for (const [navn, gå] of Object.entries(SKÆRME)) {
      if (KUN.length && !KUN.includes(navn)) continue;
      opgaver.push({ bredde, tilstand, navn, gå });
    }
  }
}

async function kør({ bredde, tilstand, navn, gå }) {
  const hvor = `${navn} ${bredde} ${tilstand === 'light' ? 'lys' : 'mørk'}`;
  const s = await b.fane(bredde, tilstand);
  const linjer = [];
  try {
    await gå(s, NU);
    // Skriften hentes først, når der er tekst på skærmen, så der ventes højst 5 sekunder på den.
    let r;
    for (let i = 0; i < 25; i++) {
      await s.kør('document.fonts.ready');
      await vent(200);
      r = await s.kør(UNDERSØG);
      if (r.hentet.includes('Inter 400')) break;
    }
    const meld = (ok, tekst) => { if (!ok) { fejl++; linjer.push(`FEJL ${hvor}: ${tekst}`); } };
    meld(!r.farve.length, `gamle farver: ${r.farve.slice(0, 4).join(' ; ')}`);
    meld(!r.skrift.length, `anden skrift: ${r.skrift.slice(0, 4).join(' ; ')}`);
    meld(!r.vægt.length, `anden vægt: ${r.vægt.slice(0, 4).join(' ; ')}`);
    meld(!r.kontrast.length, `kontrast under 4,5:1: ${r.kontrast.slice(0, 5).join(' ; ')}`);
    meld(!r.klippet.length, `knap klipper teksten: ${r.klippet.slice(0, 4).join(' ; ')}`);
    meld(r.forBred <= 0, `${r.forBred} px for bredt`);
    meld(r.hentet.includes('Inter 400'), `Inter 400 er ikke hentet: ${r.hentet.join(', ')}`);
    for (const f of r.hentet) set.add(f);
    if (BILLEDE[navn]) {
      const data = await s.billede();
      writeFileSync(join(BILLEDER, `${bredde}-${BILLEDE[navn]}${tilstand === 'dark' ? '-moerk' : ''}.png`), Buffer.from(data, 'base64'));
    }
  } catch (e) {
    fejl++;
    linjer.push(`FEJL ${hvor}: ${e.message}`);
  } finally {
    await s.luk();
  }
  for (const l of linjer) console.log(l);
}

const kø = [...opgaver];
await Promise.all(Array.from({ length: SAMTIDIGE }, async () => { while (kø.length) await kør(kø.shift()); }));

for (const f of ['Inter 400', 'Inter 600', 'Manrope 800']) {
  if (!set.has(f) && !KUN.length) { fejl++; console.log(`FEJL ${f} blev ikke hentet på nogen skærm`); }
}
console.log(`\n${opgaver.length} visninger af ${new Set(opgaver.map((o) => o.navn)).size} skærme. Hentet: ${[...set].sort().join(', ')}.`);
console.log(fejl ? `${fejl} FEJL` : 'Alt i orden');
b.luk();
await server.close();
try { rmSync(cache, { recursive: true, force: true }); } catch {}
process.exit(fejl ? 1 : 0);
