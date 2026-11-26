# SPEC – Tallene fra afsnit 7a i forklaringerne i Find udspillet

26. november 2026 · Fordelingstræneren · opfølgningen på opgave Æ i `PLAN-aabne-opgaver.md`. Bygger på afsnit 7a i `docs/MODEL.md` (`docs/specs/SPEC-udspilsraad.md`, flettet 26. nov. 2026) og øvelse 8 (`docs/specs/SPEC-modspil-v2.md`). Ikke godkendt endnu.

Øvelse 8 forklarer facit med Kompendiets råd, men siger ikke, hvad dobbeltdummy siger om rådet. Afsnit 7a har tallene. Opgaven sætter dem ind i forklaringen og i "Ved bordet" som korte sætninger, der begynder "Med dobbeltdummy …". **Facit, niveauerne, udvalget og prisen ændres ikke.**

**Franks valg før specen (26. nov. 2026):**
1. **"Ved bordet"** beholder Kompendiets ordlyd og får én sætning med tallene sidst i S1–S6 og S8. S7 er uændret (ingen påstand i 7a).
2. **"Table feeling"** (P9): facit er uændret, begge kort er rigtige. Forklaringen får tallet for netop E K, K D eller D B og siger, at det er en øvre grænse.
3. **Stik og sætter:** sætningerne i forklaringen har forskellen i stik og chancen for at sætte kontrakten. Chancen udelades, når den peger modsat stikkene, og når de to udspil er lige gode.

## Trinene og sessionerne

Ét leverancetrin på grenen `udspilstal`; `main` før ændringen tagges `v51-foer-udspilstal` (vagterne i `src/modspil/udspil/varianter.test.ts` og `raadanalyse.test.ts` leder efter `v51-foer-*` og sammenligner med det, så tagget skal sættes før første ændring). Frank sender `/usage` før og efter hver session, og Claude Code skriver tokenforbruget i fire tal under Afklaret.

| Session | Indhold | Model |
| --- | --- | --- |
| 1 | tag, gren, accepttestene (røde, committet for sig), byggeriet, `npm test` grøn, "Tekster til gennemgang" under Afklaret, stop før fletning | Opus, high effort |
| 2 | efter "godkendt": `npm test`, sprogtjek, skærmbilleder, flet, push, live-tjek, `../SYSTEM.md`, arkivering og sletning af grenen | Sonnet, medium effort |

## Afgrænsning

| Sted | Må ske | Må ikke ske |
| --- | --- | --- |
| `src/modspil/udspil/raadanalyse.ts` | en ren funktion `appTal`, der trækker appens tal ud af `analyser` | ændret analyse eller ændrede tabeller i 7a |
| `tools/udspil/raadanalyse.mjs` | `--app`, der skriver `appTal` som JSON | ændret `--markdown` og `--json` |
| `src/modspil/content/udspil/raadtal.json` (ny) | genereret med `node tools/udspil/raadanalyse.mjs --app`; rettes aldrig i hånden | – |
| `src/modspil/model/findUdspilTekst.ts`, `findUdspil.ts` | sætningerne, udvælgelsen af række og sætningen sidst i "Ved bordet" | facit, `klar`, `afviger`, niveauer, udvalg, Kompendiets råd og eksisterende sætningers ordlyd |
| `src/modspil/ui/tekster.ts` | én sætning sidst i `udspil.hjaelp` (dansk og engelsk) | andet |
| `src/modspil/ui/kompas.test.tsx` | tidsgrænsen 30 s (småting fra planen) | andet |
| `src/modspil/udspilstal/` (ny) | accepttestene | – |
| `CLAUDE.md` | én linje under Modspil v2 | andet |
| `scripts/ordliste.txt` | nye ord | – |
| Alt andet, også `situationer.json`, datasættene, `docs/MODEL.md`, `FindUdspil.tsx`, lagringen og `udspilPris.ts` | – | ændres |

Kræver noget andet en ændring uden for afgrænsningen, stopper Claude Code og spørger. Alle eksisterende tests skal bestå uændret, undtagen tidsgrænsen i `kompas.test.tsx`.

## Tallene i appen (`raadtal.json`)

**Intet tal tastes ind:** tallene kommer fra `analyser` i `raadanalyse.ts` på rådataene i `tools/udspil/raa/`, som afsnit 7a. `appTal` giver for hver række, situation og gruppe, som appen bruger: række, situation, gruppe, n, `forskel`, `saetForskel`, `dom` og `udenPraktiskBetydning`, og for S6 andelen af hænderne, hvor trumf er den bedste farve (tabellen "Trumfs plads"). Tallene gemmes uafrundede; teksten afrunder.

