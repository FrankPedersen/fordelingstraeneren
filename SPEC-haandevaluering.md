# SPEC-håndevaluering

8. oktober 2026 · Frank · version 2, rettet efter Claude Codes spørgsmål

Håndevaluering træner at vurdere egen og makkers hånd og at træffe niveaubeslutningen: delkontrakt, udgang, lilleslem eller storeslem. Sporet bygges på Franks datadrevne P-model (MODEL.md) som et nyt, selvstændigt spor i fordelingstræneren, i gruppen Vurdering. Opgaven bygges efter Pointregnskabet, temaet og navigationen.

Claude Codes gennemgang (7. oktober 2026) og valg under bygningen (8. oktober 2026) er skrevet ind, hvor denne version ikke havde dem: rækkerne i Afgrænsning for meldegiveren, `App.tsx`, vejledningen og sprog, afsnittet Sprog og hjælp med to accepttest, `hasStopper`, talpanelet, facit i opgave 6 og 8, Leitner-bunken, Afklaret og Claude Codes valg til sidst.

## Afgrænsning

Før arbejdet starter:

1. Commit og tag den nuværende app, fx `v6-foer-haandevaluering`.
2. Arbejd på grenen `haandevaluering`, og flet først ind efter godkendelse.
3. Kør alle eksisterende tests før og efter. De skal bestå uændret.

| Sted | Må ske | Må ikke ske |
| --- | --- | --- |
| Ny mappe `src/haandevaluering/` | hele sporet | — |
| `docs/MODEL.md` | MODEL.md lægges i repoet som kilde | ændres uden Franks godkendelse |
| Motor (`src/engine/`) | bruges som bibliotek: Leitner, streak, XP, datoer, PRNG og kombinatorik | ændres |
| Kortgiveren og mønstrene (`src/domain/`) | bruges som bibliotek | ændres |
| Systemfilen (`src/system/dk-2over1.json`) | læses for meldingernes hp-intervaller | ændres |
| Meldegiveren (`src/system/interpreter.ts`) | kaldes som bibliotek, fx `hasStopper` og `chooseCall` | ændres |
| `src/app/tracks.ts` | én ny linje: Håndevaluering i gruppen Vurdering; Vurderings ⓘ-tekst i `GROUPS` skrives færdig | ændre andre linjer |
| `src/app/App.tsx` | en dovent indlæst rute til sporet og `onOpen` til forsiden, som for Pointregnskab | ændre andre ruter |
| Vejledningen (`src/app/screens/GuideScreen.tsx`) | et nyt afsnit om sporet på begge sprog | ændre de eksisterende afsnit |
| Sprog og hjælp (`src/i18n.ts`, `src/ui/Info.tsx`) | bruges som bibliotek | ændres |
| Lagring | ny nøgle `haandevaluering:v1` | læse eller skrive andre nøgler |
| Designtokens | eksisterende tokens efter SPEC-tema | nye tokens uden behov |

Kræver noget alligevel en ændring i eksisterende kode, skal Claude Code stoppe og spørge.

Besked til Claude Code:

> Byg Håndevaluering som et nyt, selvstændigt spor efter SPEC-haandevaluering.md og docs/MODEL.md. Eksisterende spor, motoren, kortgiveren og systemfilen må ikke ændres; i appen kun de steder, tabellen nævner. Kør de eksisterende tests før og efter; de skal alle bestå uændret.

## Formål og placering

- **Formål:** brugeren lærer at regne sin hånd rigtigt, at vide *hvornår* fordelingen må lægges til, og at træffe niveaubeslutningen ud fra parrets samlede styrke.
- **Placering:** fordelingstræneren, gruppen Vurdering. Gruppen vises på forsiden, så snart sporets linje står i `tracks.ts`. Konventionstræneren bruger P-modellen til at generere hænder og forklare facit, men træner den ikke.
- **To skalaer:** meldinger følger systemets HCP-grænser (4-3-2-1). P bruges til niveaubeslutninger, når fitten er fundet. Sans har sin egen model.
- **Sprog:** dansk og engelsk som resten af appen (se Sprog og hjælp).

## Fagligt grundlag

