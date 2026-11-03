# SPEC-linjeformat-39

3. november 2026 · Franks opgave, skrevet af Claude Code · Bygget på grenen `linjeformat-39` (før: `v31-foer-linjeformat-39`), godkendt af Frank og udgivet 3. november 2026.

Specen lukker det åbne punkt "Gemte linjer, som linjeformatet afviser" i SPEC-farvebehandling.md. Punktet "Esset slås." efter en kipning er en særskilt ændring, der tages bagefter.

## Kort fortalt

- **Tallene:** linjeformatet afviser 39 af 6.974 gemte linjer, og 14 af dem er bedste linjer. Antallet og fordelingen på fejl er de samme som 30. oktober.
- **Årsagen:** fejlen ligger i `describe.ts`, ikke i løseren, `lines.ts` eller linjeformatet.
- **Rettelsen:** et kort, der er brugt på en gren, bliver `high`. Følger trinet så ikke løserens plan, slutter linjen før det.
- **Følgerne:** ingen tekst og ingen chance ændrer sig. 39 linjer får andre trin, heraf de 14 bedste. Gennemsnittet af stik ændrer sig på 9 viste linjer.
- **Banken:** kun 31 af 660 cases løses forfra; det tog 17 minutter mod godt 3 timer for hele banken.
- **To nye fund:** dommen i Spil den selv var forkert på de afviste linjer (SPEC-farvebehandling.md sagde, at "intet går i stykker"). Og 23 andre linjer viser noget andet end løserens plan, uden at formatet afviser dem; de tages sammen med punktet "Esset slås." (Franks valg).

## Optælling

Talt 3. november 2026 på `main` (`336e10b`), bank med `LINES_VERSION` 3. Hver linje er prøvet i sit eget spil: en linje for et mål i målets spil og en linje for flest stik i spillet med flest stik.

| | Antal |
| --- | --- |
| Udspil i banken (657 kombinationer) | 8.500 |
| Uden trin (`line` er tom, løseren spiller det hele) | 1.526 |
| **Gemte linjer** | **6.974** |
| **Afvist af linjeformatet** | **39** (31 kombinationer) |
| heraf for et mål / for flest stik | 23 / 16 |
| **heraf bedste linjer** | **14** (8 for et mål, 6 for flest stik) |
| heraf i appens data / kun i `solutions.json` | 29 / 10 |

Fejlene:

| Fejl | Antal |
| --- | --- |
| Esset kan ikke spilles fra hånden | 29 |
| Esset kan ikke spilles fra bordet | 4 |
| Kongen kan ikke spilles fra hånden | 3 |
| Esset kan ikke spilles fra hånden som 3. hånd | 3 |

Alle 39 står i bilaget. Fem eksempler:

| Kombination (bordet / hånden) | Mål | Chance | Linjen i dag | Hvad der går galt |
| --- | --- | --- | --- | --- |
| 2 / E K B 5 4 3 | 5 stik, bedste | 59,75 % | "Lille fra bordet mod knægten (kipning); lægger Øst en honnør, tages den med esset. Esset og kongen slås." | Øst lægger damen, esset tager stikket, og trin 2 kræver esset |
| 4 3 2 / E K 10 9 5 | 4 stik, bedste | 89,57 % | "Lille fra bordet mod 10'eren (kipning); lægger Øst en honnør, tages den med esset. Esset slås." | Øst lægger damen eller knægten, esset tager stikket, og trin 2 kræver esset |
| E K 2 / B 9 8 4 3 | 4 stik | 84,78 % | "Knægten fra hånden; dækker Vest, tages stikket med esset, ellers løber den. Esset slås." | Vest dækker med damen, bordets es tager stikket, og trin 2 kræver esset fra bordet |
| E B 2 / K 9 4 3 | 3 stik | 70,59 % | "Knægten fra bordet; dækker Øst, tages stikket med kongen, ellers løber den. Esset og kongen slås." | Øst dækker med damen, kongen tager stikket, og trin 3 kræver kongen |
| K 8 2 / E 10 9 3 | 3 stik | 78,36 % | "Lille fra bordet mod 10'eren (kipning); lægger Øst en honnør, tages den med esset. Kongen slås. Lille fra begge hænder; lægger Øst en honnør, tages den med esset." | Esset er brugt i trin 1, og trin 3 kræver det igen som 3. hånd |

