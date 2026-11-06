# SPEC-esset-slaas

5. november 2026 · Franks opgave, skrevet af hans rådgiver · Bygges på grenen `esset-slaas` (før: `v40-foer-esset-slaas`). Køres i én omgang uden opsyn og stopper før fletning.

Specen samler de tre åbne punkter i SPEC-farvebehandling.md, som kræver en løsning af hele banken, så den kun skal løses én gang:

1. **"Esset slås." efter en kipning:** hovedvejen følger en ny regel (A), og teksten siger, hvilken gren den fortsætter på (E).
2. **3. hånds kort pr. gren** (B): et trin kan have forskelligt 3. hånds kort efter grenene i de tidligere trin, så linjer ikke længere skal slutte før et sådant trin (SPEC-linjeplan-23.md).
3. **Linjer uden trin** (C): de 34 linjer i gruppe C i SPEC-linjeplan-23.md får deres trin igen, hvor B gør det muligt.

Desuden får linjeteksterne mere præcise ord end "slås" (D), og trin med lille fra begge hænder i træk lægges sammen (F).

**Chancerne må ikke ændre sig.** `value`, `exact`, `upper`, `certified`, `layouts` og `pairs` er de samme for alle 8.500 udspil som på tagget. Ændringen rører kun tekster, trin og stik pr. sidning.

## Kørsel uden opsyn

Frank er ikke til stede under kørslen. Der stilles ingen spørgsmål undervejs.

- **Uenighed om ordlyd eller regel** stopper ikke arbejdet. Den skrives under *Til afgørelse* med eksempel og forslag, og arbejdet fortsætter efter specen.
- **Der stoppes kun,** hvis en chance ændrer sig, og fejlen ikke kan findes, eller hvis testene ikke kan blive grønne. Så stopper arbejdet *før* hele banken løses, og det, der er sket, skrives under *Status* øverst i specen. Grenen bliver, som den er, og intet slettes.
- **Fletning og push til `main`** sker ikke. Frank prøver ændringen og godkender den, som altid (`../CLAUDE.md`).
- **Når arbejdet er færdigt,** står resultatet i specen under *Resultat*, og specen, koden og banken er committet på grenen.

## Franks valg (foreløbige, kan rettes før fletning)

### A. Hovedvejen efter en kipning

- Efter en kipning følger hovedvejen den gren, hvor målet endnu ikke er afgjort.
- **Afgjort** betyder, at målet lykkes i alle tilbageværende sidninger på grenen, eller at det mislykkes i dem alle.
- **Er målet åbent på begge grene,** følger hovedvejen den mest sandsynlige gren (vægtet med sidningernes sandsynlighed). Ved lige stand gælder dagens regel: 4. hånd stikker så billigt som muligt.
- **Er målet afgjort på begge grene,** stopper teksten som i dag.
- For flest stik gælder det samme, med "afgjort" i betydningen, at antallet af stik ligger fast i alle sidninger på grenen.
- Andre steder end efter en kipning er hovedvejen uændret.

### B. 3. hånds kort pr. gren

- Linjeformatet udvides, så et trin kan have forskellige regler for 3. hånds kort efter, hvad modspillet lagde i de tidligere trin.
- Udvidelsen skal være bagudkompatibel: gamle linjer (brugerens egne i localStorage, Linjeeditorens og bankens) læses uændret, og `lines.ts`, `play/play.ts` (`followsLine`) og Linjeeditoren forstår både den gamle og den nye form.
- Linjeeditoren behøver ikke kunne *skrive* den nye form; den skal kunne vise og spille den.
- Tjekket "et trin skal følge løserens valg på alle grene" fra SPEC-linjeplan-23 bliver. Med reglerne pr. gren slutter færre linjer før tid.
- Formatet beskrives i SPEC-farvebehandling.md under Opgavebank og linjeformat, med et eksempel.

### C. Linjer uden trin

Ingen særskilt regel: de linjer, der får trin igen gennem B, får det. Tallene står under *Resultat*.

### D. Nye ord i linjeteksterne

"Slås" erstattes af tre ord:

| Ord | Hvornår | Dansk | Engelsk |
| --- | --- | --- | --- |
| **indkasseres** | kortet er et sikkert stik, og planen bygger ikke på, at en af modpartens honnører falder under det | "Esset indkasseres." · "Esset og kongen indkasseres." | "The ace is cashed." · "The ace and king are cashed." |
| **toppes** | høje kort spilles, mens modparten har en honnør, der kan falde under dem, og planen bygger på, at den falder | "Farven toppes med esset og kongen." · "Farven toppes med esset." | "The ace and king are played for the drop." · "The ace is played for the drop." |
| **spilles** | en honnør spilles, mens modparten har en højere honnør | "Damen spilles fra hånden." | "The queen is played from hand." |