Alle konstanter kommer fra MODEL.md og ligger i `src/haandevaluering/content/p-model.json` med henvisning til afsnittet i MODEL.md. Det er empiriske modelværdier, ikke sandsynligheder, så de må stå som data; regnereglerne udføres i koden. CLAUDE.md har en udtrykkelig undtagelse fra reglen "intet tal tastes ind" for denne fil.

**1. Farvekontrakt med bekræftet 8+ fit**

```text
p = honnørpoint
  + 1½ pr. trumf ud over 4 (kun egen hånd)
  + kortfarvepoint: renonce 5, singleton 3, dobbeltton 1 (begge hænder, kun i sidefarverne)
  − 1 pr. konge over for makkers viste korthed

honnørpoint = 5·E + 3·K + 1½·D + ½·B + ¼·10
            = HCP + 1 pr. es − ½ pr. dame − ½ pr. knægt + ¼ pr. tier
P = din p + makkers p
stik ≈ 0,31 × P + 0,75
```

Fordelingsleddene (trumflængde og kortfarvepoint) må først lægges til, når fitten er bekræftet. Kortfarvepoint tælles kun i sidefarverne: en kort trumffarve (fx dobbeltton i en 6-2-fit eller singleton i en 7-1-fit) giver ingen stjælestik og tæller derfor ikke.

**Stikforventning:** appen bruger tabellen nedenfor med lineær interpolation mellem rækkerne, så forventningen aldrig springer. Formlen 0,31 × P + 0,75 bruges kun i forklaringer. Opgaver laves kun for P mellem 24 og 40.

**2. Grænser og chancer**

| P | Gns. stik | 4M holder | 6M | 7M |
| --- | --- | --- | --- | --- |
| 24 | 8,1 | 7 % | – | – |
| 26 | 8,8 | 22 % | – | – |
| 28½ | 9,4 | 50 % | 1 % | – |
| 30 | 10,0 | 74 % | 4 % | – |
| 32 | 10,6 | 91 % | 13 % | 1 % |
| 34 | 11,1 | 98 % | 33 % | 5 % |
| 36 | 11,7 | 99 % | 64 % | 13 % |
| 38 | 11,9 | 99 % | 74 % | 24 % |
| 40 | 12,3 | 100 % | 90 % | 44 % |

Udgang ved P ≥ 28½, lilleslem ved P ≥ 35 og storeslem ved P ≥ 41, slem med kontroltjek. Mellem tabellens rækker interpoleres lineært. Storeslemsgrænsen ligger over tabellen; der bruges sidste række. Opgave 4 har P højst 37 (Afklaret 14), så storeslem er aldrig det rigtige svar i første version.

**3. Hvad makker skal have til udgang:** 12 → 16½, 14 → 14½, 16 → 12½, 18 → 10½, 21 → 7½, 24 → 4½ (P = 28½).

**4. Sanskontrakt – en anden model:** point = HCP + ¼ pr. tier, ingen længde- og fladhedspoint. Stoppere tjekkes i alle fire farver med meldegiverens definition (`hasStopper`: es, konge med mindst ét kort ved siden, dame tredje eller knægt fjerde): ved 24–26 HCP holder 3NT i 31 % med 3 stoppede farver og 60 % med 4.

**5. Farve eller sans:** med 8 trumf giver farvekontrakten 2,2 stik mere end sans, med 9 trumf 3,0 og med 10 trumf 3,8. Fit først.

**6. Zar Points som sammenligning:** ZP = HCP + kontroller (es 2, konge 1) + (a + b) + (a − d), hvor a ≥ b ≥ c ≥ d er farvelængderne. Zar åbner ved 26 og regner udgang ved 52. Ifølge MODEL.md forklarer Zar mindre end P (R² 0,730 mod 0,794), åbner 46 % af hænderne mod 35 % med HCP ≥ 12, og Zars stikformel lover ca. ét stik for meget. Zar bruges kun i øvelsen "Sammenlign metoder".

**7. Kortfarvepoint pr. mønster** (koblingen til fordelingssporet):