## Årsagen

Alle 39 har samme forløb: på grenen, hvor 2. hånd lægger en honnør, bruger 3. hånd sit es eller sin konge, og et senere trin kræver det samme kort.

Sådan opstår det i 2 / E K B 5 4 3:

1. **Løseren regner ligeværdige kort som ét.** Når Øst har lagt damen, er esset og kongen ligeværdige. I løserens træ fjernes det laveste kort i gruppen, så det kort, der er tilbage, stadig hedder esset, selv om det i hånden er kongen.
2. **`describe.ts` læser trinene på hovedvejen alene.** Dér lægger Øst lille, esset er stadig på hånden, og trin 2 får derfor det konkrete kort E.
3. **`sameNextLead` overser forskellen.** Den spørger, om næste udspil er det samme på alle grene, men sammenligner løserens navne på kortene (`slotHand:slotHigh`). Svaret er ja, for begge grene hedder "esset" i træet.
4. **Grenen med honnøren passer ikke.** Her er det fysiske es brugt i trin 1, og det kort, løseren mener, er kongen.

| Sted | Ligger fejlen dér? | Begrundelse |
| --- | --- | --- |
| Løseren (`cfr.ts`, `game.ts`) | Nej | Planen er rigtig. De 31 kombinationer løst forfra giver samme tekst, trin og chance i alle 480 udspil |
| `lines.ts` | Nej | Den afviser med rette efter specens regel om umulige trin; det er den, der har fundet fejlen |
| Linjeformatet | Nej | Formatet kan allerede sige det rigtige: `high` er det højeste kort, der er tilbage |
| **`describe.ts`** | **Ja** | Den skriver et konkret kort fra hovedvejen, hvor kortet ikke er det samme på alle grene |

### Det, der faktisk går i stykker

SPEC-farvebehandling.md siger, at "intet går i stykker". Det passer ikke. `followsLine` i `play/play.ts` kan ikke finde kortet og svarer, at linjen ikke er fulgt. En spiller, der følger teksten ord for ord i Spil den selv, får derfor at vide, at der er en bedre linje, og som opgave giver det 0 point og kasse 1.

Målt på de 9 linjer, der tæller som bedste eller lige gode, hvor 2. hånd har en honnør alene, 3. hånd tager den med det kort, teksten nævner, og det højeste kort spilles bagefter: dommen er "ikke fulgt" på 8 af de 9 i dag og på ingen efter rettelsen. Det sker kun på den gren, så det er sjældent, men det er forkert, når det sker.

`leadTricks` skjuler desuden fejlen: for en afvist linje bruger den "de første trin, der kan spilles", så stik pr. sidning regnes på en kortere linje end de andres (se Hvad det ændrer).

## Forslag til rettelsen

Rettelsen ligger i `describeLine` i `describe.ts`, efter at trinene er skrevet. `describeFrom` røres ikke, så Hvad nu? er uændret.

1. **Afviser `lineMask` ikke linjen, er den uændret.** Det gælder 6.935 af de 6.974 linjer.
2. **Ellers gennemgås linjen trin for trin:**
   - Et konkret kort, der ikke kan spilles på en gren, bliver `high` (ved udspil eller 3. hånd).
   - Trinet skal følge løserens eget valg på alle grene, hvilket afgøres ved at gå løserens plan igennem mod linjen. Det kræver ingen ny løsning.
   - Kan trinet ikke leve op til det, slutter linjen før det. Så spiller løseren videre, som formatet siger ("Efter sidste trin").

Efter rettelsen er 2 / E K B 5 4 3 (5 stik):

