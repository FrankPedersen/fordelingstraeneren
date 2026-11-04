// Accepttest (SPEC-bred-layout.md og Del 2 af SPEC-design-som-forsiden.md): det brede layout fra 1000 px i en rigtig
// browser. Appen startes med Vite fra arbejdsmappen, og referencen (appen efter Del 1, tagget v34-foer-analyse-layout)
// lægges i en midlertidig git worktree og startes ved siden af. Begge åbnes i Chrome eller Edge uden vindue;
// tilfældighederne og tiden er låst, så opgaverne er de samme hver gang, og hver skærm får sin egen tomme lagring.
//
//   node scripts/tjek-bred-layout.mjs                     alle skærme
//   node scripts/tjek-bred-layout.mjs analyse             kun Analyse i pixelsammenligningen
//   node scripts/tjek-bred-layout.mjs ingen               uden pixelsammenligningen (kun layout og overlap)
//   node scripts/tjek-bred-layout.mjs --billeder=mappe    gemmer også skærmbillederne til Frank i mappen
//
// Ved 1280 px står bordet til venstre og opgaven til højre med toppene ud for hinanden, og indholdet er højst 1120 px
// bredt i midten. Bordet står kun fast i en skærm med to spalter, og kun når det er lavere end vinduet. Ved 1280 × 900
// og 1000 × 700 rulles Analyse, Spil den selv, Træning og Pointregnskab fra top til bund, og bordets spalte må aldrig
// dække noget. Efter sidste stik i Spil den selv kan dommen og resultatet ses. Analyse følger tegningen. Pointregnskab,
// Håndevaluering, Spil den selv og en session med tastatur har to spalter, og vejledningens indholdsfortegnelse står
// til venstre. Ved 1000 px er højre spalte mindst 400 px. Linjekortenes trin har samme afstand på mobil og computer, og
// tab-rækkefølgen er den samme før og efter. Ved 999 og 390 px er skærmene pixel for pixel som referencen; rettelsen af
// den deaktiverede primærknap lægges på referencen, så den ikke tæller som en forskel. Kræver Node 22+, git og Chrome
// eller Edge.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const ROD = fileURLToPath(new URL('..', import.meta.url));
const TAG = 'v34-foer-analyse-layout';
// Skærmnavne som argumenter begrænser pixelsammenligningen til dem; en forskel gemmes som billeder her.
const KUN = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const BILLEDER = process.argv.find((a) => a.startsWith('--billeder='))?.slice('--billeder='.length);
const FORSKELLE = join(tmpdir(), 'tjek-bred-layout');
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
const ca = (a, b, tol = 1) => Math.abs(a - b) <= tol;

// Faste seeds og et fast tidspunkt (31. oktober 2026 kl. 10), så opgaverne og datoerne er de samme hver gang.
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

// Rettelsen af den deaktiverede primærknap (Del 2, punkt 6), lagt på referencen.
const KNAP_RETTET = '.btn.primary:disabled { background: var(--surface-2); border-color: var(--surface-2); color: var(--muted); opacity: 1; }';

async function chrome() {
  const port = 9300 + Math.floor(Math.random() * 400);
  const profil = mkdtempSync(join(tmpdir(), 'bred-'));
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profil}`, '--no-first-run',
    '--hide-scrollbars', '--force-color-profile=srgb', '--font-render-hinting=none', '--lang=da-DK', 'about:blank'], { stdio: 'ignore' });
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
    /** En fane i sin egen kontekst (tom lagring) med bredde × højde. */
    async fane(bredde, højde = 900) {
      const { result: { browserContextId } } = await browser.send('Target.createBrowserContext');
      const { result: { targetId } } = await browser.send('Target.createTarget', { url: 'about:blank', browserContextId });
      const { ws, send } = await forbind(`ws://127.0.0.1:${port}/devtools/page/${targetId}`);
      const kør = async (expression) => {
        const d = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
        if (d.result?.exceptionDetails) throw new Error(`${expression.slice(0, 80)}: ${d.result.exceptionDetails.exception?.description}`);
        return d.result?.result?.value;
      };
      await send('Page.enable');
      await send('Emulation.setDeviceMetricsOverride', { width: bredde, height: højde, deviceScaleFactor: 1, mobile: bredde < 600 });
      await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }, { name: 'prefers-reduced-motion', value: 'reduce' }] });
      await send('Emulation.setFocusEmulationEnabled', { enabled: true });
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
          // Siden kan stadig være ved at starte (Vite optimerer afhængigheder og genindlæser), så der ventes på knappen.
          for (let forsøg = 0; forsøg < 80; forsøg++) {
            const ok = await kør(`(() => {
              const el = [...document.querySelectorAll('button, a, [role=button], [role=tab]')].find((b) => {
                const s = (b.getAttribute('aria-label') || b.textContent || '').replace(/\\s+/g, ' ').trim();
                return b.offsetParent !== null && !b.disabled && (${del} ? s.includes(${JSON.stringify(t)}) : s === ${JSON.stringify(t)});
              });
              if (el) el.click();
              return !!el;
            })()`);
            if (ok) {
              await vent(350);
              return;
            }
            await vent(250);
          }
          throw new Error(`Fandt ikke "${tekst}"`);
        },
        knapper: () => kør(`[...document.querySelectorAll('button, a, [role=tab]')].filter((b) => b.offsetParent !== null).map((b) => (b.getAttribute('aria-label') || b.textContent).replace(/\\s+/g, ' ').trim()).filter(Boolean)`),
        /** Kassen for det første synlige element, der matcher selectoren. */
        kasse: (sel) => kør(`(() => {
          const el = [...document.querySelectorAll(${JSON.stringify(sel)})].find((e) => e.getClientRects().length > 0);
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height, klasse: el.className };
        })()`),
        async tab(antal) {
          await kør('document.activeElement?.blur(); window.scrollTo(0, 0)');
          const sti = [];
          for (let i = 0; i < antal; i++) {
            await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
            await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
            sti.push(await kør(`(() => { const e = document.activeElement; return e ? e.tagName + ':' + (e.getAttribute('aria-label') || e.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 40) : ''; })()`));
          }
          return sti;
        },
        /** Hele siden, når den står stille: to billeder i træk skal være ens (Analyse regner færdig bagefter). */
        async billede() {
          await kør(`window.scrollTo(0, 0); document.head.insertAdjacentHTML('beforeend', '<style>${KNAP_RETTET}</style>')`);
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
        /** Kun vinduet, som en bruger ser det: et billede af hele siden viser ikke, hvor en fast spalte står. */
        async vindue() {
          await vent(400);
          return (await send('Page.captureScreenshot', { format: 'png' })).result.data;
        },
        async luk() {
          ws.close();
          await browser.send('Target.disposeBrowserContext', { browserContextId });
        },
      };
    },
  };
}

