# SPEC-forbindelser

20. oktober 2026 · Frank

Analyse i farvebehandling får begrænsede forbindelser. I dag spiller spilføreren altid ud fra den hånd, han vil. Fremover kan situationen sige, hvem der er inde, og hvor mange indgange Nord og Syd har i de andre farver. Så kan en blokeret farve eller en kipning, der skal gentages, regnes rigtigt: en linje, der kræver flere indgange, end der er, taber.

Forbindelserne bliver en del af spillets tilstand i `solver/game.ts`. Løseren (`cfr.ts`), certificeringen og tolerancerne ændres ikke. Uden begrænsning er spillet præcis som i dag.

Forudsætning: SPEC-notation-sidninger.md og SPEC-neutral-kilde.md er udgivet (20. oktober 2026), så grenen laves fra den nuværende `main`.

## Afgrænsning

Før arbejdet starter:

1. Commit og tag den nuværende app, fx `v11-foer-forbindelser`.
2. Arbejd på grenen `forbindelser`, og flet først ind efter godkendelse.
3. Kør alle eksisterende tests før og efter. De skal bestå uændret.
4. Kør regressionstesten mod bogen (`node scripts/bog-regression.ts`, ca. 25 min), før grenen flettes ind, fordi løserens spil ændres.

| Sted | Må ske | Må ikke ske |
| --- | --- | --- |
| `solver/game.ts` | `GameOptions.entries`; hvem der er inde og indgangene i tilstanden; udspil kun fra en hånd, der kan nås; genvejen i `terminal` kun uden begrænsning | ændre spillet uden begrænsning |
| `solver/cfr.ts`, `solver/solve.ts` | intet | ændre løsningen, certificeringen eller tolerancerne |
| `solver/describe.ts`, `lineText.ts` | sætningen for et udspil, der bruger en indgang, på dansk og engelsk | ændre de øvrige skabeloner |
| `solver/lines.ts` (`validateLine`) | afvise en egen linje, der spiller ud fra en hånd uden indgang | ændre linjeformatet |
| `model/situation.ts` | `Situation` får `entries` og `lead`; `isPossible`, `canStep`, `isStandard` og `gameOptionsFor` tager dem med | ændre kendte kort og hp-grænser |
| `solver/results.ts`, `solver/client.ts` | `situation` i `SolveRequest` bærer forbindelserne | ændre svarene uden begrænsning |
| `ui/Situationspanel.tsx`, `ui/Analysevindue.tsx` | felterne for forbindelser, chips og forudsætningslinjen | ændre kendte kort, hp-grænser, import eller valg af linjer |
| `play/`, `ui/SpilSelv.tsx` | Spil den selv åbnet fra Analyse følger forbindelserne | ændre det normale modspil |
| `ui/texts.ts` | nye tekster på dansk og engelsk med ⓘ | — |
| Træning, Selvvalgt, facit, appens data, `scripts/solve.ts` | intet; banken er og bliver regnet med ubegrænsede forbindelser | alt |
| Lagring, tokens | intet | nye felter, nye tokens |
| `SPEC-farvebehandling.md`, `CLAUDE.md` | opdateres i samme commit som adfærden; beslutningen "forbindelserne er ubegrænsede" gælder fortsat for banken | — |

Kræver noget alligevel en ændring ud over tabellen, skal Claude Code stoppe og spørge.

Besked til Claude Code:

> Læs CLAUDE.md, SPEC-farvebehandling.md, SPEC-analyse-situation.md og SPEC-forbindelser.md. Byg leverancetrin 1 på grenen `forbindelser`, skriv accepttestene først, og stop efter trinnet, så jeg kan godkende. Løseren og spillet uden begrænsede forbindelser må ikke ændres. Mål tiden på de tungeste kombinationer, før trin 2 bygges.

## Reglerne

| Begreb | Regel |
| --- | --- |
| Indgange | Antal sikre indgange til Nord og til Syd i de andre farver: 0–5 eller ubegrænset. Standard er ubegrænset for begge |
| Inde | Hånden, der har udspillet til første stik i farven: Nord eller Syd. Har kun betydning, når mindst én hånd har begrænsede indgange |
| Udspil fra hånden, der er inde | Gratis |
| Udspil fra den anden hånd | Bruger én indgang til den hånd. Uden indgange kan der ikke spilles ud derfra |
| Spilføreren vinder stikket | Hånden med det vindende kort er inde |
| Modspillet vinder stikket | Ingen hånd er inde. Næste udspil bruger en indgang til den hånd, spilføreren spiller ud fra |
| Modspillet | Spiller fortsat aldrig farven. Ved en renonce kaster modspilleren af som i dag |

