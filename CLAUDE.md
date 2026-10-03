# Fordelingstræneren

Bridge-træningsapp til hånd-fordelinger. Appen er færdig og i brug på https://frankpedersen.github.io/fordelingstraeneren/ (repo: `FrankPedersen/fordelingstraeneren`).

**[SPEC.md](SPEC.md) beskriver, hvad appen gør. Læs de relevante afsnit før en ændring**, og følg dem frem for egne antagelser. Ved uenighed mellem denne fil og SPEC.md vinder SPEC.md.

## Vedligeholdelse

- En ændring er færdig, når `npm test` (tsc og derefter Vitest) er grøn og der er committet. Et push til `main` udgiver automatisk: `.github/workflows/pages.yml` tester, bygger med `--base=/fordelingstraeneren/` og lægger appen på GitHub Pages.
- Skriv eller ret testene først, når SPEC.md giver facitværdier.
- Ændrer du appens adfærd, så opdatér SPEC.md i samme commit. Implementeringsvalg, som SPEC.md ikke beskriver, står under "Beslutninger" nedenfor.
- Åbne punkter i SPEC.md (fx oplysningsdoblingens "højst 2 i deres farve") er implementeret som beskrevet og markeret i `note`-felterne i `src/system/dk-2over1.json`; spørg, før du ændrer dem.
- Brugerens data ligger i browseren og skal kunne læses efter hver opdatering: nye felter er valgfrie, og en ny skemaversion får en migrering i `src/engine/storage.ts`.
- Lokalt: `npm run dev`. Ikonerne tegnes af `npm run icons`.

## Ufravigelige regler

- Stack: React + Vite + TypeScript, statisk side på GitHub Pages, PWA (offline). Tests i Vitest. Ingen server, intet login, ingen eksterne API'er.
- `src/engine/` må ikke importere fra `src/domain/` eller `src/system/` (håndhæves af `src/architecture.test.ts`).
- Sandsynligheder beregnes i koden med BigInt-tællere; intet tal tastes ind. Hænder filtreres eller vægtes aldrig i øvelser, der viser hyppigheder.
- Kortgiver: Fisher–Yates over 52 kort med seedbar PRNG (mulberry32). Seed 1 er låst i en regressionstest, så gemte opgaver kan genskabes.
- Meldetolkning ligger kun i `src/system/dk-2over1.json` (standard dansk 2/1).
- Al tilstand i localStorage under nøglen `fordelingstraener:v1`; skemaet står i SPEC.md under "Data og lagring". Datoer i lokal tid, dagen skifter kl. 04.
- Mobil-først: én hånd, store trykflader, intet der kræver hover.

## Sprog og notation

- Al tekst i appen er på dansk.
- Bridgeterminologi: "bordet" (ikke blindemand), "kipning" (ikke snit), "forbindelser" (ikke broer), "slutspil"/"endplay" (ikke indspil).
- Mønster: faldende med bindestreg (5-4-2-2). Konkret fordeling: ♠♥♦♣ med lighedstegn (2=5=2=4). ♥ og ♦ står med rødt, også i tekst (`src/ui/SuitText.tsx`).
- Familiefarver: blå (4), grøn (5), rav (6), violet (7+). Aldrig rød eller sort, og farve står aldrig alene uden tekst eller tal.

## Kort over koden

- `src/engine/`: Leitner, streak med joker, XP, sessionshjælpere, datoer, PRNG og lagring med eksport/import.
- `src/domain/`: de 39 mønstre, kombinatorik, kortgiver, Fuldfør-sandsynligheder, ≈-reglen og sudoku-løseren.
- `src/system/`: systemfilen, fortolkeren (`interpreter.ts`) og den forenklede budgivning (`auction.ts`).
- `src/memory/`: standardbilleder, paladsets rum og stationer, støtteniveauerne og deres visninger.
- `src/modes/`: én mappe pr. øvelse med opgavegenerator, scoring og visning (`higherLower`, `complete`, `palace`, `read`, `estimate`, `sudoku`).
- `src/ui/`: fælles komponenter (Skyline, Mønstertastatur, Klubaften, Gitter4x4, LineChart, SuitText) og `styles.css`.
- `src/app/`: sessionsmotoren (`session.ts`), progression, album, kurver og skærmene. Den binder motor, domæne og øvelser sammen.
- Testene ligger ved siden af koden (`*.test.ts`). `src/app/App.test.tsx` kører hele flows i jsdom.

