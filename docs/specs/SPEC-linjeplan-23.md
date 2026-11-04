# SPEC-linjeplan-23

3. november 2026 · Franks opgave, skrevet ud af Claude Code 4. november 2026 · Bygget på grenen `linjeplan-23` (før: `v32-foer-linjeplan-23`). Godkendt af Frank og udgivet 4. november 2026.

Specen ændrer afgørelse 1 i SPEC-linjeformat-39.md (Franks valg 3. november 2026): de 23 linjer, der viser noget andet end løserens plan, rettes nu og venter ikke på punktet "Esset slås.".

## Kort fortalt

- **Reglen som skrevet** ("et trin skal følge løserens valg på alle grene, ellers slutter linjen før det", kørt på alle gemte linjer) rammer **124 linjer i 65 kombinationer, heraf 18 bedste**, og ikke 23 linjer i 17 kombinationer med 4 bedste.
- **De 23 er der:** præcis 23 af de 124 spilles forkert i dag, og alle 23 giver den gemte chance efter rettelsen. Tallene passer med specen for de 39: 17 kombinationer, 13 linjer for et mål og 10 for flest stik og de samme 4 bedste.
- **De andre 101 er ikke fejl:** de giver allerede den gemte chance, når de spilles som helhed. Her har løseren et andet valg på en gren, men linjens valg er lige så godt.
- **34 af de 101 ender uden trin:** de havde kun ét trin, og 9 af dem er bedste linjer.
- **Valget:** Frank valgte reglen som skrevet, så alle 124 linjer er rettet. Tekster, chancer og `pairs` er uændrede.

## Franks opgave

1. **Rettelsen:** tjekket fra de 39 ("et trin skal følge løserens valg på alle grene, ellers slutter linjen før det") køres på alle gemte linjer i `describeLine`, ikke kun på dem, linjeformatet afviser. Linjer, der allerede følger planen, er uændrede byte for byte.
2. **Forventet resultat:** de 23 linjer (17 kombinationer, 4 bedste) bliver ét trin kortere, og ingen andre linjer ændres. Bliver tallet et andet, stoppes der, og Frank får listen.
3. **Uændret:** teksterne (`steps`), chancerne (`value`, `exact`, `upper`, `certified`, `layouts`, `pairs`) og Hvad nu?. Stik pr. sidning må ændre sig på de berørte linjer, og Frank får tabellen.
4. **Banken:** kun de berørte kombinationer løses forfra, og banken samles med `--assemble`. `LINES_VERSION` bliver 5.
5. **Varig kontrol:** `scripts/tjek-linjer.ts` tæller også linjer, der spillet som helhed ikke giver den gemte chance. De 31 med `certified: false` og den ene inden for løserens tolerance er undtaget og står i en liste. En fast test i `npm test` dækker de 17 kombinationer.
6. **Accepttest:** se nedenfor.
7. **Løsningen, hvor 3. hånds kort skrives pr. gren,** tages sammen med "Esset slås." og skrives under Åbne punkter i SPEC-farvebehandling.md.

## Målingen

Målt 3. november 2026 på `main` (tagget `v32-foer-linjeplan-23`, bank med `LINES_VERSION` 4) med et midlertidigt script uden for repoet, kun i hukommelsen. Alle 657 kombinationer er regnet forfra (9 processer, godt 2 timer, 969 procesminutter). De 8.500 udspil gav samme tekst, samme trin og samme chance som banken, så forskellene nedenfor skyldes kun tjekket.

| Gruppe | Linjer | Kombinationer | Bedste | Spillet som helhed i dag | Efter tjekket | Trin | Stik pr. sidning ændret |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **A** | **23** | 17 | 4 | **forkert chance** | rigtig chance | 17 fra 2 til 1, 5 fra 3 til 2, 1 fra 3 til 1 | 12 linjer |
| **B** | 67 | 39 | 5 | rigtig chance | rigtig chance | 38 fra 3 til 2, 23 fra 2 til 1, 4 fra 3 til 1, 2 fra 4 til 3 | 5 linjer |
| **C** | 34 | 13 | 9 | rigtig chance | ingen trin tilbage | 34 fra 1 til 0 | 0 linjer |
| **I alt** | **124** | 65 | 18 | | | | |

Nogle kombinationer har linjer i flere grupper, så kombinationerne summer ikke til 65. Ingen af de 124 har `certified: false`, så de 31 undtagelser fra punkt 5 rammes ikke af tjekket.

Gruppe A afviger på ét punkt fra punkt 2: linjen 4 3 2 / B 10 8 5 (1 stik) bliver to trin kortere, ikke ét (se De 5 linjer, der blev to trin kortere, i bilaget).

### Eksempler