| | Trin 1 | Trin 2 | Trin 3 |
| --- | --- | --- | --- |
| I dag | Lille fra bordet; 3. hånd B, eller E mod en honnør | S: E | S: K |
| Efter | Lille fra bordet; 3. hånd B, eller E mod en honnør | S: `high` | S: `high` |

På hovedvejen er `high` esset og derefter kongen, som i dag. På grenen med damen er `high` kongen og derefter knægten, så trin 2 kan spilles efter alle grene af trin 1.

`high` findes allerede i formatet, i `lines.ts`, i Spil den selv og i Linjeeditoren, så data og læsning kræver ingen ændring. Det er første gang, løserens egne linjer bruger det.

### Fravalgte løsninger

Alle er prøvet på de 39 linjer:

| Løsning | Resultat | Hvorfor den er fravalgt |
| --- | --- | --- |
| Kun `high` | Alle kan spilles, men 5 mister chance, fx B 3 2 / E K 9 4 (3 stik): 70,59 % → 60,90 % | Trin 3 følger ikke løserens plan på grenen |
| Kun afkorte før det første umulige trin | 38 af 39 beholder chancen | Består ikke accepttesten: 2 / E K B 5 4 3 (5 stik) får intet trin 2 |
| Gøre `lines.ts` tolerant | – | Den ville også svække valideringen af brugerens egne linjer og er imod specens regel om umulige trin |

## Hvad det ændrer

### Tekst og trin

| | Bedste linjer | Alle linjer |
| --- | --- | --- |
| Anden tekst | **0 af 14** | **0** af 8.500 |
| Andre trin | **14 af 14** | **39** af 6.974 |
| Samme antal trin | 14 | 27 |
| Færre trin (3 → 2) | 0 | 7 |
| Færre trin (3 → 1) | 0 | 5 |

Teksten står uændret, fordi den følger hovedvejen. Den er altså stadig kun bogstavelig på hovedvejen (se Franks afgørelser, punkt 2).

### Chancerne

**Ingen chance ændrer sig, i ingen kombination.** Chancerne (`value`, `exact`, `upper`, `certified`, `layouts`) kommer fra løseren, ikke fra linjens trin. Desuden gælder:

- De 39 rettede linjer giver den gemte chance, når de spilles som helhed (39 af 39).
- De 31 kombinationer løst forfra giver samme chance i alle 480 udspil.
- De rettede linjer for et mål kan også spilles i spillet med flest stik (23 af 23).

### Stik pr. sidning

Gennemsnittet af stik er ikke en chance, men det ændrer sig, og det kan ses på linjekortet og i sidningstabellen. **11 viste linjer får andre stik pr. sidning, og på 9 af dem ændres gennemsnittet.** Dagens tal er for høje, fordi de regnes på en kortere linje end de andres.

| Kombination | Mål | Rolle | Stik i gennemsnit | Sidninger ændret |
| --- | --- | --- | --- | --- |
| 4 3 2 / E K 10 9 5 | 4 | bedste | 4,10 → 3,91 | 2 af 12 |
| 5 4 3 2 / E K 10 9 | 3 | bedste | 3,14 → 2,95 | 2 af 12 |
| B 3 2 / E K 9 8 | 3 | vist | 3,03 → 2,88 | 4 af 20 |
| 10 3 2 / E K 9 5 4 | 4 | vist | 3,94 → 3,83 | 1 af 12 |
| B 3 2 / E K 9 8 4 | 4 | vist | 4,14 → 4,06 | 3 af 16 |
| B 2 / E K 9 8 3 | 4 | vist | 3,79 → 3,72 | 1 af 20 |
| E K 2 / B 9 8 3 | 3 | vist | 2,84 → 2,79 | 2 af 20 |
| 10 3 2 / E K 9 4 | 3 | vist | 2,64 → 2,62 | 3 af 15 |
| B 3 2 / E K 9 4 | 3 | vist | 2,712 → 2,706 | 2 af 20 |
| B 3 2 / E K 9 5 4 | 4 | vist | 3,96 (uændret) | 2 af 16 |
| B 4 3 2 / E K 9 5 | 3 | vist | 3,00 (uændret) | 2 af 16 |