- **Rækkefølgen:** passer både toppes og indkasseres, toppes farven. Et es, der spilles for at fælde damen, toppes.
- **"Planen bygger på, at honnøren falder"** afgøres ud fra løserens træ, ikke ved skøn. Forslag: planen forgrener sig på, om honnøren falder under kortene, og målet (eller antallet af stik) afhænger af den gren. Kan reglen ikke regnes sådan, vælger du den nærmeste regel, der kan, og skriver den under *Til afgørelse*.
- **Ordbogen:** opslaget Indkassere ("At indkassere et sikkert stik ved at spille et højt kort.") passer allerede, og "toppe farven" er husets ord. Ordbogen ændres ikke (den er Franks tekst).
- **Sammenlægning:** trin i træk med samme ord lægges sammen ("Esset og kongen indkasseres.", "Farven toppes med esset og kongen."). Trin med forskellige ord lægges ikke sammen.
- **"Spilles"** bruges kun, hvor ingen af de eksisterende skabeloner passer; et udspil som "Kongen fra hånden; dækker Vest, …" er uændret. Tæl, hvor mange linjer der får "spilles".
- **Overalt, hvor løseren skriver "slås",** gælder de nye ord, også "Bordet nås med en sideindgang, og esset slås." og Hvad nu? (`describeFrom`). Ud over ordene er Hvad nu? uændret.
- **Engelsk** følger i `lineText.ts`.
- **En ny test** fejler, hvis "slås" står i en linjetekst i banken eller i løserens skabeloner. Den kommer *ikke* i fagordstesten, for "slås" bruges korrekt andre steder (fx "slås sammen" og "kan slås op" i `src/app/tracks.ts`).

### E. Hvilken gren teksten fortsætter på

- Fortsætter teksten efter en kipning, siger den altid hvilken gren: "Lykkes kipningen, …" eller "Mislykkes kipningen, …". Det gælder også, når grenen er dagens hovedvej.
- **Kipningen lykkes,** når 3. hånds kipningskort vinder stikket, eller 4. hånd ikke kan stikke over. Den mislykkes, når 4. hånd stikker over.
- Sætningen følger husets ord (kipning kun som navneord) og beskrivende form. Engelsk: "If the finesse succeeds, …" og "If the finesse fails, …".
- **Tjek** at `bydeform.test.ts` ikke læser "Lykkes" og "Mislykkes" som bydeform. Gør den, rettes testen, ikke teksten, og det skrives under *Afklaret*.
- Ved en dobbelt kipning gælder mærket den sidste kipning før den fortsatte tekst. Foreslå en bedre ordlyd under *Til afgørelse*, hvis den er tvetydig.

### F. Lille fra begge hænder

Trin i træk med lille fra begge hænder lægges sammen: "Lille fra begge hænder to gange." (og "tre gange"). Engelsk: "Low from both hands twice." / "three times".

## Forventede tekster (regnet i hånden)

Regnet af rådgiveren i hånden, ikke af løseren. Afviger løserens resultat, gælder løserens, men forskellen skrives under *Resultat* med sandsynlighederne for grenene.

| Nr. | Kombination (bordet / hånden) · mål | Forventet tekst |
| --- | --- | --- |
| 1 | 4 3 2 / E D 6 5 · 3 stik | Lille fra bordet mod damen (kipning); lægger Øst en honnør, tages den med esset. Lykkes kipningen, indkasseres esset. Lille fra begge hænder. |
| 3 | 4 3 2 / E K B 5 · 4 stik | Lille fra bordet mod knægten (kipning); lægger Øst en honnør, tages den med esset. Lykkes kipningen, toppes farven med esset og kongen. |
| 4 | 4 3 2 / K 7 6 5 · 2 stik | Lille fra bordet mod kongen (kipning); lægger Øst en honnør, lægges der lille. Lykkes kipningen, spilles der lille fra begge hænder to gange. |
| 7 | B 3 2 / E K 5 4 · 3 stik | Lille fra bordet til esset. Lille fra hånden mod knægten (kipning); lægger Vest en honnør, lægges der lille. Mislykkes kipningen, indkasseres kongen. |
| 8 | B 3 2 / K 5 4 · 1 stik | Lille fra bordet mod kongen (kipning); lægger Øst en honnør, lægges der lille. Mislykkes kipningen, spilles der lille fra hånden mod knægten (kipning); lægger Vest en honnør, lægges der lille. |
| 10 | 4 3 2 / K D 8 7 6 5 · 5 stik | Åben på begge grene; den mest sandsynlige afgør. Forventet: "… Mislykkes kipningen, indkasseres damen." eller "… Lykkes kipningen, lille fra bordet mod damen (kipning); …" |

Nr. 1 og 3 er grænsetilfælde for D: i nr. 1 kan kongen falde under esset, men planen bygger på 3-3; i nr. 3 bygger planen på, at damen falder.

## Eksempler, der regnes (accepttest)

Alle regnes med løseren, ikke i hånden. Specen får en tabel med: kombination, mål, chance, teksten i dag, ny tekst på dansk og engelsk, trinene i dag og efter (notationen fra bilaget i SPEC-linjeformat-39.md) og dommen i Spil den selv for den, der følger teksten på hovedvejen og på sidegrenen.

1. De ti eksempler i SPEC-linjeformat-39.md, med markering af, hvor resultatet afviger fra kolonnen "Hvis kipningen lykkes".
2. Mindst to eksempler, hvor målet er åbent på begge grene, med sandsynlighederne for grenene.
3. Mindst tre linjer fra gruppe C i SPEC-linjeplan-23.md, heriblandt K B 9 2 / E 10 8 3 (4 stik) og D 10 / E K 4 3 2 (4 stik).
4. E 2 / D B 9 8 7 (4 stik) og 4 3 2 / D 9 6 5 (1 stik) fra De 5 linjer, der blev to trin kortere.
5. 2 / E K B 5 4 3 (5 stik) og 3 2 / B 10 5 4 (1 stik), der skal give de gemte 59,75 % og 24,73 %, når linjen spilles som helhed.
6. Én dobbelt kipning fra banken.
7. Mindst ét eksempel på hvert af indkasseres, toppes og spilles.

Eksemplerne bliver faste tests (`src/farvebehandling/solver/esset-slaas.test.ts`, i `npm test`).

## Rækkefølge

