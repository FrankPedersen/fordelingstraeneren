# SPEC-forside-bred

30. oktober 2026 · Frank

På en computer står Fordelingstrænerens forside som en smal mobilkolonne, og den står ikke engang i midten. Specen retter centreringen og giver forsiden et bredt layout fra 1000 px: grupperne Optælling, Spilføring og Vurdering står side om side i tre kolonner. Forlægget er mockuppen "Fordelingstræneren – forside på computer", tegning **B · Grupperne side om side** (Franks valg 30. oktober 2026). Under 1000 px er forsiden uændret.

Del 3 retter bordet i Spil den selv, så det følger designsystemets standard for bridgebordet ligesom Analyse og facit (Franks ønske 30. oktober 2026).

## Afgrænsning

Før arbejdet starter: tag den nuværende udgave med det næste ledige nummer (fx `v25-foer-forside-bred`), arbejd på grenen `forside-bred`, og flet først ind efter Franks godkendelse.

| Sted | Må ske | Må ikke ske |
| --- | --- | --- |
| `src/ui/styles.css` | centreringen; forsidens brede layout fra 1000 px i klasserne `home-group`, `home-track` og en ny klasse til forsiden; eksisterende tokens | nye farver; ændre mobilvisningen under 1000 px; ændre sessioner og sporenes skærme |
| `src/app/screens/HomeScreen.tsx` | en klasse på forsidens rod og en omsluttende `div` om grupperne, hvis CSS'en kræver det | ændre indhold, tekster, rækkefølge eller logik |
| `src/ui/TopBar.tsx`, `src/ui/Footer.tsx` | samme indre bredde som forsiden, når forsiden vises bredt | ændre indhold og links |
| `design/tokens.json` | tokenet `home-width` (1200px), hvis det indføres i `styles.css` | andre ændringer |
| `src/farvebehandling/ui/Bridgebord.tsx`, `SpilSelv.tsx`, `farvebehandling.css`, `texts.ts` | del 3: Spil den selv bruger `Bridgebord`, som får de valgfrie felter, der skal til (kort, der kan spilles, og stikket i midten); tekster på begge sprog | ændre Bridgebord i Analyse, facit og opgaverne; ændre spillets regler, modspillet eller bedømmelsen |
| `SPEC-navigation.md`, `SPEC-farvebehandling.md`, `CLAUDE.md` | en linje om det brede layout og om bordet i Spil den selv under Beslutninger | |

Kræver noget alligevel en ændring ud over tabellen, skal Claude Code stoppe og spørge.

## Del 1: Centreringen (fejlretning)

På en computer står `.screen` (højst 480 px) til venstre for midten med en tom flade til højre (Franks skærmbillede ved ca. 1360 px). Find årsagen, og ret den, så alle skærme står i midten ved alle bredder. Det gælder også sessioner og sporenes skærme, som ellers ikke ændres.

## Del 2: Forsiden fra 1000 px

| Del | Under 1000 px | Fra 1000 px |
| --- | --- | --- |
| Bredde | som i dag (`column`, 480 px) | højst 1200 px (`home-width`), centreret, med 32 px sidemargen |
| Overskrift og sprogknap | som i dag | samme række, over hele bredden |
| I dag | som i dag | over hele bredden: teksten (eyebrow med ⓘ, "0 af 4 spor er trænet", fremdriften og "Næste: …") til venstre og knappen "Start dagens session …" til højre i samme kort; knappen mindst 280 px bred. Er der kun plads til én spalte, står knappen under teksten |
| Grupperne | under hinanden som i dag | tre kolonner side om side (Optælling, Spilføring, Vurdering) med 24 px imellem; hver kolonne har gruppens overskrift med ⓘ og en streg under, og sporenes kort står under hinanden |
| Kolonnernes bredde | – | lige brede (`flex: 1 1 300px; min-width: 0` i en række med `flex-wrap: wrap`), så de falder ned under hinanden, hvis vinduet bliver smallere end tre kolonner |
| Sporenes kort | som i dag | samme indhold og rækkefølge som i dag; kortet fylder kolonnens bredde |
| Sporets ⓘ | ved siden af kortet som i dag | inde i kortet, i øverste række ved pilen, så kortet kan fylde kolonnen. ⓘ åbner forklaringen under kortet som i dag |
| Topbjælke og sidefod | som i dag | indholdet står inden for de samme 1200 px som forsiden |

Kun forsiden bliver bred. Træning, sessioner, status og de andre skærme bliver i appens kolonne på 480 px; Analyse beholder sine 1280 px.

## Del 3: Bordet i Spil den selv

