# SPEC-moensterkort-bred

5. november 2026 · Franks fund. Bygget på grenen `moensterkort-bred`; appen før er tagget `v38-foer-moensterkort-bred`. Frank godkender, før der flettes.

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

- [ ] `node scripts/tjek-bred-layout.mjs`: ved 1000, 1280 og 1920 px står mønsterkortet under Næste og ledetråden i højre spalte, med samme venstre og højre kant som dommen og opgaven (± 1 px), og intet på siden stikker ud til siden.
- [ ] Samme skærme: bordets spalte dækker ikke noget, og intet element i sessionen går ud over skærmens indhold.
- [ ] Ved 999 og 390 px er alle skærme pixel for pixel som `v38-foer-moensterkort-bred`, også dommen og ledetråden i Fordeling.
- [ ] `npm test`, kørt alene, er grøn.

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

Udfyldes, når ændringen er bygget.
