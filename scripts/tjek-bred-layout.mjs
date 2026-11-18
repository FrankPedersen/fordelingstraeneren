// Accepttest (SPEC-bred-layout.md og Del 2 af SPEC-design-som-forsiden.md): det brede layout fra 1000 px i en rigtig
// browser. Appen startes med Vite fra arbejdsmappen, og referencen (appen før Modspils skærme, tagget
// v43-foer-modspil-skaerme; før det v38-foer-moensterkort-bred)
// lægges i en midlertidig git worktree og startes ved siden af. Begge åbnes i Chrome eller Edge uden vindue;
// tilfældighederne og tiden er låst, så opgaverne er de samme hver gang, og hver skærm får sin egen tomme lagring.
//
//   node scripts/tjek-bred-layout.mjs                     alle skærme
//   node scripts/tjek-bred-layout.mjs analyse             kun Analyse i pixelsammenligningen
//   node scripts/tjek-bred-layout.mjs ingen               uden pixelsammenligningen (kun layout og overlap)
//   node scripts/tjek-bred-layout.mjs --billeder=mappe    gemmer også skærmbillederne til Frank i mappen
//   node scripts/tjek-bred-layout.mjs --modspil           kun Modspil og pixelsammenligningen af forsiden og vejledningen
//
// Ved 1280 px står bordet til venstre og opgaven til højre med toppene ud for hinanden, og indholdet er højst 1120 px
// bredt i midten. Bordet står kun fast i en skærm med to spalter, og kun når det er lavere end vinduet. Ved 1280 × 900
// og 1000 × 700 rulles Analyse, Spil den selv, Træning og Pointregnskab fra top til bund, og bordets spalte må aldrig
// dække noget. Efter sidste stik i Spil den selv kan dommen og resultatet ses. Analyse følger tegningen. Pointregnskab,
// Håndevaluering, Spil den selv og en session med tastatur har to spalter, og vejledningens indholdsfortegnelse står
// til venstre. Ved 1000 px er højre spalte mindst 400 px. Linjekortenes trin har samme afstand på mobil og computer, og
// tab-rækkefølgen er den samme før og efter. Analyse har 5 ⓘ, og linjekortene står efter antallet af linjer (Del 3). En ⓘ i
// bordets spalte åbner som en boks, uden at bordet flytter sig (SPEC-info-boks.md). Mønsterkortet under Næste og
// ledetråden i Fordelings session står i højre spalte ved 1000, 1280 og 1920 px (SPEC-moensterkort-bred.md). Ved 999 og
// 390 px er skærmene pixel
// for pixel som referencen, med sidefoden skjult i begge apps, fordi den er ændret med vilje (SPEC-sidefod.md;
// scripts/tjek-sidefod.mjs tjekker den). Kræver Node 22+, git og Chrome eller Edge.
//
// Modspil (SPEC-modspil.md, trin 2, accepttest 4–6): sporets skærme i appen og på testsiden scripts/modspil.html (én
// opgave fra trin 1, valgt med adressen) svarer til mock-up'en i docs/specs/design/modspil/ ved 390, 1000 og 1280 px:
// delene i specens rækkefølge, stikket på grønt felt med makkers udspil i en orange ring og din plads stiplet,
// kortknapper og svarknapper på mindst 44 px, Vælg kortet med resten af hånden gråtonet og aftalen under spørgsmålet,
// facit med mærket, regnestykket, forklaringen, Ved bordet og Næste opgave, og Indstillinger med tre profiler og syv
// metoder, hvor teksterne i rullelisterne kan ses helt ved 390 px på dansk og engelsk (Franks svar 2). Fra 1000 px står bordet til venstre og spørgsmålet og facit til højre, bordets spalte dækker intet, og
// HTML'en er den samme som ved 390 px. Rødt (--suit-red og --card-red) står kun på ♥ og ♦ og aldrig på en rang, og
// tastaturet fører fra forsiden gennem en session til status. Modspils skærme er nye og derfor ikke med i
// pixelsammenligningen; i forsiden og vejledningen skjules Modspils gruppe og afsnit i begge apps, så resten
// sammenlignes med tagget. Velkomsten og vejledningens linje om I dag siger fem spor i stedet for fire (Franks svar 2);
// i begge apps skrives de fem spor om til fire før billedet, så alt andet stadig sammenlignes pixel for pixel.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const ROD = fileURLToPath(new URL('..', import.meta.url));
const TAG = 'v43-foer-modspil-skaerme';
// Skærmnavne som argumenter begrænser pixelsammenligningen til dem; en forskel gemmes som billeder her.
const KUN = process.argv.slice(2).filter((a) => !a.startsWith('--'));
// --modspil: kun Modspils tjek og pixelsammenligningen af de to skærme, Modspil ændrer (forsiden og vejledningen).
const KUN_MODSPIL = process.argv.includes('--modspil');
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
        async tast(key) {
          await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key });
          await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key });
          await vent(100);
        },
        /** Én tast som fra tastaturet (Enter og mellemrum trykker på en knap; Tab flytter fokus uden at nulstille). */
        async tryk(key) {
          const koder = { Enter: [13, String.fromCharCode(13), 'Enter'], ' ': [32, ' ', 'Space'], Tab: [9, '', 'Tab'], ArrowDown: [40, '', 'ArrowDown'], Escape: [27, '', 'Escape'] };
          const [vk, text, code] = koder[key];
          await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: vk, ...(text ? { text } : {}) });
          await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk });
          await vent(120);
        },
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
          // Modspils gruppe på forsiden og afsnit i vejledningen er nye (SPEC-modspil.md, trin 2) og skjules i begge apps.
          // Velkomsten og vejledningen siger fem spor (Franks svar 2); i begge apps står der fire i billedet. I tagget
          // findes de fem spor ikke, så dér ændres intet.
          await kør(`window.scrollTo(0, 0); document.head.insertAdjacentHTML('beforeend', '<style>.site-footer, section.home-group[aria-labelledby="group-defense"] { display: none !important; }</style>');
            for (const d of document.querySelectorAll('details')) if (['Modspil', 'Defence'].includes(d.querySelector('summary')?.textContent.trim())) d.style.setProperty('display', 'none', 'important');
            const fem = [['Appen har fem spor', 'Appen har fire spor'], ['The app has five tracks', 'The app has four tracks'], ['af de fem spor', 'af de fire spor'], ['of the five tracks', 'of the four tracks']];
            const tekster = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            for (let t = tekster.nextNode(); t; t = tekster.nextNode()) for (const [nu, før] of fem) if (t.data.includes(nu)) t.data = t.data.replace(nu, før);
            true`);
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
  // Fordelings første opgave er Fuldfør ("Øst har vist 4♦ og 4♣"); svaret 4-4-3-2 giver dommen med mønsterkortet.
  ledetråd: async (s, u) => { await SKÆRME.tastatur(s, u); await s.klik('Vis ledetråd'); },
  dom: async (s, u) => {
    await SKÆRME.tastatur(s, u);
    for (const t of ['4', '4', '3']) await s.klik(t);
    await s.klik('Svar');
    if (!(await s.kør(`!!document.querySelector('.screen.session > .memory-box')`))) throw new Error('Mønsterkortet kom ikke frem efter svaret');
  },
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
  const bredde = await s.kør('document.documentElement.scrollWidth - document.documentElement.clientWidth');
  tjek(bredde <= 0, `${navn}: intet stikker ud til siden`, `${bredde} px for bredt`);
  return { l, r };
}

