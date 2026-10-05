# Fordelingstræneren – spec til Claude Code

Oct 2, 2026 · @Frank

> Opdateret 3. okt. 2026: alle fem trin er bygget og udgivet på GitHub Pages. Spec'en beskriver appen, som den er; ændringer i forhold til den oprindelige plan er skrevet ind i de relevante afsnit.

## Formål og rammer

Appen træner hånd-fordelinger i bridge i daglige sessioner på 5 minutter. Målet har to trin: først at kende de 39 mønstres rangorden og omtrentlige hyppighed, dernæst at tænke i mønstre under optælling.

Det andet trin er det egentlige mål. Når Vest har vist 5 spar og 4 hjerter, skal brugeren se "5-4-3-1 eller 5-4-2-2" uden at regne 13 − 5 − 4.

- **Bruger:** én øvet spiller. Ingen login og ingen server.
- **Sprog:** appen er på dansk som standard. En knap øverst på forsiden skifter hele appen, også farvebehandling, til engelsk og tilbage, og valget gemmes (Franks ønske, 5. oktober 2026). På engelsk vises honnørerne som A K Q J, tal med decimalpunktum, og meldeforklaringerne fra systemfilen og løserens linjer oversættes. Engelsk bridgeterminologi: "dummy", "finesse", "entries", "endplay".
- **Hjælp:** et lille ⓘ ved elementerne viser en kort forklaring af, hvad elementet gør, og hvordan det bruges, lige ved elementet; et nyt tryk skjuler den. Forsiden har en samlet vejledning med afsnit, der kan foldes ud.
- **Bridgeterminologi:** "bordet" (ikke blindemand), "kipning" (ikke snit), "forbindelser" (ikke broer), "slutspil" eller "endplay" (ikke indspil).
- **Notation:** et mønster skrives faldende med bindestreg (5-4-2-2). En konkret fordeling skrives i farveordenen ♠♥♦♣ med lighedstegn (2=5=2=4). ♥ og ♦ står med rødt, også i tekst.
- **Meldesystem:** al meldetolkning følger standard dansk 2/1 og ligger i en konfigurationsfil (se Meldetolkning).
- **Pædagogisk princip:** husketeknikkerne er stilladser, der aftrappes. Slutmålet er direkte genkald ved bordet, uden palads og billeder.

## Platform og arkitektur

Byg appen i React, Vite og TypeScript som en statisk side på GitHub Pages. Den skal kunne installeres som PWA, så den ligger på hjemmeskærmen og virker offline. Design mobil-først: betjening med én hånd, store trykflader og intet, der kræver hover.

```text
src/
  engine/   motor uden bridgeviden: Leitner, streak, XP, sessionsbygger, lagring
  domain/   mønstre, kombinatorik, kortgiver, betingede sandsynligheder, sudoku-løser
  system/   meldetolkning: dk-2over1.json + fortolker
  memory/   huskepalads, skyline-billeder, støtteniveauer
  modes/    én mappe pr. øvelse
  ui/       Skyline, Mønstertastatur, Album, Klubaften, Gitter4x4
  app/      sessionsmotor, progression og skærme: binder motor, domæne og øvelser sammen
```

- `engine/` må ikke importere fra `domain/` eller `system/`. Så kan motoren genbruges i andre træningsapps.
- Kortgiveren bruger Fisher–Yates over 52 kort med en seedbar PRNG (fx mulberry32), så en opgave kan genskabes ud fra sit seed.
- Hænder må aldrig filtreres eller vægtes i de øvelser, der viser hyppigheder. Tallene skal være de ægte.
- Ingen eksterne API'er. Tests skrives i Vitest.

## Mønstermodel

Alle 39 mønstre og deres sandsynligheder beregnes i koden. Intet tal tastes ind.

```latex
P = \frac{n \cdot \binom{13}{l_1}\binom{13}{l_2}\binom{13}{l_3}\binom{13}{l_4}}{\binom{52}{13}}, \qquad n = \frac{4!}{\prod_k m_k!}
```

Her er l₁–l₄ farvelængderne, og m er antallet af farver med samme længde. Antallet af placeringer n er altid 4, 12 eller 24.

