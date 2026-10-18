# SPEC-analyse-situation

18. oktober 2026 · Frank

Analyse i farvebehandling får fire nye muligheder, så situationen ved bordet kan beskrives mere præcist: kendte kort i andre farver, maks. honnørpoint hos Vest og Øst, import af en kombination og et frit valg af de linjer, der sammenlignes. Formålet er, at spilføreren kan bruge det, han ved fra meldingerne og spillet, og analysere en farve fra et spil, han har spillet.

Løseren og spillet ændres ikke. Betingelserne bliver til vægte på sidningerne, som løseren allerede tager imod (`SubgameOptions.weights`), og til ledige pladser (`GameOptions.vacant`). Begrænsede forbindelser og en kompakt notation for sidninger (fx Kx–xx med antal) er ikke med; de får hver sin spec.

## Afgrænsning

Før arbejdet starter:

1. Commit og tag den nuværende app, fx `v8-foer-analyse-situation`.
2. Arbejd på grenen `analyse-situation`, og flet først ind efter godkendelse.
3. Kør alle eksisterende tests før og efter. De skal bestå uændret.

| Sted | Må ske | Må ikke ske |
| --- | --- | --- |
| `solver/cfr.ts`, `solver/solve.ts` | intet | ændre løsningen, certificeringen eller tolerancerne |
| `solver/game.ts` | dele et hul, når en hp-grænse kræver det (se Maks. hp) | ændre spillet uden betingelser |
| `model/` | ny fil `situation.ts` med betingelserne og vægtene | ændre `layouts.ts`' formler |
| `solver/results.ts`, `solver/client.ts` | `SolveRequest` får et valgfrit felt `situation` | ændre svarene uden `situation` |
| `ui/Analysevindue.tsx` og dets komponenter | panelet Situationen, import, valg af linjer, "Vis alle udspil" | ændre fanerne, bordet eller tabellens kolonner |
| `ui/SpilSelv.tsx`, `play/` | bruge situationens vægte, når Spil den selv åbnes fra Analyse | ændre det normale modspil |
| `ui/texts.ts` | nye tekster på dansk og engelsk med ⓘ | — |
| Træning, Selvvalgt, "Med optælling", facit | intet | alt |
| Appens data (`content/app/side-N.json`), `scripts/solve.ts` | intet | alt; bankens tal er og bliver a priori |
| Lagring | intet; situationen lever kun i Analyse, mens fanen er åben | nye felter i `farvebehandling:v1` |
| Tokens | eksisterende tokens | nye tokens |
| `SPEC-farvebehandling.md` | opdateres i samme commit som adfærden (CLAUDE.md) | — |

Kræver noget alligevel en ændring ud over tabellen, skal Claude Code stoppe og spørge.

Besked til Claude Code:

> Læs CLAUDE.md, SPEC-farvebehandling.md og SPEC-analyse-situation.md. Byg leverancetrin 1 på grenen `analyse-situation`, skriv accepttestene først, og stop efter trinnet, så jeg kan godkende. Løseren og spillet uden betingelser må ikke ændres.

## Situationen

Analyse får et panel, Situationen, lige under Problemet. Det er foldet sammen, når alt står på standard, og viser så kun "A priori · ubegrænsede forbindelser".

| Felt | Vest | Øst | Standard | Grænser |
| --- | --- | --- | --- | --- |
| Kendte kort i andre farver | 0–13 | 0–13 | 0 | De ledige pladser skal kunne rumme de manglende kort |
| Maks. hp i farven | 0–10 | 0–10 | 10 | Summen skal give plads til modpartens honnører |

- **Felterne** er trinvælgere (− og +) med trykflader på mindst 44 px, ikke tekstfelter.
- **Ugyldige valg** kan ikke vælges: knappen, der ville gøre situationen umulig, er grået ud, og en ⓘ siger hvorfor.
- **Resumé:** er et felt ændret, står situationen som chips under bordet, fx "Vest 5 kendte kort · Øst maks. 0 hp", og panelet har knappen "Nulstil".
- **Forudsætningslinjen** under linjerne skifter fra "a priori" til situationen, fx "Vest 5 og Øst 2 kendte kort · Øst maks. 0 hp · ubegrænsede forbindelser · optimalt modspil".
- **Chancerne er betingede:** procenten er chancen givet situationen. Sidninger, som situationen udelukker, står ikke i båndet eller tabellen; en linje under tabellen siger "N sidninger er udelukket af situationen".

