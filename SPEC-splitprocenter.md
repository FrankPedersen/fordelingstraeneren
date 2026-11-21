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
  4. **Spørgsmålene:** niveau 1–3 er specens. Niveau 4 lyder "Modparten har 4 kort i farven. Hvor ofte sidder kongen alene hos Vest?" med esset, kongen, damen eller knægten og Vest eller Øst. Chancen er `layoutChance(n, 1)`. ~~for alle antal; med 2 kort ude er det 1-1 delt på 2~~ Rettet efter Franks rettelse 18. nov. 2026 (se nedenfor): niveau 4 bruger kun 3–5 kort ude.
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
- **Tokenforbrug** (session 1, talt før den sidste commit): nye input 112, skrevet til cachen 291.892, læst fra cachen 9.809.368 og output 129.698, i alt 10.231.070.

### Franks svar, 18. nov. 2026

"Splitprocenter, session 2 af 3: Frank godkender forslaget: et forfaldent kort stilles på niveau 1, også når sidningen er sjælden. De 12 valg under Afklaret er godkendt. Fortsæt på grenen splitprocenter, og byg efter specen. Kør kun testene i src/farvebehandling/ og fagords- og bydeformstjekket. Skriv tokenforbruget under Afklaret, og stop."

### Session 2: byggeri (18. november 2026)

- **Status:** bygget. `tsc`, alle test i `src/farvebehandling/`, `src/fam4-usage.test.ts` og fagords- og bydeformstjekket er grønne, og stavekontrollen finder ingen ukendte ord. Accepttestene er uændrede. Hele suiten og `tjek-bred-layout.mjs` køres i session 3 sammen med skærmbillederne. **Venter på session 3; ikke flettet.**
- **Commits** på `splitprocenter`:
  - `8e30e20`: Franks svar;
  - `1a7da26`: tallene, opgaverne, typen, bunken og sessionen;
  - `f22dd62`: opgaven, facit, Selvvalgt og teksterne;
  - `07c7dda`: de tre rettede eksisterende tests (se nedenfor);
  - `2943db7`: vejledningen, `CLAUDE.md` og fam-4;
  - committen med dette afsnit.
- **Bygget:**
  - `training/split.ts` (genudsendt fra `tasks.ts`): `SPLIT_COUNTS`, `splitRows`, `SPLIT_CARDS`, `makeSplitTask` (niveau 1–4), `makeSplitCardTask` (et kort fra bunken på niveau 1) og `nextSplitCard`. Alle tal regnes af `splitChance` og `layoutChance`.
  - `tasks.ts`: varianten `splitprocenter` i `FbTask` med `split`, `FbAnswer.choice`, `grade` (1 eller 0), `makeTask` og `possibleTypes` (alle emner; motoren vælger den aldrig, fordi den ingen vægt har). `LineTask` er de andre typer, og `bestOption` tager kun dem.
  - `storage.ts`: `splitprocenter` i `TaskType` og `TASK_TYPES` og det valgfrie felt `splitCards` (bunken). Gamle data uden feltet indlæses uændret.
  - `session.ts`: én Splitprocenter-opgave pr. session som niveauets første opgave; svaret logges i `training` og flytter kortet i bunken.
  - `ui/Splitprocenter.tsx`: opgaven og facit. `Opgave.tsx` og `Facit.tsx` sender typen videre (de andre typers facit hedder nu `LineFacit` internt, uændret).
  - `Selvvalgt.tsx`: kortet Opgavetyper med knappen og ⓘ.
  - `texts.ts`: teksterne på dansk og engelsk.
  - `GuideScreen.tsx`: Splitprocenter på listen over opgavetyper og et punkt om opgaven.
  - `CLAUDE.md`: forsidens grupper står 2 × 2 fra 1000 px, og et afsnit om Splitprocenter under Beslutninger.
  - `design/tokens.json`: `fam-4.usage` uden "Også fokusringen (3px)."
