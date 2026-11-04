# SPEC-design-som-forsiden

4. november 2026 · Franks valg, skrevet af Claude (rådgiver). Forlæg: lærredet "Kontraktbridge – ny forside", tegningen "Analyse på computer – én ⓘ pr. kort". Kilden ligger i `docs/specs/design/Analyse.dc.html` med skærmbilledet `Analyse.png`, og forsidens tegninger ligger samme sted til sammenligning.

Fordelingstræneren skal se ud som forsiden: samme farver, skrift, hjørner og knapper. Samtidig bygges det brede layout fra `SPEC-bred-layout.md` (bud A), og Analyse får én ⓘ pr. kort. De tre dele bygges i den rækkefølge på hver sin gren, så hver kan godkendes for sig.

## Del 1 · Udseendet (gren `design-forsiden`)

| Token | I dag | Efter |
| --- | --- | --- |
| `--bg` | #f5f6f8 | #f2f3f4 |
| `--text` | #18202b | #1a1a1a |
| `--muted` | #5d6675 | #4a4a4a |
| `--line` | #d8dde5 | rgba(26,26,26,.12) |
| `--ink` / `--ink-text` | #263241 / #fff | #1a1a1a / #fff |
| `--accent` (valgt, fokus, primærknap) | #5b6b82 | #ff9f4a, tekst #1a1a1a |
| `--accent-soft` (valgt flade) | #e3e9f1 | #fff1e3 med 2 px kant i #1a1a1a |
| `--radius` | 14px | kort 24px, felter og knapper 12px, chips og piller 9999px |
| Skrift | system-ui | Inter 400/600 til tekst, Manrope 800 til overskrifter; selvhostet som på forsiden (`fonts/`) |

- **Uændret:** `--table`, kortenes farver, `--fb-hit`/`--fb-miss` og familiefarverne `--fam-4…7`, fordi de bærer betydning.
- **Mørk tilstand (SPEC-tema.md) bliver:** accent #ff9f4a, valgt flade rgba(255,159,74,.16), resten som i dag. Tjek kontrast 4,5:1.
- **Topbjælken:** titel i Manrope 800, Guide som mørk pille med orange tekst som i tegningen.
- **Design system "Fordelingstræneren"** opdateres bagefter af Claude (rådgiver); Claude Code skriver tokens i `design/tokens.json`, og `tokens.test.ts` holder filerne i takt.

## Del 2 · Bredt layout (gren `bred-layout`)

Byg `SPEC-bred-layout.md` som skrevet (bud A: bordet til venstre og står fast, opgaven til højre, fra 1000 px). Analyse følger tegningen:

- Vælg kombination over hele bredden: Banken/Kortvælger i overskriften, hp-filteret på én linje, kombinationerne i tre kolonner.
- Venstre spalte (400 px, står fast): Problemet med bordet, første udspil, Mål, **Situationen inde i samme kort** og "Spil den selv".
- Højre spalte: Linjerne med op til tre linjekort side om side og "Dine linjer" nederst; Forskellen; De afgørende sidninger og Resultatet side om side. Resultatet på mørk flade med chancen fremhævet.

## Del 3 · Én ⓘ pr. kort (gren `analyse-info`)

| Kort | ⓘ der lægges sammen | Efter |
| --- | --- | --- |
| Titellinjen og Guide | analysisModule/tabs og guide | ingen – Guide er hjælpen til skærmen |
| Vælg kombination | choose | 1 |
| Problemet (med Situationen) | goals, situation, felternes hjælp, connections, lead | 1 |
| Linjerne | lines, allLeads, compare, ownLines, average (i hvert kort), result | 1 |
| Forskellen | band | 1 |
| De afgørende sidninger | layouts, decides, chanceColumn | 1 |
| Resultatet | – | ingen |

I alt 5 ⓘ, uanset antal linjer. Hver samlet ⓘ har en kort liste med fed overskrift pr. emne og én eller to sætninger i beskrivende form, og intet indhold går tabt. Facit i Træning følger samme regel. Engelsk følger med.

## Accepttest