| Gruppe | Kombination | Mål | Linjen i dag | Efter tjekket |
| --- | --- | --- | --- | --- |
| A | 3 2 / B 10 5 4 | 1 stik | Lille fra bordet mod knægten (kipning); lægger Øst en honnør, lægges der lille. Lille fra begge hænder. Spillet som helhed 4,22 %, gemt 24,73 %. | Kun trin 1, og spillet som helhed 24,73 % |
| B | 4 3 2 / D 9 6 5 | 1 stik | Damen fra hånden; dækker Vest, lægges der lille, ellers løber den. Lille fra bordet mod 9'eren (kipning); lægger Øst en honnør, lægges der lille. Lille fra begge hænder. | Kun trin 1, og samme chance som før |
| C | D 10 / E K 4 3 2 | 4 stik | Esset slås. Lille fra hånden til damen. Trinet er esset fra hånden. | Ingen trin, og Spil den selv sammenligner kun første udspil |

Teksterne (`steps`) ændres ikke i nogen af grupperne, så i B og C ville der stå mere i teksten end i linjen, uden at chancen bliver bedre.

## Franks valg

Tjekket ramte 124 linjer og ikke de ventede 23, så arbejdet stoppede efter punkt 2, og Frank fik listen. **Frank valgte 4. november 2026 mulighed 2: reglen som skrevet.** Tallet i punkt 2 er derfor 124 linjer i 65 kombinationer med 18 bedste.

| | Mulighed 1: kun linjer, der spilles forkert | **Mulighed 2: reglen som skrevet (valgt)** |
| --- | --- | --- |
| Regel | Linjen afkortes kun, når den spillet som helhed ikke giver den gemte chance og heller ikke følger løserens valg | Linjen afkortes, når den ikke følger løserens valg |
| Linjer, der ændres | 23 (gruppe A) | **124** (grupperne A, B og C) |
| Bedste linjer, der ændres | 4 | 18 |
| Linjer uden trin bagefter | 0 | 34, heraf 9 bedste (1.526 linjer har allerede ingen trin i dag) |
| Stik pr. sidning ændret | 12 linjer | 17 linjer |
| Linjer, der tæller med i dommen i Spil den selv | 2 | 24 (2 + 11 + 11). Dommen læser kun linjer for et mål inden for 0,5 procentpoint af den bedste. Efter sidste trin er alt tilladt, og uden trin sammenlignes kun første udspil |
| Kombinationer, der løses forfra | 17 | 65 |
| Pris | Hver linje skal spilles som helhed, ca. 5 sekunder pr. linje i gennemsnit, så reglen kan kun køres, når banken bygges; kombinationer uden for banken i Analyse er som i dag | Billig, så samme regel gælder i banken og i browseren |

Reglen er strengere end nødvendigt, ligesom i Afklaret 4 i SPEC-linjeformat-39.md. Den koster 22 linjer en mildere dom i Spil den selv, og til gengæld gælder samme regel overalt, og den, der følger løserens lige så gode valg på en gren, kan ikke længere få "ikke fulgt" på de linjer.

## Afgrænsning

| Sted | Må ske | Må ikke ske |
| --- | --- | --- |
| `solver/describe.ts` | tjekket fra de 39 køres på alle linjer i `describeLine` | `describeFrom`, teksterne, hovedvejen |
| `scripts/solve.ts` | `LINES_VERSION` bliver 5 | resten |
| `content/solutions.json`, `suit-combinations.json`, `app/side-N.json` | `line` for de 124 linjer og `tricks` for de 17 linjer | alt andet, også chancerne og `pairs` |
| `content/linjer-side-N.md`, `teknikker.md`, `techniques.json`, `hvad-nu.*`, `validering-side-N.md`, `hyppighed.csv`, `kildefejl.json` | intet | de skal være byte for byte ens |
| `scripts/tjek-linjer.ts` | tæller også linjer, der spillet som helhed ikke giver den gemte chance, med listen over de 32 undtagelser | |
| `solver/linjeplan.test.ts` (ny) | fast test af de 65 kombinationer i `npm test` | |
| `SPEC-linjeformat-39.md`, `SPEC-farvebehandling.md`, `CLAUDE.md`, `docs/specs/README.md`, `../SYSTEM.md` | afgørelse 1 ændres, de 23 lukkes som åbent punkt, og løsningen pr. gren kommer under Åbne punkter | |

## Accepttest

Skrives først, som altid.

- [x] 3 2 / B 10 5 4 (1 stik): linjen giver 24,73 %, når den spilles som helhed.
- [x] Spil den selv giver "fulgt" til den, der følger løserens plan i 3 2 / B 10 5 4, og "ikke fulgt" til den, der ikke gør.
- [x] `node scripts/tjek-linjer.ts` finder 0 afviste linjer og 0 linjer uden for undtagelseslisten.
- [x] Præcis de 124 linjer i bilaget har andre trin, med det antal trin bilaget angiver, og præcis de 17 linjer har andre `tricks`.
- [x] **Chancerne er uændrede:** `value`, `exact`, `upper`, `certified`, `layouts` og `pairs` er ens for alle 8.500 udspil sammenlignet med tagget `v32-foer-linjeplan-23`, og det samme gælder Hvad nu?.
- [x] **Teksterne er uændrede:** `steps` er ens for alle 8.500 udspil, og rapporterne i afgrænsningen er byte for byte ens.
- [x] `npm test`, `node scripts/bog-regression.ts` og `node scripts/sprogtjek.ts` er grønne.

