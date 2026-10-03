# SPEC-farvebehandling

3. oktober 2026 · Frank

Farvebehandling bygges som et nyt, selvstændigt spor i fordelingstræneren. Den eksisterende app og dens SPEC.md forbliver uændrede. Version 3, rettet efter Claude Codes anden tilbagemelding.

## Afgrænsning

Fordelingssporets adfærd, data og udseende må ikke ændres. Den eksisterende kode må kun berøres de steder, tabellen nedenfor nævner.

Før arbejdet starter:

1. Commit og tag den nuværende app som `v1-fordeling`.
2. Arbejd på grenen `farvebehandling`, og flet først ind efter godkendelse.
3. Kør alle eksisterende tests før og efter. De skal bestå uændret.

| Sted | Må ske | Må ikke ske |
| --- | --- | --- |
| Navigation | ét nyt menupunkt: Farvebehandling | ændre eksisterende menupunkter eller ruter |
| Motor (`engine/`) | bruges som bibliotek uden ændringer: Leitner, streak, XP, datoer, PRNG og kombinatorik | ændre noget i src/engine/ eller src/app/session.ts |
| Lagring | ny nøgle `farvebehandling:v1` | ændre `fordelingstraener:v1` eller dens skema |
| Daglig session | farvebehandling får sin egen session indtil videre | erstatte 13-sudokuen (udskudt til en senere beslutning) |
| Designtokens | gælder de nye komponenter | ombygge eksisterende komponenter |

Farvebehandling har egen lagring, egen sessionsstyring og egen eksport/import i src/farvebehandling/. Kræver noget alligevel en ændring i eksisterende kode, skal Claude Code stoppe og spørge.

Besked til Claude Code:

> Byg farvebehandling som et nyt, selvstændigt spor efter SPEC-farvebehandling.md. Fordelingssporets adfærd, data og udseende må ikke ændres, og SPEC.md røres ikke. Kør de eksisterende tests før og efter; de skal alle bestå uændret.

## Formål og moduler

Brugeren lærer at vælge den linje i én farve, der giver størst chance for det nødvendige antal stik, og at forstå hvorfor. Sporet genbruger motor og kombinatorik fra fordelingssporet uden at ændre dem.

| Modul | Hvem vælger opgaven | Hvornår vises facit | Repetition |
| --- | --- | --- | --- |
| Træning | motoren (Leitner) | efter valg af linje og procentgæt | ja |
| Selvvalgt | brugeren: teknik, antal kort, manglende honnører, mål | efter valg af linje | logges, men ændrer ikke dagsplanen |
| Analyse | brugeren vælger en kombination | straks | nej |

- **Daglig session:** farvebehandling har sin egen 5-minutterssession. Fordelingssporets session er uændret.
- **Facitskærm:** i Træning og Selvvalgt er facitskærmen analysevinduet.
- **Gamification:** XP og combo kun i Træning. Analyse og facitskærm er neutrale.
- **Analyse i to faser:** fase 1 viser opgavebankens kombinationer med løserens forudberegnede resultater. Fase 2 lader løseren regne vilkårlige kombinationer direkte i appen.

Opgavetyper i Træning og Selvvalgt:

1. **Vælg linjen** blandt 2–4 linjer.
2. **Hvor stor er chancen?** Gæt i intervaller.
3. **Linje mod linje:** tryk på den bedste.
4. **Samme farve, nyt mål:** indgangen til sikkerhedsspil.
5. **Hvad nu?** Et kort er faldet i første runde; begrænset valg.
6. **Find hullet:** vis sidningen, hvor en given linje taber.
7. **Spil den selv:** interaktivt, stik for stik.
8. **Med optælling:** en ny 13-sudoku fra generatoren giver kun Vests og Østs længder i de tre andre farver. Vest har så 13 minus sine kendte kort som ledige pladser, Øst tilsvarende, og chancerne regnes om. Dagens sudoku og fordelingssporets data røres ikke.

## Matematik

Alle chancer regnes i koden ved at gennemgå hver konkret sidning af de manglende kort. Intet procenttal tastes ind; kilder som SuitPlay og bridgehands.com bruges kun som facitkontrol.

