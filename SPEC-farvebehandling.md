# SPEC-farvebehandling

3. oktober 2026 · Frank

Farvebehandling bygges som et nyt, selvstændigt spor i fordelingstræneren. Den eksisterende app og dens SPEC.md forbliver uændrede. Version 3.1: version 3 med Claude Codes rettelser fra trin 1, godkendt af Frank (kendt sidning, modspillets viden, kildens fejl og antal brugbare cases). Version 3.2: startbanken er alle brugbare cases fra siderne 0–9, ikke kun de 100 hyppigste (Franks valg, 4. oktober 2026).

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
| Daglig session | farvebehandling har sin egen daglige session (Franks valg, 4. oktober 2026) | indgå i fordelingssporets session eller erstatte 13-sudokuen |
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
9. **Hold eller par:** to linjer til samme mål: målets bedste linje (holdkamp) og linjen med flest stik i gennemsnit (parturnering). Brugeren vælger linjen til holdkamp og linjen til parturnering. Facit viser begge linjers chance for målet og stik i gennemsnit, og hvad sikkerhedsspillet koster i stik (Franks ønske, 5. oktober 2026).

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
- Løseren regner med optimalt modspil (se Løser): modspillet kender alle kort og blander sine valg; spilføreren ser kun de spillede kort. Normalt modspil bruges kun til Spil den selv og til forklaringer: 2. hånd lægger det laveste kort; har den kun honnører, vælges tilfældigt blandt de ligeværdige. Spilles T eller højere, dækker 2. hånd med det billigste kort, der slår det udspillede, hvis den kan. 4. hånd vinder stikket så billigt som muligt, hvis makkers kort ikke allerede vinder, og lægger ellers det laveste; den holder aldrig tilbage. Kort er ligeværdige, når intet ikke-spillet kort ligger imellem dem. "Drilsk modspil" med falske kort er et senere niveau.
- Data angiver alle små kort præcist; visningen må samle ligeværdige små kort som x. Står der x i en kilde, er spilførerens x'er de laveste kort (2, 3, 4 …), så modparten har de højere små kort.

## Hyppighed og udvælgelse

Kombinationerne trænes i rækkefølge efter, hvor tit de opstår ved bordet. Startbanken er alle brugbare kombinationer på bridgehands.com's sider 0–9 (side N: modparten har N honnørpoint i farven), rangordnet efter hyppighed på tværs af siderne. Første levering var siden "damen mangler" (modparten har 2 hp).

**Definition.** Hyppighed er chancen pr. spil for, at du og makker har kombinationen i en af de fire farver, uanset om kortene sidder i hånden eller på bordet.

```latex
P = \frac{\binom{39}{13-a}\binom{26+a}{13-b}}{\binom{52}{13}\binom{39}{13}} \cdot w \cdot 4 \cdot s
```

- a og b er antal kort i hånden og på bordet, og w er antal måder at vælge x'erne på. 4 er farverne, og s = 2, når hånd og bord er forskellige, ellers 1.
- x er et vilkårligt kort under det laveste navngivne kort. Højere kort, der ikke er nævnt, sidder hos modparten.
- Der regnes med heltal (BigInt), og der divideres til sidst.

**Visning.** Hyppigheden vises som naturlig frekvens i analysevinduet og på facitskærmen, fx "ca. hver 5. klubaften" eller "ca. 3 gange pr. klubaften". En klubaften er 25 spil.

**Sprog og hjælp** (Franks ønske, 5. oktober 2026). Farvebehandling følger appens sprog (SPEC.md): al ordlyd står på dansk og engelsk i `ui/texts.ts`, teknikkerne har engelsk navn, huskeregel og billede i `techniques.json`, og løserens linjer, der står på dansk i data, oversættes skabelon for skabelon i appen (`lineText.ts`). Et ⓘ ved fanerne, Trænings knapper, hver opgavetype, facit, analysens afsnit, Selvvalgt, Spil den selv og undersiderne forklarer elementet.