## Afklaret

1. **Målingen** blev startet i tråden fra 3. november og blev færdig, efter at tråden var stoppet. Resultatet er lagt sammen 4. november 2026.
2. **Resultatet af accepttesten mod tagget:** af 8.500 udspil er præcis de 124 linjer og `tricks` på de 17 linjer ændret. `pairs` er ens i alle 106 mål, og rapporterne er byte for byte ens. `node scripts/tjek-linjer.ts` finder 0 afviste af 6.940 linjer og 0 uden for listen, og alle 32 undtagelser er stadig nødvendige. Regressionen mod bogen består (120 af 120 tal). De 65 cases tog 22 minutter med 10 processer, og hele kontrollen 56 minutter.
3. **"Spilles forkert"** betyder, at linjen spillet som helhed afviger mere end 0,000001 fra den gemte chance. Grænsen afgør ikke noget: de 101 linjer i grupperne B og C afviger 0, og de 23 i gruppe A afviger mindst 0,0048. Den ene linje inden for løserens tolerance er ikke blandt de 124.
4. **Franks tjek før fletning** (4. november 2026): alle 34 linjer uden trin er kørt med appens rigtige komponenter. Teksten står på linjekortet og i facit på de 22 viste linjer for et mål; K 8 2 / E 10 9 3 (3 stik) med rollen "anden" vises ikke, og af de 11 linjer for flest stik kommer kun de 4 bedste med i appen, med teksten uændret. Den, der følger teksten, får "fulgt" på de 11 bedste og lige gode linjer for et mål, målt på 20 sidninger hver, og "ikke fulgt" på de 12 linjer, der ligger mere end 0,5 procentpoint under den bedste. Uden trin ser dommen kun på første udspil. I Chrome er tre linjer spillet efter teksten på hovedvejen: K B 9 2 / E 10 8 3 (4 stik, bedste), K 10 3 2 / E B 9 5 4 (5 stik, bedste) og D 9 3 2 / E K 10 4 (4 stik, lige god), alle med "fulgt". Som modprøve giver K 9 8 7 / E B 4 3 2 (4 stik, vist) "ikke fulgt". Skærmbillederne ligger i `skaermbilleder/linjeplan-23/` uden for repoet.
5. **Fundet under tjekket, ikke fra denne gren:** i Analyse på computer (fra 1000 px) lægger bordet i Spil den selv sig oven på resultatet, når der rulles, med op til 353 px ved 1280 × 900. Bordet står fast efter SPEC-bred-layout.md, men her står det over resultatet i samme spalte. Målingen er den samme på grenen og i den udgivne app, og grenen ændrer hverken CSS eller UI. Fejlen er ikke rettet her.

## Stik pr. sidning

Kun de 17 linjer har andre `tricks`, og de er målt i banken mod tagget. Ingen gennemsnit falder, for løseren spiller frit efter sidste trin. Gruppe C ændrer ingen.

| Kombination (bordet / hånden) | Mål | Gruppe | Stik i gennemsnit | Sidninger ændret |
| --- | --- | --- | --- | --- |
| 3 2 / B 10 5 4 | 1 stik | A | 0,04 → 0,25 | 4 af 20 |
| 2 / E B 9 8 4 3 | 4 stik | A | 3,20 → 3,40 | 6 af 24 |
| 4 3 2 / K 10 9 7 6 5 | 4 stik | A | 3,48 → 3,61 | 1 af 12 |
| 3 2 / E 10 9 8 5 4 | 4 stik | A | 3,74 → 3,83 | 1 af 12 |
| 5 4 3 2 / B 8 7 6 | 1 stik | A | 0,68 → 0,76 | 1 af 12 |
| 5 4 3 2 / D 10 9 7 6 | 3 stik | A | 2,42 → 2,48 | 1 af 12 |
| 4 3 2 / D 9 8 6 5 | 2 stik | A | 1,66 → 1,72 | 1 af 18 |
| 4 3 2 / B 10 8 5 | 1 stik | A | 0,44 → 0,49 | 1 af 24 |
| 3 2 / E 10 9 8 4 | 3 stik | B | 2,37 → 2,41 | 1 af 16 |
| 5 4 3 2 / K 10 7 6 | 1 stik | B | 0,87 → 0,91 | 1 af 18 |
| 4 3 2 / D 9 8 5 | 1 stik | A | 0,40 → 0,41 | 1 af 27 |
| 3 2 / E 10 9 5 4 | 2 stik | B | 2,28 → 2,29 | 2 af 16 |
| 3 2 / D 10 6 5 4 | 2 stik | B | 1,20 → 1,21 | 1 af 24 |
| 3 2 / B 10 8 4 | 1 stik | A | 0,08 → 0,09 | 1 af 32 |
| 3 2 / B 10 9 4 | 1 stik | A | 0,26 → 0,27 | 2 af 20 |
| 3 2 / D 10 5 4 | 1 stik | A | 0,02 → 0,02 | 1 af 30 |
| 4 3 2 / B 10 8 5 | 1 stik | B | 0,73 → 0,73 | 2 af 24 |