- **Præcision:** regn tællerne med BigInt og divider til sidst. Så er summen af alle p præcis 1, og 7-5-1-0 og 8-3-2-0 er eksakt lige sandsynlige.
- **Rang:** faldende sandsynlighed. Lige sandsynlige mønstre deler rang.
- **Grad:** almindelig p ≥ 10 %, ualmindelig 2,5–10 %, sjælden 1–2,5 %, episk 0,1–1 %, legendarisk under 0,1 %. Det giver 5, 5, 3, 11 og 15 mønstre. Graden bruges som niveau, som rum i paladset og som albumgrad.
- **Familie:** længste farve, dvs. 4, 5, 6 eller 7+. Andelene er 35,08 / 44,34 / 16,55 / 4,03 %.
- **Pr. 100 hænder:** antal ud af 100 med største-rest-afrunding over alle 39 mønstre, så summen er præcis 100.
- **1 ud af N:** N = round(1/p), vist med punktum som tusindtalsseparator.

Facitværdier til test. De 13 mønstre er også paladsets stationer.

| Rang | Mønster | Placeringer | Sandsynlighed | Pr. 100 hænder | Grad |
| --- | --- | --- | --- | --- | --- |
| 1 | 4-4-3-2 | 12 | 21,55 % | 22 | almindelig |
| 2 | 5-3-3-2 | 12 | 15,52 % | 16 | almindelig |
| 3 | 5-4-3-1 | 24 | 12,93 % | 13 | almindelig |
| 4 | 5-4-2-2 | 12 | 10,58 % | 11 | almindelig |
| 5 | 4-3-3-3 | 4 | 10,54 % | 11 | almindelig |
| 6 | 6-3-2-2 | 12 | 5,64 % | 6 | ualmindelig |
| 7 | 6-4-2-1 | 24 | 4,70 % | 5 | ualmindelig |
| 8 | 6-3-3-1 | 12 | 3,45 % | 3 | ualmindelig |
| 9 | 5-5-2-1 | 12 | 3,17 % | 3 | ualmindelig |
| 10 | 4-4-4-1 | 4 | 2,99 % | 3 | ualmindelig |
| 11 | 7-3-2-1 | 24 | 1,88 % | 2 | sjælden |
| 12 | 6-4-3-0 | 24 | 1,33 % | 1 | sjælden |
| 13 | 5-4-4-0 | 12 | 1,24 % | 1 | sjælden |

## Husketeknikker

Fem husketeknikker bærer appen. Alle er stilladser, der aftrappes, indtil mønstrene genkaldes direkte.

**1. Huskepalads (loci).** Brugeren lægger 13 stationer på en rute, han kender udenad, fx hjemmet, klubben eller en fast gåtur. Station n rummer mønstret med rang n.

- Ruten har tre rum: rum 1 = station 1–5 (almindelig), rum 2 = station 6–10 (ualmindelig), rum 3 = station 11–13 (sjælden).
- Et fjerde rum, Loftet, rummer de 11 episke mønstre uden rækkefølge. Legendariske mønstre placeres ikke.
- Brugeren navngiver hver station og skriver en scene. Appen giver skabelonen "Ved {station}: {billede}" og beder om et billede, der er overdrevet, bevæger sig og rører ved stationen.
- Rum 2 og 3 låses op, når den foregående grad er lært (se Sessionsmotor).

**2. Skyline-billeder (dual coding).** Hvert mønster tegnes altid som fire faldende søjler (komponenten Skyline). Hvert mønster har desuden et billede, der udspringer af formen, så billedet bærer strukturen. Brugeren kan erstatte ethvert billede, og det egne billede vises så overalt, fordi selvskabte billeder huskes bedst.

| Mønster | Standardbillede | Formen |
| --- | --- | --- |
| 4-4-3-2 | Trappen | repos øverst, to trin ned |
| 5-3-3-2 | Kirken | tårn, skib og våbenhus |
| 5-4-3-1 | Orgelpiberne | fire forskellige længder, derfor 24 placeringer |
| 5-4-2-2 | Lænestolen | høj ryg, lavt sæde |
| 4-3-3-3 | Rækkehusene | fire næsten ens huse |
| 6-3-2-2 | Fabrikken | høj skorsten, en hal og to skure |
| 6-4-2-1 | Skihopbakken | stejl og jævnt faldende |
| 6-3-3-1 | Domkirken | kirkens storebror: højere tårn, mindre våbenhus |
| 5-5-2-1 | Kamelen | to lige høje pukler, hoved og hale |
| 4-4-4-1 | Den vaklende stol | tre lige ben og ét kort |
| 7-3-2-1 | Raketten | 7 – og så 3-2-1 – affyring! |
| 6-4-3-0 | Kældertrappen | tre trin ned, der ender i mørket (renonce) |
| 5-4-4-0 | Taburetten | tre ben, det fjerde mangler |