Hold eller par er uændret: ingen af de 8 bedste linjer for et mål har et tal for parturnering.

### Banken

**Hele banken skal ikke løses igen.** Rettelsen rører kun linjer, som formatet afviser, så de 629 cases, der ikke er berørt, er de samme, uanset om de løses forfra.

| Vej | Hvad der sker | Tid |
| --- | --- | --- |
| **Kun de berørte (valgt)** | De 31 cases løses forfra, og `--assemble` samler banken | **17 min** med 10 processer (målt 3. november) |
| Hele banken | Alle 660 cases løses forfra | **ca. 3 timer 12 min** med 10 processer (målt 29.–30. oktober) |

`LINES_VERSION` bliver 4. De 629 andre filer i mellemlageret får versionen skrevet ind i en engangskørsel uden for repoet, som 31. oktober.

## Fund uden for de 39

Alle de 6.935 andre linjer er også spillet som helhed (79 minutter med 7 processer). 6.880 giver den gemte chance, og 55 gør ikke:

| Antal | Hvad det er | Fejl? |
| --- | --- | --- |
| 31 | Det optimale spil kræver blanding (`certified: false`). Den gemte chance er midten af grænserne, som en fast linje ikke kan nå præcist, fx B 2 / E K 9 8 7 3 (6 stik): 16,68 % gemt, 6,78 % med linjen. Linjen følger løserens valg overalt | Nej, sådan er modellen |
| 1 | Forskel inden for løserens tolerance (1,7503 stik) | Nej |
| **23** | **Linjen viser noget andet end løserens plan på en gren** | **Ja, samme årsag** |

De 23 (17 kombinationer; 13 for et mål og 10 for flest stik; 4 bedste linjer) kan spilles, så formatet afviser dem ikke. Men `describe.ts` læser også 3. hånds kort på hovedvejen alene, og på en anden gren er løserens plan en anden. De 4 bedste:

| Kombination | Mål | Gemt | Linjen spillet, som den står |
| --- | --- | --- | --- |
| 3 2 / B 10 5 4 | 1 stik | 24,73 % | 4,22 % |
| 5 4 3 2 / B 8 7 6 | 1 stik | 76,30 % | 67,83 % |
| 5 4 3 2 / B 8 7 6 | flest stik | 0,76 stik | 0,68 stik |
| D B 9 / E 5 4 3 2 | flest stik | 3,85 stik | 3,72 stik |

Dommen i Spil den selv kan vende sig: i 3 2 / B 10 5 4 får den, der følger løserens plan, "ikke fulgt", og den, der følger linjen, som den står, får "fulgt".

Alle 23 beholder chancen, hvis linjen bliver ét trin kortere (17 går fra 2 til 1 trin og 6 fra 3 til 2). Ingen af dem bliver tom. Teksten ændres ikke.

De 23 er ikke med i afgrænsningen nedenfor (Franks valg; se Franks afgørelser, punkt 1).

## Afgrænsning

| Sted | Må ske | Må ikke ske |
| --- | --- | --- |
| `src/farvebehandling/solver/describe.ts` | `describeLine` retter linjer, som formatet afviser, efter reglen ovenfor | `describeFrom`, teksterne (`steps`), hovedvejen, linjer der ikke afvises |
| `src/farvebehandling/solver/results.ts` | "De første trin, der kan spilles" fjernes fra `leadTricks`, så en afvist linje fejler højt | resten |
| `solver/lines.ts`, `cfr.ts`, `game.ts`, `natural.ts`, `whatnow.ts`, `play/play.ts`, `ui/` | intet | linjeformatet og måden, det læses på |
| `scripts/solve.ts` | `LINES_VERSION` bliver 4 | resten |
| `content/solutions.json`, `suit-combinations.json`, `app/side-N.json` | `line` for de 39 linjer i bilaget og `tricks` for de 11 linjer ovenfor | alt andet, også chancerne |
| `content/linjer-side-N.md`, `teknikker.md`, `techniques.json`, `hvad-nu.*`, `validering-side-N.md`, `hyppighed.csv`, `kildefejl.json` | intet | de skal være byte for byte ens |
| `scripts/tjek-linjer.ts` (ny) | tæller afviste linjer i hele banken (5–7 minutter i én proces) | |
| `src/farvebehandling/solver/linjer-spilbare.test.ts` (ny) | fast test i `npm test` af de 31 kombinationer | |
| `SPEC-farvebehandling.md`, `CLAUDE.md`, `docs/specs/README.md`, `../SYSTEM.md` | det åbne punkt lukkes, og sætningen "intet går i stykker" rettes; de 23 og punktet om "Esset slås." står tilbage som åbne punkter | |