/**
 * Et kort i Fordelings session (mønsterkortet under Næste eller ledetråden) står i højre spalte: samme venstre og højre
 * kant som højre spalte og som dommen, og intet i sessionen går ud over opgavens kanter eller giver vandret scroll
 * (SPEC-moensterkort-bred.md).
 */
async function iHøjreSpalte(s, navn, vælger) {
  const r = await s.kør(`(() => {
    const k = (e) => { if (!e || !e.getClientRects().length) return null; const b = e.getBoundingClientRect(); return { left: Math.round(b.left * 10) / 10, right: Math.round(b.right * 10) / 10 }; };
    const opgave = document.querySelector('.screen.session > .task');
    const o = opgave.getBoundingClientRect();
    const spalte = opgave.querySelector(':scope > .wide-left').getBoundingClientRect();
    const højre = { left: spalte.right + parseFloat(getComputedStyle(opgave).columnGap), right: o.right };
    const iRullekasse = (e) => { for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) if (getComputedStyle(a).overflowX !== 'visible') return true; return false; };
    const navn = (e) => e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\\s+/).join('.') : '');
    const udstik = [...document.querySelectorAll('.screen.session *')]
      .filter((e) => e.getClientRects().length && !iRullekasse(e) && !e.closest('.site-footer'))
      .filter((e) => { const b = e.getBoundingClientRect(); return b.right > o.right + 1 || b.left < o.left - 1; })
      .map((e) => navn(e) + ' ' + Math.round(e.getBoundingClientRect().left) + '–' + Math.round(e.getBoundingClientRect().right));
    return { kort: k(document.querySelector(${JSON.stringify(vælger)})), dom: k(document.querySelector('.screen.session > .feedback')), højre: { left: Math.round(højre.left * 10) / 10, right: Math.round(højre.right * 10) / 10 }, opgave: k(opgave), udstik: [...new Set(udstik)].slice(0, 4), ud: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  })()`);
  tjek(r.kort && ca(r.kort.left, r.højre.left) && ca(r.kort.right, r.højre.right), `${navn}: står i højre spalte`, `kortet ${JSON.stringify(r.kort)}, højre spalte ${JSON.stringify(r.højre)}`);
  if (r.dom) tjek(r.kort && ca(r.kort.left, r.dom.left) && ca(r.kort.right, r.dom.right), `${navn}: samme kanter som dommen`, `kortet ${JSON.stringify(r.kort)}, dommen ${JSON.stringify(r.dom)}`);
  tjek(!r.udstik.length && r.ud <= 0, `${navn}: intet stikker ud`, `${r.ud} px vandret scroll; ${r.udstik.join(', ')} (opgaven ${r.opgave.left}–${r.opgave.right})`);
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
      info: a('.info-btn').map((b) => b.getAttribute('aria-label')),
      detaljer: k(q('[aria-labelledby="fb-details"]')), res: k(res), resFlade: getComputedStyle(res).backgroundColor,
      stor: q('.fb-result-big') && { farve: getComputedStyle(q('.fb-result-big')).color, skrift: getComputedStyle(q('.fb-result-big')).fontFamily, vist: q('.fb-result-big').getClientRects().length > 0 },
      lang: q('.fb-result-long')?.getClientRects().length ?? null,
      forskel: k(q('#fb-difference')), gruppe: k(q('[aria-labelledby="fb-difference"] .fb-segment')),
      tabel: (() => { const t = q('.fb-analysis .fb-table-scroll'); return { ud: t.scrollWidth - t.clientWidth, linjer: lines.length }; })(),
      knapBredde: k(q('[aria-labelledby="fb-situation"] .fb-room-row .btn'))?.width, sitBredde: k(sit).width,
      forBred: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  })()`);
  tjek(ca(d.segment?.top + d.segment?.height / 2, d.overskrift?.top + d.overskrift?.height / 2, 8) && d.segment.right > d.valg.left + d.valg.width * 0.7, 'Analyse som tegningen: Banken og Kortvælger står i overskriften til højre', JSON.stringify(d.segment));
  tjek(new Set(d.filter).size === 1 && d.filter.length >= 10, 'Analyse som tegningen: hp-filteret står på én linje', [...new Set(d.filter)].join(','));
  tjek(d.bank.length === 4 && ca(d.bank[0].top, d.bank[2].top) && d.bank[1].left > d.bank[0].right - 1 && d.bank[2].left > d.bank[1].right - 1 && d.bank[3].top > d.bank[0].top, 'Analyse som tegningen: kombinationerne står i tre kolonner', JSON.stringify(d.bank.slice(0, 4).map((b) => [b.left, b.top])));
  tjek(ca(d.spalte.width, 400), 'Analyse som tegningen: venstre spalte er 400 px', `${d.spalte.width} px`);
  tjek(d.spalteFlade === 'rgb(255, 255, 255)' && d.spalteHjørne === '24px', 'Analyse som tegningen: Problemet er ét kort', `${d.spalteFlade}, ${d.spalteHjørne}`);
  tjek(d.sit.left >= d.spalte.left && d.sit.right <= d.spalte.right && d.sit.bottom <= d.spalte.bottom && d.sitFlade === 'rgba(0, 0, 0, 0)' && d.sitVenstre === '0px' && d.sitTop === '1px', 'Analyse som tegningen: Situationen står inde i Problemet-kortet med en streg over', `${JSON.stringify(d.sit)} ${d.sitFlade} ${d.sitVenstre} ${d.sitTop}`);
  tjek(d.knap && d.knap.top >= d.sit.bottom - 1 && d.knap.bottom <= d.spalte.bottom && d.knapFlade === 'rgb(255, 159, 74)', 'Analyse som tegningen: Spil den selv står nederst i kortet og er orange', `${JSON.stringify(d.knap)} ${d.knapFlade}`);
  tjek(d.info.length === 5, 'Analyse har præcis 5 ⓘ', d.info.join(' ; '));
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

// ---------------------------------------------------------------------------------------------------------------------
// Modspil (SPEC-modspil.md, trin 2, accepttest 4–6). Grænsefladen står øverst i src/modspil/ui/skaerme.test.tsx:
// opgavens rod har data-ovelse og børnene .wide-left (meldeforløbet og bordet) og .wide-right (spørgsmålet, svarene og
// facit); hænderne har data-haand="nord" og "dig", stikket role="img" og aria-label "Stik …", makkers udspil
// data-udspil og din tomme plads data-tom; svarknapperne står i gruppen "Svar", og facit har mærket data-dom.
const KORT_LABEL = /^(Spar|Hjerter|Ruder|Klør) (2|3|4|5|6|7|8|9|10|knægt|dame|konge|es)$/;
const KORT_I_SIDEN = KORT_LABEL.toString();
/** Tokens' beregnede farver i siden, fx rgb(31, 92, 74) for --table. */
const FARVE = `const farve = (v) => { const d = document.createElement('div'); d.style.color = 'var(' + v + ')'; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; };`;
/** Kassen for et element målt fra sidens top, så rækkefølgen kan ses, uanset hvor langt der er rullet. */
const KASSE = `const kasse = (e) => { if (!e || !e.getClientRects().length) return null; const r = e.getBoundingClientRect(); return { top: Math.round(r.top + scrollY), bottom: Math.round(r.bottom + scrollY), height: Math.round(r.height) }; };
    const tabel = (n) => [...document.querySelectorAll('table')].find((t) => (t.getAttribute('aria-label') || t.caption?.textContent || '').trim() === n);`;

const MODSPIL = {
  forside: async (s, u) => { await s.gå(`${u}#modspil`); await erModspil(s); },
  indstillinger: async (s, u) => { await MODSPIL.forside(s, u); await s.klik('Indstillinger'); await venteTil(s, 'input[type="radio"]', 'Indstillinger'); },
  opgave: async (s, u) => { await MODSPIL.forside(s, u); await s.klik('Start dagens session'); await venteTil(s, '[data-ovelse]', 'Opgaven'); },
  facit: async (s, u) => { await MODSPIL.opgave(s, u); await svarModspil(s); },
};
async function erModspil(s) {
  for (let i = 0; i < 40; i++) {
    if (await s.kør(`[...document.querySelectorAll('h1')].some((h) => h.textContent.trim() === 'Modspil')`)) return;
    await vent(250);
  }
  throw new Error('Modspils skærm (#modspil med overskriften "Modspil") findes ikke');
}
async function venteTil(s, vælger, hvad) {
  for (let i = 0; i < 40; i++) {
    if (await s.kør(`!!document.querySelector(${JSON.stringify(vælger)})`)) return;
    await vent(250);
  }
  throw new Error(`${hvad} kom ikke frem (${vælger})`);
}
/** Svarer "Kan ikke afgøres", eller vælger det første kort, hvor brugeren svarer med et kort, og venter på facit. */
async function svarModspil(s) {
  const ok = await s.kør(`(() => {
    const knapper = [...document.querySelectorAll('button')].filter((b) => b.offsetParent !== null && !b.disabled);
    const k = knapper.find((b) => b.textContent.trim() === 'Kan ikke afgøres') ?? knapper.find((b) => ${KORT_I_SIDEN}.test(b.getAttribute('aria-label') || ''));
    k?.click();
    return !!k;
  })()`);
  if (!ok) throw new Error('Fandt hverken "Kan ikke afgøres" eller et kort at vælge');
  await venteTil(s, '[data-dom]', 'Facit');
}
const åbnModspil = async (skærm, bredde, højde) => {
  const s = await b.fane(bredde, højde);
  await MODSPIL[skærm](s, NU);
  return s;
};
/** Testsiden med én opgave fra trin 1: øvelse, niveau, seed og profil. */
const åbnTestside = async (bredde, højde, ovelse, niveau, seed, profil) => {
  const s = await b.fane(bredde, højde);
  await s.gå(`${NU}scripts/modspil.html?ovelse=${ovelse}&niveau=${niveau}&seed=${seed}&profil=${profil}`);
  await venteTil(s, '[data-ovelse]', `Testsiden med ${ovelse}, niveau ${niveau}, seed ${seed}, ${profil}`);
  return s;
};
/** Et tjek, der kan fejle undervejs: fejlen tælles, og de næste tjek kører alligevel. */
async function del(navn, fn) {
  try {
    await fn();
  } catch (e) {
    tjek(false, navn, e.message);
  }
}

