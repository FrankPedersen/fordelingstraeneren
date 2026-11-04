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

## Del 2 · Bordet og Analyse (gren `analyse-layout`)

1. **Bordets spalte står kun fast, når skærmen har to spalter,** og kun når spalten er lavere end vinduet (`max-height: calc(100vh - 32px)`). Ellers ruller den med.
2. **Spalten må aldrig dække noget:** ingen z-index over indholdet og intet overlap.
3. **I Spil den selv kan dommen og resultatet altid ses efter sidste stik.**
4. **`scripts/tjek-bred-layout.mjs` fanger overlap** ved 1280 × 900 og 1000 × 700 på Analyse, Spil den selv, Træning og Pointregnskab. Det første klik rettes samtidig, og nye referencebilleder laves efter Del 1, så pixelsammenligningerne er grønne igen.
5. **Analyse som tegningen `docs/specs/design/Analyse.png`:** Situationen inde i Problemet-kortet, linjekortene side om side, De afgørende sidninger og Resultatet side om side, Resultatet på mørk flade.
6. **To små rettelser fra Del 1:** en deaktiveret primærknap (fx Svar) er neutral grå i begge tilstande (`surface-2` med `muted` tekst), ikke dæmpet orange. Sidefoden laves ens med forsidens nye, kompakte sidefod, når `ny-forside` er udgivet. Er den ikke udgivet, når Del 2 bygges, bliver sidefoden, som den er, og det står under Åbne punkter.

Skærmbilleder til Frank efter Del 2: 1280 og 390 px af Analyse (også rullet til bunden i Spil den selv), Træning og Pointregnskab. Frank godkender, før der flettes.

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

Frank tilføjede 4. november 2026:

1. **Linjekortene:** "Flest stik i snit: 1,86" i stedet for "Flest stik i gennemsnit: 1,86 stik", og på engelsk "Avg. tricks: 1.86".
2. **Med præcis fire linjer** står linjekortene 2 × 2 fra 1000 px. Med tre eller færre står de i én række, og med fem eller flere i rækker af tre.
3. **Tab-rækkefølgen følger det, man ser:** Spil den selv flyttes efter Situationen i HTML'en. Det gælder også på mobil, hvor det kommer til at stå under Situationen. `scripts/tjek-bred-layout.mjs` tjekker, at intet andet flytter sig.

Til Frank: de samlede ⓘ-tekster for Linjerne og Problemet før og efter, og skærmbilleder ved 1280 og 390 px af Analyse med fire linjer. Frank godkender, før der flettes.

## Accepttest

- [x] Del 1: farverne og skriften i tabellen er brugt overalt; ingen #5b6b82 eller system-ui tilbage; mørk tilstand har kontrast 4,5:1; `tokens.test.ts` består.
- [x] Del 2: punkt 1–6 (sidefoden under Åbne punkter); `node scripts/tjek-bred-layout.mjs` er grøn, også overlap og pixelsammenligninger; Analyse ved 1280 px ligner `Analyse.png`.
- [x] Del 3: Analyse med tre linjer og udfyldt situation har præcis 5 ⓘ; ingen ⓘ ved Guide eller i titellinjen; hver samlet ⓘ indeholder alle emner fra de gamle.
- [ ] Under 1000 px er layoutet som før (Del 2 og 3 ændrer kun ⓘ og farver dér).
- [ ] `npm test`, fagordstesten og testen for beskrivende form er grønne.

