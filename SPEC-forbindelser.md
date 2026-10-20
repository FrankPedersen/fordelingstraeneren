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

- [ ] Alle eksisterende tests består uændret, også `solver/uden-situation.test.ts` og `solver/deling.test.ts`.
- [ ] Uden begrænsning, og med indgange ≥ antal runder for begge hænder, giver `handleSolve` præcis samme svar som i dag for B432 / ET65, E K B 3 2 / 7 6 5 4 og E D B 10 / 6 5 4 3 2.
- [ ] Bordet E, hånden K D B 3 2, ubegrænset: 4 stik 100,00 %, 5 stik 62,17 %.
- [ ] Samme, Nord inde, Syd 0 indgange: 4 stik 0,00 % og 5 stik 0,00 % (esset vinder, og hånden kan ikke nås).
- [ ] Samme, Syd inde, Syd 0 og Nord 0 indgange: 4 stik 0,00 % (esset må tage stikket).
- [ ] Samme, Nord inde, Syd 1 indgang: 4 stik 100,00 %, 5 stik 62,17 %.
- [ ] Samme, Syd inde, Syd 1 indgang: 4 stik 100,00 %, 5 stik 62,17 %.
- [ ] E D B 10 / 6 5 4 3 2, 5 stik, Syd inde, Syd 2 indgange, Nord ubegrænset: chancen ligger under 50,00 %, og sidningen Kxxx–renonce (kongen og tre små hos Vest) taber. Claude Code regner tallet, og Frank godkender det, før det låses i testen.
- [ ] Flere indgange giver aldrig en lavere chance: for 10 kombinationer fra banken og indgange 0–3 er chancen ikke-faldende i antallet af indgange til hver hånd.
- [ ] En egen linje, der spiller ud fra Syd to gange med Syd 0 indgange og Nord inde, afvises med en fejl, der nævner trinnet.
- [ ] Spil den selv: med Syd 0 indgange og Nord inde kan der ikke spilles ud fra Syd, efter at Nord har vundet et stik.
- [ ] Alle nye tekster findes på dansk og engelsk, og de engelske skærme indeholder ingen dansk tekst.
- [ ] Komponentfilerne indeholder ingen farveværdier og ingen tal med enhed, undtagen 0, 1px-streger og procenter.

## Afklaret

1. **Banken er regnet med ubegrænsede forbindelser**, og det ændres ikke. Forbindelser findes kun som en situation i Analyse.
2. **Modspillet spiller aldrig farven**, heller ikke for at tage en indgang. Det er samme forudsætning som i dag.
3. **Indgangene er sikre:** en indgang kan altid bruges og koster ikke et stik i farven. Indgange, der kan tages af modspillet, er ikke med.
4. **Træet bliver større,** fordi hvem der er inde og indgangene er en del af tilstanden. Grænsen "indgange ≥ runder = ubegrænset" holder det nede. Claude Code måler tiden for D B 6 / E 7 4 2 og E 10 3 2 / K 9 5 4 (3 stik) med og uden begrænsning og skriver tallene her.

Åbne punkter:

1. **Når modspillet vinder et stik** (Franks godkendelse): specen siger, at ingen hånd så er inde, og at næste udspil bruger en indgang. Alternativet er, at spilføreren frit vælger hånd efter et tabt stik, fordi modspillet spiller en anden farve tilbage, som han vinder, hvor han vil. Den første regel er den forsigtige og passer til, at indgangene er det eneste, spilføreren kan regne med.
2. Claude Code skriver tallet for E D B 10 / 6 5 4 3 2 med Syd inde og 2 indgange her, når det er regnet.
