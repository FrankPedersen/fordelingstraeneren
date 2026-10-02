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
- [ ] Trin 2: MVP til daglig brug
- [ ] Trin 3: Huskepalads, skyline-billeder og aftrapning
- [ ] Trin 4: Lynaflæsning, album og Klubaften
- [ ] Trin 5: Meldetolkning og 13-sudoku, ugens boss og kurver