/** Rødt (--suit-red og --card-red) kun på ♥ og ♦: ingen rang i et rødt element, og hvert ♥ og ♦ er rødt (punkt 5). */
async function rødtKunPåSymbolerne(s, navn) {
  const r = await s.kør(`(() => {
    ${FARVE}
    const røde = new Set([farve('--suit-red'), farve('--card-red')]);
    const rang = [], sorte = [];
    const gå = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = gå.nextNode(); n; n = gå.nextNode()) {
      const el = n.parentElement, t = n.textContent;
      if (!el || !t.trim() || !el.getClientRects().length || el.closest('option, script, style, .site-footer')) continue;
      const rød = røde.has(getComputedStyle(el).color);
      if (rød && /10|[2-9]|[EKDBAQJ]/.test(t)) rang.push(t.trim().slice(0, 30));
      if (!rød && /[♥♦]/.test(t)) sorte.push(t.trim().slice(0, 30));
    }
    return { rang: [...new Set(rang)], sorte: [...new Set(sorte)] };
  })()`);
  tjek(!r.rang.length, `${navn}: ingen rang i et rødt element`, r.rang.slice(0, 4).join(' ; '));
  tjek(!r.sorte.length, `${navn}: ♥ og ♦ er røde`, r.sorte.slice(0, 4).join(' ; '));
}

/** Delene står oven over hinanden i den givne rækkefølge (ved 390 px). */
function rækkefølge(navn, dele) {
  const mangler = dele.filter(([, k]) => !k).map(([n]) => n);
  tjek(!mangler.length, `${navn}: alle dele findes`, `mangler ${mangler.join(', ')}`);
  const fundne = dele.filter(([, k]) => k);
  const forkert = fundne.slice(1).filter(([, k], i) => k.top < fundne[i][1].top).map(([n], i) => `${fundne[i][0]} / ${n}`);
  tjek(!forkert.length, `${navn}: delene i specens rækkefølge`, forkert.join(', '));
}