**Klubaften.** Trænings forside har en knap til klubaftenen som i fordelingstræneren (Franks ønske, 4. oktober 2026):

- Bankens 100 hyppigste kombinationer står som 10 × 10 felter i rangorden med rangnummeret.
- Et tryk på et felt viser kombinationen, hyppigheden, fx "ca. hver 2. klubaften (1 ud af 40 spil)", og teknikken med en knap, der åbner kombinationen i Analyse.
- En knap pr. teknik viser, hvor mange af de 100 der har teknikken, fx "Sikkerhedsspil × 41", og fremhæver deres felter. Knapperne står efter antal.
- En linje viser antal kombinationer pr. antal kort i farven.
- Nederst står de 100 med hyppighed pr. klubaften og en søjle i forhold til den hyppigste. Listen følger den valgte teknik, og et tryk åbner kombinationen i Analyse.

**Situation frem for kombination.** Hver enkelt kombination er sjælden, men situationen bag er almindelig. Appen viser begge tal. Eksempel, es og konge men ikke damen:

| Kort i farven | Pr. spil | Pr. klubaften |
| --- | --- | --- |
| 7 | 14,0 % | 3,5 gange |
| 8 | 10,6 % | 2,6 gange |
| 9 | 4,9 % | 1,2 gange |

**Udvælgelse.**

1. Hver case på bridgehands-siderne 0–9 får sin hyppighed beregnet.
2. Cases med fejl i kilden (forkert kortantal, uklare "…", dubletter) sorteres fra; usikre cases markeres.
3. Alle brugbare cases udgør startbanken, og nye emner introduceres i hyppighedsorden på tværs af siderne.

**Første levering: damen mangler.** Siden har 100 cases, hvoraf 85 er brugbare. Beregningen ligger i `src/farvebehandling/content/damen-mangler-hyppighed.csv`. De 10 hyppigste dækker 59 % af sidens samlede hyppighed, de 30 hyppigste 83 %. Sorteret fra er cases med "…", kortantal, der ikke passer med fordelingen, forskelligt antal mål og procenter samt dubletter.

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
4. **Søgning:** spilføreren maksimerer og modspillerne minimerer. Spilføreren beslutter kun ud fra de kort, han har set; modspillet kender alle kort. Det er et tospersonersspil med skjult information, der løses eksakt i Node, fx med lineær programmering i sekvensform eller CFR. Begrænset valg følger automatisk af modspillernes blandede valg.
5. **Beskæring:** ligeværdige kort behandles som ét, og mellemresultater gemmes pr. tilstand.
6. **Mål:** for hvert mål maksimeres P(stik ≥ mål). Desuden findes linjen med flest stik i gennemsnit (parturnering). Linjer inden for 0,5 procentpoint af den bedste vises alle. Til Hold eller par: når parturneringens linje når målet mere end 0,5 procentpoint sjældnere end målets bedste linje, regnes målets bedste linje også som parturnering (dens trin, derefter flest stik). Målet kommer med, når linjen stadig når målet lige så tit (inden for 0,5 procentpoint) og giver mindst 0,005 stik færre i gennemsnit.
7. **Kapacitet:** løseren skal klare op til 8 manglende kort.
8. **Forbindelser:** ubegrænsede i første version. Begrænsede forbindelser er en senere udvidelse.

**Resultat.** Løseren giver et strategitræ. Det gemmes i linjeformatet fra afsnittet Opgavebank og oversættes til dansk med faste sætningsskabeloner: en kort hovedlinje, fx "Slå esset, kip derefter mod damen", og grene, hvor de er nødvendige, fx "Lægger Øst en honnør, …". Frank godkender teksterne for startbanken.

**Alternative linjer.** Opgavetype 1 og 3 skal have 2–4 linjer at vælge imellem. Alternativerne er løserens bedste linje for hvert andet første udspil, højst tre, som hver ligger mere end 0,5 procentpoint under den bedste. For B432 / ET65 og 3 stik er det fx "esset først" og "B'en fra bordet" ved siden af "lille mod T'en"; tallene fastlægges af løseren.

