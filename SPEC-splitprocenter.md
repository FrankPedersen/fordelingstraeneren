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

### Session 1: accepttest (18. november 2026)

- **Status:** accepttestene er skrevet og røde; intet er bygget. Venter på session 2 (byggeri); ikke flettet.
- **Tag og commits:** `v44-foer-splitprocenter` står på `main` (`a0f2128`). Grenen `splitprocenter` har `ed3a17d` (specen), `4237e71` (testene) og committen med dette afsnit.
- **Testfilerne:**
  - `src/farvebehandling/training/splitprocenter.test.ts` (13 tests):
    - punkt 1: de 23 sidninger hyppigste først, lig med `splitChance` og med en uafhængig optælling, summen 100 % for hvert antal og bunkens 23 kort;
    - punkt 2: opgaverne fra et seed, præcis én rigtig, fire procenter med de forkerte mindst 5 procentpoint væk, niveau 1's forkerte tal, niveau 2's sidninger, niveau 3's sum og et bestemt antal kort;
    - punkt 3: kongen alene med 4 kort ude er 6,2 %, regnet af `layoutChance` og lig med 3-1 delt på 8, og alle antal på niveau 4;
    - punkt 4: `TaskType`, gamle data indlæses uændret, sessionen har én opgave i blandingen, statistikken tæller den, og et forkert svar kommer igen næste dag.
  - `src/farvebehandling/ui/splitprocenter.test.tsx` (4 tests):
    - punkt 4 og 5: Selvvalgt i appen med ⓘ og alle fire niveauer med facit, og svarene logges uden at røre dagsplanen;
    - punkt 3: knappen 6 % og facit 6,2 %;
    - punkt 5: opgaven og facit på dansk og engelsk med huskeregel og rækken for antallet, og intet dansk på engelsk.
  - `src/fam4-usage.test.ts` (1 test): punkt 6.
  - Punkt 5's fagords- og bydeformstjek og punkt 7 er de eksisterende tests (`src/sprog/sprog.test.ts`, `src/sprog/bydeform.test.ts`, hele suiten og `tjek-bred-layout.mjs`); de læser de nye tekster af sig selv.
- **Resultat:** `npx vitest run src/farvebehandling/training/splitprocenter.test.ts src/farvebehandling/ui/splitprocenter.test.tsx src/fam4-usage.test.ts` giver 18 tests og 18 røde:
  - `makeSplitTask`, `splitRows`, `SPLIT_COUNTS` og `SPLIT_CARDS` findes ikke;
  - `TASK_TYPES` mangler 'splitprocenter', og sessionen har ingen Splitprocenter-opgave;
  - Selvvalgt har ingen "Hjælp: Splitprocenter";
  - `fam-4.usage` nævner fokusringen.

  Testenes egne kontroller er prøvet med midlertidige stubbe: en enkel `makeSplitTask` med typen i `TASK_TYPES` (punkt 1–3 og lagringen bestod), `tokens.json` uden sætningen (punkt 6 bestod) og en kunstig side til brugerfladens hjælpere. Stubbene er slettet og ikke committet. `tsc` fejler i de nye filer kun på den manglende grænseflade.
- **Grænsefladen til session 2** (står også øverst i testfilerne). Testene køres med kommandoen ovenfor; `fam4-usage.test.ts` ligger uden for `src/farvebehandling/` og køres med.
  - `training/tasks.ts` eksporterer (filen bag kan være ny):
    - `SPLIT_COUNTS` = 2–8;
    - `splitRows(n)` med `{ label, longer, chance }`, hyppigste først;
    - `SPLIT_CARDS`: 23 nøgler `split:<n>:<sidning>`;
    - `SplitLevel` og `makeSplitTask(level, rng, n?)`, der giver en `SplitQuestion` med `level`, `n`, `splits`, `honor?`, `seat?`, `value`, `card` og `options` (`SplitOption`: `value?`, `label?`, `correct` og `from?`).
  - `FbTask` får varianten `TaskBase & { type: 'splitprocenter'; split: SplitQuestion }`, hvor `item` er `split.card`. `FbAnswer` får `choice?`, `grade` giver 1 eller 0, og `TaskType` og `TASK_TYPES` får 'splitprocenter'.
  - `Opgave` viser spørgsmålet som tekst og knapperne i `options`' rækkefølge (hele procent som "68 %" eller sidningen som "4-2") og kalder `onAnswer({ choice })`. Opgavens ⓘ hedder "Hjælp: Splitprocenter" (engelsk "Help: Split percentages").
  - `Facit` viser statusboksen, det rigtige tal med én decimal, en tabel med en række pr. sidning for antallet og huskereglen.
  - Selvvalgt har et valg, hvis navn begynder med "Splitprocenter", og ⓘ "Hjælp: Splitprocenter". "Næste opgave" giver den næste, og kun `practice` ændres.
  - Sessionen: en session, hvor der var introduceret 4 kombinationer før sessionen, har præcis én Splitprocenter-opgave i repetitionen eller niveauet. Svaret logges i `training`, og et forkert svar gør, at kortet kommer igen næste dag.