- **Rettelser af tests** (eksisterende tests, ikke accepttestene; alle i `07c7dda`, så de kan vurderes for sig). Fejlen ligger i testene: de forudsætter de ni gamle typer, mens specen tilføjer en tiende og siger, at statistikken tæller den som de andre.
  - `src/farvebehandling/training/training.test.ts`, `rightAnswer` og `wrongAnswer`:
    - før: ingen gren for den nye type, så `default` læser `task.options`;
    - nu: `case 'splitprocenter'` svarer med `choice` (den rigtige eller en forkert knap);
    - hvorfor: varianten fra session 1's grænseflade har ingen `options`, så `tsc` fejlede, og sessionerne i testene med 4 introducerede kombinationer stiller nu Splitprocenter. Ingen påstand er ændret.
  - `src/farvebehandling/training/stats.test.ts`:
    - før: `expect(tasks).toHaveLength(9)`;
    - nu: `toHaveLength(10)`;
    - hvorfor: `taskStats` har en række pr. type i `TASK_TYPES`, og accepttest 4 kræver typen dér.
  - `src/farvebehandling/ui/FarvebehandlingScreen.test.tsx`, Statistik:
    - før: listen Opgavetype har 9 punkter;
    - nu: 10;
    - hvorfor: samme grund.
- **Kørt:**
  - `npx tsc`: grøn (2 s);
  - de nye accepttest (3 filer) undervejs: 18 tests, 17 grønne og fam-4 rød, før `tokens.json` var rettet (6 s);
  - `npx vitest run src/farvebehandling src/fam4-usage.test.ts src/sprog` (55 filer med de nye accepttest og `src/sprog/sprog.test.ts` og `bydeform.test.ts`): 372 tests, 370 grønne og 2 røde, de to med 9 opgavetyper (408 s);
  - efter rettelsen `stats.test.ts` og `FarvebehandlingScreen.test.tsx` igen: 19 tests, alle grønne (27 s);
  - `node scripts/sprogtjek.ts`: ingen ukendte ord (19 s).
- **Valg i byggeriet**, som specen og session 1 ikke afgør:
  1. **Sessionen:** opgaven er niveauets første opgave (fasen Niveau), lige efter repetitionen. Kombinationen, den stilles ved, er den senest introducerede; den vises ikke. Opgaven udelades, hvis niveauets tid er gået, før repetitionen slutter, eller hvis alle 23 kort ligger i bunken og intet er forfaldent.
  2. **Forfaldne og nye kort:** et nyt kort regnes som forfaldent fra start, som et nyt emne i kasse 1. Derfor stilles også det næste nye kort i tabellens rækkefølge på niveau 1, når sidningen er sjælden (fx 4-0 som tredje kort med 4 kort ude). Kortet gemmes først, når det er besvaret, og flyttes efter samme Leitner-regel som emnerne: hurtigt rigtigt én kasse op, langsomt bliver det, forkert kasse 1 og igen i morgen. Ugyldige kort i `splitCards` noteres som ugyldige `items`.
  3. **Niveau 3:** to sidninger ved siden af hinanden, fx 3-3 og 4-2 eller 5-1 og 6-0 (14 spørgsmål i alt), tilfældigt valgt; den jævneste står først. De forkerte er hver sidning for sig, antallets andre par og resten (100 % minus summen), derefter nabo-antallenes par.
  4. **Niveau 4's forkerte tal:** først de typiske fejl, nemlig det dobbelte (glemt hånden), sidningen selv, n gange (glemt de n kort) og det halve, derefter sidningernes tal. ~~Med 6–8 kort ude er det rigtige 0–1 % (fx 0,2 % med 8 kort ude), så nogle forkerte kommer fra sidningerne.~~ Rettet efter Franks rettelse 18. nov. 2026 (se nedenfor): niveau 4 bruger kun 3–5 kort ude. Med 3 og 4 kort ude er de typiske fejl nok; med 5 kort ude (rigtigt 2,8 %) ligger det dobbelte og det halve under 5 procentpoint fra, så det tredje forkerte er en af sidningernes tal for 5 kort. Nabo-antallenes og alle antals sidninger bruges ikke længere og er fjernet fra generatoren, og `makeTask` stiller niveau 4 med kombinationens antal kort ude kun, når det er 3–5 (`splitCounts`).
  5. **Facit:**
     - Huskereglen står på niveau 1–3. Niveau 4 viser i stedet regnestykket, fx "Sidningen 3-1 er 49,7 %. Det single kort kan være hvert af de 4 kort, og det kan sidde hos Vest eller Øst: 49,7 % / 8 = 6,2 %."
     - Tabellen har en række pr. sidning; de spurgte står med fed.
     - "I praksis" står på alle niveauer, fx "Med 5 kort ude og E K D: toppes farven, går den i 67,8 %.". Topkortene svarer til den jævneste sidning (E; E K; E K D; E K D B), og tallet har én decimal som resten af facit (specens eksempel siger 68 %). På engelsk står "playing for the drop", husets engelske ord.
  6. **Opgaven:** Farvebehandlings opgavelayout uden bord, uden ny CSS. Fra 1000 px står navnet med ⓘ og spørgsmålet i venstre spalte (hvor bordet står) og knapperne i højre; under 1000 px er det ét kort. Knapperne er som gætteintervallerne (`fb-intervals`), og et tryk svarer direkte, som i Find hullet.
  7. **Selvvalgt:** kortet "Opgavetyper" står efter Start-knappen med knappen "Splitprocenter · 23 sidninger" og ⓘ, som Trænings menu. "Skift filter" fører tilbage. Opgaven stilles ved en kombination med samme antal kort ude; den vises ikke.
  8. **Engelsk:** spørgsmålet på niveau 4 lyder "How often does West hold the singleton king?", og ⓘ og vejledningen kalder typen "Split percentages".
  9. **Vejledningen:** det nye punkt står lige efter listen over opgavetyper. Afsnittet Farvebehandling er lukket, når vejledningen åbnes (kun det første afsnit er åbent), så vejledningens billede i `tjek-bred-layout.mjs` bør være uændret. Selvvalgts filterside har det nye kort; tjekket sammenligner opgaven efter Start.