// Skærmene: hver funktion går fra en tom fane til skærmen.
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
  huskepalads: async (s, u) => { await s.gå(`${u}#fordeling`); await s.klik('Huskepalads'); },
  farvebehandling: async (s, u) => { await s.gå(`${u}#farvebehandling`); },
  introduktion: async (s, u) => { await s.gå(`${u}#farvebehandling`); await s.klik('Start dagens session'); },
  paladset: async (s, u) => { await s.gå(`${u}#farvebehandling`); await s.klik('Paladset'); },
  fbKlubaften: async (s, u) => { await s.gå(`${u}#farvebehandling`); await s.klik('Klubaften'); },
  pointregnskabStart: async (s, u) => { await s.gå(`${u}#pointregnskab`); },
  håndevalueringStart: async (s, u) => { await s.gå(`${u}#haandevaluering`); },
  heIndstillinger: async (s, u) => { await s.gå(`${u}#haandevaluering`); await s.klik('Indstillinger'); },
  tastatur: async (s, u) => { await s.gå(`${u}#fordeling`); await s.klik('Start dagens session'); await s.klik('Videre'); },
  vejledning: async (s, u) => { await s.gå(u); await s.klik('Læs vejledningen'); },
  indstillinger: async (s, u) => { await s.gå(u); await s.klik('Indstillinger'); },
  album: async (s, u) => { await s.gå(`${u}#fordeling`); await s.klik('Album'); },
  kurver: async (s, u) => { await s.gå(`${u}#fordeling`); await s.klik('Kurver'); },
  klubaften: async (s, u) => { await s.gå(`${u}#fordeling`); await s.klik('Klubaften'); },
  træning: async (s, u) => { await s.gå(`${u}#farvebehandling`); await s.klik('Start dagens session'); await s.klik('Prøv den'); },
  facit: async (s, u) => { await SKÆRME.træning(s, u); await s.klik('~Linje A:'); await s.klik('50–75 %'); await s.klik('Svar'); },
  spilSelv: async (s, u) => { await SKÆRME.facit(s, u); await s.klik('Spil den selv ▶'); },
  selvvalgt: async (s, u) => { await s.gå(`${u}#farvebehandling`); await s.klik('Selvvalgt'); await s.klik('~Start ·'); },
  analyse: async (s, u) => { await s.gå(`${u}#farvebehandling`); await s.klik('Analyse'); await s.klik('~3. E D 6 5'); },
  analyseSpil: async (s, u) => { await SKÆRME.analyse(s, u); await s.klik('Spil den selv ▶'); },
  guide: async (s, u) => { await s.gå(`${u}#analyse`); await s.klik('Guide'); },
  statistik: async (s, u) => { await s.gå(`${u}#farvebehandling`); await s.klik('Statistik'); },
  data: async (s, u) => { await s.gå(`${u}#farvebehandling`); await s.klik('~Dine data'); },
  prOpvarmning: async (s, u) => { await s.gå(`${u}#pointregnskab`); await s.klik('Start dagens session'); },
  pointregnskab: async (s, u) => { await SKÆRME.prOpvarmning(s, u); await svarIndtil(s, '.pr-hand'); },
  prIndstillinger: async (s, u) => { await s.gå(`${u}#pointregnskab`); await s.klik('Indstillinger'); },
  heOpvarmning: async (s, u) => { await s.gå(`${u}#haandevaluering`); await s.klik('Start dagens session'); },
  håndevaluering: async (s, u) => { await SKÆRME.heOpvarmning(s, u); await svarIndtil(s, '.he-hands'); },
};