**3. Familiefarver.** Længste farve bestemmer én farve i hele appen: søjler, album og klubaften. Brug blå (4), grøn (5), rav (6) og violet (7+), og undgå rød og sort, som er kulørernes farver. Farven står aldrig alene; der er altid tekst eller tal ved.

**4. Klubaften (ikonarray).** 100 hænder svarer til 25 spil × 4 hænder. De vises som 10 × 10 mini-skylines i familiefarver, sorteret efter rang og med antallene fra kolonnen "Pr. 100 hænder". Klubaftenen bruges som introduktion, i ugens status og i øvelsen Klubaften-estimat.

**5. Aftrapning (fading).** Hvert emne har et støtteniveau fra 3 til 0. Niveauet falder ét trin, når emnet rykker op i en Leitner-kasse, og stiger ét trin ved fejl.

| Niveau | Før svaret | Efter svaret |
| --- | --- | --- |
| 3 | emnet præsenteres (station, mønster, billede) og testes straks; ledetråd på tryk | station, billede og skyline |
| 2 | ledetråd (billedet) på tryk, koster XP | station, billede og skyline |
| 1 | ingen ledetråd | skyline |
| 0 | ingen ledetråd | kun rigtigt/forkert og facit |

## Øvelser

Seks øvelser fører fra rangorden til optælling. Alle kan betjenes med én hånd.

**Mønstertastatur** er det fælles input. Det har cifrene 0–9 og en tast "10+". De fire længder tastes i vilkårlig rækkefølge og sorteres automatisk; når tre er tastet, udfyldes den fjerde med 13 minus resten.

1. **Højere/lavere.** To mønstre vises som skyline med tal, og brugeren trykker på det hyppigste eller på ≈.
   - ≈ er rigtigt, når den relative forskel er under 2 %. Det gælder 5-4-2-2 mod 4-3-3-3 og 7-5-1-0 mod 8-3-2-0.
   - Par fra samme grad og med nabo-rang er de sværeste.
2. **Fuldfør mønsteret.** Opgaven giver 1–2 kendte farvelængder, fx "Vest har vist 5♠ og 4♥". Brugeren taster de mulige mønstre og sorterer dem efter sandsynlighed. Der tastes højst tre: er der flere mulige (med én kendt farve er der 8–12), bedes der om de tre hyppigste, så opgaven kan løses inden for tærsklen for hurtigt svar.
   - Facit: de ukendte farver deler de resterende kort hypergeometrisk, dvs. P er proportional med produktet af C(13, l) over de ukendte farver.
   - Fuld score for rigtig mængde og rækkefølge, halv score for rigtig mængde. Feedback viser procent pr. mønster.
3. **Lynaflæsning.** En tilfældig hånd vises usorteret, og brugeren taster mønstret.
   - Som standard står hånden, til brugeren trykker "Klar". Under Indstillinger kan i stedet vælges visning i t millisekunder: t starter på 3.000 ms, falder 10 % efter et rigtigt svar og stiger 15 % efter en fejl, inden for 800–5.000 ms.
   - Som hjælp kan kortene vises sorteret efter farve (valg under Indstillinger).
   - Svartiden måles fra, hånden er skjult.
   - Hver tilfældig hånd registreres i albummet.
4. **Paladsvandring.** Station → mønster (tastes) og mønster → station (vælges på ruten). Øvelsen følger støtteniveauerne fra Husketeknikker.
5. **Klubaften-estimat.** "Hvor mange af aftenens 100 hænder er 6-3-2-2?" Svaret er rigtigt inden for ±1 for antal op til 10 og ±2 derover. Øvelsen træner færdigheden sammenligning og kommer i repetitionen som alternativ til højere/lavere for klubaftenens 16 mønstre.
6. **13-sudoku.** Overføringen til bordet.
   - Gitteret har rækkerne Nord (bordet), Øst, Syd (dig) og Vest og søjlerne ♠♥♦♣. Alle rækker og søjler summer til 13, og Nord og Syd er kendte.
   - Ledetrådene kommer én ad gangen: meldinger tolket efter systemfilen og spilhændelser som "Øst kan ikke bekende i 2. ruderrunde" (præcis 1 ruder) eller "Vest følger tre gange i klør" (mindst 3 klør).
   - Brugeren udfylder celler med blyantsnoter og kan når som helst låse hele fordelingen. Point = grundpoint × (ledetråde tilbage + 1). En forkert lås koster grundpointene, og opgaven fortsætter.
   - Generatoren giver tilfældigt, lader systemfilen melde for Øst og Vest (åbning og direkte indmelding; svar kommer med svarsekvenserne, der ikke er med i første version) og udleder spilhændelser af de faktiske længder. Den tilføjer ledetråde, indtil løseren finder præcis én løsning. Løseren filtrerer Østs højst 560 mulige fordelinger med ledetrådene; Vest følger af søjlesummerne og skal opfylde sine egne.