- **Ubegrænset** er det samme som i dag. Har en hånd mindst lige så mange indgange, som der er runder tilbage, regnes den som ubegrænset, så tilstande, der ikke kan skelnes, deles.
- **Udspilsvalget** ved roden og efter hvert stik er kun de hænder, der kan nås: hånden, der er inde, og hænder med mindst én indgang.
- **Genvejen i `terminal`** ("modparten har ingen højere kort, så spilføreren vinder resten af runderne") gælder kun, når begge hænder kan nås. Ellers spilles videre i træet, så kort, der ikke kan hjemtages, ikke tælles med.
- **Information:** hvem der er inde og antallet af indgange er offentligt. Spilføreren ser stadig kun de spillede kort; modspillet kender alle kort.

## Situationen

Panelet Situationen får en blok Forbindelser under maks. hp:

| Felt | Valg | Standard |
| --- | --- | --- |
| Indgange til Nord | ubegrænset, 0–5 | ubegrænset |
| Indgange til Syd | ubegrænset, 0–5 | ubegrænset |
| Inde | Nord, Syd | Syd |

- **Felterne** er trinvælgere som de andre; "ubegrænset" står over 5. Feltet Inde vises kun, når en hånd har begrænsede indgange.
- **Chips** under bordet, fx "Syd inde · Syd 2 indgange" og "Nord 0 indgange".
- **Forudsætningslinjen** skifter fra "ubegrænsede forbindelser" til fx "Syd inde, Nord ubegrænset og Syd 2 indgange".
- **Beregningen** sker i browseren som de andre situationer, med ventevisning, forløbet tid og Stop.
- **Linjerne:** et udspil, der bruger en indgang, får sætningen "Gå ind på hånden med en sideindgang, og spil …" / "Gå ind på bordet …" (engelsk "Cross to hand with a side entry and lead …" / "Cross to dummy …").
- **Egne linjer** regnes med forbindelserne. En linje, der spiller ud fra en hånd uden indgang, afvises med en fejl, der siger hvilket trin.
- **Spil den selv**, åbnet fra Analyse: knapperne for udspil fra en hånd uden indgang er grået ud, og en indgang tælles ned, når den bruges.

## Leverancetrin

1. **Model og spil:** `entries` og `lead` i `GameOptions` og `Situation`, tilstanden i `game.ts`, genvejen i `terminal`, `SolveRequest` og tests. Tidsmåling.
2. **Panelet** med felterne, chips, forudsætningslinjen og beregningen i browseren.
3. **Linjerne, egne linjer og Spil den selv** med forbindelserne.

Hvert trin er færdigt, når `npm test` er grøn, `SPEC-farvebehandling.md` er opdateret, og Frank har godkendt.

## Accepttest

Facitværdierne for den blokerede farve er regnet med løseren (ubegrænset) og med fordelingen af de 7 manglende kort (4–3 eller bedre: 62,17 %).

- [x] Alle eksisterende tests består uændret, også `solver/uden-situation.test.ts` og `solver/deling.test.ts`.
- [x] Uden begrænsning, og med indgange ≥ antal runder for begge hænder, giver `handleSolve` præcis samme svar som i dag for B432 / ET65, E K B 3 2 / 7 6 5 4 og E D B 10 / 6 5 4 3 2.
- [x] Bordet E, hånden K D B 3 2, ubegrænset: 4 stik 100,00 %, 5 stik 62,17 %.
- [x] Samme, Nord inde, Syd 0 indgange: 4 stik 0,00 % og 5 stik 0,00 % (esset vinder, og hånden kan ikke nås).
- [x] Samme, Syd inde, Syd 0 og Nord 0 indgange: 4 stik 0,00 % (esset må tage stikket).
- [x] Samme, Nord inde, Syd 1 indgang: 4 stik 100,00 %, 5 stik 62,17 %.
- [x] Samme, Syd inde, Syd 1 indgang: 4 stik 100,00 %, 5 stik 62,17 %.
- [x] E D B 10 / 6 5 4 3 2, 5 stik, Syd inde, Syd 2 indgange, Nord ubegrænset: chancen ligger under 50,00 %, og sidningen Kxxx–renonce (kongen og tre små hos Vest) taber. Claude Code regner tallet, og Frank godkender det, før det låses i testen. Regnet: 45,22 %, godkendt af Frank 20. oktober 2026 og låst i testen.
- [x] Flere indgange giver aldrig en lavere chance: for 10 kombinationer fra banken og indgange 0–3 er chancen ikke-faldende i antallet af indgange til hver hånd.
- [x] En egen linje, der spiller ud fra Syd to gange med Syd 0 indgange og Nord inde, afvises med en fejl, der nævner trinnet.
- [x] Spil den selv: med Syd 0 indgange og Nord inde kan der ikke spilles ud fra Syd, efter at Nord har vundet et stik.
- [x] Alle nye tekster findes på dansk og engelsk, og de engelske skærme indeholder ingen dansk tekst.
- [x] Komponentfilerne indeholder ingen farveværdier og ingen tal med enhed, undtagen 0, 1px-streger og procenter.