| Mønster | Kortfarvepoint | Mønster | Kortfarvepoint |
| --- | --- | --- | --- |
| 4-3-3-3 | 0 | 6-4-2-1 | 4 |
| 4-4-3-2 | 1 | 6-3-3-1 | 3 |
| 5-3-3-2 | 1 | 5-5-2-1 | 4 |
| 5-4-3-1 | 3 | 4-4-4-1 | 3 |
| 5-4-2-2 | 2 | 7-3-2-1 | 4 |
| 6-3-2-2 | 2 | 6-4-3-0, 5-4-4-0 | 5 |

Tabellen beregnes i koden af mønstrene i `src/domain/` (alle 39 mønstre; de 13 i tabellen er dem, Leitner-bunken bruger). Den gælder hele mønstret; i p tælles trumffarven ikke med.

**Afklarede faglige valg** (Franks godkendelse 5. oktober 2026; ændres kun efter aftale):

1. **HCP i meldinger, P i vurderingen:** meldeintervaller er HCP; P bruges til niveaubeslutninger efter fit.
2. **Makkers styrke:** i første version er begge hænder synlige, så valgene er delkontrakt, udgang, lilleslem og storeslem. Invit giver kun mening, når makkers hånd ikke er kendt, og kommer i version 2 sammen med opgaver, hvor makkers p skal skønnes ud fra hans meldinger.
3. **Dobbeltdummy-skævhed:** grænserne bruges som i MODEL.md. Forbeholdet (0,2–0,3 stik optimistisk) vises i forklaringen.
4. **Turneringsform og zone:** et avanceret niveau. Ved IMP i zonen er udgang rigtig fra ca. 37 % chance (P ≈ 27½), uden for zonen fra ca. 45 % (P ≈ 28), ved parturnering ved 50 % (P = 28½).
5. **Kontroltjek ved slem:** simpelt i første version. Lilleslem kræver, at parret højst mangler ét es; storeslem kræver alle fire es og trumfkongen. Kontrolspørgsmål som konventioner trænes i konventionstræneren.

## Øvelser og niveauer

1. **Honnørpoint:** en hånd vises; brugeren taster honnørpointene (genvejen må bruges). Lynøvelse. Tastaturet har ½ og ¼ (fx 12¾), så sporet får sit eget talpanel; appens fælles talpanel ændres ikke.
2. **Fordelingsled:** fitten er bekræftet; "Hvad er din p nu?" med trumflængde og kortfarvepoint.
3. **Må det lægges til?** Et kort meldeforløb vises; brugeren vælger, hvilke led der gælder: kun honnørpoint, honnørpoint + fordeling, eller sansmodellen.
4. **Niveaubeslutningen:** begge hænder vises med bekræftet fit; brugeren vælger delkontrakt, udgang, lilleslem eller storeslem. Facit viser P, stikforventning og chancen som naturlig frekvens, fx "4♠ holder ca. 3 ud af 5 gange".
5. **Hvad makker skal have:** "Du har 16. Hvad skal makker have til udgang?"
6. **Farve eller sans:** to hænder med 8+ fit og/eller stoppere; brugeren vælger 4M eller 3NT. Facit (Claude Codes valg): 4M, når der er en 8+ major-fit ("Fit først"); 3NT, når der ikke er en major-fit og alle fire farver er stoppede.
7. **Spildte værdier:** makker har vist korthed; brugeren regner p igen. Kun kongen koster.
8. **Sammenlign metoder:** samme hånd regnet med HCP, Zar og P; brugeren vælger, hvilken der giver den rigtige kontrakt, og facit forklarer hvorfor. I første version er "den rigtige kontrakt" P-modellens beslutning; med dobbeltdummy-facit i version 2 bliver den fordelingens faktiske resultat. HCP-metoden bruger udgangsgrænsen fra Franks simulering (se Åbne punkter); indtil den er afklaret, bruges 25 HCP.
9. **Turneringsform:** som opgave 4, men med zone og IMP eller parturnering.

| Niveau | Indhold |
| --- | --- |
| 1 | opgave 1 og 5 |
| 2 | opgave 2 og 3 |
| 3 | opgave 4 og 7 |
| 4 | opgave 6 og 8 |
| 5 | opgave 9 og blandede opgaver |

Sværheden tilpasses efter de seneste 20 svar: over 90 % rigtige rykker et niveau op, under 80 % ét ned.

## Husketeknikker

