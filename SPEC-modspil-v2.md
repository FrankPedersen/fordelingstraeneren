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
| 3a | tag, gren, accepttest for skærmene (røde) | Opus, high effort |
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

Trin 3 må desuden ændre `src/ui/Footer.tsx` og `src/sidefod.test.tsx` (sidefoden med Modspil), `src/app/GuideScreen.tsx` (kun nye linjer), `src/sprog/bydeform.ts` ("Find udspillet" på undtagelseslisten), `scripts/ordliste.txt`, `scripts/tjek-bred-layout.mjs` og `scripts/modspil.html`.

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

- **Udvalget:** en opgave er en hånd fra datasættet, valgt med opgavens seed, niveauet og profilen. Modellen ligger i nye filer i `src/modspil/model/` (fx `findUdspil.ts`), og v1's generator (`generator.ts`) ændres ikke.
- **Farvens værdi:** for hver farve, Vest har kort i, er farvens værdi middelstikkene for det kort, profilens udspilsregel giver (`udspil.ts`). Giver reglen "table feeling", tæller det bedste af de to kort, og begge er rigtige.
- **Lige gode:** farver eller kort under 0,1 stik fra det bedste er lige gode, og alle er rigtige (Franks svar 4).
- **Klar:** en opgave er klar, når den bedste farve fører med mindst 0,2 stik over den næstbedste (Franks valg 25. nov. 2026; før 0,3, som gav for få klare opgaver i 1b's rapporttal). 0,2 stik er over 3 gange den mediane standardfejl (0,06), så forspringet er reelt.
- **Afviger fra Kompendiet:** en opgave afviger, når den er klar, og den bedste farve ikke er blandt dem, `kompendieraad` peger på.

## Niveauerne for øvelse 8

Følger sporets niveau (v1, "Niveauer"):

| Sporets niveau | Svaret | Opgaverne |
| --- | --- | --- |
| 1 | farven | klare; S1, S4 og S7 |
| 2 | farven | klare; alle otte situationer |
| 3 | kortet | klare |
| 4–5 | kortet | også de tætte (forspring under 0,2) og dem, der afviger fra Kompendiet (Franks svar 9, bekræftet 24. nov.) |

Svarer brugeren med et kort i den rigtige farve, men ikke profilens kort, er svaret forkert, og facit siger, at farven var rigtig, og hvilket kort profilen spiller ud.

## Facit og forklaringen

- **Facit:** de rigtige farver (niveau 1–2) eller kort (3–5), og en tabel med middelstik (én decimal) og chancen for at sætte kontrakten (hele procent) pr. farve.
- **Forklaringen** står på dansk og engelsk i beskrivende form og husets ord og nævner situationen, tallene og Kompendiets råd med siden, fx: "Efter 1NT – 2♣ – 2♦ – 3NT har spilfører ofte minorfarverne. ♥ giver i gennemsnit 4,1 stik til modspillet og sætter 3NT i 38 % af fordelingerne; ♣ giver 3,4 stik og 22 %. Kompendiet (s. 14) anbefaler udspil i major efter dette forløb."
- **Afviger opgaven fra Kompendiet,** siger forklaringen det: "Kompendiet anbefaler ♥ efter dette forløb, men med denne hånd giver ♠ flest stik."
- **"Ved bordet":** én tekst pr. situation (en omskrivning af Kompendiets råd). Står i "Tekster til gennemgang", som Frank godkender før fletning; agentens egne begrundelser markeres "(tilføjelse)".
- **Profilen:** skifter profilen kortet, nævner forklaringen metoden, som v1: "Med profilen Kompendiet spilles ♠D fra ♠D B 10 4 mod sans (ALA)."

## Accepttest for trin 2 (skrives først, røde)

1. **Farvens værdi og kortet:** faste eksempler for hver profil, også "table feeling" og en farve, hvor Standard og Kompendiet spiller forskellige kort (fx K D 5 3 mod sans: Standard K, Kompendiet D efter ALA).
2. **Lige gode og klare:** faste eksempler på 0,09, 0,1, 0,19 og 0,2 stik.
3. **Facit mod de rå data:** for alle 1200 opgaver og alle tre profiler regner en uafhængig test (der kun importerer typer) facit direkte fra `tools/udspil/raa/` og sammenligner.
4. **Niveauerne:** niveau 1–2 giver kun klare opgaver og svar i farver, niveau 1 kun S1, S4 og S7, og niveau 3 og op svar i kort.
5. **Afviger fra Kompendiet:** findes kun på niveau 4–5, og forklaringen nævner både rådet og den bedste farve.
6. **Genskabelse:** samme seed, niveau og profil giver samme opgave og facit.
7. **Sproget:** alle forklaringer for alle opgaver og profiler består fagords- og bydeformstestene, og engelsk har ingen danske ord.
8. **Intet andet er ændret:** v1's tests består uændret, og kun nye filer i `src/modspil/`, `CLAUDE.md` og specen er ændret siden `v46-foer-udspil-model`.

## Arbejdsgang (trin 2)

Som trin 1: tag og gren (2a), accepttest (røde), byggeri og "Tekster til gennemgang" (2b), stop før fletning, Franks "godkendt", flet og push (2c). Intet live-tjek.

---

# Trin 3: øvelse 8 på skærmen

**Mock-up'en "Modspil v2 – mockup"** laves af rådgiveren efter trin 2 og godkendes af Frank, før 3a starter (Franks svar 10). Kopien lægges i `docs/specs/design/modspil-v2/`. Den bygger på v1's skærm "Vælg kortet" (`docs/specs/design/modspil/3-vaelg-kortet-390.html`).

## Skærmen

- **Opgaven:** meldeforløbet som skema (som v1) med kontrakten fremhævet, Vests hånd og spørgsmålet "Hvilken farve spilles ud?" (niveau 1–2) eller "Hvilket kort spilles ud?" (3–5). Bordet vises ikke, fordi det er udspillet.
- **Svarknapperne:** på niveau 1–2 fire farveknapper (en farve, Vest ikke har, er deaktiveret); fra niveau 3 hånden som kortknapper (mindst 44 px, aria-label som "Spar dame"). Der er ingen "Kan ikke afgøres" i øvelse 8.
- **Facit:** mærket, tabellen med middelstik og chancen for at sætte pr. farve (rigtige farver markeret), forklaringen, "Ved bordet", et link til ordbogen, når opslaget findes, og "Næste opgave".
- **Sessionen:** øvelse 8 indgår i dagens session med sin egen Leitner-post og samme regler som v1's øvelser. Datasættet indlæses dovent første gang, øvelse 8 bruges.
- **Fra 1000 px:** meldeforløbet og hånden til venstre, spørgsmålet og facit til højre. Kun CSS skifter.
- **Rødt kun på ♥ og ♦,** som v1.

## Sidefoden (Franks svar 11)

Modspil kommer med under "Trænere" efter Håndevaluering: `#modspil` i appen, "Modspil" / "Defence" (Franks ja 21. nov.). `src/sidefod.test.tsx` rettes fra fem til seks trænere, og `scripts/tjek-sidefod.mjs` køres.

## Accepttest for trin 3 (skrives først, røde)

1. En session med øvelse 8 kører fra start til status, og facit på skærmen er modellens facit for opgavens seed.
2. Niveau 1–2 viser fire farveknapper og niveau 3 kortknapper; en farve uden kort er deaktiveret.
3. Facit viser tabellen, forklaringen, "Ved bordet" og "Næste opgave".
4. Skærmene svarer til mock-up'en ved 390, 1000 og 1280 px, og `scripts/tjek-bred-layout.mjs` med Modspil fejler, hvis spalten dækker noget.
5. Rødt kun på ♥ og ♦; tilgængelighed og tastatur som v1's punkt 6.
6. Sprog: dansk og engelsk, husets ord og beskrivende form; "Find udspillet" står på undtagelseslisten.
7. Sidefoden har seks trænere med Modspil efter Håndevaluering, og `tjek-sidefod.mjs` er grøn ved 1280, 390 og 320 px.
8. Lagring: `modspil:v1` med det nye felt overlever genindlæsning, eksport og import, og data uden feltet læses som før.
9. Alle eksisterende tests består uændret, bortset fra `src/sidefod.test.tsx`; pixelsammenligningerne er mod `v47-foer-udspil-skaerme`.

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

**Tekster til gennemgang (session 2b og 3b):** –

**Tokenforbrug pr. session** (nye input, skrevet til cachen, læst fra cachen og output): –