- [x] Del 1: farverne og skriften i tabellen er brugt overalt; ingen #5b6b82 eller system-ui tilbage; mørk tilstand har kontrast 4,5:1; `tokens.test.ts` består.
- [ ] Del 2: accepttestene i `SPEC-bred-layout.md`; Analyse ved 1280 px ligner `Analyse.png`.
- [ ] Del 3: Analyse med tre linjer og udfyldt situation har præcis 5 ⓘ; ingen ⓘ ved Guide eller i titellinjen; hver samlet ⓘ indeholder alle emner fra de gamle.
- [ ] Under 1000 px er layoutet som før (Del 2 og 3 ændrer kun ⓘ og farver dér).
- [ ] `npm test`, fagordstesten og testen for beskrivende form er grønne.

Giv Frank skærmbilleder ved 1280 og 390 px af forsiden, Træning, Analyse og Pointregnskab efter hver del, og vis de samlede ⓘ-tekster for Linjerne og Problemet før og efter. Frank godkender hver del, før der flettes.

## Konventionstræneren

Den bruger allerede Subtle Gradient (samme værdier som forsiden). Kun `multi-svar-traener.html` står smalt (620 px); den får det brede layout i Del 2 som beskrevet i `SPEC-bred-layout.md`.

## Afklaret

1. **Grenene og Del 2** (Franks besked 4. november 2026): delene bygges på grenene `design-forsiden`, `analyse-layout` og `analyse-info`, hver med et tag før og Franks godkendelse før fletning. Del 2 retter også bordet, der dækker resultatet i Spil den selv i Analyse, med reglen for den faste spalte, og udvider `scripts/tjek-bred-layout.mjs` til at fange overlap. `SPEC-bred-layout.md` er allerede udgivet, så Del 2 er Analyse efter tegningen og rettelsen.
2. **Kanten på valgte elementer** er den nye token `accent-line`: #1a1a1a i lys tilstand som i tabellen og #ff9f4a i mørk, hvor den er accent som i dag. Primærknappens kant har samme farve som dens flade.
3. **Fokusringen følger forsiden, ikke ordet "fokus" i tabellen, i lys tilstand:** den nye token `focus` er #1a1a1a i lys tilstand og #ff9f4a i mørk, og ringen er orange på de mørke flader i topbjælken og sidefoden. Orange giver kun 2,0:1 mod hvid og 1,8:1 mod baggrunden, og en fokusring skal have 3:1. Værdien står ét sted, hvis Frank vil have det anderledes.
4. **Overskrifterne:** h1 og navnet i topbjælken står i Manrope 800. h2, h3 og h4 står i Inter 600, fordi begge tegninger viser kortenes overskrifter sådan.
5. **Skriften:** kun Latin og symbolskriften fra forsidens `fonts/` (5 filer, 158 KB) ligger i `public/fonts/`, fordi appen er på dansk og engelsk, og de gemmes offline med resten af appen. ♠ ♥ ♦ ♣ står i Noto Sans Symbols 2 som på forsiden, så de ser ens ud på alle enheder. Alle vægte er 400, 600 eller 800, også det, browseren ellers gør fedt.
6. **Hjørnerne:** 24 px er kort, dialoger, sporkort, tal i en boks og sidefoden. 12 px er knapper, felter, faner, taster, listeposter og de bokse, der står inde i et kort (bannere, feedback, linjekort og paneler). 9999 px er chips og piller. Spillekortene beholder 8 og 4 px, og chipsene i tabellen over sidninger beholder 8 px, som i tegningen.
7. **Uændret uden for tabellen:** `surface`, `surface-2`, `ok`, `ok-bg` og `bad-bg` og hele mørk tilstand ud over accent, den valgte flade og de to nye tokens. `card-muted` er #5d6675 som før, fordi den er en af kortenes farver. Den bedste linjes grønne farver i tegningen er ikke taget med i Del 1.
8. **Layoutet er uændret i Del 1:** stylesheets ændrer kun farver, skrift, vægte, kanter og hjørner. Inter er lidt bredere end den gamle skrift, så tekst kan brydes et andet sted, også under 1000 px.
9. **`design/tegneflade/`** er de gamle tegninger og bruges ikke af appen; de beholder deres værdier, og designsystemet opdateres af Claude (rådgiver) bagefter.
10. **Accepttesten for Del 1** er `src/design-forsiden.test.ts` og `node scripts/tjek-design-forsiden.mjs`, der ser på alle synlige elementer på 30 skærme ved 1280 og 390 px i lys og mørk tilstand (120 visninger): skriften er hentet, ingen anden skrift eller vægt, ingen gamle farver, kontrast 4,5:1, intet stikker ud, og ingen knap klipper sin tekst.
