# SPEC-sidefod

4. november 2026 · Franks valg. Bygget på grenen `sidefod`; `main` før er tagget `v37-foer-sidefod`. Godkendt af Frank og udgivet 5. november 2026, efter `ny-forside`.

Sidefoden laves ens med forsidens nye, kompakte sidefod efter målene under Afklaret i `../Forside/docs/specs/SPEC-ny-forside.md`.

## Afgrænsning

| Sted | Må ske | Må ikke ske |
| --- | --- | --- |
| `src/ui/Footer.tsx` og sidefodens regler i `src/ui/styles.css` | nyt indhold og nye mål efter forsiden | ændre andet på skærmene |
| Under 1000 px | sidefoden ændres også her (Franks undtagelse i `SPEC-design-som-forsiden.md`) | alt andet er pixel for pixel som før |

## Indhold

- Logo og "Om mig og kontakt".
- Kolonnen Trænere: Konventionstræner, Fordeling, Pointregnskab, Farvebehandling, Håndevaluering.
- Kolonnen Opslag: Analyse, Bridgeordbog, Scoring i bridge.
- ©-linjen.
- Afsnittene Om mig og Kontakt udgår fra sidefoden; de står på om-mig-siden.
- På mobil står logo og knappen på én række. Engelsk følger med.

## Accepttest

- [x] `src/sidefod.test.tsx`: indholdet og rækkefølgen, Om mig og Kontakt er væk, og engelsk.
- [x] `node scripts/tjek-sidefod.mjs`: målene ved 1280 og 390 px på forsiden og alle spor; intet stikker ud ved 320 px; knappen står inden for polstringen ved 390, 360 og 320 px på begge sprog; samme flade i mørk tilstand.
- [x] `node scripts/tjek-bred-layout.mjs`: resten er pixel for pixel som før ved 999 og 390 px, med sidefoden skjult i begge apps.
- [x] `npm test` og `node scripts/sprogtjek.ts` er grønne.

Giv Frank skærmbilleder ved 1280 og 390 px af sidefoden. Frank godkender, før der flettes.

## Afklaret

1. **Grenen bygger oven på `info-boks`,** fordi Frank godkender i rækkefølgen info-boks, ny forside og sidefod, og begge grene ændrer `scripts/tjek-bred-layout.mjs`. Tagget er `main` som bedt om, og `main` står før begge.
2. **Linkene** til sporene er appens egne (`#fordeling` osv.), så de også virker offline. Konventionstræner, Bridgeordbog, Scoring i bridge og Om mig og kontakt går ud af appen.
3. **Farverne** er forsidens og ens i lys og mørk tilstand: `footer-bg`, `footer-text` og `footer-accent` og forsidens grå toner.
4. **Forsidens særregel** med tre kolonner fra 1000 px (`.home .site-footer`) er væk, for sidefoden er nu ens på alle skærme.
5. **Knappens tekst må brække,** som på forsiden (Franks valg 5. november 2026): ved 360 px står "Om mig og kontakt" på to linjer og ved 320 px på tre, og på engelsk er den på to linjer allerede ved 390 px. Uden det stak knappen 28 px ud af skærmen ved 320 px.
