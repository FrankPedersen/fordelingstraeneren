# Validering: Suit Combinations 2 – 2 High Card Point held by opponents - The Queen

Kilde: [https://www.bridgehands.com/S/Suit_Combination_2.htm](https://www.bridgehands.com/S/Suit_Combination_2.htm), læst 2026-10-04. Genereret af `scripts/solve.ts`.

Model: Optimalt modspil: modspillet kender alle kort og blander sine valg; spilføreren ser kun de spillede kort. Ubegrænsede forbindelser, chancer a priori.

Fortolkninger af x: **lav** = spilførerens x'er er de laveste kort (specens regel); **høj** = spilførerens x'er er de højeste kort under det laveste navngivne kort, så modpartens små kort er lavere.

Kilden har kun hele procenter, så en afvigelse over 0,5 procentpoint gennemgås.

## Resultat

85 brugbare cases. De 10 hyppigste dækker 59 % af sidens samlede hyppighed, de 30 hyppigste 83 %.

- Brugbare cases: 85 af 100, med 155 mål.
- Fortolkning "lav": 143 af 155 mål inden for 0,5 procentpoint, 147 inden for 1 procentpoint.
- Fortolkning "høj": 71 af 155 mål inden for 0,5 procentpoint, 83 inden for 1 procentpoint.
- Mindst én af fortolkningerne inden for 0,5 procentpoint: 143 af 155 mål.
- Mål, hvor den bedste linje kræver, at spilføreren blander (ingen ren linje inden for 0,002 procentpoint): 3.

## Afvigelser over 0,5 procentpoint med fortolkningen "lav"

| Case | Hånd / bordet | Mål | Kilde | Lav | Høj | Nærmest | Kildens bemærkning |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 36 | E K 9 x / B x x | 3 | 85 % | 83,9 % | 83,9 % | lav | Finesse J 10 | Play A, finesse Q |
| 9 | E K 9 x / B x | 3 | 75 % | 74,5 % | 76,0 % | lav | Finesse Q and if covered finesse 10 |
| 56 | E K 9 x x x / B x | 6 | 14 % | 15,3 % | 16,7 % | lav | Play A then J, or J then A, or finesse Q (to 9) then A | Finesse Q 10, finesse Q then play A | Finesse Q (to 9) then play A |
| 4 | E K B 10 x x / – | 6 | 9 % | 0,0 % | 9,7 % | høj | – |
| 4 | E K B 10 x x / – | 5 | 94 % | 70,9 % | 100,0 % | høj | – |
| 55 | E K 9 8 x x / B x | 6 | 16 % | 16,7 % | 16,7 % | lav | Play J then play K or finesse 10 | Play A and finesse Q |
| 57 | E B 8 x x x / K x | 4 | 99 % | 98,0 % | 100,0 % | lav | Play K then finesse Q |
| 22 | E K B 9 8 / x x | 4 | 74 % | 77,0 % | 77,0 % | lav | Play A then finesse Q, or finesse Q | Finesse 10 an if loses to 10 play A and K | Play A then finesse Q, or finesse 10 then Q |
| 22 | E K B 9 8 / x x | 3 | 94 % | 100,0 % | 100,0 % | lav | Play A then finesse Q, or finesse Q | Finesse 10 an if loses to 10 play A and K | Play A then finesse Q, or finesse 10 then Q |
| 95 | E K 9 x x x / B x x x | 6 | 89 % | 78,0 % | 78,0 % | lav | Play A K |
| 98 | E K 9 x x / B x x x x | 5 | 89 % | 78,0 % | 78,0 % | lav | Play A K |
| 54 | E K 9 8 7 x / B x | 6 | 16 % | 16,7 % | 16,7 % | lav | Play J then low to 10 or low to A and K | Play A and finesse Q |

## Sorteret fra

| Case | Holding | Grund |
| --- | --- | --- |
| 5 | E K B 9 x x / x | holdingen har 6+1 kort, men fordelingen er 5-1 |
| 6 | E K B x x x / x | holdingen har 6+1 kort, men fordelingen er 5-1 |
| 14 | E K B 10 9 x / – | holdingen har 6+0 kort, men fordelingen er 7-0 |
| 15 | E K B 9 x x / – | holdingen har 6+0 kort, men fordelingen er 7-0 |
| 30 | E K B 10 x / x x | 1 mål, men 2 procenter |
| 41 | E B 9 8 / K x x | 1 mål, men 2 procenter |
| 42 | E K x x / B x x | dublet af case 40 |
| 53 | E K B 9 x x / x x | dublet af case 52 |
| 74 | E K B x … x / x | uklart antal kort (…) |
| 75 | E K B x … x / x x | uklart antal kort (…) |
| 76 | E K 9 x … x / B x | uklart antal kort (…) |
| 77 | E B x … x / K 9 | uklart antal kort (…) |
| 78 | E K B 10 x … x / x x x | uklart antal kort (…) |
| 85 | E K x x x x / B 10 9 x | holdingen har 6+4 kort, men fordelingen er 5-4 |
| 92 | E K 9 x … x / B x | uklart antal kort (…) |

## Alle brugbare cases

| Case | Hånd / bordet | Konkret (lav) | Mål | Kilde | Lav | Høj |
| --- | --- | --- | --- | --- | --- | --- |
| 40 | E K x x / B x x | E K 5 4 / B 3 2 | 3 | 69 % | 69,0 % | 100,0 % |
| 44 | E B 3 2 / K 5 4 | E B 3 2 / K 5 4 | 4 | 18 % | 17,8 % | 17,8 % |
| 44 | E B 3 2 / K 5 4 | E B 3 2 / K 5 4 | 3 | 77 % | 77,0 % | 77,0 % |
| 13 | E K x / B x x | E K 4 / B 3 2 | 3 | 10 % | 9,7 % | 50,5 % |
| 33 | E K B x / x x x | E K B 5 / 4 3 2 | 4 | 18 % | 17,8 % | 51,2 % |
| 33 | E K B x / x x x | E K B 5 / 4 3 2 | 3 | 77 % | 77,0 % | 100,0 % |
| 48 | B x x x / E K x | B 5 4 3 / E K 2 | 3 | 77 % | 77,0 % | 100,0 % |
| 28 | E B x x x / K x | E B 5 4 3 / K 2 | 5 | 18 % | 17,8 % | 28,3 % |
| 28 | E B x x x / K x | E B 5 4 3 / K 2 | 4 | 60 % | 59,8 % | 100,0 % |
| 28 | E B x x x / K x | E B 5 4 3 / K 2 | 3 | 93 % | 93,2 % | 100,0 % |
| 34 | E K 10 x / x x x | E K 10 5 / 4 3 2 | 4 | 7 % | 7,1 % | 24,0 % |
| 34 | E K 10 x / x x x | E K 10 5 / 4 3 2 | 3 | 56 % | 56,5 % | 77,6 % |
| 20 | E K B x x x / x | E K B 5 4 3 / 2 | 6 | 18 % | 17,8 % | 27,0 % |
| 20 | E K B x x x / x | E K B 5 4 3 / 2 | 5 | 60 % | 59,8 % | 100,0 % |
| 20 | E K B x x x / x | E K B 5 4 3 / 2 | 4 | 91 % | 91,2 % | 100,0 % |
| 20 | E K B x x x / x | E K B 5 4 3 / 2 | 3 | 99 % | 99,3 % | 100,0 % |
| 90 | B x x x x / E K x x | B 7 6 5 4 / E K 3 2 | 5 | 53 % | 53,1 % | 57,9 % |
| 90 | B x x x x / E K x x | B 7 6 5 4 / E K 3 2 | 4 | 95 % | 95,2 % | 100,0 % |
| 46 | B 10 x x / E K x | B 10 4 3 / E K 2 | 4 | 20 % | 20,2 % | 28,3 % |
| 24 | E B 10 x x / K x | E B 10 4 3 / K 2 | 5 | 26 % | 25,8 % | 28,3 % |
| 24 | E B 10 x x / K x | E B 10 4 3 / K 2 | 4 | 86 % | 86,4 % | 100,0 % |
| 51 | E K B 10 x x / x x | E K B 10 5 4 / 3 2 | 6 | 48 % | 48,0 % | 48,0 % |
| 51 | E K B 10 x x / x x | E K B 10 5 4 / 3 2 | 5 | 98 % | 98,0 % | 100,0 % |
| 36 | E K 9 x / B x x | E K 9 4 / B 3 2 | 4 | 9 % | 8,7 % | 25,2 % |
| 36 | E K 9 x / B x x | E K 9 4 / B 3 2 | 3 | 85 % | 83,9 % | 83,9 % |
| 39 | E K x x / B 9 x | E K 4 3 / B 9 2 | 4 | 1 % | 1,2 % | 25,2 % |
| 39 | E K x x / B 9 x | E K 4 3 / B 9 2 | 3 | 78 % | 78,3 % | 83,9 % |
| 43 | E B 9 x / K x x | E B 9 4 / K 3 2 | 4 | 29 % | 29,0 % | 29,0 % |
| 43 | E B 9 x / K x x | E B 9 4 / K 3 2 | 3 | 85 % | 84,7 % | 85,5 % |
| 45 | K 9 x x / E B x | K 9 4 3 / E B 2 | 4 | 21 % | 20,6 % | 25,2 % |
| 45 | K 9 x x / E B x | K 9 4 3 / E B 2 | 3 | 84 % | 83,9 % | 83,9 % |
| 72 | E B x x / K 9 x x | E B 5 4 / K 9 3 2 | 4 | 37 % | 36,7 % | 41,5 % |
| 72 | E B x x / K 9 x x | E B 5 4 / K 9 3 2 | 3 | 100 % | 100,0 % | 100,0 % |
| 100 | E B x x x / K x x x x | E B 8 7 6 / K 5 4 3 2 | 5 | 89 % | 89,0 % | 89,0 % |
| 18 | E K B 10 x x / x | E K B 10 4 3 / 2 | 6 | 26 % | 25,8 % | 27,0 % |
| 18 | E K B 10 x x / x | E K B 10 4 3 / 2 | 5 | 86 % | 86,4 % | 100,0 % |
| 18 | E K B 10 x x / x | E K B 10 4 3 / 2 | 4 | 99 % | 98,5 % | 100,0 % |
| 59 | E K 9 x x / B x x | E K 9 5 4 / B 3 2 | 5 | 30 % | 30,0 % | 30,0 % |
| 59 | E K 9 x x / B x x | E K 9 5 4 / B 3 2 | 4 | 96 % | 96,1 % | 98,0 % |
| 64 | E B 9 x x / K x x | E B 9 5 4 / K 3 2 | 5 | 40 % | 39,6 % | 39,6 % |
| 64 | E B 9 x x / K x x | E B 9 5 4 / K 3 2 | 4 | 90 % | 89,6 % | 97,2 % |
| 64 | E B 9 x x / K x x | E B 9 5 4 / K 3 2 | 3 | 98 % | 98,0 % | 100,0 % |
| 26 | E K 9 x x / B x | E K 9 4 3 / B 2 | 5 | 7 % | 7,1 % | 8,7 % |
| 26 | E K 9 x x / B x | E K 9 4 3 / B 2 | 4 | 68 % | 67,8 % | 77,0 % |
| 26 | E K 9 x x / B x | E K 9 4 3 / B 2 | 3 | 99 % | 98,8 % | 100,0 % |
| 27 | E B 9 x x / K x | E B 9 4 3 / K 2 | 5 | 19 % | 19,4 % | 19,4 % |
| 27 | E B 9 x x / K x | E B 9 4 3 / K 2 | 4 | 69 % | 69,0 % | 72,7 % |
| 27 | E B 9 x x / K x | E B 9 4 3 / K 2 | 3 | 94 % | 94,4 % | 100,0 % |
| 29 | K B 9 x x / E x | K B 9 4 3 / E 2 | 5 | 19 % | 19,4 % | 19,4 % |
| 29 | K B 9 x x / E x | K B 9 4 3 / E 2 | 4 | 69 % | 69,0 % | 72,7 % |
| 29 | K B 9 x x / E x | K B 9 4 3 / E 2 | 3 | 94 % | 94,4 % | 100,0 % |
| 9 | E K 9 x / B x | E K 9 3 / B 2 | 3 | 75 % | 74,5 % | 76,0 % |
| 10 | E B 9 x / K x | E B 9 3 / K 2 | 4 | 6 % | 5,9 % | 5,9 % |
| 10 | E B 9 x / K x | E B 9 3 / K 2 | 3 | 69 % | 68,7 % | 68,7 % |
| 2 | E K B x x / – | E K B 3 2 / – | 3 | 55 % | 55,0 % | 100,0 % |
| 69 | E K 9 x / B x x x | E K 9 5 / B 4 3 2 | 4 | 30 % | 30,0 % | 32,8 % |
| 69 | E K 9 x / B x x x | E K 9 5 / B 4 3 2 | 3 | 100 % | 100,0 % | 100,0 % |
| 52 | E K B 9 x x / x x | E K B 9 5 4 / 3 2 | 6 | 37 % | 36,7 % | 36,7 % |
| 52 | E K B 9 x x / x x | E K B 9 5 4 / 3 2 | 5 | 88 % | 87,6 % | 87,6 % |
| 52 | E K B 9 x x / x x | E K B 9 5 4 / 3 2 | 4 | 98 % | 98,0 % | 100,0 % |
| 63 | E K x x x / B 9 x | E K 5 4 3 / B 9 2 | 5 | 27 % | 27,1 % | 30,0 % |
| 63 | E K x x x / B 9 x | E K 5 4 3 / B 9 2 | 4 | 88 % | 87,6 % | 98,0 % |
| 63 | E K x x x / B 9 x | E K 5 4 3 / B 9 2 | 3 | 98 % | 98,0 % | 100,0 % |
| 65 | E B x x x / K 9 x | E B 5 4 3 / K 9 2 | 5 | 34 % | 33,9 % | 39,6 % |
| 65 | E B x x x / K 9 x | E B 5 4 3 / K 9 2 | 4 | 96 % | 96,1 % | 97,2 % |
| 66 | E 9 x x x / K B x | E 9 5 4 3 / K B 2 | 5 | 37 % | 36,7 % | 39,6 % |
| 66 | E 9 x x x / K B x | E 9 5 4 3 / K B 2 | 4 | 96 % | 96,1 % | 98,0 % |
| 19 | E K B 9 x x / x | E K B 9 4 3 / 2 | 6 | 19 % | 19,4 % | 19,4 % |
| 19 | E K B 9 x x / x | E K B 9 4 3 / 2 | 5 | 68 % | 67,8 % | 71,5 % |
| 19 | E K B 9 x x / x | E K B 9 4 3 / 2 | 4 | 92 % | 92,5 % | 100,0 % |
| 19 | E K B 9 x x / x | E K B 9 4 3 / 2 | 3 | 99 % | 99,3 % | 100,0 % |
| 31 | E K B 10 / x x x | E K B 10 / 4 3 2 | 4 | 51 % | 51,2 % | 51,2 % |
| 56 | E K 9 x x x / B x | E K 9 5 4 3 / B 2 | 6 | 14 % | 15,3 % | 16,7 % |
| 56 | E K 9 x x x / B x | E K 9 5 4 3 / B 2 | 5 | 85 % | 84,8 % | 87,6 % |
| 56 | E K 9 x x x / B x | E K 9 5 4 3 / B 2 | 4 | 100 % | 100,0 % | 100,0 % |
| 12 | E K 9 / B x x | E K 9 / B 3 2 | 3 | 24 % | 24,5 % | 24,5 % |
| 86 | E B 9 x x / K 10 x x | E B 9 5 4 / K 10 3 2 | 5 | 58 % | 57,9 % | 57,9 % |
| 88 | E B x x x / K 9 x x | E B 6 5 4 / K 9 3 2 | 5 | 53 % | 53,1 % | 57,9 % |
| 89 | E 9 x x x / K B x x | E 9 6 5 4 / K B 3 2 | 5 | 53 % | 53,1 % | 57,9 % |
| 91 | B 10 9 x x / E K x x | B 10 9 5 4 / E K 3 2 | 5 | 58 % | 57,9 % | 57,9 % |
| 7 | E K B 9 / x x | E K B 9 / 3 2 | 4 | 24 % | 24,0 % | 24,0 % |
| 7 | E K B 9 / x x | E K B 9 / 3 2 | 3 | 76 % | 76,0 % | 76,0 % |
| 11 | E B x x / K 9 | E B 3 2 / K 9 | 3 | 68 % | 68,4 % | 68,7 % |
| 17 | E K B x x x x / – | E K B 5 4 3 2 / – | 6 | 52 % | 51,7 % | 100,0 % |
| 17 | E K B x x x x / – | E K B 5 4 3 2 / – | 5 | 86 % | 86,4 % | 100,0 % |
| 17 | E K B x x x x / – | E K B 5 4 3 2 / – | 4 | 99 % | 98,5 % | 100,0 % |
| 94 | E B x x x x x / K x x | E B 8 7 6 5 4 / K 3 2 | 7 | 89 % | 89,0 % | 89,0 % |
| 32 | E K B 9 / x x x | E K B 9 / 4 3 2 | 4 | 29 % | 29,0 % | 29,0 % |
| 32 | E K B 9 / x x x | E K B 9 / 4 3 2 | 3 | 85 % | 84,7 % | 84,7 % |
| 23 | E B 10 9 x / K x | E B 10 9 3 / K 2 | 5 | 28 % | 28,3 % | 28,3 % |
| 68 | E K B 10 / x x x x | E K B 10 / 5 4 3 2 | 4 | 53 % | 52,8 % | 52,8 % |
| 79 | E K 9 x x x / B x x | E K 9 6 5 4 / B 3 2 | 6 | 53 % | 53,1 % | 53,1 % |
| 47 | B 9 8 x / E K x | B 9 8 3 / E K 2 | 4 | 11 % | 10,9 % | 10,9 % |
| 47 | B 9 8 x / E K x | B 9 8 3 / E K 2 | 3 | 85 % | 85,5 % | 85,5 % |
| 70 | E K 8 x / B x x x | E K 8 5 / B 4 3 2 | 4 | 27 % | 27,1 % | 27,1 % |
| 70 | E K 8 x / B x x x | E K 8 5 / B 4 3 2 | 3 | 92 % | 92,4 % | 92,4 % |
| 71 | E K x x / B 9 8 x | E K 4 3 / B 9 8 2 | 4 | 33 % | 32,8 % | 32,8 % |
| 71 | E K x x / B 9 8 x | E K 4 3 / B 9 8 2 | 3 | 100 % | 100,0 % | 100,0 % |
| 58 | E K 9 8 x / B x x | E K 9 8 4 / B 3 2 | 5 | 30 % | 30,0 % | 30,0 % |
| 58 | E K 9 8 x / B x x | E K 9 8 4 / B 3 2 | 4 | 96 % | 96,1 % | 98,0 % |
| 67 | B 9 8 x x / E K x | B 9 8 4 3 / E K 2 | 5 | 30 % | 30,0 % | 30,0 % |
| 67 | B 9 8 x x / E K x | B 9 8 4 3 / E K 2 | 4 | 96 % | 96,1 % | 96,1 % |
| 25 | E K 9 8 x / B x | E K 9 8 3 / B 2 | 5 | 9 % | 8,7 % | 8,7 % |
| 25 | E K 9 8 x / B x | E K 9 8 3 / B 2 | 4 | 73 % | 72,7 % | 77,0 % |
| 4 | E K B 10 x x / – | E K B 10 3 2 / – | 6 | 9 % | 0,0 % | 9,7 % |
| 4 | E K B 10 x x / – | E K B 10 3 2 / – | 5 | 94 % | 70,9 % | 100,0 % |
| 3 | E K B 10 / x | E K B 10 / 2 | 4 | 11 % | 11,2 % | 11,2 % |
| 37 | E K x x / B 10 9 | E K 3 2 / B 10 9 | 4 | 50 % | 50,0 % | 51,2 % |
| 49 | E K B 10 9 x x / x | E K B 10 9 4 3 / 2 | 7 | 37 % | 36,7 % | 36,7 % |
| 55 | E K 9 8 x x / B x | E K 9 8 4 3 / B 2 | 6 | 16 % | 16,7 % | 16,7 % |
| 55 | E K 9 8 x x / B x | E K 9 8 4 3 / B 2 | 5 | 88 % | 87,6 % | 87,6 % |
| 57 | E B 8 x x x / K x | E B 8 5 4 3 / K 2 | 6 | 34 % | 33,9 % | 33,9 % |
| 57 | E B 8 x x x / K x | E B 8 5 4 3 / K 2 | 5 | 85 % | 84,8 % | 84,8 % |
| 57 | E B 8 x x x / K x | E B 8 5 4 3 / K 2 | 4 | 99 % | 98,0 % | 100,0 % |
| 21 | E K B 10 9 / x x | E K B 10 9 / 3 2 | 5 | 43 % | 43,2 % | 43,2 % |
| 83 | E B x x x x / K 9 x | E B 6 5 4 3 / K 9 2 | 6 | 53 % | 53,1 % | 57,9 % |
| 99 | E B 9 x x / K 10 x x x | E B 9 6 5 / K 10 4 3 2 | 5 | 89 % | 89,0 % | 89,0 % |
| 1 | E K B 10 x / – | E K B 10 2 / – | 4 | 37 % | 37,4 % | 100,0 % |
| 35 | E K 9 8 / B x x | E K 9 8 / B 3 2 | 4 | 25 % | 25,2 % | 25,2 % |
| 35 | E K 9 8 / B x x | E K 9 8 / B 3 2 | 3 | 84 % | 83,9 % | 83,9 % |
| 38 | E K x x / B 9 8 | E K 3 2 / B 9 8 | 4 | 8 % | 8,3 % | 25,2 % |
| 38 | E K x x / B 9 8 | E K 3 2 / B 9 8 | 3 | 78 % | 78,3 % | 83,9 % |
| 61 | E K x x x / B 10 9 | E K 4 3 2 / B 10 9 | 5 | 48 % | 48,0 % | 50,9 % |
| 73 | E 10 8 x / K B 9 x | E 10 8 3 / K B 9 2 | 4 | 53 % | 52,8 % | 52,8 % |
| 22 | E K B 9 8 / x x | E K B 9 8 / 3 2 | 5 | 19 % | 19,4 % | 19,4 % |
| 22 | E K B 9 8 / x x | E K B 9 8 / 3 2 | 4 | 74 % | 77,0 % | 77,0 % |
| 22 | E K B 9 8 / x x | E K B 9 8 / 3 2 | 3 | 94 % | 100,0 % | 100,0 % |
| 84 | E K 8 x x / B x x x | E K 8 6 5 / B 4 3 2 | 5 | 53 % | 53,1 % | 53,1 % |
| 84 | E K 8 x x / B x x x | E K 8 6 5 / B 4 3 2 | 4 | 100 % | 100,0 % | 100,0 % |
| 8 | E K 9 8 / B x | E K 9 8 / B 2 | 4 | 6 % | 5,7 % | 5,7 % |
| 8 | E K 9 8 / B x | E K 9 8 / B 2 | 3 | 76 % | 76,0 % | 76,0 % |
| 95 | E K 9 x x x / B x x x | E K 9 7 6 5 / B 4 3 2 | 6 | 89 % | 78,0 % | 78,0 % |
| 80 | E K 8 x x x / B x x | E K 8 6 5 4 / B 3 2 | 6 | 53 % | 53,1 % | 53,1 % |
| 80 | E K 8 x x x / B x x | E K 8 6 5 4 / B 3 2 | 5 | 100 % | 100,0 % | 100,0 % |
| 62 | E K x x x / B 9 8 | E K 4 3 2 / B 9 8 | 5 | 27 % | 27,1 % | 30,0 % |
| 62 | E K x x x / B 9 8 | E K 4 3 2 / B 9 8 | 4 | 88 % | 87,6 % | 98,0 % |
| 62 | E K x x x / B 9 8 | E K 4 3 2 / B 9 8 | 3 | 100 % | 100,0 % | 100,0 % |
| 98 | E K 9 x x / B x x x x | E K 9 7 6 / B 5 4 3 2 | 5 | 89 % | 78,0 % | 78,0 % |
| 97 | K 9 x x x x / E B 10 x | K 9 6 5 4 3 / E B 10 2 | 6 | 89 % | 89,0 % | 89,0 % |
| 54 | E K 9 8 7 x / B x | E K 9 8 7 3 / B 2 | 6 | 16 % | 16,7 % | 16,7 % |
| 54 | E K 9 8 7 x / B x | E K 9 8 7 3 / B 2 | 5 | 88 % | 87,6 % | 87,6 % |
| 16 | E K B 8 x x x / – | E K B 8 4 3 2 / – | 6 | 55 % | 54,9 % | 54,9 % |
| 16 | E K B 8 x x x / – | E K B 8 4 3 2 / – | 5 | 86 % | 86,4 % | 91,2 % |
| 16 | E K B 8 x x x / – | E K B 8 4 3 2 / – | 4 | 99 % | 98,5 % | 100,0 % |
| 81 | E K x x x x / B 10 9 | E K 5 4 3 2 / B 10 9 | 6 | 53 % | 53,1 % | 57,9 % |
| 93 | E K 9 x x x x / B x x | E K 9 7 6 5 4 / B 3 2 | 7 | 78 % | 78,0 % | 78,0 % |
| 60 | E K 7 x x / B 9 8 | E K 7 3 2 / B 9 8 | 5 | 30 % | 30,0 % | 30,0 % |
| 60 | E K 7 x x / B 9 8 | E K 7 3 2 / B 9 8 | 4 | 97 % | 97,2 % | 98,0 % |
| 50 | E K B 9 8 7 x / x | E K B 9 8 7 3 / 2 | 7 | 34 % | 33,9 % | 33,9 % |
| 50 | E K B 9 8 7 x / x | E K B 9 8 7 3 / 2 | 6 | 85 % | 84,8 % | 84,8 % |
| 82 | E K x x x x / B 9 8 | E K 5 4 3 2 / B 9 8 | 6 | 53 % | 53,1 % | 53,1 % |
| 82 | E K x x x x / B 9 8 | E K 5 4 3 2 / B 9 8 | 5 | 100 % | 100,0 % | 100,0 % |
| 87 | E B x x x / K 9 8 7 | E B 4 3 2 / K 9 8 7 | 5 | 58 % | 57,9 % | 57,9 % |
| 87 | E B x x x / K 9 8 7 | E B 4 3 2 / K 9 8 7 | 4 | 100 % | 100,0 % | 100,0 % |
| 96 | K x x x x x / E B 9 8 | K 6 5 4 3 2 / E B 9 8 | 6 | 89 % | 89,0 % | 89,0 % |
