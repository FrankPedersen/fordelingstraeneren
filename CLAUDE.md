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
- `solver/`: spiltræet (`game.ts`), løseren med optimalt modspil (`cfr.ts`), naturlige valg mellem lige gode træk (`natural.ts`), linjerne på dansk (`describe.ts`), linjeformatet (`lines.ts`), det samlede API (`solve.ts`), resultaterne i datafilernes form og forespørgslerne fra appen (`results.ts`), løseren i en Web Worker (`solver.worker.ts`, `client.ts`) og Hvad nu? (`whatnow.ts`; datatyperne ligger i `model/whatnow.ts`, så appen ikke henter løseren).
- `source/bridgehands.ts`: læser bridgehands.com's tabeller (siderne 0–9), tolker kildens notation, sorterer fejl fra og omsætter x til konkrete kort.
- `precompute.ts`: hyppighed, opgavebank, løsninger (med Hvad nu?), appens kompakte data, valideringsrapport og linjeteksterne til godkendelse som rene funktioner.
- `analysis.ts`: data til analysevinduet (banken fra appens filer, linjerne, sandsynlighedsbåndet, situationen bag en kombination og kortvælgerens opslag), klubaftenens 100 hyppigste (`clubEvening`) og Hold eller pars to linjer (`pairsLines`). `testBank.ts` giver testene hele banken.
- `play/`: Spil den selv (kortgiveren, stik med normalt modspil og sammenligningen med løserens linjer).
- `training/`: opgavetyperne og pointtabellen (`tasks.ts`), progressionen (`progression.ts`), sessionsmotoren (`session.ts`), paladset (`palace.ts`), Selvvalgts filtre (`practice.ts`) og statistikken (`stats.ts`).
- `techniques.ts`: forslaget til teknik pr. kombination og listen til godkendelse. `whatnowReport.ts`: listen over Hvad nu?-situationerne.
- `ui/`: skærmen (`FarvebehandlingScreen.tsx`, indlæses dovent fra `src/app/App.tsx`) med fanerne `Træning.tsx` (forside, session og status), `Selvvalgt.tsx` og `Analysevindue.tsx`; `Opgave.tsx`, `Facit.tsx`, `SpilSelv.tsx`, `Linjeeditor.tsx`, `Introduktion.tsx`, `Rumkort.tsx`, `Palads.tsx`, `Klubaften.tsx`, `Statistik.tsx` og `Data.tsx` (eksport, import og fast lagring); komponenterne Bridgebord, Kortvælger, Linjekort, Resultatkort og Sandsynlighedsbånd, al ordlyd i `texts.ts`, tokens i `tokens.css` og resten i `farvebehandling.css`.
- `storage.ts`: skemaet for `farvebehandling:v1` (godkendt; valgfrie felter `training` og `lastExport`) med indlæsning, kopi af ulæselige data, gem, eksport, import, fast lagring og påmindelsen om eksport.
- `content/`: kildens sider `bridgehands-side-N.json` (N = 0–9), `damen-mangler-hyppighed.csv` (side 2, specens accepttest), `hyppighed.csv` (alle sider), `suit-combinations.json`, `solutions.json`, `hvad-nu.json`, appens data `app/side-N.json`, `validering-side-N.md`, `linjer-side-N.md`, `teknikker.md`, `hvad-nu.md`, `kildefejl.json` (målene, der fjernes som fejl i kilden) og `techniques.json`. Alt undtagen `techniques.json` genereres.
- Scripts: Node 24 kører TypeScript direkte, og kildekoden indlæses med Vites `runnerImport`, så `package.json` er uændret.
  - `node scripts/bridgehands.ts` henter siderne 0–9 (eller de sider, der står som argumenter).
  - `node scripts/solve.ts` løser det, der mangler i mellemlageret, og samler alle filer i `content/`. Med `--shard i/n` løser flere processer samtidig (10 processer tager ca. 1 time for alle sider); `--assemble` samler uden at løse. Mellemlageret har én fil pr. case i `FB_SOLVE_CACHE` (ellers `<tmp>/fordelingstraeneren-solve`). Ændres løseren, tælles `LINES_VERSION` op; ændres kun Hvad nu?, tælles `WHAT_NOW_VERSION` op; ændres kun Hold eller par (`pairsFor`), tælles `PAIRS_VERSION` op (10 processer tager ca. 11 min).
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
  - **Kendt sidning:** kan en modspiller ikke bekende, slutter linjen med det samme. Reglen er nødvendig for linje B's 100 % og er godkendt (spec 3.1).