Punktet "Esset slås." efter en kipning og de 23 linjer bygges ikke her.

## Accepttest

Skrives først, som altid.

- [x] `node scripts/tjek-linjer.ts`: linjeformatet afviser **ingen** af de gemte linjer (i dag 39 af 6.974).
- [x] 2 / E K B 5 4 3 (5 stik) har en linje, hvor **trin 2 kan spilles efter alle grene af trin 1**: trinene er lille fra bordet (3. hånd B, eller E mod en honnør), `high`, `high`. Når Øst lægger damen, og esset tager stikket, er trin 2 kongen.
- [x] Alle 39 linjer har trinene i bilagets sidste kolonne.
- [x] Alle 39 giver den gemte chance, når løseren spiller dem som helhed, og de af dem, der gælder et mål, kan også spilles i spillet med flest stik.
- [x] **Chancerne er uændrede:** `value`, `exact`, `upper`, `certified` og `layouts` er ens for alle 8.500 udspil sammenlignet med tagget `v31-foer-linjeformat-39`, og det samme gælder `pairs` og Hvad nu?.
- [x] **Teksterne er uændrede:** `steps` er ens for alle 8.500 udspil, og rapporterne i afgrænsningen er byte for byte ens.
- [x] Kun de 39 linjer har andre trin, og kun de 11 linjer i tabellen har andre `tricks`, med de nævnte gennemsnit.
- [x] Spil den selv: på de 8 linjer er dommen "fulgt", når spilleren følger teksten på grenen med honnøren. En spiller, der ikke følger linjen, får stadig "ikke fulgt".
- [x] `leadTricks` regner ikke længere på en kortere linje.
- [x] `npm test` er grøn, `node scripts/bog-regression.ts` består, og `node scripts/sprogtjek.ts` finder ingen ukendte ord.

## Ti eksempler til punktet "Esset slås."

Franks ønske: ti eksempler før og efter, før punktet "Esset slås." efter en kipning besluttes. Eksemplerne viser reglen fra SPEC-farvebehandling.md: hovedvejen følger den vej, hvor kipningen lykkes, så 4. hånd lægger lavt. Den er kun prøvet i hukommelsen og er ikke bygget. Chancerne ændrer sig ikke.

Blandt de 154 bedste linjer med en kipning i de 110 hyppigste kombinationer ændres 96. Reglen trækker begge veje: den tilføjer tekst nogle steder og fjerner den andre steder.