/** Opgaveskærmen som 1-opgave-390.html: rækkefølgen, stikket, ringen, den stiplede plads og knappernes højde. */
async function opgaveSomMockup(s, navn) {
  const d = await s.kør(`(() => {
    ${FARVE}
    ${KASSE}
    const q = (x) => document.querySelector(x);
    const hoved = [...document.querySelectorAll('[data-ovelse] *')].find((e) => /^Niveau \\d · opgave \\d+ af \\d+$/.test(e.textContent.trim()) && ![...e.children].some((c) => /^Niveau/.test(c.textContent.trim())));
    const stik = q('[role="img"][aria-label^="Stik "]');
    const gruppe = q('[role="group"][aria-label="Svar"]');
    const udspil = q('[data-udspil]'), tom = q('[data-tom]');
    const u = udspil && getComputedStyle(udspil);
    return {
      dele: [['niveau og opgave', kasse(hoved)], ['statuslinjen', kasse(q('[role="progressbar"]'))], ['meldeforløbet', kasse(tabel('Meldeforløbet'))], ['bordet', kasse(q('[data-haand="nord"]'))], ['stikket', kasse(stik)], ['din hånd', kasse(q('[data-haand="dig"]'))], ['spørgsmålet', kasse(q('h1'))], ['svarknapperne', kasse(gruppe)]],
      stikFlade: stik && getComputedStyle(stik).backgroundColor, grøn: farve('--table'),
      ring: !!u && (u.boxShadow.includes(farve('--accent')) || (u.outlineStyle !== 'none' && u.outlineColor === farve('--accent'))),
      stiplet: !!tom && [getComputedStyle(tom).borderTopStyle, getComputedStyle(tom).outlineStyle].includes('dashed'),
      knapper: gruppe ? [...gruppe.querySelectorAll('button')].map((b) => [b.textContent.trim(), Math.round(b.getBoundingClientRect().height)]) : [],
      ud: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  })()`);
  rækkefølge(navn, d.dele);
  tjek(d.stikFlade === d.grøn, `${navn}: stikket står på et grønt felt (--table)`, `${d.stikFlade}, ventet ${d.grøn}`);
  tjek(d.ring === true, `${navn}: makkers udspil har en orange ring (--accent)`);
  tjek(d.stiplet === true, `${navn}: din plads i stikket er tom med stiplet kant`);
  tjek(d.knapper.length >= 2 && d.knapper.every(([, h]) => h >= 44), `${navn}: svarknapperne er mindst 44 px høje`, JSON.stringify(d.knapper));
  tjek(d.knapper.some(([t]) => t === 'Kan ikke afgøres'), `${navn}: "Kan ikke afgøres" er sin egen knap`, JSON.stringify(d.knapper));
  tjek(d.ud <= 0, `${navn}: intet stikker ud til siden`, `${d.ud} px`);
}

/** Facit som 2-facit-390.html: mærket i den rigtige farve og delene i rækkefølge. */
async function facitSomMockup(s, navn, ventet) {
  const d = await s.kør(`(() => {
    ${FARVE}
    ${KASSE}
    const mærke = document.querySelector('[data-dom]');
    const farver = mærke ? [mærke, ...mærke.querySelectorAll('*')].flatMap((e) => [getComputedStyle(e).color, getComputedStyle(e).backgroundColor]) : [];
    const forklaring = [...document.querySelectorAll('p')].find((p) => p.textContent.includes(window.modspilOpgave.forklaring.da));
    const ved = [...document.querySelectorAll('[data-ovelse] *')].find((e) => e.textContent.trim() === 'Ved bordet' && !e.children.length);
    const næste = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Næste opgave');
    return {
      dom: mærke?.dataset.dom, farver, grøn: farve('--ok'), rød: farve('--fb-miss-text'),
      dele: [['mærket', kasse(mærke)], ['regnestykket', kasse(tabel('Regnestykket'))], ['forklaringen', kasse(forklaring)], ['Ved bordet', kasse(ved)], ['Næste opgave', kasse(næste)]],
      næste: næste ? Math.round(næste.getBoundingClientRect().height) : 0,
      ud: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  })()`);
  tjek(d.dom === ventet, `${navn}: dommen er ${ventet}`, `${d.dom}`);
  if (ventet === 'rigtigt') tjek(d.farver.includes(d.grøn), `${navn}: mærket er grønt (--ok)`, [...new Set(d.farver)].join(' '));
  else tjek(d.farver.includes(d.rød) && !d.farver.includes(d.grøn), `${navn}: mærket er rødt (--fb-miss-text)`, [...new Set(d.farver)].join(' '));
  rækkefølge(navn, d.dele);
  tjek(d.næste >= 44, `${navn}: Næste opgave er mindst 44 px høj`, `${d.næste} px`);
  tjek(d.ud <= 0, `${navn}: intet stikker ud til siden`, `${d.ud} px`);
}

/** Vælg kortet som 3-vaelg-kortet-390.html: store kortknapper, resten af hånden gråtonet og aftalen under spørgsmålet. */
async function vælgKortetSomMockup(s, navn) {
  const d = await s.kør(`(() => {
    ${FARVE}
    const røde = [farve('--suit-red'), farve('--card-red')];
    const kort = [...document.querySelectorAll('button')].filter((b) => ${KORT_I_SIDEN}.test(b.getAttribute('aria-label') || ''));
    const dig = document.querySelector('[data-haand="dig"]');
    const resten = [];
    const gå = document.createTreeWalker(dig, NodeFilter.SHOW_TEXT);
    for (let n = gå.nextNode(); n; n = gå.nextNode()) if (n.textContent.trim() && !n.parentElement.closest('button')) resten.push(getComputedStyle(n.parentElement).color);
    const grå = (c) => { const [r, g, b] = c.match(/\\d+/g).map(Number); return Math.max(r, g, b) - Math.min(r, g, b) <= 16; };
    const h1 = document.querySelector('h1'), aftale = document.querySelector('details');
    return {
      kort: kort.map((b) => Math.round(b.getBoundingClientRect().height)), iHånden: kort.length > 0 && kort.every((b) => dig.contains(b)),
      resten: [...new Set(resten)], tekst: farve('--text'),
      gråtonet: resten.length > 0 && resten.every((c) => røde.includes(c) || (grå(c) && c !== farve('--text'))),
      aftale: !!aftale && !!h1 && aftale.getBoundingClientRect().top >= h1.getBoundingClientRect().bottom - 1 && !aftale.open,
      ud: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  })()`);
  tjek(d.kort.length > 0 && d.kort.every((h) => h >= 44), `${navn}: kortknapperne er mindst 44 px høje`, JSON.stringify(d.kort));
  tjek(d.iHånden, `${navn}: kortknapperne står i din hånd`);
  tjek(d.gråtonet, `${navn}: resten af hånden er gråtonet`, `${d.resten.join(' ')} (teksten er ${d.tekst})`);
  tjek(d.aftale, `${navn}: aftalen står foldet sammen under spørgsmålet`);
  tjek(d.ud <= 0, `${navn}: intet stikker ud til siden`, `${d.ud} px`);
}