I dag viser Spil den selv hænderne som rækker af kortfelter uden kompas (Franks skærmbillede 30. oktober 2026). Designsystemet siger: bridgebordet vises som et klassisk diagram, hænderne som i systemnotatet ("♠ D432") og et kompas i `table` med `table-text` i midten. Sådan står bordet allerede i Analyse og facit (`Bridgebord.tsx`), og Spil den selv skal bruge samme komponent.

| Del | Sådan |
| --- | --- |
| Opbygning | `Bridgebord`: Nord (NORD · BORDET) øverst, Syd (SYD · DIG) nederst, Vest og Øst ved siderne og kompasset i midten, med samme mål, skrift og farver som i Analyse |
| Hænderne | skrevet som i Analyse: "♠" og kortene med honnørerne E K D B 10 i fed; ingen kortfelter med kant |
| Kort, der kan spilles | er knapper inde i hånden: hvert kort mindst 44 px trykflade, uden synlig kant. Når hånden er i turen, får dens kort fladen `accent-soft` og kanten `accent`, som andre valgbare elementer; ellers står de som almindelig tekst og er deaktiveret. Skærmlæsere hører fx "Nord: dronning"; fokusringen er synlig |
| Vest og Øst | som i Analyse: "♠ ?" med antallet af kort, fx "♠ ? (3 kort)"; når spillet er slut, de rigtige kort |
| Kompasset | N, V, Ø og S som i Analyse. Før første udspil står "… mangler" i midten som i Analyse. Under spillet står stikkets kort ved hver sides bogstav i kompasset (fx "N D" øverst), og det seneste stik bliver stående, til næste udspil; `aria-live` som i dag |
| Resten | overskriften "Spil den selv" med ⓘ, "Dine stik: 0 · mål 3", knappen Luk, forbindelserne, prompten ("Spil ud fra bordet eller hånden.") og resultatet er uændrede |
| Mobil | ved 390 px er der ingen vandret rulning; Vest og Øst må stå over og under kompasset, hvis der ikke er plads ved siden af, som i Analyse |

## Accepttest

- [x] Ved 1440 px står forsiden centreret: overskriften og sprogknappen øverst, I dag over hele bredden med knappen til højre, og de tre grupper side om side med kortene under hinanden.
- [x] Ved 1024 px står de tre grupper stadig side om side; ved 900 px er forsiden præcis som i dag.
- [x] Ved 390 px er forsiden uændret, pixel for pixel mod `v25-foer-forside-bred` (skærmbillede før og efter).
- [x] Sessioner og sporenes skærme står i midten ved 1440 px og er ellers uændrede.
- [x] Sporets ⓘ står i kortet fra 1000 px, åbner forklaringen og kan bruges med tastatur; trykfladen er mindst 44 px.
- [x] Ingen vandret rulning ved nogen bredde fra 320 til 1920 px.
- [x] `npm test` er grøn, også `src/theme.test.ts` og `src/tokens.test.ts`.
- [x] Claude Code viser skærmbilleder ved 390, 900, 1024 og 1440 px, før der flettes.
- [x] Ved 1440 px er ingen knap på forsiden bredere end 480 px (Franks tilføjelse 30. oktober 2026, se Afklaret 13–14).

Del 3:

- [x] Spil den selv viser bordet med kompas i `table` og hænderne som "♠ D432", præcis som Bridgebord i Analyse (skærmbilleder af begge ved 390 og 1440 px side om side).
- [x] Kortene i den hånd, der er i turen, kan vælges med mus, tryk og tastatur; de andre er deaktiverede. Trykfladen er mindst 44 px.
- [x] Stikkets kort står i kompasset ved den rigtige side, og det seneste stik står, til næste udspil.
- [x] Bridgebord i Analyse, facit og opgaverne er uændret (skærmbilleder før og efter).
- [x] Spillet, modspillet og bedømmelsen er uændrede: de eksisterende tests af Spil den selv (også `spilselv-forbindelser.test.tsx`) er grønne.
- [x] Teksterne findes på dansk og engelsk, og `src/theme.test.ts` er grøn (ingen nye farver; `table`, `table-text`, `accent` og `accent-soft` er de eneste farver i bordet).

Rettelserne på grenen `forside-bred-2` (Franks valg 30. oktober 2026, se Afklaret 21–24; tagget før er `v26-foer-forside-bred-2`):

