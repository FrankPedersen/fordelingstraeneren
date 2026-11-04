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

- [ ] Del 1: farverne og skriften i tabellen er brugt overalt; ingen #5b6b82 eller system-ui tilbage; mørk tilstand har kontrast 4,5:1; `tokens.test.ts` består.
- [ ] Del 2: accepttestene i `SPEC-bred-layout.md`; Analyse ved 1280 px ligner `Analyse.png`.
- [ ] Del 3: Analyse med tre linjer og udfyldt situation har præcis 5 ⓘ; ingen ⓘ ved Guide eller i titellinjen; hver samlet ⓘ indeholder alle emner fra de gamle.
- [ ] Under 1000 px er layoutet som før (Del 2 og 3 ændrer kun ⓘ og farver dér).
- [ ] `npm test`, fagordstesten og testen for beskrivende form er grønne.

Giv Frank skærmbilleder ved 1280 og 390 px af forsiden, Træning, Analyse og Pointregnskab efter hver del, og vis de samlede ⓘ-tekster for Linjerne og Problemet før og efter. Frank godkender hver del, før der flettes.

## Konventionstræneren

Den bruger allerede Subtle Gradient (samme værdier som forsiden). Kun `multi-svar-traener.html` står smalt (620 px); den får det brede layout i Del 2 som beskrevet i `SPEC-bred-layout.md`.
