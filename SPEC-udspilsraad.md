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

**Kortet i farven:** udspillet i en farve er det kort, profilen Standard spiller (`muligeUdspil` med `profil('standard')`), og stikkene er stikkene for netop det kort i hver fordeling i rådataene. Ved "table feeling" bruges kortet med flest middelstik, som i `farvevaerdier` (undtagen i P8, der sammenligner de to kort).

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