## Afklaret

1. **Banken er regnet med ubegrænsede forbindelser**, og det ændres ikke. Forbindelser findes kun som en situation i Analyse.
2. **Modspillet spiller aldrig farven**, heller ikke for at tage en indgang. Det er samme forudsætning som i dag.
3. **Indgangene er sikre:** en indgang kan altid bruges og koster ikke et stik i farven. Indgange, der kan tages af modspillet, er ikke med.
4. **Træet bliver større,** fordi hvem der er inde og indgangene er en del af tilstanden. Grænsen "indgange ≥ runder = ubegrænset" holder det nede. Claude Code måler tiden for D B 6 / E 7 4 2 og E 10 3 2 / K 9 5 4 (3 stik) med og uden begrænsning og skriver tallene her.

   Målt 20. oktober 2026 som i SPEC-analyse-situation.md (Afklaret 4): `handleSolve` for ét mål, 3 kørsler, Node 24 på en bærbar med i7-1355U. De største træer med begrænsning er højst 2 % større end uden (alle kombinationer af inde og indgange er talt); de små træer er dem, hvor indgangene skærer linjer væk.

   | Kombination, 3 stik | Forbindelser | Knuder | Chance | Hurtigst | Median |
   | --- | --- | --- | --- | --- | --- |
   | D B 6 / E 7 4 2 | ubegrænset | 759 405 | 70,83 % | 241 s | 254 s |
   | D B 6 / E 7 4 2 | Syd inde, Nord ubegrænset, Syd 2 (største træ) | 772 573 | 70,83 % | 116 s | 137 s |
   | D B 6 / E 7 4 2 | Syd inde, Nord 1, Syd 1 | 404 545 | 44,81 % | 32 s | 60 s |
   | E 10 3 2 / K 9 5 4 | ubegrænset | 269 343 | 94,35 % | 7,7 s | 7,7 s |
   | E 10 3 2 / K 9 5 4 | Nord inde, Nord 2, Syd 3 (største træ) | 276 303 | 94,35 % | 12,1 s | 21,4 s |
   | E 10 3 2 / K 9 5 4 | Syd inde, Nord 1, Syd 1 | 144 095 | 94,35 % | 10,7 s | 10,7 s |

   Ventetiden med begrænsning ligger altså på niveau med uden; løserens antal runder svinger mere end træets størrelse. Panelet i trin 2 kan bruge samme ventevisning og Stop som de andre situationer.
5. **Claude Codes valg i leverancetrin 1:**
   - Felterne er valgfrie: `Situation.entries` (`north`, `south`: 0–5, null = ubegrænset) og `Situation.lead` (`'N'` eller `'S'`, udeladt = Syd). `STANDARD` er uændret, så de eksisterende situationer og tests virker som før. `GameOptions` har de samme felter.
   - **Ubegrænset pr. hånd:** en hånd med mindst lige så mange indgange, som den har kort tilbage, regnes som ubegrænset, fordi hvert udspil fra hånden bruger et af dens kort. Det er strammere end "runder tilbage" og giver samme værdi. `situationFor` gør det samme ved roden, så `handleSolve` med indgange ≥ antal runder går præcis samme vej som i dag.
   - **Genvejen** gælder kun, når begge hænder er ubegrænsede (tabellen i Afgrænsning). Formuleringen "når begge hænder kan nås" under Reglerne er ikke nok: K D B / E med Nord inde, ingen indgang til Nord og én til Syd kan begge hænder nås, men esset tager et af Nords stik, og spilføreren får kun 1 stik. Det står som test.
   - **Kan ingen hånd med kort nås,** slutter spillet med de stik, der er vundet (fx Nord inde med en renonce og ingen indgange til Syd).