**1. Én konkret sidning.** Farven mangler n kort, og Vest har k bestemte af dem.

```latex
P = \frac{\binom{U-n}{v_V-k}}{\binom{U}{v_V}}, \qquad U = v_V + v_\O
```

Her er v_V og v_Ø de ledige pladser hos Vest og Øst. Uden anden viden er v_V = v_Ø = 13. Med en optælling indsættes de kendte tal. Chancen for en samlet sidning, fx 3-2, fås ved at gange med C(n, k).

**2. En linje er en strategi.** En linje er en plan med nummererede trin og hvis/så-grene. Appen gennemregner alle 2ⁿ sidninger (typisk højst 128) og giver en fordeling over antal stik. Den bedste linje findes af løseren (se afsnittet Løser).

**3. Resultat.** For hvert mål vises P(stik ≥ mål). Bedst i parturnering er linjen med flest stik i gennemsnit.

**4. Begrænset valg.** Har en modspiller flere lige store kort, vælger han tilfældigt, så sidningen vægtes med 1/antal valg. Lægger Øst damen, står singleton dame (6,22 %) mod DB, hvor damen kun vælges halvdelen af gangene (6,78 % × ½ = 3,39 %). Kipningen vinder derfor ca. 65 %.

**5. Eksempel: ni kort uden damen.** E K B x x over for x x x x.

| Sidning | Chance pr. konkret sidning |
| --- | --- |
| 2-2 | 6,78 % |
| 3-1 | 6,22 % |
| 4-0 | 4,78 % |

Spil på fald vinder i 53,1 %, esset først og så kipning i 51,4 %. Fald vinder på Dx hos Øst (3 × 6,78 %), kipning på Dxx hos Vest (3 × 6,22 %).

Forudsætninger, som skal stå synligt ved hvert resultat:

- Chancerne er a priori, medmindre der er ledige pladser fra en optælling.
- Forbindelser er ubegrænsede, medmindre opgaven siger andet.
- Løseren regner med optimalt modspil (se Løser). Normalt modspil bruges kun til Spil den selv og til forklaringer: 2. hånd lægger det laveste kort; har den kun honnører, vælges tilfældigt blandt de ligeværdige. Spilles T eller højere, dækker 2. hånd med det billigste kort, der slår det udspillede, hvis den kan. 4. hånd vinder stikket så billigt som muligt, hvis makkers kort ikke allerede vinder, og lægger ellers det laveste; den holder aldrig tilbage. Kort er ligeværdige, når intet ikke-spillet kort ligger imellem dem. "Drilsk modspil" med falske kort er et senere niveau.
- Data angiver alle små kort præcist; visningen må samle ligeværdige små kort som x. Står der x i en kilde, er spilførerens x'er de laveste kort (2, 3, 4 …), så modparten har de højere små kort.

## Hyppighed og udvælgelse

Kombinationerne trænes i rækkefølge efter, hvor tit de opstår ved bordet. Startbanken er de 100 hyppigste kombinationer på tværs af bridgehands.com's sider 0–9. Første levering er siden "damen mangler" (modparten har 2 hp).

**Definition.** Hyppighed er chancen pr. spil for, at du og makker har kombinationen i en af de fire farver, uanset om kortene sidder i hånden eller på bordet.

```latex
P = \frac{\binom{39}{13-a}\binom{26+a}{13-b}}{\binom{52}{13}\binom{39}{13}} \cdot w \cdot 4 \cdot s
```

- a og b er antal kort i hånden og på bordet, og w er antal måder at vælge x'erne på. 4 er farverne, og s = 2, når hånd og bord er forskellige, ellers 1.
- x er et vilkårligt kort under det laveste navngivne kort. Højere kort, der ikke er nævnt, sidder hos modparten.
- Der regnes med heltal (BigInt), og der divideres til sidst.

**Visning.** Hyppigheden vises som naturlig frekvens i analysevinduet og på facitskærmen, fx "ca. hver 5. klubaften" eller "ca. 3 gange pr. klubaften". En klubaften er 25 spil.

**Situation frem for kombination.** Hver enkelt kombination er sjælden, men situationen bag er almindelig. Appen viser begge tal. Eksempel, es og konge men ikke damen:

