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

- [ ] `src/modes/read/sorted-hand.test.tsx` (i `npm test`): ingen række i den sorterede hånd har klassen for rød, ♥ og ♦ har den på symbolet, ♠ og ♣ har den ikke, og `.sorted-hand .suit.red` bruger `var(--card-red)` uden et fast farvetal.
- [ ] `node scripts/tjek-sorte-tal.mjs`: i Chrome har ♥ og ♦ i den sorterede hånd farven `--card-red` i lys og mørk tilstand, og kortene og (antal) i ♥ og ♦ har samme farve som i ♠ og ♣. Spillekortenes røde kort har samme farve som før.
- [ ] Skærmbilleder af den sorterede hånd før og efter, i lys og mørk tilstand, i `../skaermbilleder/sorte-tal/`.
- [ ] `npm test`, kørt alene, er grøn.

## Afklaret

1. **Farven er `card-red`, ikke `suit-red`** (Franks valg 5. nov. 2026, efter Claude Codes spørgsmål). Den sorterede hånd står på et hvidt kort (`#ffffff`, som `card-face`) også i mørk tilstand. `--suit-red` er rød til appens flade og bliver #ff6b6b i mørk tilstand, hvad der kun giver ca. 2,8:1 i kontrast på hvidt. Kortenes token `card-red` er #c62828 i begge tilstande og er lavet til det hvide kort. Den sorterede hånd ser derfor ens ud i lys og mørk tilstand.

Resten udfyldes, når ændringen er bygget.