## Meldetolkning – standard dansk 2/1

Al meldetolkning følger standard dansk 2/1, som beskrevet i systemdokumentet "2 over 1 – Moderne majorstøtte" (bygget på Femfarve i major). Reglerne ligger i `system/dk-2over1.json`, så systemet kan skiftes uden kodeændringer.

Hver regel har melding, situation, prioritet, hp-interval, `shows` (hårde fordelingskrav) og en dansk tekst. Meldegiveren vælger den første regel i prioritetsrækkefølge, som hånden opfylder, ellers pas. Løseren i 13-sudoku bruger kun `shows`.

```json
{ "call": "1H", "context": "opening", "priority": 5, "hcp": [12, 21],
  "shows": { "allOf": [ { "min": { "H": 5 } }, { "longest": "H" } ] },
  "text": "5+ hjerter" }
```

Kravtyper: `min`, `max`, `exact`, `geq` (fx ruder ≥ klør), `longest` (lige lang tæller), `balanced` (4-3-3-3, 4-4-3-2 eller 5-3-3-2), `allOf` og `anyOf`.

| Situation | Melding | Viser om fordelingen | hp |
| --- | --- | --- | --- |
| Åbning, prioritet 1 | 2♣ | intet (kunstig, stærk) | 22+ (forenklet) |
| Åbning, prioritet 2 | 2NT | jævn | 20–21 |
| Åbning, prioritet 3 | 1NT | jævn, kan rumme 5-korts major | 15–17 |
| Åbning, prioritet 4 | 1♠ | 5+ ♠, og spar er længste farve | 12–21 |
| Åbning, prioritet 5 | 1♥ | 5+ ♥, og hjerter er længste farve | 12–21 |
| Åbning, prioritet 6 | 1♦ | 4+ ♦ og ruder ≥ klør | 12–21 |
| Åbning, prioritet 7 | 1♣ | 2+ ♣ (forberedende) | 12–21 |
| Åbning | Svag 2♦ / 2♥ / 2♠ | præcis 6 i farven, ingen 4-korts major ved siden af | 5–11 |
| Åbning | Svag 3 i farve | 7+ i farven | 5–11 |
| Over 1 i farve | Indmelding på 1-trinnet | 5+ i farven | 8–17 |
| Over 1 i farve | Indmelding på 2-trinnet | 5+ i farven | 10–17 |
| Over 1 i farve | Oplysningsdobling | 4-3 eller 4-4 i de umeldte majorer, højst 2 i deres farve | ca. 12 |
| Over 1 i farve | 1NT | jævn, hold i deres farve | efter systemfilen |
| Over 1♣ / 1♦ | Michaels-cuebid | 5+ ♠ og 5+ ♥ | 8–15 eller 17+ |
| Over 1♥ / 1♠ | Michaels-cuebid | 5+ i den anden major og 5+ i en uvist minor | 8–15 eller 17+ |
| Over 1 i farve | Usædvanlig 2NT | 5-5 eller mere i de to laveste umeldte farver | 8–15 eller 17+ |
| Over deres 1NT | Dobling (DONT) | én farve med 6+, vist efter relæet | 10–16 |
| Over deres 1NT | 2♣ / 2♦ (DONT) | den meldte farve og en højere, mindst 5-4 | 8–15 |
| Over deres 1NT | 2♥ (DONT) | hjerter og spar, mindst 5-4 | 8–15 |
| Over deres 1NT | 2♠ (DONT) | 6+ ♠ | 8–15 |
| Over deres 1NT | 2NT (DONT) | begge minorer, mindst 5-5 | 8–15 |

Spilhændelser som ledetråde:

