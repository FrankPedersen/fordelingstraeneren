# SPEC-navigation

5. oktober 2026 · Frank

Forsiden grupperes efter, hvad sporene træner, så nye spor kan tilføjes uden at ændre forsiden igen. Kun forsidens opstilling ændres; alle ruter, skærme og data er uændrede. Opgaven bygges efter Pointregnskabet og før håndevaluering.

Version 2 (5. oktober 2026): Claude Codes forslag til de syv punkter fra gennemgangen af version 1 er skrevet ind (se Afklaret til sidst).

## Afgrænsning

Før arbejdet starter:

1. Commit og tag den nuværende app, fx `v4-foer-navigation`.
2. Arbejd på grenen `navigation`, og flet først ind efter godkendelse.
3. Kør alle eksisterende tests før og efter.

| Sted | Må ske | Må ikke ske |
| --- | --- | --- |
| Forsidens skærm (`src/app/screens/HomeScreen.tsx`) | elementerne stilles op i grupper som beskrevet nedenfor | fjerne eller omdøbe menupunkter, eller ændre indholdet af de eksisterende elementer |
| Ny fil `src/app/tracks.ts` | én liste over forsidens menupunkter, én linje pr. menupunkt med spor, gruppe, titel på begge sprog, skærm og ⓘ-tekst på begge sprog | indeholde logik fra sporene |
| Ruter og skærme (`src/app/App.tsx`) | ingen ændringer | ændre, hvilken skærm en knap åbner, så gemte fremskridt holder op med at virke |
| Lagring | ingen ændringer | læse eller skrive nogen nøgle i localStorage ud over det, forsiden gør i dag |
| Sprogknappen (`src/i18n.ts`) | bliver stående øverst til højre på forsiden, som den er ("English"/"Dansk") | ændres |
| Fordelingssporets elementer på forsiden (streak, XP og joker, niveau, I dag og Start dagens session) | flyttes uændrede ind under overskriften Fordeling i gruppen Optælling | ændres i indhold eller adfærd |
| Ny version, velkomst og vejledningskortet | bliver stående som i dag | ændres |
| Vejledningen (`src/app/screens/GuideScreen.tsx`) | et kort nyt afsnit om grupperne, på begge sprog | ændre de eksisterende afsnit |
| Tests | alle eksisterende tests består; kun tests, der tester forsidens opbygning, må opdateres, og de skal nævnes ved aflevering | ændre andre tests |

Kræver noget alligevel en ændring uden for forsiden, skal Claude Code stoppe og spørge.

Besked til Claude Code:

> Gruppér forsiden efter SPEC-navigation.md. Kun forsidens opstilling ændres; ruter, skærme, data og sprogvalg er uændrede. Kør de eksisterende tests før og efter, og nævn de tests af forsiden, du har opdateret.

## Grupper

| Gruppe (dansk / engelsk) | Indhold |
| --- | --- |
| Optælling / Counting | Fordeling (fordelingssporets elementer og menupunkterne Huskepalads, Album, Klubaften og Kurver), Pointregnskab |
| Spilføring / Declarer play | Farvebehandling |
| Vurdering / Hand evaluation | Håndevaluering, når sporet findes |

- **Afsnit, ikke undermenuer:** grupperne vises som afsnit på forsiden med en overskrift og indholdet under. En skærm åbnes stadig med ét tryk.
- **Fordeling:** står først i Optælling under en lille overskrift, Fordeling (engelsk: Distribution). Under den står fordelingssporets elementer i samme rækkefølge og med samme indhold som i dag: streak, XP og joker, niveau, I dag, Start dagens session og menupunkterne Huskepalads, Album, Klubaften og Kurver. Så ses det, at streak og XP er fordelingssporets; de andre spor har deres egne inde i sporet.
- **13-sudoku:** er en fase i fordelingssporets daglige session, ikke et menupunkt, og får intet menupunkt. Optællings ⓘ nævner den.
- **Rækkefølge:** grupperne står i rækkefølgen ovenfor. Inden for en gruppe står menupunkterne som i dag, med nye spor sidst.
- **Tomme grupper vises ikke.** Vurdering dukker først op, når håndevaluering er tilføjet.
- **Uden for grupperne:** vejledningskortet og Indstillinger står under grupperne som i dag. De er ikke spor.
- **ⓘ pr. gruppe:** en kort forklaring på begge sprog af, hvad gruppen træner. Menupunkternes og elementernes eksisterende ⓘ bliver stående. Forslag til teksterne:
  - Optælling: "Træner at tælle hænder ud: fordelingernes mønstre og hyppighed, 13-sudokuen i den daglige session og honnørpoint i Pointregnskab." / "Trains counting out hands: the patterns and frequencies of distributions, the 13-sudoku in the daily session and high-card points in Point count."
  - Spilføring: "Træner spilføring: hvilken linje i én farve, der giver størst chance for de stik, du skal bruge." / "Trains declarer play: which line in one suit gives the best chance of the tricks you need."
  - Vurdering: skrives sammen med håndevaluering.
- **Nye spor:** et nyt spor med ét menupunkt tilføjes med én linje i `src/app/tracks.ts`. Forsiden skal ikke ændres igen.

