# SPEC-notation-sidninger

20. oktober 2026 · Frank

Sidningstabellen i farvebehandling får en kompakt notation. En række i tabellen samler allerede de konkrete sidninger, der kun adskiller sig i små kort (fx Kx–xx, hvor x kan være 9, 8 eller 7). Det står ikke, hvor mange sidninger rækken dækker, og chancen står kun samlet. Fremover viser rækken antallet, fx Kx–xx (3), og både den samlede chance og chancen pr. sidning. Mellemoverskrifterne får gruppens samlede chance og antal sidninger.

Løseren, dataene og grupperingen ændres ikke. Det er kun visningen.

## Afgrænsning

Før arbejdet starter:

1. Commit og tag den nuværende app, fx `v9-foer-notation`.
2. Arbejd på grenen `notation-sidninger`, og flet først ind efter godkendelse.
3. Kør alle eksisterende tests før og efter. De skal bestå uændret, undtagen de tests, der låser tabellens tekst; dem retter Claude Code og nævner under Afklaret.

| Sted | Må ske | Må ikke ske |
| --- | --- | --- |
| `analysis.ts` | `BandField` får `count` (antal konkrete sidninger) og `each` (chance pr. sidning); `compactLayout` får antallet med | ændre felternes rækkefølge, id'er, chancer eller resultater |
| `ui/Analysevindue.tsx` (`LayoutList`) | antal i Vest–Øst-cellen, chance pr. sidning under den samlede chance, sum og antal i mellemoverskrifterne | ændre kolonnerne, "afgør", valget af række eller rullekassen |
| `ui/Facit.tsx` | samme visning, fordi Facit bruger `LayoutList` | ændre facits indhold i øvrigt |
| `ui/texts.ts` | nye tekster på dansk og engelsk med ⓘ | — |
| Sandsynlighedsbåndet | intet | alt |
| Løseren, appens data, lagring, tokens | intet | alt |
| `SPEC-farvebehandling.md` | opdateres i samme commit som adfærden (CLAUDE.md) | — |

Kræver noget alligevel en ændring ud over tabellen, skal Claude Code stoppe og spørge.

Besked til Claude Code:

> Læs CLAUDE.md, SPEC-farvebehandling.md og SPEC-notation-sidninger.md. Byg specen på grenen `notation-sidninger`, skriv accepttestene først, og stop, når testene er grønne, så jeg kan godkende. Kun visningen ændres; felterne, chancerne og rækkefølgen er de samme som i dag.

## Notationen

En række i tabellen er et felt i båndet (`BandField`): en abstrakt sidning foldet ud i konkrete honnørplaceringer. I et hul, hvor alle kort er 10 eller højere, vises kortene konkret. I et hul med små kort vises kortene som x, og alle måder at vælge de små kort på er samlet i rækken.

- **Antal:** `count` er antallet af konkrete sidninger i rækken, dvs. produktet over hullerne med små kort af C(hullets størrelse, Vests antal i hullet). Med kendte kort eller hp-grænse tælles kun de sidninger, situationen tillader.
- **Chance pr. sidning:** `each` = rækkens chance / `count`. Alle sidninger i en række har samme chance, fordi de har samme antal kort hos Vest.
- **Kort form:** `compactLayout` skriver rækken uden mellemrum med antallet i parentes, når det er større end 1: `Kx–xx(3)`, `K–xxx`, `Kxxx–renonce`. Den korte form bruges, hvor `compactLayout` bruges i dag (fx "Linjerne er uenige i 3 sidninger: …").

## Visningen i tabellen

| Kolonne | I dag | Fremover |
| --- | --- | --- |
| Vest | `K x` | `K x` |
| Øst | `x x` | `x x` og antallet, når det er over 1: `x x (3)` |
| Chance | `20,35 %` | `20,35 %` og under det i mindre tekst `3 × 6,78 %`, når antallet er over 1 |

- **Mellemoverskrifter:** gruppens samlede chance og antal sidninger efter navnet, fx "2–2 · 40,70 % · 6 sidninger" (gruppering efter fordeling) eller "K · 50,00 % · 8 sidninger" (gruppering efter honnører).
- **De afgørende sidninger** står først som i dag, uden mellemoverskrift. Over dem står det samlede antal og chance, fx "Afgør: 4 sidninger · 25,00 %".
- **Skærmlæser:** rækkens knap siger fx "Vest K x, Øst x x, 3 sidninger på hver 6,78 %, i alt 20,35 %".
- **ⓘ** ved Chance-overskriften forklarer: "Rækken samler sidninger, der kun adskiller sig i små kort (x). Tallet i parentes er antallet af sidninger; under chancen står chancen for hver af dem."
- **Bredde:** tabellen må ikke blive bredere end i dag på 390 px. Antallet står i Øst-cellen og chancen pr. sidning under den samlede chance, så der kommer ingen ny kolonne.

## Accepttest

Facitværdierne er a priori-chancer, regnet med `layoutChance`.

- [ ] Alle eksisterende tests består; tests, der låser tabellens tekst, er rettet og nævnt under Afklaret.
- [ ] E D B 10 / 6 5 4 3 2, mål 5: rækken Kx–xx har `count` 3, chancen 20,35 % og `each` 6,78 %.
- [ ] Samme kombination: x–Kxx har `count` 3, 18,65 % og 6,22 % pr. sidning; K–xxx har `count` 1 og 6,22 % uden "1 ×".
- [ ] Samme kombination: Kxxx–renonce har `count` 1 og 4,78 %: de tre små kort (9, 8 og 7) sidder alle hos Vest, så der er kun én måde.
- [ ] Samme kombination, gruppering efter fordeling: mellemoverskriften for 2–2 er "2–2 · 40,70 % · 6 sidninger".
- [ ] For hver kombination i banken og hvert mål er summen af `count` over rækkerne lig med antallet af konkrete sidninger (2^n med n manglende kort), og summen af `count × each` er lig med summen af rækkernes chance (100 %).
- [ ] Med situationen Vest 5 og Øst 2 kendte kort: Kx–xx har `count` 3 og chancen 3 × `each`, hvor `each` er `layoutChance` med de ledige pladser.
- [ ] `compactLayout` giver `Kx–xx(3)`, `K–xxx` og `Kxxx–renonce`.
- [ ] Ved 390 px er `document.documentElement.scrollWidth` lig med skærmbredden i Analyse og i Facit.
- [ ] Alle nye tekster findes på dansk og engelsk, og de engelske skærme indeholder ingen dansk tekst.

## Afklaret

1. **Ingen ny gruppering.** Rækkerne er de samme som i dag; notationen viser kun, hvor mange sidninger hver række allerede samler.
2. **Honnører over 10'eren** vises fortsat konkret, også når de ligger i samme hul. Kun små kort samles som x.
3. **Båndet** er uændret: dets felter er rækkerne, og bredden er rækkens samlede chance.

Åbne punkter: Claude Code skriver her, hvilke tests der låste tabellens tekst og er rettet.
