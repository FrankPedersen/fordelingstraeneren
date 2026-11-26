# SPEC – Kompendiets udspilsråd mod dobbeltdummy

25. november 2026 · Fordelingstræneren · opgave Æ i `PLAN-aabne-opgaver.md`. Bygger på Modspil v2's datasæt (`docs/specs/SPEC-modspil-v2.md`, udgivet 25. nov. 2026). Ikke godkendt endnu.

Opgaven tester Kompendiets udspilsråd (*Kompendium over modspilsaftaler*) påstand for påstand mod dobbeltdummy på Modspil v2's fordelinger, der passer med meldeforløbet. For hver påstand angiver resultatet forskellen i stik, hvor ofte påstanden holder, og hvor sikkert tallet er. Resultatet bliver afsnit 7a i `docs/MODEL.md`. **Appen ændres ikke**: tallene kommer ind i forklaringerne i øvelse 8 i en senere, lille spec, når Frank har set dem (Franks valg 25. nov.).

**Franks valg før specen (25. nov. 2026):**
1. De påstande, der har for få hænder i de 1200 opgaver (singleton, doubleton uden honnør og "table feeling" mod sans), får **ekstra hænder**: generatoren laver 150 hænder pr. variant, hvor Vests hånd har den form. De ligger i en mappe for sig, og appens data røres ikke.
2. Tallene kommer ind i øvelse 8 **efter** resultatet, i en spec for sig.

**Rådgiverens første kig (25. nov., groft, med det bedste kort i hver farve set bagefter; ikke facit):** i S1 og S2 giver den korteste major 0,10–0,12 stik *mindre* end den længste (122 og 118 hænder), altså det modsatte af Kompendiet. Kort major mod en firefarvet minor med honnør er nærmest lige (+0,03; 39 og 45 hænder). I datasættet er der kun 3–5 hænder pr. situation med singleton og småkort, 10–15 med doubleton uden honnør og småkort og 0–4 med E K x x mod sans. Analysen her skal give de rigtige tal.

## Trinene og sessionerne

Ét leverancetrin på grenen `udspilsraad`; `main` før ændringen tagges `v50-foer-udspilsraad`. Frank sender `/usage` før og efter hver session, og Claude Code skriver tokenforbruget i fire tal under Afklaret (nye input, skrevet til cachen, læst fra cachen og output).

| Session | Indhold | Model |
| --- | --- | --- |
| 1 | tag, gren, varianterne (`varianter.json`, kravene i Python og TS, `generer.py --variant`), accepttestene (røde), prøvekørsel af 2 hænder pr. variant med tiden, stop | Opus, high effort |
| (kørsel) | **Frank kører generatoren selv** i en terminal, én variant ad gangen, og bagefter `kontrol.py --varianter`. Ingen session venter | – |
| 2 | analysen (`raadanalyse.ts` og `raadanalyse.mjs`), accepttestene grønne, afsnit 7a i `docs/MODEL.md`, rapporten og "Tekster til gennemgang" under Afklaret, stop før fletning | Opus, high effort |
| 3 | efter "godkendt": hele suiten, flet, push, `../SYSTEM.md`, arkivering af specen og sletning af grenen | Sonnet, medium effort |

Session 2 startes først, når Frank har kørt varianterne.

## Afgrænsning

| Sted | Må ske | Må ikke ske |
| --- | --- | --- |
| `tools/udspil/varianter.json` (ny) | varianterne | – |
| `tools/udspil/krav.py`, `generer.py`, `kontrol.py` | nye krav, `--variant`/`--varianter` og README-afsnit | ændret adfærd for de otte situationer (accepttest 2) |
| `tools/udspil/raa/varianter/` (ny) | rådata for varianterne | – |
| `tools/udspil/raadanalyse.mjs` (ny) | scriptet, der skriver tabellerne | – |
| `src/modspil/udspil/` | `raadanalyse.ts` (ren kode, kun brugt af tests og scriptet), nye tests og de nye krav i `hjaelp.ts` | eksisterende tests ændres |
| `tools/udspil/raa/S*.json`, `src/modspil/content/udspil/` | – | ændres |
| `docs/MODEL.md` | nyt afsnit 7a mellem afsnit 7 og 8 og én linje i afsnit 9 | andre afsnit ændres |
| `CLAUDE.md` | én linje om analysen | andet |
| `scripts/ordliste.txt` | nye ord til stavekontrollen | – |
| Appens kode (`src/` uden for `src/modspil/udspil/`) | – | ændres |

Kræver noget andet en ændring uden for afgrænsningen, stopper Claude Code og spørger. Alle eksisterende tests skal bestå uændret.

## Varianterne (`tools/udspil/varianter.json`)

En variant er en af de otte situationer med et ekstra krav til Vests hånd og sit eget seed. Opgaverne og fordelingerne laves nøjagtigt som i Modspil v2 (`deal(seed)`, 100 fordelinger pr. opgave med `shuffle`, DDS for alle 13 kort): det eneste nye er, at Vests hånd også skal opfylde det ekstra krav. Alle situationens krav gælder stadig, også Vests pas. **150 hænder pr. variant.**

Honnører betyder her E, K, D og B. "Sidefarve" er en farve, der ikke er trumf.