Giv Frank skærmbilleder ved 1280 og 390 px af forsiden, Træning, Analyse og Pointregnskab efter Del 1 (Del 2 og Del 3 har deres egne lister ovenfor). Frank godkender hver del, før der flettes.

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
11. **Bordets spalte (Del 2):** den står kun fast som direkte barn af en skærm med to spalter (`.cols`, `.fb-column`, `.fb-guide` og `.guide-cols`), så bordet inde i Spil den selv i Analyse aldrig står fast. `BoardColumn` måler spaltens indhold med `scrollHeight` og følger også det, der står i den, fordi spalten ikke vokser længere, når den er ved sin højeste højde.
12. **Efter sidste stik** rulles resultatet frem med `scrollIntoView({ block: 'nearest' })`, hvis det ikke kan ses. Står det der allerede, flytter siden sig ikke.
13. **Analyse ændres kun med CSS fra 1000 px,** og rækkefølgen i HTML er den samme, så mobilen er pixel for pixel som før. Det betyder, at Spil den selv står nederst i Problemet-kortet, men kommer før Situationen, når der tabuleres. Knappen er orange og i fuld bredde fra 1000 px og som før på mobil.
14. **Tegningen og virkeligheden:** Guide står stadig over Vælg kombination, fordi fanerne står mellem titlen og Analyse. Mærket "står fast" og båndet "5 ⓘ i alt" er noter på tegningen og er ikke bygget. Filteret hedder "Modpartens hp" fra 1000 px, knapperne hedder stadig "1 hp (38)", og forklaringen under Vælg kombination bliver, fordi intet indhold må gå tabt. Sammenlign og gennemsnittet står i samme række som i tegningen; ⓘ'erne fjernes i Del 3.
15. **De afgørende sidninger og Resultatet:** de står side om side fra 1200 px, i forholdet 1,4 : 1 og ikke tegningens 1,2 : 1, fordi eksemplet på tegningen kun har tre linjer. Under 1200 px og med mere end fire linjer står de under hinanden, så alle kolonner kan ses uden at rulle. Fra 1000 px hedder kolonnerne kun A, B, C, og kolonnen "afgør" er væk, når kun de afgørende sidninger vises, for mærket står over tabellen.
16. **Referencebillederne** ligger ikke i git: `scripts/tjek-bred-layout.mjs` starter appen fra tagget `v34-foer-analyse-layout` (appen efter Del 1) i en midlertidig worktree og sammenligner ved 999 og 390 px. Rettelsen af den deaktiverede primærknap lægges på referencen, så den ikke tæller som en forskel.
17. **Konventionstræneren:** `multi-svar-traener.html` fik det brede layout med `SPEC-bred-layout.md` og er ikke en del af Del 2.
18. **Valgene fra Del 2:** De afgørende sidninger og Resultatet i 1,4 : 1 og under hinanden med mere end fire linjer, Guide over Vælg kombination og noterne på tegningen, der ikke er bygget, står, som de er (Franks godkendelse 4. november 2026).
19. **Hvor de gamle ⓘ er gået hen (Del 3):** feltet "Kombination eller spil" har mistet sin ⓘ, og teksten står under Vælg kombination, så der også er 5 ⓘ i kortvælgeren. Kortvælgerens tekst, der før ikke blev vist, står nu samme sted. Ordet "Sammenlign" under linjekortene var kun ⓘ's anker og er væk, for hvert kort har afkrydsningen. Teksterne, der havde tre sætninger, er skrevet sammen til to uden at miste indhold, og "✓ bedst" hedder nu "✓ Bedste linje" som på kortet.
20. **Spil den selv har sin egen ⓘ, mens det er åbent,** med spillet, snittet og forbindelserne, når de er begrænsede. Analyse har derfor 5 ⓘ, og 6, mens der spilles. Sådan er det også fra facit, hvor spillet er en skærm for sig.
21. **Titellinjen:** ⓘ er væk i Analyse, både i fanen og i modulet, fordi Guide allerede forklarer fanerne og modulet (kapitel 1). I Træning og Selvvalgt bliver ⓘ ved fanerne, for dér er der ingen Guide.
22. **Facit:** Linjerne samler linjerne, snittet og resultatet, Alle sidninger under Hvorfor har de tre emner fra De afgørende sidninger, og Resultatet har ingen ⓘ.
23. **Linjekortene efter antal** gælder fra 1000 px. Tre kort i en række er smalle under 1200 px, så Sammenlign står dér på sin egen linje under snittet. Med én eller to linjer fylder kortene hele bredden.
24. **Pixelsammenligningen i Del 3:** referencen er `v35-foer-analyse-info`. På Analyse, Guide, Facit og Spil den selv skjules ⓘ og Spil den selv i begge apps, "Sammenlign" fjernes, og referencen får snittets nye tekst; så er skærmene pixel for pixel ens ved 999 og 390 px. Rækkefølgen af knapper og links er også den samme, bortset fra at Spil den selv nu kommer lige efter Angiv situationen.

25. **Valgene fra Del 3** (Franks godkendelse 4. november 2026): Spil den selv har sin egen ⓘ, mens det er åbent, ordet Sammenlign under linjekortene er væk, Vælg kombination samler også feltet Kombination eller spil og kortvælgeren, og fanernes ⓘ bliver i Træning og Selvvalgt.

## Åbne punkter

- **Sidefoden i Fordelingstræneren** skal være ens med forsidens nye, kompakte sidefod, når `ny-forside` er udgivet (Del 2, punkt 6). 4. november 2026 var den ikke udgivet: `SPEC-ny-forside.md` ligger i `Forside/docs/specs/`, men der er hverken gren eller tag, så sidefoden er uændret. Rettelsen gælder alle bredder og er derfor undtaget reglen om, at intet ændres under 1000 px.