- "X kan ikke bekende i n. runde af farven" = præcis n − 1 kort i farven.
- "X følger n gange i farven" = mindst n kort.
- "X spiller 4. højeste ud i farven" = mindst 4 kort (systemets udspilsregel).

Ikke med i første version: 3NT med gående minor, svage 4- og 5-åbninger, genåbning, kravpas samt svar- og genmeldingssekvenser.

Åbne punkter:

- Oplysningsdoblingens "højst 2 i deres farve" er antaget; systemdokumentet nævner kun majorlængderne.
- 2♣ er forenklet til 22+ hp; dokumentet tillader også færre point med 9–10 sikre stik.
- 1NT-indmeldingens styrke står som åbent punkt i systemets Bilag C (8–11 direkte, 11–14 i genåbning). Den ændrer ikke fordelingskravet.

## Sessionsmotor

En session varer 5 minutter og sammensættes automatisk af motoren. Timeren er blød: den igangværende opgave gøres altid færdig.

1. **Repetition, ca. 60 s:** forfaldne emner, blandet på tværs af øvelser.
2. **Niveauøvelse, ca. 90 s:** Fuldfør mønsteret eller Paladsvandring på det aktuelle niveau.
3. **Lynrunde, 60 s:** Højere/lavere og Lynaflæsning skiftevis fra dag til dag. Måles i korrekte svar pr. minut.
4. **13-sudoku, ca. 75 s:** én opgave. Springes over, hvis tiden er brugt.
5. **Status, 15 s:** streak, XP, dagens kurvepunkt og hvad der kommer igen i morgen.

| Leitner-kasse | Næste gang |
| --- | --- |
| 1 | i morgen |
| 2 | om 2 dage |
| 3 | om 4 dage |
| 4 | om 8 dage |
| 5 | om 16 dage |

- **Emne** = (mønster, færdighed). Færdighederne er rang (palads), sammenligning, aflæsning og fuldførelse.
- **Flytning:** rigtigt og hurtigt rykker emnet én kasse op. Rigtigt men langsomt bliver stående. Forkert sender emnet i kasse 1 og hæver støtteniveauet ét trin.
- **Hurtigt** = under tærsklen: 3 s for højere/lavere og palads, 10 s for fuldfør. Tærsklerne kan justeres.
- **Mestret** = kasse 5 og hurtigt rigtigt på tre forskellige dage.
- **Par:** en fejl i højere/lavere sender begge mønstres sammenligningsemne i kasse 1.
- **Nye emner:** højst 2 nye mønstre pr. dag. Næste grad låses op, når alle emner i den nuværende grad står i kasse 3 eller højere.
- **Adaptiv sværhed:** glidende træfsikkerhed over de seneste 20 svar. Over 90 % gør opgaverne sværere (nabo-rang, kortere visningstid, kun én kendt farve i fuldfør); under 80 % gør dem lettere.
- **Interleaving:** højst 2 opgaver af samme type i træk uden for lynrunden.
- **Hyperkorrektion:** et svar markeret "sikker", som var forkert, gentages sidst i samme session.

## Gamification

Spilmekanikken er selve stoffet: albummets grader er hyppighederne, og niveauerne er graderne.

- **XP:** 10 for et rigtigt svar. +5 for hurtigt rigtigt, men kun når niveauets træfsikkerhed er mindst 90 %.
- **Combo:** ×1,5 efter 5 rigtige i træk og ×2 efter 10. Nulstilles ved fejl.
- **Indsats:** efter svaret på et repetitionsemne trykker brugeren "Sikker" eller "Gæt". Sikker giver +15 ved rigtigt og −10 ved forkert; Gæt giver +5 og 0.
- **Ledetråd:** at åbne billedet før svaret (støtteniveau 2) koster 5 XP.
- **Streak:** en dag tæller, når en session er gennemført, og dagen skifter kl. 04. Én joker pr. kalenderuge bruges automatisk på en glemt dag.
- **Album:** 39 pladser i fem grader. Et mønster samles første gang, det optræder i en tilfældig hånd. Legendariske pladser kan også låses op med tre rigtige svar om mønstret: grad, størrelsesorden af "1 ud af N" og antal placeringer.
- **Sjældne fund** fejres med odds, fx "7-6-0-0: 1 ud af 17.971".
- **Niveauer** følger graderne, og et nyt rum i paladset åbner med niveauet.
- **Ugens boss:** hver 7. session er sudoku-opgaven en svær opgave med dobbelt XP.
- **Kurver:** korrekte svar pr. minut i lynrunden og træfsikkerhed pr. grad, vist som linjediagram over uger.
- **Senere, ikke i MVP:** duel på fælles seed, så to spillere får identiske opgaver og sammenligner score.

