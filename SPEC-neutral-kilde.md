# SPEC-neutral-kilde

20. oktober 2026 · Frank

Farvebehandling nævner i dag bridgehands.com i appens tekster. Fremover kaldes banken **de klassiske farvebehandlinger med inspiration fra Suit Combinations in Bridge (Jethalal M. Shah)**. Det gælder alt, hvad brugeren kan se eller hente i browseren. Udviklerfilerne (indlæsningen af kilden, scripts, valideringsrapporter og specerne) beholder deres navne, fordi de dokumenterer, hvor tallene til facitkontrollen er læst.

Løseren, banken, chancerne og rækkefølgen ændres ikke.

## Afgrænsning

Før arbejdet starter:

1. Commit og tag den nuværende app, fx `v-foer-neutral-kilde`.
2. Arbejd på grenen `neutral-kilde`, og flet først ind efter godkendelse.
3. Kør alle eksisterende tests før og efter. De skal bestå uændret, undtagen de tests, der låser de ændrede tekster; dem retter Claude Code og nævner under Afklaret.

| Sted | Må ske | Må ikke ske |
| --- | --- | --- |
| `ui/texts.ts` | `verified`, `unverified`, `bankHelp` og `help.choose` på dansk og engelsk (se nedenfor) | ændre andre tekster |
| `precompute.ts` (`appEntry`) | `source.name` udelades i appens data; `source.values` bliver | ændre `bankEntry`, hyppighed, løsninger eller validering |
| `content/app/side-N.json` | genereres igen, så `source.name` ikke er med | rettes i hånden; ændre andet end `source.name` |
| `source/bridgehands.ts`, `scripts/`, `content/bridgehands-side-N.json`, `suit-combinations.json`, `validering-side-N.md`, `kildefejl.json` | intet | omdøbe filer, funktioner eller kildenavne |
| `SPEC-farvebehandling.md`, `CLAUDE.md` | én linje om, at appens synlige tekster omtaler kilden neutralt (CLAUDE.md: samme commit som adfærden) | omskrive historikken |
| Løseren, lagring, tokens, layout | intet | alt |

Kræver noget alligevel en ændring ud over tabellen, skal Claude Code stoppe og spørge. Det gælder især, hvis `app/side-N.json` ikke kan genereres uden at regne løsningerne igen.

Besked til Claude Code:

> Læs CLAUDE.md, SPEC-farvebehandling.md og SPEC-neutral-kilde.md. Byg specen på grenen `neutral-kilde`, skriv accepttestene først, og stop, når testene er grønne, så jeg kan godkende. Kun tekster og `source.name` i appens data ændres; løsningerne regnes ikke igen.

## De nye tekster

| Nøgle | Dansk | Engelsk |
| --- | --- | --- |
| `verified` | Tallene stemmer med de klassiske farvebehandlinger. | The figures agree with the classic suit combinations. |
| `unverified` | Tallene afviger fra de klassiske farvebehandlinger; appen bruger sin egen beregning. | The figures differ from the classic suit combinations; the app uses its own calculation. |
| `bankHelp` | De klassiske farvebehandlinger, hyppigste først. | The classic suit combinations, most frequent first. |
| `help.choose` (tilføjes til sidst) | Banken er de klassiske farvebehandlinger med inspiration fra Suit Combinations in Bridge (Jethalal M. Shah). Alle chancer er regnet i appen. | The bank is the classic suit combinations, inspired by Suit Combinations in Bridge (Jethalal M. Shah). All chances are worked out in the app. |

`unverified` henviser ikke længere til valideringsrapporten, fordi den ikke kan åbnes fra appen.

## Leverancetrin

1. **Teksterne** i `texts.ts` og de tests, der låser dem.
2. **Appens data:** `appEntry` udelader `source.name`, og `app/side-N.json` genereres igen uden at regne løsningerne. Kan det ikke lade sig gøre, stopper Claude Code og spørger.

Hvert trin er færdigt, når `npm test` er grøn, og Frank har godkendt.

## Accepttest

- [ ] Alle eksisterende tests består; tests, der låste de gamle tekster, er rettet og nævnt under Afklaret.
- [ ] `texts.ts` indeholder ikke "bridgehands" på dansk eller engelsk.
- [ ] Efter `npm run build` indeholder ingen fil i `dist/` teksten "bridgehands" (der skelnes ikke mellem store og små bogstaver).
- [ ] Resultatkortet for E K D B 3 / 2 viser "Tallene stemmer med de klassiske farvebehandlinger." og på engelsk "The figures agree with the classic suit combinations."
- [ ] En kombination fra kortvælgeren, der ikke er i banken, viser fortsat "Regnet i appen; der er ingen kilde at sammenligne med."
- [ ] Banken viser "De klassiske farvebehandlinger, hyppigste først.", og ⓘ ved Vælg kombination nævner Suit Combinations in Bridge (Jethalal M. Shah).
- [ ] `app/side-N.json` er uændret bortset fra, at `source.name` mangler: samme kombinationer, rækkefølge, `source.values`, `verified` og løsninger.
- [ ] De engelske skærme indeholder ingen dansk tekst.

## Afklaret

1. **Udviklerfilerne beholder navnet** bridgehands, fordi de beskriver, hvor kildens tal er læst til facitkontrollen. De vises ikke i appen.
2. **Banken er den samme:** 657 kombinationer, samme hyppighed og rækkefølge.
3. **Bogen er inspiration, ikke kilde til tallene.** Teksterne siger "med inspiration fra", og chancerne er regnet i appen.

Åbne punkter: Claude Code skriver her, hvilke tests der låste teksterne og er rettet.
