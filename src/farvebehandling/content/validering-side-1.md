# Validering: Suit Combinations 1 – 1 High Card Point held by opponents - The Jack

Kilde: [https://www.bridgehands.com/S/Suit_Combination_1.htm](https://www.bridgehands.com/S/Suit_Combination_1.htm), læst 2026-10-04. Genereret af `scripts/solve.ts`.

Model: Optimalt modspil: modspillet kender alle kort og blander sine valg; spilføreren ser kun de spillede kort. Ubegrænsede forbindelser, chancer a priori.

Fortolkninger af x: **lav** = spilførerens x'er er de laveste kort (specens regel); **høj** = spilførerens x'er er de højeste kort under det laveste navngivne kort, så modpartens små kort er lavere.

Kilden har kun hele procenter, så en afvigelse over 0,5 procentpoint gennemgås.

## Resultat

39 brugbare cases. De 10 hyppigste dækker 72 % af sidens samlede hyppighed, de 30 hyppigste 97 %.

- Brugbare cases: 39 af 54, med 63 mål.
- Fortolkning "lav": 59 af 63 mål inden for 0,5 procentpoint, 61 inden for 1 procentpoint.
- Fortolkning "høj": 18 af 63 mål inden for 0,5 procentpoint, 24 inden for 1 procentpoint.
- Mindst én af fortolkningerne inden for 0,5 procentpoint: 59 af 63 mål.
- Mål, hvor den bedste linje kræver, at spilføreren blander (ingen ren linje inden for 0,002 procentpoint): 0.

## Afvigelser over 0,5 procentpoint med fortolkningen "lav"

| Case | Hånd / bordet | Mål | Kilde | Lav | Høj | Nærmest | Kildens bemærkning |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 35 | E K D 10 x x / x x | 6 | 74 % | 73,5 % | 73,5 % | lav | Drop J |
| 51 | E K x x x x x / D x | 7 | 95 % | 90,4 % | 100,0 % | lav | Drop J (Q first) |
| 12 | E K D 10 9 x x / – | 6 | 54 % | 98,5 % | 100,0 % | lav | – |
| 12 | E K D 10 9 x x / – | 5 | 99 % | 100,0 % | 100,0 % | lav | – |

## Sorteret fra

| Case | Holding | Grund |
| --- | --- | --- |
| 23 | E K D 10 / x x x | holdingen har 4+3 kort, men fordelingen er 5-2 |
| 24 | E K D 9 / x x x | holdingen har 4+3 kort, men fordelingen er 5-2 |
| 25 | E K 10 x / D x x | holdingen har 4+3 kort, men fordelingen er 5-2 |
| 26 | E K 9 x / D x x | holdingen har 4+3 kort, men fordelingen er 5-2 |
| 27 | E K x x / D 10 x | holdingen har 4+3 kort, men fordelingen er 5-2 |
| 28 | E 10 x x / K D x | holdingen har 4+3 kort, men fordelingen er 5-2 |
| 29 | E 9 x x / K D x | holdingen har 4+3 kort, men fordelingen er 5-2 |
| 30 | E x x x / K D 10 | holdingen har 4+3 kort, men fordelingen er 5-2 |
| 31 | E K D 10 x … x / – | uklart antal kort (…) |
| 32 | E K D x … x / – | uklart antal kort (…) |
| 38 | E K D x x / x x x | et mål er større end antal runder |
| 44 | E K D 10 x … x / – | uklart antal kort (…) |
| 45 | E K D x … x / – | uklart antal kort (…) |
| 47 | E K D x … x / x | uklart antal kort (…) |
| 52 | E K D x x x / x x x | dublet af case 36 |

## Alle brugbare cases

| Case | Hånd / bordet | Konkret (lav) | Mål | Kilde | Lav | Høj |
| --- | --- | --- | --- | --- | --- | --- |
| 49 | E K D x x x / x x | E K D 6 5 4 / 3 2 | 6 | 68 % | 67,8 % | 100,0 % |
| 49 | E K D x x x / x x | E K D 6 5 4 / 3 2 | 5 | 96 % | 96,1 % | 100,0 % |
| 36 | E K D x x x / x x x | E K D 7 6 5 / 4 3 2 | 6 | 90 % | 90,4 % | 100,0 % |
| 40 | E K D x / x x x x | E K D 6 / 5 4 3 2 | 4 | 68 % | 67,8 % | 100,0 % |
| 8 | E K D x x / x | E K D 4 3 / 2 | 4 | 62 % | 62,2 % | 100,0 % |
| 50 | E K D x x x x / x x | E K D 7 6 5 4 / 3 2 | 7 | 90 % | 90,4 % | 100,0 % |
| 34 | E K D x x x x / x | E K D 6 5 4 3 / 2 | 7 | 68 % | 67,8 % | 100,0 % |
| 34 | E K D x x x x / x | E K D 6 5 4 3 / 2 | 6 | 96 % | 96,1 % | 100,0 % |
| 18 | E K D 10 x / x x | E K D 10 4 / 3 2 | 5 | 52 % | 51,7 % | 54,1 % |
| 18 | E K D 10 x / x x | E K D 10 4 / 3 2 | 4 | 93 % | 93,2 % | 100,0 % |
| 35 | E K D 10 x x / x x | E K D 10 5 4 / 3 2 | 6 | 74 % | 73,5 % | 73,5 % |
| 35 | E K D 10 x x / x x | E K D 10 5 4 / 3 2 | 5 | 98 % | 98,0 % | 100,0 % |
| 51 | E K x x x x x / D x | E K 7 6 5 4 3 / D 2 | 7 | 95 % | 90,4 % | 100,0 % |
| 37 | E K D 10 x / x x x | E K D 10 5 / 4 3 2 | 5 | 85 % | 84,8 % | 86,7 % |
| 37 | E K D 10 x / x x x | E K D 10 5 / 4 3 2 | 4 | 98 % | 98,0 % | 100,0 % |
| 55 | E K 10 x x / D x x x | E K 10 6 5 / D 4 3 2 | 5 | 95 % | 95,2 % | 100,0 % |
| 11 | E K D x x x / – | E K D 4 3 2 / – | 5 | 62 % | 62,2 % | 100,0 % |
| 11 | E K D x x x / – | E K D 4 3 2 / – | 4 | 93 % | 92,7 % | 100,0 % |
| 53 | E K 10 x x x / D x x | E K 10 6 5 4 / D 3 2 | 6 | 95 % | 95,2 % | 100,0 % |
| 19 | E K D 9 x / x x | E K D 9 4 / 3 2 | 5 | 39 % | 38,8 % | 38,8 % |
| 19 | E K D 9 x / x x | E K D 9 4 / 3 2 | 4 | 90 % | 89,6 % | 94,4 % |
| 21 | E K 9 x x / D x | E K 9 4 3 / D 2 | 5 | 39 % | 38,8 % | 38,8 % |
| 21 | E K 9 x x / D x | E K 9 4 3 / D 2 | 4 | 86 % | 86,4 % | 94,4 % |
| 4 | E K 9 x / D x | E K 9 3 / D 2 | 4 | 10 % | 10,3 % | 10,3 % |
| 6 | E K D 10 x / x | E K D 10 3 / 2 | 5 | 31 % | 31,1 % | 36,3 % |
| 6 | E K D 10 x / x | E K D 10 3 / 2 | 4 | 81 % | 81,1 % | 100,0 % |
| 43 | E K 9 x / D x x x | E K 9 5 / D 4 3 2 | 4 | 75 % | 75,4 % | 79,1 % |
| 14 | E K D x x x x / – | E K D 5 4 3 2 / – | 7 | 36 % | 35,5 % | 100,0 % |
| 14 | E K D x x x x / – | E K D 5 4 3 2 / – | 6 | 84 % | 84,0 % | 100,0 % |
| 14 | E K D x x x x / – | E K D 5 4 3 2 / – | 5 | 99 % | 98,5 % | 100,0 % |
| 7 | E K D 9 x / x | E K D 9 3 / 2 | 5 | 9 % | 8,9 % | 10,3 % |
| 7 | E K D 9 x / x | E K D 9 3 / 2 | 4 | 64 % | 63,6 % | 81,8 % |
| 16 | E K D 9 x x / x | E K D 9 4 3 / 2 | 6 | 39 % | 38,8 % | 38,8 % |
| 16 | E K D 9 x x / x | E K D 9 4 3 / 2 | 5 | 84 % | 84,0 % | 91,2 % |
| 16 | E K D 9 x x / x | E K D 9 4 3 / 2 | 4 | 99 % | 98,5 % | 100,0 % |
| 48 | E K D 10 x x x / x x | E K D 10 6 5 4 / 3 2 | 7 | 95 % | 95,2 % | 95,2 % |
| 54 | E K D 10 x / x x x x | E K D 10 6 / 5 4 3 2 | 5 | 95 % | 95,2 % | 95,2 % |
| 33 | E K D 10 x x x / x | E K D 10 5 4 3 / 2 | 7 | 73 % | 73,5 % | 73,5 % |
| 33 | E K D 10 x x x / x | E K D 10 5 4 3 / 2 | 6 | 98 % | 98,0 % | 100,0 % |
| 41 | E K 10 x / D 9 x x | E K 10 4 / D 9 3 2 | 4 | 89 % | 88,7 % | 88,7 % |
| 22 | E K x x x / D 10 | E K 4 3 2 / D 10 | 5 | 42 % | 42,0 % | 54,1 % |
| 22 | E K x x x / D 10 | E K 4 3 2 / D 10 | 4 | 92 % | 92,0 % | 100,0 % |
| 3 | E K D 9 / x x | E K D 9 / 3 2 | 4 | 24 % | 24,0 % | 24,0 % |
| 20 | E K 10 9 x / D x | E K 10 9 3 / D 2 | 5 | 54 % | 54,1 % | 54,1 % |
| 39 | E K D 10 / x x x x | E K D 10 / 5 4 3 2 | 4 | 87 % | 86,7 % | 86,7 % |
| 42 | E K 9 x / D 8 x x | E K 9 4 / D 8 3 2 | 4 | 79 % | 79,1 % | 79,1 % |
| 9 | E K D 10 x x / – | E K D 10 3 2 / – | 6 | 27 % | 26,6 % | 36,3 % |
| 9 | E K D 10 x x / – | E K D 10 3 2 / – | 5 | 71 % | 70,9 % | 100,0 % |
| 9 | E K D 10 x x / – | E K D 10 3 2 / – | 4 | 94 % | 93,7 % | 100,0 % |
| 1 | E K D 10 / x | E K D 10 / 2 | 4 | 50 % | 50,0 % | 50,0 % |
| 15 | E K D 10 9 x / x | E K D 10 9 3 / 2 | 6 | 54 % | 54,1 % | 54,1 % |
| 15 | E K D 10 9 x / x | E K D 10 9 3 / 2 | 5 | 99 % | 98,5 % | 100,0 % |
| 2 | E K D 9 / x | E K D 9 / 2 | 4 | 6 % | 5,7 % | 5,7 % |
| 10 | E K D 9 x x / – | E K D 9 3 2 / – | 6 | 9 % | 8,9 % | 10,3 % |
| 10 | E K D 9 x x / – | E K D 9 3 2 / – | 5 | 64 % | 63,6 % | 80,1 % |
| 10 | E K D 9 x x / – | E K D 9 3 2 / – | 4 | 93 % | 92,7 % | 100,0 % |
| 17 | E K D 10 9 / x x | E K D 10 9 / 3 2 | 5 | 54 % | 54,1 % | 54,1 % |
| 13 | E K D 9 x x x / – | E K D 9 4 3 2 / – | 7 | 39 % | 38,8 % | 38,8 % |
| 13 | E K D 9 x x x / – | E K D 9 4 3 2 / – | 6 | 84 % | 84,0 % | 88,8 % |
| 13 | E K D 9 x x x / – | E K D 9 4 3 2 / – | 5 | 99 % | 98,5 % | 100,0 % |
| 5 | E K D 10 9 / x | E K D 10 9 / 2 | 5 | 36 % | 36,3 % | 36,3 % |
| 12 | E K D 10 9 x x / – | E K D 10 9 3 2 / – | 6 | 54 % | 98,5 % | 100,0 % |
| 12 | E K D 10 9 x x / – | E K D 10 9 3 2 / – | 5 | 99 % | 100,0 % | 100,0 % |