| Kort i farven | Pr. spil | Pr. klubaften |
| --- | --- | --- |
| 7 | 14,0 % | 3,5 gange |
| 8 | 10,6 % | 2,6 gange |
| 9 | 4,9 % | 1,2 gange |

**Udvælgelse.**

1. Hver case på bridgehands-siderne 0–9 får sin hyppighed beregnet.
2. Cases med fejl i kilden (forkert kortantal, uklare "…", dubletter) sorteres fra; usikre cases markeres.
3. De 100 hyppigste på tværs af siderne udgør startbanken, og nye emner introduceres i hyppighedsorden.

**Første levering: damen mangler.** Siden har 100 cases, hvoraf 88 er brugbare. Beregningen ligger i `src/farvebehandling/content/damen-mangler-hyppighed.csv`. De 10 hyppigste dækker 57 % af sidens samlede hyppighed, de 30 hyppigste 82 %.

| Rang | Case | Hånd / bordet | Kort | Ca. én gang pr. |
| --- | --- | --- | --- | --- |
| 1 | 40 | E K x x / B x x | 7 | 134 spil |
| 2 | 44 | E B x x / K x x | 7 | 134 spil |
| 3 | 13 | E K x / B x x | 6 | 201 spil |
| 4 | 33 | E K B x / x x x | 7 | 201 spil |
| 5 | 48 | B x x x / E K x | 7 | 201 spil |
| 6 | 28 | E B x x x / K x | 7 | 246 spil |
| 7 | 34 | E K T x / x x x | 7 | 362 spil |
| 8 | 20 | E K B x x x / x | 7 | 368 spil |
| 9 | 90 | B x x x x / E K x x | 9 | 413 spil |
| 10 | 46 | B T x x / E K x | 7 | 603 spil |

## Løser

Løseren finder selv den bedste linje for en kombination og et mål. Den er kernen i farvebehandling og bygges først; linjer skrives ikke længere i hånden.

Opgaven er et spil under usikkerhed: spilføreren må kun beslutte ud fra de kort, han har set, ikke ud fra den faktiske sidning. Dobbeltdummy må derfor ikke bruges, fordi den vælger den heldige spillemåde i hver sidning.

**Metode**

1. **Tilstand:** kortene i Nord og Syd, de kort modparten har vist, hvem der spiller ud, og vundne stik.
2. **Sidninger:** alle 2ⁿ fordelinger af de n manglende kort med a priori-vægte, eller med ledige pladser fra en optælling.
3. **Modspil: optimalt.** Modspillerne vælger og blander deres kort, så spilførerens chance bliver mindst mulig. En fast regelmodel må ikke bruges, fordi løseren så lærer at udnytte faste vaner; fx giver E T 8 x / K B 9 x ellers 100 % i stedet for ca. 53 %.
4. **Søgning:** spilføreren maksimerer og modspillerne minimerer. Begge beslutter kun ud fra det, de har set. Det er et tospersonersspil med skjult information, der løses eksakt i Node, fx med lineær programmering i sekvensform eller CFR. Begrænset valg følger automatisk af modspillernes blandede valg.
5. **Beskæring:** ligeværdige kort behandles som ét, og mellemresultater gemmes pr. tilstand.
6. **Mål:** for hvert mål maksimeres P(stik ≥ mål). Desuden findes linjen med flest stik i gennemsnit (parturnering). Linjer inden for 0,5 procentpoint af den bedste vises alle.
7. **Kapacitet:** løseren skal klare op til 8 manglende kort.
8. **Forbindelser:** ubegrænsede i første version. Begrænsede forbindelser er en senere udvidelse.

**Resultat.** Løseren giver et strategitræ. Det gemmes i linjeformatet fra afsnittet Opgavebank og oversættes til dansk med faste sætningsskabeloner: en kort hovedlinje, fx "Slå esset, kip derefter mod damen", og grene, hvor de er nødvendige, fx "Lægger Øst en honnør, …". Frank godkender teksterne for startbanken.

**Alternative linjer.** Opgavetype 1 og 3 skal have 2–4 linjer at vælge imellem. Alternativerne er løserens bedste linje for hvert andet første udspil, højst tre, som hver ligger mere end 0,5 procentpoint under den bedste. For B432 / ET65 og 3 stik er det fx "esset først" og "B'en fra bordet" ved siden af "lille mod T'en"; tallene fastlægges af løseren.