/** To spalter: venstre spalte og det første element i højre spalte står side om side. */
async function toSpalter(s, beholder, navn, { toppe = false } = {}) {
  const l = await s.kasse(`${beholder} > .wide-left`);
  const r = await s.kør(`(() => {
    // Beholderen kan selv være display: contents (Analyses kolonner), så den findes på sin synlige venstre spalte.
    const b = [...document.querySelectorAll(${JSON.stringify(beholder)})].find((e) => e.querySelector(':scope > .wide-left')?.getClientRects().length > 0);
    const l = b?.querySelector(':scope > .wide-left')?.getBoundingClientRect();
    if (!b || !l) return null;
    const højre = b.querySelector(':scope > .wide-right');
    const kasser = [...(højre ? [højre] : b.querySelectorAll(':scope > :not(.wide-left)'))].map((e) => e.getBoundingClientRect()).filter((k) => k.width > 0 && k.left >= l.right - 1);
    if (!kasser.length) return null;
    const k = kasser.reduce((a, c) => (c.top < a.top ? c : a));
    return { top: k.top, left: k.left, right: k.right, bottom: k.bottom, width: k.width };
  })()`);
  if (!l || !r) return tjek(false, `${navn}: to spalter`, `venstre ${JSON.stringify(l)}, højre ${JSON.stringify(r)}`);
  tjek(l.right <= r.left && r.top < l.bottom && l.top < r.bottom, `${navn}: to spalter side om side`, `venstre ${l.left}–${l.right}, højre ${r.left}–${r.right}`);
  if (toppe) tjek(ca(l.top, r.top), `${navn}: toppene ud for hinanden`, `venstre ${l.top}, højre ${r.top}`);
  const bredde = await s.kør('document.documentElement.scrollWidth - innerWidth');
  tjek(bredde <= 0, `${navn}: intet stikker ud til siden`, `${bredde} px for bredt`);
  return { l, r };
}

/** Linjekortenes trin er så høje som deres tekst, og der er lige langt fra overskriften til første trin. */
async function trinafstand(s, navn) {
  const d = await s.kør(`(() => {
    const trin = [...document.querySelectorAll('.fb-line .fb-step, .fb-line .fb-steps > li')].filter((e) => e.getClientRects().length > 0);
    const for_høje = trin.filter((e) => {
      const r = document.createRange();
      r.selectNodeContents(e);
      const linjer = new Set([...r.getClientRects()].filter((k) => k.width > 0).map((k) => Math.round(k.top))).size;
      const lh = parseFloat(getComputedStyle(e).lineHeight);
      return Math.abs(e.getBoundingClientRect().height - linjer * lh) > 1.5;
    }).map((e) => e.textContent.slice(0, 30) + ' (' + e.getBoundingClientRect().height + ' px)');
    const afstande = [...document.querySelectorAll('.fb-line')].filter((e) => e.getClientRects().length > 0).map((l) => {
      const h = l.querySelector('.fb-line-head')?.getBoundingClientRect();
      const t = l.querySelector('.fb-step, .fb-steps > li')?.getBoundingClientRect();
      return h && t ? Math.round(t.top - h.bottom) : null;
    }).filter((x) => x !== null);
    return { antal: trin.length, for_høje, afstande };
  })()`);
  tjek(d.antal >= 2 && d.for_høje.length === 0, `${navn}: trinene er så høje som teksten`, d.antal < 2 ? `kun ${d.antal} trin` : d.for_høje.join('; '));
  tjek(d.afstande.length >= 2 && d.afstande.every((a) => ca(a, d.afstande[0])), `${navn}: samme afstand fra overskrift til trin i Linje A og B`, JSON.stringify(d.afstande));
}

/** Spiller Spil den selv færdig: det første kort, der kan spilles, indtil resultatet står der. */
async function spilFærdig(s) {
  for (let i = 0; i < 80; i++) {
    if (await s.kør(`!!document.querySelector('.fb-play-result')`)) return;
    await s.kør(`document.querySelector('.fb-hand-card:not(:disabled)')?.click(); true`);
    await vent(60);
  }
  throw new Error('Spil den selv blev ikke færdigt');
}

/**
 * Bordets spalte (.wide-left) må aldrig dække noget (Del 2, punkt 1 og 2). Siden rulles fra top til bund, og ved hvert
 * skridt ses på alle knapper og tekster: de må ikke overlappe en spalte, de ikke selv står i, og det, der står øverst
 * midt på dem, må ikke være en anden spalte. En fast spalte skal stå i en skærm med to spalter og være lavere end vinduet.
 */
