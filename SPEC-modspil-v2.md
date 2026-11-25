# SPEC – Modspil v2: Find udspillet

24. november 2026 · Fordelingstræneren · opgave D i `PLAN-aabne-opgaver.md`. Bygger på Modspil v1 (`docs/specs/SPEC-modspil.md`, udgivet 18. nov. 2026). Ikke godkendt endnu.

Modspil v2 tilføjer **øvelse 8, "Find udspillet" / "Find the lead"**, i det eksisterende Modspil-spor. Brugeren sidder som Vest, ser sin hånd og meldeforløbet og vælger udspillet: farven på de lave niveauer og kortet på de høje. Situationerne er Kompendiets (*Kompendium over modspilsaftaler*), og facit er regnet med dobbeltdummy på fordelinger, der passer med meldeforløbet.

**Facit (Franks svar 1–2, 24. nov.):** for hver opgave ligger Vests hånd og meldeforløbet fast. Generatoren giver 100 fordelinger af de tre andre hænder, der passer med meldingerne, og Bo Haglunds DDS (via `endplay`) regner modspillets stik for hvert af Vests 13 kort i hver fordeling. Det bedste udspil er det, der giver flest stik i gennemsnit (parturnering); chancen for at sætte kontrakten vises ved siden af. Metoden er Bird og Anthias' (*Winning Notrump Leads* og *Winning Suit Contract Leads*).

**`leads_suit.csv` og `leads_notrump.csv` er ikke facit** (Franks svar 1): de har hverken hænder, kortenes valør eller meldeforløb, og Øst–Vest blev givet tilfældigt med alle kort synlige. Deres tal (MODEL.md afsnit 7) må nævnes i vejledningen som baggrund, med kilden.

**Kortgiveren:** generatoren bruger en Python-port af appens egen `src/engine/rng.ts` og `src/domain/dealer.ts`, så TS-testene kan genskabe hver hånd og hver fordeling bit for bit. BridgeLab er et sideprojekt og indgår ikke (Franks valg 24. nov.).

## Trinene

Opgaven er størrelse S og deles i tre leverancetrin med hver sin gren og godkendelse, som Modspil v1. Hvert trin har korte sessioner (planens Styring 7–11).

| Trin | Indhold | Gren | Tag før |
| --- | --- | --- | --- |
| **1** | situationsfilen, generatoren (Python), datasættet og datatestene | `udspil-data` | `v45-foer-udspil-data` |
| **2** | modellen i TS: opgaver, facit, forklaring og niveauer for øvelse 8, uden brugerflade | `udspil-model` | `v46-foer-udspil-model` |
| **3** | øvelse 8 på skærmen, vejledningen og sidefoden med Modspil | `udspil-skaerme` | `v47-foer-udspil-skaerme` |

**Sessionerne og modellerne** (Frank sender `/usage` før og efter hver; forbruget skrives i fire tal under Afklaret):

| Session | Indhold | Model |
| --- | --- | --- |
| 1a | tag, gren, `endplay` installeret og målt, situationsfilen, porten af `rng.ts`, generatoren, datatestene (røde), prøvekørsel af én opgave | Opus, high effort |
| (kørsel) | **Frank kører generatoren selv i en terminal**, én situation ad gangen (Franks svar 8). Ingen Claude Code-session venter | – |
| 1b | datatestene grønne, kontrolkørslen, tallene under Afklaret, stop før fletning | Sonnet, medium effort |
| 1c | efter "godkendt": flet, push, `SYSTEM.md` | Sonnet, medium effort |
| 2a | tag, gren, accepttest for modellen (røde) | Opus, high effort |
| 2b | modellen, forklaringerne og "Tekster til gennemgang", stop før fletning | Opus, high effort |
| 2c | efter "godkendt": hele suiten, flet og push | Sonnet, medium effort |
| (mock-up) | rådgiveren laver mock-up'en "Modspil v2 – mockup" til Franks godkendelse (Franks svar 10) | rådgiverchatten |
| 3a | tag, gren, mock-up'ens kopi, tidsgrænsen på 30 s i `data.test.ts`, accepttest for skærmene og prisen (røde) | Opus, high effort |
| 3b | skærmene, vejledningen og sidefoden | Opus, high effort |
| 3c | hele suiten, `tjek-bred-layout.mjs`, `tjek-sidefod.mjs`, skærmbilleder, stop før fletning | Sonnet, medium effort |
| 3d | efter "godkendt": flet, push, live-tjek, arkivering og sletning af grenen | Sonnet, medium effort |

Trin 2 startes først, når trin 1 er flettet, og trin 3, når trin 2 er flettet og mock-up'en er godkendt.

## Afgrænsning (gælder alle trin)

| Sted | Må ske | Må ikke ske |
| --- | --- | --- |
| `tools/udspil/` (ny) | generatoren, porten af `rng.ts`, kontrollen og de rå data (Python) | – |
| `src/modspil/content/udspil/` (ny) | situationsfilen og datasættet | rettes i hånden (alt undtagen `situationer.json` genereres) |
| `src/modspil/` | ny kode og nye tests til øvelse 8 | v1's model, generator, metodefil og tests ændres (undtagen dem, trin 3 nævner) |
| Motor (`src/engine/`), `src/domain/`, `src/system/` | bruges som bibliotek (`rng.ts`, `dealer.ts`, `interpreter.ts`) | ændres |
| `.gitignore` | `tools/udspil/.venv/` og `__pycache__/` (trin 1) | andet |
| `CLAUDE.md` | ét afsnit om Modspil v2 og undtagelsen for datasættet (trin 1, udvides i trin 2–3) | andet |
| Kompendiet | læses fra `C:\Users\frank\Kontraktbridge\Kompendium over modspilsaftaler.pdf` | kopieres, citeres over en sætning eller lægges i repoet |
| Lagring | `modspil:v1` får ét valgfrit felt til øvelse 8 (trin 3) | ny nøgle, ændring af eksisterende felter |
| Designtokens | ingen nye | – |

