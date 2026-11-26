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

(udfyldes af Claude Code: de faste hænder, valgene, tokenforbruget og "Tekster til gennemgang")