| | Kombination | Mål | I dag | Hvis kipningen lykkes |
| --- | --- | --- | --- | --- |
| 1 | 4 3 2 / E D 6 5 | 3 (17,8 %) | Lille fra bordet mod damen (kipning); lægger Øst en honnør, tages den med esset. | … tages den med esset. **Esset slås. Lille fra begge hænder.** |
| 2 | 4 3 2 / E D 7 6 5 | 4 (33,9 %) | Lille fra bordet mod damen (kipning); lægger Øst en honnør, tages den med esset. | … tages den med esset. **Esset slås.** |
| 3 | 4 3 2 / E K B 5 | 4 (17,8 %) | Lille fra bordet mod knægten (kipning); lægger Øst en honnør, tages den med esset. | … tages den med esset. **Esset og kongen slås.** |
| 4 | 4 3 2 / K 7 6 5 | 2 (17,8 %) | Lille fra bordet mod kongen (kipning); lægger Øst en honnør, lægges der lille. | … lægges der lille. **Lille fra begge hænder. Lille fra begge hænder.** |
| 5 | 3 2 / E K D 9 4 | 4 (89,6 %) | Lille fra bordet mod 9'eren (kipning); lægger Øst en honnør, tages den med esset. **Esset slås.** | Lille fra bordet mod 9'eren (kipning); lægger Øst en honnør, tages den med esset. |
| 6 | 2 / E K B 5 4 3 | 5 (59,8 %) | … tages den med esset. **Esset og kongen slås.** | … tages den med esset. **Esset slås.** |
| 7 | B 3 2 / E K 5 4 | 3 (69,0 %) | Lille fra bordet til esset. Lille fra hånden mod knægten (kipning); lægger Vest en honnør, lægges der lille. **Kongen slås.** | Lille fra bordet til esset. Lille fra hånden mod knægten (kipning); lægger Vest en honnør, lægges der lille. |
| 8 | B 3 2 / K 5 4 | 1 (74,5 %) | Lille fra bordet mod kongen (kipning); lægger Øst en honnør, lægges der lille. **Lille fra hånden mod knægten (kipning); lægger Vest en honnør, lægges der lille.** | Lille fra bordet mod kongen (kipning); lægger Øst en honnør, lægges der lille. |
| 9 | 4 3 2 / D B 9 6 5 | 3 (71,8 %) | Lille fra bordet mod damen (kipning); lægger Øst en honnør, lægges der lille. Lille fra bordet **mod 9'eren** (kipning); lægger Øst en honnør, lægges der lille. | … Lille fra bordet **mod knægten** (kipning); lægger Øst en honnør, lægges der lille. |
| 10 | 4 3 2 / K D 8 7 6 5 | 5 (65,6 %) | Lille fra bordet mod kongen (kipning); lægger Øst en honnør, lægges der lille. **Damen slås.** | … lægges der lille. **Lille fra bordet mod damen (kipning); lægger Øst en honnør, lægges der lille.** |

## Franks afgørelser

Frank svarede ja til de tre anbefalinger 3. november 2026.

1. **De 23 linjer, der viser noget andet end løserens plan,** tages sammen med "Esset slås." efter en kipning. Begge handler om, hvordan `describe.ts` læser hovedvejen, og begge kræver en løsning af hele banken, så de godt 3 timer kun skal bruges én gang.
2. **Teksten på grenen med honnøren** bliver, som den er, indtil de ti eksempler er vurderet. "Lægger Øst en honnør, tages den med esset. Esset og kongen slås." er kun bogstavelig på hovedvejen.
3. **Kun de 31 cases** er løst forfra. Rettelsen kan ikke røre de andre, og accepttesten har kontrolleret det.

## Afklaret

1. **Gemte linjer** er udspil med trin i `solutions.json`, for mål og for flest stik. De 1.526 uden trin afvises ikke; dér spiller løseren det hele, som formatet siger.
2. **Bedste linje** er `best` i sit mål eller i flest stik. For flest stik har appen kun den bedste linje, derfor de 10 linjer, der kun ligger i `solutions.json`.
3. **Målingerne** er kørt med midlertidige scripts uden for repoet på `main` (`336e10b`), kun i hukommelsen. Hverken repoet eller mellemlageret er ændret.
4. **Reglen "følger løserens valg"** er strengere end nødvendigt: på 8 af de 39 linjer slutter den et trin eller to tidligere, end chancen kræver. Det er valgt, fordi den ikke kræver en ny løsning og derfor også er billig i browseren, når Analyse regner en kombination uden for banken.
5. **Kun afviste linjer rettes.** Det holder ændringen på de 39 og lader alle andre linjer stå byte for byte.
6. **Resultatet af accepttesten mod tagget:** af 8.500 udspil er præcis de 39 linjer og de 11 stik pr. sidning ændret, og chancer og tekster er ens. `node scripts/tjek-linjer.ts` afviser 0 af 6.974, og regressionen mod bogen består (120 af 120 tal).

