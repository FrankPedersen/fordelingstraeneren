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

Del 3:

- [ ] Spil den selv viser bordet med kompas i `table` og hænderne som "♠ D432", præcis som Bridgebord i Analyse (skærmbilleder af begge ved 390 og 1440 px side om side).
- [ ] Kortene i den hånd, der er i turen, kan vælges med mus, tryk og tastatur; de andre er deaktiverede. Trykfladen er mindst 44 px.
- [ ] Stikkets kort står i kompasset ved den rigtige side, og det seneste stik står, til næste udspil.
- [ ] Bridgebord i Analyse, facit og opgaverne er uændret (skærmbilleder før og efter).
- [ ] Spillet, modspillet og bedømmelsen er uændrede: de eksisterende tests af Spil den selv (også `spilselv-forbindelser.test.tsx`) er grønne.
- [ ] Teksterne findes på dansk og engelsk, og `src/theme.test.ts` er grøn (ingen nye farver; `table`, `table-text`, `accent` og `accent-soft` er de eneste farver i bordet).

## Afklaret

1. **Tegning B** er valgt: grupperne side om side (Franks valg 30. oktober 2026).
2. **Grænsen er 1000 px.** Under den er appen en mobilapp som i dag.
3. **Kun forsiden** bliver bred; træningsskærmene bliver i én kolonne, fordi appen mest bruges på telefonen.
4. **Sporets ⓘ** flyttes ind i kortet på den brede forside i stedet for at blive fjernet, så forklaringerne stadig findes.
5. **Ingen ny tekst:** linjen "Opslagsværk – ingen daglig session" på Analyse-kortet i mockuppen kommer ikke med.
6. **Bordet i Spil den selv** følger designsystemets standard for bridgebordet med kompas og hænder som i systemnotatet; kortene kan stadig vælges direkte i hånden (Franks ønske 30. oktober 2026).
7. **Del 1 kunne ikke genskabes** (30. oktober 2026): i Chrome står forsiden og alle sporenes skærme i midten ved 1360 px (`main` 433–913 af 1345 px, rullebjælken fraregnet), både i `v25-foer-forside-bred` bygget lokalt og på www.kontraktbridge.dk, med og uden data. Frank valgte at gå videre til del 2 uden en rettelse; accepttesten for sessioner og sporenes skærme ved 1440 px gælder stadig.
8. **Kolonnernes bredde er `flex: 1 1 280px`**, ikke 300 px (Claude Codes valg): med Windows' rullebjælke (15 px) er der 945 px til kolonnerne ved 1024 px, og 3 × 300 + 2 × 24 = 948 px, så den tredje gruppe ville falde ned. Med 280 px står de tre side om side fra 1000 px.
9. **Tagget før ændringen** er `v25-foer-forside-bred` (accepttesten nævnte `v18-foer-forside-bred`).
10. **Accepttesten i koden** (`src/app/forside-bred.test.tsx`) låser markuppen, som CSS'en bygger på (klassen `home`, beholderen `home-groups`, kortet før ⓘ), og at det brede layout kun står i `@media (min-width: 1000px)`; uden for den er `home-groups` kun `display: contents`, så forsiden under 1000 px er som i dag. Layoutet i en rigtig browser tjekkes med skærmbillederne.
11. **Trykfladen for sporets ⓘ i kortet** er 44 × 44 px (`inset: -10px` på `::after`): `::after` regnes fra indersiden af ⓘ-cirklens kant (24 px), ikke fra de 26 px. Appens øvrige ⓘ har `inset: -9px -6px` og dermed en trykflade på 36 × 42 px; den er ikke ændret, da den ligger uden for afgrænsningen.
12. **Del 2 i en rigtig browser** (Chrome, 30. oktober 2026): ingen vandret rulning ved 320, 390, 600, 900, 999, 1000, 1024, 1280, 1440 og 1920 px på dansk og engelsk; fra 1000 px er forsiden centreret og højst 1200 px, de tre grupper står side om side (291 px hver ved 1000 px, 299 px ved 1024 px), I dag-knappen står til højre (283 px på dansk, 311 px på engelsk), topbjælkens indhold starter ved forsidens indhold, og sporets ⓘ står i kortet. Forsiden ved 320, 390, 600 og 900 px og sporenes skærme, Indstillinger, Vejledning og en Fordeling-session ved 1440 px er ens byte for byte med `v25-foer-forside-bred`.