1. **Gren og tag:** `main` tagges `v40-foer-esset-slaas`, og grenen `esset-slaas` oprettes. Mellemlageret (`FB_SOLVE_CACHE` eller `<tmp>/fordelingstraeneren-solve`) kopieres til en mappe ved siden af, så LINES_VERSION 5 kan findes igen.
2. **Accepttest først:** testene nedenfor skrives, før koden ændres. De røde test er forventet.
3. **Koden:** `describe.ts`, `lineText.ts`, `lines.ts`, `play/play.ts`, Linjeeditoren og den nye test for "slås".
4. **Eksemplerne:** de regnes med løseren (sekunder til minutter pr. kombination), og tabellen skrives ind i specen. **Porten:** ændrer en chance sig, stoppes der her (se Kørsel uden opsyn).
5. **Hele banken:** `LINES_VERSION` bliver 6, og alle 660 cases løses med 10 processer. Kørslen startes, så den ikke dør med terminalen (fx `nohup` med log uden for repoet), og den overvåges. Stopper den, startes den igen; mellemlageret genoptager, hvor den slap. Forventet 4½–5 timer.
6. **Samling og kontrol:** `node scripts/solve.ts --assemble`, sammenligning med tagget, `node scripts/tjek-linjer.ts`, `npm test` (alene, se `../SYSTEM.md` afsnit 8), `node scripts/bog-regression.ts` og `node scripts/sprogtjek.ts`.
7. **Skærmbilleder:** linjekortet og facit for nr. 1, 3 og 7 på computer og mobil (390 px) i `../skaermbilleder/esset-slaas/`.
8. **Dokumentation:** *Resultat* i denne spec, SPEC-farvebehandling.md (de to åbne punkter lukkes, linjeformatet og reglen for hovedvejen beskrives), `CLAUDE.md` (linjerne på dansk) og `../SYSTEM.md` (beslutningsloggen: bygget og venter på Franks godkendelse; afsnit 8: forbeholdet om de 124 linjer rettes). Alt committes på grenen.

## Afgrænsning

| Sted | Må ske | Må ikke ske |
| --- | --- | --- |
| `solver/describe.ts` | hovedvejen efter en kipning (A), trin pr. gren (B), de nye ord (D), mærket for grenen (E), sammenlægningen (F) | ændringer i, hvad løseren vælger |
| `lineText.ts` | den engelske oversættelse af de nye sætninger | |
| `solver/lines.ts`, `play/play.ts`, Linjeeditoren | læse, spille og vise den nye form | afvise gamle linjer |
| `solver/cfr.ts`, `game.ts`, `natural.ts` | intet | |
| `scripts/solve.ts` | `LINES_VERSION` bliver 6 | resten |
| `content/solutions.json`, `suit-combinations.json`, `app/side-N.json` | `steps` (tekst), `line` og `tricks` | chancerne og `pairs` |
| `content/hvad-nu.*` | kun "slås" skiftet til de nye ord | alt andet |
| `content/linjer-side-N.md`, `validering-side-N.md` | de nye tekster | chancerne |
| `teknikker.md`, `techniques.json`, `hyppighed.csv`, `kildefejl.json` | intet | de skal være byte for byte ens |
| Ordbogen, forsiden, Konventionstræneren | intet | |

## Accepttest

- [x] **Chancerne er uændrede:** `value`, `exact`, `upper`, `certified`, `layouts` og `pairs` er ens for alle 8.500 udspil sammenlignet med tagget `v40-foer-esset-slaas`.
- [x] **Ingen "slås":** ingen linjetekst i banken og ingen af løserens skabeloner indeholder "slås". Fagordstesten er uændret.
- [x] **Eksemplerne** i tabellen er faste tests, og 2 / E K B 5 4 3 (5 stik) og 3 2 / B 10 5 4 (1 stik) giver 59,75 % og 24,73 %, når linjen spilles som helhed.
- [x] **Mærket:** hver tekst, der fortsætter efter en kipning, har "Lykkes kipningen" eller "Mislykkes kipningen" (dansk) og "If the finesse succeeds" eller "If the finesse fails" (engelsk).
- [x] **Gamle linjer:** alle linjer på tagget og en håndskrevet linje i den gamle form læses og spilles uændret af `lines.ts` og `followsLine`.
- [x] **Linjerne følger løserens plan:** `node scripts/tjek-linjer.ts` finder 0 afviste linjer og 0 linjer uden for undtagelseslisten (de 32 fra SPEC-linjeplan-23 eller færre).
- [x] **Spil den selv:** den, der følger teksten på hovedvejen og på sidegrenen i eksemplerne, får "fulgt", og den, der ikke gør, får "ikke fulgt".
- [x] `npm test`, `node scripts/bog-regression.ts` og `node scripts/sprogtjek.ts` er grønne, også `bydeform.test.ts` og fagordstesten.

## Resultat

Kørt 5.–6. november 2026 på grenen `esset-slaas`, uden opsyn og med intet andet kørende.