6. **Claude Codes valg i leverancetrin 2:**
   - Blokken Forbindelser står under maks. hp med ⓘ og to trinvælgere som de andre ("Indgange til Nord", "Indgange til Syd"; værdien "ubegrænset" står over 5). Feltet Inde er to knapper, Nord og Syd, med ⓘ, som de andre valg i Analyse (`aria-pressed`, `accent-soft`); ingen nye tokens eller CSS.
   - **Chips:** hånden, der er inde, først og med sine indgange, når de er begrænsede ("Syd inde · Syd 2 indgange" eller "Syd inde"); den anden hånd kun, når dens indgange er begrænsede ("Nord 0 indgange"). 1 hedder "1 indgang".
   - **Forudsætningslinjen:** situationens del (eller "a priori") · forbindelserne · optimalt modspil, fx "a priori · Syd inde, Nord ubegrænset og Syd 2 indgange · optimalt modspil" eller "Vest 1 kendt kort · Syd inde, Nord ubegrænset og Syd 1 indgang · optimalt modspil". På engelsk "South on lead, North unlimited and South 2 entries".
   - **Bankens tal** bruges, når begge hænder har mindst lige så mange indgange, som de har kort (samme regel som i trin 1), så intet regnes forgæves; chips og forudsætningslinjen viser stadig det valgte.
7. **Claude Codes valg i leverancetrin 3** (trin 1 og 2 er godkendt af Frank 20. oktober 2026):
   - **Hvilke udspil bruger en indgang:** spillet har et felt pr. udspil (`slotEntry` i `game.ts`). Det er 1, når forbindelserne er begrænsede ved knuden, og hånden ikke er inde; også når hånden selv har ubegrænsede indgange, for så går man stadig ind på den med en sideindgang. Uden begrænsning er feltet 0 overalt, og teksterne er som før.
   - **Sætningen:** hånden nævnes i "Gå ind på …" og ikke igen efter kortet: "Gå ind på hånden med en sideindgang, og spil lille til esset.", "Gå ind på bordet med en sideindgang, og spil lille mod damen (kip)." og "Gå ind på bordet med en sideindgang, og slå esset." Et "slå" med en indgang slås ikke sammen med de andre "slå"-trin. På engelsk "Cross to hand with a side entry and lead low to the ace." og "… and cash the ace." Den engelske skabelon sætter hånden ind igen og bruger de faste skabeloner, så de er uændrede.
   - **Egne linjer:** et trin, der spiller ud fra en hånd, som ikke kan nås, afvises med "Trin 2: der er ingen indgang til hånden, så der kan ikke spilles ud derfra." (engelsk "Step 2: there is no entry to hand, so you cannot lead from there."). Slutter spillet, fordi ingen hånd med kort kan nås, tjekkes de senere trin ikke; linjen taber så de sidninger. Specens eksempel (Syd to gange med Syd 0 indgange og Nord inde) afvises allerede i trin 1; testen har også et eksempel, der afvises i trin 2 (E K 2 / B 5 4 3: esset fra bordet, så lille fra hånden).
   - **Spil den selv** følger forbindelserne kun, når det åbnes fra Analyse med begrænsede indgange; Træning og facit er uændrede. Indgangene tælles ned fra det valgte (en hånd med flere indgange end kort vises også). Under bordet står fx "Nord inde · Syd 0 indgange" eller "Ingen hånd er inde · Syd 1 indgang" med ⓘ ("Forbindelser i spillet"), og knapperne for udspil fra en hånd, der ikke kan nås, er grået ud. Kan ingen hånd med kort nås, er spillet slut, og der står "Ingen hånd med kort kan nås, så resten af kortene kan ikke hjemtages."
   - Ingen nye tokens eller ny CSS.

Åbne punkter:

1. **Når modspillet vinder et stik** (Franks godkendelse): specen siger, at ingen hånd så er inde, og at næste udspil bruger en indgang. Alternativet er, at spilføreren frit vælger hånd efter et tabt stik, fordi modspillet spiller en anden farve tilbage, som han vinder, hvor han vil. Den første regel er den forsigtige og passer til, at indgangene er det eneste, spilføreren kan regne med. **Afgjort (Frank, 20. oktober 2026): specens regel.** Testen 3 2 / K D B 10 9, 4 stik, Syd inde og ingen indgange giver 0 % (modspillet tager esset straks); med alternativet ville det være 100 %.
2. **E D B 10 / 6 5 4 3 2, 5 stik, Syd inde, Syd 2 indgange, Nord ubegrænset:** 45,22 % (eksakt 4 702 880 / 10 400 600 = 45,2174 %), med lille fra begge hænder. Ubegrænset er chancen 50,00 % (kongen hos Vest). Forskellen er præcis Kxxx–renonce (4,78 %): de tre kipninger og den sidste lille i hånden kræver tre indgange til hånden. Til sammenligning: Syd 1 indgang 26,57 % (kongen single eller Kx hos Vest), Syd 3 indgange 50,00 %. Godkendt af Frank 20. oktober 2026 og låst i testen.