- **Ankre:** udgang, slem, storeslem = 28½ – 35 – 41.
- **Stik ≈ P/3** som huskeversion. Den ligger inden for 0,2 stik af tabellen fra P = 24 til 32.
- **Genvejen:** HCP + 1 pr. es − ½ pr. dame − ½ pr. knægt + ¼ pr. tier.
- **Korthed:** 5-3-1 og tælles i begge hænder.
- **Tre huskeregler:** "Fit først", "Kun kongen spildes" og "Sans tæller stoppere, ikke længde".
- **Kobling til fordeling:** kortfarvepoint pr. mønster trænes som en lille Leitner-bunke sammen med nøgletallene. Bunken (Claude Codes valg, 30 kort): de 13 mønstre i tabellen, ankrene (28½, 35, 41), stikforventningen, genvejens fire led, korthed 5-3-1 og de seks rækker i tabellen over, hvad makker skal have.

## Generator

1. **Fordelinger:** motorens kortgiver med seedbar PRNG. Farveopgaver kræver 8+ fit i en major; sansopgaver kræver ingen major-fit og to balancerede hænder. Øvelserne viser ingen hyppigheder, så udvælgelsen strider ikke mod reglen om aldrig at filtrere hænder i øvelser, der viser hyppigheder.
2. **Facit** beregnes altid af modellen i koden, aldrig skrevet i hånden.
3. **Kvalitet:** opgave 4 vælger fordelinger, hvor P ligger tæt på en grænse (±2), så beslutningen er reel.
4. **Genskabelse:** hver opgave har et seed.
5. **Version 2:** facit med fordelingens faktiske dobbeltdummy-resultat, beregnet på forhånd med Franks Python-pipeline og leveret som JSON.

## Session, scoring og data

- **Session, 5 minutter:** opvarmning med nøgletal og kortfarvepoint pr. mønster (45 s), lynrunde med honnørpoint (45 s), niveauopgaver (150 s), status (30 s).
- **Scoring:** rigtigt 10 XP, rigtigt over tidsgrænsen 5 XP, forkert 0. Tidsgrænser: 8 s for honnørpoint, 20 s for de øvrige.
- **Niveaubeslutningen:** valget er rigtigt, når det følger modellens grænse. Ligger P inden for ½ point af en grænse, grænserne medregnet, er begge nabovalg rigtige. Ved udgangsgrænsen er delkontrakt og udgang derfor begge rigtige fra P = 28 til 29.
- **Data:** ét JSON-objekt under `haandevaluering:v1` med version, niveau og træfsikkerhed pr. øvelse, Leitner-emner, XP, streak, sessioner og de valgfrie felter `lastExport` og svarlog. Egen eksport og import. Skemaet godkendes, før brugerfladen bygges.

## Sprog og hjælp

Som de andre spor:

- **Sproget:** læses med `getLang()`; al ordlyd ligger i `src/haandevaluering/ui/texts.ts` med en dansk og en engelsk udgave af samme type. Ingen ordlyd i komponenterne.
- **Kort og tal:** E K D B på dansk, A K Q J på engelsk. Brøker (½, ¼, ¾) skrives ens på begge sprog; decimaltal med `formatDecimal`.
- **Engelsk bridgesprog:** HCP, points, fit, shortness, trumps, partscore, game, small slam, grand slam, notrump, stopper.
- **ⓘ:** ved hvert element: forsiden og dens plan, hver øvelse ved spørgsmålet, regnskabet, meldingerne, facit, husketeknikkerne og status. Gruppen Vurderings ⓘ på forsiden skrives færdig.
- **Vejledningen:** et afsnit om sporet på begge sprog.

## Layout

Sporet ligger i appens 480 px-kolonne og følger SPEC-tema. Wireframen er designgrundlaget og kan ændres senere i Claude Design.