- **Chancerne er uændrede:** `value`, `exact`, `upper`, `certified`, `layouts` og `pairs` er ens med tagget for alle 8.500 udspil, og målenes værdi og bedste udspil er de samme. `suit-combinations.json` og `app/side-N.json` er ens bortset fra tekst, trin, stik og linjernes `text`. `teknikker.md`, `techniques.json`, `hyppighed.csv` og `kildefejl.json` er uændrede. Kontrollen er et script uden for repoet (`sammenlign.py`, 0 fejl).
- **Ny tekst:** 4.914 af 8.500 udspil. Mål: 703 bedste og 2.190 andre. Flest stik: 508 bedste og 1.513 andre. Ingen tekst siger "slås".
- **Andre trin:** 108 udspil har fået flere trin, og ingen har fået færre. Mål: 13 bedste og 77 andre. Flest stik: 6 bedste og 12 andre. 34 udspil gik fra ingen trin til trin (mål 5 + 18, flest stik 4 + 7), og ingen mistede deres trin. `thirdIf` står i 5 linjer. De fleste nye trin kommer af, at trinets regel nu også tager en honnør under udspillet med (Afklaret 4).
- **SPEC-linjeplan-23:** alle 34 linjer i gruppe C har fået deres trin igen (ét hver), og af de 124 linjer, der blev kortere med `LINES_VERSION` 5, har de 34 fået trin igen; de 90 andre er uændrede. Banken har nu 6.974 udspil med trin og 1.526 uden (før 6.940 og 1.560).
- **Hovedvejen efter en kipning:** i bankens tekster fortsætter teksten 2.011 gange efter en kipning, og alle gange med mærket: 460 gange "Lykkes kipningen" (hovedvejen er skiftet fra dagens gren, hvor 4. hånd stikker over) og 1.551 gange "Mislykkes kipningen". Tællerne fra løsningen (alle beskrivelser, også alternativer, der ikke gemmes): 4.234 kipninger med to grene; hovedvejen skiftede 1.201 gange, "mest sandsynlig" afgjorde 1.256 gange, og teksten stoppede 993 gange, fordi målet var afgjort på begge grene.
- **Ordene:** "indkasseres" står i 2.811 udspil, "toppes" i 1.409 og "spilles" i 197. "To gange" står i 41, "tre gange" i ingen. Hvad nu?: 554 af 1.843 tekster er ændret, 524 fordi "slås" er skiftet, og 43 har fået "spilles" (nogle har begge); alt andet i Hvad nu? er uændret.
- **Stik pr. sidning:** 18 udspil har andre `tricks`. Gennemsnittet falder i 17 og er uændret i 1, fordi linjen nu har flere faste trin efter målets plan, og løseren først spiller for flest stik efter sidste trin.

  | Kombination | Mål | Udspil | Stik før | Stik efter |
  | --- | --- | --- | --- | --- |
  | 92-AJ843 | 4 | 3 | 2,4130 | 2,3969 |
  | A2-QJ76543 | 7 | 2 | 5,9043 | 5,8422 |
  | A32-QJ7654 | 6 | 2 | 4,9522 | 4,8900 |
  | A432-QJ765 | 5 | 2 | 3,9522 | 3,8900 |
  | J2-AK943 | 5 | 5 | 3,6177 | 3,3957 |
  | J2-AK983 | 5 | 5 | 3,7025 | 3,5410 |
  | J92-AQ643 | 5 | 3 | 3,8791 | 3,8791 |
  | K32-AT954 | 3 | 1 | 3,9470 | 3,8339 |
  | K432-AT98 | 3 | 1 og 3 | 2,9861 | 2,9522 |
  | K82-AT93 | 3 | 1 | 2,8165 | 2,8004 |
  | K9-AT432 | 3 | 3 | 3,2273 | 3,2112 |
  | K9-AT5432 | 4 og 5 | 3 | 4,7070 | 4,6730 |
  | K987-AJ432 | 4 | 1 og 3 | 4,5313 | 4,4691 |
  | QJ2-A76543 | 6 | 4 | 4,9522 | 4,8900 |
  | QJ32-A7654 | 5 | 4 | 3,9522 | 3,8900 |

- **Tid:** hele banken med 10 processer fra 23:48 til 02:44 (den længste proces 175 minutter, den korteste 130). Mærket ved en kipning med én gren manglede i 31 kombinationer (Afklaret 11); de blev løst igen på 8 minutter. Samlingen tog 3 s, og `node scripts/tjek-linjer.ts` delt på 10 processer 55 minutter.
- **Kontrollerne:** `node scripts/tjek-linjer.ts` finder 0 afviste linjer og 0 linjer uden for undtagelseslisten; de 32 på listen er de samme som før. `npm test` (alene): 827 tests i 118 filer i orden. `node scripts/bog-regression.ts`: 120 af 120 tal passer (55 kombinationer, 9,9 minutter). `node scripts/sprogtjek.ts`: ingen ukendte ord.

### Eksemplerne

Regnet med løseren (banken efter `LINES_VERSION` 6 og tagget). Trinene: N er bordet, S er hånden; `[x/y]` er 3. hånds kort, når 2. hånd lægger lavt / lægger en honnør; `{er D faldet: x/y}` er en regel pr. gren; *høj* er `high`. "Kipningen i første stik" er grenenes sandsynlighed regnet med sidningernes vægt, og om målet er åbent eller afgjort på grenen. Spil den selv er dommen for den, der følger linjen, når kipningen lykkes og mislykkes, og for den, der afviger i første stik (testen `esset-slaas.test.ts` gør det samme for nr. 1 og 7).

