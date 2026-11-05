# SPEC-info-boks

4. november 2026 · Franks valg. Bygget på grenen `info-boks`; `main` før er tagget `v36-foer-info-boks`.

En ⓘ i bordets faste spalte (fx Problemet) skubber i dag bordet ned, når den åbnes. Den skal i stedet åbne som en boks oven på indholdet, forankret ved knappen.

## Afgrænsning

| Sted | Må ske | Må ikke ske |
| --- | --- | --- |
| `src/ui/Info.tsx` | en ⓘ i `.wide-left` fra 1000 px åbner som en boks | ændre teksterne |
| ⓘ under 1000 px og i andre kort | intet | åbne som boks |
| Bordets spalte | intet, også når boksen er åben | flytte sig, få z-index |

## Krav

1. **Boksen** ligger oven på indholdet, forankret ved ⓘ, og bordet flytter sig ikke.
2. **Boksen lukkes** med ✕, Esc eller et klik udenfor, og fokus går tilbage til ⓘ.
3. **På mobil og i andre kort** er ⓘ, som den er.

## Accepttest

- [x] Ved 1280 × 900 og 1000 × 700 åbner Problemets ⓘ en boks: bordet flytter sig ikke, spalten er samme højde, og boksen ligger ved knappen og inden for vinduet.
- [x] ✕, Esc og et klik udenfor lukker boksen, og fokus står på ⓘ bagefter.
- [x] Linjernes ⓘ åbner i kortet som før; ved 390 px åbner Problemets ⓘ i kortet som før.
- [x] `npm test` og `node scripts/tjek-bred-layout.mjs` er grønne; under 1000 px er skærmene pixel for pixel som før.

Giv Frank skærmbilleder ved 1280 og 390 px med Problemets ⓘ åben. Frank godkender, før der flettes.

## Afklaret

1. **Hvilke ⓘ:** alle ⓘ inde i `.wide-left` fra 1000 px, også når spalten er for høj til at stå fast og ruller med. Det afgøres, når ⓘ trykkes, så en ændret vinduesbredde gælder fra næste tryk.
2. **Boksen ligger i `document.body`** med `position: fixed`. Spalten står fast og er sin egen stablingskontekst, så en boks inde i spalten ville ligge under dele af højre spalte, og den ville gøre spalten højere i `BoardColumn`s måling. Spalten har derfor stadig ingen z-index (Del 2 af `SPEC-design-som-forsiden.md`); det er kun boksen, der ligger oven på.
3. **Placering:** under ⓘ med venstre kant ved knappen, inden for vinduet med 16 px luft. Er der ikke plads under knappen, ligger boksen over den, så knappen stadig kan ses. Er der heller ikke plads dér, ligger den så højt, at den er inden for vinduet, og den dækker da knappen. Er den højere end vinduet, kan den rulles. Den følger knappen, når siden rulles. Boksen er 640 px bred, så Problemets seks emner kan være over knappen ved 1280 × 900.
4. **Fokus:** når boksen åbner, står fokus på ✕, og Tab bliver i boksen, for ✕ er det eneste, der kan vælges dér. Skærmlæsere hører boksen som en dialog med ⓘ's emne som navn.
5. **En ⓘ ad gangen:** et klik på en anden ⓘ er et klik udenfor og lukker boksen; det andet klik gælder stadig den anden ⓘ, men fokus går tilbage til den første ⓘ, kun hvis der ikke blev klikket på noget, der selv tager fokus.