### Kendte kort i andre farver

Feltet angiver, hvor mange kort hver modspiller har vist i andre farver. De ledige pladser er 13 minus de kendte kort: v_V = 13 − kendte_V og v_Ø = 13 − kendte_Ø. Det er de samme ledige pladser, som "Med optælling" bruger, og de sendes til `buildGame` som `vacant`.

### Maks. hp

Grænsen gælder honnørpoint i den analyserede farve (E 4, K 3, D 2, B 1), fx fordi en modspiller har passet eller vist en bestemt styrke. En sidning er mulig, når Vests hp i farven er højst Vests grænse, og Østs højst Østs.

Sidningernes vægt skal være eksakt: en abstrakt sidnings vægt er summen af vægtene for de konkrete sidninger i den, der overholder grænserne. Ligger kort med forskellige hp i samme hul (fx K og D, når spilføreren har E og B), er kortene ikke længere ligeværdige, når en hp-grænse er sat. Så deles hullet, før spillet bygges, så hver honnør med betydning for grænsen står for sig. Uden hp-grænse (10/10) bygges spillet præcis som i dag. Claude Code beskriver løsningen under Afklaret.

### Beregning

- **Bankens tal** bruges kun, når situationen står på standard. Ellers regnes kombinationen i browseren med den eksisterende løser i Web Workeren, med ventevisning og knappen Stop som i dag.
- **`SolveRequest`** får et valgfrit felt `situation: { known: { west, east }, maxHp: { west, east } }`. Uden feltet er svaret uændret.
- **Gennemsnittet** (flest stik i gennemsnit) regnes ikke i browseren i dag og heller ikke med en situation. Linjekortet viser det ikke, som for andre kombinationer uden for banken.
- **Spil den selv**, åbnet fra Analyse, trækker kun sidninger, der er mulige i situationen, med situationens vægte.

## Import

Over kortvælgeren får Analyse et felt "Indsæt kombination eller spil" med knappen Importér. Der læses kun den tekst, brugeren indsætter; appen henter intet fra nettet.

| Indsat tekst | Eksempel | Resultat |
| --- | --- | --- |
| Bordet-hånden | `AK65-J43` eller `EK65-B43` | Kombinationen stilles op direkte |
| BBO-handviewerens adresse med `lin=` | `https://www.bridgebase.com/tools/handviewer.html?lin=…` | Valg mellem 8 kombinationer |
| BBO-handviewerens adresse med `n=`, `s=`, `e=`, `w=` | `…handviewer.html?n=sj52ht…&s=…` | Valg mellem 8 kombinationer |
| En LIN-streng | `…md|3SQ6HKQ84D632CQ832,…|…` | Valg mellem 8 kombinationer |

- **Notation:** dansk (E K D B 10) og engelsk (A K Q J T) accepteres. Står der E, D eller B, læses teksten som dansk, ellers som engelsk. `10` og `T` er begge 10'eren. Mellemrum ignoreres.
- **LIN:** `md|` giver hænderne i rækkefølgen Syd, Vest, Nord, Øst efter det første ciffer (giveren). Mangler en hånd, er den de resterende kort.
- **Valg af kombination:** 8 knapper, for hver farve Nord–Syd og Øst–Vest, fx "♦ E D B 9 7 5 – 6 3 2". Den første hånd bliver bordet, den anden hånden.
- **Fejl** siger, hvad der er galt, og hvordan det rettes, fx "Kortet D står to gange" eller "Adressen er et kort link. Åbn spillet i handvieweren og kopiér den lange adresse".
- **Efter import** står kombinationen i kortvælgeren, og brugeren vælger mål som i dag. Er kombinationen i banken, bruges bankens tal.
- **Situationen** udfyldes ikke af importen. Kendte kort sættes af brugeren, fordi kun spilføreren ved, hvad han har set ved bordet.

## Valg af linjer og alle udspil