## Bilag: de 124 linjer

Stik i gennemsnit står kun for mål, hvor linjen har tal for stik.

Rollen følger linjekortene: "bedste" er målets bedste linje, "lige god" ligger inden for 0,5 procentpoint af den og tæller med i dommen i Spil den selv, "vist" er en af højst tre andre viste linjer, og "anden" vises ikke. For flest stik er rollen regnet på samme måde, men kun den bedste linje kommer med i appen, og linjer for flest stik tæller ikke i dommen.

### Gruppe A: de 23 linjer, der spilles forkert i dag

| Kombination (bordet / hånden) | Mål | Rolle | Gemt chance | Spillet i dag | Spillet efter | Trin | Stik i gennemsnit (sidninger ændret) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 3 2 / B 10 5 4 | 1 stik | bedste | 24,73 % | 4,22 % | 24,73 % | 2 → 1 | 0,04 → 0,25 (4 af 20) |
| 5 4 3 2 / B 8 7 6 | 1 stik | bedste | 76,30 % | 67,83 % | 76,30 % | 2 → 1 | 0,68 → 0,76 (1 af 12) |
| 5 4 3 2 / B 8 7 6 | flest stik | bedste | 0,76 stik | 0,68 stik | 0,76 stik | 2 → 1 | – |
| D B 9 / E 5 4 3 2 | flest stik | bedste | 3,85 stik | 3,72 stik | 3,85 stik | 2 → 1 | – |
| 2 / E B 9 8 4 3 | 4 stik | vist | 54,91 % | 35,53 % | 54,91 % | 3 → 2 | 3,20 → 3,40 (6 af 24) |
| 2 / E B 9 8 4 3 | flest stik | vist | 3,40 stik | 3,20 stik | 3,40 stik | 3 → 2 | – |
| 2 / K D 9 8 4 3 | flest stik | vist | 3,55 stik | 3,26 stik | 3,55 stik | 3 → 2 | – |
| 3 2 / E 10 9 8 5 4 | 4 stik | vist | 84,78 % | 76,30 % | 84,78 % | 2 → 1 | 3,74 → 3,83 (1 af 12) |
| 3 2 / E 10 9 8 5 4 | flest stik | vist | 3,83 stik | 3,74 stik | 3,83 stik | 2 → 1 | – |
| 3 2 / B 10 8 4 | 1 stik | vist | 8,88 % | 7,99 % | 8,88 % | 2 → 1 | 0,08 → 0,09 (1 af 32) |
| 3 2 / B 10 9 4 | 1 stik | vist | 26,91 % | 26,18 % | 26,91 % | 2 → 1 | 0,26 → 0,27 (2 af 20) |
| 3 2 / B 10 9 4 | flest stik | vist | 0,27 stik | 0,26 stik | 0,27 stik | 2 → 1 | – |
| 3 2 / D 10 5 4 | 1 stik | vist | 2,26 % | 1,78 % | 2,26 % | 2 → 1 | 0,02 → 0,02 (1 af 30) |
| 3 2 / D 10 8 4 | 1 stik | anden | 12,76 % | 11,87 % | 12,76 % | 2 → 1 | – |
| 4 3 2 / B 10 8 5 | 1 stik | vist | 48,85 % | 44,01 % | 48,85 % | 3 → 1 | 0,44 → 0,49 (1 af 24) |
| 4 3 2 / K 10 9 7 6 5 | 4 stik | vist | 65,57 % | 53,13 % | 65,57 % | 2 → 1 | 3,48 → 3,61 (1 af 12) |
| 4 3 2 / D 9 8 5 | 1 stik | vist | 41,18 % | 39,57 % | 41,18 % | 3 → 2 | 0,40 → 0,41 (1 af 27) |
| 4 3 2 / D 9 8 5 | flest stik | vist | 0,41 stik | 0,40 stik | 0,41 stik | 3 → 2 | – |
| 4 3 2 / D 9 8 6 5 | 2 stik | vist | 73,48 % | 67,83 % | 73,48 % | 2 → 1 | 1,66 → 1,72 (1 af 18) |
| 5 4 3 2 / B 8 7 6 | flest stik | lige god | 0,76 stik | 0,68 stik | 0,76 stik | 2 → 1 | – |
| 5 4 3 2 / D 10 9 7 6 | 3 stik | vist | 53,13 % | 46,91 % | 53,13 % | 2 → 1 | 2,42 → 2,48 (1 af 12) |
| B 2 / E D 9 5 4 3 | flest stik | vist | 4,86 stik | 4,72 stik | 4,86 stik | 2 → 1 | – |
| B 2 / E D 9 8 4 3 | flest stik | lige god | 4,98 stik | 4,76 stik | 4,98 stik | 2 → 1 | – |