- [ ] Fra 1000 px følger Vejledning og Indstillinger gruppernes tre kolonner: Vejledning fylder de to første, og Indstillinger den tredje, med samme kanter som grupperne.
- [ ] Indstillingers ⓘ står inde i knappen som sporenes ⓘ i kortet, åbner forklaringen under knappen og har en trykflade på mindst 44 px.
- [ ] Vest og Øst i Spil den selv står ved siderne af kompasset ved alle bredder (320, 390, 480 og 1440 px), som i Analyse, med "♠ ?" og antallet af kort på en linje for sig, fx "4 kort" ("4 cards" på engelsk). Når spillet er slut, står de rigtige kort.
- [ ] Stikket i kompasset står som små hvide kort (`card-face`, kant i `card-edge`, `card-ink`) ved hver side, og bogstaverne N, V, Ø og S står som før; det seneste stik står til næste udspil.
- [ ] Under 1000 px er forsiden uændret, og Bridgebord i Analyse, facit og opgaverne er uændret.
- [ ] Ingen vandret rulning, og `npm test` er grøn. Skærmbillederne i `C:\Users\frank\Kontraktbridge\skaermbilleder\forside-bred\` er opdateret.

## Afklaret

1. **Tegning B** er valgt: grupperne side om side (Franks valg 30. oktober 2026).
2. **Grænsen er 1000 px.** Under den er appen en mobilapp som i dag.
3. **Kun forsiden** bliver bred; træningsskærmene bliver i én kolonne, fordi appen mest bruges på telefonen.
4. **Sporets ⓘ** flyttes ind i kortet på den brede forside i stedet for at blive fjernet, så forklaringerne stadig findes.
5. **Ingen ny tekst:** linjen "Opslagsværk – ingen daglig session" på Analyse-kortet i mockuppen kommer ikke med.
6. **Bordet i Spil den selv** følger designsystemets standard for bridgebordet med kompas og hænder som i systemnotatet; kortene kan stadig vælges direkte i hånden (Franks ønske 30. oktober 2026).
7. **Del 1 kunne ikke genskabes** (30. oktober 2026): i Chrome står forsiden og alle sporenes skærme i midten ved 1360 px (`main` 433–913 af 1345 px, rullebjælken fraregnet), både i `v25-foer-forside-bred` bygget lokalt og på www.kontraktbridge.dk, med og uden data. Frank valgte at gå videre til del 2 uden en rettelse; accepttesten for sessioner og sporenes skærme ved 1440 px gælder stadig.
8. **Kolonnernes bredde er `flex: 1 1 280px`**, ikke 300 px (Claude Codes valg, godkendt af Frank 30. oktober 2026): med Windows' rullebjælke (15 px) er der 945 px til kolonnerne ved 1024 px, og 3 × 300 + 2 × 24 = 948 px, så den tredje gruppe ville falde ned. Med 280 px står de tre side om side fra 1000 px.
9. **Tagget før ændringen** er `v25-foer-forside-bred` (accepttesten nævnte `v18-foer-forside-bred`; godkendt af Frank 30. oktober 2026).
10. **Accepttesten i koden** (`src/app/forside-bred.test.tsx`) låser markuppen, som CSS'en bygger på (klassen `home`, beholderen `home-groups`, kortet før ⓘ), og at det brede layout kun står i `@media (min-width: 1000px)`; uden for den er `home-groups` kun `display: contents`, så forsiden under 1000 px er som i dag. Layoutet i en rigtig browser tjekkes med skærmbillederne.
11. **Trykfladen for sporets ⓘ i kortet** er 44 × 44 px (`inset: -10px` på `::after`): `::after` regnes fra indersiden af ⓘ-cirklens kant (24 px), ikke fra de 26 px. Appens øvrige ⓘ har `inset: -9px -6px` og dermed en trykflade på 36 × 42 px; den er ikke ændret, da den ligger uden for afgrænsningen.
12. **Del 2 i en rigtig browser** (Chrome, 30. oktober 2026): ingen vandret rulning ved 320, 390, 600, 900, 999, 1000, 1024, 1280, 1440 og 1920 px på dansk og engelsk; fra 1000 px er forsiden centreret og højst 1200 px, de tre grupper står side om side (291 px hver ved 1000 px, 299 px ved 1024 px), I dag-knappen står til højre (283 px på dansk, 311 px på engelsk), topbjælkens indhold starter ved forsidens indhold, og sporets ⓘ står i kortet. Forsiden ved 320, 390, 600 og 900 px og sporenes skærme, Indstillinger, Vejledning og en Fordeling-session ved 1440 px er ens byte for byte med `v25-foer-forside-bred`.
13. **Vejledning og Indstillinger** (Franks valg 30. oktober 2026): fra 1000 px står de side om side som to kolonner. Knapperne i Velkomst, Vejledning og Indstillinger har deres naturlige bredde, dog mindst 280 px som knappen i I dag. Uden ny markup: forsidens rod er fra 1000 px et grid med to kolonner, hvor alt andet spænder over begge.
14. **Sidefoden** (Franks valg 30. oktober 2026): fra 1000 px står sidefodens kolonner (Om mig, Trænere, Opslag og Kontakt) side om side som på www.kontraktbridge.dk, inden for forsidens 1200 px; ophavslinjen står under dem. Det gælder sidefoden på forsiden; under 1000 px og på sporenes skærme er den uændret.
15. **Skærmbillederne** ligger i `C:\Users\frank\Kontraktbridge\skaermbilleder\forside-bred\`, uden for repoerne, så de kan deles og ikke kommer i git (Franks valg 30. oktober 2026).
16. **Skærmlæsernes navne på kortene** er de samme som før ("bordet: D", "din hånd: 3", på engelsk "dummy: Q"), ikke specens eksempel "Nord: dronning" (Claude Codes valg): de eksisterende tests af Spil den selv, som skal være grønne, finder kortene ved de navne.
17. **Vest og Øst på en smal skærm** står ved siden af kompasset, når bordet er mindst ni trykflader bredt (396 px), og ellers over og under det. Komponentreglen tillader ingen media queries, så `flex-basis: calc((var(--touch-min) * 9 - 100%) * 999)` bliver hele bredden under grænsen og 0 over den. Ved 320 og 390 px står de over og under kompasset; i appens kolonne på 480 px og i Analyse står de ved siden af.
18. **Kompasset i spillet** er før første udspil som i Analyse (N, V, Ø, S og "… mangler"). Under spillet står kortet ved sidens bogstav ("N 4", "V 9", "10 Ø", "S K"); Østs kort står inden for bogstavet, så kortene vender mod midten, og et kort uden for farven står som "–". Kompasset har `aria-live="polite"` med navnet Stikket, og skærmlæsere hører sidens navn ("Nord 4").
19. **Bridgebord uden `play`** giver præcis samme markup som i `v25-foer-forside-bred` (`ui/spilselv-bord.test.tsx` sammenligner HTML'en), og Analyse ved 390 og 1440 px og Farvebehandlings introduktion ved 390 og 1440 px er ens byte for byte med v25.
20. **Del 3 i en rigtig browser** (Chrome, 30. oktober 2026): Spil den selv med K 7 6 5 / 4 3 2 og to kombinationer med 7 kort i en hånd (E B 8 7 6 5 4 / K 3 2 og E D B 5 4 3 2 / 8 7 6) ved 320, 390, 480 og 1440 px på dansk og engelsk: ingen vandret rulning, kortene er mindst 44 × 44 px, og stikket står med 4 kort i kompasset. `npm test` er grøn (731 tests).
21. **Vejledning og Indstillinger i tre kolonner** (Franks valg 30. oktober 2026, afløser Afklaret 13 for Indstillinger): fra 1000 px er forsidens grid tre lige brede kolonner med 24 px imellem, ligesom grupperne. Vejledning fylder de to første og Indstillinger den tredje; Indstillinger-knappen fylder kolonnen (mindst 291 px ved 1000 px), og dens ⓘ står inde i knappen ved højre kant som sporenes ⓘ i kortet, med en trykflade på 44 × 44 px. Knappen i Vejledning og knapperne i Velkomst har stadig deres naturlige bredde, mindst 280 px.
22. **Vest og Øst ved siderne af kompasset ved alle bredder** (Franks valg 30. oktober 2026, afløser Afklaret 17): bordet i Spil den selv bruger Analyses grid, og Nord og Syd står over hele bredden, så hænderne har plads. Under "♠ ?" står antallet af kort på en linje for sig, fx "4 kort" / "4 cards" (`playCount` i `texts.ts`, i stedet for "? (4 kort)"), så Vest og Øst er smalle nok ved 390 og 320 px. Når spillet er slut, står de rigtige kort, og de må bryde over flere linjer. Den eksisterende test i `FarvebehandlingScreen.test.tsx`, der søgte efter "? (n kort)", søger nu efter "n kort".
23. **Stikket som små hvide kort** (Franks valg 30. oktober 2026, afløser accepttestens "table, table-text, accent og accent-soft er de eneste farver i bordet"): hvert spillet kort står som et lille spillekort med kortets værdi over ♠ i `card-face` med kant i `card-edge` og tekst i `card-ink`, ved sidens bogstav. Kort-tokens findes allerede i `tokens.json` (Lynaflæsning bruger værdierne); de står nu også som variabler i `:root` i `styles.css`, så farvebehandlingen kan bruge dem uden rå farver. Farvebehandlingen viser altid ♠, så `card-red` (♥ og ♦) bruges ikke endnu.
24. **Skærmlæsere** hører stadig sidens navn og kortet ("Nord 4"); farvetegnet på de små kort er skjult for dem, da farven altid er den samme.
