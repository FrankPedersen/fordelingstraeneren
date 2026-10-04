# Validering: Suit Combinations 6 – 6 High Card Point held by opponents - The Ace and Queen / 6 High Card Point held by opponents - The King, Queen and Jack

Kilde: [https://www.bridgehands.com/S/Suit_Combination_6.htm](https://www.bridgehands.com/S/Suit_Combination_6.htm), læst 2026-10-04. Genereret af `scripts/solve.ts`.

Model: Optimalt modspil: modspillet kender alle kort og blander sine valg; spilføreren ser kun de spillede kort. Ubegrænsede forbindelser, chancer a priori.

Fortolkninger af x: **lav** = spilførerens x'er er de laveste kort (specens regel); **høj** = spilførerens x'er er de højeste kort under det laveste navngivne kort, så modpartens små kort er lavere.

Kilden har kun hele procenter, så en afvigelse over 0,5 procentpoint gennemgås.

## Resultat

54 brugbare cases. De 10 hyppigste dækker 73 % af sidens samlede hyppighed, de 30 hyppigste 96 %.

- Brugbare cases: 54 af 60, med 98 mål.
- Fortolkning "lav": 90 af 98 mål inden for 0,5 procentpoint, 90 inden for 1 procentpoint.
- Fortolkning "høj": 39 af 98 mål inden for 0,5 procentpoint, 39 inden for 1 procentpoint.
- Mindst én af fortolkningerne inden for 0,5 procentpoint: 91 af 98 mål.
- Mål, hvor den bedste linje kræver, at spilføreren blander (ingen ren linje inden for 0,002 procentpoint): 1.

## Afvigelser over 0,5 procentpoint med fortolkningen "lav"

| Case | Hånd / bordet | Mål | Kilde | Lav | Høj | Nærmest | Kildens bemærkning |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2.4 | E 10 x x / x | 2 | 3 % | 0,8 % | 24,7 % | lav | Play low to low |
| 2.6 | E 10 x x x / x | 2 | 67 % | 62,2 % | 100,0 % | lav | Play low to low |
| 1 | K B 9 / x x | 2 | 27 % | 24,3 % | 24,3 % | lav | Finesse Q then finesse A, or finesse 10 then Q |
| 10 | K 10 8 x / B x x | 4 | 3 % | 0,0 % | 0,0 % | lav | Finesse 9 then play low to 10 | Play low to 10 then low to 8 |
| 10 | K 10 8 x / B x x | 3 | 2 % | 19,6 % | 25,6 % | lav | Finesse 9 then play low to 10 | Play low to 10 then low to 8 |
| 2.12 | E 10 9 8 x / x x | 3 | 82 % | 74,3 % | 82,3 % | høj | Play low to 10 |
| 2.29 | E 10 x x x x / 9 x x | 6 | 41 % | 0,0 % | 0,0 % | lav | Play low to 10 then play A |
| 2.29 | E 10 x x x x / 9 x x | 5 | 95 % | 40,7 % | 40,7 % | lav | Play low to 10 then play A |

## Sorteret fra

| Case | Holding | Grund |
| --- | --- | --- |
| 2.5 | E 10 9 8 x / x | 2 mål, men 1 procenter |
| 2.7 | E 10 x x x / x | dublet af case 2.6 |
| 2.16 | E 10 9 8 / x x x | holdingen har 4+3 kort, men fordelingen er 5-2 |
| 2.17 | E 10 9 x / – | holdingen har 4+0 kort, men fordelingen er 4-3 |
| 2.23 | E 10 9 8 x x / x x | dublet af case 2.22 |
| 2.27 | E 10 9 x … x / x | uklart antal kort (…) |

## Alle brugbare cases

| Case | Hånd / bordet | Konkret (lav) | Mål | Kilde | Lav | Høj |
| --- | --- | --- | --- | --- | --- | --- |
| 8 | K x x / B x x | K 5 4 / B 3 2 | 2 | 1 % | 0,7 % | 50,0 % |
| 8 | K x x / B x x | K 5 4 / B 3 2 | 1 | 74 % | 74,5 % | 100,0 % |
| 15 | K x x x / B x x | K 6 5 4 / B 3 2 | 2 | 26 % | 26,5 % | 100,0 % |
| 15 | K x x x / B x x | K 6 5 4 / B 3 2 | 1 | 94 % | 93,5 % | 100,0 % |
| 5 | K B x / x x x | K B 5 / 4 3 2 | 2 | 24 % | 24,0 % | 50,0 % |
| 5 | K B x / x x x | K B 5 / 4 3 2 | 1 | 76 % | 76,0 % | 100,0 % |
| 24 | K x x x / B x x x | K 7 6 5 / B 4 3 2 | 3 | 3 % | 3,4 % | 50,0 % |
| 24 | K x x x / B x x x | K 7 6 5 / B 4 3 2 | 2 | 50 % | 50,3 % | 100,0 % |
| 24 | K x x x / B x x x | K 7 6 5 / B 4 3 2 | 1 | 100 % | 100,0 % | 100,0 % |
| 2.18 | E 10 x x / x x x | E 10 6 5 / 4 3 2 | 2 | 45 % | 44,8 % | 89,0 % |
| 2.4 | E 10 x x / x | E 10 4 3 / 2 | 2 | 3 % | 0,8 % | 24,7 % |
| 2.15 | E 10 x x x / x x | E 10 6 5 4 / 3 2 | 3 | 36 % | 35,5 % | 82,3 % |
| 2.15 | E 10 x x x / x x | E 10 6 5 4 / 3 2 | 2 | 84 % | 84,0 % | 100,0 % |
| 11 | K 10 x x / B x x | K 10 5 4 / B 3 2 | 3 | 9 % | 8,7 % | 50,0 % |
| 11 | K 10 x x / B x x | K 10 5 4 / B 3 2 | 2 | 69 % | 69,0 % | 100,0 % |
| 2.6 | E 10 x x x / x | E 10 5 4 3 / 2 | 3 | 2 % | 1,8 % | 30,5 % |
| 2.6 | E 10 x x x / x | E 10 5 4 3 / 2 | 2 | 67 % | 62,2 % | 100,0 % |
| 13 | K x x x / B 10 x | K 5 4 3 / B 10 2 | 2 | 75 % | 75,4 % | 100,0 % |
| 26 | K B x x x / x x x x | K B 8 7 6 / 5 4 3 2 | 4 | 33 % | 32,8 % | 50,0 % |
| 26 | K B x x x / x x x x | K B 8 7 6 / 5 4 3 2 | 3 | 83 % | 82,8 % | 100,0 % |
| 26 | K B x x x / x x x x | K B 8 7 6 / 5 4 3 2 | 2 | 95 % | 95,2 % | 100,0 % |
| 7 | K x x / B 9 x | K 4 3 / B 9 2 | 2 | 1 % | 1,2 % | 1,2 % |
| 7 | K x x / B 9 x | K 4 3 / B 9 2 | 1 | 76 % | 75,9 % | 79,7 % |
| 2.9 | E 10 9 x / x x | E 10 9 4 / 3 2 | 2 | 25 % | 24,7 % | 77,0 % |
| 2.13 | E 10 9 x x / x x | E 10 9 5 4 / 3 2 | 3 | 45 % | 45,2 % | 82,3 % |
| 2.13 | E 10 9 x x / x x | E 10 9 5 4 / 3 2 | 2 | 88 % | 88,4 % | 100,0 % |
| 14 | K x x x / B 9 x | K 5 4 3 / B 9 2 | 2 | 40 % | 39,7 % | 76,0 % |
| 14 | K x x x / B 9 x | K 5 4 3 / B 9 2 | 1 | 98 % | 98,4 % | 100,0 % |
| 2.19 | E x x x / 10 9 x | E 5 4 3 / 10 9 2 | 2 | 36 % | 35,5 % | 89,0 % |
| 2.2 | E 10 9 x / x | E 10 9 3 / 2 | 2 | 3 % | 2,7 % | 24,7 % |
| 18 | K x x x x / B 10 x | K 6 5 4 3 / B 10 2 | 4 | 3 % | 3,4 % | 48,0 % |
| 18 | K x x x x / B 10 x | K 6 5 4 3 / B 10 2 | 3 | 85 % | 84,8 % | 100,0 % |
| 18 | K x x x x / B 10 x | K 6 5 4 3 / B 10 2 | 2 | 98 % | 98,0 % | 100,0 % |
| 2.10 | E 10 8 x / x x | E 10 8 4 / 3 2 | 2 | 8 % | 8,0 % | 13,7 % |
| 23 | K x x x / B 9 x x | K 6 5 4 / B 9 3 2 | 3 | 3 % | 3,4 % | 6,2 % |
| 23 | K x x x / B 9 x x | K 6 5 4 / B 9 3 2 | 2 | 70 % | 70,3 % | 87,6 % |
| 23 | K x x x / B 9 x x | K 6 5 4 / B 9 3 2 | 1 | 100 % | 100,0 % | 100,0 % |
| 2.24 | E 10 x x x / 9 x x | E 10 6 5 4 / 9 3 2 | 3 | 85 % | 84,8 % | 92,4 % |
| 2.24 | E 10 x x x / 9 x x | E 10 6 5 4 / 9 3 2 | 2 | 100 % | 100,0 % | 100,0 % |
| 2.3 | E 10 8 x / x | E 10 8 3 / 2 | 2 | 1 % | 0,8 % | 2,3 % |
| 2.14 | E 10 8 x x / x x | E 10 8 5 4 / 3 2 | 3 | 39 % | 38,8 % | 44,8 % |
| 2.14 | E 10 8 x x / x x | E 10 8 5 4 / 3 2 | 2 | 85 % | 85,2 % | 96,8 % |
| 1 | K B 9 / x x | K B 9 / 3 2 | 2 | 27 % | 24,3 % | 24,3 % |
| 1 | K B 9 / x x | K B 9 / 3 2 | 1 | 78 % | 77,7 % | 77,7 % |
| 4 | K B 9 / x x x | K B 9 / 4 3 2 | 2 | 25 % | 24,7 % | 24,7 % |
| 4 | K B 9 / x x x | K B 9 / 4 3 2 | 1 | 79 % | 79,4 % | 79,4 % |
| 10 | K 10 8 x / B x x | K 10 8 4 / B 3 2 | 4 | 3 % | 0,0 % | 0,0 % |
| 10 | K 10 8 x / B x x | K 10 8 4 / B 3 2 | 3 | 2 % | 19,6 % | 25,6 % |
| 2.11 | E 9 8 x / 10 x | E 9 8 3 / 10 2 | 2 | 27 % | 26,9 % | 77,0 % |
| 2.12 | E 10 9 8 x / x x | E 10 9 8 4 / 3 2 | 3 | 82 % | 74,3 % | 82,3 % |
| 16 | K 10 8 x x / B x x | K 10 8 5 4 / B 3 2 | 4 | 27 % | 26,6 % | 28,3 % |
| 16 | K 10 8 x x / B x x | K 10 8 5 4 / B 3 2 | 3 | 90 % | 90,4 % | 92,4 % |
| 16 | K 10 8 x x / B x x | K 10 8 5 4 / B 3 2 | 2 | 98 % | 98,0 % | 100,0 % |
| 17 | K 9 8 x x / B x x | K 9 8 5 4 / B 3 2 | 4 | 3 % | 3,4 % | 3,4 % |
| 17 | K 9 8 x x / B x x | K 9 8 5 4 / B 3 2 | 3 | 84 % | 83,7 % | 85,6 % |
| 17 | K 9 8 x x / B x x | K 9 8 5 4 / B 3 2 | 2 | 98 % | 98,0 % | 100,0 % |
| 2 | K B 10 9 / x x | K B 10 9 / 3 2 | 3 | 18 % | 18,2 % | 18,2 % |
| 2.21 | E 10 x x x x x / x | E 10 7 6 5 4 3 / 2 | 5 | 68 % | 67,8 % | 84,8 % |
| 2.21 | E 10 x x x x x / x | E 10 7 6 5 4 3 / 2 | 4 | 96 % | 96,1 % | 100,0 % |
| 6 | K 9 8 / B x x | K 9 8 / B 3 2 | 2 | 1 % | 1,2 % | 1,2 % |
| 6 | K 9 8 / B x x | K 9 8 / B 3 2 | 1 | 80 % | 79,7 % | 79,7 % |
| 20 | K 10 8 x / B x x x | K 10 8 5 / B 4 3 2 | 3 | 27 % | 27,4 % | 30,2 % |
| 20 | K 10 8 x / B x x x | K 10 8 5 / B 4 3 2 | 2 | 92 % | 92,4 % | 97,2 % |
| 22 | K x x x / B 10 8 x | K 5 4 3 / B 10 8 2 | 3 | 14 % | 13,6 % | 19,2 % |
| 22 | K x x x / B 10 8 x | K 5 4 3 / B 10 8 2 | 2 | 92 % | 92,4 % | 97,2 % |
| 2.22 | E 10 9 8 x x / x x | E 10 9 8 5 4 / 3 2 | 4 | 90 % | 90,4 % | 92,4 % |
| 2.22 | E 10 9 8 x x / x x | E 10 9 8 5 4 / 3 2 | 3 | 98 % | 98,0 % | 100,0 % |
| 3 | E B 9 8 / x x | E B 9 8 / 3 2 | 3 | 9 % | 9,4 % | 9,4 % |
| 3 | E B 9 8 / x x | E B 9 8 / 3 2 | 2 | 81 % | 81,3 % | 81,3 % |
| 2.8 | E 10 9 8 / x x | E 10 9 8 / 3 2 | 2 | 77 % | 77,0 % | 77,0 % |
| 2.30 | E 10 x x x / 9 x x x | E 10 7 6 5 / 9 4 3 2 | 4 | 41 % | 40,7 % | 40,7 % |
| 2.30 | E 10 x x x / 9 x x x | E 10 7 6 5 / 9 4 3 2 | 3 | 95 % | 95,2 % | 95,2 % |
| 25 | K B 9 x x / x x x x | K B 9 7 6 / 5 4 3 2 | 4 | 33 % | 32,8 % | 32,8 % |
| 25 | K B 9 x x / x x x x | K B 9 7 6 / 5 4 3 2 | 3 | 89 % | 89,0 % | 89,0 % |
| 25 | K B 9 x x / x x x x | K B 9 7 6 / 5 4 3 2 | 2 | 95 % | 95,2 % | 100,0 % |
| 9 | K B 9 8 / x x x | K B 9 8 / 4 3 2 | 3 | 24 % | 24,0 % | 24,0 % |
| 9 | K B 9 8 / x x x | K B 9 8 / 4 3 2 | 2 | 76 % | 76,0 % | 76,0 % |
| 29 | K B x x x x / 10 x x x | K B 8 7 6 5 / 10 4 3 2 | 5 | 63 % | 63,0 % | 63,0 % |
| 2.1 | E 10 9 8 / x | E 10 9 8 / 2 | 2 | 25 % | 24,7 % | 24,7 % |
| 2.29 | E 10 x x x x / 9 x x | E 10 7 6 5 4 / 9 3 2 | 6 | 41 % | 0,0 % | 0,0 % |
| 2.29 | E 10 x x x x / 9 x x | E 10 7 6 5 4 / 9 3 2 | 5 | 95 % | 40,7 % | 40,7 % |
| 2.25 | E 8 7 x x / 10 x x | E 8 7 5 4 / 10 3 2 | 3 | 71 % | 70,7 % | 70,7 % |
| 2.25 | E 8 7 x x / 10 x x | E 8 7 5 4 / 10 3 2 | 2 | 98 % | 98,0 % | 98,0 % |
| 2.20 | E 10 9 8 x x x / x | E 10 9 8 5 4 3 / 2 | 5 | 85 % | 84,8 % | 84,8 % |
| 2.20 | E 10 9 8 x x x / x | E 10 9 8 5 4 3 / 2 | 4 | 98 % | 98,0 % | 100,0 % |
| 2.28 | E 10 9 x x x x / x x | E 10 9 7 6 5 4 / 3 2 | 6 | 41 % | 40,7 % | 40,7 % |
| 2.28 | E 10 9 x x x x / x x | E 10 9 7 6 5 4 / 3 2 | 5 | 95 % | 95,2 % | 95,2 % |
| 12 | K 9 8 7 / B x x | K 9 8 7 / B 3 2 | 3 | 1 % | 1,2 % | 1,2 % |
| 12 | K 9 8 7 / B x x | K 9 8 7 / B 3 2 | 2 | 76 % | 76,0 % | 76,0 % |
| 19 | K B 9 8 / x x x x | K B 9 8 / 5 4 3 2 | 3 | 27 % | 27,4 % | 27,4 % |
| 19 | K B 9 8 / x x x x | K B 9 8 / 5 4 3 2 | 2 | 83 % | 82,8 % | 82,8 % |
| 2.26 | E 10 9 8 / x x x x | E 10 9 8 / 5 4 3 2 | 2 | 92 % | 92,4 % | 92,4 % |
| 21 | K 9 8 7 / B x x x | K 9 8 7 / B 4 3 2 | 3 | 6 % | 6,2 % | 6,2 % |
| 21 | K 9 8 7 / B x x x | K 9 8 7 / B 4 3 2 | 2 | 88 % | 87,6 % | 87,6 % |
| 27 | K 9 8 7 x / B x x x | K 9 8 7 5 / B 4 3 2 | 4 | 27 % | 26,6 % | 26,6 % |
| 27 | K 9 8 7 x / B x x x | K 9 8 7 5 / B 4 3 2 | 3 | 94 % | 93,8 % | 93,8 % |
| 28 | K x x x x / B 10 9 8 | K 5 4 3 2 / B 10 9 8 | 4 | 50 % | 50,0 % | 50,0 % |
| 30 | K x x x x x / B 10 9 x | K 7 6 5 4 3 / B 10 9 2 | 5 | 63 % | 63,0 % | 63,0 % |