| Variant | Situation | Vests ekstra krav |
| --- | --- | --- |
| `S4-singleton` | S4 1♥ – 2♥ – 4♥ | en singleton i en sidefarve og en anden sidefarve med 3+ kort uden honnør |
| `S5-singleton` | S5 1♠ – 2♥ – 2♠ – 4♠ | en singleton i ♥, ♦ eller ♣ og en anden af de tre med 3+ kort uden honnør |
| `S8-singleton` | S8 1♠ – 3♠ | som S5 |
| `S4-doubleton` | S4 | en sidefarve med 2 kort uden honnør og en anden sidefarve med 3+ kort uden honnør |
| `S8-doubleton` | S8 | som S4-doubleton med ♥, ♦ og ♣ |
| `S1-tablefeeling` | S1 1NT – 3NT | en farve med 3+ kort, hvor profilen Standard giver "table feeling" mod sans (to honnører i træk øverst: E K, K D eller D B, men ikke tre i træk eller en brudt sekvens som K D 10) |
| `S2-tablefeeling` | S2 1NT – 2♣ – 2♦ – 3NT | som S1 |

**Kravene:** to nye nøgler i `krav.py` og i TS (`hjaelp.ts`):
- `farveMed`: en liste, hvor hvert element `{"blandt": [...], "laengde": [lo, hi], "honnoerer": [lo, hi]}` skal opfyldes af mindst én farve blandt `blandt`. Elementerne må opfyldes af forskellige farver; længderne i tabellen er valgt, så de ikke kan være den samme farve.
- `tableFeeling`: `{"blandt": [...], "min": 3}`. I Python efter reglen i tabellen; i TS med appens egen `muligeUdspil` (to kort mulige med profilen Standard mod sans), så TS-kontrollen er uafhængig af Python.

Singletonen må gerne være en honnør (`honnoerer [0, 1]`), fordi Kompendiets råd gælder alle singletoner.

**`generer.py --variant <id>`** skriver kun `tools/udspil/raa/varianter/<id>.json` (samme format som `raa/<situation>.json` plus variantens id og ekstra krav) og ingen appdata. Kørslen kan genoptages og skriver fremdriften og den forventede tid, som `--situation`. `--varianter` kører alle syv efter hinanden. **`kontrol.py --varianter`** kører DDS-tjekket mod `calc_dd_table` på 10 % af variantens fordelinger.

**Tiden:** session 1 prøvekører 2 hænder pr. variant og skriver tiden under Afklaret. Ventes hele kørslen at tage mere end 2 timer på Franks pc, foreslår agenten færre hænder og spørger Frank.

## Påstandene

Hver påstand sammenligner to udspil, A og B, **på de samme hænder og de samme fordelinger** (parret). Hændernes datasæt står i kolonnen "Data": "base" er Modspil v2's 150 opgaver, og en variant er de 150 ekstra hænder. Hvor både base og variant passer, bruges begge, og rækken viser de to antal for sig og samlet.

**Kortet i farven:** udspillet i en farve er det kort, profilen Standard spiller (`muligeUdspil` med `profil('standard')`), og stikkene er stikkene for netop det kort i hver fordeling i rådataene. Ved "table feeling" bruges kortet med flest middelstik, som i `farvevaerdier` (undtagen i P9, der sammenligner de to kort).

**Ingen "bedste af resten":** B er altid én bestemt farve, valgt efter en fast regel uden at se på stikkene. Har hånden flere farver, der passer som B, vælges den længste, og ved lige længde den højeste (♠ ♥ ♦ ♣). Hænder, hvor A ikke er entydig (fx to lige lange majorer i P2), udelades, og antallet skrives i rækken.

| # | Kompendiets påstand (s.) | Situation, data | A | B |
| --- | --- | --- | --- | --- |
| P1 | En kort major er bedre end en firefarve med en eller to honnører i en minor (s. 11–12, 14) | S1 + S2, base | den korteste major (højst 3 kort) | en minor med præcis 4 kort og 1–2 honnører |
| P2 | Mod 1NT – 3NT helst den korteste major (s. 11–12) | S1 + S2, base | den korteste major | den længste major; også delt på den korteste majors længde (1–2 / 3) |
| P3 | Efter transfer har ♠ en lille fordel blandt de andre farver (s. 14) | S3, base | ♠ | ♦ og ♣ hver for sig (to rækker) |
| P4 | Bordets viste ♥ er sjældent rigtigt uden en dyb sekvens (s. 14) | S3, base | ♥ uden dyb sekvens | ♠ |
| P5 | En singleton i en sidefarve er et glimrende udspil (s. 19–20) | S4, S5, S8; base + variant | singletonen | sidefarven med 3+ kort uden honnør |
| P6 | En doubleton uden honnør er bedre end sit rygte (s. 19) | S4, S8; base + variant | doubletonen | sidefarven med 3+ kort uden honnør |
| P7 | Med et svagt bord er småkort bedre end en farve med en eller to honnører (s. 19) | S4, base | sidefarve med 3+ kort uden honnør | sidefarve med 3+ kort og 1–2 honnører uden sekvens |
| P8 | Trumf ud: stærkt efter 1♥ – 1♠ – 2♣ (s. 4); kun attraktivt, når ingen sidefarve er det (s. 19); ofte det dårligste i delkontrakten (s. 19) | S6, S4, S8; base | trumf | hver sidefarve for sig; desuden trumfs plads blandt hændens farver (1.–4.) |
| P9 | "Table feeling" mod sans: toppen eller det lave kort fra to honnører i træk | S1 + S2; base + variant | toppen | det lave kort (Standard), samme farve; delt på E K / K D / D B og længde 3 / 4 / 5+ |

**S4 og S6 for sig** (Franks ønske): rådet er blandt dobbeltdummys bedste farver i 80 % i S4 og 61 % i S6. For de hænder, hvor rådet ikke er blandt de bedste, viser en tabel hvilken farve der var bedst, og hændernes træk: Vests trumflængde, honnør i trumf, singleton eller doubleton i en sidefarve og en honnørsekvens i en sidefarve. Tabellen tæller, den forklarer ikke.

