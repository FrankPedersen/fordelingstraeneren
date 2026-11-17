# SPEC – Modspil v1

15. november 2026 · Fordelingstræneren · opgave C i `PLAN-aabne-opgaver.md`.

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
- **Status:** trin 1 er bygget, Franks svar fra 17. nov. er bygget ind, og arbejdet er stoppet før merge. Venter på Franks godkendelse og svar på de to nye spørgsmål.


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
