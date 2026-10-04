# Validering: Suit Combinations 8 – 8 High Card Point held by opponents - The Ace, King, and Jack

Kilde: [https://www.bridgehands.com/S/Suit_Combination_8.htm](https://www.bridgehands.com/S/Suit_Combination_8.htm), læst 2026-10-04. Genereret af `scripts/solve.ts`.

Model: Optimalt modspil: modspillet kender alle kort og blander sine valg; spilføreren ser kun de spillede kort. Ubegrænsede forbindelser, chancer a priori.

Fortolkninger af x: **lav** = spilførerens x'er er de laveste kort (specens regel); **høj** = spilførerens x'er er de højeste kort under det laveste navngivne kort, så modpartens små kort er lavere.

Kilden har kun hele procenter, så en afvigelse over 0,5 procentpoint gennemgås.

## Resultat

22 brugbare cases. De 10 hyppigste dækker 87 % af sidens samlede hyppighed, de 30 hyppigste 100 %.

- Brugbare cases: 22 af 22, med 41 mål.
- Fortolkning "lav": 40 af 41 mål inden for 0,5 procentpoint, 41 inden for 1 procentpoint.
- Fortolkning "høj": 9 af 41 mål inden for 0,5 procentpoint, 9 inden for 1 procentpoint.
- Mindst én af fortolkningerne inden for 0,5 procentpoint: 40 af 41 mål.
- Mål, hvor den bedste linje kræver, at spilføreren blander (ingen ren linje inden for 0,002 procentpoint): 0.

## Afvigelser over 0,5 procentpoint med fortolkningen "lav"

| Case | Hånd / bordet | Mål | Kilde | Lav | Høj | Nærmest | Kildens bemærkning |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 11 | D 10 x x / x x x | 1 | 70 % | 69,4 % | 100,0 % | lav | Finesse J then low to Q |

## Sorteret fra

| Case | Holding | Grund |
| --- | --- | --- |

## Alle brugbare cases

| Case | Hånd / bordet | Konkret (lav) | Mål | Kilde | Lav | Høj |
| --- | --- | --- | --- | --- | --- | --- |
| 20 | D x x x / x x x x | D 8 7 6 / 5 4 3 2 | 2 | 14 % | 13,6 % | 100,0 % |
| 20 | D x x x / x x x x | D 8 7 6 / 5 4 3 2 | 1 | 84 % | 83,9 % | 100,0 % |
| 18 | D x x x x / x x x | D 8 7 6 5 / 4 3 2 | 3 | 14 % | 13,6 % | 100,0 % |
| 18 | D x x x x / x x x | D 8 7 6 5 / 4 3 2 | 2 | 82 % | 82,0 % | 100,0 % |
| 18 | D x x x x / x x x | D 8 7 6 5 / 4 3 2 | 1 | 98 % | 98,0 % | 100,0 % |
| 7 | D 10 x x / x x | D 10 5 4 / 3 2 | 2 | 1 % | 0,9 % | 18,2 % |
| 7 | D 10 x x / x x | D 10 5 4 / 3 2 | 1 | 41 % | 41,3 % | 100,0 % |
| 22 | D x x x x / x x x x | D 9 8 7 6 / 5 4 3 2 | 3 | 53 % | 53,1 % | 100,0 % |
| 22 | D x x x x / x x x x | D 9 8 7 6 / 5 4 3 2 | 2 | 95 % | 95,2 % | 100,0 % |
| 3 | D 10 x / x x | D 10 4 / 3 2 | 1 | 37 % | 37,3 % | 50,3 % |
| 9 | D 10 x / x x x | D 10 5 / 4 3 2 | 1 | 38 % | 37,7 % | 50,7 % |
| 11 | D 10 x x / x x x | D 10 6 5 / 4 3 2 | 2 | 22 % | 21,7 % | 50,0 % |
| 11 | D 10 x x / x x x | D 10 6 5 / 4 3 2 | 1 | 70 % | 69,4 % | 100,0 % |
| 15 | D x x x / 10 x x | D 6 5 4 / 10 3 2 | 2 | 7 % | 7,1 % | 50,0 % |
| 15 | D x x x / 10 x x | D 6 5 4 / 10 3 2 | 1 | 70 % | 70,1 % | 100,0 % |
| 10 | D 10 x x x / x x | D 10 6 5 4 / 3 2 | 3 | 12 % | 12,4 % | 27,0 % |
| 10 | D 10 x x x / x x | D 10 6 5 4 / 3 2 | 2 | 55 % | 54,9 % | 100,0 % |
| 10 | D 10 x x x / x x | D 10 6 5 4 / 3 2 | 1 | 91 % | 90,8 % | 100,0 % |
| 16 | D 10 x x x / x x x | D 10 7 6 5 / 4 3 2 | 3 | 33 % | 32,8 % | 51,4 % |
| 16 | D 10 x x x / x x x | D 10 7 6 5 / 4 3 2 | 2 | 84 % | 83,9 % | 100,0 % |
| 16 | D 10 x x x / x x x | D 10 7 6 5 / 4 3 2 | 1 | 98 % | 98,0 % | 100,0 % |
| 13 | D 9 x x / x x x | D 9 6 5 / 4 3 2 | 2 | 7 % | 7,1 % | 7,1 % |
| 13 | D 9 x x / x x x | D 9 6 5 / 4 3 2 | 1 | 61 % | 61,3 % | 84,7 % |
| 19 | D 10 x x / x x x x | D 10 7 6 / 5 4 3 2 | 2 | 35 % | 34,7 % | 53,4 % |
| 19 | D 10 x x / x x x x | D 10 7 6 / 5 4 3 2 | 1 | 84 % | 83,9 % | 100,0 % |
| 5 | D 10 9 x / x x | D 10 9 4 / 3 2 | 2 | 9 % | 9,4 % | 18,2 % |
| 5 | D 10 9 x / x x | D 10 9 4 / 3 2 | 1 | 81 % | 81,3 % | 100,0 % |
| 17 | D x x x x / 10 x x | D 7 6 5 4 / 10 3 2 | 3 | 20 % | 20,3 % | 51,4 % |
| 17 | D x x x x / 10 x x | D 7 6 5 4 / 10 3 2 | 2 | 90 % | 90,4 % | 100,0 % |
| 17 | D x x x x / 10 x x | D 7 6 5 4 / 10 3 2 | 1 | 100 % | 100,0 % | 100,0 % |
| 14 | D x x x / 10 9 x | D 5 4 3 / 10 9 2 | 2 | 7 % | 7,1 % | 50,0 % |
| 14 | D x x x / 10 9 x | D 5 4 3 / 10 9 2 | 1 | 97 % | 96,8 % | 100,0 % |
| 6 | D 10 8 x / x x | D 10 8 4 / 3 2 | 2 | 2 % | 1,8 % | 5,2 % |
| 6 | D 10 8 x / x x | D 10 8 4 / 3 2 | 1 | 52 % | 52,2 % | 63,7 % |
| 2 | D 10 9 / x x | D 10 9 / 3 2 | 1 | 50 % | 50,3 % | 50,3 % |
| 8 | D 10 9 / x x x | D 10 9 / 4 3 2 | 1 | 51 % | 50,7 % | 50,7 % |
| 4 | D 10 9 8 / x x | D 10 9 8 / 3 2 | 2 | 18 % | 18,2 % | 18,2 % |
| 21 | D 10 9 x x / x x x x | D 10 9 7 6 / 5 4 3 2 | 3 | 70 % | 70,3 % | 70,3 % |
| 1 | D 10 9 8 / x | D 10 9 8 / 2 | 2 | 2 % | 2,3 % | 2,3 % |
| 12 | D 9 8 7 / x x x | D 9 8 7 / 4 3 2 | 2 | 7 % | 7,1 % | 7,1 % |
| 12 | D 9 8 7 / x x x | D 9 8 7 / 4 3 2 | 1 | 85 % | 84,7 % | 84,7 % |
