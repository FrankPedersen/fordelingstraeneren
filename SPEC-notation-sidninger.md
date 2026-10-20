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

- [x] Alle eksisterende tests består; tests, der låser tabellens tekst, er rettet og nævnt under Afklaret.
- [x] E D B 10 / 6 5 4 3 2, mål 5: rækken Kx–xx har `count` 3, chancen 20,35 % og `each` 6,78 %.
- [x] Samme kombination: x–Kxx har `count` 3, 18,65 % og 6,22 % pr. sidning; K–xxx har `count` 1 og 6,22 % uden "1 ×".
- [x] Samme kombination: Kxxx–renonce har `count` 1 og 4,78 %: de tre små kort (9, 8 og 7) sidder alle hos Vest, så der er kun én måde.
- [x] Samme kombination, gruppering efter fordeling: mellemoverskriften for 2–2 er "2–2 · 40,70 % · 6 sidninger".
- [x] For hver kombination i banken og hvert mål er summen af `count` over rækkerne lig med antallet af konkrete sidninger (2^n med n manglende kort), og summen af `count × each` er lig med summen af rækkernes chance (100 %).
- [x] Med situationen Vest 5 og Øst 2 kendte kort: Kx–xx har `count` 3 og chancen 3 × `each`, hvor `each` er `layoutChance` med de ledige pladser.
- [x] `compactLayout` giver `Kx–xx(3)`, `K–xxx` og `Kxxx–renonce`.
- [x] Ved 390 px er `document.documentElement.scrollWidth` lig med skærmbredden i Analyse og i Facit (målt i Chrome, se Afklaret 9).
- [x] Alle nye tekster findes på dansk og engelsk, og de engelske skærme indeholder ingen dansk tekst.

## Afklaret

1. **Ingen ny gruppering.** Rækkerne er de samme som i dag; notationen viser kun, hvor mange sidninger hver række allerede samler.
2. **Honnører over 10'eren** vises fortsat konkret, også når de ligger i samme hul. Kun små kort samles som x.
3. **Båndet** er uændret: dets felter er rækkerne, og bredden er rækkens samlede chance.
4. **Mellemoverskrifternes navne** er den korte form, accepttesten giver: fordelingen som "2–2" (Vests og Østs antal kort) og Vests honnører som "K" eller "ingen honnører" i stedet for "Vest 2 kort – Øst 2 kort" og "Vest har K" (Claude Codes valg efter accepttesten).
5. **Over de afgørende sidninger** står antallet og chancen ved det eksisterende mærke "afgør" med dets ⓘ: "[afgør] 4 sidninger · 25,00 %". Mærket og ⓘ er uændrede (Claude Codes valg).
6. **Sætningerne tæller sidninger** (Franks valg, 20. oktober 2026): "Linjerne er uenige i …" under båndet i Analyse og facit og Sammenlign-sætningen "Linje A vinder alene i …" tæller de konkrete sidninger (summen af rækkernes antal), ikke rækkerne. I den første står de tre første rækker i den korte form, og "og n til" er de øvrige sidninger. Det ændrer også `ui/linjevalg.ts` (`uniqueWinners`).
7. **ⓘ ved Chance** står i overskriftscellen. Forklaringen har almindelig tekst og ombrydes, så den ikke gør tabellen meget bredere, når den er åben.
8. **Eksemplet** E D B 10 / 6 5 4 3 2 er ikke i banken, så testene regner det med løseren og bygger det som kortvælgeren (`customItem`). Facit pr. række er a priori-chancerne fra `layoutChance`: 20,35 %, 18,65 %, 6,22 % og 4,78 %.
9. **Bredden** er målt i Chrome headless ved 390 px på en bygget app, fordi jsdom ikke regner layout: `scrollWidth` er 390 i Analyse (alle sidninger, også med ⓘ åben) og i Facit (også under "Hvorfor"). Selve tabellen i sin rullekasse er vokset fra 499 til 526 px for bankens hyppigste kombination: Øst-kolonnen fra 83 til 95 px (antallet) og Chance fra 71 til 86 px (chancen pr. sidning); med ⓘ åben 543 px. Kassen er 324 px før og efter, så siden bliver ikke bredere, men tabellen ruller lidt længere.
10. **Tabellens egen bredde:** siden bliver ikke bredere, men tabellen i sin rullekasse er 27 px bredere end før. Frank har godkendt det som det er (20. oktober 2026).

Tests, der låste tabellens tekst og er rettet:

- `src/farvebehandling/ui/layout.test.tsx`, "tabellen har én kolonne pr. viste linje …": overskrifternes tekst læses nu uden ⓘ-knappen ved Chance.
- `src/farvebehandling/ui/layout.test.tsx`, "uden 'Vis alle' står kun de afgørende sidninger …": mellemoverskrifterne ved gruppering efter honnører er nu fx "K · 50,00 % · 8 sidninger" i stedet for "Vest har K".
- `src/farvebehandling/ui/linjevalg.test.ts`, "unikke vindere tæller …": antallet er nu summen af rækkernes antal (Afklaret 6).

Åbne punkter: ingen.