## Beslutninger

Valg, hvor SPEC.md er åben. Spørg, før du ændrer dem.

**Mønstre og sessionen**
- Delt rang er "1 + antal strengt hyppigere": 7-5-1-0 og 8-3-2-0 deler 23, næste er 25, sidste er 39.
- Fasernes tider: repetition højst 60 s, niveauøvelse til 150 s, lynrunde 60 s. 13-sudokuen springes over, hvis lynrunden slutter efter 285 s. Timeren er blød.
- Rigtige svar flytter kun forfaldne emner op; et forkert svar sender altid i kasse 1. Halv score i Fuldfør giver 5 XP, og emnet bliver stående som ved rigtigt men langsomt.
- Lynrunden skriver ikke i loggen og flytter kun emner ved fejl (parreglen). Den skifter mellem højere/lavere og Lynaflæsning efter dagens paritet (dage siden 2026-01-01).
- Sværheden tilpasses først efter 10 svar. Fuldfør: let = de to længste farver, normal = to tilfældige, svær = én farve. Et nyt mønster testes straks med lette opgaver i Fuldfør, Paladsvandring og højere/lavere; aflæsningen venter til repetitionen.
- Combo ganges på svarets XP; indsatsen lægges til bagefter.
- Introduktionsdagen udledes af emnernes ældste logpost, da skemaet ikke har en dato.
- Oplåsning er varig: niveauet er den højeste grad med et introduceret mønster (eller den næste, når den er lært).
- Nye færdigheder giver allerede introducerede mønstre emner ved sessionsstart (`ensureItems`).

**Husketeknikker**
- Kun de 13 mønstre fra tabellen har standardbillede; de øvrige får kun brugerens eget.
- Rang-emner findes for station 1–13 og de episke på Loftet (mønster → rum). Legendariske har intet rang-emne.
- Paladsvandring: let = mønster → station, svær = station → mønster (tastes og afleveres straks), normal = begge veje.
- Præsentationen på støtteniveau 3 vises højst én gang pr. mønster pr. session; introduktionen tæller med. Ledetråden er gratis på niveau 3 og koster 5 XP på niveau 2. Lynrunden kører uden støtte.
- Efter svaret: niveau 3–2 viser station, billede, scene og skyline; niveau 1 kun skyline; niveau 0 kun rigtigt/forkert og facit.

**Lynaflæsning, album og Klubaften**
- Lynrunden bruger helt tilfældige hænder (Syds hånd fra `deal`), og de registreres i albummet. Forfaldne aflæsningsemner i repetitionen får en jævnt tilfældig hånd med mønstret; den registreres ikke.
- t gemmes i `readMs` og tilpasses kun ved visning i t ms.
- Sjældne fund = episke og legendariske mønstre. Legendarisk oplåsning kræver alle tre svar rigtige i ét forsøg.

**Meldetolkning og 13-sudoku**
- Regelformatet har to tilføjelser: `hcp` kan være flere intervaller (8–15 eller 17+), og `stopper: true` kræver hold i åbnerens farve (kun meldegiveren bruger det).
- Oplysningsdobling over 1♥/1♠ = præcis 4 i den anden major og højst 2 i deres farve, da der kun er én umeldt major.
- Spilhændelser: "kan ikke bekende" for længder op til 3, "følger n gange" for n ≥ 2 og højst ét udspil af 4. højeste (Vest, da Syd spiller). Normalt vælges den mest oplysende hændelse, til ugens boss den mindst oplysende.
- Grundpoint 10. Ugens boss (hver 7. session) fordobler både gevinst og straf. "Vis løsningen" giver 0 point minus forkerte låse.
- Ugens status (ugens tal og klubaftenen) vises på status-skærmen i bossens session.

**Brugerflade**
- Tasten "10+" er den lange farve; dens længde er 13 minus de tre andre.
- Kurverne er små multipler med én serie pr. diagram i magenta (`#d55181`, valideret mod begge flader), så familiefarverne ikke får en ny betydning. Træfsikkerhed pr. grad tæller ikke lynrunden med.
- En ny version vises som en knap på forsiden; appen genindlæser aldrig midt i en session.

## Farvebehandling