### Gruppe B: linjer, der allerede giver den gemte chance og bliver kortere

| Kombination (bordet / hånden) | Mål | Rolle | Gemt chance | Spillet i dag | Spillet efter | Trin | Stik i gennemsnit (sidninger ændret) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2 / K D B 9 4 3 | 5 stik | bedste | 51,68 % | 51,68 % | 51,68 % | 3 → 2 | 4,38 → 4,38 (0 af 20) |
| 2 / K D B 9 4 3 | flest stik | bedste | 4,38 stik | 4,38 stik | 4,38 stik | 3 → 2 | – |
| 4 3 2 / B 10 6 5 | 1 stik | bedste | 67,76 % | 67,76 % | 67,76 % | 2 → 1 | 0,68 → 0,68 (0 af 16) |
| 4 3 2 / B 10 8 5 | 1 stik | bedste | 72,61 % | 72,61 % | 72,61 % | 2 → 1 | 0,73 → 0,73 (2 af 24) |
| 5 4 3 2 / B 10 7 6 | 1 stik | bedste | 83,91 % | 83,91 % | 83,91 % | 2 → 1 | 0,84 → 0,84 (0 af 12) |
| – / E K B 10 2 | 4 stik | vist | 32,72 % | 32,72 % | 32,72 % | 4 → 3 | 3,33 → 3,33 (0 af 16) |
| – / E K B 10 2 | flest stik | vist | 3,33 stik | 3,33 stik | 3,33 stik | 4 → 3 | – |
| 2 / E B 9 8 4 3 | 4 stik | vist | 45,22 % | 45,22 % | 45,22 % | 3 → 2 | 3,28 → 3,28 (0 af 24) |
| 2 / E B 9 8 4 3 | flest stik | anden | 3,28 stik | 3,28 stik | 3,28 stik | 3 → 2 | – |
| 2 / E B 10 8 4 3 | 4 stik | vist | 64,60 % | 64,60 % | 64,60 % | 3 → 2 | 3,55 → 3,55 (0 af 24) |
| 2 / E B 10 9 3 | 3 stik | vist | 63,63 % | 63,63 % | 63,63 % | 3 → 2 | 2,64 → 2,64 (0 af 18) |
| 2 / E B 10 9 3 | flest stik | vist | 2,64 stik | 2,64 stik | 2,64 stik | 3 → 2 | – |
| 2 / E D B 9 3 | 3 stik | vist | 71,86 % | 71,86 % | 71,86 % | 3 → 2 | 2,99 → 2,99 (0 af 24) |
| 2 / E D B 9 3 | 3 stik | anden | 71,86 % | 71,86 % | 71,86 % | 3 → 2 | – |
| 2 / E D B 9 4 3 | 5 stik | vist | 51,68 % | 51,68 % | 51,68 % | 3 → 2 | 4,37 → 4,37 (0 af 20) |
| 2 / E D B 9 4 3 | flest stik | vist | 4,37 stik | 4,37 stik | 4,37 stik | 3 → 2 | – |
| 2 / E D B 9 8 3 | 5 stik | vist | 54,10 % | 54,10 % | 54,10 % | 3 → 2 | 4,53 → 4,53 (0 af 20) |
| 2 / E D B 9 8 3 | flest stik | vist | 4,53 stik | 4,53 stik | 4,53 stik | 3 → 2 | – |
| 2 / K D B 9 4 3 | 5 stik | lige god | 51,68 % | 51,68 % | 51,68 % | 3 → 2 | 4,37 → 4,37 (0 af 20) |
| 2 / K D B 9 4 3 | flest stik | vist | 4,37 stik | 4,37 stik | 4,37 stik | 3 → 2 | – |
| 2 / D B 10 8 | flest stik | vist | 1,22 stik | 1,22 stik | 1,22 stik | 3 → 2 | – |
| 3 2 / E 10 6 5 4 | 3 stik | lige god | 35,53 % | 35,53 % | 35,53 % | 2 → 1 | 2,20 → 2,20 (0 af 16) |
| 3 2 / E 10 6 5 4 | flest stik | lige god | 2,20 stik | 2,20 stik | 2,20 stik | 2 → 1 | – |
| 3 2 / E 10 9 5 4 | 2 stik | vist | 87,61 % | 87,61 % | 87,61 % | 2 → 1 | 2,28 → 2,29 (2 af 16) |
| 3 2 / E 10 9 7 6 5 4 | 6 stik | lige god | 40,70 % | 40,70 % | 40,70 % | 2 → 1 | 5,31 → 5,31 (0 af 8) |
| 3 2 / E 10 9 7 6 5 4 | flest stik | vist | 5,31 stik | 5,31 stik | 5,31 stik | 2 → 1 | – |
| 3 2 / E 10 9 8 4 | 3 stik | vist | 45,22 % | 45,22 % | 45,22 % | 3 → 1 | 2,37 → 2,41 (1 af 16) |
| 3 2 / D 10 6 5 4 | 2 stik | vist | 35,53 % | 35,53 % | 35,53 % | 2 → 1 | 1,20 → 1,21 (1 af 24) |
| 4 3 2 / E D B 5 | 3 stik | vist | 35,53 % | 35,53 % | 35,53 % | 3 → 2 | 2,36 → 2,36 (0 af 12) |
| 4 3 2 / E D B 5 | flest stik | vist | 2,36 stik | 2,36 stik | 2,36 stik | 3 → 2 | – |
| 4 3 2 / E 10 6 5 | flest stik | vist | 1,36 stik | 1,36 stik | 1,36 stik | 3 → 2 | – |
| 4 3 2 / K 9 8 7 | 1 stik | vist | 52,48 % | 52,48 % | 52,48 % | 3 → 2 | 0,52 → 0,52 (0 af 24) |
| 4 3 2 / K 9 8 7 | flest stik | vist | 0,52 stik | 0,52 stik | 0,52 stik | 3 → 2 | – |
| 4 3 2 / K 10 9 6 5 | 2 stik | vist | 87,61 % | 87,61 % | 87,61 % | 2 → 1 | 1,98 → 1,98 (0 af 18) |
| 4 3 2 / D 9 6 5 | 1 stik | vist | 37,95 % | 37,95 % | 37,95 % | 3 → 1 | 0,38 → 0,38 (0 af 27) |
| 4 3 2 / D 9 8 7 | 1 stik | vist | 43,60 % | 43,60 % | 43,60 % | 3 → 2 | 0,44 → 0,44 (0 af 27) |
| 4 3 2 / D 10 7 6 5 | 2 stik | vist | 81,96 % | 81,96 % | 81,96 % | 2 → 1 | 1,80 → 1,80 (0 af 18) |
| 4 3 2 / D 10 9 5 | 1 stik | vist | 78,66 % | 78,66 % | 78,66 % | 2 → 1 | 0,80 → 0,80 (0 af 24) |
| 4 3 2 / D 10 9 6 5 | 2 stik | vist | 84,78 % | 84,78 % | 84,78 % | 2 → 1 | 1,86 → 1,86 (0 af 18) |
| 5 4 3 2 / B 10 7 6 | 1 stik | lige god | 83,91 % | 83,91 % | 83,91 % | 2 → 1 | 0,84 → 0,84 (0 af 12) |
| 5 4 3 2 / K 10 7 6 | 1 stik | vist | 83,91 % | 83,91 % | 83,91 % | 2 → 1 | 0,87 → 0,91 (1 af 18) |
| 5 4 3 2 / D 10 7 6 | 1 stik | lige god | 83,91 % | 83,91 % | 83,91 % | 2 → 1 | 0,84 → 0,84 (0 af 18) |
| E 2 / D B 9 4 3 | 4 stik | vist | 58,14 % | 58,14 % | 58,14 % | 3 → 2 | 3,46 → 3,46 (0 af 20) |
| E 2 / D B 9 4 3 | flest stik | vist | 3,46 stik | 3,46 stik | 3,46 stik | 3 → 2 | – |
| E 2 / D B 9 8 7 | 4 stik | vist | 60,56 % | 60,56 % | 60,56 % | 3 → 1 | 3,61 → 3,61 (0 af 20) |
| E 2 / D B 9 8 7 | flest stik | vist | 3,61 stik | 3,61 stik | 3,61 stik | 3 → 1 | – |
| E 4 3 2 / D B 9 5 | 3 stik | lige god | 89,57 % | 89,57 % | 89,57 % | 2 → 1 | 2,90 → 2,90 (0 af 16) |
| E 4 3 2 / D B 9 5 | flest stik | vist | 2,90 stik | 2,90 stik | 2,90 stik | 2 → 1 | – |
| E D 2 / B 5 4 3 | 3 stik | vist | 35,53 % | 35,53 % | 35,53 % | 3 → 2 | 2,36 → 2,36 (0 af 12) |
| E D 2 / B 5 4 3 | flest stik | vist | 2,36 stik | 2,36 stik | 2,36 stik | 3 → 2 | – |
| E D 2 / B 9 4 3 | 3 stik | vist | 60,90 % | 60,90 % | 60,90 % | 3 → 2 | 2,61 → 2,61 (0 af 20) |
| E D 2 / B 9 4 3 | 3 stik | vist | 61,77 % | 61,77 % | 61,77 % | 3 → 2 | 2,62 → 2,62 (0 af 20) |
| E D 2 / B 9 4 3 | flest stik | anden | 2,61 stik | 2,61 stik | 2,61 stik | 3 → 2 | – |
| E D 2 / B 9 4 3 | flest stik | vist | 2,62 stik | 2,62 stik | 2,62 stik | 3 → 2 | – |
| E D 2 / B 9 8 3 | 3 stik | anden | 61,65 % | 61,65 % | 61,65 % | 3 → 2 | – |
| E D 2 / B 9 8 3 | 3 stik | anden | 61,77 % | 61,77 % | 61,77 % | 3 → 2 | – |
| E D 2 / B 9 8 3 | flest stik | anden | 2,62 stik | 2,62 stik | 2,62 stik | 3 → 2 | – |
| E D 2 / B 9 8 3 | flest stik | anden | 2,62 stik | 2,62 stik | 2,62 stik | 3 → 2 | – |
| E D 2 / B 9 8 7 | 3 stik | anden | 61,65 % | 61,65 % | 61,65 % | 3 → 2 | – |
| E D 2 / B 9 8 7 | 3 stik | vist | 61,77 % | 61,77 % | 61,77 % | 3 → 2 | 2,62 → 2,62 (0 af 20) |
| E D 2 / B 9 8 7 | flest stik | vist | 2,62 stik | 2,62 stik | 2,62 stik | 3 → 2 | – |
| E D 2 / B 9 8 7 | flest stik | vist | 2,62 stik | 2,62 stik | 2,62 stik | 3 → 2 | – |
| K 3 2 / E 10 9 5 4 | 4 stik | lige god | 87,61 % | 87,61 % | 87,61 % | 2 → 1 | 3,89 → 3,89 (0 af 12) |
| K 8 2 / E 10 9 3 | 3 stik | vist | 78,36 % | 78,36 % | 78,36 % | 2 → 1 | 2,80 → 2,80 (0 af 15) |
| K 8 2 / E 10 9 3 | flest stik | vist | 2,80 stik | 2,80 stik | 2,80 stik | 2 → 1 | – |
| K 9 2 / E 10 5 4 3 | 4 stik | anden | 81,96 % | 81,96 % | 81,96 % | 2 → 1 | – |
| K 9 3 2 / E 10 5 4 | 3 stik | vist | 83,91 % | 83,91 % | 83,91 % | 2 → 1 | 2,87 → 2,87 (0 af 12) |