```text
┌──────────────────────────────────┐
│ Håndevaluering          Niveau 3 │
├──────────────────────────────────┤
│ Meldinger: 1♠ – 2♠ (fit fundet)  │
├──────────────────────────────────┤
│ DIG            ♠ E K 7 5 2       │
│                ♥ 4               │
│                ♦ K D 6 3         │
│                ♣ 8 5 2           │
│ MAKKER         ♠ D 9 6 3 …       │
├──────────────────────────────────┤
│ REGNSKAB          Dig    Makker  │
│ Honnørpoint      12½      …      │
│ Trumflængde      +1½      …      │
│ Korthed          +3       …      │
│ p                 17      12     │
│ P = 29   stik ≈ 9,6              │
├──────────────────────────────────┤
│ Hvilket niveau?                  │
│ [Delkontrakt] [Udgang]           │
│ [Lilleslem]   [Storeslem]        │
└──────────────────────────────────┘
```

- **Hænderne:** sorteret hånd som Spillekort, en linje pr. farve, E K D B 10, ♥ og ♦ røde.
- **Regnskabet:** udfyldes trin for trin. På niveau 3 og op skjules det, indtil brugeren har svaret.
- **Facit:** én sætning med begrundelsen og chancen som naturlig frekvens, plus forbeholdet om dobbeltdummy.

## Fælles med konventionstræneren

P-modellen må kun findes ét sted. `src/haandevaluering/content/p-model.json` er kilden, og `p-model.facit.json` indeholder eksempelhænder med facit. Konventionstræneren kopierer begge filer og kører den samme facittest. Afviger en af dem, fejler testen.

I dette repo tester facittesten (`src/haandevaluering/model/facit.test.ts`), at appens model giver facitfilens resultater. Facitfilen skrives af `node scripts/p-model-facit.ts` ud fra appens model: hænder i PBN-notation (♠.♥.♦.♣ med A K Q J T, fx `AK752.4.KQ63.852`), specens eksempler, en fordeling fra kortgiveren for hver kontrakt og for farve eller sans, P-værdier omkring grænserne, makkers krav og kortfarvepoint for alle 39 mønstre.

## Leverancetrin, accepttest og åbne punkter

1. **Model:** p, P, sansmodellen, Zar, kortfarvepoint pr. mønster, interpolation og facitfil med tests.
2. **Generator** med kvalitetskrav og seeds.
3. **Opgave 1–5** med session, scoring og Leitner-bunken.
4. **Opgave 6–9.**
5. **Version 2:** makkers styrke fra meldinger og dobbeltdummy-facit.

Hvert trin leveres på begge sprog og med ⓘ ved sine elementer.

Accepttest i Vitest:

- [x] Alle eksisterende tests består uændret, og andre nøgler i localStorage er uændrede.
- [x] ♠ E K 7 5 2 ♥ 4 ♦ K D 6 3 ♣ 8 5 2: HCP 12, honnørpoint 12½ (genvej og formel giver det samme).
- [x] Samme hånd med bekræftet spar-fit: p = 12½ + 1½ + 3 = 17. Før fitten er bekræftet, lægges fordelingsleddene ikke til.
- [x] P = 29 giver stik ≈ 9,6 og 4M ≈ 58 % (lineær interpolation mellem 28½ og 30), og stikforventningen springer ikke ved tabellens rækker.
- [x] P = 28½ giver 4M = 50 %, og grænserne 28½, 35 og 41 vælger udgang, lilleslem og storeslem. Fra P = 28 til 29 er både delkontrakt og udgang rigtige.
- [x] Kortfarvepoint tælles ikke i trumffarven: en 6-2-fit giver ingen dobbelttonpoint for de 2 trumf, og en 7-1-fit ingen singletonpoint.
- [x] Samme hånd i Zar: 12 + 4 + 9 + 4 = 29 ZP, dvs. åbning.
- [x] Sans: HCP + ¼ pr. tier, uden længdepoint.
- [x] Kortfarvepoint pr. mønster svarer til tabellen og beregnes ud fra mønstrene.
- [x] En konge over for makkers viste korthed trækker 1 fra; en dame eller knægt gør ikke.
- [x] Facitfilen giver samme resultat i appen og i konventionstrænerens kopi (appens side; konventionstræneren kører testen på sin kopi).
- [x] Generatoren: alle opgave 4-fordelinger har P inden for ±2 af en grænse, og samme seed giver samme opgave.
- [x] Sprog: på engelsk står der intet dansk på sporets skærme, og den danske og den engelske tekstfil har samme type.
- [x] ⓘ: hvert element fra Sprog og hjælp har et ⓘ med en forklaring på begge sprog.