**Afrunding som i 7a:** stik med to decimaler (0,13), sætter i procentpoint med én decimal (4,4), andele i hele procent (46 %). Engelsk med decimalpunktum.

## Sætningen i forklaringen

Sætningen står **efter Kompendiets råd** (`raadSaetning`) som sidste sætning i forklaringen. Den indgår ikke i `afvigelse`. Rækken vælges efter den regel i `kompendieraad`, der gav rådet (`raadFor`), og efter hånden:

| Situation | Regel, der gav rådet | Række | Hvornår |
| --- | --- | --- | --- |
| S1, S2 | majorerne | P2 (hele rækken, S1 + S2) | Vest har kort i begge majorer, og de er ikke lige lange |
| S1, S2 | majorerne | P1 | ellers, når Vest har en minor med præcis 4 kort og 1–2 honnører og en major med 1–3 kort |
| S3 | ♠ ♦ ♣ (ingen dyb sekvens i ♥) | P4 | Vest har kort i ♥ |
| S3 | ♥ med dyb sekvens | – | ingen sætning |
| S4 | singleton | P5 · S4 | altid |
| S4 | doubleton | P6 · S4 | altid |
| S4 | sidefarve uden honnør | P7 | altid |
| S4 | sidefarverne | P8 · S4 (♠, ♦, ♣) | altid |
| S5 | singleton | P5 · S5 | altid |
| S5 | ♦ ♣ | – | ingen sætning |
| S6 | ♣ (trumf) | P8 · S6 (♠, ♥, ♦) | altid |
| S7 | alle | – | ingen sætning |
| S8 | singleton | P5 · S8 | altid |
| S8 | doubleton | P6 · S8 | altid |
| S8 | sidefarverne | P8 · S8 (♥, ♦, ♣) | altid |

Er rækkens dom "For få hænder", står der ingen sætning.

**Ordlyden** (dansk; den engelske skrives af Claude Code og står under "Tekster til gennemgang"):

- **A bedre eller ringere:** "Med dobbeltdummy giver {A} efter dette forløb i gennemsnit {x} stik mere (mindre) end {B} og sætter kontrakten {y} procentpoint oftere (sjældnere)." Peger sætterchancen modsat stikkene, slutter sætningen efter {B}.
- **Lige gode:** "Med dobbeltdummy er {A} og {B} lige gode efter dette forløb (forskel {x} stik)." {x} uden fortegn, og ingen sætterchance.

**Hvilken form, sætningen får, afgøres alene af felterne `dom` og `udenPraktiskBetydning` i `raadtal.json`**, som analysen har sat (grænsen 0,05 stik er `PRAKTISK` i `raadanalyse.ts`; teksten regner ingen grænse selv):

| `dom` | `udenPraktiskBetydning` | Form |
| --- | --- | --- |
| `for-faa` | – | ingen sætning |
| `ingen-forskel` | sand eller falsk | lige gode |
| `holder` eller `modsat` | sand | lige gode |
| `holder` | falsk | A giver mere |
| `modsat` | falsk | A giver mindre |

**Sætterchancen** står kun ved "mere" og "mindre", og kun når `saetForskel` har samme fortegn som `forskel`; ellers slutter sætningen efter {B}. Afrundes sætterchancen til 0,0, udelades den også.
- **P8 (trumf mod hver sidefarve):** én sætning med trumf som A: "Med dobbeltdummy giver trumf efter dette forløb i gennemsnit 0,07 stik mere end ♠ (sætter 2,7 procentpoint oftere) og 0,32 stik mere end ♥ (5,6 procentpoint oftere), mens trumf og ♦ er lige gode." Hver farve får sin form efter tabellen ovenfor. Farver lægges kun sammen, når de har samme form, samme stiktal med to decimaler, og sætterchancen enten står ved dem alle eller ved ingen af dem. Sætterchancen står da som et interval fra den mindste til den største ("0,06 stik mindre end ♥, ♦ og ♣ (sætter 0,8–0,9 procentpoint sjældnere)") eller som ét tal, når de er ens efter afrunding ("0,06 stik mindre end ♠ og ♦ (sætter 1,2 procentpoint sjældnere)"). Farver, der ikke kan lægges sammen, står hver for sig i rækkefølgen ♠ ♥ ♦ ♣, og de lige gode står til sidst ("mens trumf og ♣ er lige gode"). Med tallene fra 7a: S4 bliver "0,06 stik mindre end ♠ og ♦ (sætter 1,2 procentpoint sjældnere), mens trumf og ♣ er lige gode" (♣: −0,04, uden praktisk betydning), og S8 bliver "0,06 stik mindre end ♥, ♦ og ♣ (sætter 0,8–0,9 procentpoint sjældnere)".