**Drift.** Et Node-script, `scripts/solve.ts`, forudberegner alle kombinationer i banken til `src/farvebehandling/content/solutions.json`, så telefonen ikke selv skal regne i fase 1. I fase 2 regner løseren i browseren på forespørgsel: kombinationer uden for banken og egne linjer (se Afklaret). "Normalt modspil" bruges kun til Spil den selv og til forklaringer.

**Validering.** Løseren regner alle brugbare cases fra bridgehands.com's side "damen mangler", som Claude Code læser direkte. Rapporten viser pr. case og mål løserens og kildens procent, beregnet med begge fortolkninger af x: spilførerens x'er som de laveste kort og x som uden betydning. Afvigelser over 0,5 procentpoint gennemgås, fordi kilden kun har hele procenter. Kendte fejl i kilden: kortantallet passer ikke med fordelingen i case 5, 6, 14, 15 og 85; case 30 og 41 har ét mål, men to procenter; case 74–78 og 92 har "…"; case 42 og 53 er dubletter af 40 og 52. Case 13 (E K x / B x x, 3 stik, 10 %) er rigtig: spiller man mod knægten, lægger Øst damen.

**Fejl i kilden** (Franks ønske, 5. oktober 2026). Hver afvigelse over 0,5 procentpoint får en årsag i valideringsrapporten:

- passer med fortolkningen "høj";
- lille afvigelse (højst 1,5 procentpoint fra den nærmeste fortolkning);
- kilden modsiger sig selv (et højere mål har en større procent end et lavere);
- samme mål og procenter som en anden case på siden, der passer (kopieret);
- målet er sikkert eller umuligt med begge fortolkninger;
- ellers passer kilden ikke med nogen fortolkning.

Et mål fjernes fra appen, når kildens procent afviger mere end 1,5 procentpoint med begge fortolkninger (og ikke passer med "høj"), og alle linjer giver det samme, så opgaven ingen beslutning har. Så er målet næppe det, kilden mente; fx K D 10 9 / x, hvor kilden giver 2 stik 11 %, men 2 stik er sikre. En case uden mål tilbage sorteres fra. Det giver 14 fjernede mål og 3 cases færre: banken har 657 kombinationer. Listen står i `content/kildefejl.json`; de øvrige afvigende mål bliver, og appen bruger løserens tal.

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
- **Kendt sidning:** kan en modspiller ikke bekende, er sidningen kendt, og linjen slutter med det samme; løseren spiller resten optimalt. Uden reglen giver linje B i B432 / ET65 kun 89,6 % for 2 stik.

Eksemplet B432 / ET65 har to linjer:

- **Linje A:** lille fra bordet mod T'en, derefter esset.
- **Linje B:** esset, derefter lille fra bordet mod T'en.

Linjerne genereres af løseren og gemmes i formatet ovenfor. Håndskrevne linjer bruges kun til brugerens egne tilføjelser og til at sammenligne en bestemt linje med løserens. Accepttesten låser tallene for eksemplet: A 37,3 % og 94,3 %, B 6,8 % og 100 % for 3 og 2 stik.

Startbank: alle brugbare kombinationer på bridgehands.com's sider 0–9 (se Hyppighed og udvælgelse). Kildens procent pr. mål står i `source`. En test sætter `verified: true`, når appens tal stemmer med kilden inden for 0,5 procentpoint (kilden har kun hele procenter); afviger de, gennemgås kombinationen, fordi fejlen også kan ligge i kilden. Analyse fase 1 viser kun kombinationer fra banken; brugeren kan tilføje egne linjer i samme format.

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
- **Hold eller par:** svaret er rigtigt, når begge valg er rigtige, ellers forkert. Samme linje begge steder er forkert, for pointen er, at turneringsformen afgør linjen.
- **Statistik** (Franks ønske, 5. oktober 2026): Trænings forside har en knap til statistikken. Den viser træfsikkerheden pr. teknik og pr. opgavetype, alle svar og de seneste 30 dage, svageste først. Svar i Træning (repetition og niveau, ikke lynrunden) og Selvvalgt tæller med, og et halvt rigtigt svar tæller som et halvt. Det svageste punkt er tekniken med lavest træfsikkerhed blandt dem med mindst 5 svar og under 100 %. Statistikken og Selvvalgt foreslår at øve det, og et tryk åbner Selvvalgt med tekniken valgt.