**Drift.** Et Node-script, `scripts/solve.ts`, forudberegner alle kombinationer i banken til `src/farvebehandling/content/solutions.json`, så telefonen ikke selv skal regne i fase 1. Hvordan løseren kører i appen i fase 2, afklares senere, fordi optimalt modspil er tungere at regne. "Normalt modspil" bruges kun til Spil den selv og til forklaringer.

**Validering.** Løseren regner alle brugbare cases fra bridgehands.com's side "damen mangler", som Claude Code læser direkte. Rapporten viser pr. case og mål løserens og kildens procent, beregnet med begge fortolkninger af x: spilførerens x'er som de laveste kort og x som uden betydning. Afvigelser over 0,5 procentpoint gennemgås, fordi kilden kun har hele procenter. Kendte fejl i kilden: case 14 og 15 står som 7-0 med kun 6 kort, case 13 (E K x / B x x, 3 stik) står til 10 %, selvom en kipning giver omkring 50 %, og bemærkningen til case 12 er kopieret fra case 8.

## Opgavebank og linjeformat

Opgavebanken ligger i `src/farvebehandling/content/suit-combinations.json` og teknikkerne i `src/farvebehandling/content/techniques.json`. Alle kort står præcist i data, fx E K B 3 2 / 7 6 5 4; visningen samler ligeværdige små kort som x. Internt bruges A K Q J T, i visningen E K D B 10. Tieren vises som "10" i hele appen, som fordelingssporet allerede gør; "T" bruges kun i data og spec.

```ts
type Combination = {
  id: string;                  // "J432-AT65"
  technique: string;           // id fra techniques.json
  north: string;               // bordet, alle kort: "J432"
  south: string;               // hånden, alle kort: "AT65"
  goals: number[];             // [3, 2]
  entries: "unlimited" | { north: number; south: number };
  lines: Line[];
  source?: { name: string; values: Record<string, number> }; // kildens % pr. mål
  verified: boolean;
};
type Line = { id: string; text: string; steps: Step[] };
type Step = {
  leadFrom: "N" | "S";
  card: string;                // konkret kort, "low" eller "high"
  third?: { ifSecondPlays: "low" | string; play: string; else: string };
  branches?: { if: { fallen?: string[]; showsOut?: "V" | "Ø" }; goto: number }[];
};
```

Semantik:

- **`low` og `high`:** det laveste eller højeste kort i den hånd, der spiller.
- **3. hånd uden `third`:** lægger det laveste kort.
- **`ifSecondPlays: "low"`:** sand, når 2. hånd lægger et kort under B. Kan 2. hånd ikke bekende, er betingelsen ikke opfyldt.
- **Grene:** `goto` peger altid på et andet trin end det næste.
- **Umulige trin:** et trin, der kræver et kort, som allerede er spillet, er en fejl i opgaven. Valideringen afviser den.
- **Efter sidste trin:** løseren spiller resten optimalt ud fra de kort, der er set. En linje behøver derfor kun at beskrive de første, afgørende runder.

Eksemplet B432 / ET65 har to linjer:

- **Linje A:** lille fra bordet mod T'en, derefter esset.
- **Linje B:** esset, derefter lille fra bordet mod T'en.

Linjerne genereres af løseren og gemmes i formatet ovenfor. Håndskrevne linjer bruges kun til brugerens egne tilføjelser og til at sammenligne en bestemt linje med løserens. Accepttesten låser tallene for eksemplet: A 37,3 % og 94,3 %, B 6,8 % og 100 % for 3 og 2 stik.

Startbank: de 100 hyppigste kombinationer på tværs af bridgehands.com's sider 0–9 (se Hyppighed og udvælgelse), begyndende med siden "damen mangler". Kildens procent pr. mål står i `source`. En test sætter `verified: true`, når appens tal stemmer med kilden inden for 0,5 procentpoint (kilden har kun hele procenter); afviger de, gennemgås kombinationen, fordi fejlen også kan ligge i kilden. Analyse fase 1 viser kun kombinationer fra banken; brugeren kan tilføje egne linjer i samme format.

