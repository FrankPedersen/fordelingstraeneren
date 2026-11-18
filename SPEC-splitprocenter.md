# SPEC – Splitprocenter (ny opgavetype i Farvebehandling) og fam-4

18. november 2026 · Fordelingstræneren · opgave J i `PLAN-aabne-opgaver.md` · gren `splitprocenter`, tag før: `v44-foer-splitprocenter`.

## Formål

En spilfører skal kende chancerne for, hvordan modpartens kort i en farve sidder, uden at regne. 5 kort ude sidder 3-2 i 68 % af tilfældene og 4-1 i 28 %. Det er grundlaget for at vælge mellem at toppe farven og at kippe. Farvebehandling regner allerede disse tal i analysen, men brugeren trænes ikke i at kunne dem udenad. Splitprocenter bliver en ny, lille opgavetype i Farvebehandling.

Samme gren retter to småting:
- `fam-4`'s tekst i `design/tokens.json` siger stadig, at den også er fokusringen. Det er `focus` siden 4. nov.
- `CLAUDE.md` om forsidens grupper siger `flex: 1 1 280px`, men grupperne står 2 × 2 siden 18. nov.

## Afgrænsning

| Må ændres | Må ikke ændres |
| --- | --- |
| `src/farvebehandling/`: den nye opgavetype i `training/tasks.ts`, `storage.ts` (`TaskType`), selvvalgt træning, den daglige session og facit | de eksisterende opgavetyper, linjerne, løseren og analysen |
| `src/farvebehandling/model/layouts.ts` bruges som bibliotek (`splitChance`, `layoutChance`) | formlerne i `layouts.ts` |
| vejledningen: et nyt afsnit om Splitprocenter i Farvebehandlings guide på begge sprog | de eksisterende afsnit |
| `design/tokens.json`: kun `usage`-teksten for `fam-4` | farveværdierne og andre tokens |
| `CLAUDE.md`: linjen om forsidens grupper og et afsnit om Splitprocenter | – |

Der kommer ingen nye skærme. Opgaven bruger Farvebehandlings eksisterende opgave- og facitlayout med svarknapper, så der skal ingen mock-up til. Kræver noget alligevel et nyt layout, så stop og spørg.

## Tallene (facit)

Alle tal regnes af `splitChance(n, længste)` a priori (13 ledige pladser hos hver). Der står ingen tal i hånden. Procent vises med én decimal i facit og afrundet til hele procent i spørgsmål og svar.

| Kort ude | Sidninger (a priori) |
| --- | --- |
| 2 | 1-1 52 % · 2-0 48 % |
| 3 | 2-1 78 % · 3-0 22 % |
| 4 | 3-1 50 % · 2-2 41 % · 4-0 10 % |
| 5 | 3-2 68 % · 4-1 28 % · 5-0 4 % |
| 6 | 4-2 48 % · 3-3 36 % · 5-1 15 % · 6-0 1 % |
| 7 | 4-3 62 % · 5-2 31 % · 6-1 7 % · 7-0 0,5 % |
| 8 | 5-3 47 % · 4-4 33 % · 6-2 17 % · 7-1 3 % · 8-0 0,2 % |

Tabellen ovenfor er kun til læseren. Testen sammenligner med `splitChance`.

## Opgaverne

| Niveau | Spørgsmål | Svar |
| --- | --- | --- |
| 1 | "Modparten har 5 kort i farven. Hvor ofte sidder de 3-2?" (2–8 kort ude, den hyppigste eller næsthyppigste sidning) | 4 knapper med procenter. De forkerte er de andre sidningers tal for samme antal kort og ét tal fra et nabo-antal, mindst 5 procentpoint fra det rigtige |
| 2 | "Hvilken sidning er den hyppigste med 6 kort ude?" | knapper med sidningerne (4-2, 3-3, 5-1, 6-0) |
| 3 | "Hvor ofte sidder 6 kort 3-3 eller 4-2?" (to sidninger lagt sammen, som når en linje virker ved begge) | 4 knapper med procenter |
| 4 | "Hvor ofte sidder en bestemt honnør alene?" fx kongen single med 4 kort ude. Det er sidningen 3-1 delt på de 4 mulige single kort og på begge hænder: 3-1 er 50 %, så kongen alene hos en bestemt modspiller er 6 % | 4 knapper med procenter |