/** Indstillinger som 4-indstillinger-390.html: tre profiler som radioknapper og syv metoder som rullelister på 44 px. */
async function indstillingerSomMockup(s, navn) {
  const d = await s.kør(`(() => ({
    radioer: [...document.querySelectorAll('input[type="radio"]')].map((r) => (r.labels?.[0]?.textContent || '').trim().split(/\\s/)[0]),
    lister: [...document.querySelectorAll('select')].map((e) => Math.round(e.getBoundingClientRect().height)),
    ud: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }))()`);
  tjek(JSON.stringify(d.radioer) === JSON.stringify(['Standard', 'Omvendt', 'Kompendiet']), `${navn}: de tre profiler som radioknapper`, JSON.stringify(d.radioer));
  tjek(d.lister.length === 7 && d.lister.every((h) => h >= 44), `${navn}: syv rullelister på mindst 44 px`, JSON.stringify(d.lister));
  tjek(d.ud <= 0, `${navn}: intet stikker ud til siden`, `${d.ud} px`);
}

/**
 * Teksterne i Indstillingers rullelister kan ses helt (Franks svar 2, 18. nov. 2026): enhver mulighed kan være den
 * valgte, så hver mulighed måles. En kopi af listen med kun den ene mulighed får sin naturlige bredde (teksten, pilen og
 * polstringen, som Chrome tegner dem) og må højst være så bred som listen selv.
 */
async function rullelisterneKanSes(s, navn) {
  const d = await s.kør(`(() => {
    const skåret = [];
    let antal = 0;
    let luft = Infinity;
    for (const liste of document.querySelectorAll('select')) {
      const bredde = liste.getBoundingClientRect().width;
      for (const mulighed of liste.options) {
        const kopi = liste.cloneNode(false);
        kopi.removeAttribute('id');
        kopi.append(mulighed.cloneNode(true));
        kopi.style.cssText = 'position: absolute; left: 0; top: 0; visibility: hidden; width: auto; min-width: 0; max-width: none';
        liste.parentElement.append(kopi);
        const naturlig = kopi.getBoundingClientRect().width;
        kopi.remove();
        antal++;
        luft = Math.min(luft, bredde - naturlig);
        if (naturlig > bredde + 0.5) skåret.push(mulighed.textContent.trim() + ' (' + Math.ceil(naturlig - bredde) + ' px for bred)');
      }
    }
    return { antal, skåret, luft: Math.floor(luft) };
  })()`);
  tjek(d.antal >= 16 && d.skåret.length === 0, `${navn}: teksterne i rullelisterne kan ses helt (${d.antal} muligheder, mindst ${d.luft} px til overs)`, d.skåret.join('; '));
}

/** HTML'en i opgaven (uden statuslinjen, der kan følge tiden), så 390 og 1280 px kan sammenlignes. */
const OPGAVENS_HTML = `(() => { const r = document.querySelector('[data-ovelse]').cloneNode(true); r.querySelectorAll('[role="progressbar"]').forEach((e) => e.remove()); return r.outerHTML; })()`;
const FOKUS = `(() => { const e = document.activeElement; return e ? (e.getAttribute('aria-label') || e.textContent || '').replace(/\\s+/g, ' ').trim() : ''; })()`;

/** Tastaturet hele vejen: fra forsiden med Tab og Enter til Modspil, gennem en session til status, og en profil i Indstillinger. */
async function tastaturHeleVejen() {
  const s = await b.fane(1280, 900);
  await s.gå(NU);
  const tabTil = async (passer, hvad) => {
    for (let i = 0; i < 150; i++) {
      await s.tryk('Tab');
      if (passer(await s.kør(FOKUS))) return;
    }
    throw new Error(`Tab nåede ikke ${hvad}`);
  };
  await tabTil((t) => t === 'Modspil', 'Modspils kort på forsiden');
  await s.tryk('Enter');
  await erModspil(s);
  // Tiden går 20 gange hurtigere fra nu, så en session, der slutter efter tid, også når til status (FAST står stille).
  await s.kør(`(() => { const T = Date.now(), t0 = performance.now(), D = Date; const nu = () => T + (performance.now() - t0) * 20;
    globalThis.Date = class extends D { constructor(...a) { super(...(a.length ? a : [nu()])); } static now() { return nu(); } }; return true; })()`);
  await tabTil((t) => t === 'Start dagens session', '"Start dagens session"');
  await s.tryk('Enter');
  const færdig = () => s.kør(`[...document.querySelectorAll('h1, h2')].some((h) => h.textContent.trim() === 'Sessionen er gennemført')`);
  let opgaver = 0;
  for (let i = 0; i < 60 && !(await færdig()); i++) {
    await venteTil(s, '[data-ovelse]', 'Opgaven');
    await tabTil((t) => t === 'Kan ikke afgøres' || KORT_LABEL.test(t), 'et svar');
    await s.tryk('Enter');
    await venteTil(s, '[data-dom]', 'Facit');
    opgaver++;
    await tabTil((t) => t === 'Næste opgave', '"Næste opgave"');
    await s.tryk('Enter');
    await vent(300);
  }
  tjek((await færdig()) && opgaver >= 2, 'Modspil med tastatur: fra forsiden gennem en session til status', `${opgaver} opgaver`);
  await s.luk();
  // Indstillinger: en profil vælges med piletasten.
  const t = await åbnModspil('forside', 1280, 900);
  await t.kør('document.activeElement?.blur(); window.scrollTo(0, 0); true');
  for (let i = 0; i < 80 && (await t.kør(FOKUS)) !== 'Indstillinger'; i++) await t.tryk('Tab');
  await t.tryk('Enter');
  await venteTil(t, 'input[type="radio"]', 'Indstillinger');
  for (let i = 0; i < 80 && !(await t.kør(`document.activeElement?.type === 'radio'`)); i++) await t.tryk('Tab');
  await t.tryk('ArrowDown');
  const valgt = await t.kør(`(document.querySelector('input[type="radio"]:checked')?.labels?.[0]?.textContent || '').trim()`);
  tjek(/^Omvendt/.test(valgt), 'Modspils Indstillinger med tastatur: piletasten vælger den næste profil', valgt);
  await t.luk();
}