### Gruppe C: linjer med ét trin, der allerede giver den gemte chance og ender uden trin

| Kombination (bordet / hånden) | Mål | Rolle | Gemt chance | Spillet i dag | Spillet efter | Trin | Stik i gennemsnit (sidninger ændret) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| E B 10 2 / K 9 6 5 4 3 | 6 stik | bedste | 89,00 % | 89,00 % | ingen linje | 1 → 0 | 5,89 → 5,89 (0 af 6) |
| E B 10 2 / K 9 6 5 4 3 | flest stik | bedste | 5,89 stik | 5,89 stik | ingen linje | 1 → 0 | – |
| K 3 2 / E 10 9 5 4 | 3 stik | bedste | 98,04 % | 98,04 % | ingen linje | 1 → 0 | 3,95 → 3,95 (0 af 12) |
| K B 9 2 / E 10 8 3 | 4 stik | bedste | 52,83 % | 52,83 % | ingen linje | 1 → 0 | 3,53 → 3,53 (0 af 10) |
| K B 9 2 / E 10 8 3 | flest stik | bedste | 3,53 stik | 3,53 stik | ingen linje | 1 → 0 | – |
| K 10 3 2 / E B 9 5 4 | 5 stik | bedste | 57,91 % | 57,91 % | ingen linje | 1 → 0 | 4,58 → 4,58 (0 af 8) |
| K 10 3 2 / E B 9 5 4 | flest stik | bedste | 4,58 stik | 4,58 stik | ingen linje | 1 → 0 | – |
| K 10 4 3 2 / E B 9 6 5 | 5 stik | bedste | 89,00 % | 89,00 % | ingen linje | 1 → 0 | 4,89 → 4,89 (0 af 6) |
| K 10 4 3 2 / E B 9 6 5 | flest stik | bedste | 4,89 stik | 4,89 stik | ingen linje | 1 → 0 | – |
| 9 2 / E B 8 4 3 | 4 stik | vist | 0,00 % | 0,00 % | ingen linje | 1 → 0 | 2,41 → 2,41 (0 af 24) |
| E B 10 2 / K 9 6 5 4 3 | 6 stik | lige god | 89,00 % | 89,00 % | ingen linje | 1 → 0 | 5,89 → 5,89 (0 af 6) |
| E B 10 2 / K 9 6 5 4 3 | flest stik | lige god | 5,89 stik | 5,89 stik | ingen linje | 1 → 0 | – |
| K 4 3 2 / E 10 9 8 | 3 stik | vist | 89,57 % | 89,57 % | ingen linje | 1 → 0 | 2,99 → 2,99 (0 af 12) |
| K 4 3 2 / E 10 9 8 | 3 stik | vist | 89,57 % | 89,57 % | ingen linje | 1 → 0 | 2,99 → 2,99 (0 af 12) |
| K 8 2 / E 10 9 3 | 3 stik | vist | 77,61 % | 77,61 % | ingen linje | 1 → 0 | 2,82 → 2,82 (0 af 15) |
| K 8 2 / E 10 9 3 | 3 stik | anden | 71,80 % | 71,80 % | ingen linje | 1 → 0 | – |
| K 9 / E 10 4 3 2 | 3 stik | vist | 83,98 % | 83,98 % | ingen linje | 1 → 0 | 3,23 → 3,23 (0 af 15) |
| K 9 / E 10 5 4 3 2 | 4 stik | vist | 96,09 % | 96,09 % | ingen linje | 1 → 0 | 4,71 → 4,71 (0 af 12) |
| K 9 / E 10 5 4 3 2 | 5 stik | vist | 67,83 % | 67,83 % | ingen linje | 1 → 0 | 4,71 → 4,71 (0 af 12) |
| K 9 8 7 / E B 4 3 2 | 4 stik | vist | 95,22 % | 95,22 % | ingen linje | 1 → 0 | 4,53 → 4,53 (0 af 12) |
| K 9 8 7 / E B 4 3 2 | 4 stik | lige god | 100,00 % | 100,00 % | ingen linje | 1 → 0 | 4,53 → 4,53 (0 af 12) |
| K B 9 2 / E 10 8 3 | 4 stik | lige god | 52,83 % | 52,83 % | ingen linje | 1 → 0 | 3,53 → 3,53 (0 af 10) |
| K B 9 2 / E 10 8 3 | flest stik | lige god | 3,53 stik | 3,53 stik | ingen linje | 1 → 0 | – |
| K 10 3 2 / E B 9 5 4 | 5 stik | lige god | 57,91 % | 57,91 % | ingen linje | 1 → 0 | 4,58 → 4,58 (0 af 8) |
| K 10 3 2 / E B 9 5 4 | flest stik | lige god | 4,58 stik | 4,58 stik | ingen linje | 1 → 0 | – |
| K 10 4 3 2 / E B 9 6 5 | 5 stik | lige god | 89,00 % | 89,00 % | ingen linje | 1 → 0 | 4,89 → 4,89 (0 af 6) |
| K 10 4 3 2 / E B 9 6 5 | flest stik | lige god | 4,89 stik | 4,89 stik | ingen linje | 1 → 0 | – |
| D 9 3 2 / E K 10 4 | 4 stik | vist | 86,74 % | 86,74 % | ingen linje | 1 → 0 | 3,87 → 3,87 (0 af 10) |
| D 9 3 2 / E K 10 4 | 4 stik | lige god | 88,70 % | 88,70 % | ingen linje | 1 → 0 | 3,89 → 3,89 (0 af 10) |
| D 9 3 2 / E K 10 4 | flest stik | vist | 3,87 stik | 3,87 stik | ingen linje | 1 → 0 | – |
| D 9 3 2 / E K 10 4 | flest stik | lige god | 3,89 stik | 3,89 stik | ingen linje | 1 → 0 | – |
| D 10 / E K 4 3 2 | 4 stik | vist | 83,98 % | 83,98 % | ingen linje | 1 → 0 | 4,20 → 4,20 (0 af 12) |
| D 10 / E K 4 3 2 | 5 stik | vist | 35,53 % | 35,53 % | ingen linje | 1 → 0 | 4,20 → 4,20 (0 af 12) |
| D 10 / E K 4 3 2 | flest stik | vist | 4,20 stik | 4,20 stik | ingen linje | 1 → 0 | – |