- **Spørgsmål til Frank:**
  1. Godkender du rettelserne af de tre eksisterende tests i `07c7dda`? De ændrer ingen påstand ud over antallet af opgavetyper (9 → 10).
- **Tokenforbrug** (session 2, talt før den sidste commit): nye input 142, skrevet til cachen 273.169, læst fra cachen 13.811.524 og output 116.477, i alt 14.201.312.

### Franks rettelse og godkendelse, 18. nov. 2026

"Splitprocenter: niveau 4 bruger kun 3–5 kort ude (honnøren alene er 0–1 % med 6–8 kort, og det lærer intet). Ret generatoren og testen, kør testene i src/farvebehandling/, og kør derefter hele suiten én gang. Er alt grønt, er Splitprocenter godkendt: flet, push, live-tjek, arkivér specen, og slet grenen."

Godkendelsen dækker også session 2's tre rettede eksisterende tests i `07c7dda` (spørgsmålet til Frank under session 2). Frank godkender hele grenen, når alt er grønt. Session 3 blev stoppet, før den nåede noget, fordi rettelsen kom; den afsluttende session laver rettelsen, kører testene og fletter.

### Afsluttende session (18. og 21. november 2026)

- **Status:** rettelsen af niveau 4 er bygget. `tsc`, testene i `src/farvebehandling/`, `tjek-bred-layout.mjs` og stavekontrollen er grønne, men **hele suiten er rød på tre af Modspils vagttests** (se nedenfor). **Ikke flettet;** grenen venter på Franks afgørelse om vagttestene. Sessionen blev afbrudt af 5-timersgrænsen 18. nov., før noget var committet, og genoptaget 21. nov.; `origin/main` var da stadig `a0f2128`.
- **Commits** på `splitprocenter`: `573a845` (Franks rettelse), `8416d3d` (testen, rød), `0b99de3` (generatoren og Afklaret) og committen med dette afsnit.
- **Rettelsen af niveau 4:**
  - **Testen** (`training/splitprocenter.test.ts`) har punktet "bruger kun 3–5 kort ude": fra et seed kommer kun 3, 4 og 5 kort ude (alle tre), `makeSplitTask(4, rng, n)` kaster med 2 og 6–8, og `makeTask('splitprocenter', …)` ved en kombination med 6 eller flere kort ude giver stadig en opgave, hvor niveau 4 har 3–5 kort ude. Testen med et bestemt antal kort ude bruger 3–5 på niveau 4. Før rettelsen: 14 tests, 13 grønne og 1 rød (niveau 4 gav 2–8 kort ude).
  - **Generatoren** (`training/split.ts`): `splitCounts(4)` er 3–5, og `makeTask` i `tasks.ts` stiller niveau 4 med kombinationens antal kort ude kun, når `splitCounts(level)` har det. De forkerte tal er de typiske fejl og derefter sidningernes tal for antallet; nabo-antallene og alle antal er fjernet. Efter rettelsen: `tsc` og de to Splitprocenter-filer, 18 af 18 grønne.
  - **Uændret:** teksterne. `splitSingleton` i `ui/texts.ts` har stadig en gren for 2 kort ude, som niveau 4 ikke længere bruger; den er ikke fjernet, fordi kun generatoren og testen af niveau 4 måtte ændres. "2–8 kort ude" i Selvvalgts ⓘ gælder typen som helhed og passer stadig.