- **Valg, specen ikke afgør:**
  1. **Den daglige session:** én opgave i blandingen, ikke opvarmning. En opvarmning før de andre opgaver ville ændre sessionens begyndelse og fasernes tider og dermed eksisterende tests (første session begynder med "Ny kombination", og repetitionen begynder med det ældste forfaldne emne). Forslag til session 2: opgaven kommer kun, når der var introduceret mindst 4 kombinationer, før sessionen startede, og den står efter repetitionens emner eller som niveauets første opgave. Kortet er det ældste forfaldne i bunken, ellers det næste nye i tabellens rækkefølge. Så består de eksisterende sessionstests uændret.
  2. **Leitner-bunken:** kortene hedder `split:<n>:<sidning>`, og et forkert svar i sessionen gør, at kortet kommer igen næste dag (testet). Session 2 vælger, hvor kortene gemmes. Forslaget er et nyt valgfrit felt i `farvebehandling:v1`, så `items`, "emner til repetition" og eksportens resumé er uændrede. Selvvalgt flytter ingen kort; testen kræver, at Selvvalgt kun ændrer `practice`.
  3. **Selvvalgt:** der findes i dag ingen liste over opgavetyper, kun filtrene Teknik, Antal kort, Manglende honnører og Mål. Testen godtager både et nyt kort med knappen "Splitprocenter" og et valg i en ny gruppe. Forslaget er et kort under filtrene med ⓘ og en knap, der starter opgaverne direkte. Niveau 1–4 blandes tilfældigt, så alle fire kommer inden for 80 opgaver.
  4. **Spørgsmålene:** niveau 1–3 er specens. Niveau 4 lyder "Modparten har 4 kort i farven. Hvor ofte sidder kongen alene hos Vest?" med esset, kongen, damen eller knægten og Vest eller Øst. Chancen er `layoutChance(n, 1)` for alle antal; med 2 kort ude er det 1-1 delt på 2.
  5. **Niveau 1's forkerte tal:** to fra samme antal, når to af dem er mindst 5 procentpoint fra det rigtige, ellers så mange, der er, og mindst ét fra et nabo-antal (n ± 1). Resten kommer fra andre antal. Med 2 og 3 kort ude giver specens regel ikke tal nok: 2-0 ligger 4 procentpoint fra 1-1, og 3 kort har kun én anden sidning. "Mindst 5 procentpoint" måles på de viste hele procent, og de fire knapper viser forskellige tal.
  6. **Niveau 2 og 3:** niveau 2 viser alle sidningerne for antallet (2–5 knapper, 5 med 8 kort ude). Niveau 3 bruger 4–8 kort ude, fordi to sidninger med 2 eller 3 kort ude er 100 %; session 2 vælger hvilke to.
  7. **Svaret** er `{ choice }`. Et tryk på en knap kan svare direkte som i Find hullet eller vælge, så Svar svarer; testen godtager begge.
  8. **Huskereglen** står i facit på niveau 1 og 2 (testet); på niveau 3 og 4 vælger session 2. Den engelske ordlyd er "An odd number of cards most often splits as evenly as possible (3-2, 4-3). An even number most often splits unevenly (4-2, 5-3), except 2 cards.", og typens engelske navn er "Split percentages".
  9. **"Hvad det betyder ved bordet"** testes ikke, fordi specen kun giver et eksempel.
  10. **Vejledningen og `CLAUDE.md`** er ikke i specens accepttest og testes ikke. "Farvebehandlings guide" forstås som Farvebehandlings afsnit i den samlede vejledning (`GuideScreen.tsx`), hvor listen over opgavetyper også får Splitprocenter.
  11. **fam-4:** testen kræver præcis den tekst, der er tilbage, når sætningen er fjernet, og de to farveværdier. Ingen eksisterende test tjekker teksten.
  12. **Den eksisterende `ui/i18n.test.tsx`** gennemløber `TASK_TYPES` og kræver, at `possibleTypes` giver hver type for mindst én kombination, og at `makeTask` kan lave den. Med 'splitprocenter' i `TASK_TYPES` skal `possibleTypes` derfor give typen (fx for alle emner), og `makeTask('splitprocenter', item, goal, rng)` skal give en opgave. Motorens vægte (`WEIGHT` i `session.ts`) har ikke typen, så `chooseType` vælger den aldrig.
- **Spørgsmål, der skal besvares, før der bygges:**
  1. Niveau 1 spørger kun om den hyppigste eller næsthyppigste sidning. Seks af bunkens 23 kort (4-0, 5-0, 6-0, 7-0, 6-2 og 8-0) passer ikke til noget niveau, så de stilles aldrig og kommer aldrig igen. Forslag: et forfaldent kort stilles på niveau 1, også når sidningen er sjælden ("Hvor ofte sidder de 5-0?"), mens niveau 1 i Selvvalgt holder sig til de to hyppigste. Forslaget ændrer ikke testene.

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
