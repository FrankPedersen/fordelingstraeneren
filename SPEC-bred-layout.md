# SPEC-bred-layout

På en computer står Fordelingstrænerens skærme i en kolonne på højst 480 px (`.screen` i `src/ui/styles.css` og `--column` i `src/farvebehandling/ui/tokens.css`), selv om fanebladene og overskriften går over hele bredden. Det ser ud som et mobilvindue. Specen giver alle skærme et bredt layout fra 1000 px efter **bud A · Bordet til venstre, opgaven til højre** i mockuppen "Træning på computer" (Franks valg 31. oktober 2026). Under 1000 px er alt uændret.

Forsiden er allerede bred (SPEC-forside-bred.md) og ændres ikke.

## Afgrænsning

Før arbejdet starter: tag den nuværende udgave med det næste ledige nummer (`v30-foer-bred-layout`), arbejd på grenen `bred-layout`, og flet først ind efter Franks godkendelse.

| Sted | Må ske | Må ikke ske |
| --- | --- | --- |
| `src/ui/styles.css`, `src/farvebehandling/ui/farvebehandling.css`, `src/pointregnskab/ui/pointregnskab.css` og de andre spors CSS | brede regler i `@media (min-width: 1000px)`; nye klasser til de to spalter; eksisterende tokens | ændre noget under 1000 px; nye farver; ændre kortenes, bordets og knappernes udseende |
| `tokens.css`, `design/tokens.json` | ét nyt token `--wide-width: 1120px` og `--board-column: 420px` | ændre `--column` (mobilbredden) |
| Skærmenes `.tsx` | pakke bordet og opgaven ind i hver sin spalte, hvor det kræves | ændre tekst, logik, rækkefølge for skærmlæser og tastaturnavigation |
| `SPEC-navigation.md`, `SPEC-farvebehandling.md`, `CLAUDE.md`, `../SYSTEM.md` | en linje om det brede layout under Beslutninger | |
| Design system "Fordelingstræneren" | ikke i denne omgang; Frank får det med bagefter | |

## Fælles regel fra 1000 px

1. **Bredden:** skærmen bruger samme indre bredde som fanebladene: højst `--wide-width` (1120 px), i midten, med samme sidemargen som forsiden.
2. **Overskrift, faneblade og fremdrift** (fx "Repetition … 0 XP") står over hele bredden, over begge spalter.
3. **To spalter:** venstre spalte er `--board-column` (420 px) med det, opgaven handler om (bordet, hånden, kortene). Højre spalte fylder resten med spørgsmålet, valgene, svaret, facit og knapperne. Mellemrummet er 24 px.
4. **Venstre spalte står fast:** `position: sticky; top: 16px`, så bordet kan ses, mens man scroller i højre spalte. Er venstre spalte højere end vinduet, står den ikke fast.
5. **Bordet bliver lidt større** i venstre spalte: kompasset 210 px og hænderne 1.6rem (i dag 176 px og 1.25rem). Mobilstørrelsen er uændret.
6. **Rækkefølgen i HTML** er den samme som i dag: bordet først, så opgaven. Skærmlæser, tab-rækkefølge og fokus ændres ikke.
7. **Under 1000 px** er alt præcis som i dag. Mellem 1000 og 1120 px bliver højre spalte smallere; den må ikke blive under 400 px.

## Skærmene

| Skærm | Venstre spalte | Højre spalte |
| --- | --- | --- |
| Farvebehandling · Træning | bordet | mål med ⓘ, forklaringen, Vælg linjen, linjekortene, chancen, facit og Næste |
| Farvebehandling · Selvvalgt | kortvælgeren og bordet | mål, linjer, chance og facit |
| Farvebehandling · Analyse | bordet og situationspanelet | resultatkort, linjekort, sandsynlighedsbånd og Sammenlign |
| Spil den selv | bordet med stikket (Bridgebord) | Mål, beskeden om, hvem der skal spille, og resultatet; når spillet er slut, facit |
| Hvad nu? | bordet efter første runde | fortsættelserne og gættet på chancen |
| Pointregnskab | hånden, meldingerne og ledetrådene | spørgsmålet, regnskabspanelet, tastaturet og facit |
| Håndevaluering | hånden og meldingerne | spørgsmålet, talpanelet og facit |
| Fordelingens øvelser (session, sudoku, højere/lavere, færdiggør, læs, palads) | opgaven (mønsteret, gitteret eller billedet) | tastaturet, svaret og feedback |
| Opvarmning i pointregnskab og håndevaluering | som den øvelse, den hører til | som den øvelse, den hører til |

Skærme uden et bord eller en opgave har ingen spalter, men brug den brede flade sådan her:

| Skærm | Fra 1000 px |
| --- | --- |
| Vejledning (GuideScreen og farvebehandlingens Guide) | indholdsfortegnelsen i en venstre spalte på 240 px, der står fast; teksten i højst 70 tegns bredde |
| Statistik, kurver og album | kortene i et gitter (`repeat(auto-fill, minmax(320px, 1fr))`) |
| Indstillinger | to kolonner med grupperne, hvis der er mere end én gruppe; ellers højst 640 px i midten |
| Klubaften og Introduktion | teksten i højst 70 tegns bredde, i midten |

## Konventionstræneren

`multi-svar-traener.html` står i dag i højst 620 px. Fra 1000 px bruger den samme regel: højst 1120 px; hænderne i venstre spalte på 420 px, der står fast; meldingerne, svarknapperne og forklaringen i højre spalte. Under 1000 px er den uændret. De andre sider i konventionstræneren står allerede i 64rem og ændres ikke.

## Rettelse undervejs

Linjekortenes trin står med store, ujævne mellemrum i nogle linjer (fx Linje A i Træning ved E D 6 5 / 4 3 2), mens andre står tæt. Trinene skal have samme afstand i alle linjer, på mobil og på computer.

## Accepttest

- [ ] Ved 1280 px står bordet i Farvebehandling · Træning til venstre og målet til højre for det; toppen af bordet og toppen af målet flugter.
- [ ] Ved 1280 px er opgavens samlede bredde den samme som fanebladenes (højst 1120 px), og den står i midten.
- [ ] Ved 1280 px bliver bordet stående, når der scrolles ned til chancen og facit.
- [ ] Ved 999 px og ved 390 px er alle skærme som før (sammenlign skærmbilleder før og efter).
- [ ] Ved 1000 px er højre spalte mindst 400 px bred.
- [ ] Pointregnskab, Håndevaluering, Spil den selv og en session med tastatur har to spalter ved 1280 px.
- [ ] Vejledningen har indholdsfortegnelsen til venstre ved 1280 px.
- [ ] Multi-svar-træneren har to spalter ved 1280 px og er uændret ved 390 px.
- [ ] Linje A og Linje B har samme afstand mellem trinene.
- [ ] Tab-rækkefølgen er den samme før og efter i Træning, Spil den selv og Pointregnskab.
- [ ] Alle tests er grønne (`npm test`), også fagordstesten og testen for beskrivende form.

## Når det er bygget

Giv Frank skærmbilleder ved 1280 px af Træning, Spil den selv, Pointregnskab, en session med tastatur og vejledningen, og ét ved 390 px af Træning. Frank prøver og godkender, før der flettes.
