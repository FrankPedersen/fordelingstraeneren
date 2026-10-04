# Validering: Suit Combinations 7 – 7 High Card Point held by opponents - The Ace and King

Kilde: [https://www.bridgehands.com/S/Suit_Combination_7.htm](https://www.bridgehands.com/S/Suit_Combination_7.htm), læst 2026-10-04. Genereret af `scripts/solve.ts`.

Model: Optimalt modspil: modspillet kender alle kort og blander sine valg; spilføreren ser kun de spillede kort. Ubegrænsede forbindelser, chancer a priori.

Fortolkninger af x: **lav** = spilførerens x'er er de laveste kort (specens regel); **høj** = spilførerens x'er er de højeste kort under det laveste navngivne kort, så modpartens små kort er lavere.

Kilden har kun hele procenter, så en afvigelse over 0,5 procentpoint gennemgås.

## Resultat

66 brugbare cases. De 10 hyppigste dækker 78 % af sidens samlede hyppighed, de 30 hyppigste 94 %.

- Brugbare cases: 66 af 75, med 118 mål.
- Fortolkning "lav": 104 af 118 mål inden for 0,5 procentpoint, 108 inden for 1 procentpoint.
- Fortolkning "høj": 36 af 118 mål inden for 0,5 procentpoint, 37 inden for 1 procentpoint.
- Mindst én af fortolkningerne inden for 0,5 procentpoint: 108 af 118 mål.
- Mål, hvor den bedste linje kræver, at spilføreren blander (ingen ren linje inden for 0,002 procentpoint): 2.

## Afvigelser over 0,5 procentpoint med fortolkningen "lav"

| Case | Hånd / bordet | Mål | Kilde | Lav | Høj | Nærmest | Kildens bemærkning |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 69 | K x x x / x x x x | 1 | 86 % | 86,7 % | 100,0 % | lav | Play low to low then low to King |
| 30 | D x x x / B x x | 1 | 88 % | 87,1 % | 100,0 % | lav | Finesse A K towards either Q or J then play to honor | Play low to low then low to J |
| 68 | K 10 x x / x x x x | 1 | 86 % | 86,7 % | 100,0 % | lav | Play low to low then low to low |
| 61 | K 10 9 x / x x x | 1 | 93 % | 90,8 % | 100,0 % | lav | Play low to 9 then low to 10 |
| 16 | D B 8 x / x x | 2 | 7 % | 5,9 % | 6,6 % | høj | Finesse 10 9 |
| 16 | D B 8 x / x x | 1 | 85 % | 79,4 % | 84,7 % | høj | Finesse 10 9 |
| 35 | D B 9 x x / x x x | 2 | 95 % | 92,4 % | 100,0 % | lav | Finesse A K repeatedly |
| 65 | K 10 9 x x / x x x | 2 | 95 % | 92,4 % | 100,0 % | lav | Play low to low then low to low |
| 32 | D B 9 x x x / x x | 3 | 93 % | 92,4 % | 100,0 % | lav | Finesse A K then low to low | Finesse 10 then finesse A K | Either of the above |
| 17 | D x x x / B 9 | 2 | 32 % | 0,0 % | 21,0 % | høj | Finesse 10 |
| 17 | D x x x / B 9 | 1 | 97 % | 56,4 % | 100,0 % | høj | Finesse 10 |
| 71 | K 10 x x x x / x x x | 4 | 89 % | 76,6 % | 89,0 % | høj | Low to King | Low to 10 | Either of the above |
| 38 | D 9 8 x x / x x x | 2 | 90 % | 83,9 % | 89,6 % | høj | Finesse A K | Play low to low then low to Q |
| 4 | D 10 8 7 / x | 1 | 14 % | 15,1 % | 15,1 % | lav | Finesse A K |

## Sorteret fra

| Case | Holding | Grund |
| --- | --- | --- |
| 8 | D 10 9 / x x | samme kort som side 8 case 2 |
| 13 | D 10 9 x / x | dublet af case 3 |
| 20 | D 10 x / x x x | samme kort som side 8 case 9 |
| 41 | D B 10 x / x x x x | holdingen har 4+4 kort, men fordelingen er 5-3 |
| 42 | D B x x / x x x x | holdingen har 4+4 kort, men fordelingen er 5-3 |
| 43 | D 10 9 8 / x x x x | holdingen har 4+4 kort, men fordelingen er 5-3 |
| 44 | D 10 x x / x x x x | holdingen har 4+4 kort, men fordelingen er 5-3 |
| 51 | D B 10 x x / 8 x x | holdingen har 5+3 kort, men fordelingen er 6-3 |
| 72 | K 8 x x x x / x x x | for få små kort under det laveste navngivne kort til x |

## Alle brugbare cases

| Case | Hånd / bordet | Konkret (lav) | Mål | Kilde | Lav | Høj |
| --- | --- | --- | --- | --- | --- | --- |
| 64 | K x x x / x x x | K 7 6 5 / 4 3 2 | 2 | 18 % | 17,8 % | 100,0 % |
| 64 | K x x x / x x x | K 7 6 5 / 4 3 2 | 1 | 77 % | 77,0 % | 100,0 % |
| 69 | K x x x / x x x x | K 8 7 6 / 5 4 3 2 | 2 | 34 % | 33,9 % | 100,0 % |
| 69 | K x x x / x x x x | K 8 7 6 / 5 4 3 2 | 1 | 86 % | 86,7 % | 100,0 % |
| 14 | D x x x / x | D 5 4 3 / 2 | 1 | 6 % | 5,7 % | 100,0 % |
| 74 | K x x x x x / x x x | K 9 8 7 6 5 / 4 3 2 | 5 | 20 % | 20,3 % | 100,0 % |
| 74 | K x x x x x / x x x | K 9 8 7 6 5 / 4 3 2 | 4 | 72 % | 71,8 % | 100,0 % |
| 74 | K x x x x x / x x x | K 9 8 7 6 5 / 4 3 2 | 3 | 95 % | 95,2 % | 100,0 % |
| 30 | D x x x / B x x | D 6 5 4 / B 3 2 | 2 | 16 % | 15,8 % | 100,0 % |
| 30 | D x x x / B x x | D 6 5 4 / B 3 2 | 1 | 88 % | 87,1 % | 100,0 % |
| 10 | D x x / B x | D 4 3 / B 2 | 1 | 48 % | 48,4 % | 100,0 % |
| 48 | D x x x / B x x x | D 7 6 5 / B 4 3 2 | 2 | 37 % | 37,3 % | 100,0 % |
| 48 | D x x x / B x x x | D 7 6 5 / B 4 3 2 | 1 | 100 % | 100,0 % | 100,0 % |
| 36 | D B x x x / x x x | D B 7 6 5 / 4 3 2 | 3 | 63 % | 62,7 % | 100,0 % |
| 36 | D B x x x / x x x | D B 7 6 5 / 4 3 2 | 2 | 90 % | 89,6 % | 100,0 % |
| 36 | D B x x x / x x x | D B 7 6 5 / 4 3 2 | 1 | 98 % | 98,0 % | 100,0 % |
| 11 | D x x / 10 x | D 4 3 / 10 2 | 1 | 24 % | 24,0 % | 50,3 % |
| 57 | K 10 x / x x | K 10 4 / 3 2 | 1 | 63 % | 63,0 % | 77,7 % |
| 62 | K 10 x x / x x x | K 10 6 5 / 4 3 2 | 2 | 32 % | 32,3 % | 76,0 % |
| 62 | K 10 x x / x x x | K 10 6 5 / 4 3 2 | 1 | 79 % | 78,7 % | 100,0 % |
| 18 | D x x x / 10 x | D 5 4 3 / 10 2 | 1 | 24 % | 24,0 % | 100,0 % |
| 33 | D B x x x x / x x | D B 7 6 5 4 / 3 2 | 4 | 54 % | 54,3 % | 100,0 % |
| 33 | D B x x x x / x x | D B 7 6 5 4 / 3 2 | 3 | 88 % | 87,6 % | 100,0 % |
| 33 | D B x x x x / x x | D B 7 6 5 4 / 3 2 | 2 | 98 % | 98,0 % | 100,0 % |
| 9 | D 9 x / x x | D 9 4 / 3 2 | 1 | 24 % | 24,0 % | 24,0 % |
| 22 | D B 10 x x / x x | D B 10 5 4 / 3 2 | 3 | 60 % | 59,8 % | 100,0 % |
| 22 | D B 10 x x / x x | D B 10 5 4 / 3 2 | 2 | 92 % | 92,0 % | 100,0 % |
| 25 | D B 10 x / x x x | D B 10 5 / 4 3 2 | 2 | 83 % | 83,1 % | 100,0 % |
| 53 | D B x x x / x x x x | D B 8 7 6 / 5 4 3 2 | 3 | 83 % | 82,8 % | 100,0 % |
| 53 | D B x x x / x x x x | D B 8 7 6 / 5 4 3 2 | 2 | 95 % | 95,2 % | 100,0 % |
| 55 | D x x x x / B x x x | D 8 7 6 5 / B 4 3 2 | 3 | 78 % | 78,0 % | 100,0 % |
| 34 | D B 10 x x / x x x | D B 10 6 5 / 4 3 2 | 3 | 88 % | 87,6 % | 100,0 % |
| 34 | D B 10 x x / x x x | D B 10 6 5 / 4 3 2 | 2 | 98 % | 98,0 % | 100,0 % |
| 21 | D 9 x / B x x | D 9 4 / B 3 2 | 1 | 64 % | 63,7 % | 63,7 % |
| 68 | K 10 x x / x x x x | K 10 7 6 / 5 4 3 2 | 2 | 52 % | 51,7 % | 82,8 % |
| 68 | K 10 x x / x x x x | K 10 7 6 / 5 4 3 2 | 1 | 86 % | 86,7 % | 100,0 % |
| 31 | D B 10 x x x / x x | D B 10 6 5 4 / 3 2 | 4 | 82 % | 82,0 % | 100,0 % |
| 31 | D B 10 x x x / x x | D B 10 6 5 4 / 3 2 | 3 | 98 % | 98,0 % | 100,0 % |
| 23 | D B 9 x x / x x | D B 9 5 4 / 3 2 | 3 | 38 % | 38,1 % | 48,6 % |
| 23 | D B 9 x x / x x | D B 9 5 4 / 3 2 | 2 | 80 % | 80,3 % | 100,0 % |
| 23 | D B 9 x x / x x | D B 9 5 4 / 3 2 | 1 | 96 % | 95,6 % | 100,0 % |
| 1 | D B 10 x / x | D B 10 3 / 2 | 2 | 7 % | 7,2 % | 100,0 % |
| 26 | D B 9 x / x x x | D B 9 5 / 4 3 2 | 2 | 52 % | 51,8 % | 58,2 % |
| 26 | D B 9 x / x x x | D B 9 5 / 4 3 2 | 1 | 91 % | 90,8 % | 100,0 % |
| 27 | D 10 9 x / x x x | D 10 9 5 / 4 3 2 | 2 | 42 % | 42,3 % | 50,0 % |
| 27 | D 10 9 x / x x x | D 10 9 5 / 4 3 2 | 1 | 91 % | 90,8 % | 100,0 % |
| 29 | D x x x / B 9 x | D 5 4 3 / B 9 2 | 2 | 32 % | 31,8 % | 56,2 % |
| 29 | D x x x / B 9 x | D 5 4 3 / B 9 2 | 1 | 97 % | 96,8 % | 100,0 % |
| 61 | K 10 9 x / x x x | K 10 9 5 / 4 3 2 | 2 | 61 % | 60,7 % | 76,0 % |
| 61 | K 10 9 x / x x x | K 10 9 5 / 4 3 2 | 1 | 93 % | 90,8 % | 100,0 % |
| 3 | D 10 9 x / x | D 10 9 3 / 2 | 2 | 0.6 % | 0,6 % | 2,3 % |
| 3 | D 10 9 x / x | D 10 9 3 / 2 | 1 | 35 % | 35,3 % | 100,0 % |
| 6 | D B 9 x / x | D B 9 3 / 2 | 2 | 1 % | 1,3 % | 11,2 % |
| 6 | D B 9 x / x | D B 9 3 / 2 | 1 | 57 % | 56,9 % | 100,0 % |
| 24 | D B x x x / 9 x | D B 5 4 3 / 9 2 | 3 | 30 % | 30,0 % | 48,6 % |
| 24 | D B x x x / 9 x | D B 5 4 3 / 9 2 | 2 | 74 % | 74,3 % | 100,0 % |
| 24 | D B x x x / 9 x | D B 5 4 3 / 9 2 | 1 | 99 % | 98,8 % | 100,0 % |
| 16 | D B 8 x / x x | D B 8 4 / 3 2 | 2 | 7 % | 5,9 % | 6,6 % |
| 16 | D B 8 x / x x | D B 8 4 / 3 2 | 1 | 85 % | 79,4 % | 84,7 % |
| 47 | D 9 x x / B x x x | D 9 6 5 / B 4 3 2 | 2 | 64 % | 63,6 % | 66,4 % |
| 47 | D 9 x x / B x x x | D 9 6 5 / B 4 3 2 | 1 | 100 % | 100,0 % | 100,0 % |
| 35 | D B 9 x x / x x x | D B 9 6 5 / 4 3 2 | 3 | 72 % | 71,8 % | 74,6 % |
| 35 | D B 9 x x / x x x | D B 9 6 5 / 4 3 2 | 2 | 95 % | 92,4 % | 100,0 % |
| 37 | D 10 9 x x / x x x | D 10 9 6 5 / 4 3 2 | 3 | 49 % | 48,6 % | 51,4 % |
| 37 | D 10 9 x x / x x x | D 10 9 6 5 / 4 3 2 | 2 | 92 % | 92,4 % | 100,0 % |
| 37 | D 10 9 x x / x x x | D 10 9 6 5 / 4 3 2 | 1 | 98 % | 98,0 % | 100,0 % |
| 39 | D 10 9 x x / B x x | D 10 9 5 4 / B 3 2 | 3 | 96 % | 96,1 % | 100,0 % |
| 65 | K 10 9 x x / x x x | K 10 9 6 5 / 4 3 2 | 3 | 75 % | 75,2 % | 82,8 % |
| 65 | K 10 9 x x / x x x | K 10 9 6 5 / 4 3 2 | 2 | 95 % | 92,4 % | 100,0 % |
| 66 | K 10 x x x / 9 x x | K 10 6 5 4 / 9 3 2 | 3 | 67 % | 66,7 % | 82,8 % |
| 66 | K 10 x x x / 9 x x | K 10 6 5 4 / 9 3 2 | 2 | 98 % | 98,0 % | 100,0 % |
| 7 | D B 9 / x x | D B 9 / 3 2 | 1 | 78 % | 77,7 % | 77,7 % |
| 56 | K 10 9 / x x | K 10 9 / 3 2 | 1 | 78 % | 77,7 % | 77,7 % |
| 19 | D B 9 / x x x | D B 9 / 4 3 2 | 1 | 79 % | 79,4 % | 79,4 % |
| 59 | K 10 9 / x x x | K 10 9 / 4 3 2 | 1 | 79 % | 79,4 % | 79,4 % |
| 32 | D B 9 x x x / x x | D B 9 6 5 4 / 3 2 | 4 | 64 % | 63,9 % | 66,7 % |
| 32 | D B 9 x x x / x x | D B 9 6 5 4 / 3 2 | 3 | 93 % | 92,4 % | 100,0 % |
| 32 | D B 9 x x x / x x | D B 9 6 5 4 / 3 2 | 2 | 98 % | 98,0 % | 100,0 % |
| 17 | D x x x / B 9 | D 4 3 2 / B 9 | 2 | 32 % | 0,0 % | 21,0 % |
| 17 | D x x x / B 9 | D 4 3 2 / B 9 | 1 | 97 % | 56,4 % | 100,0 % |
| 28 | D 9 8 x / x x x | D 9 8 5 / 4 3 2 | 2 | 7 % | 7,1 % | 7,1 % |
| 28 | D 9 8 x / x x x | D 9 8 5 / 4 3 2 | 1 | 76 % | 75,8 % | 84,7 % |
| 76 | K x x x x / 10 x x x | K 8 7 6 5 / 10 4 3 2 | 4 | 20 % | 20,3 % | 20,3 % |
| 76 | K x x x x / 10 x x x | K 8 7 6 5 / 10 4 3 2 | 3 | 78 % | 78,0 % | 89,0 % |
| 40 | D x x x x / B 9 x | D 6 5 4 3 / B 9 2 | 3 | 50 % | 50,3 % | 64,4 % |
| 40 | D x x x x / B 9 x | D 6 5 4 3 / B 9 2 | 2 | 98 % | 98,0 % | 100,0 % |
| 71 | K 10 x x x x / x x x | K 10 8 7 6 5 / 4 3 2 | 5 | 20 % | 20,3 % | 20,3 % |
| 71 | K 10 x x x x / x x x | K 10 8 7 6 5 / 4 3 2 | 4 | 89 % | 76,6 % | 89,0 % |
| 71 | K 10 x x x x / x x x | K 10 8 7 6 5 / 4 3 2 | 3 | 95 % | 95,2 % | 100,0 % |
| 15 | D B 9 8 / x x | D B 9 8 / 3 2 | 2 | 51 % | 50,7 % | 50,7 % |
| 54 | D 9 x x x / B x x x | D 9 7 6 5 / B 4 3 2 | 3 | 83 % | 82,8 % | 87,6 % |
| 58 | K 10 9 8 / x x | K 10 9 8 / 3 2 | 2 | 50 % | 50,0 % | 50,0 % |
| 73 | K x x x x x / 10 x x | K 8 7 6 5 4 / 10 3 2 | 5 | 20 % | 20,3 % | 20,3 % |
| 73 | K x x x x x / 10 x x | K 8 7 6 5 4 / 10 3 2 | 4 | 78 % | 78,0 % | 89,0 % |
| 73 | K x x x x x / 10 x x | K 8 7 6 5 4 / 10 3 2 | 3 | 100 % | 100,0 % | 100,0 % |
| 38 | D 9 8 x x / x x x | D 9 8 6 5 / 4 3 2 | 3 | 14 % | 13,6 % | 13,6 % |
| 38 | D 9 8 x x / x x x | D 9 8 6 5 / 4 3 2 | 2 | 90 % | 83,9 % | 89,6 % |
| 50 | D x x x x x x / B x | D 8 7 6 5 4 3 / B 2 | 5 | 78 % | 78,0 % | 100,0 % |
| 70 | K 10 9 x x x / x x x | K 10 9 7 6 5 / 4 3 2 | 5 | 20 % | 20,3 % | 20,3 % |
| 70 | K 10 9 x x x / x x x | K 10 9 7 6 5 / 4 3 2 | 4 | 89 % | 89,0 % | 89,0 % |
| 70 | K 10 9 x x x / x x x | K 10 9 7 6 5 / 4 3 2 | 3 | 95 % | 95,2 % | 100,0 % |
| 60 | K 10 9 8 / x x x | K 10 9 8 / 4 3 2 | 2 | 76 % | 76,0 % | 76,0 % |
| 5 | D B 9 8 / x | D B 9 8 / 2 | 2 | 11 % | 11,2 % | 11,2 % |
| 12 | D B 10 8 / x | D B 10 8 / 2 | 2 | 51 % | 50,7 % | 50,7 % |
| 2 | D B 8 7 / x | D B 8 7 / 2 | 2 | 0.6 % | 0,6 % | 0,6 % |
| 2 | D B 8 7 / x | D B 8 7 / 2 | 1 | 44 % | 44,1 % | 44,1 % |
| 4 | D 10 8 7 / x | D 10 8 7 / 2 | 2 | 0.3 % | 0,3 % | 0,3 % |
| 4 | D 10 8 7 / x | D 10 8 7 / 2 | 1 | 14 % | 15,1 % | 15,1 % |
| 52 | D B 8 x x / 10 x x x | D B 8 6 5 / 10 4 3 2 | 3 | 95 % | 95,2 % | 100,0 % |
| 49 | D B 9 x x x x / x x | D B 9 7 6 5 4 / 3 2 | 5 | 84 % | 84,2 % | 84,2 % |
| 49 | D B 9 x x x x / x x | D B 9 7 6 5 4 / 3 2 | 4 | 95 % | 95,2 % | 100,0 % |
| 63 | K 9 8 7 / x x x | K 9 8 7 / 4 3 2 | 2 | 18 % | 17,8 % | 17,8 % |
| 63 | K 9 8 7 / x x x | K 9 8 7 / 4 3 2 | 1 | 95 % | 95,2 % | 95,2 % |
| 67 | K 10 9 8 / x x x x | K 10 9 8 / 5 4 3 2 | 2 | 83 % | 82,8 % | 82,8 % |
| 75 | K 9 x x x / x x x x | K 9 8 7 6 / 5 4 3 2 | 4 | 20 % | 20,3 % | 20,3 % |
| 75 | K 9 x x x / x x x x | K 9 8 7 6 / 5 4 3 2 | 3 | 72 % | 71,8 % | 71,8 % |
| 75 | K 9 x x x / x x x x | K 9 8 7 6 / 5 4 3 2 | 2 | 95 % | 95,2 % | 95,2 % |
| 45 | D 9 8 7 / B x x x | D 9 8 7 / B 4 3 2 | 2 | 66 % | 66,4 % | 66,4 % |