- **x i kilden:** spilførerens x'er er de laveste kort. Valideringen viser også fortolkningen "høj".
- **Brugbare cases:** sorteret fra er "…", kortantal, der ikke passer med fordelingen, forskelligt antal mål og procenter, mål over antal runder, et kort to gange, flere x'er end kort under det laveste navngivne kort (hyppigheden kan ikke regnes) og dubletter. Det giver 85 af 100 på siden "damen mangler" og 660 af 740 på siderne 0–9; efter fejlene i kilden er der 657.
- **Afsnit og sider:** siderne 3–6 har to afsnit, der hver nummererer fra 1; en case i andet afsnit hedder fx "2.12". Har to cases de samme konkrete kort (fx Q 10 9 / x x på side 7 og 8, eller K D 8 x x x og K D x x x x), bliver den, hvis side passer med modpartens honnørpoint, ellers den hyppigste. Cases på en side, der ikke passer med honnørpointene (fx E K 10 x / x x x på "damen mangler"), bruges som de er; Analyse filtrerer efter modpartens faktiske honnørpoint.
- **Fejl i kilden:** årsagen til hver afvigelse og reglen for at fjerne et mål står i specen (Validering). Scriptet løser alle kildens mål og skriver listen over fjernede mål i `content/kildefejl.json`; `applySourceErrors` fjerner dem, og rangen regnes igen, så appens test kan regne banken og `hyppighed.csv` ud fra kilden og listen. Rapporterne viser stadig alle kildens mål. Et gemt emne til et fjernet mål springes over (`inBank` tjekker også målet).
- **Hyppighed i appen:** regnes i scriptet ud fra kildens holding med x (som rangen) og gemmes i appens data, fordi de konkrete kort ikke kan give den tilbage (E D B x x x x / 8 7 6 betyder, at modparten har 10 og 9).
- **Kildens notation:** "T/9" er ét kort, der kan være 10'eren eller 9'eren; det første ledige kort bruges, og casen markeres som usikker. "5_3" læses som 5-3, "X" som x og "-" som renonce.
- **Banken:** alle brugbare cases fra siderne 0–9 i hyppighedsorden på tværs af siderne (Franks valg, spec 3.2). Appen henter dem som én fil pr. side (`content/app/side-N.json`) uden eksakte tællere, øvre grænser og linjeformat, så hver fil er under PWA'ens grænse på 2 MB for offline-filer, og `vite.config.ts` er uændret.
- **Situationen bag en kombination:** den højeste honnør, modparten har, og vores honnører over den, fx "Es og konge uden damen" eller "Uden esset".
- **Hyppighed:** navngivne små kort, der er de allerlaveste, regnes som x (E B 3 2 / K 5 4 = E B x x / K x x).
- **Gætteintervaller:** afgøres ud fra chancen afrundet til én decimal som i visningen.
- **Naturlige valg:** er flere træk lige gode, vælger løseren tilfældigt. Bagefter skiftes et træk kun ud, når det nye er mindst lige så godt i alle sidninger, så garantien aldrig falder. 3. hånd tager en honnør fra 2. hånd med det billigste kort, der slår den, og lægger ellers lavt. Udspil foretrækkes som sikker vinder, dernæst som lille kort.
- **Linjerne på dansk:** hovedvejen er den, man selv ville fortælle: 2. hånd lægger lavt, og 4. hånd stikker så billigt som muligt. Beskrivelsen stopper, når resultatet er afgjort i alle sidninger. "Slå"-trin i træk slås sammen. Linjeformatet får trinene frem til det første sted, hvor næste udspil afhænger af, hvad modspillet lagde.
- **Sandsynlighedsbåndet:** et hul, hvor alle modpartens kort er 10 eller højere, vises med de konkrete kort; ellers er kortene små og vises som x. Felterne står efter fordeling (Vests antal kort) eller honnørplacering.
- **Kortvælgeren:** en kombination findes i banken ud fra strukturen: hvilken hånd hvert af spilførerens kort sidder i, og hvor mange modpartskort der ligger imellem.
- **Komponentreglen:** farvebehandlingens komponenter og `farvebehandling.css` bruger kun tokens, 0, 1px og procenter. Spalterne laves med flexbox og `var(--column)` i stedet for `fr` og media queries.
- **Teknik pr. kombination:** efter reglerne i `techniques.ts`: begrænset valg, når en af flere ligeværdige honnører falder i første runde og kipning så er klart bedst; sikkerhedsspil, når et lavere mål kræver en anden linje end flest stik; ellers hovedmålets linjer (er flere lige gode, vælges den mest lærerige: dobbelt kipning med modpartskort i to huller, enkelt kipning, spil mod honnør, sikkerhedsspil, fald). Fald eller kip gælder kipning mod damen eller knægten. Listen (`content/teknikker.md`) er færdiggjort efter Franks ønske.
- **Sessionen** følger fordelingssporets motor uden at bruge den: repetition til 60 s, niveau til 210 s regnet fra start, lynrunde i 60 s og status. En ny kombination præsenteres med problem, hyppighed, rum og huskeregel, men uden linjer, og øves straks i hvert mål; derefter øves de fire senest introducerede kombinationer. Lynrunden skriver ikke i loggen og flytter kun emner ved fejl. Combo: rigtigt giver +1, halvt og forkert nulstiller. Sessionen tæller i streaken, når status vises.
- **Opgavevalg:** motoren vælger vægtet blandt de mulige typer (Vælg linjen 4; Chancen, Linje mod linje, Nyt mål, Hvad nu?, Find hullet og Hold eller par 2; Med optælling og Spil den selv 1), højst to af samme type i træk.
- **Svarmuligheder:** Vælg linjen viser den bedste linje og op til tre, der er mere end 0,5 procentpoint dårligere; lige gode linjer udelades, så der er ét rigtigt svar. Nyt mål vælger helst et tidligere mål med en anden bedste linje. Find hullet viser den hyppigste sidning, hvor linjen taber, og op til tre (mindst to), hvor den vinder. Med optælling regnes linjernes chance om med de ledige pladser; resultatet pr. sidning er linjens eget.
- **Selvvalgt:** alle kombinationer i banken kan vælges, gættet er valgfrit (uden gæt bedømmes linjen alene), og loggen gemmer de seneste 500 svar. Alle seks teknikker står i filtret, også med 0.
- **Paladset:** stationen oprettes ved introduktionen med teknik og nummer, så paladset bevarer sin orden, selv om banken senere får en anden teknik. Rum uden stationer er lukkede.
- **Facit:** svaret, bordet, båndet og linjerne; "Hvorfor" viser rummet med huskeregel og billede, alle sidninger og resultatkortet. XP vises kun i Træning.
- **Spil den selv:** kortene gives efter sidningernes chance, og kortene i et hul fordeles tilfældigt. Spilføreren spiller ud fra den hånd, han vil, og lægger 3. håndens kort; modspillet lægger efter normalt modspil og vælger tilfældigt mellem ligeværdige kort. Som opgave (type 7) bedømmes beslutningen, ikke udfaldet: fulgte stikkene trinene i en af de bedste linjer (inden for 0,5 procentpoint) i linjeformatet, hvor et ligeværdigt kort tæller som samme kort? Efter sidste trin eller en renonce er alt tilladt; uden trin sammenlignes første udspil. Appens data har derfor linjeformatet med. Spillet findes også som knap i analysevinduet og i facit, og sidningen lyser op i båndet bagefter.
- **Fase 2:** løseren kører i browseren i en Web Worker på forespørgsel (Franks valg); uden Workers (fx i testene) regnes i samme tråd, og løseren hentes dovent. En kombination uden for banken regnes fra kortvælgeren: først flest stik i gennemsnit, så foreslås de mål, hvor chancen med den linje ligger mellem 1 % og 99 %; det højeste med mindst 25 % regnes straks, de andre, når man trykker på dem. Resultaterne gemmes ikke. Egne linjer bygges i linjeeditoren med op til fire trin (udspil og 3. håndens kort; grene kan ikke laves i editoren), tjekkes og regnes af løseren og gemmes i `ownLines`; chancen regnes, når linjen vises.
- **Klubaften:** felterne bruger appens farver uden nye tokens: den valgte tekniks felter bliver mørke, de andre får dæmpet tekst med fuld kontrast. Åbnes en kombination fra klubaftenen, starter Analyse med den; vælges fanen selv, starter den med den hyppigste.
- **Hold eller par:** parturneringens linje er den gemte linje med flest stik; dens chance for målet regnes ud fra stik pr. sidning. Målets bedste linje regnes som parturnering med løseren (`pairsFor`): dens trin, derefter flest stik. 106 mål i 103 kombinationer har opgaven. Linjerne vises i tilfældig rækkefølge, og lyder de ens på dansk, stilles opgaven ikke.
- **Statistik:** Træningens svar logges i det valgfrie felt `training` (de seneste 2000), fordi Leitner-loggen i `engine/` kun har rigtigt/forkert og ingen opgavetype. Svar fra før loggen fandtes, tæller derfor ikke med. Seneste 30 dage regnes med i dag.
- **Fast lagring:** appen beder om den ved første gem i hver indlæsning (Chrome svarer uden spørgsmål, Firefox kan spørge). Påmindelsen om eksport tæller fra den seneste eksport eller den første aktivitet; en import tæller ikke som eksport.
- **Hvad nu?:** første runde følger løserens bedste linje med normalt modspil (2. hånd lavt, men dækker en udspillet honnør; 4. hånd vinder billigst, hvis makker ikke vinder; ligeværdige kort tilfældigt), så begrænset valg giver lærebogens tal (kipning 64,7 % mod fald 35,3 %). Med optimalt modspil også i første runde flytter modspillets ligegyldige valg (fx damen fra D x, når alt alligevel vinder) chancerne vilkårligt. Hver fortsættelse løses derefter med optimalt modspil og sidningernes chance efter første runde (løseren tager vægte pr. sidning). En situation kommer med, når en honnør falder eller en modspiller ikke kan bekende, den sker i mindst 1 % af spillene, og en rimelig fortsættelse (mindst en tredjedel af den bedstes chance) er mere end 0,5 procentpoint dårligere; højst to pr. emne. Opgaven viser bordet efter første runde, den bedste og op til tre rimelige fortsættelser og et gæt af chancen nu. I første trin skrives "Lille fra begge hænder" med, hvem der spiller ud.