## `src/app/tracks.ts`

Listen har én linje pr. menupunkt, ikke pr. spor, fordi fordelingssporet har flere menupunkter og skærme:

```ts
{ id: 'palace', track: 'fordeling', group: 'counting', screen: 'palace',
  title: { da: 'Huskepalads', en: 'Memory palace' },
  help: { da: '…', en: '…' } }
```

- `group` er `counting`, `play` eller `evaluation`.
- `screen` er en af skærmene i `App.tsx`, som i dag; listen ændrer ikke, hvilken skærm en knap åbner.
- `help` er menupunktets nuværende ⓘ-tekst, flyttet uændret ind i listen.
- Fordelingssporets elementer uden for menupunkterne (streak, XP, niveau, I dag og startknappen) står ikke i listen; forsiden tegner dem øverst under Fordeling som i dag.

## Layout

Forsiden ligger i appens 480 px-kolonne. Wireframen er designgrundlaget; designet kan ændres senere i Claude Design.

```text
┌──────────────────────────────────┐
│ Fordelingstræneren     [English] │
│ (ny version og velkomst som i dag)│
├──────────────────────────────────┤
│ OPTÆLLING                     ⓘ  │
│ Fordeling                        │
│ 3 dage i træk · 1.240 XP      ⓘ  │
│ Niveau 2 · ualmindelig        ⓘ  │
│ I dag: 4 emner til repetition ⓘ  │
│ [Start dagens session]        ⓘ  │
│ [Huskepalads] ⓘ  [Album]      ⓘ  │
│ [Klubaften]   ⓘ  [Kurver]     ⓘ  │
│ [Pointregnskab]               ⓘ  │
├──────────────────────────────────┤
│ SPILFØRING                    ⓘ  │
│ [Farvebehandling]             ⓘ  │
├──────────────────────────────────┤
│ Vejledning: [Læs vejledningen]   │
│ [Indstillinger]               ⓘ  │
└──────────────────────────────────┘
```

- **Gruppeoverskrifter:** bruger eksisterende tokens fra `design/tokens.json`. Nye tokens tilføjes kun, hvis det er nødvendigt, og eksisterende ændres ikke.
- **Sprogknappen:** står øverst til højre som i dag; skitsens "[English]" er den eksisterende knap.
- **Øvrigt:** samme tone, mørk tilstand, systemskrift, trykflader på mindst 44 px og kontrast på mindst 4,5:1 som resten af appen. Al ordlyd står på begge sprog: menupunkterne i `tracks.ts`, resten med `tx()` som på forsiden i dag.

## Accepttest

- [ ] Hver knap på forsiden åbner den samme skærm som før.
- [ ] Ingen nøgle i localStorage ændres ved at åbne forsiden eller trykke på et menupunkt. Sprogknappen gemmer kun `settings.language`, og Start dagens session gemmer som i dag.
- [ ] Grupperne står i rækkefølgen Optælling, Spilføring, Vurdering, og tomme grupper vises ikke.
- [ ] Hvert menupunkt står i præcis én gruppe, og et nyt spor med ét menupunkt kræver kun én ny linje i `src/app/tracks.ts`.
- [ ] Hver skærm åbnes med ét tryk fra forsiden.
- [ ] Fordelingssporets elementer står først i Optælling under Fordeling, med samme indhold og i samme rækkefølge som før.
- [ ] Vejledningskortet og Indstillinger står under grupperne, og sprogknappen står øverst som før.
- [ ] Der er intet menupunkt for 13-sudoku.
- [ ] På engelsk står der intet dansk på forsiden, heller ikke i gruppernes ⓘ (som `src/app/i18n.test.tsx`).
- [ ] Hver gruppe har et ⓘ med en forklaring på begge sprog.
- [ ] Alle eksisterende tests består; kun tests af forsidens opbygning er opdateret, og de er nævnt ved aflevering.

## Afklaret

Version 2, Claude Codes forslag til punkterne fra gennemgangen af version 1 (5. oktober 2026):

1. **13-sudoku:** er en fase i den daglige session og får intet menupunkt; "inkl. 13-sudoku" er fjernet, og Optællings ⓘ nævner den (Grupper).
2. **Fordelingssporets menupunkter:** de står alle med deres nuværende navne under Fordeling i Optælling; skitsens ene knap "[Fordeling]" er erstattet (Grupper, Layout). Godkendt af Frank, 5. oktober 2026.
3. **Indstillinger og Vejledning:** er ikke spor og står under grupperne som i dag (Grupper, Layout).
4. **Streak, XP, niveau og I dag:** er fordelingssporets og flyttes uændrede ind under Fordeling, så de ikke ligner tal for hele appen (Afgrænsning, Grupper). Godkendt af Frank, 5. oktober 2026.
5. **Sprogknappen:** bliver, som den er ("English"/"Dansk"); skitsens "[DA|EN]" er rettet (Layout).
6. **Lagring i accepttesten:** forsiden og menupunkterne skriver intet; sprogknappen og Start dagens session gemmer som i dag (Accepttest).
7. **`tracks.ts`:** én linje pr. menupunkt med spor, gruppe og skærm, fordi fordelingssporet har flere menupunkter (`src/app/tracks.ts`).
