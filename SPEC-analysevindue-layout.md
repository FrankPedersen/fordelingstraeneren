# SPEC-analysevindue-layout

5. oktober 2026 · Frank

Tre layoutforbedringer fra det godkendte artboard [Analysevindue v2](https://claude.ai/artifact/S5p4ANVzT2BGLpH98nehwn): fanerne som én samlet bjælke, gennemsnitligt antal stik på linjekortene og sidningerne som en tabel. Kun farvebehandling berøres. Opgaven bygges efter SPEC-tema; navigationen er allerede bygget (6. oktober 2026).

Version 2 (7. oktober 2026): Claude Codes gennemgang er skrevet ind. Facitværdierne er efterprøvet med løseren, og det åbne spørgsmål om data til gennemsnittet står under punkt 2 og under Afklaret til sidst.

## Afgrænsning

Før arbejdet starter:

1. Commit og tag den nuværende app, fx `v5-tema`.
2. Arbejd på grenen `analysevindue-layout`, og flet først ind efter godkendelse.
3. Kør alle eksisterende tests før og efter.

| Sted | Må ske | Må ikke ske |
| --- | --- | --- |
| Farvebehandlingens faner (Træning, Selvvalgt, Analyse) | vises som én samlet bjælke | ændre fanernes navne, rækkefølge eller adfærd |
| Linjekort | en linje med gennemsnitligt antal stik | ændre linjerne, chancerne eller sorteringen |
| Visningen af sidninger i Analyse og i facit ("Hvorfor") | vises som tabel | ændre data, grupperingen eller båndet |
| Appens data og løserscriptet (`content/app/side-N.json`, `scripts/solve.ts`) | stik pr. sidning for de viste linjer (mulighed A under punkt 2) | andet end stik pr. sidning for de viste linjer |
| Fordelingssporet, Pointregnskabet, forsiden | ingen ændringer | — |
| Tokens | kun eksisterende tokens efter SPEC-tema | nye tokens |
| Lagring | ingen ændringer | læse eller skrive nogen nøgle |

Kræver noget alligevel en ændring ud over tabellen, skal Claude Code stoppe og spørge.

Besked til Claude Code:

> Byg de tre layoutforbedringer i SPEC-analysevindue-layout.md efter artboardet "Analysevindue v2". Kun farvebehandlingens faner, linjekort og sidningsvisning ændres; data og adfærd er uændrede, bortset fra stik pr. sidning for de viste linjer, som løserscriptet regner (mulighed A). Kør alle tests før og efter.

## 1. Fanerne som én bjælke

- **Spor:** en bjælke i `surface-2` med hjørner `radius-12` og 4px indre margen (`space-4`). De tre faner ligger i den.
- **Aktiv fane:** flade `accent-soft`, 2px kant i `accent`, tekst i `text`. Farvebehandlingens komponentregel tillader kun tokens, 0, 1px og procenter, så 2px-kanten laves som 1px kant plus 1px indre skygge, som de andre valgte elementer i temaet.
- **Øvrige faner:** gennemsigtige med tekst i `text`.
- **Trykflader:** mindst `touch-min` (44px). Den eksisterende tilgængelighed (`aria-current="page"` på den aktive fane) bevares uændret.
- **Smal skærm:** bjælken fylder kolonnens bredde, og fanerne deler den ligeligt.

## 2. Gennemsnitligt antal stik på linjekortene

- **Indhold:** en linje nederst på hvert linjekort: "Flest stik i gennemsnit: 2,32 stik" / "Average tricks: 2.32".
- **Beregning:** linjens stik pr. sidning vægtet med sidningens chance. To decimaler, dansk decimalkomma og punktum på engelsk. En linjes stik i en sidning er det antal mål, den når der: summen af linjens garanti for målene 1, 2, … op til antal runder.
- **Data (Franks valg 7. oktober 2026: mulighed A):** appens data har for hver vist linje kun, om målet nås i hver sidning. Det er det, båndet viser, men ikke antal stik. Gennemsnittet kan derfor ikke regnes ud fra de data, båndet bruger i dag. To muligheder:
  - **A (valgt):** løserscriptet regner stik pr. sidning for hver vist linje og gemmer dem i appens data. Det kræver en ny version af mellemlageret og en ny kørsel (ca. 1 time med 10 processer). Datafilerne bliver lidt større og skal blive under PWA'ens grænse på 2 MB pr. side. Gennemsnittet vises straks, også offline.
  - **B:** løseren regner det i browseren, når linjekortet vises: én beregning pr. mål og linje. Det tager fra under et sekund til flere sekunder pr. linje, og kortet viser "Regner …" imens.
- **ⓘ:** "Gennemsnittet over alle sidninger, vægtet efter chance. Det er det tal, der tæller i parturnering." / "The average over all layouts, weighted by chance. This is what counts at pairs."
- **Gælder** linjekortene i Analyse og i facit.

## 3. Sidningerne som tabel

- **Kolonner:** Vest | Øst | Chance | én kolonne pr. viste linje (højst fire) | mærket "afgør".
- **Felter:** `fb-hit` med ✓ og antal stik, når målet nås; `fb-miss` med stiplet kant, ✕ og antal stik, når det ikke nås. Farven står aldrig alene. Antal stik kræver de samme data som punkt 2; uden dem står kun ✓ eller ✕.
- **Afgørende sidninger** står først, med rækken markeret i `surface-2` og mærket "afgør" som i temaet. Mærkets ⓘ står én gang over tabellen, som i temaet. "Vis alle sidninger" folder resten ud med den eksisterende gruppering (fordeling eller honnørplacering) som mellemoverskrifter.
- **Valg af sidning:** et tryk på en række vælger sidningen som i dag, så bordet og båndet viser den. Rækken kan trykkes med en knap i den første celle, så tabellen forbliver en rigtig tabel for skærmlæsere.
- **Overskrifter:** små versaler i `muted`, på dansk og engelsk.
- **Smal skærm:** tabellen ligger i en boks med vandret rulning, så siden aldrig ruller sidelæns.

## Accepttest

- [ ] Alle eksisterende tests består, også App-testens flows.
- [ ] Fanerne skifter som før, og den aktive fane er markeret med `accent-soft` og kant i `accent`.
- [ ] Gennemsnittet for B432 / ET65: linje A = 2,32 stik og linje B = 2,07 stik (linje B giver 2 stik undtagen i KD–xxx og xxx–KD, hvor den giver 3). Efterprøvet med løseren 7. oktober 2026: 2,3165 og 2,0678.
- [ ] Gennemsnittet vises med dansk decimalkomma på dansk og decimalpunktum på engelsk, og ⓘ findes på begge sprog.
- [ ] Tabellen har én kolonne pr. viste linje, de afgørende sidninger står først, og hvert felt har ✓ eller ✕.
- [ ] Et tryk på en række vælger sidningen som før.
- [ ] På engelsk står der intet dansk i tabellen eller på linjekortene.
- [ ] Ingen nøgle i localStorage ændres.

## Afklaret

Claude Codes gennemgang (7. oktober 2026):

1. **Rækkefølge:** navigationen er bygget før denne opgave; "før SPEC-navigation" er rettet.
2. **Facitværdierne:** linje A 2,3165 og linje B 2,0678 stik (løseren, stik pr. sidning som summen af garantien for målene 1–4).
3. **Komponentreglen:** 2px-kanten laves som 1px kant plus 1px indre skygge, og 4px er `space-4`.
4. **Valg af sidning** i tabellen bevares som i dag (punkt 3).
5. **Data til gennemsnittet og antal stik i tabellen:** mulighed A, løserscriptet regner stik pr. sidning for de viste linjer, og de gemmes i appens data (Franks valg, 7. oktober 2026).