| | Kombination (bordet / hånden) | Mål | Chance | Teksten i dag | Ny tekst | Engelsk | Trin i dag | Trin efter | Kipningen i første stik | Spil den selv |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 4 3 2 / E D 6 5 | 3 stik | 17,76 % | Lille fra bordet mod damen (kipning); lægger Øst en honnør, tages den med esset. | Lille fra bordet mod damen (kipning); lægger Øst en honnør, tages den med esset. Lykkes kipningen, indkasseres esset. Lille fra begge hænder. | Low from dummy towards the queen (finesse); if East plays an honour, it is won with the ace. If the finesse succeeds, the ace is cashed. Low from both hands. | N lille [D/E] | N lille [D/E] | lykkes 50,00 % (åben), mislykkes 50,00 % (afgjort) | lykkes: fulgt, mislykkes: fulgt, afviger: ikke fulgt |
| 2 | 4 3 2 / E D 7 6 5 | 4 stik | 33,91 % | Lille fra bordet mod damen (kipning); lægger Øst en honnør, tages den med esset. | Lille fra bordet mod damen (kipning); lægger Øst en honnør, tages den med esset. Lykkes kipningen, indkasseres esset. | Low from dummy towards the queen (finesse); if East plays an honour, it is won with the ace. If the finesse succeeds, the ace is cashed. | N lille [D/E] | N lille [D/E] | lykkes 50,00 % (åben), mislykkes 50,00 % (afgjort) | lykkes: fulgt, mislykkes: fulgt, afviger: ikke fulgt |
| 3 | 4 3 2 / E K B 5 | 4 stik | 17,76 % | Lille fra bordet mod knægten (kipning); lægger Øst en honnør, tages den med esset. | Lille fra bordet mod knægten (kipning); lægger Øst en honnør, tages den med esset. Lykkes kipningen, toppes farven med esset og kongen. | Low from dummy towards the jack (finesse); if East plays an honour, it is won with the ace. If the finesse succeeds, the ace and king are played for the drop. | N lille [B/E] | N lille [B/E] · S høj · S høj | lykkes 50,00 % (åben), mislykkes 50,00 % (afgjort) | lykkes: fulgt, mislykkes: fulgt, afviger: ikke fulgt |
| 4 | 4 3 2 / K 7 6 5 | 2 stik | 17,76 % | Lille fra bordet mod kongen (kipning); lægger Øst en honnør, lægges der lille. | Lille fra bordet mod kongen (kipning); lægger Øst en honnør, lægges der lille. Lykkes kipningen, spilles der lille fra begge hænder to gange. | Low from dummy towards the king (finesse); if East plays an honour, low is played. If the finesse succeeds, low from both hands twice. | N lille [K/lille] | N lille [K/lille] | lykkes 50,00 % (åben), mislykkes 50,00 % (afgjort) | lykkes: fulgt, mislykkes: fulgt, afviger: ikke fulgt |
| 5 | 3 2 / E K D 9 4 | 4 stik | 89,57 % | Lille fra bordet mod 9'eren (kipning); lægger Øst en honnør, tages den med esset. Esset slås. | Lille fra bordet mod 9'eren (kipning); lægger Øst en honnør, tages den med esset. Mislykkes kipningen, indkasseres esset. | Low from dummy towards the 9 (finesse); if East plays an honour, it is won with the ace. If the finesse fails, the ace is cashed. | N lille [9/E] | N lille [9/E] | lykkes 24,00 % (afgjort), mislykkes 76,00 % (åben) | lykkes: fulgt, mislykkes: fulgt, afviger: ikke fulgt |
| 6 | 2 / E K B 5 4 3 | 5 stik | 59,75 % | Lille fra bordet mod knægten (kipning); lægger Øst en honnør, tages den med esset. Esset og kongen slås. | Lille fra bordet mod knægten (kipning); lægger Øst en honnør, tages den med esset. Mislykkes kipningen, indkasseres esset og kongen. | Low from dummy towards the jack (finesse); if East plays an honour, it is won with the ace. If the finesse fails, the ace and king are cashed. | N lille [B/E] · S høj · S høj | N lille [B/E] · S høj · S høj | lykkes 50,00 % (åben), mislykkes 50,00 % (åben) | lykkes: fulgt, mislykkes: fulgt, afviger: ikke fulgt |
| 7 | B 3 2 / E K 5 4 | 3 stik | 68,98 % | Lille fra bordet til esset. Lille fra hånden mod knægten (kipning); lægger Vest en honnør, lægges der lille. Kongen slås. | Lille fra bordet til esset. Lille fra hånden mod knægten (kipning); lægger Vest en honnør, lægges der lille. Mislykkes kipningen, indkasseres kongen. | Low from dummy to the ace. Low from hand towards the jack (finesse); if West plays an honour, low is played. If the finesse fails, the king is cashed. | N lille [E/E] | N lille [E/E] | – | – |
| 8 | B 3 2 / K 5 4 | 1 stik | 74,48 % | Lille fra bordet mod kongen (kipning); lægger Øst en honnør, lægges der lille. Lille fra hånden mod knægten (kipning); lægger Vest en honnør, lægges der lille. | Lille fra bordet mod kongen (kipning); lægger Øst en honnør, lægges der lille. Mislykkes kipningen, spilles der lille fra hånden mod knægten (kipning); lægger Vest en honnør, lægges der lille. | Low from dummy towards the king (finesse); if East plays an honour, low is played. If the finesse fails, low from hand towards the jack (finesse); if West plays an honour, low is played. | ingen trin | ingen trin | – | – |
| 9 | 4 3 2 / D B 9 6 5 | 3 stik | 71,78 % | Lille fra bordet mod damen (kipning); lægger Øst en honnør, lægges der lille. Lille fra bordet mod 9'eren (kipning); lægger Øst en honnør, lægges der lille. | Lille fra bordet mod damen (kipning); lægger Øst en honnør, lægges der lille. Mislykkes kipningen, spilles der lille fra bordet mod 9'eren (kipning); lægger Øst en honnør, lægges der lille. | Low from dummy towards the queen (finesse); if East plays an honour, low is played. If the finesse fails, low from dummy towards the 9 (finesse); if East plays an honour, low is played. | N lille [D/lille] | N lille [D/lille] | lykkes 24,00 % (åben), mislykkes 76,00 % (åben) | lykkes: fulgt, mislykkes: fulgt, afviger: ikke fulgt |
| 10 | 4 3 2 / K D 8 7 6 5 | 5 stik | 65,57 % | Lille fra bordet mod kongen (kipning); lægger Øst en honnør, lægges der lille. Damen slås. | Lille fra bordet mod kongen (kipning); lægger Øst en honnør, lægges der lille. Mislykkes kipningen, toppes farven med damen. | Low from dummy towards the king (finesse); if East plays an honour, low is played. If the finesse fails, the queen is played for the drop. | N lille [K/lille] | N lille [K/lille] | lykkes 50,00 % (åben), mislykkes 50,00 % (åben) | lykkes: fulgt, mislykkes: fulgt, afviger: ikke fulgt |
| C/5 | K B 9 2 / E 10 8 3 | 4 stik (udspil 1) | 52,83 % | Kongen slås. Lille fra bordet mod 10'eren (kipning); lægger Øst en honnør, tages den med esset. | Kongen indkasseres. Lille fra bordet mod 10'eren (kipning); lægger Øst en honnør, tages den med esset. | The king is cashed. Low from dummy towards the 10 (finesse); if East plays an honour, it is won with the ace. | ingen trin | N K [lille/E] | – | – |
| C/5 | D 10 / E K 4 3 2 | 4 stik (udspil 3) | 83,98 % | Esset slås. Lille fra hånden til damen. | Esset indkasseres. Lille fra hånden til damen. | The ace is cashed. Low from hand to the queen. | ingen trin | S E [lille/D] | – | – |
| C/5 | K 3 2 / E 10 9 5 4 | 3 stik (udspil 1) | 98,04 % | Kongen slås. | Kongen indkasseres. | The king is cashed. | ingen trin | N K [lille/E] | – | – |
| C/5 | E B 10 2 / K 9 6 5 4 3 | 6 stik (udspil 1) | 89,00 % | Esset slås. | Esset indkasseres. | The ace is cashed. | ingen trin | N E [lille/K] | – | – |
| C/5 | E 2 / D B 9 8 7 | 4 stik | 62,98 % | Esset slås. Lille fra bordet mod damen (kipning); lægger Øst en honnør, lægges der lille. Knægten slås. | Esset indkasseres. Lille fra bordet mod damen (kipning); lægger Øst en honnør, lægges der lille. Mislykkes kipningen, indkasseres knægten. | The ace is cashed. Low from dummy towards the queen (finesse); if East plays an honour, low is played. If the finesse fails, the jack is cashed. | N E | N E | – | – |
| C/5 | 4 3 2 / D 9 6 5 | 1 stik | 61,30 % | Lille fra begge hænder. Lille fra bordet mod damen (kipning); lægger Øst en honnør, lægges der lille. Lille fra begge hænder. | Lille fra begge hænder. Lille fra bordet mod damen (kipning); lægger Øst en honnør, lægges der lille. Mislykkes kipningen, spilles der lille fra begge hænder. | Low from both hands. Low from dummy towards the queen (finesse); if East plays an honour, low is played. If the finesse fails, low from both hands. | N lille | N lille | – | – |
| C/5 | 3 2 / B 10 5 4 | 1 stik | 24,73 % | Lille fra bordet mod knægten (kipning); lægger Øst en honnør, lægges der lille. Lille fra begge hænder. | Lille fra bordet mod knægten (kipning); lægger Øst en honnør, lægges der lille. Mislykkes kipningen, spilles der lille fra begge hænder. | Low from dummy towards the jack (finesse); if East plays an honour, low is played. If the finesse fails, low from both hands. | N lille [B/lille] | N lille [B/lille] | lykkes 11,00 % (afgjort), mislykkes 89,00 % (åben) | lykkes: fulgt, mislykkes: fulgt, afviger: ikke fulgt |
| åben | B 3 2 / D 6 5 4 | 2 stik | 15,83 % | Lille fra bordet mod damen (kipning); lægger Øst en honnør, lægges der lille. Lille fra hånden mod knægten (kipning); lægger Vest en honnør, lægges der lille. | Lille fra bordet mod damen (kipning); lægger Øst en honnør, lægges der lille. Mislykkes kipningen, spilles der lille fra hånden mod knægten (kipning); lægger Vest en honnør, lægges der lille. Lykkes kipningen, spilles der lille fra begge hænder. | Low from dummy towards the queen (finesse); if East plays an honour, low is played. If the finesse fails, low from hand towards the jack (finesse); if West plays an honour, low is played. If the finesse succeeds, low from both hands. | N lille [D/lille] | N lille [D/lille] | lykkes 24,00 % (åben), mislykkes 76,00 % (åben) | lykkes: fulgt, mislykkes: fulgt, afviger: ikke fulgt |
| åben | B 4 3 2 / K 7 6 5 | 2 stik | 50,30 % | Lille fra bordet mod kongen (kipning); lægger Øst en honnør, lægges der lille. Lille fra begge hænder. | Lille fra bordet mod kongen (kipning); lægger Øst en honnør, lægges der lille. Mislykkes kipningen, spilles der lille fra begge hænder. | Low from dummy towards the king (finesse); if East plays an honour, low is played. If the finesse fails, low from both hands. | N lille [K/lille] | N lille [K/lille] | lykkes 50,00 % (åben), mislykkes 50,00 % (åben) | lykkes: fulgt, mislykkes: fulgt, afviger: ikke fulgt |
| åben | B 4 3 2 / D 7 6 5 | 2 stik | 37,30 % | Lille fra bordet mod damen (kipning); lægger Øst en honnør, lægges der lille. Lille fra begge hænder. | Lille fra bordet mod damen (kipning); lægger Øst en honnør, lægges der lille. Mislykkes kipningen, spilles der lille fra begge hænder. | Low from dummy towards the queen (finesse); if East plays an honour, low is played. If the finesse fails, low from both hands. | N lille [D/lille] | N lille [D/lille] | lykkes 24,00 % (åben), mislykkes 76,00 % (åben) | lykkes: fulgt, mislykkes: fulgt, afviger: ikke fulgt |
| dobbelt | B 3 2 / K 5 4 | 1 stik | 74,48 % | Lille fra bordet mod kongen (kipning); lægger Øst en honnør, lægges der lille. Lille fra hånden mod knægten (kipning); lægger Vest en honnør, lægges der lille. | Lille fra bordet mod kongen (kipning); lægger Øst en honnør, lægges der lille. Mislykkes kipningen, spilles der lille fra hånden mod knægten (kipning); lægger Vest en honnør, lægges der lille. | Low from dummy towards the king (finesse); if East plays an honour, low is played. If the finesse fails, low from hand towards the jack (finesse); if West plays an honour, low is played. | ingen trin | ingen trin | – | – |
| dobbelt | B 3 2 / K 6 5 4 | 1 stik | 93,54 % | Lille fra begge hænder. Lille fra hånden mod knægten (kipning); lægger Vest en honnør, lægges der lille. Lille fra bordet mod kongen (kipning); lægger Øst en honnør, lægges der lille. | Lille fra begge hænder. Lille fra hånden mod knægten (kipning); lægger Vest en honnør, lægges der lille. Mislykkes kipningen, spilles der lille fra bordet mod kongen (kipning); lægger Øst en honnør, lægges der lille. | Low from both hands. Low from hand towards the jack (finesse); if West plays an honour, low is played. If the finesse fails, low from dummy towards the king (finesse); if East plays an honour, low is played. | ingen trin | ingen trin | – | – |
| indkasseres | 3 2 / E K D 6 5 4 | 6 stik | 67,83 % | Lille fra bordet til esset. Kongen slås. | Lille fra bordet til esset. Kongen indkasseres. | Low from dummy to the ace. The king is cashed. | N lille [E/E] · S K | N lille [E/E] · S K | – | – |
| toppes | 5 4 3 2 / E D 8 7 6 | 5 stik | 20,35 % | Lille fra bordet mod damen (kipning); lægger Øst en honnør, tages den med esset. | Lille fra bordet mod damen (kipning); lægger Øst en honnør, tages den med esset. Lykkes kipningen, toppes farven med esset. | Low from dummy towards the queen (finesse); if East plays an honour, it is won with the ace. If the finesse succeeds, the ace is played for the drop. | N lille [D/E] | N lille [D/E] | lykkes 50,00 % (åben), mislykkes 50,00 % (afgjort) | lykkes: fulgt, mislykkes: fulgt, afviger: ikke fulgt |
| spilles | 3 2 / E 10 6 5 4 | 3 stik | 35,53 % | Lille fra begge hænder; lægger Øst en honnør, tages den med esset. Esset slås. 10'eren fra hånden. | Lille fra begge hænder; lægger Øst en honnør, tages den med esset. Esset indkasseres. 10'eren spilles fra hånden. | Low from both hands; if East plays an honour, it is won with the ace. The ace is cashed. The 10 is played from hand. | N lille [lille/E] | N lille [lille/E] | – | – |