- **Vis alle udspil:** en knap under linjerne viser alle første udspil i løserens resultat, også dem langt under den bedste og dem med 0 %. Appens data har allerede alle udspil pr. mål (`goals[mål].leads`). Standard er visningen i dag (`shownLeads`).
- **Sammenlign:** hvert linjekort får et afkrydsningsfelt "Sammenlign". Er præcis to krydset af, viser båndet og tabellen kun de to linjer, og "afgør" gælder dem. Ellers sammenlignes de viste linjer som i dag.
- **Unikke vindere:** med to linjer valgt står der over tabellen, hvor mange procentpoint hver linje vinder alene, fx "Linje A vinder alene i 3 sidninger (14,0 %), linje B i 1 (6,2 %)".

## Leverancetrin

1. **Model:** `model/situation.ts` (ledige pladser og eksakte vægte), deling af huller ved hp-grænse, `situation` i `SolveRequest` og tests.
2. **Panelet Situationen** i Analyse, med beregning i browseren, betingede bånd og tabel og Spil den selv.
3. **Import** af tekst, BBO-adresser og LIN.
4. **Valg af linjer:** Vis alle udspil, Sammenlign og unikke vindere.

Hvert trin er færdigt, når `npm test` er grøn, `SPEC-farvebehandling.md` er opdateret, og Frank har godkendt.

## Accepttest

Facitværdierne er regnet med løseren (18. oktober 2026).

- [ ] Alle eksisterende tests består uændret.
- [ ] Uden situation giver `handleSolve` præcis samme svar som i dag for B432 / ET65 og E K B 3 2 / 7 6 5 4.
- [ ] Kendte kort 0/0 og maks. hp 10/10 giver præcis samme tal som a priori.
- [ ] E D B 10 / 6 5 4 3 2, 5 stik, kendte kort Vest 5 og Øst 2: lille fra begge hænder 42,11 %, esset 12,49 %.
- [ ] E D B 10 / 6 5 4 3 2, 5 stik, Øst maks. 0 hp: lille fra begge hænder 100,00 %.
- [ ] E D B 10 / 6 5 4 3 2, 5 stik, Vest maks. 0 hp: 12,43 % (esset eller lille fra hånden).
- [ ] E D B 10 / 6 5 4 3 2, 5 stik, Vest maks. 0 hp og kendte kort Vest 5, Øst 2: 6,86 %.
- [ ] B 5 / E D 7 6 4 2, 5 stik, Vest maks. 0 hp: knægten fra bordet 84,78 %.
- [ ] Vægte ved delt hul: for E B 4 3 / 6 5 2 (K og D i samme hul) og alle hp-grænser 0–10 er summen af de abstrakte sidningers vægt lig med summen over de konkrete sidninger, der overholder grænserne, talt direkte.
- [ ] En situation, der ikke kan lade sig gøre (fx kendte kort 13/13), kan ikke vælges.
- [ ] Import: `AK65-J43` og `EK65-B43` giver samme kombination; `AK6-AJ4` afvises, fordi esset står to gange.
- [ ] Import: spillet `md|3SQ6HKQ84D632CQ832,ST94HJ752DK84CT65,SJ52HTDAQJ975CKJ7,|`, giver 8 kombinationer, blandt dem ♦ E D B 9 7 5 – 6 3 2 og ♣ K B 7 – D 8 3 2 (Nord–Syd) og ♠ E K 8 7 3 – 10 9 4 (Øst–Vest; Øst er afledt som de resterende kort).
- [ ] Sammenlign: med to linjer valgt er linje A's unikke vindere minus linje B's lig med forskellen mellem linjernes chance.
- [ ] Alle nye tekster findes på dansk og engelsk, og de engelske skærme indeholder ingen dansk tekst.
- [ ] Komponentfilerne indeholder ingen farveværdier og ingen tal med enhed, undtagen 0, 1px-streger og procenter.

## Afklaret

1. **Bankens tal er a priori.** Forberegning med situationer ville gange datamængden op; en situation regnes derfor altid i browseren.
2. **Forbindelser** er stadig ubegrænsede. Begrænsede forbindelser kræver indgange i spillets tilstand og får sin egen spec.
3. **Beregningstiden** kan blive lang på en telefon (op til ca. 2 minutter i Node for de tungeste kombinationer med 5–6 manglende kort). Ventevisningen og Stop er de samme som i dag.

Åbne punkter: Claude Code skriver her, hvordan hullet deles ved en hp-grænse, og om det påvirker beregningstiden.
