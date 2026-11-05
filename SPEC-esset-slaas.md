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

- [ ] **Chancerne er uændrede:** `value`, `exact`, `upper`, `certified`, `layouts` og `pairs` er ens for alle 8.500 udspil sammenlignet med tagget `v40-foer-esset-slaas`.
- [ ] **Ingen "slås":** ingen linjetekst i banken og ingen af løserens skabeloner indeholder "slås". Fagordstesten er uændret.
- [ ] **Eksemplerne** i tabellen er faste tests, og 2 / E K B 5 4 3 (5 stik) og 3 2 / B 10 5 4 (1 stik) giver 59,75 % og 24,73 %, når linjen spilles som helhed.
- [ ] **Mærket:** hver tekst, der fortsætter efter en kipning, har "Lykkes kipningen" eller "Mislykkes kipningen" (dansk) og "If the finesse succeeds" eller "If the finesse fails" (engelsk).
- [ ] **Gamle linjer:** alle linjer på tagget og en håndskrevet linje i den gamle form læses og spilles uændret af `lines.ts` og `followsLine`.
- [ ] **Linjerne følger løserens plan:** `node scripts/tjek-linjer.ts` finder 0 afviste linjer og 0 linjer uden for undtagelseslisten (de 32 fra SPEC-linjeplan-23 eller færre).
- [ ] **Spil den selv:** den, der følger teksten på hovedvejen og på sidegrenen i eksemplerne, får "fulgt", og den, der ikke gør, får "ikke fulgt".
- [ ] `npm test`, `node scripts/bog-regression.ts` og `node scripts/sprogtjek.ts` er grønne, også `bydeform.test.ts` og fagordstesten.

## Resultat

*Udfyldes af Claude Code.* Mindst:

- Linjer med ny tekst og med andre trin (bedste og alle, mål og flest stik hver for sig).
- Linjer, der går fra tom til trin, og linjer, der mister trin; hvor mange af de 34 i gruppe C og de 124 i SPEC-linjeplan-23 der får trin igen.
- Hvor ofte hovedvejen skifter fra dagens gren, og hvor ofte "mest sandsynlig" afgør.
- Antal linjer med indkasseres, toppes og spilles.
- Linjer med andre `tricks` med gennemsnit før og efter.
- Tidsforbruget for hele banken.
- Tabellen med eksemplerne og afvigelserne fra *Forventede tekster*.

## Til afgørelse

1. **Reglen for "toppes" (D).** Forslaget i specen ("planen forgrener sig på, om honnøren falder") kan ikke regnes direkte: i løserens træ er modpartens kort i et hul ligeværdige, så når knægten er spillet i 4 3 2 / E K B 5, er damen og de små kort ét hul, og "damen falder" kan ikke skelnes fra "et lille kort falder". Den nærmeste regel, der kan regnes, er bygget: honnøren er et af modpartens kort fra knægten og op, der ikke er spillet og ligger mellem det laveste af de sikre stik og spilførerens næste kort, og den er faldet, når modparten efter stikkene intet har over spilførerens højeste kort. "Toppes" står, når det bedste resultat uden at den falder er dårligere end med; ellers "indkasseres". Reglen giver rådgiverens grænsetilfælde: nr. 1 "indkasseres" (planen er 3-3) og nr. 3 "toppes" (damen skal falde); E K B 3 2 / 7 6 5 4 giver "Farven toppes med esset og kongen." for 5 stik og "Esset indkasseres." for 4. Forslag: reglen bliver.
2. **Ordstillingen efter mærket.** Teksten efter "Lykkes kipningen, " har omvendt ordstilling, også for lille: "Lykkes kipningen, spilles der lille fra begge hænder to gange." (rådgiverens nr. 4) og "Mislykkes kipningen, spilles der lille fra hånden mod knægten (kipning); …" (nr. 8). I nr. 10 skrev rådgiveren "Lykkes kipningen, lille fra bordet mod damen (kipning); …" uden "spilles der". Forslag: "spilles der" overalt, så sætningerne følger samme regel.
3. **Ordet for et sikkert stik regnes for sikre stik i træk under ét** (fx esset og kongen), så de altid får samme ord og lægges sammen. Specen siger, at trin med forskellige ord ikke lægges sammen; med reglen sker det aldrig i en række sikre stik. Forslag: sådan.

## Afklaret

1. **Mærket står kun, når begge grene findes:** 4. hånd kan stikke over i nogle sidninger og ikke i andre. Kan den det i alle eller i ingen, er der intet at vælge, og teksten er som før.
2. **Ved lige stand** (åbent på begge grene og lige sandsynlige) gælder dagens regel: 4. hånd stikker over, og teksten fortsætter med "Mislykkes kipningen, …".
3. **Hvad nu?** bruger ikke A, E og F, så kun ordene skifter (`describeFrom` uden `branches`). Kortene fra første runde gives med (`gone`), så en honnør, der faldt under esset, ikke tæller som en, der kan toppes; det er den eneste ændring i `whatnow.ts`.
4. **Trinets regel for 3. hånd tager også en honnør under udspillet med.** Før fangede linjeformatet kun en honnør over det udspillede kort; når bordets konge spilles ud, og Øst lægger damen, tager løseren med esset, men trinet sagde lille. Nu bygges reglen af løserens valg for alle honnører fra 2. hånd. Teksten er uændret. Det giver K B 9 2 / E 10 8 3 (4 stik) og K 3 2 / E 10 9 5 4 (3 stik) trinet igen.
5. **Betingelserne i `thirdIf`** er enkeltkort, som modspillet har lagt. Et huls interval kan række over spilførerens spillede kort (13..12 for damen, når kongen er taget ud af gruppen esset-kongen), så kortet findes blandt de manglende kort i intervallet, der ikke er spillet. Linjen tjekkes bagefter med `lineMask` og "et trin skal følge løserens valg på alle grene"; holder den ikke, slutter linjen som før.
6. **Tællerne til Resultat** skrives af `describe.ts`, når processen slutter, og kun med `FB_DESCRIBE_STATS` sat, så `scripts/solve.ts` kun har fået `LINES_VERSION` 6 (Afgrænsningen).
7. **`uden-situation.json`** er skrevet igen med `FB_GOLDEN=skriv`, efter at et tjek viste, at kun tekster er ændret (19 linjer; den ene er det samme tal skrevet på to måder, `1.94e-05` og `0.0000194`). Chancerne er de samme.
8. **`bydeform.test.ts`** læser ikke "Lykkes" og "Mislykkes" som bydeform; testen har fået tjek af de nye sætninger, men ingen rettelse.
9. **Engelsk:** sikre stik står med "the" foran det første kort: "The ace and king are cashed." (før "The ace and the king are cashed."), som i specens tabel.
10. **Tests med de gamle ord** (`describe.test.ts`, `solver.test.ts` for Hvad nu?, `tricks.test.ts`, `lineText.test.ts`, `forbindelser-linjer.test.ts`) har fået de nye tekster, efter at chancen for hver linje spillet som helhed er tjekket mod løserens.