**Afvigelser fra *Forventede tekster*:** nr. 1, 3, 4, 7 og 8 er præcis som forventet. Nr. 10 giver "Mislykkes kipningen, toppes farven med damen." (forventet "indkasseres damen" eller grenen, hvor kipningen lykkes): målet er åbent på begge grene med lige stor sandsynlighed (50,00 % hver), så dagens regel gælder (Afklaret 2), og ordet er "toppes", fordi de 5 stik kræver, at modpartens sidste honnør falder under damen. Nr. 6 følger samme regel (lige stor sandsynlighed, begge åbne). Nr. 5 fortsætter nu på grenen, hvor kipningen mislykkes, fordi målet er afgjort, når den lykkes (24,00 % mod 76,00 %).

## Til afgørelse

1. **Reglen for "toppes" (D).** Forslaget i specen ("planen forgrener sig på, om honnøren falder") kan ikke regnes direkte: i løserens træ er modpartens kort i et hul ligeværdige, så når knægten er spillet i 4 3 2 / E K B 5, er damen og de små kort ét hul, og "damen falder" kan ikke skelnes fra "et lille kort falder". Den nærmeste regel, der kan regnes, er bygget: honnøren er et af modpartens kort fra knægten og op, der ikke er spillet og ligger mellem det laveste af de sikre stik og spilførerens næste kort, og den er faldet, når modparten efter stikkene intet har over spilførerens højeste kort. "Toppes" står, når det bedste resultat uden at den falder er dårligere end med; ellers "indkasseres". Reglen giver rådgiverens grænsetilfælde: nr. 1 "indkasseres" (planen er 3-3) og nr. 3 "toppes" (damen skal falde); E K B 3 2 / 7 6 5 4 giver "Farven toppes med esset og kongen." for 5 stik og "Esset indkasseres." for 4. Forslag: reglen bliver.
2. **Ordstillingen efter mærket.** Teksten efter "Lykkes kipningen, " har omvendt ordstilling, også for lille: "Lykkes kipningen, spilles der lille fra begge hænder to gange." (rådgiverens nr. 4) og "Mislykkes kipningen, spilles der lille fra hånden mod knægten (kipning); …" (nr. 8). I nr. 10 skrev rådgiveren "Lykkes kipningen, lille fra bordet mod damen (kipning); …" uden "spilles der". Forslag: "spilles der" overalt, så sætningerne følger samme regel.
3. **Ordet for et sikkert stik regnes for sikre stik i træk under ét** (fx esset og kongen), så de altid får samme ord og lægges sammen. Specen siger, at trin med forskellige ord ikke lægges sammen; med reglen sker det aldrig i en række sikre stik. Forslag: sådan.