## Session, scoring og progression

Ét emne i Leitner-systemet er en kombination × et mål. Motoren vælger opgavetypen.

5-minutterssessionen:

1. **Repetition, 60 s:** forfaldne emner.
2. **Niveau, 150 s:** 2–3 opgaver på det aktuelle niveau.
3. **Lynrunde, 60 s:** linje mod linje.
4. **Status, 30 s:** streak, XP og hvad der kommer igen i morgen.

| Linje | Gæt | Resultat | XP | Leitner |
| --- | --- | --- | --- | --- |
| rigtig | rigtigt interval | rigtigt | 10 | én kasse op, hvis svaret er hurtigt |
| rigtig | forkert interval | halvt | 5 | bliver stående |
| forkert | – | forkert | 0 | kasse 1 |

- **Rigtig linje:** den bedste linje eller enhver linje inden for 0,5 procentpoint af den.
- **Hurtigt:** under 20 s for hele opgaven.
- **Gætteintervaller:** 0–<25, 25–<50, 50–<75 og 75–100 %. Grænsen hører til intervallet over: 25,0 → 25–50, 50,0 → 50–75, 75,0 → 75–100.
- **Nye emner:** højst 2 nye kombinationer pr. dag.
- **Oplåsning:** i hyppighedsorden, så de kombinationer, der opstår oftest ved bordet, kommer først, uanset teknik. En tekniks rum i paladset åbner, når dens første kombination dukker op.
- **Streak og XP** er adskilt fra fordelingssporet. En dag med kun farvebehandling holder ikke fordelingssporets streak i live. Det er et bevidst valg.
- **Selvvalgt:** hvert filtervalg viser antallet af kombinationer, og valg med 0 er grået ud. Et filter kan derfor aldrig ramme ingenting.

## Data og lagring

Al farvebehandlingens tilstand ligger i ét JSON-objekt under nøglen `farvebehandling:v1`. `fordelingstraener:v1` læses og skrives ikke.

- **Indhold:** version, indstillinger, emner (kasse, forfaldsdato, støtteniveau og de seneste 20 svar), XP, streak, sessioner, palads (rum, stationer, egne billeder og huskeregler) og egne linjer.
- **Skema:** Claude Code skriver det som en TypeScript-type i samme stil som fordelingssporets `Saved`. Typen godkendes, før brugerfladen bygges.
- **Eksport og import:** farvebehandling har sin egen eksport og import under sine egne indstillinger. Fordelingssporets eksport ændres ikke.
- **Versioner:** ved en ny skemaversion migreres data, og ukendte felter bevares.

## Huskepalads og huskeregler

Farvebehandling har sit eget palads, adskilt fra fordelingssporets. Hvert rum er en teknik, og stationerne i rummet er teknikkens kombinationer. Ordet "teknik" bruges om farvebehandlingens grupper; "familie" er forbeholdt mønsterfamilierne 4, 5, 6 og 7+.

`techniques.json` angiver for hver teknik: id, navn, rækkefølge, huskeregel og standardbillede. Brugeren kan erstatte både billede og huskeregel.

Godkendt. Standardbillederne er udgangspunktet, og brugeren kan erstatte dem:

| Teknik | Huskeregel | Standardbillede |
| --- | --- | --- |
| Enkelt kipning | Spil mod honnøren, ikke fra den. | Indbrudstyven, der lister ind bag vagten |
| Fald eller kip | Med 8 kort kipper man, med 9 slår man. | Vægten: 8 vipper mod kipning, 9 mod fald |
| Spil mod honnør | Spil mod det kort, du vil gøre til stik. | Stigen op mod honnøren |
| Dobbelt kipning | Kip først mod det laveste hul. | To låger, hvor den nederste åbnes først |
| Sikkerhedsspil | Sikr målet, ikke maksimum. | Sikkerhedsselen |
| Begrænset valg | Lagde de en honnør, havde de nok ikke valget – kip. | Gæsten, der kun havde én stol at vælge |

## Layout og brugerflade

Alle skærme følger én læseretning: problem → linjer → forskel → detaljer. Wireframes og regler nedenfor er det godkendte designgrundlag, og brugerfladen bygges efter dem. Designet kan ændres senere i Claude Design (se næste afsnit).