- **Kørt** (hver for sig, én gang):
  - `npx tsc`: grøn (2 s);
  - `npx vitest run src/farvebehandling src/fam4-usage.test.ts`: 53 filer og 359 tests, alle grønne (368 s);
  - `npm test`: 142 filer og 1011 tests, 1006 grønne, 2 sprunget over og **3 røde** i 2 filer (480 s);
  - `node scripts/tjek-bred-layout.mjs`: 469 ok og 0 fejl, "Alt er grønt" (601 s). Pixelsammenligningen mod `v43-foer-modspil-skaerme` ved 999 og 390 px er "som før" på alle skærme, også Selvvalgt (opgaven efter Start);
  - `node scripts/sprogtjek.ts`: ingen ukendte ord (10 s).
- **De tre røde** fejler ikke på tid; de er deterministiske. Modspils vagttests fra trin 2 sammenligner arbejdsmappen med tagget `v43-foer-modspil-skaerme` og tillader kun Modspils egne ændringer:
  1. `src/modspil/intet-andet-trin2.test.ts`, "ingen eksisterende testfil er ændret …": `training/stats.test.ts`, `training/training.test.ts` og `ui/FarvebehandlingScreen.test.tsx`, dvs. de tre rettede tests i `07c7dda`, som Frank har godkendt;
  2. samme fil, "ingen fil uden for src/modspil/ er ændret …": de 17 filer, Splitprocenter ændrer (specen, `design/tokens.json`, `src/fam4-usage.test.ts` og filerne i `src/farvebehandling/`);
  3. `src/modspil/ui/forside.test.tsx`, "vejledningens eksisterende afsnit er uændrede …": linjen med opgavetyperne i `GuideScreen.tsx` har fået "og Splitprocenter".

  Testene springes over, hvor tagget mangler, så GitHub Actions ville blive grøn, men lokalt fejler de ved enhver ændring uden for `src/modspil/` efter Modspil. Fejlen ligger i vagternes udstrækning og ikke i Splitprocenter. At rette dem ligger uden for denne sessions afgrænsning (kun generatoren og testen af niveau 4), og Franks godkendelse kræver, at alt er grønt, så der er ikke flettet, pushet eller arkiveret, og grenen findes stadig.
- **Forslag til Frank:** vagterne fastfryses ved Modspils egen ændring, så de tre tests sammenligner tagget med `691d715` (Modspils fletning og arkivering på `main`) i stedet for med arbejdsmappen (`git diff v43-foer-modspil-skaerme 691d715`). De tjekker så stadig, at trin 2 kun ændrede det tilladte, men stopper ikke senere spor. Rettelsen ligger i `src/modspil/intet-andet-trin2.test.ts` og `src/modspil/ui/forside.test.tsx` og kan laves på grenen `splitprocenter` som en commit for sig. Derefter køres hele suiten igen, og der flettes.
- **Skærmbilleder** fra den lokale bygning (`vite build` og `vite preview`, Chrome uden vindue). Opgaven er på niveau 4: damen alene hos Øst med 4 kort ude, med knapperne 6, 12, 25 og 50 %. Facit viser Rigtigt med 6,2 %, tabellen med 3-1, 2-2 og 4-0 og regnestykket 49,7 % / 8 = 6,2 %:
  - `C:\Users\frank\Kontraktbridge\skaermbilleder\splitprocenter\opgave-390.png`
  - `C:\Users\frank\Kontraktbridge\skaermbilleder\splitprocenter\opgave-1280.png`
  - `C:\Users\frank\Kontraktbridge\skaermbilleder\splitprocenter\facit-390.png`
  - `C:\Users\frank\Kontraktbridge\skaermbilleder\splitprocenter\facit-1280.png`

  Scriptet tjekkede samtidig følgende (29 ok og 0 fejl): ⓘ "Hjælp: Splitprocenter" står i Selvvalgt, facit har tallet med én decimal og hele tabellen, niveau 4 har 3–5 kort ude, og der er ingen vandret scroll ved 390 px.

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
