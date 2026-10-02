# Fordelingstræneren

Bridge-træningsapp til hånd-fordelinger. **Den fulde specifikation står i [SPEC.md](SPEC.md). Læs den før hvert trin**, og følg den frem for egne antagelser. Ved uenighed mellem denne fil og SPEC.md vinder SPEC.md.

## Arbejdsgang

- Byg ét trin ad gangen efter "Leveranceplan og accepttest" i SPEC.md. Et trin er færdigt, når `npm test` er grøn og der er committet.
- Skriv accepttestene (Vitest) før implementeringen, når SPEC.md giver facitværdier.
- Opdatér afsnittet "Status" nederst i denne fil ved slutningen af hvert trin.
- Åbne punkter i SPEC.md (fx oplysningsdoblingens "højst 2 i deres farve") implementeres som beskrevet og markeres med en kommentar; spørg, før du ændrer dem.

## Ufravigelige regler

- Stack: React + Vite + TypeScript, statisk side på GitHub Pages, PWA (offline). Tests i Vitest. Ingen server, intet login, ingen eksterne API'er.
- `src/engine/` må ikke importere fra `src/domain/` eller `src/system/`.
- Sandsynligheder beregnes i koden med BigInt-tællere; intet tal tastes ind. Hænder filtreres eller vægtes aldrig i øvelser, der viser hyppigheder.
- Kortgiver: Fisher–Yates over 52 kort med seedbar PRNG (mulberry32).
- Meldetolkning ligger kun i `src/system/dk-2over1.json` (standard dansk 2/1).
- Al tilstand i localStorage under nøglen `fordelingstraener:v1`; skemaet står i SPEC.md under "Data og lagring". Datoer i lokal tid, dagen skifter kl. 04.
- Mobil-først: én hånd, store trykflader, intet der kræver hover.

## Sprog og notation

- Al tekst i appen er på dansk.
- Bridgeterminologi: "bordet" (ikke blindemand), "kipning" (ikke snit), "forbindelser" (ikke broer), "slutspil"/"endplay" (ikke indspil).
- Mønster: faldende med bindestreg (5-4-2-2). Konkret fordeling: ♠♥♦♣ med lighedstegn (2=5=2=4).
- Familiefarver: blå (4), grøn (5), rav (6), violet (7+). Aldrig rød eller sort, og farve står aldrig alene uden tekst eller tal.

## Status

- [x] Trin 1: Mønstermodel og kortgiver
  - `src/domain/patterns.ts`: de 39 mønstre beregnes med BigInt (rang, grad, familie, pr. 100, 1 ud af N). Delt rang følger "1 + antal strengt hyppigere": 7-5-1-0 og 8-3-2-0 deler 23, næste er 25, sidste er 39.
  - `src/domain/dealer.ts`: Fisher–Yates over 52 kort; mulberry32 og `shuffle` ligger i `src/engine/rng.ts`. Seed 1 er låst i en regressionstest, så gemte opgaver kan genskabes.
  - `npm test` kører `tsc` og derefter Vitest. `src/architecture.test.ts` håndhæver, at `engine/` ikke importerer fra `domain/` eller `system/`.
- [x] Trin 2: MVP til daglig brug
  - Motor: `src/engine/` (Leitner, streak med joker, XP, sessionshjælpere, lagring med eksport/import). Øvelser: `src/modes/higherLower/` og `src/modes/complete/`. Fælles UI: `src/ui/` (Skyline, Mønstertastatur).
  - `src/app/` er tilføjet til SPEC.md's mappetræ: sessionsmotoren (`session.ts`), progression (nye mønstre, oplåsning), skærme og lagringskrog. Den binder motor, domæne og øvelser sammen.
  - PWA via vite-plugin-pwa (en ny version vises som knap, ingen auto-genindlæsning). `.github/workflows/pages.yml` bygger med `--base=/<repo>/`; Pages-kilden skal være "GitHub Actions". Ikoner: `npm run icons`.
  - Valg, hvor SPEC.md er åben (spørg før ændring):
    - 13-sudokuens 75 s går til niveauøvelsen, indtil trin 5.
    - Fuldfør beder om højst 3 mønstre: alle mulige, hvis der er højst 3, ellers de tre hyppigste (med én kendt farve er der 8–12 mulige). Let = de to længste farver, normal = to tilfældige, svær = én farve. Et nyt mønster testes straks med lette opgaver.
    - Halv score i Fuldfør giver 5 XP, og emnet bliver stående som ved rigtigt men langsomt.
    - Rigtige svar flytter kun forfaldne emner op; et forkert svar sender altid i kasse 1. Lynrunden skriver ikke i loggen og flytter kun emner ved fejl (parreglen).
    - Sværheden tilpasses først efter 10 svar. Combo ganges på svarets XP; indsatsen lægges til bagefter.
    - Tasten "10+" er den lange farve; dens længde er 13 minus de tre andre.
    - Introduktionsdagen udledes af emnernes ældste logpost, da skemaet ikke har en dato.
- [ ] Trin 3: Huskepalads, skyline-billeder og aftrapning
- [ ] Trin 4: Lynaflæsning, album og Klubaften
- [ ] Trin 5: Meldetolkning og 13-sudoku, ugens boss og kurver
