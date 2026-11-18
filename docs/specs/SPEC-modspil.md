# SPEC – Modspil v1

15. november 2026 · Fordelingstræneren · opgave C i `PLAN-aabne-opgaver.md`. Godkendt af Frank og udgivet 18. november 2026 (`d461826`); grenen er slettet.

Modspil er et nyt, selvstændigt spor efter samme mønster som Pointregnskab. Det er en **generel træner, uafhængig af makker**. Brugeren lærer at tælle og aflæse som modspiller:
- makkers point;
- regel 11 og 12;
- længden ud fra udspillet;
- markeringerne.

Det sker efter **de metoder, brugeren selv vælger** i Indstillinger. Tre færdige profiler er med, og hver metode kan ændres enkeltvis:
- **Standard;**
- **Omvendt;**
- **Kompendiet** (*Kompendium over modspilsaftaler*, som Frank spiller efter).

Sporet bygges i to leverancetrin, hver på sin egen gren og med sin egen godkendelse:

| Trin | Indhold | Gren | Tag før |
| --- | --- | --- | --- |
| **1** | metoder og profiler, model, løser, generator og facit, uden brugerflade | `modspil-model` | `v42-foer-modspil-model` |
| **2** | sporet i appen: skærme, session, vejledning og sprog | `modspil-skaerme` | `v43-foer-modspil-skaerme` |

**Mock-up'en er godkendt af Frank 15. november 2026** (designlærredet "Modspil – mockup"; kopier i `docs/specs/design/modspil/`). Trin 2 står sidst i denne spec og startes først, når trin 1 er flettet.

**Arbejdsgang for tokens:** én session pr. fase (accepttest, byggeri, efter godkendelse), med specen som kontekst. Forbruget skrives under Afklaret i fire tal: nye input, skrevet til cachen, læst fra cachen og output.

## Afgrænsning (gælder begge trin)

| Sted | Må ske | Må ikke ske |
| --- | --- | --- |
| `src/modspil/` | al ny kode, indhold og tests | – |
| Motor (`src/engine/`) | bruges som bibliotek: PRNG, Leitner, streak, XP, session | ændres |
| Pointregnskab (`src/pointregnskab/`) | `points.ts` og løserens idé må genbruges som bibliotek | ændres |
| Systemfilen og meldegiveren | læses og kaldes for spilførerens hp-interval | ændres |
| `src/app/tracks.ts` | **først i trin 2:** en ny gruppe "Modspil" / "Defence" og ét menupunkt | ændre eksisterende grupper eller punkter |
| Lagring | ny nøgle `modspil:v1` (trin 2) | læse eller skrive andre nøgler |
| Designtokens | ingen nye i trin 1 | – |

Kræver noget alligevel en ændring i eksisterende kode, skal Claude Code stoppe og spørge. Alle eksisterende tests skal bestå uændret før og efter.

## Pladserne

Nord er bordet, og Syd er spilfører. Brugeren sidder som **Vest (udspiller)** eller **Øst (tilspiller)**, afhængigt af øvelsen. Brugeren ser altid:
- sin egen hånd;
- bordet;
- meldeforløbet;
- de kort, der er spillet.

## Metoderne og profilerne (`src/modspil/content/metoder.json`)

Alle metoder står i én fil. Hver metode har id, tekst på dansk og engelsk og en kilde, hvor der er én (fx side i Kompendiet). Koden læser reglerne derfra. Ingen regel må stå i hånden i flere filer. Metoderne er ordnet i syv kategorier, og en **profil** vælger én metode pr. kategori.

| Kategori | Metoder | Standard | Omvendt | Kompendiet |
| --- | --- | --- | --- | --- |
| Udspil mod sans, lavt kort | 4.-højeste · 3. og 5. højeste · Kompendiets (4.-højeste fra honnør, tredje laveste fra småkort, næsthøjeste fra en tier) | 4.-højeste | 4.-højeste | Kompendiets |
| Udspil mod farve, lavt kort | 4.-højeste · 3. og 5. højeste | 4.-højeste | 3. og 5. | 3. og 5. |
| Honnørudspil | top af sekvens (E fra E K) · ALA mod sans | top af sekvens | top af sekvens | ALA mod sans; top af sekvens mod farve |
| Kald eller afvisning på makkers udspil | højt = kald · lavt = kald · romersk kald (ulige = kald, lige = skift lav eller høj) | højt = kald | lavt = kald | lavt = kald mod sans; romersk kald mod farve |
| Længdemarkering | højt-lavt = lige · lavt-højt = lige | højt-lavt = lige | lavt-højt = lige | lavt-højt = lige |
| Første afkast | som kald eller afvisning · O/E · Lavinthal | som kald eller afvisning | som kald eller afvisning | O/E |
| Forsinket kald i spilførers første farve | intet · omvendt forsinket kald | intet | intet | omvendt forsinket kald |

- **Standardprofilen er valgt for nye brugere.** Profilen og eventuelle ændringer gemmes i `modspil:v1`. En ændret profil vises som "Egen".
- **Øvelserne følger metoden.** Med 4.-højeste træner øvelse 2 regel 11, med 3. og 5. højeste regel 12 (12 − kortet, når det er 3.-højeste; ellers "kan ikke afgøres" eller aflæsning). Øvelser, der ikke findes i den valgte metode (fx forsinket kald med "intet"), springes over.
- **Facit og forklaring** nævner altid metoden, fx: "Med lavt = kald betyder makkers ♥2 kald."

Nedenfor står Kompendiets metoder i detaljer, fordi de er de mest omfattende. Standard og Omvendt følger de almindelige definitioner.