### De 5 linjer, der blev to trin kortere

Linjen slutter før det første trin, der ikke følger løserens valg på alle grene. I alle fem er det trin 2, og trin 3 kommer efter trin 2, så det forsvinder med. Trin 1 følger løseren på alle grene i alle fem, og linjen giver den gemte chance bagefter.

| Kombination (bordet / hånden) | Mål | Rolle | Gruppe | Trin | Grenen, hvor løseren vælger noget andet i trin 2 |
| --- | --- | --- | --- | --- | --- |
| 4 3 2 / D 9 6 5 | 1 stik | vist | B | 3 → 1 | Vest dækker damen, og Øst lægger den anden af esset og kongen. Lægger Øst så 7'eren eller 8'eren i trin 2, lægger løseren lille (5'eren eller 6'eren), hvor trinet siger 9'eren. |
| 4 3 2 / B 10 8 5 | 1 stik | vist | A | 3 → 1 | Vest lægger en honnør i første runde. Lægger Øst så 9'eren eller lavere i trin 2, lægger løseren 8'eren, hvor trinet siger knægten (3 grene). Linjen er den ene af de 23 i gruppe A med to trin mindre: den gav 44,01 % som helhed mod de gemte 48,85 %. |
| E 2 / D B 9 8 7 | 4 stik | vist | B | 3 → 1 | Esset slås i trin 2, og Øst lægger 10'eren. Løseren lægger sin honnør fra hånden, hvor trinet kun har lille som 3. hånds kort. |
| E 2 / D B 9 8 7 | flest stik | vist | B | 3 → 1 | Samme gren som for 4 stik. |
| 3 2 / E 10 9 8 4 | 3 stik | vist | B | 3 → 1 | En honnør falder under esset i trin 1. Lægger Øst så et lavt kort i trin 2, lægger løseren et af 8'eren, 9'eren og 10'eren, hvor trinet siger lille (2 grene). |