4. **Dobbelt kipning:** står to kipninger i træk, gælder mærket den sidste (fx B 3 2 / D 6 5 4, 2 stik: "… Mislykkes kipningen, spilles der lille fra hånden mod knægten (kipning); … Lykkes kipningen, spilles der lille fra begge hænder."). Det andet mærke handler om kipningen mod knægten. Forslag: navngiv kortet, når to kipninger går forud ("Lykkes kipningen mod knægten, …").
5. **"Spilles" også i Hvad nu?:** en honnør, der spilles ud uden mere at sige om stikket ("Damen fra hånden."), hedder nu "Damen spilles fra hånden." i banken (197 udspil) og i Hvad nu? (43 tekster). Specen siger, at Hvad nu? kun får de nye ord for "slås"; "spilles" er regnet som et af de nye ord. Forslag: sådan; ellers kan Hvad nu? beholde "Damen fra hånden." med en linje i `describe.ts`.
6. **Gennemsnittet af stik falder i 17 udspil** (Resultat): linjerne har flere faste trin efter målets plan, og løseren spiller først for flest stik efter sidste trin. Forslag: sådan, for gennemsnittet viser, hvad linjen giver.

## Afklaret

1. **Mærket står altid, når teksten fortsætter efter en kipning.** Har kipningen kun én gren (4. hånd kan stikke over i alle sidninger eller i ingen), er der intet at vælge: hovedvejen er dagens, og mærket er grenens ("Mislykkes kipningen, …" eller "Lykkes kipningen, …").
2. **Ved lige stand** (åbent på begge grene og lige sandsynlige) gælder dagens regel: 4. hånd stikker over, og teksten fortsætter med "Mislykkes kipningen, …".
3. **Hvad nu?** bruger ikke A, E og F, så kun ordene skifter (`describeFrom` uden `branches`). Kortene fra første runde gives med (`gone`), så en honnør, der faldt under esset, ikke tæller som en, der kan toppes; det er den eneste ændring i `whatnow.ts`.
4. **Trinets regel for 3. hånd tager også en honnør under udspillet med.** Før fangede linjeformatet kun en honnør over det udspillede kort; når bordets konge spilles ud, og Øst lægger damen, tager løseren med esset, men trinet sagde lille. Nu bygges reglen af løserens valg for alle honnører fra 2. hånd. Teksten er uændret. Det giver K B 9 2 / E 10 8 3 (4 stik) og K 3 2 / E 10 9 5 4 (3 stik) trinet igen.
5. **Betingelserne i `thirdIf`** er enkeltkort, som modspillet har lagt. Et huls interval kan række over spilførerens spillede kort (13..12 for damen, når kongen er taget ud af gruppen esset-kongen), så kortet findes blandt de manglende kort i intervallet, der ikke er spillet. Linjen tjekkes bagefter med `lineMask` og "et trin skal følge løserens valg på alle grene"; holder den ikke, slutter linjen som før.
6. **Tællerne til Resultat** skrives af `describe.ts`, når processen slutter, og kun med `FB_DESCRIBE_STATS` sat, så `scripts/solve.ts` kun har fået `LINES_VERSION` 6 (Afgrænsningen).
7. **`uden-situation.json`** er skrevet igen med `FB_GOLDEN=skriv`, efter at et tjek viste, at kun tekster er ændret (19 linjer; den ene er det samme tal skrevet på to måder, `1.94e-05` og `0.0000194`). Chancerne er de samme.
8. **`bydeform.test.ts`** læser ikke "Lykkes" og "Mislykkes" som bydeform; testen har fået tjek af de nye sætninger, men ingen rettelse.
9. **Engelsk:** sikre stik står med "the" foran det første kort: "The ace and king are cashed." (før "The ace and the king are cashed."), som i specens tabel.
10. **Tests med de gamle ord** (`describe.test.ts`, `solver.test.ts` for Hvad nu?, `tricks.test.ts`, `lineText.test.ts`, `forbindelser-linjer.test.ts`) har fået de nye tekster, efter at chancen for hver linje spillet som helhed er tjekket mod løserens.
11. **Mærket ved en kipning med én gren** manglede i første løsning af banken (58 udspil i 31 kombinationer): `afterFinesse` gav ingen gren, når 4. hånd kunne stikke over i alle sidninger eller i ingen. Rettelsen ændrer kun teksten der, ikke hovedvejen, så kun de 31 cases blev løst igen (deres mellemlager ligger i en kopi uden for repoet). Bagefter fortsætter teksten efter en kipning med mærket alle 2.011 gange.
12. **Billederne** er linjekortene i Analyse for nr. 1, 3 og 7 ved 1280 og 390 px på dansk og engelsk (`../skaermbilleder/esset-slaas/<bredde>-<sprog>-nrN-linjekort.png`). Facit i Træning bruger samme `Linjekort`, så teksten står ens dér.
13. **Tællerne fra `describe.ts`** tæller alle beskrivelser i løsningen, også alternativer og Hvad nu?; Resultat bygger derfor først og fremmest på tallene i banken.
