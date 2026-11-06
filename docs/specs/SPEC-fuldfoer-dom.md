# SPEC-fuldfoer-dom

5. november 2026 · Franks valg (svar på forslagene i SPEC-moensterkort-bred.md og punktet om for få mønstre); opgaver med `all: false` og rangen som tal afgjort af Frank 6. november 2026. Bygges på grenen `fuldfoer-dom`; `main` før er tagget `v41-foer-fuldfoer-dom`. Godkendt af Frank, flettet og udgivet 6. november 2026 (`4b17892`); den udgivne app er tjekket, og grenen er slettet.

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

- [x] **Antallet, der mangler (`all: true`):** for "Øst har vist 4♦ og 4♣" (mulige: 4-4-3-2, 4-4-4-1, 5-4-4-0) mangler der 2 for svaret 4-4-3-2, 1 for 4-4-3-2 og 4-4-4-1, 0 for alle tre og 2 for 4-4-3-2 og et umuligt mønster.
- [x] **Antallet, der mangler (`all: false`):** for "Vest har vist 5♠" (10 mulige, tre skal tastes) mangler der 2 for ét tastet mønster og 0 for tre, også når de tre er forkerte. Dommen for ét tastet mønster er "✗ Forkert: der mangler 2 mønstre." / "✗ Wrong: 2 patterns are missing."
- [x] **Sessionen** (jsdom, `src/app/App.test.tsx`): svaret 4-4-3-2 alene giver "✗ Forkert: der mangler 2 mønstre." og på engelsk "✗ Wrong: 2 patterns are missing."; to af tre giver "✗ Forkert: der mangler 1 mønster." og "✗ Wrong: 1 pattern is missing.". Scoren og XP er som i dag.
- [x] **Facit (`all: true`):** "Vest har vist 5♥ og 4♣" med Vests faktiske 5-4-2-2 tastet først giver "Rækkefølgen er efter hyppighed. Vests hånd var den næsthyppigste." (5-4-3-1 er hyppigst: 7436 mod 6084 og 1430 måder at fordele ♠ og ♦ på). Med Øst står "Østs hånd …", og på engelsk "East's hand …". Er den faktiske hånd hyppigst, eller er det første tastede mønster et andet, står sætningen ikke.
- [x] **Facit (`all: false`):** "Vest har vist 5♠" med den faktiske 5-5-2-1 tastet først giver "… Vests hånd var nr. 4 i hyppighed." (engelsk "… West's hand was no. 4 by frequency."), 5-5-3-0 "nr. 5 i hyppighed" og 5-4-2-2 "den tredjehyppigste".
- [x] De engelske skærme har ingen dansk (`src/modes/i18n.test.tsx`), og fagords- og bydeformtestene er grønne.
- [x] `npm test`, kørt alene, er grøn.
- [x] **Billederne:** dommen og facit på dansk og engelsk ved 1280 og 390 px for "Øst har vist 4♦ og 4♣" med 4-4-3-2 alene og for "Vest har vist 5♥ og 4♣" med 5-4-2-2 først, i `../skaermbilleder/fuldfoer-dom/`.

## Afklaret

1. **Opgaver med `all: false`** (Franks valg 6. november 2026, før under Til afgørelse): opgaven nævner antallet, og der er flere mulige mønstre end tre, så "mulige mønstre, der ikke er tastet" ville give 8–12. Her er N derfor `count` minus de tastede, fx "✗ Forkert: der mangler 1 mønster." for to tastede. Er der tastet `count` mønstre, er dommen som i dag, også når de er forkerte.
2. **Rangen fra 4** står som tal: "nr. 4 i hyppighed", "nr. 5 i hyppighed" osv. (Franks valg 6. november 2026). Sætningen i facit gælder begge opgavetyper.
3. **Dommen** skifter kun, når svaret er forkert (score 0). Et svar med for få mønstre er altid forkert, så scoren, XP og Leitner er som før, og "½ Halv score …" og "✓ Rigtigt" er uændrede. Teksten afløser "✗ Forkert" i dommens titel; XP, tiden og Næste står som før (`missingCount` og `missingVerdict` i `task.ts`, `FeedbackBar` i `SessionScreen.tsx`).
4. **Sætningen i facit** står i en linje for sig under "Vest havde …", i samme grå som linjerne over (`orderText` i `task.ts`). Den regnes ud fra de mulige mønstre i opgaven, så den gælder også opgaver med `all: false`, hvor den faktiske hånd kan ligge uden for de tre hyppigste.
5. **Testene:** `task.test.ts` (5 nye: antallet, der mangler, for begge opgavetyper, dommen i ental og flertal og sætningen ved rang 2–5), `CompleteView.test.tsx` (ny, 3: sætningen står efter "Vest havde …", ikke når et andet mønster er tastet først, og ved `all: false`) og `App.test.tsx` (4 nye: sessionen på dansk og engelsk med ét og to af tre mønstre; dommen er stadig forkert med +0 XP). `npm test`, kørt alene: 843 tests i 119 filer i orden. Fagordstesten (`src/sprog/sprog.test.ts`) og bydeformtesten (`src/sprog/bydeform.test.ts`) er grønne, og `node scripts/sprogtjek.ts` finder ingen ukendte ord.
6. **Billederne** (`../skaermbilleder/fuldfoer-dom/<bredde>-<sprog>-<opgave>.png`) er taget i appen med faste seeds og et fast tidspunkt som `scripts/tjek-bred-layout.mjs`, hvert i en ny browserkontekst. `oest-4d4c-4432` er Fordelings første opgave for en ny bruger, "Øst har vist 4♦ og 4♣", med 4-4-3-2 alene. `vest-5h4c-5422` er niveauøvelsen for 5-4-2-2, "Vest har vist 5♥ og 4♣", med 5-4-2-2 alene (dommen og sætningen), og `vest-5h4c-5422-alle-tre` med 5-4-2-2, 5-4-3-1 og 5-4-4-0 (halv score som før og sætningen). Den sidste opgave kræver et gemt lager, hvor 4-4-3-2, 5-3-3-2 og 5-4-3-1 er indført, og intet er forfaldent, og seed 33; scripterne og lageret ligger uden for repoet.
7. **Den udgivne app** (6. nov. 2026): på www.kontraktbridge.dk/fordelingstraeneren/ giver "Øst har vist 4♦ og 4♣" med 4-4-3-2 alene "✗ Forkert: der mangler 2 mønstre." / "✗ Wrong: 2 patterns are missing.", og "Vest har vist 5♥ og 4♣" med 5-4-2-2 først giver i facit "Rækkefølgen er efter hyppighed. Vests hånd var den næsthyppigste." / "The order is by frequency. West's hand was the second most frequent.", også med alle tre tastet (halv score som før). Tjekket kørte appens egen session med samme faste seeds og lager som billederne, hver i en ny browserkontekst (`../skaermbilleder/fuldfoer-dom/udgivet-1280-<sprog>-<opgave>.png`).