Trin 3 må desuden ændre `src/ui/Footer.tsx` og `src/sidefod.test.tsx` (sidefoden med Modspil), `src/app/GuideScreen.tsx` (kun nye linjer), `src/sprog/bydeform.ts` ("Find udspillet" på undtagelseslisten), `scripts/ordliste.txt`, `scripts/tjek-bred-layout.mjs`, `scripts/modspil.html`, `docs/specs/design/modspil-v2/` (mock-up'ens kopi) og `src/modspil/udspil/data.test.ts` (kun tidsgrænsen på 30 s for testen "antallet", som kan løbe over 5 s i den fulde suite; Franks valg 25. nov.). Efter Franks valg i session 3a (25. nov. 2026) også `src/app/forside.test.tsx` og `scripts/tjek-sidefod.mjs` (sidefoden med seks trænere) og v1's `src/modspil/ui/session.test.tsx` (kun så løkken også besvarer øvelse 8). Efter Franks svar efter session 3b (25. nov. 2026) desuden `src/app/status.ts` med en ny test (forsidens kort tæller øvelse 8's post med i "emner til repetition") og den eksisterende linje "Øvelserne: …" i `src/app/screens/GuideScreen.tsx` (otte øvelser i stedet for syv).

Kræver noget andet en ændring uden for afgrænsningen, stopper Claude Code og spørger. Alle eksisterende tests skal bestå uændret, bortset fra dem, trin 3 nævner.

**Datasættet og CLAUDE.md's regel "intet tal tastes ind":** datasættet er genereret af `tools/udspil/generer.py` med DDS og står i git sammen med generatoren, som `p-model.json`. `CLAUDE.md` får en linje om undtagelsen i trin 1.

**Markeringer og ALA (beslutning 1 og 2, Franks svar 12):** kortet i en farve følger profilens udspilsregel fra v1 (`src/modspil/model/udspil.ts`), så beslutning 2 (ALA mod sans i profilen Kompendiet) gælder uændret. Beslutning 1 (markeringer) indgår ikke, fordi dobbeltdummy ikke regner med markeringer. Det står i vejledningen.

---

# Trin 1: situationerne og datasættet

## Pladserne

Som v1: Syd er spilfører, Nord er bordet, og **Vest spiller ud**. Giveren er Syd, undtagen i S7, hvor Øst åbner. Ingen i zonen (dobbeltdummy ser ikke zonen).

## Situationerne (`src/modspil/content/udspil/situationer.json`)

Første bølge er de otte situationer nedenfor (Franks svar 5). Slem, splinter, 2NT-åbning, konkurrerende forløb og de andre af Kompendiets situationer kommer i en senere bølge og er ikke med her.

| Id | Meldeforløb | Kontrakt | Kompendiet |
| --- | --- | --- | --- |
| `S1-1nt-3nt` | Syd 1NT – pas – Nord 3NT – pas rundt | 3NT | s. 11–12 (generelt mod sans, major eller minor) |
| `S2-stayman` | Syd 1NT – pas – Nord 2♣ – pas – Syd 2♦ – pas – Nord 3NT – pas rundt | 3NT | s. 14 (efter Stayman) |
| `S3-transfer` | Syd 1NT – pas – Nord 2♦ – pas – Syd 2♥ – pas – Nord 3NT – pas rundt | 3NT | s. 14 (efter transfer) |
| `S4-kun-en-farve` | Syd 1♥ – pas – Nord 2♥ – pas – Syd 4♥ – pas rundt | 4♥ | s. 19 (kun én farve meldt) |
| `S5-sidefarve` | Syd 1♠ – pas – Nord 2♥ – pas – Syd 2♠ – pas – Nord 4♠ – pas rundt | 4♠ | s. 20 (bordet har vist en sidefarve) |
| `S6-trumf` | Syd 1♥ – pas – Nord 1♠ – pas – Syd 2♣ – pas rundt | 2♣ | s. 4 (meldeforløbet kalder på trumfudspil) |
| `S7-makker-aabnet` | Øst 1♥ – Syd 1NT – Vest pas – Nord 3NT – pas rundt | 3NT | s. 16 (makker har åbnet med 1 i major) |
| `S8-delkontrakt` | Syd 1♠ – pas – Nord 3♠ – pas rundt | 3♠ | s. 19 (delkontrakt uden indblanding) |

**Kravene til hænderne** (rådgiverens forslag; Frank gennemgår dem i session 1a's "Krav til gennemgang", før generatoren køres):

| Id | Syd | Nord | Øst | Vest |
| --- | --- | --- | --- | --- |
| S1 | 15–17 hp, jævn (systemets 1NT) | 10–15 hp, højst 3 i hver major | P | P over 1NT |
| S2 | 15–17 hp, jævn, højst 3 i hver major | 10–15 hp, præcis 4 i mindst én major, ingen 5-farve i major | P | P over 1NT |
| S3 | 15–17 hp, jævn, præcis 2 ♥ | 10–15 hp, præcis 5 ♥, højst 3 ♠, ingen singleton eller renonce | P | P over 1NT |
| S4 | 17–21 hp, 5+ ♥ (systemets 1♥) | 6–9 hp, 3–4 ♥ | P | P |
| S5 | 12–15 hp, 5+ ♠, højst 2 ♥ (systemets 1♠) | 12–15 hp, 5+ ♥, præcis 3 ♠ | P | P |
| S6 | 12–16 hp, 5+ ♥, 4+ ♣, højst 3 ♠ (systemets 1♥) | 6–9 hp, 4+ ♠, højst 1 ♥, 3+ ♣ | P | P |
| S7 | 15–18 hp, jævn, stop i ♥ (`hasStopper`) | 10–15 hp, ingen 5-farve i major | systemets 1♥ | højst 5 hp, eller 6–9 hp med højst 2 ♥ og ingen 5-farve |
| S8 | 12–14 hp, 5+ ♠ (systemets 1♠) | 10–12 hp, 4+ ♠ | P | P |

- **"Systemets X"** betyder, at `chooseCall` i `src/system/interpreter.ts` giver X som åbning på hånden.
- **P (modspillerens pas):** hånden har ikke 8+ hp med en 5+-farve og ikke 16+ hp. Hvor systemfilen har en sammenhæng for indmeldingen (fx DONT over 1NT), giver `chooseCall` desuden pas.
- Hver situation har i filen id, meldeforløbet, kontrakten, spilfører, kravene pr. hånd, Kompendiets side og en **kort regel for Kompendiets råd** (`kompendieraad`), som afgør, hvilke farver Kompendiet anbefaler for Vests hånd, fx S7 "makkers farve med 2+ kort; med singleton i ♥ en anden farve med stærk sekvens". Agenten læser siderne i Kompendiet og foreslår reglerne i "Krav til gennemgang"; Frank godkender dem. Teksten i filen er en omskrivning i husets ord, aldrig Kompendiets egne sætninger.

## Generatoren (`tools/udspil/`)

1. **Python og `endplay`:** et `venv` i `tools/udspil/.venv/` med `endplay`, fastlåst i `tools/udspil/requirements.txt`. Installeres `endplay` ikke på Python 3.14 på Franks pc, stopper session 1a og beder Frank installere Python 3.12 eller 3.13.
2. **`rng.py`** er en port af `src/engine/rng.ts`: `mulberry32`, `int` med afvisning og `shuffle` (Fisher–Yates). `dealer.py` er en port af `deal(seed)` i `src/domain/dealer.ts` (rækkefølgen N, Ø, S, V).
3. **Opgaverne:** for hver situation giver `mulberry32(situationsseed)` en række seeds. En opgave er det første `deal(seed)`, hvor alle fire hænder opfylder kravene. Vests hånd er opgaven. **150 opgaver pr. situation**, 1200 i alt (Franks valg 25. nov. 2026, efter rapporttallene i 1b; før 50).
4. **Fordelingerne:** for hver opgave giver `mulberry32(opgavens seed)` en række seeds. For hvert seed blandes de 39 kort, Vest ikke har, med `shuffle`, og de gives til N, Ø og S. Fordelingen bruges, når de tre hænder opfylder kravene. **100 fordelinger pr. opgave.** De brugte seeds gemmes, så TS kan genskabe dem.
5. **DDS:** `solve_board` med Vest i udspil og kontraktens trumf giver modspillets stik for hvert af Vests 13 kort i hver fordeling.
6. **Kan genoptages:** `python tools/udspil/generer.py --situation S2-stayman` skriver én opgave ad gangen og fortsætter, hvor den slap. `--alle` kører alle otte efter hinanden. Kørslen skriver fremdriften og den forventede tid tilbage.
7. **Datafilerne:**
   - `tools/udspil/raa/<id>.json` (i git, ikke i appens bundt): for hver opgave seed, Vests hånd, de 100 fordelingers seeds og stikkene pr. kort og fordeling (13 tal pr. fordeling).
   - `src/modspil/content/udspil/<id>.json` (appens data, indlæses dovent): for hver opgave seed, Vests hånd og pr. kort middelstik (to decimaler) og antal fordelinger, hvor kontrakten sættes. Øverst står generatorens version, `endplay`-versionen, datoen og antal fordelinger.
8. **Tiden:** session 1a regner én opgave pr. situation og skriver tiden under Afklaret. Ventes hele kørslen at tage mere end 3 timer, foreslår agenten 60 fordelinger i stedet for 100 og spørger Frank.

## Kontrollen (uafhængig af generatoren)

- **TS genskaber alt:** TS-testene genskaber hver opgaves hånd med appens `deal(seed)` og hver fordeling med appens `shuffle` ud fra de gemte seeds og tjekker kravene med **egen TS-kode og `interpreter.ts`**, ikke Pythons. For én opgave pr. situation tjekkes også, at hvert seed, generatoren sprang over, virkelig ikke opfylder kravene, så der ikke er skævhed i udvalget.
- **TS genberegner opsummeringen:** middelstik og antal sætninger pr. kort i appens data regnes igen fra de rå data og skal være ens.
- **DDS mod DDS-tabellen** (`tools/udspil/kontrol.py`): i 10 % af fordelingerne skal stikket for Vests bedste kort være lig 13 minus Syds stik i kontraktens benævnelse fra `calc_dd_table`, som er en anden indgang i DDS.
- **Stabilitet:** 5 opgaver pr. situation regnes igen med 100 nye fordelinger (et andet seed). For opgaverne med en klar bedste farve (forspring på mindst 0,3 stik i profilen Standard) skal mindst 90 % have samme bedste farve, og den bedste farves middelstik må højst afvige 3 standardfejl mellem de to regninger (Franks valg 25. nov. 2026; før 0,25 stik).
- **Rapporttal** (skrives under Afklaret, ikke testkrav): pr. situation andelen af opgaver, hvor dobbeltdummys bedste farve er blandt dem, Kompendiets råd peger på; andelen af klare opgaver; den mediane usikkerhed (standardfejl) på forskellen mellem bedste og næstbedste farve.

## Accepttest for trin 1 (skrives først, røde)

1. **Situationsfilen:** otte situationer med alle felter, gyldige meldeforløb, kontrakt og en side i Kompendiet. Teksterne består fagords- og bydeformstestene.
2. **Porten af `rng.ts`:** Python og TS giver de samme tal for seed 0, 1, 42 og 2³²−1 (de første 20 `uint32`, `int(13)`, `int(52)` og en blandet kortstok). Testen kører Python fra Vitest, hvis Python findes, og springer ellers over med en besked; de faste tal står i en fil, så TS-siden altid testes.
3. **Hænderne og fordelingerne:** som under Kontrollen, for alle 1200 opgaver og 120.000 fordelinger. Tidsgrænse 300 s pr. situation.
4. **Opsummeringen:** appens data er lig de rå data.
5. **Antallet:** 150 opgaver pr. situation, 100 fordelinger pr. opgave (eller tallet, Frank har valgt efter punkt 8 under Generatoren), 13 kort pr. fordeling, og stikkene ligger mellem 0 og 13.
6. **Faste eksempler fra Kompendiet** (agenten vælger dem i 1a, Frank godkender): mindst én hånd pr. situation, hvor Kompendiets råd er tydeligt (fx S2 med en kort major og lange minorer), og opgavens bedste farve er en af dem, rådet peger på. Hånden genereres som en ekstra opgave med fast hånd (ikke med i de 50).
7. **Intet andet er ændret:** kun `tools/udspil/`, `src/modspil/content/udspil/`, de nye tests i `src/modspil/udspil/`, `.gitignore`, `CLAUDE.md` og specen er ændret siden `v45-foer-udspil-data`.

## Arbejdsgang (trin 1)

1. Tag `v45-foer-udspil-data`, og opret grenen `udspil-data` (session 1a).
2. Skriv accepttestene, som skal være røde, og commit dem. Situationsfilen og "Krav til gennemgang" står under Afklaret, og generatoren er prøvekørt på én opgave pr. situation.
3. **Stop.** Frank godkender kravene og Kompendiets regler og kører generatoren i en terminal.
4. Session 1b: testene skal være grønne uden at blive rettet, så kører kontrollen, og tallene skrives under Afklaret. Stop før fletning.
5. Franks "godkendt", så flettes og pushes der (session 1c). Der er intet live-tjek, fordi intet er synligt i appen.

---

# Trin 2: modellen for øvelse 8

## Opgaven

- **Udvalget:** en opgave er en hånd fra datasættet, valgt med opgavens seed, niveauet og profilen. Situationen trækkes først, med lige stor chance for hver af niveauets situationer, og derefter hånden blandt situationens opgaver på niveauet (Franks valg 25. nov.), så S7 ikke fylder det meste af niveau 1–2. Modellen ligger i nye filer i `src/modspil/model/` (fx `findUdspil.ts`), og v1's generator (`generator.ts`) ændres ikke.
- **Farvens værdi:** for hver farve, Vest har kort i, er farvens værdi middelstikkene for det kort, profilens udspilsregel giver (`udspil.ts`). Giver reglen "table feeling", tæller det bedste af de to kort, og begge er rigtige.
- **Lige gode:** farver eller kort under 0,1 stik fra det bedste er lige gode, og alle er rigtige (Franks svar 4).
- **Klar:** en opgave er klar, når den bedste farve fører med mindst 0,2 stik over den næstbedste (Franks valg 25. nov. 2026; før 0,3, som gav for få klare opgaver i 1b's rapporttal). 0,2 stik er over 3 gange den mediane standardfejl (0,06), så forspringet er reelt.
- **Afviger fra Kompendiet:** en opgave afviger, når den er klar, og den bedste farve ikke er blandt dem, `kompendieraad` peger på.

## Niveauerne for øvelse 8

Følger sporets niveau (v1, "Niveauer"):

| Sporets niveau | Svaret | Opgaverne |
| --- | --- | --- |
| 1 | farven | klare; S1, S5 og S7 (Franks valg 25. nov.: S4 har kun 5 klare opgaver, der følger Kompendiet, og rykkes til niveau 2) |
| 2 | farven | klare; alle otte situationer |
| 3 | kortet | klare |
| 4–5 | kortet | også de tætte (forspring under 0,2) og dem, der afviger fra Kompendiet (Franks svar 9, bekræftet 24. nov.) |

Svarer brugeren med et kort i den rigtige farve, men ikke profilens kort, er svaret forkert, og facit siger, at farven var rigtig, og hvilket kort profilen spiller ud.

## Facit og forklaringen

- **Facit:** de rigtige farver (niveau 1–2) eller kort (3–5), og en tabel med middelstik (én decimal) og chancen for at sætte kontrakten (hele procent) pr. farve. Facit har desuden middelstik og chancen for at sætte for hvert af Vests 13 kort, så trin 3 kan vise prisen for et hvilket som helst svar (Franks valg 25. nov.).
- **Forklaringen** står på dansk og engelsk i beskrivende form og husets ord og nævner situationen, tallene og Kompendiets råd med siden, fx: "Efter 1NT – 2♣ – 2♦ – 3NT har spilfører ofte minorfarverne. ♥ giver i gennemsnit 4,1 stik til modspillet og sætter 3NT i 38 % af fordelingerne; ♣ giver 3,4 stik og 22 %. Kompendiet (s. 14) anbefaler udspil i major efter dette forløb."
- **Afviger opgaven fra Kompendiet,** siger forklaringen det: "Kompendiet anbefaler ♥ efter dette forløb, men med denne hånd giver ♠ flest stik."
- **"Ved bordet":** én tekst pr. situation (en omskrivning af Kompendiets råd). Står i "Tekster til gennemgang", som Frank godkender før fletning; agentens egne begrundelser markeres "(tilføjelse)".
- **Profilen:** skifter profilen kortet, nævner forklaringen metoden, som v1: "Med profilen Kompendiet spilles ♠D fra ♠D B 10 4 mod sans (ALA)."

## Accepttest for trin 2 (skrives først, røde)

1. **Farvens værdi og kortet:** faste eksempler for hver profil, også "table feeling" og en farve, hvor Standard og Kompendiet spiller forskellige kort (fx ♥K D 10 5 mod sans: Standard K, Kompendiet D efter ALA; K D 5 3 giver "table feeling" med Standard).
2. **Lige gode og klare:** faste eksempler på 0,09, 0,1, 0,19 og 0,2 stik.
3. **Facit mod de rå data:** for alle 1200 opgaver og alle tre profiler regner en uafhængig test (der kun importerer typer) facit direkte fra `tools/udspil/raa/` og sammenligner, også middelstik og chancen for at sætte pr. kort.
4. **Niveauerne:** niveau 1–2 giver kun klare opgaver og svar i farver, niveau 1 kun S1, S5 og S7, og niveau 3 og op svar i kort. Over mange seeds trækkes hver af niveauets situationer lige ofte (inden for en fast tolerance, som testen skriver).
5. **Afviger fra Kompendiet:** findes kun på niveau 4–5, og forklaringen nævner både rådet og den bedste farve.
6. **Genskabelse:** samme seed, niveau og profil giver samme opgave og facit.
7. **Sproget:** alle forklaringer for alle opgaver og profiler består fagords- og bydeformstestene, og engelsk har ingen danske ord.
8. **Intet andet er ændret:** v1's tests består uændret, og kun nye filer i `src/modspil/`, `CLAUDE.md` og specen er ændret siden `v46-foer-udspil-model`.

## Arbejdsgang (trin 2)

Som trin 1: tag og gren (2a), accepttest (røde), byggeri og "Tekster til gennemgang" (2b), stop før fletning, Franks "godkendt", flet og push (2c). Intet live-tjek.

---

# Trin 3: øvelse 8 på skærmen

**Mock-up'en "Modspil v2 – mockup"** laves af rådgiveren efter trin 2 og godkendes af Frank, før 3a starter (Franks svar 10). Den bygger på v1's skærm "Vælg kortet" (`docs/specs/design/modspil/3-vaelg-kortet-390.html`). Mock-up'en er lavet 25. nov. 2026 (Claude-artefakt: https://claude.ai/artifact/DY8wZhfPYH8fhDqi5mWCPo) med to varianter af facit, uden og med prisen, og **Frank valgte samme dag varianten med prisen**. Kopien af de gældende skærme ligger i `docs/specs/design/modspil-v2/` (lagt dér af rådgiveren, ikke committet; 3a committer den på grenen):

| Fil | Skærm |
| --- | --- |
| `1-opgave-farve-390.html` | opgaven på niveau 1–2 med farveknapperne |
| `2-facit-farve-390.html` | facit med prisen, svaret ♦ |
| `3-opgave-kort-390.html` | opgaven på niveau 3–5 med kortknapperne |
| `4-facit-kort-390.html` | facit med prisen, svaret ♥4 (farven rigtig, kortet ikke profilens) |
| `5-bred-1280.html` | kortet og facit med prisen ved 1280 px |
| `canvas.json` | lærredets oversigt (alle otte skærme, også varianten uden pris) |

Eksemplet er S1-1nt-3nt, opgave 55 (seed 2556829236), profilen Standard: Vest ♠K B 7 6 ♥E K 4 3 ♦10 8 6 3 ♣B; ♥E 3,35 stik og 14 %, ♦3 2,87 og 8 %, ♣B 2,86 og 7 %, ♠6 2,49 og 4 %, ♥4 2,52 og 4 %. Ordbogslinket "Udspil" i mock-up'en er et eksempel.

## Skærmen

- **Opgaven:** meldeforløbet som skema (som v1) med kontrakten fremhævet, Vests hånd og spørgsmålet "Hvilken farve spilles ud?" (niveau 1–2) eller "Hvilket kort spilles ud?" (3–5). Bordet vises ikke, fordi det er udspillet.
- **Svarknapperne:** på niveau 1–2 fire farveknapper (en farve, Vest ikke har, er deaktiveret); fra niveau 3 hånden som kortknapper (mindst 44 px, aria-label som "Spar dame"). Der er ingen "Kan ikke afgøres" i øvelse 8.
- **Facit:** mærket, tabellen med middelstik og chancen for at sætte pr. farve (rigtige farver markeret), forklaringen, "Ved bordet", et link til ordbogen, når opslaget findes, og "Næste opgave". Tabellen har kolonnerne "Udspil", "Stik", "Sætter" og "Koster" ("Lead", "Tricks", "Defeats", "Cost"), rækkerne står med flest stik først, de rigtige rækker har grøn kant og ✓, og det forkerte svar har stiplet kant og grå flade som i v1.
- **Prisen** (Franks valg 25. nov. 2026, mock-up'ens variant med prisen): prisen er det bedste svars middelstik minus det valgte svars, regnet i hundrededele og vist med én decimal rundet halvt op (som `tiendedele`). Er svaret forkert, står under mærket "Dit svar: ♦ · koster 0,5 stik i snit" ("Your answer: ♦ · costs 0.5 tricks on average"), og kolonnen "Koster" viser prisen for hver række (de rigtige "–").
  - Niveau 1–2: farvens værdi fra facit (`tabel`).
  - Niveau 3–5: tabellen viser profilens kort pr. farve; prisen for det valgte kort regnes fra `kortTabel`. Er det valgte kort ikke profilens, får det sin egen række ("dit svar") lige under farvens række, og domsteksten fra `bedoemUdspil` står over tabellen.
  - Er prisen for et forkert svar under 0,1 stik (kun muligt med et kort, der ikke er profilens), står der "koster under 0,1 stik i snit".
  - Et rigtigt svar har ingen pris, og kolonnen "Koster" står da med "–" i alle rækker (Franks valg 25. nov. 2026, session 3a). Scoringen forbliver rigtigt eller forkert, og modellen fra trin 2 ændres ikke (prisen regnes i skærmens kode eller en ny hjælper i `src/modspil/`).
- **Sessionen:** øvelse 8 indgår i dagens session med sin egen Leitner-post og samme regler som v1's øvelser: den trækkes i niveaufasen som v1's øvelser fra niveau 1, og en forfalden post kommer først som repetition (Franks valg 25. nov. 2026, session 3a). Datasættet indlæses dovent første gang, øvelse 8 bruges.
- **Fra 1000 px:** meldeforløbet og hånden til venstre, spørgsmålet og facit til højre. Kun CSS skifter.
- **Rødt kun på ♥ og ♦,** som v1.

## Sidefoden (Franks svar 11)

Modspil kommer med under "Trænere" efter Håndevaluering: `#modspil` i appen, "Modspil" / "Defence" (Franks ja 21. nov.). `src/sidefod.test.tsx` og `src/app/forside.test.tsx` rettes fra fem til seks trænere, `scripts/tjek-sidefod.mjs` får Modspil i Trænere og `#modspil` blandt skærmene (Franks valg 25. nov. 2026, session 3a), og scriptet køres.

## Accepttest for trin 3 (skrives først, røde)

1. En session med øvelse 8 kører fra start til status, og facit på skærmen er modellens facit for opgavens seed.
2. Niveau 1–2 viser fire farveknapper og niveau 3 kortknapper; en farve uden kort er deaktiveret.
3. Facit viser tabellen, forklaringen, "Ved bordet" og "Næste opgave".
4. Skærmene svarer til mock-up'en ved 390, 1000 og 1280 px, og `scripts/tjek-bred-layout.mjs` med Modspil fejler, hvis spalten dækker noget.
5. Rødt kun på ♥ og ♦; tilgængelighed og tastatur som v1's punkt 6.
6. Sprog: dansk og engelsk, husets ord og beskrivende form; "Find udspillet" står på undtagelseslisten.
7. Sidefoden har seks trænere med Modspil efter Håndevaluering, og `tjek-sidefod.mjs` er grøn ved 1280, 390 og 320 px.
8. Lagring: `modspil:v1` med det nye felt overlever genindlæsning, eksport og import, og data uden feltet læses som før.
9. Alle eksisterende tests består uændret, bortset fra `src/sidefod.test.tsx`, `src/app/forside.test.tsx` og `scripts/tjek-sidefod.mjs` (seks trænere), `src/modspil/ui/session.test.tsx` (løkken besvarer også øvelse 8; Franks valg i session 3a) og tidsgrænsen på 30 s for testen "antallet" i `src/modspil/udspil/data.test.ts` (intet andet i filen ændres); pixelsammenligningerne er mod `v47-foer-udspil-skaerme`.
10. **Prisen**, med faste eksempler fra datasættet: S1 opgave 55 (seed 2556829236), Standard, niveau 1 med svaret ♦ koster 0,5 og ♠ 0,9; niveau 3 med svaret ♥4 koster 0,8 og har sin egen række; et forkert kort under 0,1 stik fra det bedste giver "koster under 0,1 stik i snit" (testen finder et i datasættet); et rigtigt svar har ingen pris og ingen kolonneværdi ud over "–". Rundingen testes på begge sider af 0,05 (fx 0,45 → 0,5 og 0,44 → 0,4). Dansk og engelsk.

## Arbejdsgang (trin 3)

Accepttest (3a), byggeri (3b), hele suiten, browsertjek og skærmbilleder i en session for sig (3c), stop før fletning. Franks "godkendt", så flet, push, live-tjek på www.kontraktbridge.dk/fordelingstraeneren/#modspil, arkivér specen i `docs/specs/` med en linje i `docs/specs/README.md`, og slet grenen (3d). `SYSTEM.md` opdateres i hvert trin.

---

## Afklaret

**Franks svar, 24. nov. 2026** (på rådgiverens spørgsmål før specen):
1. Facit er simulering med dobbeltdummy på fordelinger, der passer med meldeforløbet; csv-filerne er kun statistik.
2. Bedst er flest stik i gennemsnit (parturnering); chancen for at sætte vises ved siden af.
3. Niveau 1–2 svarer med farven, niveau 3 og op med kortet efter profilens udspilsregel.
4. Under 0,1 stik er lige godt, og alle er rigtige; niveau 1–2 bruger kun opgaver med et forspring på mindst 0,3 stik (ændret til 0,2 stik 25. nov., se Status).
5. Første bølge er de otte situationer S1–S8.
6. Situationerne står i én fil med kravene pr. hånd, som TS kontrollerer uafhængigt; meldegiveren fra v1 bruges ikke.
7. Generatoren ligger i `tools/udspil/` i Fordelingstræneren. BridgeLab er et sideprojekt og indgår ikke.
8. Frank kører generatoren selv i en terminal.
9. Kompendiet citeres ikke; forklaringerne omskriver med siden, og teksterne godkendes af Frank. Dobbeltdummy er facit, når de to er uenige.
10. Øvelse 8 i det eksisterende spor, `modspil:v1` med et valgfrit felt, tabel med middelstik og chancen for at sætte. Mock-up før trin 3.
11. Sidefoden med Modspil tages med i trin 3.
12. Beslutning 2 gælder via profilen; beslutning 1 indgår ikke.

**Franks valg efter session 2a, 25. nov. 2026:**
- Niveau 1 er S1, S5 og S7; S4 rykkes til niveau 2.
- Udvalget trækker situationen først med lige stor chance og derefter hånden.
- Prisen udskydes til trin 3 (mock-up'en og 3a); facit fra trin 2 har derfor middelstik og chancen for at sætte pr. kort.
- Eksemplet til accepttest 1 er ♥K D 10 5 (Standard K, Kompendiet D); K D 5 3 er "table feeling" med Standard.

**Franks valg efter mock-up'en, 25. nov. 2026:**
- Facit viser prisen (mock-up'ens variant med prisen; se "Skærmen").
- Testen "antallet" i `src/modspil/udspil/data.test.ts` får en tidsgrænse på 30 s på trin 3's gren.

**Franks valg i session 3a, 25. nov. 2026** (Claude Code spurgte, fordi specen stødte mod "eksisterende tests uændret"):
- Øvelse 8 trækkes i niveaufasen som v1's øvelser fra niveau 1. v1's `src/modspil/ui/session.test.tsx` kører en hel session for en ny bruger og krævede, at hver opgave var en af v1's syv øvelser og kunne besvares med "Kan ikke afgøres" eller et kort; den må rettes, kun så løkken også besvarer øvelse 8 (venter på datasættet og vælger den første farve eller det første kort). Alternativet var kun at trække øvelse 8, når datasættet allerede er hentet.
- Sidefoden med seks trænere: også `src/app/forside.test.tsx` (sidefodens Trænere) og `scripts/tjek-sidefod.mjs` (`KOLONNER` og skærmene) tjekker listen og må rettes; intet andet i filerne.
- Kolonnen "Koster" står med "–" i alle rækker efter et rigtigt svar (specens ordlyd); priserne vises kun efter et forkert svar.

**Franks bekræftelser, 24. nov. 2026:**
- Opgaver, hvor Kompendiet og dobbeltdummy er uenige, vises fra niveau 4 (svar 9).
- Rådgiveren laver mock-up'en "Modspil v2 – mockup" efter trin 2, og Frank godkender den før trin 3 (svar 10).

**Status (skrives løbende af Claude Code):**

- **Session 1a (25. nov. 2026):** `main` er tagget `v45-foer-udspil-data`, og grenen `udspil-data` er oprettet. Situationsfilen, porten af `rng.ts` og `dealer.ts`, generatoren, kontrollen og accepttestene er skrevet og committet. Generatoren er prøvekørt på én opgave og eksemplet pr. situation uden for repoet (intet datasæt er committet). På prøvedataene er accepttest 3, 4 og 6 grønne, og accepttest 5 fejler kun på antallet (1 opgave i stedet for 50): TS og Python er enige om hver hånd, hver fordeling og hvert sprunget seed. Accepttest 1, 2 og 7 er grønne nu; 3–6 og stabiliteten er røde, indtil Frank har kørt generatoren og kontrollen (`tools/udspil/README.md`). Stop: Frank godkender "Krav til gennemgang" nedenfor.
- **Kørslen (25. nov. 2026):** Frank kørte `generer.py --alle` og `kontrol.py --alt` i PowerShell (Python 3.13, endplay 0.5.12): 50 opgaver og ét eksempel pr. situation, 100 fordelinger.
- **Session 1b, første forsøg (25. nov. 2026):** 82 af 83 tests bestod. Stabilitetstesten fejlede på S1-1nt-3nt, seed 2085890785 (♠ D 10 9 5 4 ♥ 9 7 ♦ E 10 9 8 ♣ 9 4): ♠ var bedst i begge regninger, men middelstikket for ♠5 afveg 0,26 stik (3,07 mod 2,81). Med 100 fordelinger er standardfejlen på forskellen ca. 0,2 stik, så grænsen på 0,25 stik var strammere, end data kan holde. **Franks valg:** grænsen er højst 3 standardfejl på forskellen pr. opgave, √(s₁²/n₁ + s₂²/n₂) for farvens kort; kravet om samme bedste farve i mindst 90 % er uændret. `stabilitet.test.ts` er rettet, data er uændret, og session 1b køres igen.
- **Session 1b, andet forsøg (25. nov. 2026):** Franks valg: grænsen på 3 standardfejl beholdes, og der kommer ingen 90 %-regel ud over kravet om samme bedste farve. `npx vitest run src/modspil/udspil` er grøn (7 filer, 83 tests) uden at nogen test er rettet, og `npm test` er grøn (tsc og Vitest: 149 filer, 1088 tests bestået og 2 sprunget over, 273 s). **Rapporttal** (400 opgaver, 50 pr. situation; regnet af datasættet med profilen Standard; "råd" er, at mindst én af de bedste farver, under 0,1 stik fra den bedste, er blandt Kompendiets; "strengt" er, at den ene bedste farve er det; standardfejlen er på forskellen mellem bedste og næstbedste farves bedste kort, parret over de 100 fordelinger):

  | Situation | Råd blandt de bedste | Strengt | Klare opgaver (forspring ≥ 0,3) | Median standardfejl |
  | --- | --- | --- | --- | --- |
  | S1-1nt-3nt | 96 % | 90 % | 12 % | 0,10 |
  | S2-stayman | 96 % | 82 % | 6 % | 0,08 |
  | S3-transfer | 100 % | 92 % | 6 % | 0,06 |
  | S4-kun-en-farve | 72 % | 54 % | 2 % | 0,05 |
  | S5-sidefarve | 98 % | 84 % | 8 % | 0,06 |
  | S6-trumf | 56 % | 40 % | 4 % | 0,06 |
  | S7-makker-aabnet | 96 % | 92 % | 50 % | 0,10 |
  | S8-delkontrakt | 94 % | 82 % | 2 % | 0,05 |
  | **I alt** | **88,5 %** | **77 %** | **11,3 %** | **0,06** |

  Kun få opgaver er klare: i S4 og S8 er det 1 af 50, i S6 2 af 50. Stabilitetstesten (5 opgaver pr. situation) kontrollerer derfor kun de klare blandt dem, og tallene viser, at den bedste farve oftest er tæt på den næstbedste. I 1 opgave i S6 og 1 i S7 peger rådet ikke på nogen farve, Vest har (talt som uenig). Datafilerne (`src/modspil/content/udspil/*.json` og `tools/udspil/raa/`) er committet; der er ikke flettet.

- **Franks valg efter 1b (25. nov. 2026):** med forspring på mindst 0,3 stik var kun 45 af 400 opgaver klare (S4 og S8 1 hver, S7 25), så niveau 1 og 2 ville blive tynde og mest bestå af S7. Talt i data: med mindst 0,2 stik er der 82 klare (S1 12, S2 9, S3 3, S4 3, S5 7, S6 13, S7 30, S8 5). Valget: (1) "klar" er mindst 0,2 stik i trin 2 (stabilitetstesten beholder 0,3); (2) 150 opgaver pr. situation i stedet for 50, så hver situation får flere klare opgaver, og opgave Æ får flere hænder. Generatoren fortsætter fra opgave 51, så de første 50 og eksemplerne er uændrede. Begrundelsen er læringsværdien: et facit, der kun skiller udspillene med under 0,2 stik, lærer støj. Forslag til trin 2a (ikke besluttet): facit viser også prisen, dvs. hvor mange stik det valgte udspil koster i snit mod det bedste, så også de tætte opgaver lærer noget. Næste: Frank kører `generer.py --alle` og `kontrol.py --alt` igen, så 1b igen (datatestene, `npm test`, rapporttallene og `rapporttal.mjs` i `tools/udspil/`).
- **Session 1b, tredje forsøg (25. nov. 2026):** Frank har kørt `generer.py --alle` og `kontrol.py --alt` med 150 opgaver og ét eksempel pr. situation (100 fordelinger; stabiliteten er uændret 5 opgaver pr. situation). `npx vitest run src/modspil/udspil` er grøn (7 filer, 83 tests) og `npm test` er grøn (tsc og Vitest: 149 filer, 1088 tests bestået og 2 sprunget over, 272 s), uden at nogen test er rettet. **Rapporttal** for de 1200 opgaver, regnet af `node tools/udspil/rapporttal.mjs` (profilen Standard; "råd" er, at mindst én af de bedste farver, under 0,1 stik fra den bedste, er blandt Kompendiets; "strengt" er, at den ene bedste farve er det; klare er forspring til den næstbedste farve på mindst 0,2 eller 0,3 stik; standardfejlen er på forskellen mellem bedste og næstbedste farves bedste kort, parret over de 100 fordelinger):

  | Situation | Råd blandt de bedste | Strengt | Klare ≥ 0,2 | Klare ≥ 0,3 | Median standardfejl | Median standardfejl, klare ≥ 0,2 | Uden råd |
  | --- | --- | --- | --- | --- | --- | --- | --- |
  | S1-1nt-3nt | 94,0 % | 85,3 % | 31 (20,7 %) | 16 (10,7 %) | 0,09 | 0,11 | 0 |
  | S2-stayman | 90,7 % | 75,3 % | 20 (13,3 %) | 8 (5,3 %) | 0,08 | 0,10 | 0 |
  | S3-transfer | 100,0 % | 94,0 % | 17 (11,3 %) | 9 (6,0 %) | 0,06 | 0,08 | 0 |
  | S4-kun-en-farve | 80,0 % | 50,0 % | 15 (10,0 %) | 7 (4,7 %) | 0,05 | 0,06 | 0 |
  | S5-sidefarve | 94,7 % | 82,7 % | 20 (13,3 %) | 12 (8,0 %) | 0,06 | 0,08 | 0 |
  | S6-trumf | 60,7 % | 42,7 % | 38 (25,3 %) | 12 (8,0 %) | 0,06 | 0,07 | 1 |
  | S7-makker-aabnet | 96,0 % | 94,0 % | 102 (68,0 %) | 87 (58,0 %) | 0,10 | 0,10 | 3 |
  | S8-delkontrakt | 88,0 % | 70,7 % | 21 (14,0 %) | 7 (4,7 %) | 0,05 | 0,06 | 0 |
  | **I alt** | **88,0 %** | **74,3 %** | **264 (22,0 %)** | **158 (13,2 %)** | **0,07** | **0,09** | **4** |

  Med 0,2 stik er 264 af 1200 opgaver klare (mod 82 af 400 før), med 0,3 stik 158. S7 står for 102 af de 264 (39 %); uden S7 er der 162 klare i de syv andre situationer, 15–38 pr. situation (S4 har færrest). "Uden råd" er opgaver, hvor Kompendiets regel ikke peger på nogen farve, Vest har (talt som uenig). Stabilitetstesten beholder 0,3. Datafilerne, `rapporttal.mjs` og specen er committet; der er ikke flettet.
- **Session 1c, trin 1 er flettet og pushet (25. nov. 2026):** Frank har godkendt trin 1 (grenen `udspil-data`, sidste commit `aed4058`). Grenen er flettet ind på `main` med `--no-ff` i `4606082` og pushet; `npm test` på `main` er grøn (149 filer, 1088 tests bestået og 2 sprunget over, 295 s), og grenen `udspil-data` er slettet lokalt (den lå aldrig på GitHub). Taget `v45-foer-udspil-data` (`9277086`) står. Der er intet live-tjek, fordi intet er synligt i appen. `../SYSTEM.md` har generatoren, datasættet og Franks beslutninger. Specen bliver i roden til trin 3. Næste: trin 2 (`udspil-model`, tag før `v46-foer-udspil-model`).
- **Session 2a, accepttestene for trin 2 (25. nov. 2026):** `main` (`d6653ae`) er tagget `v46-foer-udspil-model`, og grenen `udspil-model` er oprettet. Specen havde ingen ændringer, der ikke var committet, så grenens første commit er accepttestene med denne Status. **Skrevet:** det tomme modul `src/modspil/model/findUdspil.ts` med typerne og signaturerne (`hentDatasaet`, `farvevaerdier`, `rigtigeFarver`, `forspring`, `erKlar`, `udspilFacit`, `pulje`, `lavFindUdspil`, `forklarUdspil`, `vedBordet` og `bedoemUdspil`), hvor hver funktion kaster "ikke bygget", og accepttestene i `src/modspil/find-udspil/` med fælles testkode i `hjaelp.ts`:

  | Accepttest | Fil | Tests | Røde |
  | --- | --- | --- | --- |
  | 1 Farvens værdi og kortet | `vaerdi.test.ts` | 8 | 8 |
  | 2 Lige gode og klare | `graenser.test.ts` | 6 | 6 |
  | 3 Facit mod de rå data | `facit-raa.test.ts` | 10 | 8 |
  | 4 Niveauerne (og dommen over svaret) | `niveauer.test.ts` | 21 | 21 |
  | 5 Afviger fra Kompendiet (og forklaringens indhold) | `afviger.test.ts` | 10 | 9 |
  | 6 Genskabelse (og den dovne indlæsning) | `genskabelse.test.ts` | 10 | 10 |
  | 7 Sproget | `sprog.test.ts` | 8 | 7 |
  | 8 Intet andet er ændret | `intet-andet.test.ts` | 2 | 0 |
  | **I alt** | | **75** | **69** |

  **Røde, og hvorfor:** `npx tsc --noEmit` er grøn. `npx vitest run src/modspil/find-udspil` giver 69 røde og 6 grønne, og alle 69 fejler med "Error: ikke bygget" fra modulet (talt i Vitests JSON-rapport), ingen på en forventning eller en typefejl. De 6 grønne tester ikke modellen: accepttest 8 (to tests) og testenes egne kontroller, nemlig at accepttest 3 kun importerer typer og `udspilFacit`, at gennemregningen i accepttest 3 giver trin 1's rapporttal for Standard (klare 31, 20, 17, 15, 20, 38, 102 og 21, i alt 264, og 4 opgaver uden råd), og "testen kan se forskel" i 5 og 7. `npx vitest run src/modspil` (84 s): v1's og trin 1's 26 testfiler er grønne (221 bestået og 2 sprunget over som før), og de eneste røde er de 69. Hele suiten er ikke kørt. Vitest kører kun i PowerShell her; i Git Bash fejler alle testfiler, også trin 1's, med "Cannot read properties of undefined (reading 'config')", sandsynligvis på grund af "æ" i stien.

  **Accepttest 3** importerer kun typer, bortset fra den funktion, den sammenligner med (`udspilFacit`); uden den kan intet sammenlignes. Udspilsreglen, ALA-tabellen og Kompendiets råd står i testen for sig selv, og profilerne, situationerne og de rå data læses som JSON. Den første test kontrollerer importerne.

  **Claude Codes valg i accepttestene** (2b følger dem; Frank kan rette dem):
  1. Specens eksempel "K D 5 3 mod sans: Standard K, Kompendiet D" er efter udspilsreglen (`udspil.ts`) "table feeling" med Standard (♠K eller ♠3). Testen bruger K D 5 3 til "table feeling" og ♥K D 10 5 til Standard K og Kompendiet D (brudt sekvens mod ALA's K D x x).
  2. Chancen for at sætte i en farve er chancen med det kort, der giver farvens værdi; står de to kort ved "table feeling" lige i middelstik, gælder det højeste antal.
  3. Niveau 1–3 har de klare opgaver, der ikke afviger fra Kompendiet (accepttest 5), og niveau 4–5 alle 1200; niveau 2 og 3 har samme pulje. Eksemplerne i datafilerne er ikke opgaver.
  4. Lige gode og klare regnes i hundrededele, så 2,30 mod 2,10 er klar, og 2,30 mod 2,20 er ikke lige godt; testen har eksempler på begge sider af hver grænse, fordi kommatal i JavaScript ligger lidt over eller under.
  5. Forklaringen nævner situationen (meldeforløbet fra `navn`), mindst én bedste farves middelstik med én decimal (rundet halvt op) og chancen i hele procent og Kompendiet med siden ("s. 14", på engelsk "p. 14"). En opgave, der afviger, har sætningen om det i et eget felt (`afvigelse`), som også står i forklaringen og nævner rådets farver og den bedste farve.
  6. "Skifter profilen kortet" er testet med to faste eksempler: med Kompendiet nævner forklaringen ♥D og ALA (Standard spiller ♥K), og med Standard ♠K og ♠3 (Kompendiet spiller ♠D).
  7. Dommen (`bedoemUdspil`): et kort i en rigtig farve, der ikke er profilens, er forkert, og teksten nævner profilens kort i farven; andre svar har ingen tekst.
  8. "Ved bordet" kan ikke stå i `situationer.json`, fordi accepttest 8 kun tillader nye filer i `src/modspil/`; 2b lægger teksterne i en ny fil.
  9. Lodtrækningen (til 2b; testene kræver det ikke): `mulberry32(seed)` vælger situationen jævnt blandt dem med opgaver i puljen og så opgaven, så S7 ikke fylder næsten halvdelen af niveau 2.

  **Tal til orientering** (gennemregningen i accepttest 3, profilen Standard; Omvendt og Kompendiet er næsten ens): af de 264 klare opgaver afviger 35 fra Kompendiet (S1 4, S2 2, S3 0, S4 10, S5 2, S6 15, S7 0, S8 2). Niveau 2–3 har derfor 229 opgaver (S7 102), og niveau 1 har 134, heraf kun 5 i S4, fordi 10 af S4's 15 klare opgaver afviger. I 674 af de 1200 opgaver er to farver eller flere lige gode (under 0,1 stik); de kommer kun på niveau 4–5.

  **Åbent til Frank (blokerer ikke 2b):** forslaget fra 1b om at vise prisen (hvor mange stik det valgte udspil koster mod det bedste) kan regnes ud fra facit-tabellen uden ændringer i modellen og kan derfor afgøres sammen med mock-up'en før trin 3.

  **Tokenforbrug:** Claude Code kan ikke selv aflæse forbruget, så de fire tal står under "Tokenforbrug pr. session" og udfyldes fra Franks `/usage` før og efter sessionen. Næste: session 2b bygger modellen, forklaringerne og "Tekster til gennemgang", til testene er grønne uden at blive rettet; CLAUDE.md's afsnit om Modspil v2 udvides i 2b, og `../SYSTEM.md` opdateres, når trin 2 flettes (som i 1c). Der er ikke flettet eller pushet.
- **Session 2b, modellen (25. nov. 2026):** Franks valg efter 2a står i specen, og accepttest 1, 3 og 4 er rettet efter dem og committet først (`773b834`): niveau 1 er S1, S5 og S7; en ny test kræver, at hver af niveauets situationer trækkes 300 ± 25 % gange over 300 seeds pr. situation (tolerancen er over 4,5 standardafvigelser, og en lodtrækning over hele puljen fanges); facit har middelstik og sætninger for alle 13 kort (`kortTabel`), også i den uafhængige gennemregning i accepttest 3. Før byggeriet var de 40 tests i de tre filer røde, alle med "ikke bygget" (de 2 grønne var accepttest 3's kontroller af importerne og rapporttallene). **Bygget:** `src/modspil/model/findUdspil.ts` (datasættet hentes dovent, farvens værdi, lige gode og klare i hundrededele, Kompendiets råd, facit, niveauerne, udvalget, forklaringen og dommen) og `src/modspil/model/findUdspilTekst.ts` ("Ved bordet", indledningerne og skabelonerne). v1's filer, situationsfilen og trin 1's filer er uændrede. CLAUDE.md har fået linjen om Vitest i PowerShell.

  **Testene:** `npx tsc --noEmit` er grøn. `npx vitest run src/modspil` (PowerShell, 68 s): 34 filer og 301 tests, 299 bestået og 2 sprunget over (v1's forsinket kald i Standard og Omvendt, som før); trin 2 (`find-udspil/`, 8 filer) 78 bestået, trin 1 (`udspil/`, 6 filer) 74 bestået og v1 (20 filer) 147 bestået. Testene er ikke rettet under byggeriet. Desuden er `src/sprog/sprog.test.ts` og `src/sprog/bydeform.test.ts` (14 tests) grønne med de nye kildefiler, fordi de læser al dansk tekst i `src/`. Hele suiten er ikke kørt (2c).

  **Claude Codes valg i byggeriet:**
  1. Forklaringen har fire dele: indledningen (situationens meldeforløb og hvad det viser), tallene (den bedste farve og den næstbedste med middelstik og chancen; ved lige gode alle rigtige; ved en tæt opgave forspringet), kortet (kun med svar i kort) og Kompendiets råd med siden. Med svar i kort står kortet, der giver farvens værdi, i tallene (fx "♦3 giver …").
  2. Kortet: ved "table feeling" siger forklaringen altid, at begge kort er rigtige; profil og metode nævnes, når de tre profiler ikke spiller samme kort fra farven. Metoden er honnørreglen, når den afgør udspillet, ellers metoden for det lave kort.
  3. Rådet skrives efter den regel, der gav det: singleton eller doubleton i en sidefarve, sidefarve uden honnør, stærk sekvens, trumfudspil (S6) eller farverne, med betingelsen, når reglen har én ("fordi hånden har mindst to kort i ♥"). Afviger opgaven, forlænges rådets sætning med ", men med denne hånd giver ♠ flest stik", og den sætning er `afvigelse`. Peger rådet ikke på nogen farve, Vest har, siges det.
  4. Tallene: middelstik med én decimal rundet halvt op fra hundrededele, chancen i hele procent ("38 %", på engelsk "38%") og forspringet med to decimaler.
  5. Engelsk: "the Standard profile", "the Compendium profile". Al tekst står som `{ da, en }` eller i grenen `sprog === 'en'`, så sprogtjekket (`src/sprog/danskTekst.ts`) kun læser den danske tekst; med en hjælper som `t(da, en)` ville det engelske "HCP" være fanget som husets "Ikke"-ord.
  6. Opgaverne pr. datasæt og profil klassificeres én gang (klar og afviger) og gemmes; facit og forklaring regnes for den valgte opgave. `bedoemUdspil` kaster ved en forkert svarform og ved et kort, Vest ikke har.
  7. "Ved bordet" bygger på omskrivningerne i `situationer.json`, som Frank har godkendt, fordi Kompendiet ikke kunne læses i denne session: PDF-læseren mangler `pdftoppm`, og der var intet Python-bibliotek til PDF. Frank bedes holde teksterne op mod Kompendiets sider.

  **Tokenforbrug:** Claude Code kan ikke selv aflæse forbruget, så de fire tal står som "–" under "Tokenforbrug pr. session". Næste: Frank gennemgår "Tekster til gennemgang" og prøver modellen; efter "godkendt" kører session 2c hele suiten, fletter og pusher, og `../SYSTEM.md` og CLAUDE.md's beskrivelse af modellen opdateres da. Der er ikke flettet eller pushet.

- **Session 2c, godkendelsen og fletningen (25. nov. 2026):** Frank godkendte trin 2 den 25. nov. 2026 med S6-rettelsen. "Ved bordet" for S6 siger nu "… og kan derfor være et stærkt udspil." / "… and can therefore be a strong lead." i `findUdspilTekst.ts` og under "Tekster til gennemgang"; ingen test er rettet. `npx vitest run src/modspil src/sprog` (PowerShell) gav 312 bestået og 2 sprunget over og én fejl: `src/modspil/udspil/data.test.ts` ("antallet", S2) løb over tidsgrænsen på 5 s under den parallelle kørsel; filen alene er grøn (32 af 32, 16 s), så fejlen var belastning og ikke en ændring. **Hele suiten** (`npm test` i forgrunden, PowerShell): `tsc` er grøn, og Vitest giver 157 filer, 1166 tests bestået og 2 sprunget over (295 s). **Tokenforbrug:** Claude Code kan ikke selv aflæse tallene, så de står som "–" nedenfor. **Fletningen:** grenen `udspil-model` (sidste commit `72c4106`) er flettet ind på `main` med `--no-ff` i `3ea2dda` og pushet, og grenen er slettet lokalt (den lå aldrig på GitHub). `npm test` på `main`: første kørsel 4 røde og anden 8 røde, alle den samme test, `src/modspil/udspil/data.test.ts` "antallet" (trin 1), som løb over standardens 5 s (5–8 s) under den parallelle kørsel; filen alene er grøn (32 af 32), og tredje fulde kørsel er grøn: 157 filer, 1166 bestået og 2 sprunget over (321 s). Ingen test og ingen kode er rettet; testen mangler tidsgrænsen på 30 s, som CLAUDE.md giver andre tunge tests, og det afgøres af Frank. Taget `v46-foer-udspil-model` (`d6653ae`) står. Intet live-tjek, fordi intet er synligt i appen. Specen bliver i roden til trin 3. Næste: mock-up'en ("Modspil v2 – mockup", rådgiveren), så trin 3 (`udspil-skaerme`, tag før `v47-foer-udspil-skaerme`).

- **Session 3a, accepttestene for trin 3 (25. nov. 2026):** `main` (`09f0947`) er tagget `v47-foer-udspil-skaerme`, og grenen `udspil-skaerme` er oprettet. Første commit (`705700a`) er specen og mock-up'ens kopi i `docs/specs/design/modspil-v2/`, andet (`490acf2`) tidsgrænsen på 30 s for "antallet" i `src/modspil/udspil/data.test.ts` (intet andet i filen). Specen stødte to steder mod "eksisterende tests uændret" og var tvetydig om kolonnen Koster; Claude Code spurgte, og svarene står ovenfor under "Franks valg i session 3a". **Skrevet:** tre tomme moduler, hvor skærmen og hver funktion kaster "ikke bygget": `src/modspil/ui/FindUdspil.tsx` (skærmen med props som v1's `Opgave`), `src/modspil/model/udspilPris.ts` (`udspilPris` og `prisTekst`) og `src/modspil/training/findUdspil.ts` (`FIND_UDSPIL`, `udspilIOpgave`, `udspilPost` og `medUdspilPost`); accepttestene i `src/modspil/udspil-skaerme/` med fælles testkode og hele grænsefladen i `hjaelp.tsx`; rettelserne i `src/sidefod.test.tsx`, `src/app/forside.test.tsx` og v1's `src/modspil/ui/session.test.tsx`; og Chrome-delen: `scripts/tjek-bred-layout.mjs` (tagget er nu `v47-foer-udspil-skaerme`, øvelse 8's tjek står i `tjekFindUdspil`, og v1's tjek og tastaturturen klarer en session, hvor øvelse 8 trækkes), `scripts/modspil.html` (`?ovelse=find-udspil&niveau=…&seed=…&profil=…`) og `scripts/tjek-sidefod.mjs` (seks trænere og `#modspil`).

  | Accepttest | Fil | Tests | Røde |
  | --- | --- | --- | --- |
  | 1 Sessionen med øvelse 8 (og lodtrækningen i niveaufasen) | `session.test.tsx` | 4 | 4 |
  | 2 Farve- og kortknapperne | `knapper.test.tsx` | 4 | 4 |
  | 3 Facit | `facit.test.tsx` | 4 | 4 |
  | 4 Skærmene som mock-up'en (jsdom; Chrome i `tjek-bred-layout.mjs`) | `skaerme.test.tsx` | 5 | 5 |
  | 5 Rødt, tilgængelighed og tastatur (jsdom; Chrome i `tjek-bred-layout.mjs`) | `roedt-tilgaengelighed.test.tsx` | 4 | 2 |
  | 6 Sproget | `sprog.test.tsx` | 6 | 4 |
  | 7 Sidefoden (Chrome i `tjek-sidefod.mjs`) | `src/sidefod.test.tsx` (2 rettede af 3) og `src/app/forside.test.tsx` (1 rettet af 12) | 3 | 3 |
  | 8 Lagringen | `lagring.test.tsx` | 6 | 6 |
  | 9 Intet andet er ændret | `intet-andet.test.ts` | 4 | 0 |
  | 10 Prisen | `pris.test.tsx` | 14 | 13 |
  | **I alt** | | **54** | **45** |

  Filerne uden sti ligger i `src/modspil/udspil-skaerme/`.

  **Røde, og hvorfor:** `npx tsc --noEmit` er grøn, og `node --check` er grøn for de to scripts. `npx vitest run src/modspil/udspil-skaerme src/sidefod.test.tsx src/app/forside.test.tsx` (PowerShell, med filerne lagt i git): af de 51 nye tests er 42 røde, og 41 af dem fejler med "Error: ikke bygget" fra de tomme moduler (talt i Vitests JSON-rapport), ingen på en typefejl. Fire tests fejler på en forventning, fordi de ser på kode, der allerede findes: "Find udspillet" står endnu ikke på undtagelseslisten i `src/sprog/bydeform.ts`, og de tre rettede sidefodstests fejler, fordi sidefoden har fem trænere. De 9 grønne tester ikke skærmene: accepttest 9 (fire tests; ændringerne siden tagget er alle tilladte), "testen kan se forskel" i 5 og 6 (tre), kontrollen af mock-up'ens eksempel i 10 (seed 35 og 48 giver S1 opgave 55 med mock-up'ens tal) og "de eksisterende sprogtjek læser øvelse 8's skærm" i 6, som kun kræver, at `FindUdspil.tsx` ligger i git (`danishTexts()` læser filerne med `git ls-files`; før filerne blev lagt i git, var den rød). Chrome-delen (`node scripts/tjek-bred-layout.mjs --modspil` og `node scripts/tjek-sidefod.mjs`) er ikke kørt (3c); øvelse 8's tjek fejler, indtil skærmen er bygget, fordi testsiden ikke kan vise den. Husets ord og bydeform er tjekket på de nye kildefiler uden for testfilerne (`hjaelp.tsx` og de tre tomme moduler) med `fund` og `bydeform` direkte: ingen fund. `src/sprog` er ikke kørt.

  **`npx vitest run src/modspil`** (PowerShell, 76 s, med filerne lagt i git): 43 testfiler og 352 tests. v1 (20 filer): 147 bestået og 2 sprunget over som før, også den rettede sessionstest; trin 1 (6 filer): 74 bestået; trin 2 (8 filer): 78 bestået; trin 3 (9 filer): 9 bestået og 42 røde som ovenfor. Hele suiten er ikke kørt (3c).

  **Claude Codes valg i accepttestene** (3b følger dem; Frank kan rette dem):
  1. Prisen regnes i en ny hjælper, `src/modspil/model/udspilPris.ts`: `udspilPris(opgave, svar)` giver svarets pris i hundrededele (null ved et rigtigt svar) og tabellens rækker i skærmens rækkefølge, og `prisTekst` viser prisen med én decimal som `tiendedele`. Testene regner det samme uafhængigt ud fra facit fra trin 2 (`forventedeRaekker` i `hjaelp.tsx`). "Det bedste svar" er den bedste farves værdi (`tabel`), så et kort, der ikke er profilens, kan koste under 0,1 stik eller mindre end nul: ♥K i eksemplet koster 0 og giver "koster under 0,1 stik i snit". Cellen i Koster for et sådant kort er fri.
  2. Øvelse 8 i sessionen: `nextMsStep` trækker øvelse 8 med chancen 1/(k + 1), hvor k er antallet af v1's øvelser, profilen har på niveauet (én øvelse mere i v1's lodtrækning), på brugerens niveau. Sessionen holder kun `{ niveau, seed }` (`udspilIOpgave`), så lodtrækningen ikke venter på datasættet. Testen tjekker andelen over 1000 faste seeds pr. niveau med en tolerance på 0,05.
  3. Leitner-posten står i det ene valgfrie felt, fordi `items` og `answers` kun godtager v1's syv øvelser (`OVELSER` i v1's generator, der ikke må ændres). Feltets navn og form er 3b's; testene finder det som det felt, `medUdspilPost` tilføjer. Et ugyldigt felt noteres i `problems`, og der gemmes en kopi, som ved v1's valgfrie felter. Accepttest 1 lægger en forfalden post i lagringen, så øvelse 8 kommer først som repetition; ellers ville testen afhænge af lodtrækningen.
  4. Skærmen: farveknapperne har aria-label "Spar, 4 kort" (mock-up 1) og kortknapperne "Spar konge" (som v1), og begge står i gruppen "Svar". I facit står linjen "Dit svar: …" i et `<p>`; tabellen er en rigtig `<table>` (mock-up'en har div'er) med kolonneoverskrifterne i `<th>`, og de rigtige rækker har "✓" og det forkerte svar "dit svar" i første celle. Svarknapperne er deaktiveret i facit, og det valgte svar har `aria-pressed="true"` (mock-up 5). Overskriften er "Forkert: ♥ giver flest stik" og "Forkert: ♥E giver flest stik" i mock-up'ens eksempler; ellers kræves kun, at den begynder med "Rigtigt" eller "Forkert". Rækker med lige mange stik må bytte plads.
  5. Mærket er "<profil> · <metode>" med metoden for udspillet mod kontraktens art (mock-up'en: "Standard · 4.-højeste"), og øvelsens navn har en ⓘ ("Hjælp: Find udspillet"), som nye elementer skal have.
  6. Mock-up 3 viser ikke hånden ved 390 px på niveau 3–5, men mock-up 5 viser den til venstre ved 1280 px. HTML'en er den samme ved alle bredder, så testene kræver hånden i HTML'en på alle niveauer; Chrome-tjekket godtager, at den er skjult med CSS ved 390 px på niveau 3–5. Facit-mock-up'erne ved 390 px viser meldeforløbet trukket sammen på én linje; testene følger v1, hvor opgaven står uændret over facit.
  7. Mock-up'ens eksempel nås med opgavens seed 35 (niveau 1) og 48 (niveau 3) med Standard. Med Standard er ♥E og ♥3 begge rigtige ("table feeling" fra ♥E K 4 3), så ♥4 er forkert med farven rigtig, som i mock-up 4.
  8. Specen giver ikke spørgsmålet og "under 0,1"-linjen på engelsk; testene kræver kun specens "Your answer: ♦ · costs 0.5 tricks on average", "… 0.1 tricks on average" og ingen dansk.
  9. I Chrome finder v1's tjek af bredt layout og samme HTML deres v1-opgave ved at besvare øvelse 8, hvis den trækkes først (`tilV1Opgave`), og tastaturturen godtager en farveknap som svar. Pixelsammenligningen skjuler stadig Modspils afsnit i vejledningen, så 3b's nye linjer om øvelse 8 skal stå i det afsnit.

  **Til 3b:** skærmen, prisen og sessionen bygges efter `hjaelp.tsx` og de tre tomme moduler; "Find udspillet" kommer på undtagelseslisten; Modspil kommer i `src/ui/Footer.tsx`; og vejledningen og CLAUDE.md udvides. `../SYSTEM.md` får Franks valg fra 3a i beslutningsloggen, når trin 3 flettes (3d), som i 1c og 2c.

- **Session 3b, skærmene, prisen og sessionen (25. nov. 2026):** bygget på grenen `udspil-skaerme` oven på 3a (`27f78dd`); ingen test er rettet. **Bygget:** `src/modspil/ui/FindUdspil.tsx` (opgaven og facit), `src/modspil/model/udspilPris.ts` (prisen og tabellens rækker), `src/modspil/training/findUdspil.ts` og ændringerne i `training/session.ts` (lodtrækningen, repetitionen og svaret), `storage.ts` (feltet `findUdspil`), `ui/ModspilScreen.tsx` (datasættet hentes dovent, og øvelse 8 vises og besvares), `ui/tekster.ts` (gruppen `udspil` og sporets ⓘ), `ui/Indstillinger.tsx` (import-resuméet tæller øvelse 8's post med i bunken) og `ui/modspil.css`. Uden for `src/modspil/`: Modspil i `src/ui/Footer.tsx`, "Find udspillet" på undtagelseslisten i `src/sprog/bydeform.ts`, fem nye linjer i Modspils afsnit i `src/app/screens/GuideScreen.tsx` (opgaveteksten skrev `src/app/GuideScreen.tsx`; filen ligger i `screens/`, som specen og accepttest 9 bruger), ti ord i `scripts/ordliste.txt` og CLAUDE.md. Modellen fra trin 2 er uændret.

  **Testene** (PowerShell, i forgrunden): `npx tsc --noEmit` er grøn. `npx vitest run src/modspil src/sprog src/sidefod.test.tsx src/app/forside.test.tsx`: 47 testfiler, 379 bestået og 2 sprunget over (118 s); alle 54 tests fra 3a er grønne, også de 45, der var røde. Desuden, fordi vejledningen og sidefoden vises dér: `src/app/i18n.test.tsx`, `navigation.test.tsx`, `forside-bred.test.tsx`, `kontakt.test.tsx` og `analyse-modul.test.tsx` gav 5 filer og 33 bestået. Stavekontrollen (`node scripts/sprogtjek.ts`) har ingen ukendte ord, efter at ti ord er lagt i ordlisten: `firekortsstøtte`, `umeldte` og `feeling` fra trin 2's tekster, som øvelse 8's facit viser, og syv ord fra kode i testhjælperne (`answer`, `content`, `python`, `raa`, `src`, `tbody` og `your`). Hele suiten og Chrome-scriptene er ikke kørt (3c).

  **Claude Codes valg** (Frank kan rette dem):
  1. **Lagringen:** feltet hedder `findUdspil` og er en Leitner-post som v1's. Det kontrolleres kun, når det findes, og et ugyldigt felt noteres og læses som manglende. Øvelse 8's svar står i postens log og ikke i `answers`, som kun godtager v1's øvelser.
  2. **Lodtrækningen:** `trakUdspil` bruger sin egen talrække fra opgavens seed (`mulberry32(seed ^ 0x6d2b79f5)`), så v1's opgave for et seed er den samme som før, når øvelse 8 ikke trækkes. I repetitionen står øvelse 8 efter v1's øvelser (øvelsernes orden), så den kommer med, når højst én af v1's øvelser er forfalden. Sporets forside tæller posten med i dagens plan; forsidens kort (`src/app/status.ts`, uden for afgrænsningen) tæller den ikke med i "emner til repetition".
  3. **Opgaven** laves én gang pr. opgave i sessionen med profilen i det øjeblik, som v1's opgaver. Kan datasættet ikke hentes (fx offline uden kopi i browseren), står en besked og "Næste opgave", som går videre uden svar.
  4. **Overskriften** nævner alle rigtige farver ("♥ og ♣ giver flest stik", når de er lige gode) og på niveau 3–5 kortet, der giver farvens værdi (♥E ved "table feeling" fra ♥E K 4 3). Den er `h2` som i v1, fordi skærmens `h1` er spørgsmålet (mock-up'en har `h1`).
  5. **Tabellen:** "✓ bedst" står i alle rigtige rækker, også lige gode, og Koster under 0,1 står som "< 0,1". Er svaret ved "table feeling" profilens andet kort i en forkert farve, står det efter kortet, der giver værdien ("♣K · ♣4 dit svar"); linjen "Dit svar" har kortets egen pris og rækken farvens, som accepttest 10 regner dem. Under tabellen står mock-up'ens linje om middelstik og chancen.
  6. **Linjen under meldeforløbet** er "Syd spiller 3NT. Syd har vist 15–17 hp. Du spiller ud." Intervallet er Syds krav i situationsfilen. Mock-up'ens "1NT: 15–17 hp." passer kun til sansåbningerne, fordi Syds interval i S4–S8 gælder hele meldeforløbet (fx 17–21 hp efter 1♥ – 2♥ – 4♥).
  7. **Under 1000 px i facit** skjuler v1's regel meldeskemaet og spørgsmålet, og meldeforløbet står på én linje over hånden ("Syd 1NT – Nord 3NT · alle passer", mock-up 2 og 4) uden overskriften "Vest · dig · 11 hp". På niveau 3–5 er hånden skjult, før der er svaret (3a's valg 6). Fra 1000 px gælder v1's to spalter uændret.
  8. **Knapperne og farverne:** farveknapperne er 64 px høje og kortknapperne 56 px (mock-up'en), og en farve uden kort har stiplet kant og grå flade. En farve med syv eller otte kort (33 af 1200 hænder) har lidt mindre skrift, så rækken kan være ved 320 px. Kontrakten i skemaet har `accent-soft` og en indre ring i `text` (mock-up'en). Hjørnerne er `--radius-12`, som husets hjørner (mock-up'en har 6 og 10 px). Ingen nye tokens.
  9. **Sporets ⓘ** (`hjaelp.skaerm`) sagde, at alle øvelser har "Kan ikke afgøres"; det passer ikke længere og er rettet (tabellen nedenfor). Vejledningens linje "Øvelserne: …" nævner stadig syv øvelser, fordi kun nye linjer er tilladt i `GuideScreen.tsx`; øvelse 8 står i den første nye linje.
  10. **Ordbogslinket** er "Udspil i ordbogen" (`#udspil`) i alle opgaver, som i mock-up'en.
  11. `../SYSTEM.md` er ikke opdateret; feltet `findUdspil` i `modspil:v1` og Franks valg fra 3a kommer med i 3d som planlagt.

  **Tokenforbrug:** Claude Code kan ikke selv aflæse forbruget, så de fire tal står som "–" under "Tokenforbrug pr. session". **Næste:** Frank gennemgår "Tekster til gennemgang (trin 3)" og prøver skærmene (`npm run dev`, Modspil); session 3c kører hele suiten, `node scripts/tjek-bred-layout.mjs --modspil`, `node scripts/tjek-sidefod.mjs` og skærmbillederne. Der er ikke flettet eller pushet.

  **Tokenforbrug:** Claude Code kan ikke selv aflæse tallene, så de står som "–" nedenfor. Der er ikke flettet eller pushet.

**Krav til gennemgang (session 1a):** **Godkendt af Frank 25. nov. 2026** (kravene, Kompendiets regler med svarene a–d og de otte eksempler). Frank godkender punkt 1–4, før generatoren køres. Ændres et krav, en regel eller et eksempel, rettes kun `situationer.json`.

1. **endplay og Python.** `endplay` 0.5.12 (den nyeste) har færdige hjul til Python 3.9–3.13 på Windows, men **ikke til 3.14**; på 3.14 vil pip bygge DDS fra kildekoden, hvilket kræver en C++-compiler og som regel fejler. Jeg har ikke kunnet prøve installationen på Franks pc (prøvekørslen kørte i en Linux-VM med Python 3.10). Derfor: **Python 3.13 installeres**, og venv'et laves med `py -3.13 -m venv tools\udspil\.venv` (`tools/udspil/README.md`). DDS er eksakt, så tallene bliver de samme på Windows.

2. **Kravene til hænderne** følger rådgiverens tabel. Mine fortolkninger:
   - "Systemets X": `chooseCall('opening')` giver X. S1–S3 har desuden "jævn" (4-3-3-3, 4-4-3-2, 5-3-3-2), som systemets 1NT i forvejen kræver.
   - P (modspillerens pas) gælder både Øst og Vest i sammenhængen over Syds åbning: `over-1NT` i S1–S3, `over-1H` i S4 og S6, `over-1S` i S5 og S8. Øst kontrolleres i samme sammenhæng, selv om han melder efter Nord.
   - S7: Syds 1NT er ikke "systemets", fordi systemfilens 1NT-indmelding over 1♥ er 8–11 hp; kravet er 15–18 hp, jævn og hold i ♥ (`hasStopper`), som i tabellen. Øst er giver og åbner med systemets 1♥.
   - S2 Nord: "præcis 4 i mindst én major, ingen 5-farve i major" er højst 4 i begge majorer og præcis 4 i mindst én.
   - S3 Nord: "ingen singleton eller renonce" er mindst 2 i alle farver.

3. **Kompendiets råd** (`kompendieraad`): reglerne prøves i rækkefølge, og den første, der gælder og giver mindst én farve, Vest har kort i, er rådet. Honnør er E, K, D og B. Teksterne er omskrevet i husets ord.

   | Id | Regler (rådets farver) | Kompendiet |
   | --- | --- | --- |
   | S1 | ♠ og ♥ | s. 11–12: major, helst den korteste; en kort major før en firefarve med honnør i minor |
   | S2 | ♠ og ♥ | s. 14: spilføreren har ofte minorerne; major, ofte den korteste, også singleton |
   | S3 | ♥ med en dyb sekvens (mindst 5 kort, de fire øverste i træk med toppen mindst B), ellers ♠, ♦ og ♣ (Franks svar b) | s. 14: sjældent bordets femfarve; lille fordel for den anden major |
   | S4 | singleton i en sidefarve, ellers doubleton i en sidefarve, ellers sidefarver uden honnør, ellers alle sidefarver | s. 19 |
   | S5 | singleton i ♥, ♦ eller ♣, ellers ♦ og ♣ | s. 20 |
   | S6 | ♣ (trumf) | s. 4 |
   | S7 | ♥ med 2+ kort, ellers en farve med en stærk sekvens (de tre øverste i træk eller brudt, fx K D B eller K D 10, toppen mindst B), ellers ♥ | s. 16 |
   | S8 | singleton i en sidefarve, ellers doubleton i en sidefarve, ellers alle sidefarver | s. 19 |

   **Franks svar, 25. nov. 2026:** (a) S1 og S2 beholder begge majorer; (b) ja, S3 peger på alle farver undtagen ♥ (♥ kun med en dyb sekvens), og teksten nævner stadig den lille fordel for ♠; (c) S5's es i bordets farve står kun i teksten, ikke i reglen (S8's E x og D x er doubletons og dækkes af reglen); (d) ja, en singleton i en sidefarve.

   Spørgsmålene var: (a) S1 og S2 peger på begge majorer, ikke kun den korteste, så "afviger" (trin 2) kun gælder, når dobbeltdummy vil have en minor; skal det i stedet være den korteste major? (b) S3 peger kun på ♠, fordi Kompendiet nævner en lille fordel; skal det være alle farver undtagen ♥? (c) S5's "es i bordets farve med 4–5 kort" og S8's "E x og D x" er med i teksten, men ikke i reglerne. (d) S8: Kompendiets "singleton i en firfarve" er læst som en singleton i en sidefarve.

4. **De faste eksempler** (accepttest 6), én hånd pr. situation, regnet i prøvekørslen med 100 fordelinger. Farvens værdi er middelstikket for profilen Standards kort; rådets farve er den bedste i alle otte (i S1 og S2 med ♥ under 0,1 stik efter ♠).

   | Id | Vests hånd | Seed | Bedste farve (Standard) | Næstbedste |
   | --- | --- | --- | --- | --- |
   | S1 | ♠ 8 4 2 ♥ 10 9 7 5 3 ♦ K 6 ♣ D B 6 | 3611241 | ♠ 8: 2,36 | ♥ 5: 2,33 |
   | S2 | ♠ 9 5 ♥ 10 8 6 4 ♦ K B 7 3 ♣ D 8 5 | 3611242 | ♠ 9: 2,98 | ♥ 4: 2,96 |
   | S3 | ♠ K D B 5 ♥ 6 3 ♦ 9 7 4 2 ♣ 8 5 3 | 3611243 | ♠ K: 3,05 | ♦ 2: 2,51 |
   | S4 | ♠ 7 ♥ 8 6 4 ♦ K 10 7 5 3 ♣ D 9 6 2 | 3611244 | ♠ 7: 1,72 | ♦ 5: 1,61 |
   | S5 | ♠ 8 5 2 ♥ K 9 7 3 ♦ 4 ♣ D 10 8 6 3 | 3611245 | ♦ 4: 1,40 | ♣ 6: 1,05 |
   | S6 | ♠ K D 10 9 ♥ D 10 9 8 ♦ 9 7 3 ♣ 7 5 | 3611246 | ♣ 7: 3,95 | ♠ K: 3,69 |
   | S7 | ♠ 8 6 4 2 ♥ 9 5 ♦ 10 7 6 3 ♣ B 8 2 | 3611247 | ♥ 9: 3,00 | ♠ 2: 2,70 |
   | S8 | ♠ 7 6 3 ♥ K 8 5 4 2 ♦ 6 ♣ D 9 7 4 | 3611248 | ♦ 6: 2,52 | ♣ 4: 2,35 |

   Mine første forslag til S3 (♠ D 10 7 4 og ♠ B 9 8 5 2 med svage minorer) gav ♣ eller ♥ som bedste farve; dobbeltdummy kan godt lide et passivt udspil i bordets ♥ fra to små. Det kan give mange "afviger"-opgaver i S3.

5. **Tiden** (prøvekørslen i en VM med to kerner): én opgave tog 1,3–2,5 s i S1, S2, S4, S5, S7 og S8, 7,7 s i S6 og 22,9 s i S3, hvor det er svært at finde fordelinger, der passer med kravene (ca. 930.000 forsøg for 100 fordelinger). Eksemplerne tog 2–27 s. Hele kørslen ventes at tage ca. 1 time på VM'en og mindre på Franks pc, altså under 3 timer, så **100 fordelinger beholdes** (specens punkt 8).

6. **Claude Codes valg** (ingen godkendelse nødvendig, men til orientering):
   - Seeds: situationerne 2611241–2611248, eksemplerne 3611241–3611248 og stabiliteten opgavens seed XOR `0x9E3779B9`.
   - En fordeling er de 39 kort, Vest ikke har, i stigende orden, blandet med `shuffle` og givet til N, Ø og S (0–12, 13–25, 26–38). Generatoren stopper blandingen, så snart en færdigblandet hånd ikke passer (Fisher–Yates blander bagfra, så Syd er færdig efter 13 trin); resultatet er bit for bit det samme som en hel blanding, og TS-testene blander helt.
   - Middelstikket gemmes med to decimaler, regnet med heltal: round(100 × sum / n), halvt op.
   - Stabiliteten: grænsen gælder den bedste farves værdi (profilen Standard) i de klare opgaver. Den var 0,25 stik, men er 3 standardfejl efter session 1b (se Status). `kontrol.py --stabilitet` skriver `tools/udspil/raa/stabilitet/<id>.json`, og `src/modspil/udspil/stabilitet.test.ts` sammenligner.
   - Accepttest 6 regner "bedste farve" som de farver, der er under 0,1 stik fra den bedste (Franks svar 4), og kræver, at én af dem er blandt rådets.
   - Testenes fælles kode står i `src/modspil/udspil/hjaelp.ts` (kun til tests).

**Tekster til gennemgang (session 2b og 3b):** teksterne til trin 2 står i `src/modspil/model/findUdspilTekst.ts`; Frank godkender dem før fletning. Kompendiet er omskrevet med siden og ikke citeret. "(tilføjelse)" markerer Claude Codes egne begrundelser og beskrivelser, der ikke er Kompendiets råd. Kompendiet kunne ikke læses i session 2b (se Status), så "Ved bordet" bygger på de godkendte omskrivninger i `situationer.json`.

*A. "Ved bordet" (én tekst pr. situation)*

- **S1 1NT – 3NT (s. 11–12):** Mod 1NT – 3NT spilles der normalt ud i en major, og den korteste major er ofte bedst. En kort major er et bedre udspil end en firefarve i minor med en eller to honnører. / *Against 1NT – 3NT the lead is normally a major, and the shorter major is often best. A short major is a better lead than a four-card minor with one or two honours.*
- **S2 1NT – 2♣ – 2♦ – 3NT (s. 14):** Et svar på 2♦ efter Stayman betyder ofte, at spilføreren har minorfarverne. Udspillet er derfor normalt i en major, gerne den korteste og også fra en singleton. / *A 2♦ answer to Stayman often means that declarer holds the minors. The lead is therefore normally a major, preferably the shorter one and even from a singleton.*
- **S3 1NT – 2♦ – 2♥ – 3NT (s. 14):** Udspil i bordets viste femfarve i ♥ betaler sig sjældent; kun en dyb sekvens som D B 10 9 3 gør det til et godt valg. Blandt de andre farver er ♠ en anelse bedre end minorfarverne, fordi modspillet tit har syv kort i den anden major. / *A lead in dummy's five-card heart suit rarely pays; only a deep sequence such as Q J 10 9 3 makes it a good choice. Among the other suits spades are slightly better than the minors, because the defence often holds seven cards in the other major.*
- **S4 1♥ – 2♥ – 4♥ (s. 19):** Når kun trumffarven er meldt, er en singleton i en sidefarve et stærkt udspil, og en doubleton er bedre end sit rygte. Bordet er svagt, så småkort er bedre end en farve med en eller to honnører, og trumf ud kommer først på tale, når ingen sidefarve frister. / *When only the trump suit has been bid, a singleton in a side suit is a strong lead, and a doubleton is better than its reputation. Dummy is weak, so small cards are better than a suit with one or two honours, and a trump lead only comes into question when no side suit appeals.*
- **S5 1♠ – 2♥ – 2♠ – 4♠ (s. 20):** En singleton i en sidefarve er førstevalget, også i bordets ♥. Ellers er de umeldte farver ♦ og ♣ bedst, helst fra småkort frem for fra honnører, medmindre udspilleren har en trekorts honnørsekvens som K D B. Med esset og fire eller fem kort i bordets ♥ kan esset også være et godt udspil. / *A singleton in a side suit is the first choice, even in dummy's hearts. Otherwise the unbid suits, diamonds and clubs, are best, preferably from small cards rather than from honours, unless the leader holds a three-card honour sequence such as K Q J. With the ace and four or five cards in dummy's hearts the ace can also be a good lead.* Sidste sætning bygger på Franks svar (c) i 1a ("es i bordets farve med 4–5 kort" står kun i teksten); ordlyden er Claude Codes og bør holdes op mod s. 20.
- **S6 1♥ – 1♠ – 2♣ – pas (s. 4):** Syd har vist ♥ og ♣, og Nord er kort i ♥, så bordet kan trumfe Syds hjerter. Trumf ud fjerner bordets trumfer (tilføjelse) og kan derfor være et stærkt udspil. / *South has shown hearts and clubs, and North is short in hearts, so dummy can ruff South's hearts. A trump lead removes dummy's trumps and can therefore be a strong lead.*
- **S7 1♥ – 1NT – pas – 3NT (s. 16):** Når makker har åbnet med 1♥, er makkers farve næsten altid det rigtige udspil med to kort eller flere i ♥. Med singleton ♥ kræver et andet udspil en stærk sekvens som K D B eller K D 10. / *When partner has opened 1♥, partner's suit is almost always the right lead with two or more hearts. With a singleton heart another lead needs a strong sequence such as K Q J or K Q 10.*
- **S8 1♠ – 3♠ (s. 19):** Mod en delkontrakt, hvor Nord har vist firekortsstøtte, er en singleton næsten altid det rigtige udspil, og en doubleton uden honnører er bedre end sit rygte. E x og D x er værd at overveje, mens trumf ud ofte er det svageste valg. / *Against a part score where North has shown four-card support, a singleton is almost always the right lead, and a doubleton without honours is better than its reputation. A x and Q x are worth considering, while a trump lead is often the weakest choice.*

*B. Indledningen til forklaringen (én pr. situation; beskriver meldeforløbet ud fra kravene i situationsfilen, så alle er (tilføjelse), undtagen S2's "spilføreren har ofte minorfarverne", der er Kompendiets, s. 14)*

- **S1:** Efter 1NT – 3NT har Syd 15–17 hp og en jævn hånd, og Nord har ikke søgt et fit i major. / *After 1NT – 3NT South has 15–17 HCP and a balanced hand, and North has not looked for a major fit.*
- **S2:** Efter 1NT – 2♣ – 2♦ – 3NT har Syd ingen firefarve i major, mens Nord har en, så spilføreren har ofte minorfarverne. / *After 1NT – 2♣ – 2♦ – 3NT South has no four-card major while North has one, so declarer often holds the minors.*
- **S3:** Efter 1NT – 2♦ – 2♥ – 3NT har Nord vist fem ♥, og Syd har valgt sans. / *After 1NT – 2♦ – 2♥ – 3NT North has shown five hearts, and South has chosen notrump.*
- **S4:** Efter 1♥ – 2♥ – 4♥ er kun trumffarven meldt, og bordet er svagt: Nord har vist 6–9 hp med støtte. / *After 1♥ – 2♥ – 4♥ only the trump suit has been bid, and dummy is weak: North has shown 6–9 HCP with support.*
- **S5:** Efter 1♠ – 2♥ – 2♠ – 4♠ har bordet vist en femfarve i ♥ og støtte i ♠. / *After 1♠ – 2♥ – 2♠ – 4♠ dummy has shown five hearts and spade support.*
- **S6:** Efter 1♥ – 1♠ – 2♣ – pas har Syd vist ♥ og ♣, og Nord foretrækker ♣ og er kort i ♥. / *After 1♥ – 1♠ – 2♣ – pass South has shown hearts and clubs, and North prefers clubs and is short in hearts.*
- **S7:** Efter 1♥ – 1NT – pas – 3NT har makker åbnet med 1♥, og Syd har vist hold i ♥. / *After 1♥ – 1NT – pass – 3NT partner has opened 1♥, and South has shown a heart stopper.*
- **S8:** Efter 1♠ – 3♠ spiller Syd en delkontrakt, og Nord har vist firekortsstøtte. / *After 1♠ – 3♠ South plays a part score, and North has shown four-card support.*

*C. Skabelonerne.* Forklaringen er indledningen, tallene, kortet (kun med svar i kort) og rådet i den rækkefølge. {B} er den bedste farve, {N} den næstbedste og {X} en anden lige god (med svar i kort det kort, der giver farvens værdi, fx ♦3); {m} er middelstik med én decimal, {p} chancen i hele procent, {K} kontrakten, {d} forspringet med to decimaler, {H} Vests kort i farven (fx ♥K D 10 5), {k} et kort, {P} profilen, {M} metoden fra metodefilen og {s} siden.

1. Tallene, én bedste: {B} giver i gennemsnit {m} stik til modspillet og sætter {K} i {p} % af fordelingerne; {N} giver {m} stik og {p} %. / *{B} gives the defence {m} tricks on average and defeats {K} in {p}% of the deals; {N} gives {m} tricks and {p}%.*
2. Tæt opgave (forspring under 0,2 stik), efter 1: Forspringet til {N} er kun {d} stik. / *The margin over {N} is only {d} tricks.*
3. Lige gode: {B}, {X} og … er lige gode (under 0,1 stik fra den bedste): {B} giver i gennemsnit {m} stik til modspillet og sætter {K} i {p} % af fordelingerne, {X} {m} stik og {p} %. / *{B}, {X} and … are equally good (within 0.1 tricks of the best): {B} gives the defence {m} tricks on average and defeats {K} in {p}% of the deals, {X} {m} tricks and {p}%.*
4. "Table feeling" (svar i kort): Fra {H} mod sans afgøres udspillet af "table feeling": {k} og {k} er begge rigtige. / *From {H} against notrump the lead is a matter of table feeling: {k} and {k} are both right.* Skifter profilen kortet: Med profilen {P} afgøres udspillet fra {H} mod sans af "table feeling" ({M}): {k} og {k} er begge rigtige. / *With the {P} profile the lead from {H} against notrump is a matter of table feeling ({M}): {k} and {k} are both right.*
5. Profilen skifter kortet (svar i kort): Med profilen {P} spilles {k} ud fra {H} ({M}). / *With the {P} profile {k} is led from {H} ({M}).*
6. Rådet: Kompendiet ({s}) anbefaler {hvad} efter dette forløb{her}. / *The Compendium ({s}) recommends {what} after this auction{here}.* {hvad}/{what} efter reglen: udspil i {farverne} / *a lead in {suits}*; trumfudspil ({trumf}) / *a trump lead ({trump})*; udspil fra en singleton i en sidefarve / *a lead from a singleton in a side suit*; udspil fra en doubleton i en sidefarve / *a lead from a doubleton in a side suit*; udspil i en sidefarve uden honnør / *a lead in a side suit without an honour*; udspil i en farve med en stærk sekvens / *a lead in a suit with a strong sequence*. {her}: ", her {farverne}" / *", here {suits}"* efter de fire sidste; efter en regel med betingelse ", fordi hånden har en dyb sekvens i ♥" (S3) eller ", fordi hånden har mindst to kort i ♥" (S7) / *", because the hand has a deep sequence in ♥"*, *"… at least two cards in ♥"*.
7. Afviger, efter rådet: …, men med denne hånd giver {B} flest stik. / *…, but with this hand {B} gives the most tricks.*
8. Intet råd: Kompendiets råd efter dette forløb ({s}) peger ikke på en farve, Vest har[, og med denne hånd giver {B} flest stik]. / *The Compendium's advice after this auction ({s}) points to no suit West holds[, and with this hand {B} gives the most tricks].*
9. Dommen (rigtig farve, ikke profilens kort): Farven er rigtig, men med profilen {P} spilles {k} ud fra {H}. / *The suit is right, but with the {P} profile {k} is led from {H}.*

*D. Udfyldte eksempler* (profilen Standard; det klare med svar i farve som på niveau 1–2, det, der afviger, med svar i kort som på niveau 4–5; "nr." er opgavens indeks i datafilen). S3 og S7 har ingen opgave, der afviger fra Kompendiet, med nogen af profilerne.

- **S1, klar** (nr. 0, ♠D 10 9 5 4 ♥9 7 ♦E 10 9 8 ♣9 4): Efter 1NT – 3NT har Syd 15–17 hp og en jævn hånd, og Nord har ikke søgt et fit i major. ♠ giver i gennemsnit 3,1 stik til modspillet og sætter 3NT i 15 % af fordelingerne; ♥ giver 2,6 stik og 4 %. Kompendiet (s. 11–12) anbefaler udspil i ♠ eller ♥ efter dette forløb. / *After 1NT – 3NT South has 15–17 HCP and a balanced hand, and North has not looked for a major fit. ♠ gives the defence 3.1 tricks on average and defeats 3NT in 15% of the deals; ♥ gives 2.6 tricks and 4%. The Compendium (pp. 11–12) recommends a lead in ♠ or ♥ after this auction.*
- **S1, afviger** (nr. 2, ♠K 8 3 ♥K 9 6 5 3 ♦B 9 6 3 2, renonce i ♣): … ♦3 giver i gennemsnit 2,4 stik til modspillet og sætter 3NT i 6 % af fordelingerne; ♥5 giver 2,2 stik og 3 %. Kompendiet (s. 11–12) anbefaler udspil i ♠ eller ♥ efter dette forløb, men med denne hånd giver ♦ flest stik. / *… ♦3 gives the defence 2.4 tricks on average and defeats 3NT in 6% of the deals; ♥5 gives 2.2 tricks and 3%. The Compendium (pp. 11–12) recommends a lead in ♠ or ♥ after this auction, but with this hand ♦ gives the most tricks.*
- **S2, klar** (nr. 4, ♠10 9 8 4 3 ♥B 10 5 ♦10 4 3 ♣K 5): Efter 1NT – 2♣ – 2♦ – 3NT har Syd ingen firefarve i major, mens Nord har en, så spilføreren har ofte minorfarverne. ♠ giver i gennemsnit 2,7 stik til modspillet og sætter 3NT i 11 % af fordelingerne; ♥ giver 2,5 stik og 7 %. Kompendiet (s. 14) anbefaler udspil i ♠ eller ♥ efter dette forløb. / *After 1NT – 2♣ – 2♦ – 3NT South has no four-card major while North has one, so declarer often holds the minors. ♠ gives the defence 2.7 tricks on average and defeats 3NT in 11% of the deals; ♥ gives 2.5 tricks and 7%. The Compendium (p. 14) recommends a lead in ♠ or ♥ after this auction.*
- **S2, afviger** (nr. 130, ♠D B 7 6 ♥3 2 ♦10 6 3 ♣E K 6 4): … ♣E giver i gennemsnit 3,0 stik til modspillet og sætter 3NT i 7 % af fordelingerne; ♠D giver 2,8 stik og 4 %. Med profilen Standard afgøres udspillet fra ♣E K 6 4 mod sans af "table feeling" (top af sekvens): ♣E og ♣4 er begge rigtige. Kompendiet (s. 14) anbefaler udspil i ♠ eller ♥ efter dette forløb, men med denne hånd giver ♣ flest stik. / *… ♣A gives the defence 3.0 tricks on average and defeats 3NT in 7% of the deals; ♠Q gives 2.8 tricks and 4%. With the Standard profile the lead from ♣A K 6 4 against notrump is a matter of table feeling (top of sequence): ♣A and ♣4 are both right. The Compendium (p. 14) recommends a lead in ♠ or ♥ after this auction, but with this hand ♣ gives the most tricks.*
- **S3, klar** (nr. 5, ♠D B 10 5 ♥B 9 7 ♦D 8 4 ♣9 3 2): Efter 1NT – 2♦ – 2♥ – 3NT har Nord vist fem ♥, og Syd har valgt sans. ♠ giver i gennemsnit 2,2 stik til modspillet og sætter 3NT i 4 % af fordelingerne; ♣ giver 1,8 stik og 1 %. Kompendiet (s. 14) anbefaler udspil i ♠, ♦ eller ♣ efter dette forløb. / *After 1NT – 2♦ – 2♥ – 3NT North has shown five hearts, and South has chosen notrump. ♠ gives the defence 2.2 tricks on average and defeats 3NT in 4% of the deals; ♣ gives 1.8 tricks and 1%. The Compendium (p. 14) recommends a lead in ♠, ♦ or ♣ after this auction.*
- **S4, klar** (nr. 0, ♠D B 7 6 3 ♥6 4 ♦B ♣K 6 5 3 2): Efter 1♥ – 2♥ – 4♥ er kun trumffarven meldt, og bordet er svagt: Nord har vist 6–9 hp med støtte. ♦ giver i gennemsnit 1,7 stik til modspillet og sætter 4♥ i 6 % af fordelingerne; ♠ giver 1,4 stik og 3 %. Kompendiet (s. 19) anbefaler udspil fra en singleton i en sidefarve efter dette forløb, her ♦. / *After 1♥ – 2♥ – 4♥ only the trump suit has been bid, and dummy is weak: North has shown 6–9 HCP with support. ♦ gives the defence 1.7 tricks on average and defeats 4♥ in 6% of the deals; ♠ gives 1.4 tricks and 3%. The Compendium (p. 19) recommends a lead from a singleton in a side suit after this auction, here ♦.*
- **S4, afviger** (nr. 32, ♠E K B 10 ♥D ♦B 9 4 3 ♣10 8 5 4): … ♠E giver i gennemsnit 2,3 stik til modspillet og sætter 4♥ i 6 % af fordelingerne; ♣4 giver 1,9 stik og 6 %. Kompendiet (s. 19) anbefaler udspil i en sidefarve uden honnør efter dette forløb, her ♣, men med denne hånd giver ♠ flest stik. / *… ♠A gives the defence 2.3 tricks on average and defeats 4♥ in 6% of the deals; ♣4 gives 1.9 tricks and 6%. The Compendium (p. 19) recommends a lead in a side suit without an honour after this auction, here ♣, but with this hand ♠ gives the most tricks.*
- **S5, klar** (nr. 2, ♠9 ♥D 3 ♦E 8 7 5 ♣9 8 6 5 3 2): Efter 1♠ – 2♥ – 2♠ – 4♠ har bordet vist en femfarve i ♥ og støtte i ♠. ♣ giver i gennemsnit 1,9 stik til modspillet og sætter 4♠ i 6 % af fordelingerne; ♠ giver 1,5 stik og 3 %. Kompendiet (s. 20) anbefaler udspil i ♦ eller ♣ efter dette forløb. / *After 1♠ – 2♥ – 2♠ – 4♠ dummy has shown five hearts and spade support. ♣ gives the defence 1.9 tricks on average and defeats 4♠ in 6% of the deals; ♠ gives 1.5 tricks and 3%. The Compendium (p. 20) recommends a lead in ♦ or ♣ after this auction.*
- **S5, afviger** (nr. 130, ♠9 8 4 ♥10 ♦K D B 7 3 ♣B 8 6 4): … ♦K giver i gennemsnit 1,5 stik til modspillet og sætter 4♠ i 1 % af fordelingerne; ♥10 giver 1,3 stik og 1 %. Kompendiet (s. 20) anbefaler udspil fra en singleton i en sidefarve efter dette forløb, her ♥, men med denne hånd giver ♦ flest stik. / *… ♦K gives the defence 1.5 tricks on average and defeats 4♠ in 1% of the deals; ♥10 gives 1.3 tricks and 1%. The Compendium (p. 20) recommends a lead from a singleton in a side suit after this auction, here ♥, but with this hand ♦ gives the most tricks.*
- **S6, klar** (nr. 5, ♠D B 7 5 ♥K D 8 6 ♦10 ♣B 10 9 6): Efter 1♥ – 1♠ – 2♣ – pas har Syd vist ♥ og ♣, og Nord foretrækker ♣ og er kort i ♥. ♣ giver i gennemsnit 4,4 stik til modspillet og sætter 2♣ i 18 % af fordelingerne; ♦ giver 4,1 stik og 14 %. Kompendiet (s. 4) anbefaler trumfudspil (♣) efter dette forløb. / *After 1♥ – 1♠ – 2♣ – pass South has shown hearts and clubs, and North prefers clubs and is short in hearts. ♣ gives the defence 4.4 tricks on average and defeats 2♣ in 18% of the deals; ♦ gives 4.1 tricks and 14%. The Compendium (p. 4) recommends a trump lead (♣) after this auction.*
- **S6, afviger** (nr. 26, ♠E K D 7 ♥D 8 7 ♦9 5 3 ♣K 10 3): … ♠E giver i gennemsnit 3,5 stik til modspillet og sætter 2♣ i 3 % af fordelingerne; ♦9 giver 3,2 stik og 2 %. Kompendiet (s. 4) anbefaler trumfudspil (♣) efter dette forløb, men med denne hånd giver ♠ flest stik. / *… ♠A gives the defence 3.5 tricks on average and defeats 2♣ in 3% of the deals; ♦9 gives 3.2 tricks and 2%. The Compendium (p. 4) recommends a trump lead (♣) after this auction, but with this hand ♠ gives the most tricks.*
- **S7, klar** (nr. 0, ♠6 5 4 2 ♥7 5 3 ♦10 7 3 ♣5 4 3): Efter 1♥ – 1NT – pas – 3NT har makker åbnet med 1♥, og Syd har vist hold i ♥. ♥ giver i gennemsnit 2,4 stik til modspillet og sætter 3NT i 8 % af fordelingerne; ♠ giver 2,2 stik og 4 %. Kompendiet (s. 16) anbefaler udspil i ♥ efter dette forløb, fordi hånden har mindst to kort i ♥. / *After 1♥ – 1NT – pass – 3NT partner has opened 1♥, and South has shown a heart stopper. ♥ gives the defence 2.4 tricks on average and defeats 3NT in 8% of the deals; ♠ gives 2.2 tricks and 4%. The Compendium (p. 16) recommends a lead in ♥ after this auction, because the hand has at least two cards in ♥.*
- **S8, klar** (nr. 25, ♠8 7 ♥9 3 2 ♦E K B 5 ♣D 8 5 3): Efter 1♠ – 3♠ spiller Syd en delkontrakt, og Nord har vist firekortsstøtte. ♦ giver i gennemsnit 2,5 stik til modspillet og sætter 3♠ i 1 % af fordelingerne; ♥ giver 2,2 stik og 1 %. Kompendiet (s. 19) anbefaler udspil i ♥, ♦ eller ♣ efter dette forløb. / *After 1♠ – 3♠ South plays a part score, and North has shown four-card support. ♦ gives the defence 2.5 tricks on average and defeats 3♠ in 1% of the deals; ♥ gives 2.2 tricks and 1%. The Compendium (p. 19) recommends a lead in ♥, ♦ or ♣ after this auction.*
- **S8, afviger** (nr. 55, ♠B 4 2 ♥K D B 7 ♦E K 8 3 ♣8 3): … ♦E giver i gennemsnit 2,6 stik til modspillet og sætter 3♠ i 4 % af fordelingerne; ♥K giver 2,3 stik og 2 %. Kompendiet (s. 19) anbefaler udspil fra en doubleton i en sidefarve efter dette forløb, her ♣, men med denne hånd giver ♦ flest stik. / *… ♦A gives the defence 2.6 tricks on average and defeats 3♠ in 4% of the deals; ♥K gives 2.3 tricks and 2%. The Compendium (p. 19) recommends a lead from a doubleton in a side suit after this auction, here ♣, but with this hand ♦ gives the most tricks.*

"…" står for situationens indledning, som i det klare eksempel. Desuden, alle i S1 med svar i kort:

- **Lige gode, og profilen skifter kortet** (Kompendiet, nr. 1, ♠D 5 4 ♥10 8 7 4 ♦B 10 ♣E 6 3 2): … ♥8, ♣2 og ♠4 er lige gode (under 0,1 stik fra den bedste): ♥8 giver i gennemsnit 2,7 stik til modspillet og sætter 3NT i 5 % af fordelingerne, ♣2 2,6 stik og 8 %, ♠4 2,6 stik og 9 %. Med profilen Kompendiet spilles ♥8 ud fra ♥10 8 7 4 (Kompendiets udspil). Kompendiet (s. 11–12) anbefaler udspil i ♠ eller ♥ efter dette forløb. / *… ♥8, ♣2 and ♠4 are equally good (within 0.1 tricks of the best): ♥8 gives the defence 2.7 tricks on average and defeats 3NT in 5% of the deals, ♣2 2.6 tricks and 8%, ♠4 2.6 tricks and 9%. With the Compendium profile ♥8 is led from ♥10 8 7 4 (the Compendium's leads). The Compendium (pp. 11–12) recommends a lead in ♠ or ♥ after this auction.*
- **"Table feeling"** (Standard, nr. 3, ♠D 10 7 ♥D 8 7 2 ♦6 4 ♣B 10 3 2): … Fra ♣B 10 3 2 mod sans afgøres udspillet af "table feeling": ♣B og ♣2 er begge rigtige. … / *… From ♣J 10 3 2 against notrump the lead is a matter of table feeling: ♣J and ♣2 are both right. …*
- **Dommen** (Standard, niveau 3, seed 1, S4; svaret er et andet kort i ♣): Farven er rigtig, men med profilen Standard spilles ♣K ud fra ♣K D. / *The suit is right, but with the Standard profile ♣K is led from ♣K Q.*

**Franks svar efter session 3b, 25. nov. 2026** (rettes i 3c):
1. Sporets ⓘ (Franks tekst) godkendes, som Claude Code har rettet den.
2. Fire tekstrettelser godkendt:
   - Kan datasættet ikke hentes: "Opgaven kunne ikke hentes og springes over." / "The task could not be loaded and is skipped."
   - Vejledningen 2: sætningen om lige gode bliver "Farver under 0,1 stik fra den bedste er lige gode og alle rigtige; fra niveau 3 er det profilens kort i de farver." / "Suits within 0.1 tricks of the best are equally good and all right; from level 3 it is the profile's card in those suits."
   - Vejledningen 3, engelsk: "so the Compendium profile leads ALA" (lille "the").
   - Vejledningen 6 (ny linje): "Dobbeltdummy kender alle fire hænder. Et udspil, der sætter spilføreren på et gæt, kan derfor være bedre ved bordet, end tallene viser." / "Double dummy sees all four hands, so a lead that leaves declarer a guess can be better at the table than the figures show."
3. `src/app/status.ts` tæller øvelse 8 med, og vejledningens linje "Øvelserne: …" nævner otte øvelser (afgrænsningen er udvidet).
4. Repetitionen: øvelse 8 står sidst i køen som i 3b; det vurderes igen efter brug.

**Tekster til gennemgang (trin 3)** (session 3b): de nye tekster på skærmen, i sporets ⓘ, i vejledningen og i sidefoden. Teksterne står i `src/modspil/ui/tekster.ts` (gruppen `udspil` og `hjaelp.skaerm`), `src/app/screens/GuideScreen.tsx` og `src/ui/Footer.tsx`. "(tilføjelse)" markerer Claude Codes egne formuleringer; resten er specens eller mock-up'ens ordlyd eller v1's tekster. Frank godkender dem før fletning.

| Sted | Dansk | Engelsk |
| --- | --- | --- |
| Øvelsens navn | Find udspillet | Find the lead |
| Spørgsmålet, niveau 1–2 | Hvilken farve spilles ud? | Which suit is led? (tilføjelse) |
| Spørgsmålet, niveau 3–5 | Hvilket kort spilles ud? | Which card is led? (tilføjelse) |
| ⓘ ved øvelsens navn | Du sidder som Vest og vælger udspillet ud fra din hånd og meldeforløbet: farven på niveau 1–2 og fra niveau 3 kortet efter profilens udspilsregel. Facit er regnet med dobbeltdummy på 100 fordelinger, der passer med meldingerne, og det bedste udspil giver flest stik i gennemsnit. (tilføjelse) | You sit West and choose the opening lead from your hand and the bidding: the suit at levels 1–2 and from level 3 the card by your profile's lead rule. The solution is computed double dummy on 100 deals that fit the bidding, and the best lead gives the most tricks on average. (tilføjelse) |
| Linjen under meldeforløbet | Syd spiller 3NT. Syd har vist 15–17 hp. Du spiller ud. ("Syd har vist …" er en tilføjelse) | South plays 3NT. South has shown 15–17 HCP. You are on lead. (tilføjelse) |
| Hånden | Vest · dig · 11 hp | West · you · 11 HCP |
| Farveknapperne og deres navn for skærmlæseren | ♠ 4 kort · "Spar, 4 kort" | ♠ 4 cards · "Spades, 4 cards" (tilføjelse) |
| Meldeforløbet på én linje (facit under 1000 px) | Syd 1NT – Nord 3NT · alle passer | South 1NT – North 3NT · all pass (tilføjelse) |
| Overskriften i facit | Forkert: ♥ giver flest stik; med flere rigtige fx Rigtigt: ♥ og ♣ giver flest stik (tilføjelse) | Wrong: ♥ gives the most tricks; Right: ♥ and ♣ give the most tricks (tilføjelse) |
| Dit svar med prisen | Dit svar: ♦ · koster 0,5 stik i snit; Dit svar: ♥K · koster under 0,1 stik i snit | Your answer: ♦ · costs 0.5 tricks on average; Your answer: ♥K · costs less than 0.1 tricks on average ("less than" er en tilføjelse) |
| Tabellens kolonner | Udspil · Stik · Sætter · Koster | Lead · Tricks · Defeats · Cost |
| Tabellens mærker | ✓ bedst · dit svar | ✓ best · your answer (tilføjelse) |
| Tabellens navn for skærmlæseren | Udspillene (tilføjelse) | The leads (tilføjelse) |
| Linjen under tabellen | Middelstik til modspillet og chancen for at sætte 3NT over 100 fordelinger, der passer med meldingerne (dobbeltdummy). | Average tricks for the defence and the chance of defeating 3NT over 100 deals that fit the bidding (double dummy). (tilføjelse) |
| Mens datasættet hentes | Opgaven hentes … (tilføjelse) | Loading the task … (tilføjelse) |
| Kan datasættet ikke hentes | Opgaven kunne ikke hentes og springes over. (Franks tekst, 25. nov.) | The task could not be loaded and is skipped. (Franks tekst, 25. nov.) |
| Sporets ⓘ, rettet (før: "Alle øvelser har svaret …") | Modspil træner at tælle og aflæse som modspiller: makkers point, regel 11 og 12, udspillets længde og markeringerne efter de metoder, du vælger i Indstillinger. I Find udspillet vælger du udspillet ud fra hånden og meldeforløbet. De andre øvelser har svaret "Kan ikke afgøres", når kortene ikke afgør det. (de to sidste sætninger er tilføjelser) | Defence trains counting and reading the cards as a defender: partner's points, the rule of 11 and 12, the length from the lead and signals by the methods you choose in Settings. In Find the lead you choose the lead from the hand and the bidding. The other exercises have the answer "Can't tell" when the cards do not settle it. (tilføjelse) |
| Sidefoden, Trænere (Franks ja 21. nov.) | Modspil | Defence |
| Vejledningen 1 | Øvelse 8, Find udspillet, viser din hånd som Vest og meldeforløbet, men ikke bordet, fordi det er udspillet. Svaret er farven på niveau 1–2 og fra niveau 3 kortet efter profilens udspilsregel; der er ingen "Kan ikke afgøres". (tilføjelse) | Exercise 8, Find the lead, shows your hand as West and the bidding, but not dummy, because it is the opening lead. The answer is the suit at levels 1–2 and from level 3 the card by your profile's lead rule; there is no "Can't tell". (tilføjelse) |
| Vejledningen 2 (facit fra dobbeltdummy) | Facit i Find udspillet er regnet med dobbeltdummy på 100 fordelinger af de tre andre hænder, der passer med meldingerne, efter metoden i Bird og Anthias' Winning Notrump Leads og Winning Suit Contract Leads. Tabellen viser pr. farve middelstik til modspillet og chancen for at sætte kontrakten, og det bedste udspil giver flest stik i gennemsnit (som i parturnering). Farver under 0,1 stik fra den bedste er lige gode og alle rigtige; fra niveau 3 er det profilens kort i de farver. Et forkert svar viser, hvad det koster i stik i snit. (tilføjelse; sætningen om lige gode er Franks, 25. nov.) | The solution in Find the lead is computed double dummy on 100 deals of the other three hands that fit the bidding, by the method of Bird and Anthias' Winning Notrump Leads and Winning Suit Contract Leads. The table shows for each suit the average tricks for the defence and the chance of defeating the contract, and the best lead gives the most tricks on average (as at pairs). Suits within 0.1 tricks of the best are equally good and all right; from level 3 it is the profile's card in those suits. A wrong answer shows what it costs in tricks on average. (tilføjelse; the sentence on equally good is Frank's, 25 Nov.) |
| Vejledningen 3 (markeringer) | Markeringer indgår ikke i Find udspillet, fordi dobbeltdummy ikke regner med dem: alle kort er synlige. Kortet i en farve følger profilens udspilsregel, så profilen Kompendiet spiller ALA ud mod sans. (tilføjelse) | Signals are not part of Find the lead, because double dummy does not account for them: all cards are visible. The card in a suit follows your profile's lead rule, so the Compendium profile leads ALA against notrump. (tilføjelse) |
| Vejledningen 4 (Kompendiet) | Forklaringen nævner Kompendiets råd efter meldeforløbet med siden. Er dobbeltdummy og Kompendiet uenige, er dobbeltdummy facit, og de opgaver kommer først fra niveau 4. (tilføjelse) | The explanation names the Compendium's advice after the bidding with the page. When double dummy and the Compendium disagree, double dummy is the solution, and those tasks only appear from level 4. (tilføjelse) |
| Vejledningen 5 (csv-tallene som baggrund, med kilden) | Som baggrund: i simuleringerne bag MODEL.md (afsnit 7), med dobbeltdummy på tilfældige fordelinger uden meldeforløb, er forskellen mellem det bedste og det dårligste udspil i tætte kontrakter i gennemsnit 1,33 stik mod 3NT og 0,98 stik mod 4 i major, og trumfudspil er det svageste mod 4 i major. Tallene er ikke facit i øvelsen, fordi fordelingerne ikke er udvalgt efter meldingerne. (tilføjelse; tallene er MODEL.md's) | As background: in the simulations behind MODEL.md (section 7), double dummy on random deals without bidding, the difference between the best and the worst lead in close contracts is 1.33 tricks on average against 3NT and 0.98 tricks against 4 of a major, and a trump lead is the weakest against 4 of a major. The figures are not the solution in the exercise, because the deals are not selected by the bidding. (tilføjelse) |
| Vejledningen 6 (dobbeltdummy og bordet) | Dobbeltdummy kender alle fire hænder. Et udspil, der sætter spilføreren på et gæt, kan derfor være bedre ved bordet, end tallene viser. (Franks tekst, 25. nov.) | Double dummy sees all four hands, so a lead that leaves declarer a guess can be better at the table than the figures show. (Franks tekst, 25. nov.) |
| Vejledningen, linjen "Øvelserne: …" (Modspil) | Øvelserne: Makkers point, Regel 11 og 12, Udspillets længde, Aflæs markeringen, Vælg kortet, Første afkast, Forsinket kald og Find udspillet. Øvelser, som metoderne ikke har, springes over. (otte øvelser; Franks svar efter 3b) | The exercises: Partner’s points, Rule of 11 and 12, Length from the lead, Read the signal, Choose the card, First discard, Delayed signal and Find the lead. Exercises the methods do not have are skipped. |

**Tokenforbrug pr. session** (nye input, skrevet til cachen, læst fra cachen og output):

- Session 2a: – / – / – / – (udfyldes fra Franks `/usage`; Claude Code kan ikke selv aflæse tallene)
- Session 2b: – / – / – / – (udfyldes fra Franks `/usage`)
- Session 2c: – / – / – / – (udfyldes fra Franks `/usage`)
- Session 3a: – / – / – / – (udfyldes fra Franks `/usage`)
- Session 3b: – / – / – / – (udfyldes fra Franks `/usage`; Claude Code kan ikke selv aflæse tallene)
