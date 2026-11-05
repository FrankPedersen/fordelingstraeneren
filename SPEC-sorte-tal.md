# SPEC-sorte-tal

5. november 2026 · Franks valg. Bygget på grenen `sorte-tal`; appen før er tagget `v39-foer-sorte-tal`. Frank godkender, før der flettes.

I Fordelings sorterede hånd (facit efter Lynaflæsning, `SortedHand` i `src/modes/read/ReadView.tsx`) står hele rækken for ♥ og ♦ med rødt: symbolet, kortene og antallet. I Pointregnskab og Håndevaluering står kun farvesymbolet rødt, og kortene står sorte. Den sorterede hånd skal gøre det samme.

## Ændringen

- Klassen for rød flyttes fra rækkens `<p>` til symbolets `<span class="suit">`, så kun ♥ og ♦ står rødt, og kortene og (antal) står som i ♠ og ♣.
- Farven er kortenes token `card-red` (`var(--card-red)`, #c62828 i både lys og mørk tilstand) i stedet for det faste #c62828 i `.sorted-hand .red`.
- Spillekortene (`.playing-card.red`) er uændrede.

## Afgrænsning

| Sted | Må ske | Må ikke ske |
| --- | --- | --- |
| Den sorterede hånd i facit efter Lynaflæsning | kun ♥ og ♦ røde; farven fra `card-red` | kort, antal, rækkefølge eller tekst ændres |
| Spillekortene (`.playing-card`) | intet | farven ændres |
| Andre skærme og spor | intet | noget ændres |

## Accepttest

- [x] `src/modes/read/sorted-hand.test.tsx` (i `npm test`): ingen række i den sorterede hånd har klassen for rød, ♥ og ♦ har den på symbolet, ♠ og ♣ har den ikke, og `.sorted-hand .suit.red` bruger `var(--card-red)` uden et fast farvetal.
- [x] `node scripts/tjek-sorte-tal.mjs`: i Chrome har ♥ og ♦ i den sorterede hånd farven `--card-red` i lys og mørk tilstand, og kortene og (antal) i ♥ og ♦ har samme farve som i ♠ og ♣. Spillekortenes røde kort har samme farve som før.
- [x] Skærmbilleder af den sorterede hånd før og efter, i lys og mørk tilstand, i `../skaermbilleder/sorte-tal/`.
- [x] `npm test`, kørt alene, er grøn.

Kørt 5. nov. 2026 på grenen: `sorted-hand.test.tsx` 3 tests, `tjek-sorte-tal.mjs` 12 tjek og `npm test` (alene) 812 tests i 117 filer i orden.

## Afklaret

1. **Farven er `card-red`, ikke `suit-red`** (Franks valg 5. nov. 2026, efter Claude Codes spørgsmål). Den sorterede hånd står på et hvidt kort (`#ffffff`, som `card-face`) også i mørk tilstand. `--suit-red` er rød til appens flade og bliver #ff6b6b i mørk tilstand, hvad der kun giver ca. 2,8:1 i kontrast på hvidt. Kortenes token `card-red` er #c62828 i begge tilstande og er lavet til det hvide kort. Den sorterede hånd ser derfor ens ud i lys og mørk tilstand.
2. **Ændringen:** i `SortedHand` har rækkens `<p>` ingen klasse, og symbolets `<span>` har `suit red` for ♥ og ♦. Reglen `.sorted-hand .red { color: #c62828; }` er erstattet af `.sorted-hand .suit.red { color: var(--card-red); }`. Teksten i rækken er den samme: symbolet, et mellemrum og kortene, så en skærmlæser hører det samme.
3. **Målt i Chrome** (`scripts/tjek-sorte-tal.mjs`), i lys og mørk tilstand: ♥ og ♦ står i rgb(198, 40, 40) (`--card-red`), og kortene står i rgb(28, 35, 48) i alle fire rækker. Før stod kortene i ♥ og ♦ også i rødt. (antal) står i samme grå i alle rækker, og spillekortenes røde og sorte kort har samme farver som i tagget.
4. **Testsiden** `scripts/sorte-tal.html` viser Lynaflæsningens facit og samme hånd med spillekort gennem Vites dev-server. `vite build` bygger kun `index.html`, så siden kommer ikke med i appen. Testen kopierer siden ind i tagget worktree, så før og efter vises på samme måde.
5. **Billeder** af den sorterede hånd før og efter i lys og mørk tilstand ligger i `../skaermbilleder/sorte-tal/` (`lys-foer.png`, `lys-efter.png`, `moerk-foer.png` og `moerk-efter.png`).
6. **`SPEC.md`** (Notation) siger nu, at kun farvesymbolet er rødt i en hånd skrevet farve for farve.
