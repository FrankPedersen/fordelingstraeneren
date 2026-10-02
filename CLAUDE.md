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
- [x] Trin 3: Huskepalads, skyline-billeder og aftrapning
  - `src/memory/`: standardbilleder (eget billede vinder overalt), paladsets rum og stationer, støtteniveauernes plan og visningerne (præsentation, ledetråd, huskeboks). Paladsvandring: `src/modes/palace/` (færdigheden "rank"). Editor: `src/app/screens/PalaceScreen.tsx`.
  - Valg, hvor SPEC.md er åben (spørg før ændring):
    - Kun de 13 mønstre fra tabellen har standardbillede; de øvrige får kun brugerens eget.
    - Rang-emner findes for mønstre med en plads: station 1–13 og de episke på Loftet (mønster → rum). Legendariske har intet rang-emne.
    - Paladsvandring: let = mønster → station, svær = station → mønster (tastes, afleveres straks), normal = begge veje.
    - Præsentationen på støtteniveau 3 vises højst én gang pr. mønster pr. session; introduktionen tæller som præsentation. Ledetråden er gratis på niveau 3 og koster 5 XP på niveau 2. Lynrunden kører uden støtte.
    - Efter svaret: niveau 3–2 viser station, billede, scene og skyline; niveau 1 kun skyline; niveau 0 kun rigtigt/forkert og facit (Fuldfør uden skylines).
    - Oplåsning er varig: niveauet er den højeste grad med et introduceret mønster (eller den næste, når den er lært).
    - Nye færdigheder giver allerede introducerede mønstre emner ved sessionsstart (`ensureItems`).
- [x] Trin 4: Lynaflæsning, album og Klubaften
  - Lynaflæsning: `src/modes/read/` (færdigheden "read"). Klubaften-estimat: `src/modes/estimate/`. Klubaften-ikonarrayet: `src/ui/Klubaften.tsx`. Album: `src/app/album.ts` og `AlbumScreen`.
  - Skemaet har fået det valgfri felt `readMs` (visningstiden t); version er stadig 1.
  - Valg, hvor SPEC.md er åben (spørg før ændring):
    - Lynrunden skifter mellem højere/lavere og Lynaflæsning efter dagens paritet (dage siden 2026-01-01).
    - Lynaflæsning i lynrunden bruger helt tilfældige hænder (Syds hånd fra `deal`), og hver hånd registreres i albummet. Forfaldne aflæsningsemner i repetitionen får en jævnt tilfældig hånd med mønstret; den registreres ikke i albummet.
    - Svartiden for aflæsning måles fra, hånden forsvinder; tastaturet er spærret, mens den vises. t justeres ved hvert svar og gemmes.
    - Klubaften-estimat træner færdigheden "compare": forfaldne sammenligningsemner for klubaftenens 16 mønstre stilles som højere/lavere eller estimat (50/50).
    - Sjældne fund = episke og legendariske mønstre; de fejres med odds, ligesom nye mønstre i albummet. Legendarisk oplåsning kræver alle tre svar rigtige i ét forsøg.
    - Et nyt mønsters aflæsning øves først i repetitionen, ikke lige efter introduktionen.
- [x] Trin 5: Meldetolkning og 13-sudoku, ugens boss og kurver
  - `src/system/dk-2over1.json` (48 regler: åbninger, direkte indmeldinger over åbninger på 1-trinnet og DONT over 1NT), `interpreter.ts` og `auction.ts`. SPEC.md's åbne punkter står i reglernes `note`-felt.
  - Løser: `src/domain/sudoku.ts`. Generator og visning: `src/modes/sudoku/`. Gitter: `src/ui/Gitter4x4.tsx`. Kurver: `src/app/curves.ts` og `src/ui/LineChart.tsx`.
  - Skemaet: sessionsposter har fået det valgfri felt `grades` (rigtige og stillede pr. grad).
  - Valg, hvor SPEC.md er åben (spørg før ændring):
    - "Simple svar" i generatoren er udeladt, da svarsekvenser ikke er med i første version af systemet. Auktionen er åbning plus direkte indmelding.
    - Regelformatet har to tilføjelser: `hcp` kan være flere intervaller (8–15 eller 17+), og `stopper: true` kræver hold i åbnerens farve. Det sidste bruges kun af meldegiveren.
    - Oplysningsdobling over 1♥/1♠ = præcis 4 i den anden major og højst 2 i deres farve, da der kun er én umeldt major.
    - Spilhændelser: "kan ikke bekende" for længder op til 3, "følger n gange" for n ≥ 2 og højst ét udspil af 4. højeste (Vest, da Syd spiller). Normalt vælges den mest oplysende hændelse, til ugens boss den mindst oplysende.
    - Grundpoint 10. Ugens boss (hver 7. session) fordobler både gevinst og straf. "Vis løsningen" giver 0 point minus forkerte låse.
    - Niveauøvelsen er tilbage på 90 s; sudokuen springes over, hvis lynrunden slutter efter 285 s.
    - Kurverne er små multipler med én serie pr. diagram i magenta (`#d55181`, valideret mod begge flader), så familiefarverne ikke får en ny betydning. Træfsikkerhed pr. grad tæller ikke lynrunden med.
    - Ugens status (ugens tal og klubaftenen) vises på status-skærmen i bossens session.