/** Alle Modspils tjek i Chrome. */
async function tjekModspil() {
  let s;
  // Mock-up 1 og 2: Regel 11 med Standard mod 3NT ved 390 px, svaret "Kan ikke afgøres" (forkert) og tallet (rigtigt).
  await del('Modspil: opgaven og facit som mock-up\'en ved 390 px', async () => {
    s = await åbnTestside(390, 844, 'regel11', 1, 1, 'standard');
    await opgaveSomMockup(s, 'Modspil-opgaven ved 390 px');
    await rødtKunPåSymbolerne(s, 'Modspil-opgaven ved 390 px');
    await svarModspil(s);
    await facitSomMockup(s, 'Modspils facit ved 390 px (forkert)', 'forkert');
    await s.luk();
    s = await åbnTestside(390, 844, 'regel11', 1, 1, 'standard');
    await s.kør(`[...document.querySelectorAll('[role="group"][aria-label="Svar"] button')].find((b) => b.textContent.trim() === String(window.modspilOpgave.facit.tal))?.click(); true`);
    await venteTil(s, '[data-dom]', 'Facit');
    await facitSomMockup(s, 'Modspils facit ved 390 px (rigtigt)', 'rigtigt');
    await s.luk();
  });
  // Mock-up 3: Vælg kortet med romersk kald (Kompendiet mod 4♠).
  await del('Modspil: Vælg kortet som mock-up\'en ved 390 px', async () => {
    s = await åbnTestside(390, 844, 'vaelg-kort', 2, 3, 'kompendiet');
    await vælgKortetSomMockup(s, 'Vælg kortet ved 390 px');
    await rødtKunPåSymbolerne(s, 'Vælg kortet ved 390 px');
    await s.luk();
  });
  // Mock-up 4: Indstillinger i appen, og sporets forside.
  await del('Modspil: Indstillinger som mock-up\'en ved 390 px', async () => {
    s = await åbnModspil('indstillinger', 390, 844);
    await indstillingerSomMockup(s, 'Modspils Indstillinger ved 390 px');
    await rullelisterneKanSes(s, 'Modspils Indstillinger ved 390 px');
    await rødtKunPåSymbolerne(s, 'Modspils Indstillinger ved 390 px');
    await s.luk();
    // På engelsk: sproget skiftes med knappen på forsiden, og Modspil åbnes med kortet "Defence".
    s = await b.fane(390, 844);
    await s.gå(NU);
    await s.klik('Skift sprog til engelsk');
    await s.klik('Defence');
    await s.klik('Settings');
    await venteTil(s, 'input[type="radio"]', 'Settings');
    await rullelisterneKanSes(s, 'Modspils Indstillinger på engelsk ved 390 px');
    await s.luk();
    s = await åbnModspil('forside', 390, 844);
    await rødtKunPåSymbolerne(s, 'Modspils forside ved 390 px');
    await s.luk();
  });
  // Mock-up 5 og specens "Fra 1000 px": bordet til venstre, spørgsmålet og facit til højre, og spalten dækker intet.
  for (const [bredde, højde] of [[1280, 900], [1000, 700]]) {
    await del(`Modspil: bredt layout ved ${bredde} × ${højde}`, async () => {
      s = await åbnModspil('opgave', bredde, højde);
      await toSpalter(s, '[data-ovelse]', `Modspil-opgaven ved ${bredde} px`, { toppe: true });
      await ingenOverlap(s, `Modspil-opgaven ved ${bredde} × ${højde}`);
      await rødtKunPåSymbolerne(s, `Modspil-opgaven ved ${bredde} px`);
      await svarModspil(s);
      await toSpalter(s, '[data-ovelse]', `Modspils facit ved ${bredde} px`, { toppe: true });
      await ingenOverlap(s, `Modspils facit ved ${bredde} × ${højde}`);
      const f = await s.kør(`(() => {
        const rod = document.querySelector('[data-ovelse]');
        const v = rod.querySelector(':scope > .wide-left'), h = rod.querySelector(':scope > .wide-right');
        const q = document.querySelector('h1'), dom = document.querySelector('[data-dom]');
        return { højre: !!h && h.contains(q) && h.contains(dom), under: !!q && !!dom && dom.getBoundingClientRect().top >= q.getBoundingClientRect().bottom - 1,
          venstre: !!v && !!v.querySelector('[data-haand="nord"]') && !!v.querySelector('[data-haand="dig"]') };
      })()`);
      tjek(f.venstre, `Modspils facit ved ${bredde} px: bordet og hænderne står i venstre spalte`);
      tjek(f.højre && f.under, `Modspils facit ved ${bredde} px: spørgsmålet og facit står til højre, facit under spørgsmålet`, JSON.stringify(f));
      await rødtKunPåSymbolerne(s, `Modspils facit ved ${bredde} px`);
      await s.luk();
    });
  }
  // Kun CSS skifter: HTML'en i opgaven og facit er den samme ved 390 og 1280 px.
  await del('Modspil: samme HTML ved 390 og 1280 px', async () => {
    const html = async (bredde) => {
      const t = await åbnModspil('opgave', bredde, 900);
      const før = await t.kør(OPGAVENS_HTML);
      await svarModspil(t);
      const efter = await t.kør(OPGAVENS_HTML);
      await t.luk();
      return [før, efter];
    };
    const [smal, bred] = [await html(390), await html(1280)];
    tjek(smal[0] === bred[0], 'Modspil-opgaven: samme HTML ved 390 og 1280 px');
    tjek(smal[1] === bred[1], 'Modspils facit: samme HTML ved 390 og 1280 px');
  });
  // Rødt kun på ♥ og ♦ i alle øvelser med alle profiler, før og efter svaret.
  await del('Modspil: rødt kun på ♥ og ♦ i alle øvelser', async () => {
    for (const profil of ['standard', 'omvendt', 'kompendiet']) {
      for (const [ovelse, niveau] of [['point', 1], ['regel11', 1], ['laengde', 1], ['markering', 2], ['vaelg-kort', 2], ['afkast', 3], ['forsinket', 3]]) {
        // Standard og Omvendt har ikke forsinket kald (metoden "intet"), så øvelsen springes over (SPEC-modspil.md).
        if (ovelse === 'forsinket' && profil !== 'kompendiet') continue;
        for (const seed of [1, 3]) {
          const hvor = `Modspil ${ovelse}, ${profil}, seed ${seed}`;
          s = await åbnTestside(390, 844, ovelse, niveau, seed, profil);
          await rødtKunPåSymbolerne(s, `${hvor}: opgaven`);
          await svarModspil(s);
          await rødtKunPåSymbolerne(s, `${hvor}: facit`);
          await s.luk();
        }
      }
    }
  });
  await del('Modspil: tastaturet hele vejen', tastaturHeleVejen);
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
  let s;
  if (!KUN_MODSPIL) {
  // Træning ved 1280 px: bordet til venstre, opgaven til højre, højst 1120 px i midten; overskrift og faner i fuld bredde.
  s = await åbn('træning', 1280, 900);
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

  // Mønsterkortet under Næste og ledetråden i Fordelings session følger højre spalte (SPEC-moensterkort-bred.md).
  for (const bredde of [1000, 1280, 1920]) {
    for (const [skærm, vælger, navn] of [['dom', '.screen.session > .memory-box', 'Mønsterkortet under Næste'], ['ledetråd', '.screen.session > .memory.hint', 'Ledetråden']]) {
      const hvor = `${navn} ved ${bredde} px`;
      s = await åbn(skærm, bredde, 900);
      await iHøjreSpalte(s, hvor, vælger);
      await ingenOverlap(s, hvor);
      await s.luk();
    }
  }

  // Analyse følger tegningen ved 1280 px.
  s = await åbn('analyse', 1280, 900);
  await analyseSomTegningen(s);
  await s.luk();

  // En ⓘ i bordets spalte åbner som en boks, og bordet flytter sig ikke (SPEC-info-boks.md).
  for (const [bredde, højde] of [[1280, 900], [1000, 700]]) {
    s = await åbn('analyse', bredde, højde);
    const mål = () => s.kør(`(() => {
      const r = (x) => { const e = document.querySelector(x); if (!e) return null; const k = e.getBoundingClientRect(); return { top: k.top, left: k.left, right: k.right, bottom: k.bottom, height: k.height }; };
      const a = document.activeElement;
      return { bord: r('.fb-analysis .fb-table'), spalte: r('.fb-analysis .fb-column > .wide-left'), boks: r('.info-box'), knap: r('[aria-label="Hjælp: Problemet"]'), fokus: a?.getAttribute('aria-label') || a?.textContent?.trim() || '', fast: getComputedStyle(document.querySelector('.fb-analysis .fb-column > .wide-left')).position, z: getComputedStyle(document.querySelector('.fb-analysis .fb-column > .wide-left')).zIndex };
    })()`);
    const før = await mål();
    await s.klik('Hjælp: Problemet');
    const åben = await mål();
    const hvor = `Problemets ⓘ ved ${bredde} × ${højde}`;
    tjek(åben.boks && ca(åben.bord.top, før.bord.top) && ca(åben.spalte.height, før.spalte.height) && åben.fast === før.fast, `${hvor}: åbner som en boks, og bordet flytter sig ikke`, JSON.stringify({ før: før.bord, åben: åben.bord, spalte: [før.spalte.height, åben.spalte.height], boks: åben.boks }));
    tjek(åben.boks && åben.boks.top >= 15 && åben.boks.bottom <= højde - 15 && åben.boks.left >= 15 && åben.boks.right <= bredde - 15, `${hvor}: boksen er inden for vinduet`, JSON.stringify(åben.boks));
    tjek(åben.boks && Math.abs(åben.boks.left - åben.knap.left) <= 1 && (åben.boks.top >= åben.knap.bottom - 1 || åben.boks.bottom <= højde - 15), `${hvor}: boksen er forankret ved knappen`, JSON.stringify({ boks: åben.boks, knap: åben.knap }));
    if (bredde === 1280) tjek(åben.boks && (åben.boks.bottom <= åben.knap.top || åben.boks.top >= åben.knap.bottom), `${hvor}: boksen dækker ikke knappen`, JSON.stringify({ boks: åben.boks, knap: åben.knap }));
    tjek(åben.z === 'auto', `${hvor}: spalten har stadig ingen z-index`, åben.z);
    tjek(await s.kør(`(() => { const k = document.querySelector('.info-box').getBoundingClientRect(); const t = document.elementFromPoint(k.left + k.width / 2, k.top + k.height / 2); return !!t && !!t.closest('.info-box'); })()`), `${hvor}: boksen ligger øverst`);
    tjek(åben.fokus === 'Luk', `${hvor}: fokus står på ✕`, åben.fokus);
    // De tre måder at lukke på, og fokus tilbage på ⓘ.
    await s.klik('Luk');
    let m = await mål();
    tjek(!m.boks && m.fokus === 'Hjælp: Problemet', `${hvor}: ✕ lukker, og fokus går tilbage`, JSON.stringify(m.fokus));
    await s.klik('Hjælp: Problemet');
    await s.tast('Escape');
    m = await mål();
    tjek(!m.boks && m.fokus === 'Hjælp: Problemet', `${hvor}: Esc lukker, og fokus går tilbage`, JSON.stringify(m.fokus));
    await s.klik('Hjælp: Problemet');
    await s.kør(`document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); true`);
    await vent(100);
    m = await mål();
    tjek(!m.boks && m.fokus === 'Hjælp: Problemet', `${hvor}: et klik udenfor lukker, og fokus går tilbage`, JSON.stringify(m.fokus));
    // Linjernes ⓘ står i højre spalte og åbner i kortet som før.
    await s.klik('Hjælp: Linjerne');
    const l = await s.kør(`({ boks: !!document.querySelector('.info-box'), tekst: !!document.querySelector('[aria-labelledby="fb-lines"] .info-text') })`);
    tjek(!l.boks && l.tekst, `Linjernes ⓘ ved ${bredde} × ${højde}: åbner i kortet som før`, JSON.stringify(l));
    await s.luk();
    // Står spalten fast og er siden rullet, følger boksen knappen.
    s = await åbn('analyse', bredde, højde);
    await s.kør('window.scrollTo(0, 400)');
    await vent(150);
    await s.klik('Hjælp: Problemet');
    const r = await mål();
    tjek(r.boks && r.boks.top >= 15 && r.boks.bottom <= højde - 15, `${hvor}, rullet: boksen er inden for vinduet`, JSON.stringify(r.boks));
    await s.luk();
  }
  s = await åbn('analyse', 390, 844);
  await s.klik('Hjælp: Problemet');
  const mobil = await s.kør(`({ boks: !!document.querySelector('.info-box'), tekst: !!document.querySelector('[aria-labelledby="fb-problem"] .info-text') })`);
  tjek(!mobil.boks && mobil.tekst, 'Problemets ⓘ ved 390 px: åbner i kortet som før', JSON.stringify(mobil));
  await s.luk();

  // Linjekortene efter antallet af linjer (Del 3): tre eller færre i én række, fire som 2 × 2, fem eller flere i rækker af tre.
  for (const [bredde, højde] of [[1280, 900], [1000, 700]]) {
    for (const [valg, mål, rækker] of [['~1. K 7 6 5', '2 stik', [3]], ['~E D 6 5 / 4 3 2', '3 stik', [2, 2]], ['~E 10 8 3 / K B 9 2', '4 stik', [3, 3]]]) {
      s = await b.fane(bredde, højde);
      await s.gå(`${NU}#farvebehandling`);
      await s.klik('Analyse');
      await s.klik(valg);
      await s.klik(mål);
      await vent(500);
      const r = await s.kør(`(() => {
        const kort = [...document.querySelectorAll('.fb-analysis .fb-lines:not(.fb-own-lines) > .fb-line')];
        const rk = new Map();
        for (const e of kort) { const t = Math.round(e.getBoundingClientRect().top); rk.set(t, (rk.get(t) ?? 0) + 1); }
        const inde = kort.every((e) => e.scrollWidth <= e.clientWidth + 1);
        return { rækker: [...rk.values()], inde, info: [...document.querySelectorAll('.info-btn')].filter((b) => b.offsetParent !== null).length, ud: document.documentElement.scrollWidth - document.documentElement.clientWidth };
      })()`);
      tjek(JSON.stringify(r.rækker) === JSON.stringify(rækker), `Linjekortene ved ${bredde} px, ${valg.slice(1)}: rækker af ${rækker.join(' og ')}`, JSON.stringify(r.rækker));
      tjek(r.inde && r.ud <= 0, `Linjekortene ved ${bredde} px, ${valg.slice(1)}: intet stikker ud`, JSON.stringify(r));
      tjek(r.info === 5, `Analyse ved ${bredde} px, ${valg.slice(1)}: præcis 5 ⓘ`, `${r.info} ⓘ`);
      await s.luk();
    }
  }

  // 5 ⓘ med udfyldt situation og i kortvælgeren, og ingen i titellinjen, ved Guide eller i Resultatet.
  for (const [bredde, højde] of [[1280, 900], [390, 844]]) {
    s = await åbn('analyse', bredde, højde);
    await s.klik('Angiv situationen');
    await s.klik('~Maks. hp i farven, Vest: én mindre');
    await vent(300);
    const antal = () => s.kør(`[...document.querySelectorAll('.info-btn')].filter((b) => b.offsetParent !== null).length`);
    tjek((await antal()) === 5, `Analyse ved ${bredde} px med udfyldt situation: præcis 5 ⓘ`, `${await antal()} ⓘ`);
    tjek(await s.kør(`!document.querySelector('.fb-header .info-btn, .fb-guide-bar .info-btn, .fb-result .info-btn, .fb-line .info-btn')`), `Analyse ved ${bredde} px: ingen ⓘ ved titlen, Guide, Resultatet eller i linjekortene`);
    await s.luk();
    s = await åbn('analyse', bredde, højde);
    await s.klik('Kortvælger');
    await vent(300);
    tjek((await s.kør(`[...document.querySelectorAll('.info-btn')].filter((b) => b.offsetParent !== null).length`)) === 5, `Analyse ved ${bredde} px i kortvælgeren: præcis 5 ⓘ`);
    await s.luk();
  }

  // Tab-rækkefølgen følger det, man ser: Spil den selv kommer efter Situationen, og intet har skiftet plads siden referencen.
  for (const [bredde, højde] of [[1280, 900], [390, 844]]) {
    const liste = (fane) => fane.kør(`[...document.querySelectorAll('button, a, input')].filter((e) => e.getClientRects().length > 0 && e.tabIndex >= 0 && !e.classList.contains('fb-bank-item') && !e.closest('.site-footer')).map((e) => (e.getAttribute('aria-label') || e.textContent).replace(/\\s+/g, ' ').trim())`);
    const uden = (l) => l;
    const nu = await åbn('analyse', bredde, højde, NU);
    const før = await åbn('analyse', bredde, højde, FØR);
    const [ln, lf] = [await liste(nu), await liste(før)];
    tjek(ln[ln.indexOf('Spil den selv ▶') - 1] === 'Angiv situationen', `Analyse ved ${bredde} px: Spil den selv kommer lige efter Angiv situationen`, ln.slice(ln.indexOf('Spil den selv ▶') - 2, ln.indexOf('Spil den selv ▶') + 1).join(' | '));
    const i = uden(ln).findIndex((x, k) => x !== uden(lf)[k]);
    tjek(i < 0 && uden(ln).length === uden(lf).length, `Analyse ved ${bredde} px: samme rækkefølge som før`, `trin ${i + 1}: ${uden(ln)[i]} / før ${uden(lf)[i]}`);
    if (bredde === 390) {
      const k = await nu.kør(`(() => { const r = (x) => document.querySelector(x).getBoundingClientRect(); const a = r('[aria-labelledby="fb-situation"]'), b = r('.fb-play-start'); return { under: b.top >= a.bottom, venstre: Math.abs(a.left - b.left), bredde: Math.abs(a.width - b.width) }; })()`);
      tjek(k.under && k.venstre < 1 && k.bredde < 1, 'Analyse ved 390 px: Spil den selv står under Situationen i samme bredde', JSON.stringify(k));
    }
    await nu.luk();
    await før.luk();
  }

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
      s = await åbn('analyse', bredde, højde);
      await s.klik('Hjælp: Problemet');
      // Under 1000 px åbner ⓘ i kortet langt nede på siden, så billedet rulles dertil.
      if (bredde < 1000) await s.kør(`document.querySelector('[aria-label="Hjælp: Problemet"]').scrollIntoView({ block: 'start' }); window.scrollBy(0, -16); true`);
      gem(`${bredde}-problemet-info-aaben.png`, await s.vindue());
      await s.luk();
    }
    // Mønsterkortet under Næste før og efter (SPEC-moensterkort-bred.md), hele siden i vinduets bredde.
    for (const [bredde, højde] of [[1000, 900], [1280, 900], [1920, 1080], [390, 844]]) {
      for (const [url, hvornår] of [[FØR, 'foer'], [NU, 'efter']]) {
        s = await åbn('dom', bredde, højde, url);
        gem(`${bredde}-moensterkort-${hvornår}.png`, await s.billede());
        await s.luk();
      }
    }
  }

  }

  // Modspil (SPEC-modspil.md, trin 2): skærmene som mock-up'en, bredt layout, rødt og tastaturet.
  await tjekModspil();

  // Under 1000 px er intet ændret. Chrome kan en sjælden gang kantutjævne en enkelt pixel tekst anderledes, når maskinen
  // har travlt, så en forskel prøves én gang til med nye faner; en rigtig forskel kommer igen. Med --modspil kun de to
  // skærme, Modspil ændrer: forsiden (gruppen) og vejledningen (afsnittet), begge med Modspil skjult.
  const sammenlignes = KUN_MODSPIL ? ['forside', 'vejledning'] : Object.keys(SKÆRME);
  for (const skærm of sammenlignes.filter((k) => !KUN.length || KUN.includes(k))) {
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
