# SPEC-fuldfoer-dom

5. november 2026 · Franks valg (svar på forslagene i SPEC-moensterkort-bred.md og punktet om for få mønstre); opgaver med `all: false` og rangen som tal afgjort af Frank 6. november 2026. Bygges på grenen `fuldfoer-dom`; `main` før er tagget `v41-foer-fuldfoer-dom`. Frank godkender, før der flettes.

To ændringer i Fuldfør (`src/modes/complete/`):

1. **Dommen ved for få mønstre.** I dag giver et svar med færre mønstre, end opgaven beder om, "✗ Forkert" uden forklaring, også når det tastede mønster er det hyppigste. Det gælder fx "Øst har vist 4♦ og 4♣" og svaret 4-4-3-2 alene. Fremover siger dommen, hvor mange der mangler:
   - "✗ Forkert: der mangler N mønstre." / "✗ Wrong: N patterns are missing."
   - ental ved 1: "✗ Forkert: der mangler 1 mønster." / "✗ Wrong: 1 pattern is missing."
   - **Opgaver med `all: true`** ("Hvilke mønstre er mulige? Hyppigste først."): N er antallet af mulige mønstre, der ikke er tastet. Et tastet mønster, der ikke er muligt her, tæller ikke med; facit siger allerede "Ikke muligt her: …".
   - **Opgaver med `all: false`** ("Hvilke tre mønstre er hyppigst?", Franks valg 6. november 2026): N er `count` minus antallet af tastede mønstre.
   - Er N = 0, er dommen som i dag: alle mulige mønstre er tastet (`all: true`), eller der er tastet `count` mønstre (`all: false`), også når de er forkerte.
2. **Facit, når svaret var den faktiske hånd** (begge opgavetyper): er spillerens første mønster den faktiske hånds mønster (`task.patternId`), men et andet mønster hyppigere, står efter "Vest havde …" i facit:

   | Rang | Dansk | Engelsk |
   | --- | --- | --- |
   | 2 | Rækkefølgen er efter hyppighed. Vests hånd var den næsthyppigste. | The order is by frequency. West's hand was the second most frequent. |
   | 3 | Rækkefølgen er efter hyppighed. Vests hånd var den tredjehyppigste. | The order is by frequency. West's hand was the third most frequent. |
   | 4, 5, … | Rækkefølgen er efter hyppighed. Vests hånd var nr. 4 i hyppighed. (nr. 5 osv.) | The order is by frequency. West's hand was no. 4 by frequency. (no. 5 etc.) |

   - Vest eller Øst følger opgaven (`task.seat`): "Vests" / "Østs" og "West's" / "East's" (Franks valg).
   - Rangen er husets delte rang: 1 + antal strengt hyppigere mulige mønstre. Er den faktiske hånd delt hyppigst (rang 1), står sætningen ikke.
   - Mønsterkortet under Næste viser den faktiske hånds mønster, og derfor er sætningen nyttig: det kan ellers se ud, som om den faktiske hånd var svaret.

## Afgrænsning

| Sted | Må ske | Må ikke ske |
| --- | --- | --- |
| Dommen i Fordelings session for Fuldfør | "der mangler N mønstre" efter "Forkert" | scoren, XP, Leitner eller de andre dommes tekst ændres |
| Facit i Fuldfør | sætningen om rækkefølgen | tabellen, "Dit svar" og "Vest havde …" ændres |
| Svar-knappen og tastaturet | intet | knappen venter på et bestemt antal (forslag a er fravalgt) |
| Andre opgavetyper og spor | intet | noget ændres |

## Accepttest

- [ ] **Antallet, der mangler (`all: true`):** for "Øst har vist 4♦ og 4♣" (mulige: 4-4-3-2, 4-4-4-1, 5-4-4-0) mangler der 2 for svaret 4-4-3-2, 1 for 4-4-3-2 og 4-4-4-1, 0 for alle tre og 2 for 4-4-3-2 og et umuligt mønster.
- [ ] **Antallet, der mangler (`all: false`):** for "Vest har vist 5♠" (10 mulige, tre skal tastes) mangler der 2 for ét tastet mønster og 0 for tre, også når de tre er forkerte. Dommen for ét tastet mønster er "✗ Forkert: der mangler 2 mønstre." / "✗ Wrong: 2 patterns are missing."
- [ ] **Sessionen** (jsdom, `src/app/App.test.tsx`): svaret 4-4-3-2 alene giver "✗ Forkert: der mangler 2 mønstre." og på engelsk "✗ Wrong: 2 patterns are missing."; to af tre giver "✗ Forkert: der mangler 1 mønster." og "✗ Wrong: 1 pattern is missing.". Scoren og XP er som i dag.
- [ ] **Facit (`all: true`):** "Vest har vist 5♥ og 4♣" med Vests faktiske 5-4-2-2 tastet først giver "Rækkefølgen er efter hyppighed. Vests hånd var den næsthyppigste." (5-4-3-1 er hyppigst: 7436 mod 6084 og 1430 måder at fordele ♠ og ♦ på). Med Øst står "Østs hånd …", og på engelsk "East's hand …". Er den faktiske hånd hyppigst, eller er det første tastede mønster et andet, står sætningen ikke.
- [ ] **Facit (`all: false`):** "Vest har vist 5♠" med den faktiske 5-5-2-1 tastet først giver "… Vests hånd var nr. 4 i hyppighed." (engelsk "… West's hand was no. 4 by frequency."), 5-5-3-0 "nr. 5 i hyppighed" og 5-4-2-2 "den tredjehyppigste".
- [ ] De engelske skærme har ingen dansk (`src/modes/i18n.test.tsx`), og fagords- og bydeformtestene er grønne.
- [ ] `npm test`, kørt alene, er grøn.
- [ ] **Billederne:** dommen og facit på dansk og engelsk ved 1280 og 390 px for "Øst har vist 4♦ og 4♣" med 4-4-3-2 alene og for "Vest har vist 5♥ og 4♣" med 5-4-2-2 først, i `../skaermbilleder/fuldfoer-dom/`.

## Afklaret

1. **Opgaver med `all: false`** (Franks valg 6. november 2026, før under Til afgørelse): opgaven nævner antallet, og der er flere mulige mønstre end tre, så "mulige mønstre, der ikke er tastet" ville give 8–12. Her er N derfor `count` minus de tastede, fx "✗ Forkert: der mangler 1 mønster." for to tastede. Er der tastet `count` mønstre, er dommen som i dag, også når de er forkerte.
2. **Rangen fra 4** står som tal: "nr. 4 i hyppighed", "nr. 5 i hyppighed" osv. (Franks valg 6. november 2026). Sætningen i facit gælder begge opgavetyper.