**Udspil mod sans**
- **Fra en farve med honnør og mindst fire kort:** 4.-højeste. K 10 7 4 2 → 4. (Frank, 15. nov.: Kompendiets linje "fra honnører" mangler sin start.)
- **Fra en honnørsekvens:** ALA-tabellen (besluttet 15. nov., se `PLAN-aabne-opgaver.md`). Ved tre kort i sekvens spilles højeste. Ved to honnørkort i sekvens afgør "table feeling" det, så generatoren undgår de tilfælde.
- **Fra doubleton:** højeste.
- **Fra småkort (højst en 9'er):** tredje laveste. Fra tre små er det højeste, og fra fire små det næsthøjeste.
- **Fra en tier:** næsthøjeste.
- **ALA-honnørernes betydning:** es og dame beder om kald eller afvisning. Kongen beder om markering af længde.

**Udspil mod farve**
- 1.-3.-5. højeste. ALA bruges ikke.
- Fra en honnørsekvens spilles toppen.

**Markering af kald eller afvisning og af længde mod sans** (besluttet 15. nov.)
- Lavt = kald.
- Lavt = lige (antal kort).

**Romersk kald** gælder ved tilspil mod farve, når hverken udspillets kort eller bordets kort stikkes:
- **Ulige kort** kalder til udspilsfarven. Tilspiller lægger det mindste ulige kort.
- **Lille lige kort** foreslår skift til den laveste af de to andre farver.
- **Højt lige kort** foreslår skift til den højeste af de to andre farver. Trumf tæller ikke med.
- **Aflæsningen:** En lav lige er en af de to laveste lige kort, som udspiller ikke kan se. En høj lige er den 3. eller 4. laveste. En høj ulige (9 og op) kan være ønske om skift, når tilspiller ikke har et lige kort.

**O/E** gælder første gang, en modspiller ikke kan bekende:
- Et ulige kort kalder til farven.
- En lille lige viser styrke i den lavest gældende farve (klør er lavest).
- En stor lige kalder til den højest gældende farve.
- **Aflæsningen** følger samme relative regel som romersk kald (Franks svar 17. nov.): en lille lige er et af de to laveste lige kort i afkastfarven, som den, der læser afkastet, ikke kan se. En stor lige er det 3. eller 4. laveste. Der er ingen fast grænse mellem 6 og 7.

**Omvendt forsinket kald** gælder for både udspiller og tilspiller i den første farve, spilfører spiller:
- Lav-høj betyder "fortsæt i farven, intet vigtigere at fortælle" (passivt).
- Høj-lav betyder "skift farve, spil aktivt".

**Senere skift til en ny farve:**
- Lavt kort = invitation.
- Højt kort = afvisning.

## Øvelserne

Alle øvelser har svaret **"kan ikke afgøres"**, når løseren ikke kan afgøre det. At vide, hvornår man ikke ved det, er en del af færdigheden.

| # | Øvelse (da / en) | Plads | Spørgsmål | Facit |
| --- | --- | --- | --- | --- |
| 1 | **Makkers point** / Partner's points | Øst | "Hvor mange hp kan makker have?" Brugeren svarer med et interval. | 40 − egne − bordets − spilførers interval fra meldingerne (som Pointregnskab) |
| 2 | **Regel 11 og 12** / Rule of 11 and 12 | Øst | Makkers udspil efter den valgte metode: "Hvor mange kort over udspillet har spilfører?" På højere niveau også "Hvilke?" | 11 (4.-højeste) eller 12 (3.-højeste) − udspillets værdi − højere kort på bordet − højere kort hos Øst |
| 3 | **Udspillets længde** / Length from the lead | Øst | "Hvor mange kort har makker i farven?" Mod farve er svaret fx 3 eller 5, mod sans fx 4 eller 5. | Løseren gennemgår de skjulte kort, der passer med udspilsreglen og de synlige kort |
| 4 | **Aflæs markeringen** / Read the signal | Vest | Makkers tilspil til udspillet: mod sans kald eller afvisning eller længde, mod farve romersk kald. Brugeren svarer med kald, skift lav, skift høj eller tvetydig, eller med spilførers længde. | Aftalerne plus løseren |
| 5 | **Vælg kortet** / Choose the card | Øst | Opgaven siger, hvad Øst vil vise, fx "du vil have skift til ♦". Brugeren vælger et kort fra hånden. | Aftalerne. Har hånden ikke et passende kort, er facit den nødløsning, Kompendiet beskriver |
| 6 | **Første afkast** / First discard | Vest eller Øst | O/E: Brugeren vælger afkastet eller aflæser makkers afkast. | Aftalerne |
| 7 | **Forsinket kald** / Delayed signal | Vest eller Øst | Rækkefølgen i spilførers første farve: brugeren vælger passivt eller aktivt, eller vælger rækkefølgen selv. | Aftalerne |

**Niveauer**

| Niveau | Indhold |
| --- | --- |
| 1 | øvelse 1–3 med fuld information; kun klare tilfælde |
| 2 | øvelse 4–5 med klare kort |
| 3 | øvelse 6–7, og "kan ikke afgøres" i øvelse 1–5 |
| 4 | blandede øvelser, hvor meldingerne indskrænker svaret |
| 5 | tvetydige markeringer (ingen ulige kort, kun lige kort, singleton på bordet), hvor svaret skal vejes med meldingerne |

Sværheden tilpasses som i Pointregnskab ud fra de seneste 20 svar.

**Regel 11 og småkort:** Regel 11 gælder kun, når makker har spillet 4.-højeste fra en farve med honnør. Fra fire små spilles det næsthøjeste, og så giver regnestykket et forkert tal. Niveauerne følger det:
- På niveau 1–3 er udspillet i øvelse 2 altid fra en farve med honnør.
- Fra niveau 4 kan det også være fra småkort. Så skal brugeren bruge de synlige kort til at se, at regnestykket ikke går op ("kan ikke være 4.-højeste"), eller svare "kan ikke afgøres".

## Løser, generator og facit (trin 1)

1. **Fordeling:** motorens kortgiver med seedbar PRNG. Hver opgave kan genskabes fra sit seed.
2. **Meldinger:** spilførers hp-interval kommer fra systemfilen via meldegiveren, som i Pointregnskab. I trin 1 er kontrakten 3NT eller 4♥/4♠, og meldeforløbet er kort og naturligt.
3. **Udspillet:** udspilsreglen vælger Vests kort ud fra aftalerne. Generatoren bruger kun udspil, som reglen giver entydigt (ikke "table feeling").
4. **Løseren:** Løseren gennemgår de skjulte kort (spilførers og den skjulte modspillers) i den aktuelle farve og beholder kun de fordelinger, der passer med:
   - udspilsreglen;
   - de spillede kort;
   - markeringsreglerne;
   - hp-intervallerne, hvor øvelsen bruger dem.

   Ud fra de fordelinger, der er tilbage, giver den facit: et tal, et interval, et kort eller "kan ikke afgøres".
5. **Forklaring:** Hvert facit har en kort forklaring på dansk og engelsk i beskrivende form og husets ord. Eksempel: "Makker spillede 4.-højeste ud. 11 − 7 = 4 kort over syveren hos de andre tre hænder; bordet har to og du ét, så spilfører har ét."
6. **Andel:** Ca. hver femte opgave fra niveau 3 har facit "kan ikke afgøres" eller "tvetydig".
7. **Uafhængig kontrol:** En separat test genberegner facit for 10.000 seeds med en simpel brute force, der ikke deler kode med løseren. Den tæller hele fordelinger af de to skjulte hænder i den aktuelle farve. Facit skal være ens i alle tilfælde. Det er erstatningen for Fable: facit kontrolleres maskinelt.

## Accepttest for trin 1 (skrives først, røde)

1. **Metodefilen:**
   - Hver metode har id og dansk og engelsk tekst, og kilde, hvor der er én.
   - De tre profiler vælger én gyldig metode pr. kategori.
   - Der er ingen regel i koden, som ikke findes i filen.
   - Teksterne består `sprog`-tjekket for husets ord og beskrivende form.
2. **Udspilsreglen**, faste eksempler:
   - **Standard:** K 10 7 4 2 → 4 mod sans og farve; 8 6 4 2 → 2; D B 10 → D.
   - **Profilen Kompendiet:**
     - Mod sans: K 10 7 4 2 → 4; 8 6 2 → 8; 8 6 4 2 → 6; 9 5 → 9; 10 8 6 → 8; D B 10 → D.
     - Mod farve: K 9 6 4 2 → 2 (5.-højeste, rådgiverens forslag under Afklaret, godkendt af Frank 17. nov.); 8 6 2 → 2 (3.-højeste); E K x → E.
3. **Regel 11 og 12:** mindst fem faste eksempler for hver, heraf ét hvor bordet og Øst holder alle højere kort, så svaret er 0.
4. **Romersk kald**, Kompendiets egne eksempler:
   - Udspil ♠E fra ♠E K 9 3 2, bordet ♠B 4: ♠6 aflæses som kald til laveste farve.
   - Udspil ♠E fra ♠E K 7 3 2, bordet ♠5 4: ♠9 aflæses som kald til at fortsætte, og ♠B som ønske om skift.
5. **O/E og omvendt forsinket kald:** mindst tre faste eksempler hver.
6. **Makkers point:** facit stemmer med Pointregnskabets løser på de samme hænder.
7. **Uafhængig kontrol:** 10.000 seeds pr. øvelse **og pr. profil**, facit ens med brute force.
7a. **Metoden skifter facit:** samme seed med Standard og Omvendt giver modsat facit for et kald eller en afvisning. Med 4.-højeste og 3. og 5. højeste giver samme udspil forskellig længde.
8. **Genskabelse:** samme seed giver samme opgave og facit.
9. **Andelen af "kan ikke afgøres"** fra niveau 3 ligger mellem 15 og 25 % over 2.000 opgaver.
10. **Intet andet er ændret:** alle eksisterende tests består, og ingen fil uden for `src/modspil/` er ændret, bortset fra specen og ét afsnit om Modspil-modellen i `CLAUDE.md` (Franks svar 4, 17. nov.).

## Afklaret

**Status (skrives løbende, så intet går tabt ved en lukning):**

- **Fase 1, accepttest (færdig 15. nov. 2026, 18:23 UTC):** `main` er tagget `v42-foer-modspil-model` (`6c8cdf8`), og grenen `modspil-model` har accepttestene og specen i `bf8a473`. Testene er røde: 11 af 12 testfiler fejler med "Cannot find module", fordi modellen ikke findes, og kun testen af punkt 10 består. Når modellen findes, er der 104 tests. `tsc` fejler kun på de manglende moduler. Agenten tjekkede testene selv med midlertidige stubbe, der kaldte brute force: tsc blev grøn, og alle 57 faste eksempler bestod. Stubbene er slettet og ikke committet.
- **Testfilerne** i `src/modspil/`: `metoder.test.ts` (punkt 1), `udspil.test.ts` (2), `loeser.test.ts` (3), `markering.test.ts` (4–5), `point.test.ts` (6, mod Pointregnskabs `solve`), `kontrol.ts` og `kontrol-{standard,omvendt,kompendiet}.test.ts` (7, 10.000 seeds pr. øvelse og profil), `kontrol-egen.test.ts` (7, to egne profiler, så alle metoder i filen kontrolleres), `metode-skifter.test.ts` (7a), `opgaver.test.ts` (opgavens form, niveauer, forklaring, genskabelse og andelen i punkt 9), `intet-andet.test.ts` (10) og `bruteforce.ts` (den uafhængige brute force, der kun importerer typer). Grænsefladen til byggeriet står øverst i hver testfil.
- **Rettet efter gennemgangen (før fase 2):** testen af punkt 10 tillod `CLAUDE.md` uden for `src/modspil/`. Specen tillader det ikke, så nu er kun specen selv tilladt, til Frank har svaret (spørgsmålet nedenfor). Frank svarede ja 17. nov. (svar 4), så `CLAUDE.md` er tilladt igen fra fase 3.
- **Køretid:** de tunge kontroltests har en tidsgrænse på 300 s og ventes at tage 20–60 s samlet; det forlænger `npm test` ud over husets norm på 30 s for en tung test.
- **Valg, specen ikke afgør, som testene bygger på:**
  1. "Ingen regel i koden uden for filen": `REGLER` har præcis filens metoder, og metode-id'er står kun som tekst i `model/metoder.ts`.
  2. Én metode pr. kategori: romersk kald har lavt = kald mod sans, og ALA har top af sekvens mod farve, begge i filen.
  3. Udspillet: en sekvens er to honnørkort i træk fra B, tre kort i træk fra 10 eller en brudt sekvens; "table feeling" er, når både honnøren og det lave kort er mulige; ALA-tabellen er udvidet til længere farver (fx K D x x x x → D). De tre forslag nedenfor er brugt.
  4. Øvelse 2 og 3: kun et lavt udspil; Vest har mindst 4 kort (4.-højeste) eller 3 (de andre metoder), så singleton og doubleton er ikke med, og regel 11 er altid entydig med 4.-højeste. hp-intervallerne bruges fra niveau 4, og "Hvilke?" stilles fra niveau 4. Flere end to mulige længder giver "kan ikke afgøres".
  5. Øvelse 1: Øst og Vest passer, Syd åbner efter systemfilen, og kontrakten er i Syds farve; pas i åbningsposition viser 0–11 hp.
  6. Øvelse 4: et kort er lavt, når det er et af de to laveste, Vest ikke kan se. Romersk kald følger Kompendiets aflæsning, og en høj ulige kan være "skift" uden retning. Et lige kort er tvetydigt ved singleton på bordet, eller når intet ulige kort er blandt dem, Vest ikke kan se. Efter ALA-kongen mod sans er facit spilførers mulige længder. Generatoren må ikke se på kaldmetoden, når den vælger fordeling og kort (ellers kan 7a ikke bestå).
  7. Øvelse 5: højt kort er det højeste under B; nødløsningen er en høj ulige fra 9 og op; kald uden ulige kort og vælg kortet efter ALA-kongen bruges ikke.
  8. Øvelse 6: lavt er 6 eller lavere, højt 7 eller højere; mod farve er spilførers farve trumf. (Grænsen mellem 6 og 7 er erstattet af den relative regel i Franks svar 2, 17. nov.; se nedenfor.)
  9. Øvelse 7: vælges rækkefølgen, er facit det første kort (laveste for passiv, højeste under B for aktiv).
  10. Punkt 9: 2.000 opgaver pr. profil på niveau 3–5 skiftevis, og "tvetydig" tæller med; generatoren skal styre blandingen af øvelser, fordi kun øvelse 3 kan give "kan ikke afgøres" med Standard.
  11. Punkt 10: findes `v43-foer-modspil-skaerme`, sammenlignes kun de to tags; mangler tagget (GitHub Actions henter ingen tags), springes testen over med en besked.
  12. "Senere skift til en ny farve" (lavt kort = invitation) har ingen kategori og bruges ikke i trin 1.
- **Spørgsmål til Frank** (ud over de tre forslag nedenfor, som testene bruger; besvaret 17. nov., se Franks svar nedenfor):
  - Er aflæsningsreglerne i punkt 6 og 8 rigtige: romersk kald tvetydigt ved singleton på bordet og en høj ulige som "skift" uden retning; kald og afvisning med "de to laveste usete = lavt"; første afkast med grænsen mellem 6 og 7?
  - Må singleton og doubleton udelades i regel 11 og udspillets længde (mindste længde 4 eller 3)?
  - Må `CLAUDE.md` ændres i trin 1 (et afsnit om sporet, som de andre spor har)?
- **Tokenforbrug, fase 1** (nye input, skrevet til cachen, læst fra cachen og output; fra logfilerne):
  - Agenten (frisk session med specen som kontekst): 49 svar (15. nov., 17:35–18:23 UTC); nye input 98, skrevet til cachen 829.640, læst fra cachen 12.934.304, output 279.074; i alt 14.043.116
  - Koordineringen (hovedsessionen: opstart, gennemgang, rettelse af testen og denne status, 15. nov. 17:33–17:45 og 18:23–18:26 UTC): 15 svar; nye input 36, skrevet til cachen 51.459, læst fra cachen 13.160.562, output 22.178; i alt 13.234.235. (Først opgjort til 12 svar og 10.525.632; de sidste 3 svar kom efter opgørelsen.)
- **Fase 2, byggeri (færdig 17. nov. 2026):** modellen står i `src/modspil/content/metoder.json` og `src/modspil/model/` (commits `348b42a`–`4364a59` på `modspil-model`). `tsc` er grøn, og `npx vitest run src/modspil` giver 12 testfiler med 102 beståede og 2 sprunget over (forsinket kald med Standard og Omvendt, som testen selv springer over), 41 s samlet. Den længste kontroltest er Kompendiets regel 11 og 12 (10.000 seeds, ca. 15 s); de andre tager højst 12 s. Andelen af "kan ikke afgøres" og "tvetydig" fra niveau 3 er 20,4 % for hver profil. Ingen test er rettet. Stavekontrollen finder kun tre ord i fase 1's `kontrol.ts` (accepttest, brute, seeds), som ikke er tilføjet `scripts/ordliste.txt`. Tokenforbruget for fase 2 skrives af koordinatoren.
- **Den fulde suite (17. nov. 2026, kørt alene af koordinatoren efter pixeltestene i Konventionstræneren):** `npm test` (tsc og Vitest) gav 131 testfiler, 945 tests bestået og 2 sprunget over (de to ovenfor), på 261 s. Alle eksisterende tests består uændret. `git diff v42-foer-modspil-model` har kun filer i `src/modspil/` og specen.
- **Fase 2 blev stoppet to gange af grænserne** (5-timersgrænsen 15. nov. om aftenen og ugegrænsen, der blev nulstillet 17. nov. kl. 6) og blev genoptaget i samme agent. Mens pixeltestene i Konventionstræneren kørte, skrev agenten kun kode og kørte ingen tests; testene blev kørt bagefter.
- **Valg i byggeriet, som specen og testene ikke afgør:**
  1. Et kort og naturligt meldeforløb kræver, at Nord–Syd har mindst 23 hp og mod farve mindst otte trumf. Nord melder kontrakten direkte efter Syds åbning, og giveren vælges, så Syd er den første, der åbner.
  2. Udspilsfarven er en farve, der ikke er trumf, valgt tilfældigt blandt dem, der giver et gyldigt udspil.
  3. I øvelse 4 og 5 bruges kun honnørudspil fra en honnørsekvens (B eller højere), og bordets laveste kort er under udspillet. Fordelingen afhænger kun af honnørmetoden, så 7a holder.
  4. I øvelse 4 lægger Øst et tilfældigt kort under udspillet, og på niveau 2 sit laveste eller højeste kort under udspillet.
  5. I øvelse 6 og 7 er spilførers farve trumf mod farve, og mod sans en farve, hvor Nord–Syd har mindst syv kort. Syd spiller sit højeste kort, og de andre lægger deres laveste.
  6. I øvelse 6 er afkastet et tilfældigt kort under B, og makker har flere kort i farven end den, der ikke kan bekende, så det er første gang, en modspiller ikke kan bekende.
  7. I øvelse 7 vælger makker passivt (laveste og næstlaveste) eller aktivt (højeste under B og så laveste).
  8. Fra niveau 3 trækkes først, om svaret skal være uklart (20 %), og så vælges en øvelse, der kan give et uklart svar med profilen. Fordelingen af de uklare svar: Standard 409 i udspillets længde; Omvendt 201 i regel 11 og 12 og 208 i længden; Kompendiet 123 i regel 11 og 12, 156 i længden, 60 "kan ikke afgøres" og 70 "tvetydig" i markeringen (2.000 opgaver pr. profil).
- **Spørgsmål til Frank fra fase 2** (besvaret 17. nov., se Franks svar nedenfor):
  - Er kravene til et naturligt meldeforløb (valg 1) og til spilførers farve (valg 5) rigtige?
  - Stavekontrollen finder "accepttest", "brute" og "seeds" i titlerne i `src/modspil/kontrol.ts` fra fase 1. De kan skrives om i `kontrol.ts` (en ændring i en test, kun ordlyd) eller komme i `scripts/ordliste.txt` (uden for `src/modspil/`, så ikke i trin 1). Metodefilens 209 ord og 3.825 forklaringer fra generatoren har ingen ukendte danske ord.
- **Tokenforbrug, fase 2** (nye input, skrevet til cachen, læst fra cachen og output; fra logfilerne):
  - Agenten (frisk session med specen som kontekst, genoptaget to gange efter grænserne; 15. nov. 18:26 til 17. nov. 06:37 UTC): 60 svar; nye input 116, skrevet til cachen 1.235.014, læst fra cachen 14.661.206, output 195.498; i alt 16.091.834.
  - Koordineringen (hovedsessionen: opstart, genoptagelserne, den fulde suite og denne status; 15. nov. 18:26–22:03 og 17. nov. 06:37 UTC til opgørelsen): 11 svar; nye input 22, skrevet til cachen 891.575, læst fra cachen 7.371.398, output 9.299; i alt 8.272.294. Skrevet til cachen er højt, fordi cachen udløb under ventetiderne og samtalen blev skrevet igen.
  - Fælles koordinering for Modspil og pixeltolerancen i Konventionstræneren (status i `SYSTEM.md` og gentagelserne af pixeltestene, 15. nov. 17:45 til 17. nov. 06:31 UTC) står i pixeltolerancens spec og er ikke talt med her.
- **Fase 3, Franks svar (17. nov. 2026):** svarene står under "Franks svar, 17. nov. 2026" nedenfor og er bygget ind på `modspil-model` i en frisk session: `365aeb6` (svarene og specens tekst om første afkast), `f44c08c` (accepttesten, rød), `fc273fd` (modellen), `133adf2` (`CLAUDE.md` og testen af punkt 10) og `ba05b93` (titlerne i `kontrol.ts`).
  - **Rød før rettelsen:** `npx vitest run src/modspil` gav 12 fejlende tests, alle på første afkast: 7 i `markering.test.ts` (O/E, Lavinthal og "som kald eller afvisning") og afkast i de fem kontrolsuiter (facit fra modellen med grænsen 6/7 mod gennemregningen med den relative regel). 92 bestod, og 2 blev sprunget over som før (35 s).
  - **Grøn efter:** `tsc` er grøn, og `npx vitest run src/modspil` giver 12 testfiler med 104 beståede og 2 sprunget over (44 s). Den fulde `npm test` (tsc og Vitest, kørt alene) giver 131 testfiler med 947 beståede og 2 sprunget over på 248 s. Alle eksisterende tests består uændret.
  - **Sprogtjek:** stavekontrollen (`node scripts/sprogtjek.ts`) finder kun "accepttest" i `src/modspil/kontrol.ts`, som bliver stående til trin 2 (svar 6). Fagords- og bydeformstestene (`src/sprog/`, i `npm test`) er grønne, også for de nye forklaringer.
  - **Intet andet er ændret:** `git diff v42-foer-modspil-model --stat` har 25 filer: 23 i `src/modspil/`, specen og `CLAUDE.md`.
  - **Valgene** står under "Valg i fase 3" nedenfor. Den synlige følge: et afkast på 8 eller 10 kan nu være lavt og et på 4 eller 6 højt, alt efter hvilke kort læseren kan se, og i "vælg afkastet" er et kort kun rigtigt, når makker læser det ens, uanset hvor de kort, brugeren ikke kan se, sidder.
  - **Nye spørgsmål til Frank:**
    1. Vælg afkastet (valg 4): er facit rigtigt som de kort, makker læser ens, uanset hvor de kort, brugeren ikke kan se, sidder? Alternativet er at regne ud fra makkers faktiske kort, men dem kan brugeren ikke se.
    2. Lavinthal og "som kald eller afvisning" (valg 3): skal de også følge den relative regel (lavt = et af de to laveste usete kort), som de gør nu? Profilerne Standard og Omvendt bruger "som kald eller afvisning" til første afkast, så fx et ♦8 er lavt (afvisning med højt = kald), når læseren kan se alle kort fra 2 til 6.
- **Tokenforbrug, fase 3** (nye input, skrevet til cachen, læst fra cachen og output; fra logfilen):
  - Agenten (frisk session med specen som kontekst; 17. nov. 06:53 UTC til opgørelsen kl. 07:15): 62 svar; nye input 126, skrevet til cachen 259.001, læst fra cachen 13.202.735, output 95.104; i alt 13.556.966. De sidste par svar (dette commit og rapporten) er ikke talt med.
  - Koordineringen (hovedsessionen, fælles for denne fase og udgivelsen af pixeltolerancen i Konventionstræneren: rådgiverens besked, start af de to agenter efter hinanden uden at vente og kigge, og denne linje; 17. nov. 06:46–07:16 UTC): 10 svar; nye input 28, skrevet til cachen 65.501, læst fra cachen 3.367.674, output 16.490; i alt 3.449.693. Opsummeringen af den lange samtale før starten er ikke talt med. Pixeltolerance-agenten brugte 2.346.526 (står i pixeltolerancens spec).
- **Status efter fase 3:** trin 1 er bygget, Franks svar fra 17. nov. er bygget ind, og arbejdet er stoppet før merge. Ventede på Franks godkendelse og svar på de to nye spørgsmål (besvaret og godkendt; se status efter godkendelsen nedenfor).


**Til Franks bekræftelse ved gennemgangen** (gælder profilen Kompendiet; alle tre er godkendt 17. nov., Franks svar 1):
- **Udspil mod sans fra Hxx** (honnør tredje), fx K 7 2: Kompendiet siger det ikke. Forslag: laveste. Bekræft.
- **Udspil mod farve fra fem kort med honnør,** fx K 9 6 4 2: Med 1.-3.-5. højeste er både 9 (3.) og 2 (5.) mulige. Forslag: 5.-højeste (lavest), så 3.-højeste viser en trefarve. Bekræft.
- **"Næsthøjeste fra en tier":** gælder det fra 10 x x og fra 10 x x x? Forslag: ja til begge.

**Franks svar, 17. nov. 2026** (på spørgsmålene fra fase 1 og 2 og de tre forslag ovenfor; bygget ind i fase 3, "Franks svar"):
1. **Kompendiets tre forslag er godkendt:** laveste fra Hxx mod sans, 5.-højeste fra K 9 6 4 2 mod farve og næsthøjeste fra både 10 x x og 10 x x x.
2. **Aflæsningen:** romersk kald er tvetydigt ved singleton på bordet: ja. "De to laveste usete kort er lave": ja. Første afkast har **ikke** en fast grænse mellem 6 og 7. Det følger samme relative regel som romersk kald: en lille lige er et af de to laveste usete lige kort, og en stor lige er det 3. eller 4. laveste. Testene rettes, så de følger reglen (fase 1's valg 8 er erstattet).
3. **Singleton og doubleton** må udelades i v1 (fase 1's valg 4).
4. **`CLAUDE.md`** må have ét afsnit om Modspil-modellen.
5. **Kravene til meldeforløbet er godkendt** (fase 2's valg 1 og 5): mindst 23 hp hos Nord–Syd, mindst otte trumf mod farve, og mod sans har spilførers farve mindst syv kort hos Nord–Syd.
6. **Titlerne i `src/modspil/kontrol.ts`** skrives på dansk: "brute force" bliver "uafhængig gennemregning", og "10.000 seeds" bliver "10.000 tilfældige spil". "Accepttest" bliver stående; ordlisten kommer i trin 2.

**Valg i fase 3 til den relative regel for første afkast** (specen og svaret afgør dem ikke; testene i `markering.test.ts` og gennemregningen i `bruteforce.ts` bygger på dem):
1. **De usete kort** er afkastfarvens kort, som den, der læser afkastet, ikke kan se på egen hånd, på bordet og blandt de kort, der er spillet før afkastet. Afkastet selv er med, som Østs kort i romersk kald.
2. **O/E:** et ulige kort kalder til farven. Et lige kort er en lille lige, når det er et af de to laveste usete lige kort, og ellers en stor lige. Det er præcis romersk kalds regel: med færre end fire usete lige kort er de to laveste små og resten store (med ét eller to usete lige kort er et lige kort altid lille), og et lige kort, der ikke er blandt de fire laveste (10'eren, når 2, 4, 6 og 8 alle er usete), er stort. Romersk kalds "tvetydig" (singleton på bordet, intet ulige kort blandt de usete) gælder ikke afkastet: den, der kaster af, vælger selv farven og kortet.
3. **Lavinthal og "som kald eller afvisning"** har heller ingen grænse mellem 6 og 7: et afkast er lavt, når det er et af de to laveste usete kort i farven, som kald eller afvisning på makkers udspil (Franks svar 2). Romersk kald med "som kald eller afvisning" læses mod farve som O/E og mod sans med lavt = kald.
4. **Vælg afkastet:** her læser makker afkastet, og brugeren kan ikke se makkers kort. Facit er de kort under B, som makker læser som et kald til den ønskede farve, uanset hvordan de kort i farven, brugeren ikke kan se, er fordelt mellem makker og spilfører. Et lige kort (O/E) er altid lille, når brugerens egne lavere lige kort og de lavere lige kort, brugeren ikke kan se, højst er ét; det er altid stort, når brugeren selv har mindst to lavere lige kort. Lavinthal og "som kald eller afvisning" tæller alle kort på samme måde. Kort, hvor det afhænger af fordelingen, er ikke med i facit. Eksempel mod 4♥ med ♦10 8 6 3 på hånden og ♦K 9 5 4 på bordet: ♦6 er altid lille (kun ♦2 kan ligge under den hos spilfører), ♦10 er altid stor, og ♦8 er lille, når makker har ♦2, og stor, når spilfører har den, så ♦8 er ikke med. Gennemregningen tæller alle fordelinger; modellen bruger de to grænser.

**Franks svar på fase 3's spørgsmål og godkendelse, 17. nov. 2026** (Frank godkendte rådgiverens to svar):
1. **Vælg afkastet (spørgsmål 1, valg 4 i fase 3):** facit er de kort, makker læser ens i alle mulige fordelinger. Er intet kort entydigt, er facit det kort, der læses rigtigt i flest fordelinger, og opgaven er tvetydig. Tilfældet skal have en test.
2. **Lavinthal og "som kald eller afvisning" (spørgsmål 2, valg 3 i fase 3):** den relative regel er godkendt. Et afkast er lavt, når det er et af de to laveste usete kort i farven, også når profilen Standard eller Omvendt bruger "som kald eller afvisning" til første afkast.
3. **Godkendelse:** "Modspil trin 1 er godkendt med rådgiverens to svar […]. Flet og push, når alt er grønt." Der er intet live-tjek, fordi intet er synligt i appen. Specen bliver i roden til trin 2, grenen `modspil-model` slettes efter fletningen, og `SYSTEM.md` opdateres.

**Valg efter godkendelsen til svar 1** (specen og svaret afgør dem ikke; gennemregningen i `bruteforce.ts` og testene i `markering.test.ts`, `kontrol.ts` og `opgaver.test.ts` bygger på dem):
1. **"Flest fordelinger"** måles som andelen af afkastfarvens fordelinger, hvor makker læser kortet som et kald til den ønskede farve. Hver fordeling af de skjulte kort mellem makker og spilfører tæller én gang, som i valg 4 i fase 3. Andelen gør kort fra farver med forskelligt antal skjulte kort sammenlignelige.
2. **Kort, der står lige,** er alle facit, og hvert af dem er et rigtigt svar. Det sker kun ved O/E (også romersk kald med "som kald eller afvisning" mod farve) og Lavinthal, hvor kort fra to farver kan bede om samme farve. Ved kald eller afvisning har det højeste kort (højt = kald) eller det laveste (lavt = kald) i farven altid den største andel.
3. **"Tvetydig" i Vælg afkastet tæller med i andelen af uklare svar (punkt 9).** Generatoren styrer den som de andre uklare svar: fra niveau 3 trækkes først, om opgaven skal være uklar (20 %), og en uklar opgave i første afkast er Vælg afkastet uden et entydigt kort. Aflæsningen af makkers afkast er altid klar, og en klar opgave i Vælg afkastet har altid et entydigt kort som før. En tvetydig opgave bruges kun, når mindst ét kort kan læses rigtigt. Andelen er stadig 20,4 % for hver profil, men fordelingen af de uklare svar ændrer sig (2.000 opgaver pr. profil på niveau 3–5 skiftevis): Standard har 201 i udspillets længde og 208 i Vælg afkastet; Omvendt 123 i regel 11 og 12, 156 i længden og 130 i Vælg afkastet; Kompendiet 97 i regel 11 og 12, 119 i længden, 34 "kan ikke afgøres" og 70 "tvetydig" i markeringen og 89 i Vælg afkastet. Før var det Standard 409 i længden, Omvendt 201 og 208 og Kompendiet 123, 156, 60 og 70 (valg 8 i byggeriet). I øvelsen første afkast alene (3.000 opgaver på niveau 3–5) er 616 tvetydige for hver profil, og med Kompendiet har 93 af dem flere kort i facit.
4. **Facit** er stadig af typen kort, nu med `tvetydig: true`: brugeren vælger et kort, og kortene i facit er de rigtige svar. Tvetydig er en egenskab ved opgaven.
5. **Forklaringen** siger, at intet kort beder om farven, uanset hvor de kort, brugeren ikke kan se, sidder, og at opgaven derfor er tvetydig. Den nævner det bedste kort og andelen i hele procent (holdt mellem 1 og 99), fx "Bedst er ♠7, som beder om ♠ i 75 % af de mulige fordelinger."
6. **Eksemplerne i den faste test** (fundet og regnet med gennemregningen, mod 4♥):
   - Standard, ønsket ♠, med ♠D 7 4 på hånden og ♠E 6 2 på bordet: ♠4 er altid lav (afvisning). ♠7 er høj (kald), medmindre makker har både ♠3 og ♠5, altså i 3 af 4 fordelinger. Facit er ♠7, og opgaven er tvetydig.
   - Kompendiet (O/E), ønsket ♣, med ♠K 9 6 3, ♦E 8 5 og ♣E D 4 på hånden og ♠E 10 7, ♦D 9 2 og ♣K 8 6 på bordet: ♠6 og ♦8 er små lige i 3 af 4 fordelinger, så begge er facit. Med ♦3 i stedet for ♦2 på bordet er ♦8 kun lille i halvdelen af fordelingerne, og facit er ♠6 alene.

**Status efter godkendelsen (17. nov. 2026):** Franks svar 1 er bygget ind på `modspil-model` i en frisk session: `f9c94c5` (svarene og godkendelsen under Afklaret), `ed7932f` (accepttesten og gennemregningen, rød), `d915ebe` (modellen, generatoren og forklaringen) og commit'et med denne status, valgene ovenfor og `CLAUDE.md`. Svar 2 krævede ingen ændring, fordi modellen allerede følger den relative regel.
- **Rød før rettelsen:** gennemregningen blev rettet først. `npx vitest run src/modspil` gav 10 fejlende tests, alle nye: de 4 faste tests i `markering.test.ts` (`vaelgAfkastFacit` fandtes ikke), afkast i de fem kontrolsuiter (ingen tvetydige opgaver; intet facit afveg fra gennemregningen) og punkt 9 i `opgaver.test.ts` (ingen tvetydige opgaver i Vælg afkastet). 98 bestod, og 2 blev sprunget over (99 s).
- **Grøn efter:** `tsc` er grøn, og `npx vitest run src/modspil` giver 12 testfiler med 108 beståede og 2 sprunget over (79 s; 72–108 s i tre kørsler, hvor også øvelser, der ikke er rørt, var langsommere end i fase 3). Den fulde `npm test` (tsc og Vitest) giver 131 testfiler med 951 beståede og 2 sprunget over på 292 s. Alle eksisterende tests består uændret.
- **Sprogtjek:** stavekontrollen (`node scripts/sprogtjek.ts`) finder kun "accepttest" i `src/modspil/kontrol.ts` som før (svar 6). Fagords- og bydeformstestene (`src/sprog/` og forklaringstesten i `opgaver.test.ts`) er grønne, også for forklaringen til det tvetydige tilfælde.
- **Intet andet er ændret:** `git diff v42-foer-modspil-model --stat` har 25 filer: 23 i `src/modspil/`, specen og `CLAUDE.md`.
- **Trin 1 er godkendt af Frank og flettes ind på `main`.** Der er intet live-tjek, fordi intet er synligt i appen. Specen bliver i roden til trin 2.
- **Flettet og pushet 17. nov. 2026:**
  - `main` var lig med `origin/main` (`6c8cdf8`). Flettecommitten er `b072e37` (`--no-ff`), og på `main` gav `npx vitest run src/modspil` det samme resultat på 57 s.
  - `main` og tagget `v42-foer-modspil-model` (`6c8cdf8`) er pushet.
  - GitHub Actions ("Udgiv på GitHub Pages", kørsel 44121691377) var grøn for `b072e37` kl. 16:11 UTC.
  - Grenen `modspil-model` er slettet lokalt; den var aldrig på GitHub.
- **Tokenforbrug, efter godkendelsen** (nye input, skrevet til cachen, læst fra cachen og output; fra logfilerne):
  - Agenten (frisk session: svar 1, testene, fletning og push; 17. nov. 15:40–16:05 UTC): 62 svar; nye input 130, skrevet til cachen 228.907, læst fra cachen 10.811.547, output 77.260; i alt 11.117.844. Agenten afleverede, før Actions var færdig. Actions-resultatet, `SYSTEM.md` og dette punkt er skrevet af hovedsessionen.
  - Koordineringen (hovedsessionen, fælles med starten af Post Mortem 1d: start af agenterne, Actions, `SYSTEM.md` og dette punkt; 17. nov. 15:39–16:12 UTC): 16 svar; nye input 44, skrevet til cachen 32.901, læst fra cachen 1.918.392, output 17.151; i alt 1.968.488.

## Arbejdsgang (trin 1)

1. Tag `v42-foer-modspil-model`, og opret grenen `modspil-model`.
2. Skriv accepttestene, som skal være røde, og commit dem.
3. Byg modellen.
4. Stop før merge. Afklaret og tokenforbruget skal være udfyldt.
5. Franks "godkendt".
6. Flet, og push. Der er intet live-tjek, fordi intet er synligt i appen. Specen bliver i roden, til trin 2 er udgivet.


---

# Trin 2: sporet i appen (startes, når trin 1 er flettet)

Gren `modspil-skaerme`, tag før `v43-foer-modspil-skaerme`.

## Layoutet

Mock-up'en i `docs/specs/design/modspil/` er facit for layoutet. Filerne er statiske HTML-skitser: de viser opbygning, rækkefølge og ordlyd, ikke kode, der skal kopieres. Farver, skrift og hjørner kommer fra appens eksisterende tokens. Der må ikke tilføjes nye tokens.

| Fil | Skærm |
| --- | --- |
| `1-opgave-390.html` | opgaven på mobil |
| `2-facit-390.html` | facit på mobil |
| `3-vaelg-kortet-390.html` | øvelsen Vælg kortet |
| `4-indstillinger-390.html` | Indstillinger med profil og metoder |
| `5-bred-1280.html` | bredt layout fra 1000 px |

**Opgaveskærmen** har disse dele, i denne rækkefølge:
1. Øverst står niveau og opgavenummer og et mærke med profilen og metoden, fx "Standard · 4.-højeste". Mærket fører til Indstillinger.
2. En statuslinje viser, hvor langt sessionen er.
3. Meldeforløbet står som et skema med fire kolonner og en linje om meldingernes intervaller.
4. Bordet står øverst, stikket på et grønt felt, og brugerens hånd står nederst.
5. Makkers udspil har en orange ring. Brugerens plads i stikket er tom med stiplet kant.
6. Hænderne står som tekstlinjer. Kun de kort, brugeren kan spille, er knapper (mindst 44 px høje).
7. Svarknapperne: "Kan ikke afgøres" er altid sin egen knap.

**Facit** har:
- et mærke (grønt for rigtigt, rødt for forkert);
- regnestykket som en lille tabel;
- forklaringen i beskrivende form;
- en boks "Ved bordet" med, hvad brugeren gør med svaret;
- et link til ordbogen, når opslaget findes, og ellers intet link;
- knappen "Næste opgave".

**Vælg kortet** har de spillelige kort som store knapper og resten af hånden gråtonet. Aftalen kan foldes ud under spørgsmålet (`<details>`).

**Indstillinger** viser de tre profiler som radioknapper og de syv metoder som rullelister. Ændres en metode, vises profilen som "Egen".

**Fra 1000 px** står bordet til venstre og spørgsmålet og facit til højre, som i Analyse. Kun CSS skifter. HTML'en og mobilen er uændrede.

## Farver for farverne (gælder hele sporet)

Kun symbolerne ♥ og ♦ er røde (`#c62828`, appens eksisterende røde). Tal og bogstaver er altid sorte, også i røde farver. Eksempler: "♥ K84" med rødt ♥ og sort K84, og "Syd spiller 4♥" med rødt ♥. En test skal tjekke, at ingen rang står i et rødt element.

## Afgrænsning (trin 2)

- **`src/app/tracks.ts`:** en ny gruppe, `defense` ("Modspil" / "Defence"), med ⓘ-tekst på begge sprog, og ét menupunkt. Gruppen står efter Spilføring.
- **`src/app/App.tsx`:** skærmen indlæses dovent, som Pointregnskab.
- **Vejledningen:** et nyt afsnit om Modspil på begge sprog. De eksisterende afsnit ændres ikke.
- **Lagring:** nøglen `modspil:v1` med profil, metoder, niveau, Leitner-bunke, streak og XP, eksport og import som Pointregnskab.
- **Ingen andre filer uden for `src/modspil/`** må ændres. Kræver noget det alligevel, så stop og spørg.

## Accepttest (trin 2, skrives først, røde)

1. Forsiden viser gruppen Modspil med ét menupunkt og ⓘ på begge sprog. De andre grupper er uændrede.
2. En session kører fra start til status med øvelser fra trin 1. Profilen skifter facit (Standard mod Omvendt på samme seed).
3. Indstillinger: profilvalget gemmes og overlever genindlæsning. En ændret metode viser "Egen".
4. Skærmene svarer til mock-up'en ved 390, 1000 og 1280 px. `scripts/tjek-bred-layout.mjs` udvides med Modspil og fejler, hvis spalten dækker noget.
5. Rødt kun på ♥ og ♦: ingen rang i et rødt element på nogen Modspil-skærm.
6. Tilgængelighed:
   - Alle knapper er `<button>`, og kortknapperne har `aria-label`, fx "Spar 8".
   - Stikket har en tekst til skærmlæser.
   - Tastatur virker hele vejen.
7. Sprog: dansk og engelsk, husets ord og beskrivende form (eksisterende sprogtjek).
8. Alle eksisterende tests består uændret, også pixelsammenligningerne mod tagget.

## Arbejdsgang (trin 2)

Som trin 1. Efter "godkendt": flet, push og live-tjek af Modspil på www.kontraktbridge.dk. Arkivér specen i `docs/specs/`, og slet grenen.

## Afklaret (trin 2)

**Trin 2, session 1: accepttest (18. nov. 2026)**

- **Status:** accepttestene er skrevet, committet og røde, og intet er bygget. Arbejdet er stoppet før byggeriet, som er session 2. Hverken grenen eller tagget er pushet, og intet er flettet.
- **Tag og commits:** `main` var lig med `origin/main` (`289d119`) og er tagget `v43-foer-modspil-skaerme`. Grenen `modspil-skaerme` har testene i `54824de` og denne status i det næste commit.
- **Testfilerne** (grænsefladen til byggeriet står øverst i hver; den samlede står i `skaerme.test.tsx`):
  - `src/modspil/ui/forside.test.tsx` (punkt 1, 7 tests): gruppen `defense` står efter Spilføring med ⓘ på begge sprog, ét menupunkt og ét kort. De andre grupper, menupunkter og kort er som i tagget; testen kører tagget `tracks.ts` med Vites `transformWithOxc`. Desuden forsiden på dansk og engelsk, ruten `#modspil` (dovent) og Tilbage, adressen direkte, vejledningens afsnit, og at `GuideScreen.tsx` kun har nye linjer siden tagget.
  - `src/modspil/ui/session.test.tsx` (punkt 2, 2 tests): en hel session fra "Start dagens session" til "Sessionen er gennemført". Hver opgave genskabes fra `data-ovelse`, `data-niveau` og `data-seed` med trin 1's generator, og facit viser trin 1's forklaring; kun `modspil:v1` skrives. Profilen skifter facit: Aflæs markeringen med Standard og Omvendt på samme seed har samme stik og svarknapper, og det rigtige svar for den ene er forkert for den anden (tre seeds).
  - `src/modspil/ui/indstillinger.test.tsx` (punkt 3, 4 tests): tre radioknapper og syv rullelister (mock-up 4), profilvalget overlever genindlæsning, en ændret metode giver "Metoderne i Egen", og eksport og import som Pointregnskab (Afgrænsning, trin 2).
  - `src/modspil/ui/skaerme.test.tsx` (punkt 4 i jsdom, 7 tests): opgaveskærmens syv dele i specens rækkefølge for alle øvelser i alle tre profiler; facit med mærke, regnestykke, forklaring, Ved bordet, ordbogslink og Næste opgave; "Rigtigt" for det rigtige svar og "Forkert" for et andet.
  - `src/modspil/ui/roedt.test.tsx` (punkt 5 i jsdom, 2 tests): hvert ♥ og ♦ står alene i et rødt element, og et rødt element har ingen rang.
  - `src/modspil/ui/tilgaengelighed.test.tsx` (punkt 6 i jsdom, 4 tests): kun rigtige knapper og links, ingen `tabindex="-1"`, kortknapperne med aria-label som "Spar 8", og stikket med tekst til skærmlæser.
  - `src/modspil/ui/sprog.test.tsx` (punkt 7, 4 tests): de eksisterende sprogtjek læser Modspils skærme; husets ord og beskrivende form i den tekst, skærmene viser; ingen dansk på de engelske skærme, heller ikke i ⓘ og aria-label.
  - `src/modspil/intet-andet-trin2.test.ts` (punkt 8, 3 tests): ingen eksisterende testfil er ændret siden tagget, og ingen fil uden for `src/modspil/` er ændret, bortset fra de tilladte.
  - `src/modspil/ui/testhjaelp.tsx`: fælles hjælp. Eksempelopgaverne er alle øvelser i alle tre profiler med seed 1 og 3 på øvelsens første niveau og seed 2 på niveau 4 og en opgave i udspillets længde med et uklart facit, i alt 60 opgaver og 122 skærme pr. gennemgang.
  - `scripts/tjek-bred-layout.mjs` (punkt 4–6 i Chrome og pixelsammenligningen i punkt 8) med testsiden `scripts/modspil.html`, der viser én opgave fra trin 1, valgt med adressen. `--modspil` kører kun Modspil og pixelsammenligningen af forsiden og vejledningen. Modspil-delen tjekker mock-up 1–4 ved 390 px, bredt layout ved 1280 × 900 og 1000 × 700 (to spalter, toppene ud for hinanden, spalten dækker intet, facit til højre under spørgsmålet), samme HTML ved 390 og 1280 px, rødt i alle øvelser med alle profiler og tastaturet fra forsiden gennem en session til status og en profil i Indstillinger.
- **Antal tests og det røde resultat:**
  - Vitest: 9 testfiler med 33 tests (30 i `src/modspil/ui/` og 3 i punkt 8). `npx vitest run src/modspil/ui src/modspil/intet-andet-trin2.test.ts src/modspil/intet-andet.test.ts` (20 s) gav 7 fejlende testfiler. 6 fejler ved indlæsningen, fordi `src/modspil/ui/ModspilScreen.tsx`, `src/modspil/ui/Opgave.tsx` og `src/modspil/storage.ts` ikke findes. I `forside.test.tsx` fejler 6 af 7 (gruppen, forsiden, ruten, adressen, vejledningen og `GuideScreen.tsx`), og "de andre grupper er som i tagget" består. Punkt 8 (3 tests) og trin 1's punkt 10 (2 tests) består.
  - `tsc` fejler kun på de tre manglende moduler (6 fejl i `indstillinger.test.tsx`, `session.test.tsx` og `testhjaelp.tsx`).
  - Testenes egne kontroller ("testen kan se forskel" i punkt 5, 6 og 7) er tjekket med midlertidige stubbe til de tre moduler: alle 3 bestod. Stubbene er slettet og ikke committet.
  - `node scripts/tjek-bred-layout.mjs --modspil` (2 min): 8 fejl, alle i Modspil, fordi sporets skærm og testsiden ikke findes. Pixelsammenligningen af forsiden og vejledningen ved 999 og 390 px mod `v43-foer-modspil-skaerme` er grøn (4 ok).
  - Trin 1's `intet-andet.test.ts` består med det nye tag: den sammenligner nu kun `v42-foer-modspil-model` og `v43-foer-modspil-skaerme`, og forskellen er kun `src/modspil/`, specen og `CLAUDE.md`.
- **Grænsefladen til session 2** (i korte træk; detaljerne står øverst i testfilerne):
  - `src/app/tracks.ts`: gruppen `defense` ("Modspil" / "Defence") efter `play` og ét menupunkt og ét kort med `track` og `screen` `modspil` og titlen "Modspil" / "Defence".
  - `src/app/App.tsx`: skærmen `modspil` (`#modspil`) indlæser `src/modspil/ui/ModspilScreen.tsx` dovent (standardeksport, `{ onBack, start? }`) med h1 "Modspil" og knapperne "Start dagens session", "Indstillinger" og "Tilbage til forsiden". Status hedder "Sessionen er gennemført".
  - `src/modspil/ui/Opgave.tsx`: `Opgave` med `{ opgave, nummer, antal, svar?, onSvar, onNaeste, onIndstillinger }`; med `svar` står facit på samme skærm. Roden har `data-ovelse`, `data-niveau` og `data-seed` og børnene `.wide-left` (meldeforløbet og bordet) og `.wide-right` (spørgsmålet, svarene og facit). Desuden `data-haand="nord"` og `"dig"`, stikket med `role="img"` og aria-label "Stik 1: …", `data-udspil`, `data-tom`, gruppen "Svar", tabellerne "Meldeforløbet" og "Regnestykket", mærket `data-dom`, "Ved bordet" og "Næste opgave".
  - `src/modspil/storage.ts`: `MS_STORAGE_KEY`, `readMsSaved` og `parseMsImport` som i Pointregnskab; `saved.sessions` og `saved.streak.current` som de andre spor.
  - Kortknapperne har aria-label som "Spar 8" og "Hjerter konge", og ♥ og ♦ står i et element for sig med en rød klasse (fx `suit-red` fra `SuitText`).
  - Testsiden viser `Opgave` i `main.screen.ms-screen`, så `ModspilScreen` bruger samme ramme, og `Opgave` henter selv sporets stylesheet.
  - Filerne uden for `src/modspil/`, som punkt 8 tillader: `tracks.ts`, `App.tsx`, `GuideScreen.tsx`, `scripts/tjek-bred-layout.mjs`, `scripts/modspil.html`, `scripts/ordliste.txt` (svar 6), specen, `CLAUDE.md` og mock-up'en.
- **Valg, specen og mock-up'en ikke afgør** (testene bygger på dem):
  1. **Navnene:** sporet, skærmen og adressen hedder `modspil`, og kortets titel er "Modspil" / "Defence" som gruppen. Status og knapperne hedder som i Pointregnskab.
  2. **Sessionen** består kun af opgaver fra trin 1's generator i opgaveskærmens form, har mindst to opgaver, og hver opgave kan besvares med "Kan ikke afgøres" eller et kort.
  3. **"Kan ikke afgøres"** er en knap i alle øvelser, undtagen hvor brugeren svarer med et kort (Vælg kortet og vælg-varianten af øvelse 6 og 7), som i mock-up 3. Et klik på en svarknap svarer straks. Svaret med "Hvilke?" i Regel 11 og 12 fra niveau 4, intervallet i Makkers point og længderne i Udspillets længde er ikke testet og afgøres af byggeriet.
  4. **Facit** står på opgaveskærmen (`svar`), fordi HTML'en er den samme ved alle bredder, og mock-up 5 viser spørgsmålet og facit sammen. Om bordet skjules i facit på mobil (mock-up 2), afgør CSS, og det er ikke testet.
  5. **Regnestykket** som `<table>` kræves kun i Makkers point og Regel 11 og 12 med et klart facit; de andre øvelser har intet regnestykke i specens facitkolonne.
  6. **Hænderne:** et kort, der er spillet til stikket, må stå i hånden (mock-up 1 viser ♠K103 med ♠3 i stikket) eller være fjernet.
  7. **Kortknapperne** for honnører hedder "Spar es", "Hjerter konge", "Ruder dame" og "Klør knægt"; specen giver kun "Spar 8".
  8. **Stikket** har `role="img"`, så aria-label læses op.
  9. **Farverne** er mock-up'ens tokens: rigtigt `--ok` og forkert `--fb-miss-text` (rødt mærke, men ikke `#c62828`, der kun er til ♥ og ♦), stikkets felt `--table` og ringen `--accent`. "Gråtonet" er en grå farve, der ikke er `--text`.
  10. **Mock-up 5** viser meldeforløbet på én linje og niveauet i topbjælken. Det kræver anden HTML end på mobil, så det er ikke testet ("Kun CSS skifter"). Toppene af de to spalter står ud for hinanden, som i mock-up 5.
  11. **Rullelisterne:** testen kræver metodernes id som `value` og kategoriens tekst som label; ordlyden i mock-up'en ("Kompendiets (4.-højeste fra honnør, …)") afgør byggeriet.
  12. **Pixelsammenligningen** i `tjek-bred-layout.mjs` er nu mod `v43-foer-modspil-skaerme` (før `v38-foer-moensterkort-bred`) med Modspils gruppe og afsnit i vejledningen skjult i begge apps.
  13. **Ordbogen:** links tjekkes mod `../Forside/ordbog/index.html`, når repoet findes (ellers springes det over). "Regel 11 i ordbogen" (`#regel-11`) kræves med 4.-højeste, som i mock-up'en.
  14. **Rødt** tjekkes i jsdom på klassen (et ord med "red") og i Chrome på den beregnede farve af `--suit-red` og `--card-red`, kun i lys tilstand.
  15. **Tastaturet:** i Chrome går tiden 20 gange hurtigere under turen, så en session, der slutter efter tid, også når til status.
  16. **Vejledningen:** "De eksisterende afsnit ændres ikke" er, at `GuideScreen.tsx` kun har nye linjer. Afsnittet om forsiden nævner derfor ikke Modspil blandt grupperne og adresserne.
  17. **Sidefoden** ændres ikke (`src/ui/Footer.tsx` er uden for Afgrænsning, og `src/sidefod.test.tsx` forventer de fem trænere), så Modspil står ikke i kolonnen Trænere.
- **Spørgsmål til Frank:**
  1. **Eksisterende tests mod punkt 1:** `src/app/navigation.test.tsx` (tre tests: grupperne Optælling, Spilføring og Vurdering på dansk og engelsk, og "et nyt spor kræver kun én ny linje") og `src/app/forside-bred.test.tsx` (tre grupper og fem kort) fejler, når gruppen Modspil står på forsiden. Punkt 1 og punkt 8 ("alle eksisterende tests består uændret") kan derfor ikke begge holde. Må testene rettes til fire grupper og seks kort, som med Vurdering 8. oktober 2026? Punkt 8's test tillader det ikke nu.
  2. **Status på forsiden:** skal Modspils kort have streak, niveau og mærke og tælle med i I dag? Det kræver `src/app/status.ts`, som er uden for Afgrænsning, og `src/app/status.test.ts` forventer fire spor. Ellers får kortet `status: false` som Analyse.
  3. **Bydeform:** øvelsesnavnene "Vælg kortet" og "Vælg afkastet" skal på undtagelseslisten i `src/sprog/bydeform.ts`, ellers fejler den eksisterende `bydeform.test.ts`. Filen er uden for Afgrænsning; må listen udvides?
  4. **Mock-up'en i git:** specen siger ikke, om `docs/specs/design/modspil/` skal i git, så den ligger usporet. De andre tegninger (`Analyse.png`, `Analyse.dc.html` og `Forside.png`) er i git. Skal den committes? Punkt 8's test tillader det.
  5. **Mock-up'ens tekst i Indstillinger**, "Vælg en profil, og ret enkelte metoder herunder.", står i bydeform; punkt 7's test fanger den, så byggeriet skriver den i beskrivende form.
- **`SYSTEM.md`:** beslutningsloggen har en række for 18. nov. 2026 med grenen, tagget, de røde tests og "Venter på session 2 (byggeri); ikke flettet".
- **Tokenforbrug, session 1** (nye input, skrevet til cachen, læst fra cachen og output; fra logfilen): agenten (frisk session med specen som kontekst; 18. nov. 06:54–07:25 UTC): 78 svar; nye input 156, skrevet til cachen 404.672, læst fra cachen 18.692.591, output 190.177; i alt 19.287.596. Dette commit og rapporten er ikke talt med.

**Franks svar, 18. nov. 2026** (ordret):

> Modspil trin 2, session 2 af 2 (byggeriet), med Franks svar:
> navigation.test.tsx og forside-bred.test.tsx må rettes fra tre til fire grupper.
> Modspils kort på forsiden viser streak og niveau som Pointregnskab; status.ts må udvides til det.
> 'Vælg kortet' og 'Vælg afkastet' må på undtagelseslisten i src/sprog/bydeform.ts.
> Mock-up'en i docs/specs/design/modspil/ committes.
> Teksten i Indstillinger skrives i beskrivende form.
> De 17 valg under Afklaret er godkendt, undtagen nr. 16: vejledningens afsnit om forsiden får én linje om Modspil blandt grupperne.
> Fortsæt på grenen modspil-skaerme i en frisk session. Byg efter 'Trin 2' i SPEC-modspil.md og mock-up'en, og skriv rettelserne af testene under Afklaret. Kør hele suiten og browsertjekkene i forgrunden. Stop før merge med skærmbilleder af de fem skærme ved 390 og 1280 px i C:\Users\frank\Kontraktbridge\skaermbilleder\modspil-skaerme\. Skriv tokenforbruget (fire tal) under Afklaret.

**Session 2: byggeri (18. nov. 2026)**

- **Rettelserne af testene** (efter Franks svar, før byggeriet; alle var røde af den rigtige grund, før der blev bygget):
  - `src/app/navigation.test.tsx` (eksisterende, tilladt af Frank): før forventede tre tests grupperne Optælling, Spilføring og Vurdering (dansk to gange og engelsk én gang); nu Optælling, Spilføring, Modspil og Vurdering (Counting, Declarer play, Defence og Hand evaluation), og testens navn siger Modspil. Hvorfor: gruppen Modspil står mellem Spilføring og Vurdering (accepttest 1). Rød før: tre grupper.
  - `src/app/forside-bred.test.tsx` (eksisterende, tilladt af Frank): før tre `section.home-group`, titlerne uden Modspil og fem kortrækker; nu fire sektioner, Modspil mellem Spilføring og Vurdering og seks kortrækker. Hvorfor: samme. Rød før: tre sektioner og fem rækker.
  - `src/modspil/ui/forside.test.tsx` (ny i session 1): to nye tests. Vejledningens afsnit "Forsidens grupper" har fire linjer, og præcis én nævner Modspil (Defence på engelsk); før stod der i valg 16, at afsnittet ikke nævner Modspil. Modspils kort viser streak, niveau og ét mærke som Pointregnskab, `trackStatuses` giver `modspil` med `started`, `streak`, `level`, `doneToday` og `due`, og forsiden skriver intet; før var status på kortet et åbent spørgsmål. Hvorfor: Franks svar til valg 16 og til spørgsmål 2. Rød før: `src/modspil/storage.ts` findes ikke.
  - `src/modspil/ui/indstillinger.test.tsx` (ny i session 1): en ny test af, at al tekst i `<p>` i Indstillinger består `bydeform`, at forklaringen begynder "Facit og forklaringer følger de metoder, du vælger.", og at mock-up'ens "Vælg en profil, og ret enkelte metoder herunder." ikke står der. Hvorfor: Franks svar om teksten i Indstillinger. Rød før: `ModspilScreen.tsx` findes ikke.
  - `src/modspil/intet-andet-trin2.test.ts` (ny i session 1): før var `src/app/status.ts` og `src/sprog/bydeform.ts` uden for de tilladte filer, og ingen eksisterende testfil måtte ændres; nu er de to filer tilladt, og `navigation.test.tsx` og `forside-bred.test.tsx` må være ændret (ikke slettet). "Testen kan se forskel" tjekker, at `styles.css`, `Footer.tsx` og en ændret `status.test.ts` stadig fanges. Hvorfor: Franks svar. Den var grøn før og efter rettelsen, da den kun vogter.
  - `src/modspil/ui/forside.test.tsx`, rettet under byggeriet: de to tests af vejledningen på engelsk satte `setLang('en')` før `render(<App />)`, men App sætter sproget fra lagringen, når den tegnes (dansk uden data), så "Read the guide" fandtes aldrig. Nu skiftes sproget med knappen "Skift sprog til engelsk" på forsiden, som i `src/app/i18n.test.tsx`. Testenes hensigt er den samme.
  - `src/modspil/ui/forside.test.tsx`: testen af Modspils status på forsiden er `it.skip` med en kommentar, indtil Frank har svaret på spørgsmål 1 nedenfor (`65714fc`).
- **Status:** skærmene er bygget efter trin 2 og mock-up'en: sporets forside, sessionen med fire opgaver og status, opgaveskærmen med facit og Indstillinger, gruppen Modspil på forsiden, ruten `#modspil` (dovent), vejledningens linje og afsnit og lagringen `modspil:v1`. Modellen fra trin 1 er uændret. Ét punkt i Franks svar er ikke bygget: Modspils kort viser ikke streak og niveau, fordi det bryder seks eksisterende tests (spørgsmål 1); kortet har `status: false` som Analyse, og `src/app/status.ts` er uændret. Intet er flettet eller pushet.
- **Commits:** `5182216` Franks svar og mock-up'en, `81417af` rettelserne af testene (røde), `8229575` lagringen og sessionen, `f7a5d1e` skærmene, menupunktet, ruten og vejledningen, `65714fc` statustesten springes over, `df3c0e3` rettelser efter browsertjekket og skærmbillederne, `e91c10d` metodernes regler i stedet for deres id (trin 1's accepttest 1 (b) fangede tre id'er i `ui/opgavetekst.ts`) og afsnittet om trin 2 i `CLAUDE.md`, `2a49ddd` "accepttest" i `scripts/ordliste.txt` (svar 6), og denne status i det næste commit.
- **Valg, specen ikke afgør** (ud over de 17 godkendte):
  1. **Svarene:** Makkers point har fire intervaller med facits bredde (det rigtiges plads følger seedet); Regel 11 og 12 har tallene 0 til antallet af skjulte kort over udspillet; Udspillets længde har 3, 4, 5, 3 eller 4, 3 eller 5 og 4 eller 5 (og facit, hvis det ikke er blandt dem); Aflæs markeringen har Kald og Afvisning, med romersk kald Kald, Skifte til den laveste og den højeste af de to andre farver, Skifte til en af dem og Tvetydig, og efter ALA-kongen spilførers længde (én mulighed pr. paritet af makkers antal); Første afkast har knapperne efter afkastlæsningen (Kald til farven og Afvisning, ulige og lige med de to skifter, Lavinthal med de to skifter); Forsinket kald har Passivt og Aktivt. "Kan ikke afgøres" er der altid, undtagen hvor brugeren svarer med et kort. Knapperne hedder "Skifte til ♣" (navneord), fordi "Skift" står på bydeformlisten.
  2. **"Hvilke?"** (Regel 11 og 12 fra niveau 4): efter antallet vælges de skjulte kort over udspillet som kortknapper og "Svar", eller "Kan ikke afgøres" for hvilke; 0 og alle de skjulte kort svarer straks. Dommen kræver både antal og kort.
  3. **Dommen:** "Kan ikke afgøres" og "Tvetydig" er kun rigtige, når facit er det. I Vælg afkastet uden et entydigt kort er hvert af facits kort rigtigt (Franks svar 1, 17. nov.). I Vælg afkastet er alle brugerens kort knapper (han kan ikke bekende), i Vælg kortet og Forsinket kald kun farvens.
  4. **Sessionen:** fire opgaver ("opgave n af 4" som i mock-up'en), først højst to forfaldne øvelser fra Leitner-bunken (ét emne pr. øvelse, `ovelse:<id>`, på brugerens niveau eller øvelsens første), så `lavNiveauOpgave` på niveauet. Niveauet følger Pointregnskab (de seneste 20 svar i niveaufasen, over 90 % ét op, under 80 % ét ned), og et rigtigt svar giver 10 XP. Der er ingen tidsgrænse, så mock-up'ens ur er udeladt. Mærket fører til Indstillinger, og Tilbage fører tilbage til sessionen.
  5. **Lagringen** `modspil:v1`: `profil` (regnes altid fra `metoder`), `metoder`, `level`, `levelLog`, `items`, `xp`, `streak`, `sessions` og de valgfrie `answers` og `lastExport`; en ugyldig metode erstattes af Standards.
  6. **Facit under 1000 px** står alene under hovedet som i mock-up 2 (meldeforløbet, bordet og spørgsmålet skjules med CSS); fra 1000 px står de i to spalter som i mock-up 5. Facit har linjen "Dit svar: … · +10 XP · N rigtige i træk" (svaret overstreget, når det er forkert), og svarknapperne viser det valgte og det rigtige svar.
  7. **Hænderne** viser kun kort, der ikke er spillet; tidligere stik (Første afkast og Forsinket kald) står som listen "Spillet før" under feltet, og ringen er på stikkets første kort. Hp står ved bordet og brugerens hånd i øvelse 1–3 (mock-up 1), ikke i de andre (mock-up 3).
  8. **"Ved bordet"** er en fast tekst pr. øvelse og facit, ikke en analyse af hånden som i mock-up 2 ("♠9 er nok til at vinde stikket"), som trin 1's model ikke giver.
  9. **Ordbogen:** Makkers point → `honnoerpoint`; Regel 11 → `regel-11` (4.-højeste), ellers `udspil`; Udspillets længde → `fjerdehoejeste` eller `udspil`; markeringerne → `kald-afvisning`, `modspilssignal` (romersk kald) eller `fordelingssignal`; Første afkast → `afkast` eller `lavinthal-signal`; Forsinket kald → `modspilssignal`.
  10. **ⓘ** ved øvelsens navn over spørgsmålet (i højre spalte, så den åbner i kortet) og på sporets forside, I dag, startknappen, Metoderne, Indstillinger, Dine data og niveauet. Mock-up 1's tip ("11 − udspillets værdi …") står under svarene i Regel 11 med 4.-højeste.
  11. **Indstillinger:** radioknapperne har mock-up'ens resumé; rullelisterne viser metodens navn fra metoder.json med stort begyndelsesbogstav, og romersk kald og ALA siger både mod sans og mod farve som i mock-up'en (bygget af metodernes `sans`- og `farve`-felter, fordi trin 1's accepttest 1 (b) ikke tillader metode-id'er i brugerfladen). Kompendiets udspil hedder derfor "Kompendiets udspil" uden mock-up'ens parentes. Teksten er "Facit og forklaringer følger de metoder, du vælger. Du vælger en profil og kan rette enkelte metoder herunder." Indstillinger har også niveauet og Dine data (eksport og import).
  12. **Vejledningen:** linjen "Modspil er gruppen mellem Spilføring og Vurdering med sporet af samme navn, der træner at tælle og aflæse som modspiller." i "Forsidens grupper" og et nyt afsnit "Modspil" efter Håndevaluering (kun nye linjer).
- **Spørgsmål til Frank:**
  1. **Status på forsiden:** et kort med streak og niveau (uden `status: false`) tæller også med i I dag. Afprøvet med de tre linjer i `status.ts`: den nye test bestod, og seks eksisterende tests fejlede, fordi de forventer fire spor: `src/app/status.test.ts` (`total: 4` og `next: null`), `src/app/forside.test.tsx` ("1 af 4 spor er trænet", "4 af 4" og "Alle fire spor er trænet i dag.") og `src/app/analyse-modul.test.tsx` ("1 af 4" og "4 af 4"). Desuden siger Velkomst "Appen har fire spor" (`HomeScreen.tsx`) og vejledningen "de fire spor" (eksisterende afsnit). Må de tre testfiler rettes til fem spor, og skal teksterne om fire spor rettes? Eller skal kortet vise streak og niveau uden at tælle med i I dag (det kræver `HomeScreen.tsx`)? Indtil da har kortet `status: false`.
  2. **Forsiden fra 1000 px:** med fire grupper står Vurdering alene på anden række ved 1280 px, fordi grupperne er `flex: 1 1 280px` inden for 1136 px (4 × 280 + 3 × 24 = 1192). Skal de fire stå på én række (`styles.css`, fx 260 px), eller er to rækker i orden? Pixelsammenligningen skjuler Modspils gruppe og er derfor uændret.
  3. **"Ved bordet"** er generelle tekster pr. øvelse (valg 8). Er det nok i v1?
- **Testresultaterne:**
  - De nye tests: `npx vitest run src/modspil/ui src/modspil/metoder.test.ts` gav 8 testfiler, 42 beståede og 1 sprunget over (statustesten, spørgsmål 1); `src/modspil/intet-andet-trin2.test.ts` 3 beståede. `tsc` er grøn.
  - Hele suiten (`npm test`, tsc og Vitest): første kørsel fandt én fejl, trin 1's accepttest 1 (b) (metode-id'er i `ui/opgavetekst.ts`), rettet i `e91c10d`. Anden kørsel: 139 testfiler, 986 beståede og 3 sprunget over (heraf Modspils statustest), 0 fejlede; Vitest 304 s, 306 s med tsc. Ingen test fejlede på tid.
- **Browsertjekkene:**
  - `node scripts/tjek-bred-layout.mjs --modspil`: første kørsel 1 fejl (Indstillinger stak 137 px ud ved 390 px, fordi rullelisterne var så brede som den længste tekst; rettet i `df3c0e3`), derefter 228 ok og "Alt er grønt" (mock-up 1–4 ved 390 px, bredt layout ved 1280 × 900 og 1000 × 700, samme HTML ved 390 og 1280 px, rødt i alle øvelser med alle profiler, tastaturet fra forsiden gennem en session til status og en profil med piletasten, og pixelsammenligningen af forsiden og vejledningen).
  - `node scripts/tjek-bred-layout.mjs` (det hele, 584 s): 463 ok og "Alt er grønt", heraf 66 pixelsammenligninger ved 999 og 390 px mod `v43-foer-modspil-skaerme` (Modspils gruppe og afsnit skjult) og 224 Modspil-tjek.
  - `node scripts/tjek-design-forsiden.mjs forside vejledning`: 8 visninger (1280 og 390 px, lys og mørk), "Alt i orden"; de gamle skærmbilleder i `skaermbilleder/design-forsiden/` er lagt tilbage bagefter, så de er uændrede.
  - `node scripts/tjek-sidefod.mjs`: 97 ok, "Alt i orden".
- **Stavekontrollen** (`node scripts/sprogtjek.ts`): før kun "accepttest" (i `src/modspil/kontrol.ts` fra trin 1, svar 6); efter `2a49ddd` "ingen ukendte ord".
- **Skærmbillederne** (de fem skærme ved 390 og 1280 px; 1–3 fra testsiden `scripts/modspil.html` med Regel 11 (Standard, niveau 1, seed 1) og Vælg kortet (Kompendiet, niveau 2, seed 3), 4–5 fra appen med `#modspil`, fast dato og faste tilfældige tal; 5 er appens session med sessionsbjælken efter et svar):
  - `C:\Users\frank\Kontraktbridge\skaermbilleder\modspil-skaerme\1-opgave-390.png`
  - `C:\Users\frank\Kontraktbridge\skaermbilleder\modspil-skaerme\1-opgave-1280.png`
  - `C:\Users\frank\Kontraktbridge\skaermbilleder\modspil-skaerme\2-facit-390.png`
  - `C:\Users\frank\Kontraktbridge\skaermbilleder\modspil-skaerme\2-facit-1280.png`
  - `C:\Users\frank\Kontraktbridge\skaermbilleder\modspil-skaerme\3-vaelg-kortet-390.png`
  - `C:\Users\frank\Kontraktbridge\skaermbilleder\modspil-skaerme\3-vaelg-kortet-1280.png`
  - `C:\Users\frank\Kontraktbridge\skaermbilleder\modspil-skaerme\4-indstillinger-390.png`
  - `C:\Users\frank\Kontraktbridge\skaermbilleder\modspil-skaerme\4-indstillinger-1280.png`
  - `C:\Users\frank\Kontraktbridge\skaermbilleder\modspil-skaerme\5-bred-session-390.png`
  - `C:\Users\frank\Kontraktbridge\skaermbilleder\modspil-skaerme\5-bred-session-1280.png`
- **`SYSTEM.md`:** rækken for Modspil trin 2 (18. nov. 2026) har session 2's status og "Venter på Franks godkendelse; ikke flettet", og `modspil:v1` står under data med en note om, at nøglen kommer med trin 2.
- **Tokenforbrug, session 2** (nye input, skrevet til cachen, læst fra cachen og output; fra logfilen): agenten (frisk session med specen som kontekst; 18. nov. 13:02–14:08 UTC): 175 svar; nye input 354, skrevet til cachen 1.182.864, læst fra cachen 67.195.262, output 243.686; i alt 68.622.166. Dette commit og rapporten er ikke talt med.

**Franks svar 2, 18. nov. 2026** (ordret):

> Modspil trin 2, svar fra Frank:
> Streak og niveau: (a). Modspils kort viser streak og niveau og tæller med i 'I dag'; ret status.test.ts, src/app/forside.test.tsx, analyse-modul.test.tsx, velkomsten og vejledningen til fem spor.
> Forsiden ved 1280 px: de fire grupper står 2 × 2 (styles.css).
> 'Ved bordet' med generelle tekster er godkendt til v1.
> Kortere tekster i rullelisterne i Indstillinger, så intet skæres af ved 390 px (fx 'ALA mod sans' og 'Lavt = kald; romersk mod farve').
> Byg rettelserne i en frisk session uden at køre hele suiten. Kør derefter i en ny frisk session hele suiten og tjek-bred-layout.mjs én gang hver. …

**Session 3: Franks rettelser (18. nov. 2026)**

- **Status:** tre af Franks fire rettelser er bygget. Modspils kort viser streak og niveau og tæller med i I dag, velkomsten og vejledningen siger fem spor, og rullelisterne i Indstillinger har kortere tekster, så intet skæres af ved 390 px. "Ved bordet" er godkendt og uændret. **De fire grupper står ikke 2 × 2:** en eksisterende test er i vejen (spørgsmål 1 nedenfor), så arbejdet er stoppet dér, og `src/ui/styles.css` er uændret. Modellen fra trin 1 er uændret. Intet er flettet eller pushet.
- **Commits:** `70ea263` Franks svar 2, `18e3123` rettelserne af testene og de nye tjek (røde), `c77b9f4` status på Modspils kort og fem spor, `59f346b` rullelisternes tekster, og denne status og linjen i `CLAUDE.md` i det næste commit.
- **Rettelserne af testene** (efter Franks svar 2, før byggeriet; alle var røde af den rigtige grund):
  - `src/modspil/ui/forside.test.tsx` (ny i session 1), statustesten: før `it.skip`; nu kører den og kræver desuden "1 af 5 spor er trænet", når Modspil er trænet i dag. Hvorfor: svar 2, (a). Rød før: Modspils kort havde intet mærke.
  - `src/modspil/ui/forside.test.tsx`, to nye tests: velkomsten siger "Appen har fem spor" / "The app has five tracks", og vejledningens linje om I dag siger "de fem spor" / "the five tracks", på dansk og engelsk og uden "fire spor" / "four tracks". Før var der ingen test af det. Hvorfor: svar 2 ("ret … velkomsten og vejledningen til fem spor"). Røde før: teksterne sagde fire.
  - `src/modspil/ui/forside.test.tsx`, "GuideScreen.tsx har kun nye linjer siden tagget": før måtte ingen linje være fjernet; nu må kun linjen om I dag på dansk og engelsk være ændret, og kun fra fire til fem (four til five). Hvorfor: svar 2 retter en eksisterende linje i vejledningen. Rød før: linjen var ikke ændret.
  - `src/app/status.test.ts` (eksisterende, tilladt af svar 2): før fire spor (`total: 4`, `done: 4`, "alle fire spor" og ingen Modspil-data); nu fem spor i forsidens rækkefølge (Fordeling, Pointregnskab, Farvebehandling, Modspil, Håndevaluering), Modspil med niveau 2, streak 4 og én forfalden øvelse, ulæselige Modspil-data giver "ikke startet", Modspil kan være det næste spor, og `total: 5`. Hvorfor: svar 2, (a). Røde før: fire spor, og `trackStatuses` gav ingen `modspil`.
  - `src/app/forside.test.tsx` (eksisterende, tilladt af svar 2): før "1 af 4 spor er trænet", "4 af 4" og "Alle fire spor er trænet i dag." og fire kort med "Ikke startet endnu"; nu "1 af 5", "5 af 5" med Modspil trænet i dag, "Alle fem spor er trænet i dag." og Modspil blandt kortene med "Ikke startet endnu". Hvorfor: samme. Røde før: Modspils kort havde intet mærke, og I dag talte fire.
  - `src/app/analyse-modul.test.tsx` (eksisterende, tilladt af svar 2): før "1 af 4" og "4 af 4" og navnene "tæller stadig fire spor" og "alle fire spor"; nu "1 af 5" og "5 af 5" med Modspil trænet og navnene "tæller stadig kun sporene (fem)" og "alle fem spor". Analyse tælles stadig ikke med. Hvorfor: samme. Røde før: I dag talte fire.
  - `src/modspil/intet-andet-trin2.test.ts` (ny i session 1): før var `src/app/screens/HomeScreen.tsx` og `src/ui/styles.css` uden for de tilladte filer, og kun `navigation.test.tsx` og `forside-bred.test.tsx` måtte være ændret; nu er de to filer tilladt, og `status.test.ts`, `forside.test.tsx` og `analyse-modul.test.tsx` må være ændret (ikke slettet). "Testen kan se forskel" fanger nu `Footer.tsx`, `TopBar.tsx`, en ændret `i18n.test.tsx` og `sidefod.test.tsx`, en slettet `status.test.ts` og en ændret `loeser.test.ts`. Hvorfor: svar 2. Grøn før og efter, da den kun vogter.
  - `scripts/tjek-bred-layout.mjs --modspil`, nyt tjek: teksterne i Indstillingers rullelister kan ses helt ved 390 px på dansk og engelsk. Enhver mulighed kan være den valgte, så hver af de 17 måles: en kopi af listen med kun den ene mulighed får sin naturlige bredde (tekst, pil og polstring, som Chrome tegner dem) og må højst være så bred som listen. Tjekket viser den mindste luft. Hvorfor: svar 2 om rullelisterne. Rødt før: "ALA mod sans, top af sekvens mod farve" var 13 px og "Lavt = kald mod sans, romersk kald mod farve" 50 px for bred; på engelsk 94 og 170 px.
- **Valg, svaret ikke afgør:**
  1. **Rullelisterne:** romersk kald hedder "Lavt = kald; romersk mod farve" / "Low encourages; Roman against a suit": navnet på den metode, der spilles mod sans, og så metodens første ord mod farve. ALA hedder kun sit eget navn, "ALA mod sans" / "ALA against notrump"; at der spilles top af sekvens mod farve, står ikke længere i listen (det gør det heller ikke i profilens resumé). Teksterne bygges af navnene i `metoder.json`, ikke af id'er, og `T.modSans` er fjernet, fordi den ikke bruges. Ved 390 px er der mindst 57 px luft på dansk, men kun 5 px på engelsk ("Low encourages; Roman against a suit"); en anden browser med en bredere pil kan derfor skære et par bogstaver af på engelsk.
  2. **"Alle fem spor er trænet i dag."** / "All five tracks are trained today." står med bogstaver som før ("fire"); `HomeScreen.tsx` skriver "fem" ved fem spor.
  3. **Status:** `status.ts` læser Modspil som Pointregnskab og Håndevaluering (`withDeck` med Modspils `warmupQueue`, så "emner til repetition" er de forfaldne øvelser), og Modspil står mellem Farvebehandling og Håndevaluering, som kortene. I dag kan derfor foreslå Modspil, og knappen starter sporets session med `start`.
- **Pixelsammenligningen:** den fulde `tjek-bred-layout.mjs` sammenligner forsiden og vejledningen (og de andre skærme) ved 999 og 390 px med tagget, uden sidefoden og med Modspils gruppe og afsnit skjult i begge apps. Modspils kort med status står i den skjulte gruppe og ændrer intet, men velkomsten ("Appen har fem spor") ændrer forsiden ved begge bredder, og vejledningens linje om I dag ændrer vejledningen, hvis afsnittet er åbent. Derfor skrives "Appen har fem spor", "The app has five tracks", "af de fem spor" og "of the five tracks" om til fire i begge apps før billedet, på samme måde som Modspils gruppe skjules i begge apps. I tagget findes de ikke, så dér ændres intet, og alt andet sammenlignes stadig pixel for pixel; et utilsigtet ord eller en ændret linjeombrydning giver stadig en forskel. 2 × 2 er ikke bygget; bygges det fra 1000 px, påvirker det ikke sammenligningen, der kun er ved 999 og 390 px.
- **Spørgsmål til Frank:**
  1. **De fire grupper 2 × 2:** `src/app/forside-bred.test.tsx` (eksisterende) kræver i testen "fra 1000 px: … tre lige brede kolonner med 24 px imellem …", at `.home .home-group` har `flex: 1 1 280px`. Den rene ændring, `flex: 1 1 calc(50% - 12px)` i samme regel, blev afprøvet: testen fejlede (`expected 'flex: 1 1 calc(50% - 12px)' to match /flex:\s*1 1 280px/`), og ændringen er rullet tilbage. At lade 280 px stå og overskrive den i en anden regel ville kun narre testen. Må testen rettes til to lige brede kolonner, og skal 2 × 2 gælde fra 1000 px (ved 1000 px står grupperne ellers 3 + 1)? Forslaget ses i `forside-2x2-1280-forslag.png`, lavet med reglen lagt ind i browseren, ikke i koden. Vejledning og Indstillinger følger stadig gruppernes tre kolonner (to tredjedele og en tredjedel) og flugter derfor ikke med to kolonner; skal de også følge de to (det kræver også `repeat(3, …)` og `span 2` i samme testfil)?
- **Hvad er kørt, og resultaterne** (ikke hele suiten og ikke hele `tjek-bred-layout.mjs`):
  - Røde før byggeriet: de fem berørte testfiler gav 13 fejlede og 29 beståede; `--modspil` gav 2 fejl (rullelisterne på dansk og engelsk), og pixelsammenligningen var grøn.
  - `npx tsc`: grøn.
  - `npx vitest run` med `src/modspil/ui` (8 testfiler), `intet-andet-trin2.test.ts`, `intet-andet.test.ts`, `metoder.test.ts`, `src/app/status.test.ts`, `forside.test.tsx`, `analyse-modul.test.tsx`, `forside-bred.test.tsx`, `navigation.test.tsx`, `i18n.test.tsx`, `src/sprog/sprog.test.ts` og `bydeform.test.ts`: 18 testfiler, 112 beståede, ingen sprunget over (22 s).
  - `node scripts/tjek-bred-layout.mjs --modspil`: 230 ok og "Alt er grønt", heraf rullelisterne på dansk (57 px luft) og engelsk (5 px) og pixelsammenligningen af forsiden og vejledningen ved 999 og 390 px mod `v43-foer-modspil-skaerme` (4 ok).
  - `node scripts/tjek-design-forsiden.mjs forside vejledning`: 8 visninger, "Alt i orden"; de 16 gamle billeder i `skaermbilleder/design-forsiden/` er lagt tilbage bagefter og er uændrede.
  - Ikke kørt: `npm test`, hele `tjek-bred-layout.mjs`, `tjek-sidefod.mjs` og stavekontrollen.
- **Næste session:** hele suiten (`npm test`) og hele `node scripts/tjek-bred-layout.mjs` køres én gang hver i en ny frisk session (Franks svar 2).
- **Skærmbillederne:**
  - `C:\Users\frank\Kontraktbridge\skaermbilleder\modspil-skaerme\4-indstillinger-390.png`: Indstillinger ved 390 px med Kompendiet, taget igen ("ALA mod sans" og "Lavt = kald; romersk mod farve").
  - `C:\Users\frank\Kontraktbridge\skaermbilleder\modspil-skaerme\forside-1280.png`: forsiden ved 1280 px, som den er bygget: I dag "1 af 5 spor er trænet" og Modspils kort med "3 dage i træk", "Niveau 2" og "✓ Trænet i dag"; grupperne står 3 + 1.
  - `C:\Users\frank\Kontraktbridge\skaermbilleder\modspil-skaerme\forside-2x2-1280-forslag.png`: samme forside med forslaget til 2 × 2 (spørgsmål 1); `forside-2x2-1280.png` findes ikke, da 2 × 2 ikke er bygget.
- **Tokenforbrug, session 3** (nye input, skrevet til cachen, læst fra cachen og output; fra logfilen): agenten (frisk session med specen som kontekst; 18. nov. 14:18–14:38 UTC): 86 svar; nye input 172, skrevet til cachen 249.782, læst fra cachen 14.185.979, output 88.386; i alt 14.524.319. Dette commit og rapporten er ikke talt med.

**Session 4: 2 × 2 på forsiden (18. nov. 2026)**

- **Status:** de fire grupper på forsiden står 2 × 2 fra 1000 px, og romersk kald hedder "Low = encourage; Roman v. suit" i Indstillingers rulleliste på engelsk. Under 1000 px, Vejledning og Indstillinger på forsiden og de danske tekster er uændrede. Modellen fra trin 1 er uændret. Intet er flettet eller pushet.
- **Franks rettelse i session 4** (ordret, givet videre af hovedsessionen undervejs):

  > Den engelske tekst for romersk kald i Indstillinger forkortes til 'Low = encourage; Roman v. suit', så der er god luft ved 390 px. Tag den med i 2 × 2-sessionen, og tjek med --modspil.

- **Hovedsessionens valg** (Frank bad om, at arbejdet fortsætter efter spørgsmål 1 i session 3):
  1. Testen rettes til to lige brede kolonner; det svarer til Franks tidligere tilladelse til at rette samme testfil fra tre til fire grupper.
  2. 2 × 2 gælder fra 1000 px, hvor det brede layout begynder, så grupperne ikke står 3 + 1 ved 1000 px. Under 1000 px er layoutet uændret.
  3. Vejledning og Indstillinger bevarer deres tre kolonner (to tredjedele og en tredjedel). Det er den mindste ændring, og Frank ser resultatet bagefter.
- **Rettelsen af testen** (før byggeriet; rød af den rigtige grund):
  - `src/app/forside-bred.test.tsx` (eksisterende), testen "fra 1000 px: … to lige brede kolonner med 24 px imellem (de fire grupper 2 × 2) …": før "tre lige brede kolonner" med `flex: 1 1 280px` på `.home .home-group`; nu `flex: 1 1 calc(50% - 12px)` og ingen 280 px i reglen. `min-width: 0`, 24 px imellem, `flex-wrap: wrap`, sidemargenen og knappen i I dag er uændrede. Testen "fra 1000 px følger Vejledning og Indstillinger gruppernes tre kolonner …" hedder nu "fra 1000 px står Vejledning og Indstillinger i tre kolonner …", da grupperne ikke længere har tre; dens krav er uændrede. Hvorfor: Franks svar 2 ("de fire grupper står 2 × 2") og valg 1–3. Rød før: `expected 'flex: 1 1 280px; …' to match /flex:\s*1 1 calc\(50% - 12px\)/` (1 fejlet, 7 beståede).
  - `scripts/tjek-bred-layout.mjs --modspil`, nyt tjek: på forsiden ved 1000 × 700 og 1280 × 900 px står de fire grupper to pr. række (samme top i hver række, samme venstre kant i hver kolonne) og er lige brede (±1 px). Hvorfor: samme. Rødt før: 4 fejl (230 ok); grupperne stod 3 + 1, ved 1000 px 296, 296, 296 og 936 px brede, ved 1280 px 363, 363, 363 og 1136 px.
  - `src/modspil/ui/indstillinger.test.tsx` (ny i session 1), ny test: romersk kald hedder "Lavt = kald; romersk mod farve" i rullelisten og på engelsk "Low = encourage; Roman v. suit". Før var der ingen test af ordlyden (testens beskrivelse siger "ordlyden afgør byggeriet"), så ingen test forventede den gamle engelske tekst. Hvorfor: Franks rettelse i session 4. Rød før: `Expected: "Low = encourage; Roman v. suit"`, `Received: "Low encourages; Roman against a suit"` (1 fejlet, 5 beståede); den danske del bestod.
- **Byggeriet:**
  - `src/ui/styles.css`: `.home .home-group` har `flex: 1 1 calc(50% - 12px)` i stedet for `1 1 280px` i `@media (min-width: 1000px)`, og to kommentarer er rettet. Intet andet er ændret; Vejledning står stadig i to af tre kolonner og Indstillinger i den tredje, så de flugter ikke med gruppernes to kolonner (se billederne).
  - Rullelisten: teksten bygges stadig af metodernes navne i `metoder.json`, der hvor session 3 byggede den. `T.modFarve` er erstattet af `T.sansOgFarve(sans, farve)` i `src/modspil/ui/tekster.ts`: på dansk som før ("lavt = kald; romersk mod farve"), på engelsk skrives "low encourages" som "low = encourage" (som det danske "lavt = kald") og "against a suit" som "v. suit". `metoder.json` og facit er uændrede, så "low encourages" står stadig i forklaringerne og i profilernes resumé.
- **Commits:** `264037e` testen af 2 × 2 og tjekket i `--modspil` (røde), `56b8a6b` testen af romersk kald (rød), `4419cff` teksten til romersk kald, `438e177` 2 × 2 i `styles.css`, og denne status i det næste commit.
- **Hvad er kørt, og resultaterne** (ikke hele suiten og ikke hele `tjek-bred-layout.mjs`):
  - `npx tsc`: grøn.
  - `npx vitest run src/app/forside-bred.test.tsx src/app/navigation.test.tsx src/app/forside.test.tsx src/modspil/ui src/modspil/intet-andet-trin2.test.ts`: 11 testfiler, 67 beståede, ingen sprunget over.
  - `node scripts/tjek-bred-layout.mjs --modspil`: 234 ok og "Alt er grønt", heraf de fire nye tjek af 2 × 2 ved 1000 og 1280 px og pixelsammenligningen af forsiden og vejledningen ved 999 og 390 px mod `v43-foer-modspil-skaerme` (4 ok). Rullelisterne ved 390 px: mindst 57 px luft på dansk (uændret) og mindst **51 px på engelsk** (før 5 px).
  - `node scripts/tjek-design-forsiden.mjs forside`: 4 visninger, "Alt i orden"; de 16 gamle billeder i `skaermbilleder/design-forsiden/` er lagt tilbage bagefter og er uændrede (md5).
  - Ikke kørt: `npm test`, hele `tjek-bred-layout.mjs`, `tjek-sidefod.mjs` og stavekontrollen.
- **Næste session:** hele suiten (`npm test`) og hele `node scripts/tjek-bred-layout.mjs` køres én gang hver i en ny frisk session (Franks svar 2).
- **Skærmbillederne** (med Fordeling trænet i går og Modspil trænet i dag på niveau 2, som i session 3):
  - `C:\Users\frank\Kontraktbridge\skaermbilleder\modspil-skaerme\forside-2x2-1280.png`: forsiden ved 1280 px, grupperne 2 × 2 (Optælling og Spilføring, Modspil og Vurdering).
  - `C:\Users\frank\Kontraktbridge\skaermbilleder\modspil-skaerme\forside-2x2-1000.png`: samme ved 1000 px.
  - `C:\Users\frank\Kontraktbridge\skaermbilleder\modspil-skaerme\4-indstillinger-390-en.png`: Indstillinger på engelsk ved 390 px med The Compendium og "Low = encourage; Roman v. suit".
- **`SYSTEM.md`:** rækken for Modspil trin 2 (18. nov. 2026) har én sætning om session 4 og siger stadig "Venter på Franks godkendelse; ikke flettet".
- **Tokenforbrug, session 4** (nye input, skrevet til cachen, læst fra cachen og output; fra logfilen): agenten (frisk session med specen som kontekst; 18. nov. 18:33–18:43 UTC): 55 svar; nye input 112, skrevet til cachen 145.205, læst fra cachen 5.564.115, output 34.762; i alt 5.744.194. Dette commit og rapporten er ikke talt med.

**Session 5: hele suiten, udgivelse og arkivering (18. nov. 2026)**

- **Franks godkendelse** (18. nov. 2026, ordret): "Byg rettelserne i en frisk session uden at køre hele suiten. Kør derefter i en ny frisk session hele suiten og tjek-bred-layout.mjs én gang hver. Når alt er grønt, er trin 2 godkendt: flet, push, live-tjek af Modspil på www.kontraktbridge.dk, arkivér specen, og slet grenen. Send mig et skærmbillede af forsiden ved 1280 px fra live-sitet."
- **Status:** hele suiten og hele `tjek-bred-layout.mjs` er kørt én gang hver i en frisk session på grenen `modspil-skaerme` (`7fd771a`), hver for sig og uden andet tungt ved siden af. Alt er grønt, så trin 2 er godkendt efter Franks ord. Ingen kode er ændret i denne session.
- **Hele suiten** (`npm test`, tsc og Vitest): 139 testfiler, 990 beståede og 2 sprunget over, 0 fejlede; Vitest 404 s, 405 s med tsc. Ingen test fejlede på tid, så ingen fil er kørt igen.
- **`node scripts/tjek-bred-layout.mjs`** (det hele, 659 s): 469 ok, 0 fejl og "Alt er grønt". Heraf 66 pixelsammenligninger ved 999 og 390 px mod `v43-foer-modspil-skaerme` ("som før") og 230 tjek af Modspil og forsidens 2 × 2: de fire grupper står to pr. række og er lige brede ved 1000 og 1280 px, og teksterne i Indstillingers rullelister kan ses helt ved 390 px (17 muligheder, mindst 57 px til overs på dansk og 51 px på engelsk).
- **De andre tjek** (efter hinanden, efter browsertjekket):
  - stavekontrollen `node scripts/sprogtjek.ts` (21 s): "ingen ukendte ord";
  - `node scripts/tjek-sidefod.mjs` (21 s): 97 ok, "Alt i orden";
  - `node scripts/tjek-design-forsiden.mjs forside vejledning` (7 s): 8 visninger af 2 skærme, "Alt i orden"; de 16 gamle billeder i `skaermbilleder/design-forsiden/` er lagt tilbage bagefter og er uændrede (md5).
- **Status på grenen:** denne status står i `ad53114` på grenen `modspil-skaerme`.
- **Udgivelsen:**
  - **Fletningen:** `main` var lig med `origin/main` (`289d119`, tagget `v43-foer-modspil-skaerme`). Grenen er flettet ind med `git merge --no-ff` i `d461826` ("Flet modspil-skaerme ind: … (godkendt af Frank)"), og `main` og tagget `v43-foer-modspil-skaerme` er pushet.
  - **GitHub Actions:** kørslen "Udgiv på GitHub Pages" for `d461826` (run 44376842219, build og deploy) er grøn, 18. nov. 19:05–19:14 UTC.
  - **Live-tjekket** på www.kontraktbridge.dk/fordelingstraeneren/ i Chrome uden vindue med en tom lagring (Fordelingstrænerens scripts har intet `--live`, så tjekket er kørt med et lille script uden for repoet efter mønsteret i `tjek-sidefod.mjs`): 20 ok, 0 fejl.
    - Forsiden ved 1280 px har grupperne Optælling, Spilføring, Modspil og Vurdering 2 × 2, lige brede (556 px) og intet ud til siden. Modspils kort har mærket "Ikke startet endnu" for en ny bruger, og velkomsten siger fem spor.
    - `#modspil` åbner med overskriften "Modspil". "Start dagens session" giver en opgave, og et svar giver facit med mærket, "Ved bordet" og "Næste opgave". Sessionen med fire opgaver når til "Sessionen er gennemført".
    - Bagefter viser Modspils kort "1 dag i træk", "Niveau 1" og "✓ Trænet i dag", I dag siger "1 af 5 spor er trænet", og grupperne står stadig 2 × 2.
    - Indstillinger ved 390 px: de 7 rullelister og deres 17 muligheder kan ses helt på dansk (mindst 57 px til overs, fx "Lavt = kald; romersk mod farve" og "ALA mod sans") og på engelsk (mindst 51 px, fx "Low = encourage; Roman v. suit" og "ALA against notrump"). Der er ingen engelske ord i de danske lister, og der er ingen danske ord og intet æ, ø eller å på den engelske skærm.
    - Første kørsel gav én fejl i scriptet selv: overskriften "Ved bordet" står med `text-transform: uppercase`, så `innerText` gav "VED BORDET". Tjekket blev rettet til at finde elementet på teksten, og anden kørsel var grøn. Sitet var det samme i begge kørsler.
  - **Skærmbillederne fra live-sitet:**
    - `C:\Users\frank\Kontraktbridge\skaermbilleder\modspil-skaerme\live-forside-1280.png`: forsiden ved 1280 px efter en session i Modspil (til Frank);
    - `C:\Users\frank\Kontraktbridge\skaermbilleder\modspil-skaerme\live-forside-1280-ny-bruger.png`: samme for en ny bruger;
    - `C:\Users\frank\Kontraktbridge\skaermbilleder\modspil-skaerme\live-indstillinger-390.png`: Indstillinger ved 390 px på dansk;
    - `C:\Users\frank\Kontraktbridge\skaermbilleder\modspil-skaerme\live-indstillinger-390-en.png`: samme på engelsk.
- **Arkiveringen:**
  - Grenen `modspil-skaerme` er slettet lokalt før arkiv-committen og findes ikke på GitHub (`git ls-remote --heads origin modspil-skaerme` er tom).
  - Specen er flyttet fra roden til `docs/specs/SPEC-modspil.md` med `git mv`, og første linje siger, at den er godkendt og udgivet.
  - Afsnittet "## Modspil" i `CLAUDE.md` peger på `docs/specs/SPEC-modspil.md` og siger, at trin 2 er udgivet.
  - `docs/specs/README.md` har fået en linje for specen, som de tidligere arkiverede specer.
  - **Testene af punkt 10 og 8 efter flytningen:** `src/modspil/intet-andet.test.ts` (punkt 10) bestod uændret, fordi den kun sammenligner de to tags. `src/modspil/intet-andet-trin2.test.ts` (punkt 8) fejlede i "ingen fil uden for src/modspil/ er ændret, bortset fra de tilladte" med `docs/specs/SPEC-modspil.md` og `docs/specs/README.md`, alene fordi specen er arkiveret. Begge er derfor tilføjet testens tilladte liste (`TILLADT`) med en kommentar. README-linjen er med, fordi husets arkivering har en linje pr. spec i oversigten. Opgaven nævnte kun specens nye sti, så det er det eneste sted, hvor rettelsen går ud over den. Bagefter bestod begge (2 testfiler, 5 tests), og `tsc` er grøn. Ingen anden kode er ændret.
  - **Arkiv-committen** er `691d715` på `main`. Den er pushet, og GitHub Actions var grøn (kørsel 44379040339, 18. nov. 19:18–19:27 UTC).
- **`SYSTEM.md`:** rækken for Modspil trin 2 (18. nov. 2026) siger "Godkendt af Frank og udgivet 18. nov. 2026" med session 5, flettecommitten, tagget, Actions og live-tjekket. Oversigten har Modspil blandt Fordelingstrænerens dele, og `modspil:v1` står under data uden forbehold.
- **Tokenforbrug, session 5** (nye input, skrevet til cachen, læst fra cachen og output; fra logfilen): agenten (frisk session med specen som kontekst; 18. nov. 18:45–19:27 UTC): 73 svar; nye input 156, skrevet til cachen 622.382, læst fra cachen 9.483.689, output 45.383; i alt 10.151.610. Dette commit og rapporten er ikke talt med.