Et nyt, selvstændigt spor på grenen `farvebehandling` (den nuværende app er tagget `v1-fordeling`). **[SPEC-farvebehandling.md](SPEC-farvebehandling.md) beskriver sporet.** Fordelingssporets adfærd, data og udseende må ikke ændres, SPEC.md røres ikke, og eksisterende kode må kun berøres de steder, specens tabel nævner. Kræver noget alligevel en ændring i eksisterende kode, så spørg først.

**Kort over koden** (`src/farvebehandling/`)
- `model/`: kort (E K D B 10 i visningen), sidningsberegning med ledige pladser, hyppighed, normalt modspil (kun til Spil den selv) og gætteintervaller.
- `solver/`: spiltræet (`game.ts`), løseren med optimalt modspil (`cfr.ts`), linjeformatet (`lines.ts`) og det samlede API (`solve.ts`).
- `source/bridgehands.ts`: læser bridgehands.com's tabeller, sorterer fejl fra og omsætter x til konkrete kort.
- `precompute.ts`: hyppighed, opgavebank, løsninger og valideringsrapport som rene funktioner.
- `content/`: kildens cases, `damen-mangler-hyppighed.csv`, `suit-combinations.json`, `solutions.json`, `techniques.json` og `validering-damen-mangler.md`. Alt undtagen `techniques.json` genereres.
- Scripts: Node 24 kører TypeScript direkte, og kildekoden indlæses med Vites `runnerImport`, så `package.json` er uændret.
  - `node scripts/bridgehands.ts` henter siden "damen mangler".
  - `node scripts/solve.ts` regner alt i `content/` (ca. 35 min).
- Tokens: `design/tokens.json` holdes i takt med `src/ui/styles.css` af `src/tokens.test.ts`. Designsystemet i Claude Design er bygget på filen.

**Beslutninger** (spørg, før du ændrer dem)
- **Optimalt modspil:** modspillet kender alle kort, også hinandens, og blander sine valg; spilføreren ser kun de spillede kort. Spillet løses med CFR+. Resultatet er en ren linjes eksakte garanti (BigInt): modspillet vælger i hver sidning det værste. Linjen er certificeret, når garantien ligger inden for 0,002 procentpoint af CFR's øvre grænse.
- **Blandet spil:** nogle delspil kræver, at spilføreren blander, fx når en honnør spilles ud, og modspilleren selv vælger, om den skal dækkes. Løseren stopper, når grænserne er mødtes (0,01 procentpoint) og den bedste rene linje ligger klart under. Værdien er så midten af grænserne, og linjen er ikke certificeret.
- **Abstraktion:** modpartens kort mellem to af spilførerens kort er ligeværdige, så kun antallet pr. hul tæller. Det ændrer ikke værdien, og begrænset valg følger af tællingen.
- **Forbindelser og udspil:** forbindelserne er ubegrænsede. Spilføreren spiller altid ud fra den hånd, han vil, og modspillet spiller aldrig farven.
- **Alternative linjer:** hvert første udspil er et delspil; dets bedste linje er alternativet.
- **Linjer:**
  - "low" i `ifSecondPlays` betyder et kort under B.
  - En `goto` til antal trin + 1 betyder, at linjen slutter.
  - Faldne modpartskort afgøres ud fra intervallerne for de spillede kort.
  - **Kendt sidning:** kan en modspiller ikke bekende, slutter linjen med det samme. Reglen stod i specens version 2 og er nødvendig for linje B's 100 %. Den skal bekræftes i specen.
- **x i kilden:** spilførerens x'er er de laveste kort. Valideringen viser også fortolkningen "høj".
- **Brugbare cases:** sorteret fra er "…", kortantal, der ikke passer med fordelingen, forskelligt antal mål og procenter og dubletter. Det giver 85 af 100 på siden "damen mangler".
- **Hyppighed:** navngivne små kort, der er de allerlaveste, regnes som x (E B 3 2 / K 5 4 = E B x x / K x x).
- **Gætteintervaller:** afgøres ud fra chancen afrundet til én decimal som i visningen.

**Status**
- [x] Trin 2: Tokens (`design/tokens.json`) og designsystemet i Claude Design.
- [x] Trin 1: Løser og model, startbank og validering for siden "damen mangler". Løsertestene tager 15–20 s.