Åbne punkter:

- **Kontroltjekket ved slem** er forenklet og skal bekræftes.
- **HCP-grænsen i opgave 8:** hvilken udgangsgrænse gav 82,5 % i Franks simulering (findes formentlig i `scripts/analyse2.py` eller `scripts/systemer.py`)? Indtil da bruges 25 HCP.
- **Kortfarvepoint i trumffarven:** reglen om kun at tælle sidefarverne bør efterprøves i `scripts/korthed.py`.
- **IMP-grænserne** (P ≈ 27½ i zonen, 28 uden for) er aflæst af tabellen og bør efterprøves med Franks data.
- **Version 2:** makkers forventede p ud fra meldingerne og dobbeltdummy-facit pr. fordeling kræver nye kørsler i Franks pipeline.

## Afklaret

Claude Codes gennemgang af version 1 (7. oktober 2026) og Franks svar i version 2 (8. oktober 2026):

1. **Eksemplerne er regnet efter og passer:** honnørpoint 12½, p = 17, 9,6 stik og 58 % ved P = 29, 29 ZP, tabellen over makkers krav (28½ minus egne point) og alle 13 kortfarvepoint i mønstertabellen.
2. **Nyt spor i appen:** ud over linjen i `tracks.ts` kræver sporet en rute i `App.tsx` og `onOpen` til forsiden, et afsnit i vejledningen og Vurderings ⓘ-tekst. De står i Afgrænsning.
3. **Sprog og hjælp** er tilføjet som for de andre spor, med to accepttest.
4. **MODEL.md** ligger i repoet som `docs/MODEL.md`.
5. **Konstanterne:** CLAUDE.md har en udtrykkelig undtagelse for `p-model.json` fra reglen om, at intet tal tastes ind.
6. **Facittesten mod konventionstræneren** kan kun køres i konventionstræneren; her testes appens model mod facitfilen.
7. **Stikforventningen** er tabellen med lineær interpolation; formlen bruges kun i forklaringer, og huskeversionen er "Stik ≈ P/3" (Frank, 8. oktober 2026).
8. **Stoppere** bruger meldegiverens definition (`hasStopper`).
9. **Honnørpoint med brøker** kræver et talpanel med ½ og ¼ i sporet; appens fælles talpanel ændres ikke.
10. **Niveauvalgene** er delkontrakt, udgang, lilleslem og storeslem; invit kommer i version 2 (Frank, 8. oktober 2026).
11. **Nabovalg ved grænsen:** inden for ½ point, grænserne medregnet (Frank, 8. oktober 2026).
12. **Kortfarvepoint** tælles kun i sidefarverne (Frank, 8. oktober 2026).
13. **HCP-grænsen i opgave 8** er 25 HCP, indtil Franks simulering viser den (Frank, 8. oktober 2026).
14. **Storeslem i opgave 4:** opgaverne ligger omkring udgang og lilleslem, så P er højst 35 + 2 = 37. Storeslem er et svarvalg, men aldrig det rigtige i første version (Frank, 8. oktober 2026).
15. **Forsidens tests:** med linjen i `tracks.ts` står Vurdering på forsiden. To tests i `src/app/navigation.test.tsx` forventer derfor Optælling, Spilføring, Vurdering, og testen for et nyt spor bruger et tænkt spor med et andet navn end Håndevaluering. Vejledningens afsnit om forsidens grupper nævner Håndevaluering (Frank, 8. oktober 2026).

## Claude Codes valg

Truffet under bygningen af leverancetrin 1–3 (8. oktober 2026). Ændres kun efter aftale.