**S1 opgave 55** (indeks 55, seed 2556829236, ♠K B 7 6 ♥E K 4 3 ♦10 8 6 3 ♣B) er fast eksempel i P9: ♥E giver 3,35 stik og ♥3 2,52 (begge rigtige med Standard, set ved trin 3's skærmbilleder).

## Tallene pr. række

For hver række (og hver underopdeling):
- **n:** antal hænder (base, variant og i alt) og hvor mange hænder der er udeladt, og hvorfor.
- **Forskel i stik:** gennemsnittet over hænderne af A's middelstik minus B's (modspillets stik), med to decimaler.
- **Standardfejl og 95 %-interval:** standardfejlen er spredningen af forskellene pr. hånd divideret med √n (hånden er enheden; fordelingernes støj ligger i forskellen pr. hånd). Intervallet er ± 1,96 standardfejl.
- **Holder / lige / modsat:** andelen af hænder, hvor A er mindst 0,1 stik bedre end B, hvor de er under 0,1 stik fra hinanden (appens "lige godt", Franks svar 4 i Modspil v2), og hvor B er mindst 0,1 stik bedre.
- **Chancen for at sætte:** forskellen i procentpoint mellem A og B i andelen af fordelinger, hvor kontrakten sættes.

**Dommen** (én kolonne, maskinel):
- **For få hænder:** n < 30. Tallene vises, men der gives ingen dom.
- **Holder:** intervallet ligger helt over 0.
- **Modsat:** intervallet ligger helt under 0.
- **Ingen forskel påvist:** intervallet indeholder 0.
- Ligger gennemsnittet under 0,05 stik fra 0, står der desuden "uden praktisk betydning".

Varianternes hænder er udvalgt efter formen, så de siger intet om, hvor ofte formen forekommer. Hyppigheden står for sig: andelen af basens 150 hænder, der har formen.

## Forbehold (skal stå i afsnit 7a)

- **Dobbeltdummy kender alle kort.** Spilføreren gætter aldrig forkert, og modspillet finder altid skiftet. Udspil, der virker, fordi spilføreren skal gætte (passive og korte udspil), undervurderes; aktive udspil, især esudspil, overvurderes, fordi modspillet "ser" det rigtige skift efter at have set bordet (MODEL.md afsnit 8). Det gælder især P2 og P9.
- **Gennemsnitlige stik er parturneringens mål.** I holdturnering tæller chancen for at sætte mere; den står derfor ved siden af.
- **Fordelingerne passer med meldingerne efter appens system**, ikke med alle måder at melde på, og varianternes hænder er udvalgt efter formen.
- **Kun de otte situationer.** Konklusionerne gælder meldeforløbene, ikke udspil generelt.
- **Kompendiet citeres ikke**; påstandene omskrives med siden (som i Modspil v2, Franks svar 9).

## Afsnit 7a i `docs/MODEL.md`

Overskriften er "## 7a. Kompendiets udspilsråd mod dobbeltdummy". Afsnittet har en kort indledning (data, metode og henvisning til denne spec), én tabel med P1–P9 og dommen, tabellen for S4 og S6, forbeholdene og 3–6 korte konklusioner. Tabellerne står mellem markørerne `<!-- raadanalyse:start -->` og `<!-- raadanalyse:slut -->` og er nøjagtigt det, `node tools/udspil/raadanalyse.mjs --markdown` skriver; konklusionerne står efter markørerne og er agentens tekst til Franks gennemgang. Afsnit 9 får én linje om, hvordan tallene regnes igen.

## Accepttest (skrives først, røde)

Testene ligger i `src/modspil/udspil/raadanalyse.test.ts` og `varianter.test.ts`. Tunge løkker har tidsgrænsen 300 s pr. variant.

1. **Varianterne:** `varianter.json` har de syv varianter med situation, ekstra krav og seed. TS genskaber hver hånd med appens `deal(seed)` og hver fordeling med `shuffle` og tjekker situationens krav og variantens ekstra krav med egen TS-kode (`tableFeeling` med `muligeUdspil`). For én hånd pr. variant tjekkes også, at de seeds, generatoren sprang over, virkelig ikke opfylder kravene.
2. **De otte situationer er uændrede:** `tools/udspil/raa/S*.json` og `src/modspil/content/udspil/` er byte for byte som ved `v50-foer-udspilsraad`, og `generer.py --situation S1-1nt-3nt --antal 1 --ud <tmp>` giver den samme første opgave som i `raa/S1-1nt-3nt.json` (springes over med en besked, hvis Python ikke findes).
3. **Variantdataene:** 150 hænder pr. variant, 100 fordelinger pr. hånd, 13 kort pr. fordeling, stik mellem 0 og 13.
4. **Statistikken** på faste, håndregnede tal: forskel, standardfejl, interval, holder/lige/modsat ved grænsen 0,1, forskel i chancen for at sætte og dommen i alle fem tilfælde (for få, holder, modsat, ingen forskel og "uden praktisk betydning").
5. **Udvælgelsen** på faste hænder: A og B i P1–P9 efter reglerne (den længste og så den højeste ved flere B'er, udeladelse når A ikke er entydig), kortet efter profilen Standard og de to kort ved "table feeling" (E K 7 4, K D 8 5 3 og D B 6 2 giver to kort; E K D 4 og K D 10 9 giver ét).
6. **S1 opgave 55:** P9's kolonner for hånden giver ♥E 3,35 og ♥3 2,52 stik.
7. **MODEL.md:** teksten mellem markørerne er lig `raadanalyse.mjs --markdown`, og afsnit 1–7 og 8–9 er uændrede bortset fra linjen i afsnit 9.
8. **Intet andet er ændret** siden `v50-foer-udspilsraad` end filerne i Afgrænsningen og specen.

## Arbejdsgang

1. Session 1: tag `v50-foer-udspilsraad`, opret grenen `udspilsraad`, byg varianterne og skriv accepttestene, som skal være røde, og commit dem. Prøvekør 2 hænder pr. variant, og skriv tiden under Afklaret. **Stop.**
2. Frank kører i en terminal fra repoets rod:
   ```powershell
   tools\udspil\.venv\Scripts\python tools\udspil\generer.py --varianter
   tools\udspil\.venv\Scripts\python tools\udspil\kontrol.py --varianter
   ```
3. Session 2: byg analysen, så testene er grønne uden at blive rettet. Skriv afsnit 7a, rapporten (tabellen fra scriptet og de vigtigste fund i 5–8 linjer) og "Tekster til gennemgang" (konklusionerne i 7a) under Afklaret. `npm test` skal være grøn. **Stop før fletning.**
4. Franks "godkendt", så flettes og pushes der (session 3). Der er intet live-tjek, fordi appen ikke ændres. `../SYSTEM.md` opdateres, specen arkiveres i `docs/specs/` med en linje i `docs/specs/README.md`, og grenen slettes.

Opfølgningen (tallene i forklaringerne i øvelse 8) er ikke med her.

## Afklaret

(udfyldes af Claude Code: tiden for prøvekørslen, tokenforbruget pr. session, rapporten og "Tekster til gennemgang")

**Session 1 (25. nov. 2026, Opus 5.5, high effort)**

- **Tag og gren:** `main` (`a60ae52`) er tagget `v50-foer-udspilsraad`, og grenen `udspilsraad` er oprettet. Byggeriet og de røde accepttest er committet i `09fe92a`. Der er ikke flettet eller pushet.
- **Varianterne:** `tools/udspil/varianter.json` har de syv varianter i specens rækkefølge med seedene 2611251–2611257 og `"opgaver": 150`. Kravene `farveMed` og `tableFeeling` står i `krav.py` og i `hjaelp.ts`. `generer.py --variant <id>` og `--varianter` skriver kun `tools/udspil/raa/varianter/<id>.json`: situationens hoved (`id` er situationens id) plus `variant` og `ekstra`, og `eksempler` er tom. Kørslen kan genoptages som `--situation` og stopper, hvis filen er lavet til en anden variant eller med et andet ekstra krav. `kontrol.py --varianter` (eller `--variant <id>`) kører DDS-tjekket på hver tiende fordeling. `tools/udspil/README.md` har et afsnit om varianterne.
- **Python og TS er enige:** for `deal(seed)` med seed 1–40.000 giver de ekstra krav (uden situationens krav) det samme i Python og TS for alle syv varianter, med 0 afvigelser. Andelen af tilfældige hænder med formen: singleton 6,2–6,3 %, doubleton uden honnør 7,5 % og "table feeling" 27,1 %.
- **Accepttestene:** 101 tests i `src/modspil/udspil/varianter.test.ts` og `raadanalyse.test.ts`; 90 er røde og 11 grønne. Røde: accepttest 1's datadel og accepttest 3 (21, fordi variantdataene ikke findes endnu) og accepttest 4–7 (69: "ikke bygget" i `raadanalyse.ts` og intet afsnit 7a). Grønne: accepttest 1's tjek af `varianter.json` og af de nye krav på faste hænder (4), accepttest 2 (3; `generer.py --situation S1-1nt-3nt --antal 1` gav den samme første opgave på 2,3 s), accepttest 8 (3) og rækkerne i accepttest 5 (1). `raadanalyse.ts` har signaturerne, typerne og `RAEKKER`; hver funktion kaster "ikke bygget" som `findUdspil.ts` i Modspil v2, session 2a. `tsc` er grøn.
- **De øvrige tests:** `npx vitest run src/modspil src/sprog` uden de to nye filer gav 46 af 47 filer grønne, 375 bestået og 2 sprunget over. `src/modspil/ui/kompas.test.tsx` løb over standardens 5 s under den parallelle kørsel og er grøn alene (7 af 7). Hele `npm test` er ikke kørt i session 1.
- **Prøvekørslen:** 2 hænder pr. variant i en midlertidig mappe (`--ud`) på pc'en i `C:\Users\frank` (Intel Core i7-1355U, 12 logiske kerner):

  | Variant | Tid i alt | Pr. hånd | 150 hænder |
  | --- | --- | --- | --- |
  | S4-singleton | 21,7 s | 7,9 s | ca. 20 min |
  | S5-singleton | 22,5 s | 10,6 s | ca. 27 min |
  | S8-singleton | 20,1 s | 9,5 s | ca. 24 min |
  | S4-doubleton | 11,5 s | 5,2 s | ca. 13 min |
  | S8-doubleton | 9,1 s | 4,0 s | ca. 10 min |
  | S1-tablefeeling | 6,6 s | 2,8 s | ca. 7 min |
  | S2-tablefeeling | 5,8 s | 2,3 s | ca. 6 min |
  | I alt | 97,3 s | | ca. 1 t 46 min |

  "Pr. hånd" er generatorens eget tal efter 2. hånd (tiden siden start delt med 2). Hele kørslen ventes at tage ca. 1¾ time, altså under 2 timer, så **de 150 hænder pr. variant beholdes** (specens "Tiden"). Tallet er usikkert, fordi det bygger på 2 hænder pr. variant: i S5-singleton tog den første hånd 6,3 s og den anden ca. 15 s. Singletonvarianterne tager længst, fordi hånden er sjælden: søgningen alene (20 hænder) tog ca. 4 s pr. hånd i S5 og S8 (160.000–210.000 blandinger pr. hånd) og 1 s i S4. Hver variant kan køres for sig (6–27 min) og afbrydes og fortsættes.
- **Kontrol af prøvekørslen:** `kontrol.py --varianter --raa <mappe>` tjekkede 140 fordelinger mod DDS-tabellen med 0 afvigelser (17 s), og der blev ikke skrevet appdata. Lagt midlertidigt i `raa/varianter/` gav prøvehænderne accepttest 1 grøn (14 af 14 for genskabelsen og de oversprungne seeds) og accepttest 3 rød som ventet (2 hænder mod 150). Filerne er fjernet igen, så Franks kørsel starter forfra.

**Claude Codes valg i session 1** (accepttestene bygger på dem):

1. **"Table feeling" er kun E K, K D og D B.** Specen siger "to honnører i træk", og honnørerne er E, K, D og B. Appens `muligeUdspil` giver også to kort fra B 10 x (x), men de hænder er hverken med i varianterne eller i P9. TS-kravet er derfor, at `muligeUdspil` giver to kort, og at det næsthøjeste kort er mindst B (`tableFeeling` i `hjaelp.ts`); Python følger tabellens regel.
2. **Variantens rådata:** `id` er situationens id, så formatet er det samme som `raa/<situation>.json`, og `variant` og `ekstra` står efter `kontrakt`. Seedet står kun i `varianter.json`.
3. **Renonce i en major (P1 og P2):** i P1 er "den korteste major" den korteste af de majorer, Vest har kort i. P2 kræver kort i begge majorer; ellers er hånden ikke med.
4. **P2's underopdeling** har også gruppen "4+" (4-5 i majorerne), så grupperne tilsammen er hele rækken; specen nævner kun 1–2 og 3.
5. **"Uden sekvens" i P7:** profilen Standard spiller ikke en honnør ud i farvekontrakt (appens sekvensregel, hvor også B 10 er en sekvens).
6. **Udeladt** gælder kun hænder, der passer i rækken, men hvor A ikke er entydig: to lige lange majorer (P1 og P2), to singletoner (P5), to doubletoner uden honnør (P6), to sidefarver med 3+ kort uden honnør (P7) eller "table feeling" i to farver (P9). En hånd uden B eller med renonce i A eller B er ikke med i rækken og tælles ikke som udeladt.
7. **Statistikken:** spredningen er stikprøvespredningen (n − 1), og grænsen 0,1 regnes med en tolerance på 1e-9, så 0,3 − 0,2 tæller som 0,1. "Uden praktisk betydning" står kun ved en dom, altså ikke ved for få hænder. Dommens tekster er "For få hænder", "Holder", "Modsat" og "Ingen forskel påvist", og ", uden praktisk betydning" står efter.
8. **En side med to kort** ("table feeling" uden for P9): kortet med flest middelstik bruges; står de lige, det med flest sætninger.
9. **"Undtagen i P8"** under "Kortet i farven" er læst som P9, der sammenligner de to kort.
10. **Accepttest 2** sammenligner med `git diff` mod tagget, fordi arbejdsmappen har CRLF (autocrlf), og nye filer tæller med. **Accepttest 8** tillader også `docs/specs/SPEC-udspilsraad.md` og `docs/specs/README.md` (arkiveringen i session 3) og nye filer i `src/modspil/udspil/` og `tools/udspil/raa/varianter/`, og CLAUDE.md må have højst én ny linje. Usporede filer tæller med, og findes et tag `v51-foer-*`, sammenlignes tagget med det i stedet for arbejdsmappen.

**Spørgsmål til Frank før session 2:** i P4 (♥ uden dyb sekvens mod ♠) og i P8 i S8 (trumf i delkontrakten) er A den farve, Kompendiet fraråder. Dommen regnes på A − B, så "Modsat" betyder dér, at Kompendiet har ret. Mulighederne er (a) at beholde dommen og forklare det i konklusionerne eller (b) at tabellen får en kolonne med Kompendiets retning (A bedre, B bedre eller "–" for P8 i S4, hvor rådet ikke har en retning), og at dommen siger "holder" og "modsat" om påstanden. Testene er de samme i begge tilfælde. Claude Code anbefaler (b).

**Session 2 (26. nov. 2026, Opus 5.5, high effort)**

- **Kørslen (Frank, 25.–26. nov.):** varianterne er kørt med `generer.py --varianter`, og `kontrol.py --varianter` gav for alle syv varianter (S4-, S5-, S8-singleton, S4-, S8-doubleton, S1-, S2-tablefeeling): 1500 fordelinger tjekket mod DDS-tabellen, 0 afvigelser.
- **Afsnit 7a** står i `docs/MODEL.md` mellem afsnit 7 og 8 med indledningen, tabellerne mellem markørerne (nøjagtigt `node tools/udspil/raadanalyse.mjs --markdown`), forbeholdene og seks konklusioner. Afsnit 9 har én ny linje, og CLAUDE.md én ny linje om analysen under Modspil v2. Appen er ikke ændret.

**Franks valg 26. nov.**

1. Tabellen har kolonnen "Kompendiets retning" (A eller B), og dommen siger "Kompendiet holder", "Kompendiet tager fejl", "Ingen forskel påvist" eller "For få hænder", og desuden "uden praktisk betydning" under 0,05 stik.
2. "Undtagen i P8" under Kortet i farven er rettet til P9.
3. Claude Codes valg 1, 4 og 9 fra session 1 er godkendt: "table feeling" kun E K, K D og D B, P2-gruppen 4+ og P9.
4. **3NT sættes ved 5 stik.** Accepttest 5 (`haandtal`) og 6 regnede 3NT sat ved 4 stik, efter kommentaren "3NT → 4" i `maal` og `kontraktens_maal`; koden giver 8 − niveau = 5 som appens facit. Sætningstallene i de to tests er rettet med Franks godkendelse: stikkene i `haandtal`-testen er 1 højere ("sat ved 5 stik"), og S1 opgave 55 sætter i 0,14 med ♥E og 0,04 med ♥3 (før 0,47 og 0,23). Stikkene 3,35 og 2,52 er uændrede. Kommentaren rettes sammen med `find_opgaver` (punkt 5).
5. **Dubletter i S5-singleton:** 4 hænder står to gange (samme seed og dermed samme hånd, fordelinger og stik: indeks 52 og 95, 32 og 118, 76 og 121 samt 0 og 123), fordi mulberry32 kan give samme tal igen; S5-singleton trak op til 2,4 mio. seeds pr. hånd. Dataene beholdes, og analysen tæller hver hånd én gang: P5 i S5 har 4 + 146 hænder og "4 (samme hånd to gange)" under Udeladt. Accepttest 3 tæller dubletterne mod `DUBLETTER` i `varianter.test.ts` (S5-singleton 4, de andre 0) i stedet for at kræve 150 forskellige seeds, og to nye tests i `raadanalyse.test.ts` viser, at analysen kun bruger forskellige hænder. Rettelsen i `find_opgaver` (et brugt seed springes over) står på planens småting til næste generering.
6. **Dubletter i basen:** de otte situationers rådata har 0 dubletter: 150 forskellige seeds og 150 forskellige hænder i hver, intet seed i to situationer, og intet eksempels seed er også en opgaves. Ingen varianthånd står i sin situations base. Intet er rettet.

**Claude Codes valg i session 2** (Frank kan ændre dem ved gennemgangen):

1. **Kompendiets retning:** A i P1, P2, P3, P5, P6 og P7, B i P4, og i P8 A i S6 og B i S4 og S8. I S4 er trumf "kun attraktivt, når ingen sidefarve er det", og Kompendiets råd i S4 peger aldrig på trumf, så retningen er B (session 1 foreslog "–"). P9 har ingen retning ("–"), fordi "table feeling" overlader valget til spilleren; dommen siger dér "A bedre" eller "B bedre". `domTekst` (accepttest 4) er uændret og giver dommen om A − B; tabellens dom kommer fra `kompendieDom`.
2. **P9's underopdeling** er to opdelinger hver for sig, toppen (E K, K D, D B) og længden (3, 4, 5+), ikke ni celler.
3. **Hyppigheden** er antallet af basens 150 hænder i situationen, der opfylder variantens ekstra krav (`opfyldt` med `ekstra` fra rådataene).
4. **Trumfs plads (P8)** er 1 + antallet af farver med flere middelstik end trumf (farvens værdi som i `farvevaerdier`, middelstikkene i hundrededele som i appen) og tæller kun hænder med trumf.
5. **S4 og S6:** "rådet blandt de bedste" regnes som i `rapporttal.mjs` (`kompendieraad` og `bedsteFarver`); "bedste farve" er farven med flest middelstik (ved lige den højeste); en honnørsekvens i en sidefarve er en sidefarve, hvorfra profilen Standard spiller en honnør ud i farvekontrakt (samme regel som "uden sekvens" i P7). Tabellen viser de samme optællinger for alle hænder ved siden af.
6. **Tabellerne:** dansk decimalkomma, fortegn (+0,12 og −0,10) og "–", hvor et tal ikke findes. Et interval, der er rundet til 0,00, kan stadig ligge helt på den ene side af 0 (P8 · ♣ i S4). Mellem markørerne står fem tabeller: påstandene med A og B, resultaterne (med det faste eksempel S1 opgave 55 under), hyppigheden, trumfs plads og S4 og S6.
7. **Afsnit 9's nye linje** står i kodeblokken: `node tools/udspil/raadanalyse.mjs --markdown  # afsnit 7a (Fordelingstrænerens rod)`. `scripts/ordliste.txt` har fire nye ord (doubletonen, doubletoner, raadanalyse og tablefeeling), og `node scripts/sprogtjek.ts` finder ingen ukendte ord.

**Testene:** `npm test` er grøn (tsc og Vitest): 171 testfiler, 1337 bestået og 2 sprunget over (293 s). `raadanalyse.test.ts` og `varianter.test.ts` alene: 103 af 103, så accepttest 1–8 er grønne; testene er kun rettet, hvor Frank valgte det (punkt 4 og 5 ovenfor). `node scripts/sprogtjek.ts` finder ingen ukendte ord, og `tsc` er grøn.

**Rapporten**

| Række | Situation | Kompendiets retning | Hænder (base + variant) | Udeladt | A − B (stik) | Standardfejl | 95 %-interval | A bedre / lige / B bedre | Sætter, A − B (procentpoint) | Dom |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | S1 + S2 | A | 71 | 13 (to lige lange majorer) | +0,03 | 0,02 | [−0,01; +0,06] | 32 % / 51 % / 17 % | +1,1 | Ingen forskel påvist, uden praktisk betydning |
| P2 | S1 + S2 | A | 240 | 58 (to lige lange majorer) | −0,10 | 0,01 | [−0,13; −0,08] | 10 % / 40 % / 51 % | −1,8 | Kompendiet tager fejl |
| P2 · korteste major 1–2 kort | S1 + S2 | A | 103 |  | −0,12 | 0,02 | [−0,15; −0,09] | 10 % / 33 % / 57 % | −2,4 | Kompendiet tager fejl |
| P2 · korteste major 3 kort | S1 + S2 | A | 120 |  | −0,10 | 0,02 | [−0,14; −0,06] | 9 % / 44 % / 47 % | −1,1 | Kompendiet tager fejl |
| P2 · korteste major 4+ kort | S1 + S2 | A | 17 |  | −0,03 | 0,07 | [−0,17; +0,12] | 12 % / 47 % / 41 % | −3,4 | For få hænder |
| P3 · ♦ | S3 | A | 149 | – | +0,03 | 0,02 | [−0,01; +0,06] | 31 % / 48 % / 21 % | +0,5 | Ingen forskel påvist, uden praktisk betydning |
| P3 · ♣ | S3 | A | 149 | – | +0,02 | 0,01 | [−0,01; +0,05] | 30 % / 47 % / 23 % | +0,6 | Ingen forskel påvist, uden praktisk betydning |
| P4 | S3 | B | 150 | – | −0,12 | 0,01 | [−0,14; −0,09] | 9 % / 39 % / 52 % | −1,6 | Kompendiet holder |
| P5 | S4 | A | 5 + 150 = 155 | – | +0,13 | 0,01 | [+0,12; +0,15] | 62 % / 38 % / 0 % | +4,4 | Kompendiet holder |
| P5 | S5 | A | 4 + 146 = 150 | 4 (samme hånd to gange) | +0,11 | 0,01 | [+0,09; +0,14] | 47 % / 46 % / 7 % | +3,0 | Kompendiet holder |
| P5 | S8 | A | 3 + 150 = 153 | – | +0,17 | 0,01 | [+0,15; +0,19] | 79 % / 17 % / 4 % | +3,4 | Kompendiet holder |
| P6 | S4 | A | 11 + 150 = 161 | – | −0,02 | 0,00 | [−0,03; −0,01] | 3 % / 87 % / 10 % | +0,4 | Kompendiet tager fejl, uden praktisk betydning |
| P6 | S8 | A | 10 + 150 = 160 | – | −0,02 | 0,01 | [−0,03; −0,01] | 9 % / 78 % / 13 % | +1,3 | Kompendiet tager fejl, uden praktisk betydning |
| P7 | S4 | A | 59 | 4 (to sidefarver med 3+ kort uden honnør) | +0,15 | 0,02 | [+0,12; +0,18] | 64 % / 34 % / 2 % | +1,7 | Kompendiet holder |
| P8 · ♠ | S6 | A | 149 | – | +0,07 | 0,02 | [+0,02; +0,11] | 46 % / 26 % / 29 % | +2,7 | Kompendiet holder |
| P8 · ♠ | S4 | B | 143 | – | −0,06 | 0,02 | [−0,10; −0,01] | 24 % / 45 % / 31 % | −1,2 | Kompendiet holder |
| P8 · ♥ | S6 | A | 149 | – | +0,32 | 0,03 | [+0,26; +0,37] | 76 % / 15 % / 9 % | +5,6 | Kompendiet holder |
| P8 · ♥ | S8 | B | 142 | – | −0,06 | 0,02 | [−0,10; −0,02] | 21 % / 51 % / 28 % | −0,9 | Kompendiet holder |
| P8 · ♦ | S6 | A | 149 | – | +0,03 | 0,02 | [0,00; +0,07] | 40 % / 32 % / 28 % | +2,4 | Ingen forskel påvist, uden praktisk betydning |
| P8 · ♦ | S4 | B | 144 | – | −0,06 | 0,02 | [−0,10; −0,02] | 22 % / 49 % / 30 % | −1,2 | Kompendiet holder |
| P8 · ♦ | S8 | B | 141 | – | −0,06 | 0,02 | [−0,10; −0,02] | 21 % / 45 % / 33 % | −0,8 | Kompendiet holder |
| P8 · ♣ | S4 | B | 144 | – | −0,04 | 0,02 | [−0,08; 0,00] | 24 % / 51 % / 26 % | −0,9 | Kompendiet holder, uden praktisk betydning |
| P8 · ♣ | S8 | B | 142 | – | −0,06 | 0,02 | [−0,09; −0,02] | 16 % / 58 % / 26 % | −0,9 | Kompendiet holder |
| P9 | S1 + S2 | – | 31 + 293 = 324 | 8 ("table feeling" i to farver) | +0,31 | 0,02 | [+0,27; +0,35] | 79 % / 20 % / 1 % | +3,2 | A bedre |
| P9 · E K | S1 + S2 | – | 7 + 46 = 53 |  | +0,83 | 0,08 | [+0,68; +0,98] | 100 % / 0 % / 0 % | +12,3 | A bedre |
| P9 · K D | S1 + S2 | – | 6 + 96 = 102 |  | +0,32 | 0,01 | [+0,30; +0,35] | 93 % / 6 % / 1 % | +2,4 | A bedre |
| P9 · D B | S1 + S2 | – | 18 + 151 = 169 |  | +0,14 | 0,01 | [+0,12; +0,16] | 64 % / 34 % / 2 % | +1,0 | A bedre |
| P9 · 3 kort | S1 + S2 | – | 11 + 98 = 109 |  | +0,36 | 0,02 | [+0,32; +0,40] | 98 % / 2 % / 0 % | +4,6 | A bedre |
| P9 · 4 kort | S1 + S2 | – | 15 + 123 = 138 |  | +0,23 | 0,02 | [+0,19; +0,26] | 68 % / 29 % / 3 % | +2,4 | A bedre |
| P9 · 5+ kort | S1 + S2 | – | 5 + 72 = 77 |  | +0,39 | 0,07 | [+0,26; +0,52] | 71 % / 29 % / 0 % | +3,0 | A bedre |

Fast eksempel i P9: S1 opgave 55 (seed 2556829236, ♠K B 7 6 ♥E K 4 3 ♦10 8 6 3 ♣B): ♥E giver 3,35 stik og sætter i 14 %, ♥3 giver 2,52 stik og sætter i 4 %.

De vigtigste fund:

- **P5 holder:** singletonen giver 0,11–0,17 stik mere end småkort i S4, S5 og S8 og sætter 3–4 procentpoint oftere. Formen findes kun i 2–3 % af basens hænder, så rækkerne bygger på varianterne.
- **P2 tager fejl:** den korteste major giver 0,10 stik mindre end den længste (1–2 kort −0,12, 3 kort −0,10), som rådgiverens første kig. P1 er +0,03 og uden praktisk betydning.
- **P4 holder** (♥ uden dyb sekvens −0,12 mod ♠), men ♠'s fordel i P3 ses ikke (+0,02 og +0,03, uden praktisk betydning).
- **P6 er lige:** doubletonen giver 0,02 stik mindre end småkort ("tager fejl, uden praktisk betydning"), men sætter 0,4–1,3 procentpoint oftere. **P7 holder** (+0,15).
- **P8 følger Kompendiet:** i S6 er trumf bedre end ♠ (+0,07) og ♥ (+0,32), men ikke påviseligt end ♦ (+0,03); i S4 og S8 er hver sidefarve 0,04–0,06 stik bedre end trumf. Trumf er den bedste farve i 46 % af hænderne i S6, 16 % i S4 og 8 % i S8.
- **P9:** toppen giver 0,31 stik mere end det lave kort (E K +0,83, K D +0,32, D B +0,14); dobbeltdummy overvurderer esudspil, så tallet er en øvre grænse.
- **S4 og S6:** rådet er blandt de bedste farver i 80 % og 61 %. I S4's 30 andre hænder har Vest oftere en honnørsekvens i en sidefarve (70 % mod 43 %); i S6's 59 er den bedste farve ♠ eller ♦, aldrig ♥.
- **Dataene:** S5-singleton har 4 dubletter (analysen bruger 146); basen har ingen.

**Tekster til gennemgang** (konklusionerne i afsnit 7a, Claude Codes tekst):

1. **Singleton i en sidefarve holder (P5).** I 4♥, 4♠ og 3♠ giver
   singletonen 0,11–0,17 stik mere end en sidefarve med småkort og sætter
   3–4 procentpoint oftere; småkort er 0,1 stik bedre eller mere i højst
   7 % af hænderne. Formen er sjælden (2–3 % af basens hænder), så tallene
   bygger næsten kun på de ekstra hænder.
2. **Den korteste major mod 1NT – 3NT tager fejl (P2).** Den korteste major
   giver 0,10 stik mindre end den længste og sætter 1,8 procentpoint
   sjældnere, både med 1–2 og med 3 kort. Mod en minor med 4 kort og en
   eller to honnører (P1) er forskellen +0,03 stik, uden praktisk
   betydning. Forbeholdet om dobbeltdummy gælder især her.
3. **Efter transfer holder rådet mod bordets ♥ (P4):** ♥ uden dyb sekvens
   giver 0,12 stik mindre end ♠. ♠'s lille fordel frem for ♦ og ♣ (P3) ses
   ikke; forskellen er +0,02 til +0,03 stik, uden praktisk betydning.
4. **Doubleton uden honnør og småkort er lige gode (P6), og småkort slår
   honnørfarven (P7).** Doubletonen giver 0,02 stik mindre end småkort,
   men sætter 0,4–1,3 procentpoint oftere, og 78–87 % af hænderne er under
   0,1 stik fra hinanden. Småkort giver 0,15 stik mere end en sidefarve med
   en eller to honnører uden sekvens. I 4♥ (S4) er Kompendiets råd blandt
   dobbeltdummys bedste farver i 80 % af hænderne; i de øvrige 30 har Vest
   oftere en honnørsekvens i en sidefarve (70 % mod 43 % af alle hænder) og
   sjældnere en honnør i trumf (20 % mod 34 %).
5. **Trumf ud følger Kompendiet (P8).** Efter 1♥ – 1♠ – 2♣ er trumf bedre
   end bordets ♠ (+0,07) og især end Syds ♥ (+0,32), men ikke påviseligt
   bedre end ♦, og trumf er den bedste farve i 46 % af hænderne. Rådet
   (trumf) er blandt de bedste farver i 61 %; i de øvrige 59 hænder er den
   bedste farve ♠ eller ♦, aldrig ♥. I 4♥ og 3♠ giver hver sidefarve
   0,04–0,06 stik mere end trumf, og trumf er den bedste farve i 16 % og
   8 % af hænderne; forskellene er små og ligger tæt ved grænsen for
   praktisk betydning.
6. **"Table feeling" mod sans (P9): toppen giver 0,31 stik mere end det lave
   kort**, mest fra E K (+0,83) og mindst fra D B (+0,14), og sætter 3,2
   procentpoint oftere. Dobbeltdummy overvurderer netop esudspil, fordi
   modspillet ser det rigtige skift efter at have set bordet, så tallet er
   en øvre grænse, især fra E K.

**Tokenforbrug pr. session** (nye input, skrevet til cachen, læst fra cachen og output):

- Session 1: 94 / 253.335 / 8.629.495 / 131.351 (lagt sammen fra sessionens transcript: 47 kald til og med prøvekørslen; de sidste kald med Afklaret og commit er ikke med, og Franks `/usage` før og efter giver hele sessionen)
- Session 2: 112 / 251.114 / 10.407.518 / 117.753 (lagt sammen fra sessionens transcript: 54 kald til og med den fulde testkørsel; de sidste kald med Afklaret og commit er ikke med, og Franks `/usage` før og efter giver hele sessionen)