async function ingenOverlap(s, navn) {
  const r = await s.kør(`(async () => {
    const synlig = (e) => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';
    const blade = () => [...document.querySelectorAll('button, a, input, h1, h2, h3, h4, p, li, td, th, label, output, figcaption, span')]
      .filter((e) => synlig(e) && (e.matches('button, a, input, output') || [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())));
    const navn = (e) => e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\\s+/).join('.') : '') + ' "' + (e.textContent || '').trim().slice(0, 24) + '"';
    // Det, der kan ses af et element: en rullekasse klipper det, der er rullet ud af den (fx kombinationerne i banken).
    const kasse = (e) => {
      const f = e.getBoundingClientRect();
      let { left, right, top, bottom } = f;
      for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
        const o = getComputedStyle(a);
        if (o.overflowX === 'visible' && o.overflowY === 'visible') continue;
        const g = a.getBoundingClientRect();
        left = Math.max(left, g.left); right = Math.min(right, g.right); top = Math.max(top, g.top); bottom = Math.min(bottom, g.bottom);
      }
      return { left, right, top, bottom };
    };
    const fund = new Map();
    const fejl = new Set();
    const max = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    const skridt = [];
    for (let y = 0; y < max; y += 80) skridt.push(y);
    skridt.push(max);
    let fast = 0;
    for (const y of skridt) {
      scrollTo(0, y);
      await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
      const alle = blade();
      const spalter = [...document.querySelectorAll('.wide-left')].filter((w) => getComputedStyle(w).display !== 'contents' && synlig(w));
      for (const w of spalter) {
        const cs = getComputedStyle(w);
        if (cs.zIndex !== 'auto') fejl.add('spalten har z-index ' + cs.zIndex);
        const k = w.getBoundingClientRect();
        if (cs.position === 'sticky') {
          fast++;
          let far = w.parentElement;
          while (far && getComputedStyle(far).display === 'contents') far = far.parentElement;
          if (far.getBoundingClientRect().width > 0 && getComputedStyle(far).gridTemplateColumns.trim().split(/\\s+/).length < 2) fejl.add('fast spalte i en skærm med én spalte: ' + navn(far));
          if (w.scrollHeight > innerHeight - 32 + 1) fejl.add('fast spalte højere end vinduet: ' + w.scrollHeight + ' px');
        }
        for (const e of alle) {
          if (w.contains(e) || e.contains(w)) continue;
          const f = kasse(e);
          if (f.bottom <= f.top || f.right <= f.left || f.bottom <= 0 || f.top >= innerHeight) continue;
          const lodret = Math.min(k.bottom, f.bottom) - Math.max(k.top, f.top);
          const vandret = Math.min(k.right, f.right) - Math.max(k.left, f.left);
          if (lodret > 1 && vandret > 1 && !fund.has(navn(e))) fund.set(navn(e), Math.round(lodret) + ' px ved y=' + y);
        }
      }
      for (const e of alle) {
        const f = kasse(e);
        if (f.bottom <= f.top || f.right <= f.left) continue;
        const x = (f.left + f.right) / 2, yy = (f.top + f.bottom) / 2;
        if (yy < 0 || yy >= innerHeight || x < 0 || x >= innerWidth) continue;
        const top = document.elementFromPoint(x, yy);
        if (!top || e.contains(top) || top.contains(e)) continue;
        const w = top.closest('.wide-left');
        if (w && !w.contains(e) && !fund.has(navn(e))) fund.set(navn(e), 'dækket ved y=' + y);
      }
    }
    scrollTo(0, 0);
    return { fund: [...fund].map(([k, v]) => k + ': ' + v), fejl: [...fejl], fast, max };
  })()`);
  tjek(!r.fund.length, `${navn}: bordets spalte dækker ikke noget`, `${r.fund.length} elementer, fx ${r.fund.slice(0, 3).join(' ; ')}`);
  tjek(!r.fejl.length, `${navn}: spalten står kun fast, når den må`, r.fejl.join(' ; '));
}

/** Efter sidste stik kan dommen ses med det samme, og når der rulles til bunden af resultatet, kan det ses helt (punkt 3). */
async function dommenKanSes(s, navn) {
  const r = await s.kør(`(async () => {
    const fri = (e) => {
      const f = e.getBoundingClientRect();
      const top = document.elementFromPoint(f.left + f.width / 2, f.top + f.height / 2);
      return f.top >= 0 && f.bottom <= innerHeight + 1 && !!top && (e.contains(top) || top.contains(e));
    };
    const dom = document.querySelector('.fb-play-result .feedback');
    const straks = !!dom && fri(dom);
    const res = document.querySelector('.fb-play-result');
    const y = res.getBoundingClientRect().bottom + scrollY - innerHeight;
    scrollTo(0, Math.max(0, y) + 8);
    await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
    const sidste = res.lastElementChild;
    return { straks, bund: fri(sidste), højde: Math.round(res.getBoundingClientRect().height) };
  })()`);
  tjek(r.straks, `${navn}: dommen kan ses efter sidste stik`, `resultatet er ${r.højde} px højt`);
  tjek(r.bund, `${navn}: bunden af resultatet kan ses`, `resultatet er ${r.højde} px højt`);
}