- **Huskereglen** står i facit, hvor den passer: "Et ulige antal deler sig oftest så jævnt som muligt (3-2, 4-3). Et lige antal deler sig oftest ujævnt (4-2, 5-3), undtagen 2 kort."
- **Facit** viser tallet med én decimal, hele rækken for antallet som en lille tabel, og hvad det betyder ved bordet, fx "Med 5 kort ude og E K D: toppes farven, går den i 68 %".
- **Leitner-bunke:** de 23 sidninger i tabellen er kort i en bunke som i Pointregnskabets intervalkort, så de svære kommer igen.

## Placering i Farvebehandling

1. **Selvvalgt træning:** "Splitprocenter" kommer på listen over opgavetyper med ⓘ på begge sprog.
2. **Den daglige session:** Splitprocenter er opvarmning (højst 45 s) før de andre opgaver, eller én opgave i blandingen. Claude Code vælger den løsning, der ændrer mindst i sessionen, og skriver valget under Afklaret.
3. **Statistikken** tæller den nye type som de andre.

## fam-4 og CLAUDE.md

- **`design/tokens.json`, `fam-4.usage`:** sætningen "Også fokusringen (3px)." fjernes. Resten står. Er der en test, der tjekker teksten, rettes den først.
- **`CLAUDE.md`:** linjen om forsidens grupper beskriver 2 × 2 fra 1000 px i stedet for `flex: 1 1 280px`.

## Accepttest (skrives først, røde)

1. **Tallene:** facit for alle 23 sidninger er lig med `splitChance`, og summen for hvert antal kort er 100 %.
2. **Opgaverne:**
   - niveau 1–4 genereres fra et seed og kan genskabes;
   - præcis én knap er rigtig;
   - de forkerte er mindst 5 procentpoint fra det rigtige (ved niveau 2 en anden sidning).
3. **Niveau 4:** kongen alene med 4 kort ude hos én bestemt modspiller er 6,2 % (3-1 delt på 4 kort og 2 hænder). Testen regner det af `layoutChance` og ikke af en fast tabel.
4. **Selvvalgt og session:** typen findes i selvvalgt træning og i sessionen og gemmes i `TaskType`. Gamle data uden typen indlæses uændret.
5. **Facit:** huskereglen og rækken for antallet vises på begge sprog. Fagords- og bydeformstjekket er grønne.
6. **fam-4:** `usage` nævner ikke fokusringen. Farveværdierne er uændrede.
7. **Uændret i øvrigt:** alle eksisterende tests består. `tjek-bred-layout.mjs` er i orden og har ingen pixelforskelle på andre skærme end Farvebehandlings selvvalgte træning og opgaven.

## Afklaret

(udfyldes af Claude Code. Tokenforbruget skrives i fire tal: nye input, skrevet til cachen, læst fra cachen og output.)

## Arbejdsgang (tre korte sessioner, styringens punkt 7 og 8)

1. **Session 1:**
   - Tag `v44-foer-splitprocenter`, og opret grenen `splitprocenter`.
   - Skriv accepttestene, så de er røde.
   - Kør kun de nye tests, og stop.
2. **Session 2:** byg. Kør kun testene i `src/farvebehandling/` og fagords- og bydeformstjekket.
3. **Session 3:**
   - Kør hele suiten og `tjek-bred-layout.mjs` én gang hver.
   - Tag skærmbilleder af en opgave og facit ved 390 og 1280 px i `C:\Users\frank\Kontraktbridge\skaermbilleder\splitprocenter\`.
   - Stop før merge.