**Status**
- [x] Trin 2: Tokens (`design/tokens.json`) og designsystemet i Claude Design.
- [x] Trin 1: Løser og model, startbank og validering for siden "damen mangler". Løsertestene tager 15–20 s.
- [x] Trin 3: Analyse fase 1 med banken, kortvælgeren, linjerne på dansk, sandsynlighedsbåndet og sidningerne. Linjeteksterne er godkendt.
- [x] Trin 4: Træning (session, scoring, Leitner, streak og XP), Selvvalgt, paladset og egen eksport/import med opgavetype 1–6 og 8. Teknik pr. kombination (`content/teknikker.md`) og Hvad nu?-situationerne (`content/hvad-nu.md`) er gennemgået og færdiggjort.
- [x] Banken dækker alle honnørkort: siderne 0–9 med 660 kombinationer. Linjeteksterne for de nye sider (`content/linjer-side-N.md`) følger den godkendte stil og er gennemgået. Udgivet på `main`.
- [x] Trin 5: Spil den selv med normalt modspil, også som opgavetype 7.
- [x] Trin 6: Analyse fase 2 med løseren i browseren på forespørgsel og egne linjer.
- [x] Klubaften: de 100 hyppigste kombinationer som 10 × 10 felter med hyppighed, tekniknapper og liste (Franks ønske).
- [x] Hold eller par (opgavetype 9), statistik pr. teknik og opgavetype med forslag i Selvvalgt, fast lagring og påmindelse om eksport (Franks ønske).
- [x] Fejl i kilden: årsag til hver afvigelse i valideringsrapporterne; 14 mål uden beslutning fjernet, 657 kombinationer (Franks ønske).