/** Analyse følger tegningen ved 1280 px (Del 2, punkt 5, og docs/specs/design/Analyse.png). */
async function analyseSomTegningen(s) {
  const d = await s.kør(`(() => {
    const k = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
    const q = (x) => document.querySelector(x);
    const a = (x) => [...document.querySelectorAll(x)].filter((e) => e.getClientRects().length > 0);
    const spalte = q('.fb-analysis .fb-column > .wide-left');
    const sit = q('[aria-labelledby="fb-situation"]');
    const res = q('.fb-analysis .fb-result');
    const lines = a('.fb-analysis .fb-lines > .fb-line');
    return {
      valg: k(q('[aria-labelledby="fb-choose"]')), segment: k(q('[aria-labelledby="fb-choose"] .fb-segment')), overskrift: k(q('#fb-choose')),
      filter: a('.fb-analysis .fb-filter .btn').map((b) => Math.round(b.getBoundingClientRect().top)),
      bank: a('.fb-analysis .fb-bank-item').slice(0, 4).map(k),
      spalte: k(spalte), spalteFlade: getComputedStyle(spalte).backgroundColor, spalteHjørne: getComputedStyle(spalte).borderTopLeftRadius,
      sit: k(sit), sitFlade: getComputedStyle(sit).backgroundColor, sitVenstre: getComputedStyle(sit).borderLeftWidth, sitTop: getComputedStyle(sit).borderTopWidth,
      knap: k(q('.fb-play-start')), knapFlade: q('.fb-play-start') ? getComputedStyle(q('.fb-play-start')).backgroundColor : null,
      linjer: lines.map(k),
      detaljer: k(q('[aria-labelledby="fb-details"]')), res: k(res), resFlade: getComputedStyle(res).backgroundColor,
      stor: q('.fb-result-big') && { farve: getComputedStyle(q('.fb-result-big')).color, skrift: getComputedStyle(q('.fb-result-big')).fontFamily, vist: q('.fb-result-big').getClientRects().length > 0 },
      lang: q('.fb-result-long')?.getClientRects().length ?? null,
      forskel: k(q('#fb-difference')), gruppe: k(q('[aria-labelledby="fb-difference"] .fb-segment')),
      tabel: (() => { const t = q('.fb-analysis .fb-table-scroll'); return { ud: t.scrollWidth - t.clientWidth, linjer: lines.length }; })(),
      knapBredde: k(q('[aria-labelledby="fb-situation"] .fb-room-row .btn'))?.width, sitBredde: k(sit).width,
      forBred: document.documentElement.scrollWidth - innerWidth,
    };
  })()`);
  tjek(ca(d.segment?.top + d.segment?.height / 2, d.overskrift?.top + d.overskrift?.height / 2, 8) && d.segment.right > d.valg.left + d.valg.width * 0.7, 'Analyse som tegningen: Banken og Kortvælger står i overskriften til højre', JSON.stringify(d.segment));
  tjek(new Set(d.filter).size === 1 && d.filter.length >= 10, 'Analyse som tegningen: hp-filteret står på én linje', [...new Set(d.filter)].join(','));
  tjek(d.bank.length === 4 && ca(d.bank[0].top, d.bank[2].top) && d.bank[1].left > d.bank[0].right - 1 && d.bank[2].left > d.bank[1].right - 1 && d.bank[3].top > d.bank[0].top, 'Analyse som tegningen: kombinationerne står i tre kolonner', JSON.stringify(d.bank.slice(0, 4).map((b) => [b.left, b.top])));
  tjek(ca(d.spalte.width, 400), 'Analyse som tegningen: venstre spalte er 400 px', `${d.spalte.width} px`);
  tjek(d.spalteFlade === 'rgb(255, 255, 255)' && d.spalteHjørne === '24px', 'Analyse som tegningen: Problemet er ét kort', `${d.spalteFlade}, ${d.spalteHjørne}`);
  tjek(d.sit.left >= d.spalte.left && d.sit.right <= d.spalte.right && d.sit.bottom <= d.spalte.bottom && d.sitFlade === 'rgba(0, 0, 0, 0)' && d.sitVenstre === '0px' && d.sitTop === '1px', 'Analyse som tegningen: Situationen står inde i Problemet-kortet med en streg over', `${JSON.stringify(d.sit)} ${d.sitFlade} ${d.sitVenstre} ${d.sitTop}`);
  tjek(d.knap && d.knap.top >= d.sit.bottom - 1 && d.knap.bottom <= d.spalte.bottom && d.knapFlade === 'rgb(255, 159, 74)', 'Analyse som tegningen: Spil den selv står nederst i kortet og er orange', `${JSON.stringify(d.knap)} ${d.knapFlade}`);
  tjek(d.linjer.length >= 3 && ca(d.linjer[0].top, d.linjer[2].top) && d.linjer[1].left > d.linjer[0].right - 1 && d.linjer[2].left > d.linjer[1].right - 1 && ca(d.linjer[0].width, d.linjer[2].width), 'Analyse som tegningen: tre linjekort side om side', JSON.stringify(d.linjer.slice(0, 3).map((l) => [l.left, l.top, l.width])));
  tjek(ca(d.gruppe?.top + d.gruppe?.height / 2, d.forskel?.top + d.forskel?.height / 2, 8) && d.gruppe.left > d.forskel.right, 'Analyse som tegningen: Grupper står i overskriften til Forskellen', JSON.stringify(d.gruppe));
  tjek(ca(d.detaljer.top, d.res.top) && d.res.left > d.detaljer.right - 1, 'Analyse som tegningen: De afgørende sidninger og Resultatet side om side', `${JSON.stringify(d.detaljer)} / ${JSON.stringify(d.res)}`);
  tjek(d.tabel.ud <= 0, `Analyse som tegningen: alle ${d.tabel.linjer} linjer kan ses i tabellen uden at rulle`, `${d.tabel.ud} px for bredt`);
  tjek(ca(d.knapBredde, d.sitBredde), 'Analyse som tegningen: Angiv situationen er i fuld bredde', `${d.knapBredde} af ${d.sitBredde} px`);
  tjek(d.resFlade === 'rgb(26, 26, 26)', 'Analyse som tegningen: Resultatet på mørk flade', d.resFlade);
  tjek(d.stor?.vist && d.stor.farve === 'rgb(255, 159, 74)' && /^Manrope/.test(d.stor.skrift) && d.lang === 0, 'Analyse som tegningen: chancen er fremhævet i Resultatet', JSON.stringify(d.stor));
  tjek(d.forBred <= 0, 'Analyse som tegningen: intet stikker ud til siden', `${d.forBred} px`);
}