**Analysevindue (desktop) og facitskærm**

```text
┌──────────────────────────────────────────────────────────┐
│ Fordelingstræneren Træning · Selvvalgt · [Analyse]        │
├──────────────────────────────────────────────────────────┤
│ PROBLEMET                                                │
│        ♠ B 4 3 2   (bordet)                              │
│   Vest  ?         ↓ pil mod 10       Øst  ?              │
│        ♠ E 10 6 5  (dig)        Mål: [3 stik] [2 stik]    │
├──────────────────────────────────────────────────────────┤
│ LINJERNE                                                 │
│ ┌ Linje A – 37,3 % ✓ bedst ──┐ ┌ Linje B – 6,8 % ────────┐ │
│ │ 1. Lille mod 10 (kip)     │ │ 1. Slå esset           │ │
│ │ 2. Slå esset              │ │ 2. Lille mod 10        │ │
│ └───────────────────────────┘ └────────────────────────┘ │
│ a priori · ubegrænsede forbindelser · optimalt modspil    │
├──────────────────────────────────────────────────────────┤
│ FORSKELLEN – sandsynlighedsbånd                          │
│ A ████▓▓░░████░░▓▓████░░  (samme rækkefølge for A og B)  │
│ B ████░░░░░░░░░░▓▓░░░░░░                                 │
│ Linjerne er uenige i 3 sidninger: Kxx–Dx, Dxx–Kx, xx–KDx. │
│ [Gruppér: fordeling | honnører]      [Vis alle sidninger] │
├──────────────────────────────────────────────────────────┤
│ HUSKEREGEL · billede fra paladset · [Spil den selv ▶]    │
└──────────────────────────────────────────────────────────┘
```

**Træning (mobil, 390 px)**

