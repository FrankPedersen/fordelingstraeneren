# SPEC-moensterkort-bred

5. november 2026 · Franks fund. Bygget på grenen `moensterkort-bred`; appen før er tagget `v38-foer-moensterkort-bred`. Godkendt af Frank, flettet og udgivet 5. november 2026 (`2eaeb49`); den udgivne app er tjekket, og grenen er slettet.

Fundet i Fordeling, niveauøvelsen ("Vest har vist 5♥ og 4♣"), i bredt layout: mønsterkortet under Næste (fx "5-4-2-2 · Station 4 · Rum 1, Lænestolen") går ud over højre spalte til vinduets kant og har ingen højre kant, mens felterne ovenover slutter ved ✕-knappen.

## Årsagen

`.memory` har `width: 100%` i `src/ui/styles.css`. Fra 1000 px får `.screen.session > .memory` også `margin-left: calc(var(--board-column) + 24px)`, så kortet står i højre spalte. Bredden er stadig hele skærmens indhold, så kortet går 444 px (spalten på 420 px og mellemrummet på 24 px) ud over højre spalte. Målt ved 1280 px: dommen står fra 524 til 1200 px og mønsterkortet fra 524 til 1644 px, og siden kan rulles 364 px til siden.

Ledetråden (`HintBox`, `.memory.hint`, knappen "Vis ledetråd") har samme klasse og samme fejl. Dommen, knappen "Vis ledetråd" og indsatsen har ingen fast bredde. `.screen` er en flex-kolonne, der strækker dem, så margenen gør dem smallere i stedet.

`scripts/tjek-bred-layout.mjs` så ikke fejlen: ingen af dens skærme viser dommen eller ledetråden i en Fordeling-session.

## Afgrænsning

| Sted | Må ske | Må ikke ske |
| --- | --- | --- |
| Mønsterkortet og ledetråden i Fordelings session fra 1000 px | følger højre spalte | indholdet ændres |
| Under 1000 px | intet | noget flytter sig; skærmene er pixel for pixel som `v38-foer-moensterkort-bred` |
| Andre skærme og spor | intet | noget ændres |

## Accepttest

- [x] `node scripts/tjek-bred-layout.mjs`: ved 1000, 1280 og 1920 px står mønsterkortet under Næste og ledetråden i højre spalte, med samme venstre og højre kant som dommen og opgaven (± 1 px), og intet på siden stikker ud til siden.
- [x] Samme skærme: bordets spalte dækker ikke noget, og intet element i sessionen går ud over skærmens indhold.
- [x] Ved 999 og 390 px er alle skærme pixel for pixel som `v38-foer-moensterkort-bred`, også dommen og ledetråden i Fordeling.
- [x] `npm test`, kørt alene, er grøn.

Kørt 5. nov. 2026 på grenen: `tjek-bred-layout.mjs` 239 tjek i orden, og `npm test` (alene) 809 tests i 116 filer i orden.

## XP i toppen og i dommen

"+5 XP" i toppen og "+0 XP" i dommen er to forskellige tal:

- **Toppen** (`session-meta` i `SessionScreen.tsx`) viser `xpText(session.xp)`: summen for hele sessionen indtil nu, også det svar, der lige er givet, og sudokuens point.
- **Dommen** (`FeedbackBar`) viser `xpText(feedback.xp)`: XP for det svar, der lige er givet, minus en betalt ledetråd.

Et forkert svar uden indsats giver 0 (`answerXp` i `src/engine/xp.ts`), og med "Sikker" −10. I Franks eksempel gav et tidligere svar i sessionen 5 XP (fx halv score i Fuldfør: 10 × ½), og det forkerte svar lagde 0 til. Begge skrives "+N XP", og det er derfor, de ligner hinanden. Koden er ikke ændret.

## Forslag til facit: svaret var den faktiske hånd

Kun et forslag til Frank, ikke bygget.

**Hvornår:** i Fuldfør, når spillerens første mønster er den faktiske hånds mønster (`task.patternId`), men et andet mønster er hyppigere. Mønsterkortet under Næste viser netop den faktiske hånds mønster (`MemoryBox` får `task.patternId`). Det kan derfor se ud, som om den faktiske hånd var svaret.

**Sætningen** står i facit efter "Vest havde 5=2=2=4.". Rangen regnes som husets delte rang (1 + antal strengt hyppigere):

| Rang | Dansk | Engelsk |
| --- | --- | --- |
| 2 | Rækkefølgen er efter hyppighed. Vests hånd var den næsthyppigste. | The order is by frequency. West's hand was the second most frequent. |
| 3 | … Vests hånd var den tredjehyppigste. | … West's hand was the third most frequent. |
| 4 eller mere | … Vests hånd var nr. 4 i hyppighed. | … West's hand was no. 4 by frequency. |

Er den faktiske hånd delt hyppigst (rang 1), står sætningen ikke. "Vests" og "Øst" følger `task.seat`.

## Afklaret

1. **Rettelsen** står i blokken for Fordelings session fra 1000 px i `src/ui/styles.css`: `.screen.session > .memory { width: auto; }`. `.screen` er en flex-kolonne, så kortet strækkes til den bredde, der er tilbage efter margenen, ligesom dommen. Det gælder både mønsterkortet under Næste og ledetråden, der har samme klasse. Under 1000 px gælder reglen ikke.
2. **Målt efter rettelsen:** mønsterkortet og ledetråden står i højre spalte med samme kanter som dommen: 476–968 px ved 1000 px, 524–1200 px ved 1280 px og 844–1520 px ved 1920 px. Ingen side ruller til siden. Før stod de til 1412, 1644 og 1964 px.
3. **Testen:** `scripts/tjek-bred-layout.mjs` har to nye skærme. `ledetråd` er Fordelings første opgave med "Vis ledetråd". `dom` er samme opgave besvaret med 4-4-3-2: med testens faste seeds er det Fuldfør, "Øst har vist 4♦ og 4♣". `iHøjreSpalte` tjekker kanterne mod højre spalte og dommen. Den tjekker også, at intet element i sessionen går ud over opgavens kanter (uden for rullekasser og sidefoden), og at siden ikke ruller vandret. `ingenOverlap` tjekker, at bordets spalte ikke dækker noget. De to skærme kommer også med i pixelsammenligningen ved 999 og 390 px. Første kørsel før rettelsen gav 15 fejl, alle i de nye tjek, og 162 ok. Efter rettelsen er alle 239 tjek grønne, også alle skærme pixel for pixel ved 999 og 390 px.
4. **Referencen** i testen er nu `v38-foer-moensterkort-bred` (før `v37-foer-sidefod`). Sidefoden er stadig skjult i sammenligningen, hvad der ikke ændrer noget, fordi den er den samme i begge.
5. **Billeder** ved 1000, 1280, 1920 og 390 px før og efter ligger i `../skaermbilleder/moensterkort-bred/` (`<bredde>-moensterkort-foer.png` og `-efter.png`). Ved 390 px er de ens.
6. **Ingen tekst og ingen adfærd er ændret**, så `SPEC.md` er uændret. Svaret om XP og forslaget til facit står ovenfor.
7. **Den udgivne app** (5. nov. 2026, efter udgivelsen af `8b04037` med begge grene): på www.kontraktbridge.dk/fordelingstraeneren/ står mønsterkortet ved 1280 px fra 524 til 1200 px, samme kanter som dommen, og siden ruller ikke til siden (`../skaermbilleder/moensterkort-bred/1280-moensterkort-sitet.png`). Forslagene om XP og facit er besvaret i SPEC-fuldfoer-dom.md.