1. **Farve eller sans:** facit som beskrevet under opgave 6.
2. **Leitner-bunken (30 kort):** ankrene, korthed 5-3-1, genvejens fire led (vælg blandt fire værdier, fx −½ for en dame), de 13 mønstre, makkers krav for 12, 14, 16, 18, 21 og 24 og stikforventningen (vælg blandt fire stikantal fra tabellen ved P = 24, 26, 28½, 30 eller 32; huskeversionen P/3 peger på det rigtige). Grupperne introduceres på skift, højst 3 nye kort pr. session. Rigtigt inden for 8 s (lynrundens grænse) er hurtigt i Leitner.
3. **Storeslem som nabovalg** kræver alle fire es og trumfkongen, lilleslem højst ét manglende es.
4. **Spildte værdier** trækkes kun fra, når fitten er bekræftet, ligesom de andre fordelingsled.
5. **Stoppere:** en farve er stoppet, når mindst én af hænderne har en stopper efter `hasStopper`.
6. **Opgave 3** har tre situationer, alle efter makkers åbning fra systemfilen: åbning i farve uden kendt major-fit (åbner han 1♥ eller 1♠, har du højst 2 kort i farven) giver kun honnørpoint; 1♥ eller 1♠ med mindst 3 kort hos dig giver honnørpoint + fordeling; 1NT, når du er balanceret uden firekortsmajor, giver sansmodellen.
7. **Opgave 4:** grænserne udgang og lilleslem vælges lige ofte, og P ligger inden for ±2 af den valgte (Afklaret 14).
8. **Opgave 5:** dine point er din p med fitten, mellem 10 og 24, så makker altid skal have noget.
9. **Opgave 6:** farveopgaverne har P i udgangszonen (28½ ≤ P < 35). Sansopgaverne har to balancerede hænder uden major-fit med 24–26 HCP i alt, hvor MODEL.md 2 har tallene for stoppere, og alle fire farver stoppet.
10. **Opgave 7:** makker har mindst 4 trumf og en singleton eller renonce i en sidefarve (som efter en splinter). En tredjedel af opgaverne har en konge over for kortheden, en tredjedel kun dame eller knægt, resten er frie.
11. **Turneringsform:** chancerne 37 %, 45 % og 50 % for 4M regnes om til P i tabellen og rundes til nærmeste halve point: 27½, 28 og 28½, som specen siger.
12. **Naturlig frekvens:** chancen vises med den mindste af nævnerne 2, 3, 4, 5 og 10, der rammer inden for 2,5 procentpoint (58 % → 3 ud af 5). Ellers står der "næsten altid" fra 95 %, 1 ud af N under 50 % (7 % → 1 ud af 14) og N − 1 ud af N derover.
13. **Sessionen:** niveaufasen giver opgaver, til 150 s er gået (blød timer), og den samme øvelse kommer ikke to gange i træk. Lynrundens og niveaufasens svar logges; kun niveaufasens tilpasser niveauet. Sporet har ingen ugens boss, da specen ikke nævner en.
14. **Svarloggen** har øvelse, niveau, score, tid, fase og opgavens seed, så opgaven kan genskabes.
15. **Opgave 8 og 9** kommer i leverancetrin 4; indtil da giver niveau 4 kun opgave 6, og niveau 5 blander opgave 1–7. Opgave 6 og 7 har brugerflade allerede i leverancetrin 3, da niveau 3 og 4 bruger dem.
16. **Regnskabet:** før svaret vises det kun i opgave 5 (din kolonne; spørgsmålet giver alligevel din p), fordi det ellers afslører facit. Efter svaret står det i facit i opgave 2, 4 og 7, i opgave 4 med begge kolonner, P og stikforventningen.
17. **Meldingerne:** begge hænder er tilfældige, så de konkrete meldinger i wireframen (1♠ – 2♠) laves ikke. Fit-opgaverne viser "Fit fundet i ♠", opgave 7 også "Makker har vist korthed i ♦", og opgave 3 makkers åbning med hp-intervallet fra systemfilen. Opgave 1 og 6 har ingen meldinger.
18. **Hænderne:** din hånd vises altid, makkers kun i opgave 4 og 6, hvor beslutningen gælder parret. Honnørerne og tieren står med fed.
19. **Talpanelet:** ½ og ¼ lægges til brøken, der højst er ¾ (12¾ = 1, 2, ½, ¼); ⌫ sletter brøken før cifrene.
20. **Facit** har overskriften (rigtigt, over tidsgrænsen eller forkert) med XP, dit svar, modellens begrundelse og i opgave 4 stikforventningen, chancen for kontrakten som naturlig frekvens, nabovalget ved grænsen, manglende es og forbeholdet om dobbeltdummy.