```text
 1 · OPGAVE            2 · FACIT               3 · HVORFOR
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   ♠ B 4 3 2      │ │ Du valgte A ✓    │ │ Huskeregel       │
│ V ?   ↓   Ø ?    │ │ Bedst: A 37,3 %  │ │ "Kip mod den     │
│   ♠ E 10 6 5     │ │ Dit gæt: 25–50 ✓ │ │  honnør …"       │
│ Mål: 3 stik      │ │ A ███▓░░██░░     │ │ [billede: rum 2] │
│ Vælg linje:      │ │ B ██░░░░░░░░     │ │                  │
│ (A) (B) (C)      │ │ Uenige i 3 sidn. │ │ [Vis alle        │
│ Chance:          │ │ [Spil den selv]  │ │  sidninger]      │
│ <25 25–50 50–75  │ │                  │ │                  │
│ [Svar]           │ │ [Hvorfor →]      │ │ [Næste opgave]   │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

Regler for brugerfladen:

- **Bridgebordet:** Nord (bordet) øverst, Syd (dig) nederst, Vest til venstre, Øst til højre. E K D B 10 med honnører i fed; ♥ og ♦ i appens eksisterende røde farvetoken, i både lys og mørk tilstand. En pil viser spilleretningen i det aktuelle trin.
- **Linjer:** kort med nummererede trin og hvis/så-grene. Den bedste linje markeres først efter svaret.
- **Sandsynlighedsbånd:** én vandret søjle pr. linje på 100 %, delt i sidninger efter deres chance. Felterne står i samme rækkefølge for alle linjer, og et tryk åbner sidningen.
- **Detaljer:** de afgørende sidninger vises først. "Vis alle sidninger" folder hele listen ud, grupperet efter fordeling eller honnørplacering.
- **Nås / nås ikke:** skelnes på lyshed og symbol, ikke kulør: mørkt felt med ✓ og lyst felt med stiplet kant og ✕. Så kolliderer det ikke med mønsterfamiliernes blå, grøn, rav og violet.
- **Øvrige farver:** sandsynlighedsbjælker er neutralt grå. Accentfarven er appens eksisterende; der indføres ingen ny brandfarve.
- **Mørk tilstand:** alle farver har både lyse og mørke tokens og følger telefonens indstilling som resten af appen.
- **Skrift:** systemskrift som resten af appen. Ingen eksterne skrifter, fordi appen er en offline-PWA.
- **Bredde:** Træning og Selvvalgt ligger i appens 480 px-kolonne. Kun Analyse må gå bredere, op til 1280 px.
- **Navn:** appen hedder Fordelingstræneren.
- **Input:** kortvælger med tryk på kort i stedet for tekstfelt.
- **Afspilning:** en selvstændig tilstand. Den aktuelle sidning lyser op i båndet.
- **Træning:** linjer og forskel er skjult, indtil brugeren har valgt linje og gættet en chance.
- **Tone:** kollegial og adskiller beslutning fra resultat, fx "God beslutning – sidningen var imod dig".
- **Tilgængelighed:** trykflader mindst 44 px og kontrast mindst 4,5:1.

## Designarbejde i Claude Design

Wireframes og regler i afsnittet Layout er det godkendte designgrundlag, så brugerfladen kan bygges nu. Claude Design bruges bagefter, når designet skal ændres.

- **Tokens:** `design/tokens.json` indeholder appens farver i lys og mørk tilstand, inklusive ♥♦-rød og mønsterfamilierne, samt skrift, afstande, radier og størrelser. `src/tokens.test.ts` holder filen i takt med `src/ui/styles.css`. Farvebehandlingens nye tokens (nås, nås ikke, båndets grå og Analyses bredde på 1280 px) tilføjes, når komponenterne bygges.
- **Designsystem:** [Fordelingstræneren](https://claude.ai/artifact/NmcghGRGc1WRhmSMnjwTq3) i Claude Design, bygget på `design/tokens.json`. Det indeholder tokens, en brandbog på dansk og komponenterne Knap, Kort, Svarvalg, Skyline og Spillekort. Nye skærme bygges fra det.
- **Tegnefladen** [Analysevindue – farvebehandling](https://claude.ai/artifact/S5p4ANVzT2BGLpH98nehwn) er et tidligt udkast og ikke godkendt. Er tegnefladen og specen uenige, gælder specen.
- **Godkendte artboards:** ingen endnu. Når et artboard godkendes, skrives navnet her, og så gælder det frem for wireframes.

Arbejdsgang ved senere ændringer:

1. Ændringen tegnes i Claude Design, enten med kommentarer på artboardene, egne rettelser eller varianter bestilt hos Claude.
2. Det godkendte artboard skrives ind i listen ovenfor.
3. Claude Code læser tegnefladen og designsystemet direkte; intet skal eksporteres.
4. Rækkefølgen er altid: udseende på tegnefladen, adfærd i specen, tal i accepttestene, og først derefter koden.

Krav til farvebehandlingens komponenter, så designet kan ændres bagefter:

- **Kun tokens:** ingen farveværdier og ingen tal med enhed i komponentfilerne, undtagen 0, 1px-streger og procenter.
- **Navne:** komponenterne hedder Bridgebord, Kortvælger, Linjekort, Resultatkort og Sandsynlighedsbånd, så de kan findes direkte fra tegnefladen.
- **Tekster:** al ordlyd ligger i én dansk tekstfil.
- **Afgrænsning:** kravene gælder kun farvebehandlingens komponenter. Fordelingssporets komponenter ombygges ikke.

## Leverancetrin, accepttest og åbne punkter

Farvebehandling bygges i seks trin. Trin 2 er færdigt, og trin 1 kan startes.

1. **Løser og model:** sidningsberegning, løser med optimalt modspil, hyppighed og tests. Startbankens resultater forudberegnes i Node, og valideringsrapporten for siden "damen mangler" laves.
2. **Tokens og designsystem:** færdige, se afsnittet Designarbejde.
3. **Analyse fase 1** efter designgrundlaget i Layout, med startbanken og løserens resultater.
4. **Træning og Selvvalgt** med session, scoring og palads; opgavetype 1–4, derefter 5–8.
5. **Spil den selv** med normalt modspil.
6. **Analyse fase 2:** løseren i appen; metoden afklares senere.

Accepttest i Vitest:

- [ ] Alle eksisterende tests for fordelingssporet består uændret.
- [ ] `fordelingstraener:v1` er uændret efter brug af farvebehandling, også efter eksport og import.
- [ ] 5 manglende kort, konkret sidning a priori: 5-0 = 1,96 %, 4-1 = 2,83 %, 3-2 = 3,39 %.
- [ ] 5 manglende kort, samlet: 3-2 = 67,8 %, 4-1 = 28,3 %, 5-0 = 3,9 %.
- [ ] 4 manglende kort, konkret sidning: 2-2 = 6,78 %, 3-1 = 6,22 %, 4-0 = 4,78 %.
- [ ] Ledige pladser 13/13 giver præcis de samme tal som a priori.
- [ ] B432 / ET65: linje A = 37,3 % for 3 stik og 94,3 % for 2 stik; linje B = 6,8 % for 3 stik og 100 % for 2 stik.
- [ ] B432 / ET65, sidningen Kxx–Dx: linje A giver 3 stik, linje B giver 2.
- [ ] Bordet E K B 3 2, hånden 7 6 5 4: fald = 53,1 %, esset først og så kipning = 51,4 %.
- [ ] Begrænset valg: kipning efter Østs dame = 64,7 %.
- [ ] Validering: en opgave med et umuligt trin eller en `goto` til næste trin afvises.
- [ ] Normalt modspil (Spil den selv): 2. hånd lægger lavt, dækker T eller højere med det billigste kort, der slår, og vælger tilfældigt mellem ligeværdige kort; 4. hånd vinder billigst, hvis makkers kort ikke allerede vinder.
- [ ] Gætteintervaller: 25,0 → 25–50, 50,0 → 50–75, 75,0 → 75–100.
- [ ] Sandsynlighedsbåndets felter summer til 100 % for hver linje.
- [ ] Selvvalgt: intet filtervalg med 0 kombinationer kan vælges.
- [ ] Komponentfilerne indeholder ingen farveværdier og ingen tal med enhed, undtagen 0, 1px-streger og procenter.
- [ ] Hyppighed pr. spil: E K x x / B x x = 0,747 % (1 ud af 134) og E K B x / x x x = 0,498 % (1 ud af 201).
- [ ] Es og konge uden damen, 8 kort i farven: 10,56 % pr. spil.
- [ ] Hyppighederne i `damen-mangler-hyppighed.csv` kan genberegnes præcist af appen, og rangordenen er den samme.
- [ ] Løseren vælger fald med bordet E K B 3 2 og hånden 7 6 5 4 (53,1 %) frem for kipning (51,4 %).
- [ ] Løserens bedste linje i B432 / ET65 giver 37,3 % for 3 stik og 100 % for 2 stik.
- [ ] Begrænset valg: med bordet E K T 3 2 og hånden 7 6 5 4 kipper løseren mod knægten, når Øst lægger damen under esset eller kongen, og omvendt.
- [ ] Løseren bruger ikke kort, spilføreren ikke har set: to sidninger, der ser ens ud for spilføreren, får samme beslutning.
- [ ] Valideringsrapporten dækker alle brugbare cases fra siden "damen mangler", med begge fortolkninger af x og også cases med 8 manglende kort.
- [ ] Optimalt modspil: accepttallene 37,3 %, 53,1 % og 64,7 % holder også med optimalt modspil.
- [ ] Optimalt modspil: med hånden E T 8 2 og bordet K B 9 3 (case 73, 4 stik) giver løseren ikke 100 %. Resultatet sammenlignes med kildens 53 % i valideringsrapporten.

Åbne punkter:

- **Startbanken:** siden "damen mangler" er beregnet. Kombinationer fra Blakset-videoerne kan tilføjes med kildens procent pr. mål.
- **Daglig session:** om farvebehandling senere skal indgå i fordelingssporets session.
- **Teknik pr. case:** hver kombination i startbanken skal have en teknik, før den kan placeres i paladset.
- **Øvrige sider:** hyppigheden for bridgehands-siderne 0–9 ud over side 2 skal beregnes, før den samlede top 100 kan lægges fast.
- **Fase 2:** hvordan løseren med optimalt modspil skal køre i appen.
- **x i kilden:** case 4 tyder på, at kilden ikke altid lader x tabe til modpartens små kort. Valideringsrapporten viser, hvilken fortolkning der passer bedst.