## Data og lagring

Al farvebehandlingens tilstand ligger i ét JSON-objekt under nøglen `farvebehandling:v1`. `fordelingstraener:v1` læses og skrives ikke.

- **Indhold:** version, indstillinger, emner (kasse, forfaldsdato, støtteniveau og de seneste 20 svar), XP, streak, sessioner, palads (rum, stationer, egne billeder og huskeregler) og egne linjer. Valgfrie felter: Træningens svar til statistikken (de seneste 2000, samme form som Selvvalgts log) og dagen for den seneste eksport.
- **Skema:** Claude Code skriver det som en TypeScript-type i samme stil som fordelingssporets `Saved`. Typen godkendes, før brugerfladen bygges.
- **Eksport og import:** farvebehandling har sin egen eksport og import under sine egne indstillinger. Fordelingssporets eksport ændres ikke.
- **Versioner:** ved en ny skemaversion migreres data, og ukendte felter bevares.
- **Fast lagring** (Franks ønske, 5. oktober 2026): første gang brugeren gemmer noget, beder appen browseren om fast lagring (`navigator.storage.persist()`), så dataene ikke ryddes, fx når telefonen mangler plads. Det gælder hele appen, også fordelingssporets data, men ændrer ikke dem. "Dine data" viser, om lagringen er fast, og hvornår der sidst blev eksporteret.
- **Påmindelse om eksport:** er den seneste eksport, eller den første session eller det første svar i Selvvalgt, mindst 30 dage gammel, viser Trænings forside en påmindelse med en knap, der eksporterer.

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
- **Tilgængelighed:** trykflader mindst 44 px og kontrast mindst 4,5:1. Undtagelse: klubaftenens 10 × 10 felter er mindre på smalle skærme; listen under dem har trykflader i fuld størrelse.

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

Farvebehandling bygges i seks trin. Alle seks er færdige.

1. **Løser og model:** sidningsberegning, løser med optimalt modspil, hyppighed og tests. Startbankens resultater forudberegnes i Node, og valideringsrapporten for siden "damen mangler" laves.
2. **Tokens og designsystem:** færdige, se afsnittet Designarbejde.
3. **Analyse fase 1** efter designgrundlaget i Layout, med startbanken og løserens resultater.
4. **Træning og Selvvalgt** med session, scoring og palads; opgavetype 1–4, derefter 5–8.
5. **Spil den selv** med normalt modspil.
6. **Analyse fase 2:** løseren i appen; den kører i browseren på forespørgsel (se Afklaret).

Accepttest i Vitest:

