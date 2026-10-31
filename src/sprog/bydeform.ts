/**
 * Beskrivende form (SPEC-beskrivende-form.md; husets regel i ../CLAUDE.md, Franks valg 30. oktober 2026): instruktioner
 * og forklaringer skrives i beskrivende form, ikke i bydeform. Knapper og links og navnene på opgaver og øvelser er
 * undtaget. Bruges af testen `bydeform.test.ts` (i `npm test`).
 */

/**
 * Udsagnsord i bydeform, der kan stå først i en dansk instruktion. "Pas" og "lav" mangler med vilje: det er meldingen og
 * tillægsordet ("lav" = de laveste kort).
 */
export const BYDEFORMER: ReadonlySet<string> = new Set(
  `afbryd angiv annullér behold bemærk brug byg eksportér erstat find fjern flyt fold følg fortsæt gem gentag giv gruppér
  gå gæt hent hold husk importér indsæt kig kip klik kom kopiér kryds lad luk lås læg læs markér navngiv noter notér
  nulstil opdatér overskriv prøv regn ret ryd sammenlign se send sikr skift skriv slet slå spil spring start stop svar sæt
  tag tast tjek træk træn tryk tæl tænk udfyld udled undgå vent vis vælg vurdér øv åbn`.split(/\s+/),
);

/**
 * Knapper, links og navne på opgaver og øvelser, der bliver i bydeform (gruppe 1 og 2 i docs/beskrivende-form.md). Et
 * regulært udtryk dækker en tekst med et indsat navn eller tal.
 */
export const UNDTAGELSER: readonly (string | RegExp)[] = [
  // Knapper og links
  'Start dagens session',
  /^Start dagens session i\b/,
  'Tag en ekstra session',
  /^Tag en ekstra session i\b/,
  'Start med Fordeling',
  'Se en klubaften: 100 hænder',
  'Læs vejledningen',
  'Opdatér',
  'Skift sprog til engelsk',
  'Luk',
  'Prøv igen senere',
  'Lås op med tre spørgsmål',
  'Brug skabelonen',
  'Vis ledetråd',
  'Afbryd',
  'Afbryd sessionen',
  'Fortsæt sessionen',
  'Gæt',
  'Svar',
  'Eksportér data',
  'Importér data',
  'Eksportér nu',
  'Overskriv mine data',
  'Erstat mine data',
  'Annullér',
  'Vis som tabel',
  'Vis løsningen',
  'Ryd cellen',
  'Ryd',
  'Slet',
  /^Fjern\b/,
  /^Flyt .* op$/,
  'Skriv til mig',
  'Spil den selv ▶',
  'Prøv den',
  'Vælg kombination',
  'Regn den ud',
  'Stop',
  'Angiv situationen',
  'Fold sammen',
  'Nulstil',
  'Regn med situationen',
  'Vis alle sidninger',
  'Vis kun de afgørende',
  'Gruppér',
  'Vis alle udspil',
  'Vis kun de vigtigste udspil',
  'Sammenlign',
  /^Sammenlign linje\b/,
  'Importér',
  'Eksportér',
  'Erstat',
  'Regn',
  'Gem',
  'Lås',
  'Gem og regn',
  'Ret',
  /^Ret\s/,
  /^Start ·/,
  'Skift filter',
  'Åbn i Analyse',
  // Statistikkens knap "Vælg <teknik>" (forslaget til Selvvalgt).
  'Vælg',
  /^Øv .*i Selvvalgt$/,
  'Vælg fil',
  /^Vælg en fil med .+ data$/,
  // Navne på opgaver og øvelser
  'Spil den selv',
  'Find hullet',
  'Vælg linjen',
  'Gæt chancen (valgfrit)',
  'Hold eller par',
  'Vælg selv',
  'Sammenlign metoder',
  'Regn oppefra',
  'Spil mod honnør',
];

/** Sætninger, der begynder med et af ordene, men ikke er bydeform: meldingen pas, en knap eller opgave som grundled og lister med navne. */
export const FALSKE_TRÆF: readonly RegExp[] = [
  /^Eksportér gemmer\b/,
  /^Importér viser\b/,
  /^Start giver\b/,
  /^"Vis alle sidninger" folder\b/,
  /^"Noter" lader\b/,
  /^"Angiv situationen" åbner\b/,
  /^Spil den selv, åbnet fra\b/,
  /^Gæt: /,
  /^Vælg linjen, Hvor stor er chancen\?/,
  /^Sammenlign metoder, hvor\b/,
];

const PREFIX = /^[\s"'“„«(\[▶→←↓↑✓✗·•–—#*>-]*/;

const excepted = (text: string) => {
  const t = text.trim();
  return UNDTAGELSER.some((u) => (typeof u === 'string' ? u === t : u.test(t)));
};

/**
 * Sætningerne i en dansk tekst, der begynder med et udsagnsord i bydeform, også efter kolon og semikolon, fx
 * "13-sudoku: udled …". Knapper, links og navne på undtagelseslisten og de falske træf tæller ikke.
 */
export function bydeform(text: string): string[] {
  // Et enkelt ord med små bogstaver er kode (fx 'hold', 'vælg-linjen'), ikke en instruktion.
  if (excepted(text) || /^[a-zæøå-]+$/.test(text.trim())) return [];
  const out: string[] = [];
  // Sætninger (ikke efter forkortelser som "pr." og "fx."), led efter kolon og semikolon (også "**Knap:**" i guiden) og linjer.
  for (const segment of text.split(/(?<=[.!?])(?<!\b(?:[Pp]r|[Cc]a|[Ff]x|[Kk]l|[Nn]r)\.)\s+|[:;]\**\s+|\n+/)) {
    const s = segment.replace(PREFIX, '').trim();
    const first = s.match(/^[A-Za-zÆØÅæøåÉé]+/)?.[0];
    if (!first || !BYDEFORMER.has(first.toLowerCase())) continue;
    if (excepted(s) || FALSKE_TRÆF.some((r) => r.test(segment.trim()) || r.test(s))) continue;
    out.push(s);
  }
  return out;
}

/**
 * Filer, testen springer over. Løserens linjer i bankens data og deres skabeloner var undtaget (A1, Franks valg
 * 30. oktober 2026); siden 31. oktober 2026 følger de også beskrivende form (SPEC-sprog-kipning-toppe), så listen er tom.
 */
export const IKKE_INSTRUKTIONER: readonly RegExp[] = [];