async function sammenlign(nu, før, side) {
  return side.kør(`(async () => {
    const læs = (d) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = 'data:image/png;base64,' + d; });
    const [x, y] = await Promise.all([læs(${JSON.stringify(før)}), læs(${JSON.stringify(nu)})]);
    if (x.width !== y.width || x.height !== y.height) return 'størrelsen er ' + y.width + '×' + y.height + ', før ' + x.width + '×' + x.height;
    const px = (i) => { const c = new OffscreenCanvas(i.width, i.height); const g = c.getContext('2d'); g.drawImage(i, 0, 0); return g.getImageData(0, 0, i.width, i.height).data; };
    const p = px(x), q = px(y);
    let n = 0, top = -1;
    for (let k = 0; k < p.length; k += 4) if (p[k] !== q[k] || p[k + 1] !== q[k + 1] || p[k + 2] !== q[k + 2]) { n++; if (top < 0) top = Math.floor(k / 4 / x.width); }
    return n ? n + ' pixels er forskellige, den første i række ' + top : '';
  })()`);
}

// Appen før: en worktree af tagget med node_modules lånt fra arbejdsmappen (en junction på Windows).
function lavFør() {
  const mappe = mkdtempSync(join(tmpdir(), 'bred-foer-'));
  rmSync(mappe, { recursive: true, force: true });
  const r = spawnSync('git', ['worktree', 'add', '--detach', mappe, TAG], { cwd: ROD, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`git worktree add: ${r.stderr}`);
  symlinkSync(join(ROD, 'node_modules'), join(mappe, 'node_modules'), 'junction');
  return mappe;
}
function fjernFør(mappe) {
  const link = join(mappe, 'node_modules');
  // Kun linket fjernes; arbejdsmappens node_modules røres ikke.
  if (existsSync(link) && lstatSync(link).isSymbolicLink()) unlinkSync(link);
  if (existsSync(link)) return console.log(`Bemærk: ${mappe} blev ikke fjernet (node_modules er ikke et link).`);
  spawnSync('git', ['worktree', 'remove', '--force', mappe], { cwd: ROD });
}

// Hver server har sit eget cache, så de ikke skriver i det samme som en kørende dev-server.
const cache = mkdtempSync(join(tmpdir(), 'bred-vite-'));
const serverNu = await createServer({ root: ROD, cacheDir: join(cache, 'nu'), logLevel: 'silent', server: { port: 5191 } });
await serverNu.listen();
const førMappe = lavFør();
const serverFør = await createServer({ root: førMappe, configFile: join(førMappe, 'vite.config.ts'), cacheDir: join(cache, 'foer'), logLevel: 'silent', server: { port: 5192 } });
await serverFør.listen();
const NU = serverNu.resolvedUrls.local[0];
const FØR = serverFør.resolvedUrls.local[0];
const b = await chrome();
const åbn = async (skærm, bredde, højde, url = NU) => {
  const s = await b.fane(bredde, højde);
  await SKÆRME[skærm](s, url);
  return s;
};

try {
  // Træning ved 1280 px: bordet til venstre, opgaven til højre, højst 1120 px i midten; overskrift og faner i fuld bredde.
  let s = await åbn('træning', 1280, 900);
  await toSpalter(s, '.fb-task', 'Træning', { toppe: true });
  const opgave = await s.kasse('.fb-task');
  tjek(opgave.width <= 1120.5 && ca(opgave.left, 1280 - opgave.right), 'Træning: højst 1120 px i midten', `${opgave.left}–${opgave.right}`);
  const faner = await s.kasse('.fb-tabs');
  tjek(faner && ca(faner.left, opgave.left) && ca(faner.right, opgave.right), 'Træning: fanerne er lige så brede som opgaven', JSON.stringify(faner));
  await trinafstand(s, 'Træning ved 1280 px');
  await s.luk();

  s = await åbn('træning', 390, 844);
  await trinafstand(s, 'Træning ved 390 px');
  await s.luk();

  // Bordets spalte dækker aldrig noget (Del 2, punkt 1–3), ved 1280 × 900 og 1000 × 700.
  for (const [bredde, højde] of [[1280, 900], [1000, 700]]) {
    for (const [skærm, navn, spil] of [
      ['analyse', 'Analyse', false],
      ['analyseSpil', 'Spil den selv i Analyse', true],
      ['spilSelv', 'Spil den selv fra facit', true],
      ['træning', 'Træning', false],
      ['facit', 'Facit', false],
      ['pointregnskab', 'Pointregnskab', false],
    ]) {
      const hvor = `${navn} ved ${bredde} × ${højde}`;
      s = await åbn(skærm, bredde, højde);
      await ingenOverlap(s, hvor);
      if (spil) {
        await spilFærdig(s);
        await vent(300);
        await dommenKanSes(s, hvor);
        await ingenOverlap(s, `${hvor}, efter sidste stik`);
      }
      await s.luk();
    }
  }

  // Analyse følger tegningen ved 1280 px.
  s = await åbn('analyse', 1280, 900);
  await analyseSomTegningen(s);
  await s.luk();

  // Med mere end fire linjer står De afgørende sidninger og Resultatet under hinanden, så alle kolonner kan ses.
  for (const [bredde, højde] of [[1280, 900], [1000, 700]]) {
    for (const [valg, mål, mindst] of [['~E D 6 5 / 4 3 2', '3 stik', 4], ['~E 10 8 3 / K B 9 2', '4 stik', 5]]) {
      s = await b.fane(bredde, højde);
      await s.gå(`${NU}#farvebehandling`);
      await s.klik('Analyse');
      await s.klik(valg);
      await s.klik(mål);
      await vent(500);
      const t = await s.kør(`(() => {
        const k = (x) => document.querySelector(x).getBoundingClientRect();
        const t = document.querySelector('.fb-analysis .fb-table-scroll');
        return { linjer: document.querySelectorAll('.fb-analysis .fb-lines:not(.fb-own-lines) > .fb-line').length, ud: t.scrollWidth - t.clientWidth, under: k('.fb-analysis .fb-result').top >= k('[aria-labelledby="fb-details"]').bottom };
      })()`);
      tjek(t.linjer >= mindst && t.ud <= 0 && (mindst === 4 || t.under), `Analyse med ${t.linjer} linjer ved ${bredde} × ${højde}: alle kolonner i tabellen kan ses`, JSON.stringify(t));
      await s.luk();
    }
  }

  // Bordet står fast, når der rulles ned til chancen (et lavt vindue) og i facit.
  for (const [skærm, beholder, højde, navn] of [['træning', '.fb-task', 450, 'Træning'], ['facit', '.fb-facit', 700, 'Facit']]) {
    s = await åbn(skærm, 1280, højde);
    const før = await s.kasse(`${beholder} > .wide-left`);
    const rul = await s.kør(`(() => { const max = document.documentElement.scrollHeight - innerHeight; window.scrollTo(0, Math.min(300, max)); return max; })()`);
    await vent(200);
    const efter = await s.kasse(`${beholder} > .wide-left`);
    tjek(rul >= 300 && /\bwide-fast\b/.test(før.klasse) && ca(efter.top, 16), `${navn}: bordet står fast, når der rulles`, `rul ${rul} px, top ${før.top} → ${efter.top}`);
    await s.luk();
  }

  // Ved 1000 px er højre spalte mindst 400 px.
  s = await åbn('træning', 1000, 900);
  const højre = await s.kasse('.fb-task > .wide-right');
  tjek(højre && højre.width >= 400, 'Træning ved 1000 px: højre spalte mindst 400 px', `${højre?.width} px`);
  await s.luk();

  for (const [skærm, beholder, navn, toppe] of [
    ['facit', '.fb-facit', 'Facit', false],
    ['spilSelv', '.fb-play', 'Spil den selv', true],
    ['selvvalgt', '.fb-task', 'Selvvalgt', true],
    ['analyse', '.fb-analysis > .fb-column', 'Analyse', false],
    ['pointregnskab', '.pr-screen .task', 'Pointregnskab', false],
    ['håndevaluering', '.he-screen .task', 'Håndevaluering', false],
    ['tastatur', '.session .task', 'Session med tastatur', false],
  ]) {
    s = await åbn(skærm, 1280, 900);
    await toSpalter(s, beholder, navn, { toppe });
    await s.luk();
  }

  // Vejledningens indholdsfortegnelse til venstre fra 1000 px og skjult under.
  s = await åbn('vejledning', 1280, 900);
  const toc = await s.kasse('.guide-toc');
  const tekst = await s.kasse('.guide-cols > .card');
  tjek(toc && tekst && toc.right <= tekst.left && ca(toc.top, tekst.top), 'Vejledning: indholdsfortegnelsen til venstre', `${JSON.stringify(toc)} / ${JSON.stringify(tekst)}`);
  await s.klik('Dine data');
  const åben = await s.kør(`document.querySelector('details:last-of-type')?.open && document.querySelector('details:last-of-type').getBoundingClientRect().top < innerHeight`);
  tjek(åben === true, 'Vejledning: et punkt i indholdsfortegnelsen åbner afsnittet og viser det');
  await s.luk();
  s = await åbn('vejledning', 999, 900);
  tjek((await s.kasse('.guide-toc')) === null, 'Vejledning ved 999 px: ingen indholdsfortegnelse');
  await s.luk();

  // Tab-rækkefølgen ved 1280 px er den samme før og efter.
  for (const [skærm, navn] of [['træning', 'Træning'], ['spilSelv', 'Spil den selv'], ['pointregnskab', 'Pointregnskab']]) {
    const nu = await åbn(skærm, 1280, 900, NU);
    const før = await åbn(skærm, 1280, 900, FØR);
    const [a, c] = [await nu.tab(30), await før.tab(30)];
    const i = a.findIndex((x, k) => x !== c[k]);
    tjek(i < 0, `${navn}: samme tab-rækkefølge før og efter`, `trin ${i + 1}: ${a[i]} / før ${c[i]}`);
    await nu.luk();
    await før.luk();
  }

  // Skærmbillederne til Frank: hele siden, og Spil den selv rullet til bunden, som vinduet viser det.
  if (BILLEDER) {
    mkdirSync(BILLEDER, { recursive: true });
    const gem = (fil, data) => writeFileSync(join(BILLEDER, fil), Buffer.from(data, 'base64'));
    for (const [bredde, højde] of [[1280, 900], [1000, 700], [390, 844]]) {
      for (const [skærm, fil] of [['analyse', 'analyse'], ['træning', 'traening'], ['pointregnskab', 'pointregnskab']]) {
        s = await åbn(skærm, bredde, højde);
        gem(`${bredde}-${fil}.png`, await s.billede());
        await s.luk();
      }
      s = await åbn('analyseSpil', bredde, højde);
      await spilFærdig(s);
      await vent(400);
      gem(`${bredde}-analyse-spil-doemmen.png`, await s.vindue());
      await s.kør(`(() => { const r = document.querySelector('.fb-play').getBoundingClientRect(); window.scrollTo(0, r.bottom + scrollY - innerHeight + 16); return true; })()`);
      gem(`${bredde}-analyse-spil-bund.png`, await s.vindue());
      await s.luk();
    }
  }

  // Under 1000 px er intet ændret. Chrome kan en sjælden gang kantutjævne en enkelt pixel tekst anderledes, når maskinen
  // har travlt, så en forskel prøves én gang til med nye faner; en rigtig forskel kommer igen.
  for (const skærm of Object.keys(SKÆRME).filter((k) => !KUN.length || KUN.includes(k))) {
    for (const bredde of [999, 390]) {
      let forskel, billeder;
      for (let forsøg = 0; forsøg < 2 && forskel !== ''; forsøg++) {
        const sNu = await åbn(skærm, bredde, 900, NU);
        const sFør = await åbn(skærm, bredde, 900, FØR);
        billeder = [await sNu.billede(), await sFør.billede()];
        forskel = await sammenlign(...billeder, sNu);
        await sNu.luk();
        await sFør.luk();
      }
      if (forskel) {
        mkdirSync(FORSKELLE, { recursive: true });
        writeFileSync(join(FORSKELLE, `${skærm}-${bredde}-nu.png`), Buffer.from(billeder[0], 'base64'));
        writeFileSync(join(FORSKELLE, `${skærm}-${bredde}-foer.png`), Buffer.from(billeder[1], 'base64'));
        forskel += ` (billederne står i ${FORSKELLE})`;
      }
      tjek(!forskel, `${skærm} ved ${bredde} px: som før`, forskel);
    }
  }
} catch (e) {
  tjek(false, 'testen kørte færdig', e.message);
} finally {
  b.luk();
  await serverNu.close();
  await serverFør.close();
  fjernFør(førMappe);
  try { rmSync(cache, { recursive: true, force: true }); } catch {}
}

console.log(fejl ? `\n${fejl} fejl` : '\nAlt er grønt');
process.exit(fejl ? 1 : 0);