- [x] Alle eksisterende tests for fordelingssporet består uændret.
- [x] `fordelingstraener:v1` er uændret efter brug af farvebehandling, også efter eksport og import.
- [x] 5 manglende kort, konkret sidning a priori: 5-0 = 1,96 %, 4-1 = 2,83 %, 3-2 = 3,39 %.
- [x] 5 manglende kort, samlet: 3-2 = 67,8 %, 4-1 = 28,3 %, 5-0 = 3,9 %.
- [x] 4 manglende kort, konkret sidning: 2-2 = 6,78 %, 3-1 = 6,22 %, 4-0 = 4,78 %.
- [x] Ledige pladser 13/13 giver præcis de samme tal som a priori.
- [x] B432 / ET65: linje A = 37,3 % for 3 stik og 94,3 % for 2 stik; linje B = 6,8 % for 3 stik og 100 % for 2 stik.
- [x] B432 / ET65, sidningen Kxx–Dx: linje A giver 3 stik, linje B giver 2.
- [x] Bordet E K B 3 2, hånden 7 6 5 4: fald = 53,1 %, esset først og så kipning = 51,4 %.
- [x] Begrænset valg: kipning efter Østs dame = 64,7 %.
- [x] Validering: en opgave med et umuligt trin eller en `goto` til næste trin afvises.
- [x] Normalt modspil (Spil den selv): 2. hånd lægger lavt, dækker T eller højere med det billigste kort, der slår, og vælger tilfældigt mellem ligeværdige kort; 4. hånd vinder billigst, hvis makkers kort ikke allerede vinder.
- [x] Gætteintervaller: 25,0 → 25–50, 50,0 → 50–75, 75,0 → 75–100.
- [x] Sandsynlighedsbåndets felter summer til 100 % for hver linje.
- [x] Selvvalgt: intet filtervalg med 0 kombinationer kan vælges.
- [x] Komponentfilerne indeholder ingen farveværdier og ingen tal med enhed, undtagen 0, 1px-streger og procenter.
- [x] Hyppighed pr. spil: E K x x / B x x = 0,747 % (1 ud af 134) og E K B x / x x x = 0,498 % (1 ud af 201).
- [x] Es og konge uden damen, 8 kort i farven: 10,56 % pr. spil.
- [x] Hyppighederne i `damen-mangler-hyppighed.csv` kan genberegnes præcist af appen, og rangordenen er den samme.
- [x] Løseren vælger fald med bordet E K B 3 2 og hånden 7 6 5 4 (53,1 %) frem for kipning (51,4 %).
- [x] Løserens bedste linje i B432 / ET65 giver 37,3 % for 3 stik og 100 % for 2 stik.
- [x] Begrænset valg: med bordet E K T 3 2 og hånden 7 6 5 4 kipper løseren mod knægten, når Øst lægger damen under esset eller kongen, og omvendt.
- [x] Løseren bruger ikke kort, spilføreren ikke har set: to sidninger, der ser ens ud for spilføreren, får samme beslutning.
- [x] Valideringsrapporten dækker alle brugbare cases fra siden "damen mangler", med begge fortolkninger af x og også cases med 8 manglende kort.
- [x] Optimalt modspil: accepttallene 37,3 %, 53,1 % og 64,7 % holder også med optimalt modspil.
- [x] Optimalt modspil: med hånden E T 8 2 og bordet K B 9 3 (case 73, 4 stik) giver løseren ikke 100 %. Resultatet sammenlignes med kildens 53 % i valideringsrapporten.

Åbne punkter: ingen.

Afklaret:

- **Startbanken:** alle brugbare cases fra siderne 0–9 (657 kombinationer, når fejlene i kilden er fjernet; se Validering). Blakset-videoerne bruges ikke (Franks valg, 4. oktober 2026).
- **Daglig session:** farvebehandling har sin egen daglige session og indgår ikke i fordelingssporets (Franks valg, 4. oktober 2026).
- **x i kilden:** case 4 tyder på, at kilden ikke altid lader x tabe til modpartens små kort. Appen bruger "lav", og valideringsrapporterne viser begge fortolkninger og hvilken der passer bedst (godkendt af Frank, 4. oktober 2026).
- **Fase 2:** løseren kører i browseren i baggrunden (en Web Worker) på forespørgsel (Franks valg, 4. oktober 2026). En kombination uden for banken regnes fra kortvælgeren: først flest stik i gennemsnit, så målene, der er værd at regne, ét ad gangen. Egne linjer regnes på samme måde og gemmes under `ownLines`.
- **Teknik pr. case:** hver kombination har en teknik efter reglerne i `src/farvebehandling/techniques.ts` (listen står i `content/teknikker.md`); Frank bad om, at forslaget blev færdiggjort (4. oktober 2026).