## Bilag: de 39 linjer

Rækkefølge: bedste linjer først, derefter efter hyppighed. Rang er hyppighedsrangen i banken (1 = hyppigst). Rolle: *bedste*, *lige god* (inden for 0,5 procentpoint), *vist* (vist i appen som alternativ) eller *anden* (kun i `solutions.json`).

Trinene: N er bordet, S er hånden. `[x/y]` er 3. hånds kort, når 2. hånd lægger lavt / lægger en honnør. *høj* er `high`.

| Kombination | Rang | Mål | Rolle | Chance | Afvist i trin | Trin i dag | Trin efter rettelsen |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2 / E K B 5 4 3 | 89 | 4 | bedste | 91,24 % | 2 · E fra hånden | N lille [B/E] · S E | N lille [B/E] · S høj |
| 2 / E K B 5 4 3 | 89 | 5 | bedste | 59,75 % | 2 · E fra hånden | N lille [B/E] · S E · S K | N lille [B/E] · S høj · S høj |
| 2 / E K B 5 4 3 | 89 | flest | bedste | 4,68 stik | 2 · E fra hånden | N lille [B/E] · S E · S K | N lille [B/E] · S høj · S høj |
| 2 / E K B 10 4 3 | 206 | flest | bedste | 5,10 stik | 2 · E fra hånden | N lille [B/E] · S E | N lille [B/E] · S høj |
| 2 / E K D 10 3 | 254 | 4 | bedste | 81,09 % | 2 · E fra hånden | N lille [10/E] · S E · S K | N lille [10/E] · S høj · S høj |
| 2 / E K D 10 3 | 254 | flest | bedste | 4,12 stik | 2 · E fra hånden | N lille [10/E] · S E · S K | N lille [10/E] · S høj · S høj |
| 4 3 2 / E K 10 9 5 | 301 | 4 | bedste | 89,57 % | 2 · E fra hånden | N lille [10/E] · S E | N lille [10/E] · S høj |
| 2 / E K D 9 3 | 312 | 4 | bedste | 63,63 % | 2 · E fra hånden | N lille [lille/E] · S E · S K | N lille [lille/E] · S høj · S høj |
| 2 / E K D 9 4 3 | 313 | 5 | bedste | 83,98 % | 2 · E fra hånden | N lille [lille/E] · S E | N lille [lille/E] · S høj |
| 2 / E K B 9 4 3 | 314 | flest | bedste | 4,79 stik | 2 · E fra hånden | N lille [B/E] · S E · S K | N lille [B/E] · S høj · S høj |
| 5 4 3 2 / E K 10 9 | 519 | 3 | bedste | 89,57 % | 2 · E fra hånden | N lille [lille/E] · S E | N lille [lille/E] · S høj |
| 2 / E K 10 9 8 | 604 | 4 | bedste | 45,22 % | 2 · E fra hånden | N lille [lille/E] · S E · S K | N lille [lille/E] · S høj · S høj |
| 2 / E K 10 9 8 | 604 | flest | bedste | 3,46 stik | 2 · E fra hånden | N lille [lille/E] · S E · S K | N lille [lille/E] · S høj · S høj |
| 2 / E K B 9 8 7 3 | 639 | flest | bedste | 6,19 stik | 2 · E fra hånden | N lille [B/E] · S E | N lille [B/E] · S høj |
| B 3 2 / E K 5 4 | 23 | 3 | vist | 35,53 % | 2 · E fra hånden | N B [lille/E] · S E · S K | N B [lille/E] · S høj |
| B 3 2 / E K 5 4 | 23 | flest | anden | 2,36 stik | 2 · E fra hånden | N B [lille/E] · S E · S K | N B [lille/E] · S høj |
| E K 2 / B 5 4 3 | 50 | 3 | vist | 35,53 % | 2 · E fra bordet | S B [lille/E] · N E · N K | S B [lille/E] · N høj · N høj |
| E K 2 / B 5 4 3 | 50 | flest | anden | 2,36 stik | 2 · E fra bordet | S B [lille/E] · N E · N K | S B [lille/E] · N høj · N høj |
| B 3 2 / E K 9 4 | 173 | 3 | vist | 70,59 % | 2 · E fra hånden | N B [lille/E] · S E · S K | N B [lille/E] · S høj |
| K 3 2 / E B 9 4 | 175 | flest | anden | 3,05 stik | 3 · E fra hånden | N lille [B/E] · N K · S E | N lille [B/E] · N K |
| E B 2 / K 9 4 3 | 176 | 3 | vist | 70,59 % | 3 · K fra hånden | N B [lille/K] · N E · S K | N B [lille/K] |
| E B 2 / K 9 4 3 | 176 | flest | anden | 2,71 stik | 3 · K fra hånden | N B [lille/K] · N E · S K | N B [lille/K] · N E |
| 10 3 2 / E K 9 4 | 181 | 3 | vist | 62,27 % | 2 · E fra hånden | N 10 [lille/E] · S E | N 10 [lille/E] · S høj |
| B 3 2 / E K 9 5 4 | 207 | 4 | vist | 84,78 % | 2 · E fra hånden | N B [lille/E] · S E | N B [lille/E] · S høj |
| 10 3 2 / E K 9 5 4 | 211 | 4 | vist | 81,96 % | 2 · E fra hånden | N 10 [lille/E] · S E | N 10 [lille/E] · S høj |
| K 2 / E B 9 4 3 | 235 | flest | anden | 3,80 stik | 3 · E fra hånden | N lille [B/E] · N K · S E | N lille [B/E] · N K · S høj |
| E 2 / K B 9 4 3 | 236 | flest | anden | 3,80 stik | 3 · K fra hånden | N lille [B/K] · N E · S K | N lille [B/K] · N E · S høj |
| K 2 / E B 9 3 | 256 | 3 | lige god | 68,17 % | 3 · E fra hånden | N lille [B/E] · N K · S E | N lille [B/E] |
| B 4 3 2 / E K 9 5 | 275 | 3 | vist | 86,74 % | 2 · E fra hånden | N B [lille/E] · S E | N B [lille/E] · S høj |
| E K 2 / B 9 8 3 | 417 | 3 | vist | 77,05 % | 2 · E fra bordet | S B [lille/E] · N E · N K | S B [lille/E] · N høj |
| K 8 2 / E 10 9 3 | 420 | 3 | vist | 78,36 % | 3 · E som 3. hånd | N lille [10/E] · N K · N lille [lille/E] | N lille [10/E] |
| K 8 2 / E 10 9 3 | 420 | flest | anden | 2,80 stik | 3 · E som 3. hånd | N lille [10/E] · N K · N lille [lille/E] | N lille [10/E] |
| B 9 8 2 / E K 4 3 | 429 | flest | anden | 3,06 stik | 2 · E fra hånden | N B [lille/E] · S E | N B [lille/E] · S høj |
| B 3 2 / E K 9 8 4 | 454 | 4 | vist | 89,57 % | 2 · E fra hånden | N B [lille/E] · S E | N B [lille/E] · S høj |
| E K 2 / B 9 8 4 3 | 455 | 4 | vist | 84,78 % | 2 · E fra bordet | S B [lille/E] · N E | S B [lille/E] · N høj |
| B 2 / E K 9 8 3 | 468 | 4 | vist | 70,25 % | 2 · E fra hånden | N B [lille/E] · S E · S K | N B [lille/E] · S høj · S høj |
| D 2 / E 10 9 | 470 | flest | anden | 1,76 stik | 2 · E som 3. hånd | N lille [lille/E] · N D [lille/E] | N lille [lille/E] · N D [lille/høj] |
| B 3 2 / E K 9 8 | 532 | 3 | vist | 78,26 % | 2 · E fra hånden | N B [lille/E] · S E · S K | N B [lille/E] · S høj |
| B 2 / E D 9 8 | 566 | flest | anden | 2,69 stik | 3 · E fra hånden | N lille [D/E] · N B · S E | N lille [D/E] |