Navnene på A og B:

| Række | A | B |
| --- | --- | --- |
| P1 | en kort major | en firefarve i minor med en eller to honnører |
| P2 | den korteste major | den længste |
| P4 | ♥ uden dyb sekvens | ♠ |
| P5 | singletonen | en sidefarve med småkort |
| P6 | doubletonen uden honnør | en sidefarve med småkort |
| P7 | småkort i en sidefarve | en sidefarve med en eller to honnører |

Eksempler med tallene fra 7a:
- S4, singleton: "Med dobbeltdummy giver singletonen efter dette forløb i gennemsnit 0,13 stik mere end en sidefarve med småkort og sætter kontrakten 4,4 procentpoint oftere."
- S1, to majorer: "Med dobbeltdummy giver den korteste major efter dette forløb i gennemsnit 0,10 stik mindre end den længste og sætter kontrakten 1,8 procentpoint sjældnere."
- S8, doubleton: "Med dobbeltdummy er doubletonen uden honnør og en sidefarve med småkort lige gode efter dette forløb (forskel 0,02 stik)." (7a: −0,02, `modsat` med `udenPraktiskBetydning`, dommen "B bedre, uden praktisk betydning".)

**"Table feeling" (P9):** i S1 og S2 får sætningen om de to rigtige kort (`kortSaetning`) en tilføjelse efter kolon-sætningen. **Hvad der sammenlignes:** de to kort, `kortSaetning` allerede nævner, altså toppen (det højeste kort i farven, fx esset fra E K 7 4) og det lave kort, profilen Standard spiller fra farven (fx 4'eren), som i 7a's P9. Det er ikke de to honnører mod hinanden. {x} og {y} er P9-gruppens `forskel` og `saetForskel` (toppen minus det lave kort), hvor gruppen er de to øverste honnører i Vests farve: "E K", "K D" eller "D B" (P9's grupper; længdegrupperne bruges ikke).

Formen følger tabellen ovenfor, med "toppen" som A og "det lave kort" som B:
- **A giver mere:** "Med dobbeltdummy giver toppen fra {E K / K D / D B} i gennemsnit {x} stik mere end det lave kort og sætter kontrakten {y} procentpoint oftere; tallet er en øvre grænse, fordi dobbeltdummy overvurderer honnørudspil." Sætterchancen udelades efter samme regel som ovenfor.
- **A giver mindre:** samme sætning med "mindre" og "sjældnere", men uden "tallet er en øvre grænse …", som kun gælder, når toppen vinder.
- **Lige gode:** "Med dobbeltdummy er toppen og det lave kort fra {gruppen} lige gode (forskel {x} stik)."
- **For få hænder:** ingen tilføjelse.

Med tallene fra 7a vinder toppen i alle tre grupper (E K +0,83 og +12,3; K D +0,32 og +2,4; D B +0,14 og +1,0), så kun den første form forekommer nu; de andre er med, hvis tallene ændres ved en ny kørsel. I S3 og S7 er der ingen tilføjelse, fordi P9 kun er målt i S1 og S2.

## Sætningen sidst i "Ved bordet"

Sætningen kommer efter den nuværende tekst og regnes af koden ud fra `raadtal.json`. Kun stik (Rådgiverens valg, så "Ved bordet" forbliver kort; sætterchancen står i forklaringen). Med tallene fra 7a:

| Situation | Sætningen |
| --- | --- |
| S1, S2 | Med dobbeltdummy giver den korteste major dog 0,10 stik mindre end den længste, mens en kort major og en firefarve i minor med honnør er lige gode. |
| S3 | Med dobbeltdummy giver ♥ uden dyb sekvens 0,12 stik mindre end ♠, mens ♠ og minorfarverne er lige gode. |
| S4 | Med dobbeltdummy giver singletonen 0,13 stik mere end småkort, småkort giver 0,15 stik mere end en farve med en eller to honnører, doubletonen og småkort er lige gode, og trumf giver 0,06 stik mindre end ♠ og ♦ og er lige så godt som ♣. |
| S5 | Med dobbeltdummy giver singletonen 0,11 stik mere end småkort i en sidefarve. |
| S6 | Med dobbeltdummy giver trumf 0,07 stik mere end ♠ og 0,32 stik mere end ♥, mens trumf og ♦ er lige gode; trumf er den bedste farve i 46 % af hænderne. |
| S7 | (ingen sætning) |
| S8 | Med dobbeltdummy giver singletonen 0,17 stik mere end småkort, doubletonen og småkort er lige gode, og trumf giver 0,06 stik mindre end hver sidefarve. |

Formen (mere, mindre, lige gode, ingen) følger samme tabel som i forklaringen, og farverne i P8 lægges sammen efter samme regel. Teksten regnes af koden; tabellen her er, hvad den giver med tallene fra 7a, og accepttest 4 holder den fast.

## ⓘ i Find udspillet

`udspil.hjaelp` får én sætning sidst: "Sætningerne \"Med dobbeltdummy …\" er gennemsnit over hænderne i meldeforløbet. Dobbeltdummy kender alle kort, så passive udspil undervurderes, og honnørudspil overvurderes." Engelsk tilsvarende.

## Accepttest (skrives først, røde)

Testene ligger i `src/modspil/udspilstal/`. Tunge løkker har tidsgrænsen 30 s (300 s, hvis de læser rådataene).

1. **Tallene:** `raadtal.json` er lig `appTal(analyser(…))` på rådataene, og hvert tal i filen giver, afrundet som i 7a, det samme som tabellerne mellem markørerne i `docs/MODEL.md` (læst og tolket af testen, uafhængigt af `raadanalyse.ts`'s markdown).
2. **Udvælgelsen:** for faste hænder (fra datasættet; Claude Code vælger dem og skriver dem under Afklaret) giver forklaringen præcis den forventede sætning på dansk og engelsk, med tallene skrevet ind i testen fra 7a: S1 med to forskellige majorer (P2), S1 med lige lange majorer og en minor med 4 kort og honnør (P1), S1 opgave 55 med svar i kort ("table feeling" E K: +0,83 stik og +12,3 procentpoint), S3 uden og med dyb sekvens i ♥, S4 for hver af de fire regler, S5 med singleton og med ♦/♣, S6, S7 og S8 for hver af de tre regler. Situationer og regler uden sætning har ingen "Med dobbeltdummy".
3. **Formerne:** enhedstests med konstruerede rækker dækker hver linje i formtabellen (også `holder`/`modsat` med `udenPraktiskBetydning`), sætterchancen, der peger modsat stikkene eller afrundes til 0,0, P8's sammenlægning (samme form og stiktal, sætterchance ved alle eller ingen; interval og ét tal; en farve, der ikke kan lægges sammen) og P9's fire former.
4. **"Ved bordet":** S1–S6 og S8 er teksten ved `v51-foer-udspilstal` efterfulgt af sætningen i tabellen ovenfor (dansk) og den godkendte engelske; S7 er uændret.
5. **Forklaringen er ellers uændret:** for 3 faste opgaver pr. situation, hver profil og begge svarformer er forklaringen ved tagget gemt i testen (skrevet i den røde fase); den nye forklaring er den gamle med de nye sætninger indsat de beskrevne steder og intet andet.
6. **Facit er uændret:** for alle 1200 opgaver og de tre profiler er `udspilFacit` (farver, kort, klar, afviger, tabel) og prisen de samme som ved tagget (gemt som hash i den røde fase).
7. **Sproget:** fagordstesten, bydeformstesten og sprogtestene i `src/modspil/find-udspil/sprog.test.ts` og `udspil-skaerme/sprog.test.tsx` er grønne uændret (de læser alle forklaringer og "Ved bordet"); den engelske facit har ingen dansk.
8. **Intet andet er ændret** siden `v51-foer-udspilstal` end filerne i Afgrænsningen og specen.

## Arbejdsgang

1. Session 1: tag `v51-foer-udspilstal`, opret grenen `udspilstal`, skriv accepttestene (røde), og commit dem. Byg, så de er grønne uden at blive rettet, og `npm test` er grøn (Vitest i PowerShell). Skriv under Afklaret: de faste hænder, Claude Codes valg og "Tekster til gennemgang" (alle nye sætninger på dansk og engelsk, også et eksempel pr. række i forklaringen). **Stop før fletning.**
2. Frank læser teksterne og prøver øvelse 8 lokalt (`npm run dev`, Modspil, niveau 4–5).
3. Franks "godkendt", så session 2: `npm test`, `node scripts/sprogtjek.ts`, `node scripts/tjek-bred-layout.mjs --modspil` og skærmbilleder af facit i S4 og S6 ved 1280 og 390 px i `../skaermbilleder/udspilstal/`, flet, push, live-tjek af én facit, `../SYSTEM.md` (beslutningsloggen), arkivering i `docs/specs/` med en linje i `docs/specs/README.md`, og grenen slettes.

## Afklaret

**Franks valg 26. nov. 2026:** se øverst (1–3).

**Rådgiverens valg (Frank kan ændre dem):**
- "Ved bordet" har kun stik; sætterchancen står i forklaringen.
- P2 bruges som hel række (S1 + S2), ikke opdelt på den korteste majors længde; P2 vinder over P1, når begge passer, så forklaringen højst får én sætning om rådet.
- P3 (♠ mod minorfarverne efter transfer) står kun i "Ved bordet", fordi rådet i S3 er alle tre farver.
- Kun forskel og sætter, ikke 95 %-interval eller "A bedre / lige / B bedre"; dem har afsnit 7a.
- Småtingen fra planen om `find_opgaver` og kommentaren "3NT → 4" venter til næste generering med `generer.py`, som planen siger.

### Session 1 (26. nov. 2026, Claude Code)

`main` er tagget `v51-foer-udspilstal` (`73bb94c`), og grenen `udspilstal` har to commits: `bf2f157` med specen, accepttest 1–8 i `src/modspil/udspilstal/` og tomme funktioner, der kaster "ikke bygget" (55 af 71 røde; vagterne for facit, `--json` og afgrænsningen var grønne), og `f4ff5da` med byggeriet. Accepttestene er ikke rettet efter den røde commit (`git diff bf2f157 -- src/modspil/udspilstal` er tom), og alle 71 er grønne. `npm test` i PowerShell er grøn: 178 testfiler, 1408 bestået og 2 sprunget over (kontroltestenes `forsinket` for profiler uden forsinket kald, som på `main`); kørslen tog 10 minutter. `node scripts/sprogtjek.ts` finder ingen ukendte ord, så `scripts/ordliste.txt` er uændret. Intet krævede en ændring uden for afgrænsningen.

**De faste hænder (accepttest 2, `udvaelgelse.test.ts`)**, profilen Standard, svar i farve og i kort; seedet står i testen, så et skift i datasættet ses:

| Situation | Opgave | Vests hånd | Regel bag rådet | Række |
| --- | --- | --- | --- | --- |
| S1 | 0 | ♠D 10 9 5 4 ♥9 7 ♦E 10 9 8 ♣9 4 | majorerne, forskellig længde | P2 |
| S2 | 1 | ♠D 7 6 5 3 ♥9 8 2 ♦B 10 8 7 5 ♣– | majorerne, forskellig længde | P2 |
| S1 | 28 | ♠D 10 7 ♥6 5 2 ♦K 7 5 3 ♣9 5 2 | majorerne, lige lange, ♦K 7 5 3 | P1 |
| S1 | 55 | ♠K B 7 6 ♥E K 4 3 ♦10 8 6 3 ♣B | majorerne, lige lange uden P1 | ingen sidst; "table feeling" E K efter ♥E og ♥3 (svar i kort) |
| S3 | 0 | ♠K B 7 5 ♥D 9 ♦E 8 4 3 ♣D 6 4 | ♠ ♦ ♣, kort i ♥ | P4 |
| S3 | konstrueret | ♠K 3 2 ♥D B 10 9 3 ♦K 4 2 ♣3 2 | ♥ med dyb sekvens | ingen |
| S4 | 0 | ♠D B 7 6 3 ♥6 4 ♦B ♣K 6 5 3 2 | singleton | P5 · S4 |
| S4 | 2 | ♠K B 9 4 ♥D 6 5 ♦E D 10 2 ♣B 2 | doubleton | P6 · S4 |
| S4 | 1 | ♠9 8 3 2 ♥D 7 ♦K 7 4 ♣E 8 6 2 | sidefarve uden honnør | P7 |
| S4 | 6 | ♠E 9 7 6 ♥K 5 3 ♦K B 8 ♣D 4 3 | sidefarverne | P8 · S4 |
| S5 | 9 | ♠10 8 4 2 ♥2 ♦E 10 8 4 ♣E D 8 6 | singleton | P5 · S5 |
| S5 | 0 | ♠3 ♥5 4 2 ♦B 9 8 7 6 ♣E D 10 7 | ♦ ♣ | ingen |
| S6 | 0 | ♠10 6 5 ♥8 7 5 ♦E D B 10 8 4 ♣6 | ♣ (trumf) | P8 · S6 |
| S6 | 17 | ♠9 7 6 5 3 2 ♥7 2 ♦E 8 6 3 2 ♣– | ingen (Vest har ingen ♣) | ingen |
| S7 | 0 | ♠6 5 4 2 ♥7 5 3 ♦10 7 3 ♣5 4 3 | ♥ | ingen |
| S8 | 32 | ♠6 5 3 ♥4 ♦E 8 7 5 4 ♣7 6 5 3 | singleton | P5 · S8 |
| S8 | 5 | ♠B 9 8 ♥D 6 4 2 ♦E D B 5 ♣8 7 | doubleton | P6 · S8 |
| S8 | 0 | ♠3 ♥E 9 5 ♦10 6 2 ♣B 10 6 5 4 2 | sidefarverne | P8 · S8 |

Datasættets 150 hænder i S3 har ingen dyb sekvens i ♥ (Nord har vist fem ♥), så den hånd er konstrueret med `fastOpgave`. S6 opgave 17 er med, fordi den viser et valg (2 nedenfor).

**Accepttest 5 (`FASTE` i `hjaelp.ts`)** bruger S1 28, 42 og 55 ("table feeling" D B og E K), S2 1, 18 og 130 (K D og en, der afviger), S3 0, 8 og 43 (B 10 og E K uden tilføjelse), S4 0, 6 og 32, S5 0, 9 og 130, S6 0, 17 og 26, S7 0, 1 og 18 og S8 0, 5 og 55, med de tre profiler og begge svarformer (144 forklaringer i `foer.json`).

**Claude Codes valg (Frank kan ændre dem):**
1. **`raadtal.json`** har `kilde`, `raekker` og `trumfBedst`. Rækkerne er de 23, appen bruger: P1, P2, P3 · ♦, P3 · ♣, P4, P5 i S4, S5 og S8, P6 i S4 og S8, P7, P8 i hver situation (9) og P9's grupper E K, K D og D B. P2's længdegrupper og P9's hele række og længdegrupper er ikke med. `trumfBedst` er S6 med n = 149 og andelen 68/149 (kolonnen "1." i "Trumfs plads", hvor lige med den bedste tæller som bedst).
2. **Udvælgelsen** følger reglens plads i `kompendieraad` (`RAADRAEKKE` i `findUdspil.ts`). Giver ingen regel rådet (S6 uden ♣, 1 hånd i datasættet), er der ingen sætning. P1 og P4 bruger specens betingelser ordret: P1 gælder også ved lige lange majorer (7a udelader de hænder, så sætningen taler om gennemsnittet over hænder, hvor A er entydig), og P4 kræver kun kort i ♥ (7a's P4 kræver også ♠). P8 står i S4 og S8 også, når Vest ikke har trumf ("altid").
3. **"Table feeling"**: gruppen er farvens to øverste kort, når de står i træk (E K, K D, D B); B 10 har ingen gruppe og ingen tilføjelse. Tilføjelsen står kun med svar i kort, fordi kun dér er der en sætning om de to kort, og med alle profiler, der giver to kort.
4. **P8 i forklaringen**: grupperne står efter deres første farve i orden ♠ ♥ ♦ ♣, og kun den første sætterchance har "sætter" (specens eksempel). Flere lige gode står samlet: "mens trumf, ♦ og ♣ er lige gode". Er alle lige gode: "Med dobbeltdummy er trumf, ♠ og ♦ lige gode efter dette forløb." uden forskel. Ingen af de to forekommer med tallene fra 7a.
5. **"Ved bordet"**: leddene bindes med "mens" i S1–S3 og som liste med ", og" før det sidste i S4 og S8; S5 og S6 har ét led. "dog" ("actually") står, når stikkene går imod Kompendiets retning fra 7a (P1, P2, P3, P5, P7 og P8 i S6: A; P4 og P8 i S4 og S8: B; P6 ingen); med tallene fra 7a kun ved P2. Retningen står i `findUdspilTekst.ts`, fordi appen ikke henter `raadanalyse.ts`. Navnene er kortere end i forklaringen ("småkort", "en farve med en eller to honnører"). Farverne i P3 og P8 lægges sammen efter samme regel som i forklaringen, også sætterchancens betingelse, selv om den ikke vises; dækker én gruppe alle farverne, hedder de "minorfarverne" og "hver sidefarve". De lige gode står med ", mens trumf og ♦ er lige gode", når leddet står først (S6), og med " og er lige så godt som ♣" i en liste (S4).
6. **Afrundingen** er 7a's (`toFixed`), og fortegnene sammenlignes med `Math.sign`, så en sætterchance på præcis 0 også udelades.
7. **Engelsk**: "With double dummy, leading X … gives …" (verbet er altid ental, også ved "small cards"), "are equally good leads", "percentage points more/less often", "defeating the contract" i P8's parentes og "actually" for "dog". Grupperne hedder A K, K Q og Q J.
8. **Testene**: `foer.json` er skrevet i den røde fase med koden ved tagget (forklaringerne, "Ved bordet", ⓘ og hashen). Hashen i accepttest 6 dækker også prisen for hvert muligt svar (hver farve og hvert kort) med de tre profiler. Accepttest 7 tjekker de nye sætninger for sig og ⓘ mod teksten ved tagget; accepttest 8 kræver desuden, at `raadanalyse.ts` kun har nye linjer, at `kompas.test.tsx` kun har `}, 30_000);`, og at `CLAUDE.md` har én ny linje.
9. **`kompas.test.tsx`**: 30 s på de fem tests, der tegner skærme i en løkke; de to små (antallet af opgaver og CSS-reglen) er uændrede.

**Tekster til gennemgang.** Alle nye sætninger på dansk og engelsk med tallene fra 7a (koden regner dem ud fra `raadtal.json`).

ⓘ i Find udspillet (sidst i `udspil.hjaelp`):
- DA: Sætningerne "Med dobbeltdummy …" er gennemsnit over hænderne i meldeforløbet. Dobbeltdummy kender alle kort, så passive udspil undervurderes, og honnørudspil overvurderes.
- EN: The sentences "With double dummy …" are averages over the hands in the auction. Double dummy knows all the cards, so passive leads are underrated and honour leads overrated.

"Ved bordet" (sidst; S7 uændret):
- S1, S2 DA: Med dobbeltdummy giver den korteste major dog 0,10 stik mindre end den længste, mens en kort major og en firefarve i minor med honnør er lige gode.
- S1, S2 EN: With double dummy, leading the shorter major actually gives 0.10 fewer tricks than the longer one, while a short major and a four-card minor with an honour are equally good.
- S3 DA: Med dobbeltdummy giver ♥ uden dyb sekvens 0,12 stik mindre end ♠, mens ♠ og minorfarverne er lige gode.
- S3 EN: With double dummy, leading ♥ without a deep sequence gives 0.12 fewer tricks than ♠, while ♠ and the minors are equally good.
- S4 DA: Med dobbeltdummy giver singletonen 0,13 stik mere end småkort, småkort giver 0,15 stik mere end en farve med en eller to honnører, doubletonen og småkort er lige gode, og trumf giver 0,06 stik mindre end ♠ og ♦ og er lige så godt som ♣.
- S4 EN: With double dummy, leading the singleton gives 0.13 more tricks than small cards, leading small cards gives 0.15 more tricks than a suit with one or two honours, the doubleton and small cards are equally good, and leading a trump gives 0.06 fewer tricks than ♠ and ♦ and is as good as ♣.
- S5 DA: Med dobbeltdummy giver singletonen 0,11 stik mere end småkort i en sidefarve.
- S5 EN: With double dummy, leading the singleton gives 0.11 more tricks than small cards in a side suit.
- S6 DA: Med dobbeltdummy giver trumf 0,07 stik mere end ♠ og 0,32 stik mere end ♥, mens trumf og ♦ er lige gode; trumf er den bedste farve i 46 % af hænderne.
- S6 EN: With double dummy, leading a trump gives 0.07 more tricks than ♠ and 0.32 more tricks than ♥, while a trump and ♦ are equally good; the trump suit is the best suit in 46% of the hands.
- S8 DA: Med dobbeltdummy giver singletonen 0,17 stik mere end småkort, doubletonen og småkort er lige gode, og trumf giver 0,06 stik mindre end hver sidefarve.
- S8 EN: With double dummy, leading the singleton gives 0.17 more tricks than small cards, the doubleton and small cards are equally good, and leading a trump gives 0.06 fewer tricks than each side suit.

Forklaringen, ét eksempel pr. række (sidst i forklaringen; antallet er forklaringer med profilen Standard over begge svarformer):
- P2 (S1 og S2, 480): DA "Med dobbeltdummy giver den korteste major efter dette forløb i gennemsnit 0,10 stik mindre end den længste og sætter kontrakten 1,8 procentpoint sjældnere." EN "With double dummy, leading the shorter major after this auction gives on average 0.10 fewer tricks than the longer one and defeats the contract 1.8 percentage points less often."
- P1 (S1 og S2, 26): DA "Med dobbeltdummy er en kort major og en firefarve i minor med en eller to honnører lige gode efter dette forløb (forskel 0,03 stik)." EN "With double dummy, a short major and a four-card minor with one or two honours are equally good leads after this auction (difference 0.03 tricks)."
- P4 (S3, 300): DA "Med dobbeltdummy giver ♥ uden dyb sekvens efter dette forløb i gennemsnit 0,12 stik mindre end ♠ og sætter kontrakten 1,6 procentpoint sjældnere." EN "With double dummy, leading ♥ without a deep sequence after this auction gives on average 0.12 fewer tricks than ♠ and defeats the contract 1.6 percentage points less often."
- P5 · S4 (40): DA "Med dobbeltdummy giver singletonen efter dette forløb i gennemsnit 0,13 stik mere end en sidefarve med småkort og sætter kontrakten 4,4 procentpoint oftere." EN "With double dummy, leading the singleton after this auction gives on average 0.13 more tricks than a side suit with small cards and defeats the contract 4.4 percentage points more often." P5 · S5 (30) og P5 · S8 (14) har 0,11 og 3,0 og 0,17 og 3,4.
- P6 · S4 og S8 (178 i alt; samme sætning i begge): DA "Med dobbeltdummy er doubletonen uden honnør og en sidefarve med småkort lige gode efter dette forløb (forskel 0,02 stik)." EN "With double dummy, the doubleton without an honour and a side suit with small cards are equally good leads after this auction (difference 0.02 tricks)."
- P7 (S4, 110): DA "Med dobbeltdummy giver småkort i en sidefarve efter dette forløb i gennemsnit 0,15 stik mere end en sidefarve med en eller to honnører og sætter kontrakten 1,7 procentpoint oftere." EN "With double dummy, leading small cards in a side suit after this auction gives on average 0.15 more tricks than a side suit with one or two honours and defeats the contract 1.7 percentage points more often."
- P8 · S4 (48): DA "Med dobbeltdummy giver trumf efter dette forløb i gennemsnit 0,06 stik mindre end ♠ og ♦ (sætter 1,2 procentpoint sjældnere), mens trumf og ♣ er lige gode." EN "With double dummy, leading a trump after this auction gives on average 0.06 fewer tricks than ♠ and ♦ (defeating the contract 1.2 percentage points less often), while a trump and ♣ are equally good."
- P8 · S6 (298): DA "Med dobbeltdummy giver trumf efter dette forløb i gennemsnit 0,07 stik mere end ♠ (sætter 2,7 procentpoint oftere) og 0,32 stik mere end ♥ (5,6 procentpoint oftere), mens trumf og ♦ er lige gode." EN "With double dummy, leading a trump after this auction gives on average 0.07 more tricks than ♠ (defeating the contract 2.7 percentage points more often) and 0.32 more tricks than ♥ (5.6 percentage points more often), while a trump and ♦ are equally good."
- P8 · S8 (210): DA "Med dobbeltdummy giver trumf efter dette forløb i gennemsnit 0,06 stik mindre end ♥, ♦ og ♣ (sætter 0,8–0,9 procentpoint sjældnere)." EN "With double dummy, leading a trump after this auction gives on average 0.06 fewer tricks than ♥, ♦ and ♣ (defeating the contract 0.8–0.9 percentage points less often)."
- P9, efter sætningen om de to kort (svar i kort): DA "Med dobbeltdummy giver toppen fra E K i gennemsnit 0,83 stik mere end det lave kort og sætter kontrakten 12,3 procentpoint oftere; tallet er en øvre grænse, fordi dobbeltdummy overvurderer honnørudspil." EN "With double dummy, leading the top card from A K gives on average 0.83 more tricks than the low card and defeats the contract 12.3 percentage points more often; the figure is an upper limit, because double dummy overrates honour leads." K D har 0,32 og 2,4 (K Q), og D B 0,14 og 1,0 (Q J).

Former, der ikke forekommer med tallene fra 7a (accepttest 3):
- A giver mere uden sætterchance: "… 0,15 stik mere end en sidefarve med en eller to honnører." / "… 0.15 more tricks than a side suit with one or two honours."
- P9, toppen giver mindre: "Med dobbeltdummy giver toppen fra D B i gennemsnit 0,14 stik mindre end det lave kort og sætter kontrakten 1,0 procentpoint sjældnere." / "With double dummy, leading the top card from Q J gives on average 0.14 fewer tricks than the low card and defeats the contract 1.0 percentage points less often."
- P9, lige gode: "Med dobbeltdummy er toppen og det lave kort fra E K lige gode (forskel 0,04 stik)." / "With double dummy, the top card and the low card from A K are equally good (difference 0.04 tricks)."
- P8, alle lige gode: "Med dobbeltdummy er trumf, ♠, ♥ og ♦ lige gode efter dette forløb." / "With double dummy, a trump, ♠, ♥ and ♦ are equally good leads after this auction."
- P8, flere lige gode: "…, mens trumf, ♦ og ♣ er lige gode." / "…, while a trump, ♦ and ♣ are equally good."

**Tokenforbrug pr. session** (nye input, skrevet til cachen, læst fra cachen og output):
- Session 1: 134 / 336.180 / 15.986.352 / 151.148 (lagt sammen fra sessionens transcript: 66 kald til og med den fulde testkørsel og commit af byggeriet; de sidste kald med Afklaret og commit er ikke med, og Franks `/usage` før og efter giver hele sessionen)