## Data og lagring

Al tilstand ligger i ét JSON-objekt i localStorage under nøglen `fordelingstraener:v1`. Objektet kan eksporteres og importeres som fil fra Indstillinger.

```ts
type Skill = "rank" | "compare" | "read" | "complete";

type Saved = {
  version: 1;
  settings: {
    sessionSeconds: 300;
    dayStartsAtHour: 4;
    fastMs: Record<Skill, number>;
    readShow?: "tap" | "timed";   // Lynaflæsning: til "Klar" (standard) eller i t ms
    readSorted?: boolean;         // Lynaflæsning: kortene sorteret efter farve
    language?: "da" | "en";       // appens sprog; dansk, når feltet mangler
  };
  palace: {
    rooms: { name: string }[];
    stations: { name: string; room: number; patternId: string; scene?: string }[];
  };
  images: Record<string, string>; // patternId -> eget billede; ellers standardbilledet
  items: Record<string, {         // nøgle: `${patternId}:${skill}`
    box: 1 | 2 | 3 | 4 | 5;
    due: string;                  // YYYY-MM-DD
    support: 0 | 1 | 2 | 3;
    log: { t: number; ok: boolean; ms: number; sure?: boolean }[]; // de seneste 20
  }>;
  album: Record<string, { first: string; count: number }>;
  streak: { current: number; best: number; lastDay: string; jokerWeek?: string };
  xp: number;
  sessions: {
    day: string; ms: number; correct: number; total: number; cpm: number;
    grades?: Record<string, [number, number]>; // rigtige og stillede pr. grad, til kurverne
  }[];
  readMs?: number;                // visningstiden t i Lynaflæsning
};
```

- Datoer regnes i lokal tid (Europe/Copenhagen).
- Ved en ny skemaversion migreres data, og ukendte felter bevares. Valgfrie felter (markeret med ?) er kommet til uden ny version.
- Import validerer skemaet og viser et resumé, før noget overskrives.
- localStorage gælder pr. enhed og browser. Eksport og import er sikkerhedsnettet; synkronisering mellem enheder er ikke med i MVP.

## Leveranceplan og accepttest

Byg i fem trin, og tag appen i daglig brug efter trin 2. Alle fem trin er bygget, og alle accepttest består.

1. **Mønstermodel og kortgiver** med tests (se nedenfor).
2. **MVP til daglig brug:** Højere/lavere, Fuldfør mønsteret, Leitner, streak, 5-minutters session, lagring med eksport/import og PWA.
3. **Huskepalads, skyline-billeder og aftrapning.**
4. **Lynaflæsning, album og Klubaften** (ikonarray og estimat).
5. **Meldetolkning og 13-sudoku**, derefter ugens boss og kurver.

Accepttest i Vitest:

- [x] Præcis 39 mønstre, og summen af sandsynlighederne er præcis 1 (BigInt-brøker).
- [x] P(4-4-3-2) = 21,5512 % og P(4-3-3-3) = 10,5361 %.
- [x] Top 5 = 71,11 % og top 10 = 91,07 %.
- [x] 7-5-1-0 og 8-3-2-0 har samme antal hænder (689.049.504).
- [x] "1 ud af N": 7-6-0-0 = 17.971 og 13-0-0-0 = 158.753.389.900.
- [x] Graderne giver 5, 5, 3, 11 og 15 mønstre.
- [x] "Pr. 100 hænder" summer til 100 og matcher tabellen i Mønstermodel.
- [x] Fuldfør med kendt 5♠ og 4♥: minorerne sidder 3-1 (begge veje) 49,74 %, 2-2 40,70 % og 4-0 9,57 %.
- [x] Kortgiveren: 100.000 hænder på fast seed giver 4-4-3-2 i 21,55 % ± 0,4 procentpoint.
- [x] 13-sudoku: hver genereret opgave har præcis én løsning, når alle ledetråde er givet.
- [x] Meldegiveren: på 10.000 tilfældige hænder opfylder den valgte melding altid sit eget `shows`, og ingen regel er uopnåelig.
- [x] Leitner: et forkert svar giver kasse 1 og forfald i morgen. Jokeren bruges højst én gang pr. kalenderuge.
