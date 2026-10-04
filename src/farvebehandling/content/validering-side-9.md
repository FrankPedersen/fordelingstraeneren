# Validering: Suit Combinations 9 – 9 High Card Point held by opponents - The Ace, King, and Queen

Kilde: [https://www.bridgehands.com/S/Suit_Combination_9.htm](https://www.bridgehands.com/S/Suit_Combination_9.htm), læst 2026-10-04. Genereret af `scripts/solve.ts`.

Model: Optimalt modspil: modspillet kender alle kort og blander sine valg; spilføreren ser kun de spillede kort. Ubegrænsede forbindelser, chancer a priori.

Fortolkninger af x: **lav** = spilførerens x'er er de laveste kort (specens regel); **høj** = spilførerens x'er er de højeste kort under det laveste navngivne kort, så modpartens små kort er lavere.

Kilden har kun hele procenter, så en afvigelse over 0,5 procentpoint gennemgås.

## Resultat

9 brugbare cases. De 10 hyppigste dækker 100 % af sidens samlede hyppighed, de 30 hyppigste 100 %.

- Brugbare cases: 9 af 9, med 10 mål.
- Fortolkning "lav": 9 af 10 mål inden for 0,5 procentpoint, 10 inden for 1 procentpoint.
- Fortolkning "høj": 0 af 10 mål inden for 0,5 procentpoint, 0 inden for 1 procentpoint.
- Mindst én af fortolkningerne inden for 0,5 procentpoint: 9 af 10 mål.
- Mål, hvor den bedste linje kræver, at spilføreren blander (ingen ren linje inden for 0,002 procentpoint): 0.

## Afvigelser over 0,5 procentpoint med fortolkningen "lav"

| Case | Hånd / bordet | Mål | Kilde | Lav | Høj | Nærmest | Kildens bemærkning |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | B 10 8 x / x x | 1 | 37 % | 37,6 % | 53,1 % | lav | Play low to 8 then low to low |

## Sorteret fra

| Case | Holding | Grund |
| --- | --- | --- |

## Alle brugbare cases

| Case | Hånd / bordet | Konkret (lav) | Mål | Kilde | Lav | Høj |
| --- | --- | --- | --- | --- | --- | --- |
| 4 | B 10 x x / x x | B 10 5 4 / 3 2 | 1 | 25 % | 24,7 % | 100,0 % |
| 9 | B x x x / x x x x | B 8 7 6 / 5 4 3 2 | 1 | 76 % | 76,3 % | 100,0 % |
| 6 | B 10 x x / x x x | B 10 6 5 / 4 3 2 | 1 | 68 % | 67,8 % | 100,0 % |
| 7 | B x x x / 10 x x | B 6 5 4 / 10 3 2 | 1 | 69 % | 68,5 % | 100,0 % |
| 8 | B 10 x x / x x x x | B 10 7 6 / 5 4 3 2 | 1 | 84 % | 83,9 % | 100,0 % |
| 2 | B 10 9 x / x x | B 10 9 4 / 3 2 | 1 | 77 % | 77,0 % | 100,0 % |
| 1 | B 10 9 x x / x | B 10 9 4 3 / 2 | 2 | 16 % | 16,0 % | 100,0 % |
| 1 | B 10 9 x x / x | B 10 9 4 3 / 2 | 1 | 87 % | 86,9 % | 100,0 % |
| 3 | B 10 8 x / x x | B 10 8 4 / 3 2 | 1 | 37 % | 37,6 % | 53,1 % |
| 5 | B 10 8 x / x x x | B 10 8 5 / 4 3 2 | 1 | 73 % | 72,6 % | 77,0 % |
