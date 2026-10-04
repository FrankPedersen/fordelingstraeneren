# Validering: Suit Combinations 3 – 3 High Card Point held by opponents - The King / 3 High Card Point held by opponents - The Queen and Jack

Kilde: [https://www.bridgehands.com/S/Suit_Combination_3.htm](https://www.bridgehands.com/S/Suit_Combination_3.htm), læst 2026-10-04. Genereret af `scripts/solve.ts`.

Model: Optimalt modspil: modspillet kender alle kort og blander sine valg; spilføreren ser kun de spillede kort. Ubegrænsede forbindelser, chancer a priori.

Fortolkninger af x: **lav** = spilførerens x'er er de laveste kort (specens regel); **høj** = spilførerens x'er er de højeste kort under det laveste navngivne kort, så modpartens små kort er lavere.

Kilden har kun hele procenter, så en afvigelse over 0,5 procentpoint gennemgås.

## Resultat

135 brugbare cases. De 10 hyppigste dækker 44 % af sidens samlede hyppighed, de 30 hyppigste 71 %.

- Brugbare cases: 135 af 146, med 278 mål.
- Fortolkning "lav": 262 af 278 mål inden for 0,5 procentpoint, 262 inden for 1 procentpoint.
- Fortolkning "høj": 134 af 278 mål inden for 0,5 procentpoint, 138 inden for 1 procentpoint.
- Mindst én af fortolkningerne inden for 0,5 procentpoint: 265 af 278 mål.
- Mål, hvor den bedste linje kræver, at spilføreren blander (ingen ren linje inden for 0,002 procentpoint): 3.

## Afvigelser over 0,5 procentpoint med fortolkningen "lav"

| Case | Hånd / bordet | Mål | Kilde | Lav | Høj | Nærmest | Kildens bemærkning |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 10 | E D x / B x x | 3 | 25 % | 4,8 % | 50,0 % | lav | Same as below, or finesse 10 then K | Play J then finesse K, if K initially then finesse 10 |
| 38 | B x x x / E D x | 4 | 9 % | 0,0 % | 27,0 % | lav | Finesse 10 (toward 9) then low to Q | Finesse K then finesse 10 (toward 9) |
| 38 | B x x x / E D x | 3 | 71 % | 46,0 % | 100,0 % | lav | Finesse 10 (toward 9) then low to Q | Finesse K then finesse 10 (toward 9) |
| 32 | E 9 x x / D B x | 4 | 9 % | 0,0 % | 9,3 % | høj | Play low to Q then low to J |
| 60 | B 9 x x x / E D x | 3 | 100 % | 98,0 % | 100,0 % | høj | Finesse K then play J, or finesse K then play A | Play low to A then play Q | Play low |
| 51 | E D 8 x x / B x x | 3 | 100 % | 98,0 % | 100,0 % | høj | Finesse K (low to Q) then play A | J then finesse K (low to Q), or low to A then Q | Play low then play J |
| 18 | E D x x x / B 9 | 5 | 7 % | 0,0 % | 8,7 % | høj | Finesse 10 then play J |
| 18 | E D x x x / B 9 | 4 | 58 % | 49,1 % | 71,5 % | lav | Finesse 10 then play J |
| 41 | E D 9 8 x x / B x | 6 | 34 % | 13,6 % | 13,6 % | lav | Finesse K then play J |
| 41 | E D 9 8 x x / B x | 4 | 98 % | 100,0 % | 100,0 % | lav | Finesse K then play J |
| 58 | E x x x x / D B 9 | 4 | 82 % | 84,8 % | 93,3 % | lav | Finesse K (low to Q) repeatedly (low to J) | Finesse K (low to Q) repeatedly (low to J) |
| 61 | B x x x x / E D 9 | 4 | 88 % | 84,8 % | 93,3 % | lav | Play J then low to 9 or Q, or finesse K then play J | Finesse K then play J | Any of the above |
| 5 | E D 9 8 / B x | 4 | 4 % | 5,2 % | 5,2 % | lav | Play J then finesse K, if K initially then finesse 10 |
| 5 | E D 9 8 / B x | 3 | 3 % | 68,2 % | 68,2 % | lav | Play J then finesse K, if K initially then finesse 10 |
| 63 | B 7 x x x / E D 6 | 4 | 73 % | 76,3 % | 76,3 % | lav | Finesse K (low to Q) then play A | Play A then Q | Any of the above |
| 63 | B 7 x x x / E D 6 | 3 | 96 % | 98,0 % | 98,0 % | lav | Finesse K (low to Q) then play A | Play A then Q | Any of the above |

## Sorteret fra

| Case | Holding | Grund |
| --- | --- | --- |
| 24 | E D B x / B x x | et kort står to gange |
| 33 | D B 9 x / E x x x | holdingen har 4+4 kort, men fordelingen er 4-3 |
| 44 | E D x x x x / B 9 | dublet af case 43 |
| 55 | E D x x x / B 9 x | dublet af case 53 |
| 65 | E D B x / B x x x | et kort står to gange |
| 72 | E D 9 x / B x x x | dublet af case 67 |
| 73 | E D 8 x / B x x x | dublet af case 68 |
| 78 | E D B 10 x … x / x | uklart antal kort (…) |
| 92 | E D 9 7 x / B 8 x x | dublet af case 91 |
| 101 | E B 9 x … x / D x | uklart antal kort (…) |
| 2.7 | E K 10 9 / x x x | holdingen har 4+3 kort, men fordelingen er 5-2 |

## Alle brugbare cases

| Case | Hånd / bordet | Konkret (lav) | Mål | Kilde | Lav | Høj |
| --- | --- | --- | --- | --- | --- | --- |
| 34 | D B x x / E x x | D B 5 4 / E 3 2 | 3 | 69 % | 69,0 % | 100,0 % |
| 71 | E D x x / B x x x | E D 6 5 / B 4 3 2 | 4 | 14 % | 13,6 % | 50,0 % |
| 71 | E D x x / B x x x | E D 6 5 / B 4 3 2 | 3 | 73 % | 73,5 % | 100,0 % |
| 75 | E x x x / D B x x | E 6 5 4 / D B 3 2 | 3 | 87 % | 86,7 % | 100,0 % |
| 10 | E D x / B x x | E D 4 / B 3 2 | 3 | 25 % | 4,8 % | 50,0 % |
| 10 | E D x / B x x | E D 4 / B 3 2 | 2 | 100 % | 100,0 % | 100,0 % |
| 23 | E D B x / x x x | E D B 5 / 4 3 2 | 4 | 18 % | 17,8 % | 50,0 % |
| 23 | E D B x / x x x | E D B 5 / 4 3 2 | 3 | 69 % | 69,0 % | 100,0 % |
| 38 | B x x x / E D x | B 5 4 3 / E D 2 | 4 | 9 % | 0,0 % | 27,0 % |
| 38 | B x x x / E D x | B 5 4 3 / E D 2 | 3 | 71 % | 46,0 % | 100,0 % |
| 9 | E D x x / B x | E D 4 3 / B 2 | 3 | 18 % | 18,2 % | 100,0 % |
| 2.11 | E 10 x x / K x x | E 10 5 4 / K 3 2 | 3 | 56 % | 56,5 % | 81,6 % |
| 19 | E D x x x / B x | E D 5 4 3 / B 2 | 4 | 44 % | 43,6 % | 100,0 % |
| 19 | E D x x x / B x | E D 5 4 3 / B 2 | 3 | 86 % | 86,4 % | 100,0 % |
| 99 | D B x x x / E x x x | D B 7 6 5 / E 4 3 2 | 5 | 20 % | 20,3 % | 50,0 % |
| 99 | D B x x x / E x x x | D B 7 6 5 / E 4 3 2 | 4 | 95 % | 95,2 % | 100,0 % |
| 64 | E D B x / x x x x | E D B 6 / 5 4 3 2 | 4 | 34 % | 33,9 % | 50,0 % |
| 64 | E D B x / x x x x | E D B 6 / 5 4 3 2 | 3 | 87 % | 86,7 % | 100,0 % |
| 2.27 | E 10 x x / K x x x | E 10 6 5 / K 4 3 2 | 4 | 7 % | 6,8 % | 9,0 % |
| 2.27 | E 10 x x / K x x x | E 10 6 5 / K 4 3 2 | 3 | 84 % | 83,9 % | 94,3 % |
| 90 | E D B x x / x x x x | E D B 7 6 / 5 4 3 2 | 5 | 45 % | 45,2 % | 50,0 % |
| 90 | E D B x x / x x x x | E D B 7 6 / 5 4 3 2 | 4 | 95 % | 95,2 % | 100,0 % |
| 97 | E x x x x / D B x x | E 7 6 5 4 / D B 3 2 | 5 | 20 % | 20,3 % | 50,0 % |
| 97 | E x x x x / D B x x | E 7 6 5 4 / D B 3 2 | 4 | 95 % | 95,2 % | 100,0 % |
| 2.21 | E 10 x x x / K x x | E 10 6 5 4 / K 3 2 | 5 | 7 % | 6,8 % | 9,0 % |
| 2.21 | E 10 x x x / K x x | E 10 6 5 4 / K 3 2 | 4 | 82 % | 82,0 % | 94,3 % |
| 2.21 | E 10 x x x / K x x | E 10 6 5 4 / K 3 2 | 3 | 98 % | 98,0 % | 100,0 % |
| 45 | E D x x x x / B x | E D 6 5 4 3 / B 2 | 5 | 73 % | 73,5 % | 100,0 % |
| 45 | E D x x x x / B x | E D 6 5 4 3 / B 2 | 4 | 96 % | 96,1 % | 100,0 % |
| 88 | D B x x x x / E x x | D B 7 6 5 4 / E 3 2 | 6 | 20 % | 20,3 % | 45,2 % |
| 88 | D B x x x x / E x x | D B 7 6 5 4 / E 3 2 | 5 | 95 % | 95,2 % | 100,0 % |
| 48 | E D 10 x x / B x x | E D 10 5 4 / B 3 2 | 5 | 37 % | 36,7 % | 48,0 % |
| 48 | E D 10 x x / B x x | E D 10 5 4 / B 3 2 | 4 | 96 % | 96,1 % | 100,0 % |
| 26 | E D 9 x / B x x | E D 9 4 / B 3 2 | 4 | 9 % | 8,7 % | 25,2 % |
| 26 | E D 9 x / B x x | E D 9 4 / B 3 2 | 3 | 72 % | 71,8 % | 79,0 % |
| 30 | E D x x / B 9 x | E D 4 3 / B 9 2 | 4 | 1 % | 1,2 % | 25,2 % |
| 30 | E D x x / B 9 x | E D 4 3 / B 9 2 | 3 | 64 % | 63,7 % | 79,0 % |
| 32 | E 9 x x / D B x | E 9 4 3 / D B 2 | 4 | 9 % | 0,0 % | 9,3 % |
| 32 | E 9 x x / D B x | E 9 4 3 / D B 2 | 3 | 83 % | 82,6 % | 82,6 % |
| 37 | B 9 x x / E D x | B 9 4 3 / E D 2 | 4 | 9 % | 9,3 % | 9,9 % |
| 37 | B 9 x x / E D x | B 9 4 3 / E D 2 | 3 | 69 % | 68,6 % | 77,8 % |
| 2.8 | E K 9 x / 10 x x | E K 9 4 / 10 3 2 | 4 | 9 % | 8,7 % | 24,0 % |
| 2.8 | E K 9 x / 10 x x | E K 9 4 / 10 3 2 | 3 | 72 % | 71,8 % | 77,6 % |
| 2.10 | E 10 x x / K 9 x | E 10 4 3 / K 9 2 | 4 | 3 % | 3,2 % | 4,0 % |
| 2.10 | E 10 x x / K 9 x | E 10 4 3 / K 9 2 | 3 | 75 % | 75,0 % | 81,6 % |
| 70 | E D x x / B 9 x x | E D 5 4 / B 9 3 2 | 4 | 16 % | 16,4 % | 26,8 % |
| 70 | E D x x / B 9 x x | E D 5 4 / B 9 3 2 | 3 | 90 % | 89,6 % | 97,2 % |
| 77 | D B x x / E 9 x x | D B 5 4 / E 9 3 2 | 4 | 14 % | 13,6 % | 16,4 % |
| 77 | D B x x / E 9 x x | D B 5 4 / E 9 3 2 | 3 | 97 % | 97,2 % | 97,2 % |
| 2.25 | E 10 x x / K 9 x x | E 10 5 4 / K 9 3 2 | 4 | 7 % | 6,8 % | 9,0 % |
| 2.25 | E 10 x x / K 9 x x | E 10 5 4 / K 9 3 2 | 3 | 94 % | 94,3 % | 94,3 % |
| 110 | E x x x x / D B x x x | E 8 7 6 5 / D B 4 3 2 | 5 | 39 % | 39,0 % | 50,0 % |
| 50 | E D 9 x x / B x x | E D 9 5 4 / B 3 2 | 5 | 14 % | 13,6 % | 24,9 % |
| 50 | E D 9 x x / B x x | E D 9 5 4 / B 3 2 | 4 | 88 % | 87,6 % | 89,6 % |
| 50 | E D 9 x x / B x x | E D 9 5 4 / B 3 2 | 3 | 98 % | 98,0 % | 100,0 % |
| 59 | D B 9 x x / E x x | D B 9 5 4 / E 3 2 | 5 | 14 % | 13,6 % | 13,6 % |
| 59 | D B 9 x x / E x x | D B 9 5 4 / E 3 2 | 4 | 88 % | 87,6 % | 93,3 % |
| 59 | D B 9 x x / E x x | D B 9 5 4 / E 3 2 | 3 | 98 % | 98,0 % | 100,0 % |
| 2.16 | E K 9 x x / 10 x x | E K 9 5 4 / 10 3 2 | 5 | 14 % | 13,6 % | 22,0 % |
| 2.16 | E K 9 x x / 10 x x | E K 9 5 4 / 10 3 2 | 4 | 88 % | 87,6 % | 89,6 % |
| 2.16 | E K 9 x x / 10 x x | E K 9 5 4 / 10 3 2 | 3 | 100 % | 100,0 % | 100,0 % |
| 2.18 | E 10 9 x x / K x x | E 10 9 5 4 / K 3 2 | 5 | 9 % | 9,0 % | 9,0 % |
| 2.18 | E 10 9 x x / K x x | E 10 9 5 4 / K 3 2 | 4 | 88 % | 87,6 % | 94,3 % |
| 2.18 | E 10 9 x x / K x x | E 10 9 5 4 / K 3 2 | 3 | 98 % | 98,0 % | 100,0 % |
| 15 | E D B 9 x / x x | E D B 9 4 / 3 2 | 5 | 19 % | 19,4 % | 19,4 % |
| 15 | E D B 9 x / x x | E D B 9 4 / 3 2 | 4 | 68 % | 67,8 % | 71,5 % |
| 15 | E D B 9 x / x x | E D B 9 4 / 3 2 | 3 | 94 % | 94,4 % | 100,0 % |
| 17 | E D 9 x x / B x | E D 9 4 3 / B 2 | 5 | 7 % | 7,1 % | 8,7 % |
| 17 | E D 9 x x / B x | E D 9 4 3 / B 2 | 4 | 58 % | 58,1 % | 71,5 % |
| 17 | E D 9 x x / B x | E D 9 4 3 / B 2 | 3 | 93 % | 93,2 % | 100,0 % |
| 21 | D B 9 x x / E x | D B 9 4 3 / E 2 | 4 | 59 % | 59,3 % | 63,0 % |
| 21 | D B 9 x x / E x | D B 9 4 3 / E 2 | 3 | 94 % | 94,4 % | 100,0 % |
| 2.4 | E K 10 9 x / x x | E K 10 9 4 / 3 2 | 5 | 9 % | 8,7 % | 8,7 % |
| 2.4 | E K 10 9 x / x x | E K 10 9 4 / 3 2 | 4 | 66 % | 65,6 % | 73,6 % |
| 2.4 | E K 10 9 x / x x | E K 10 9 4 / 3 2 | 3 | 94 % | 94,4 % | 100,0 % |
| 2.6 | E 10 9 x x / K x | E 10 9 4 3 / K 2 | 5 | 3 % | 3,2 % | 3,2 % |
| 2.6 | E 10 9 x x / K x | E 10 9 4 3 / K 2 | 4 | 65 % | 64,6 % | 69,4 % |
| 2.6 | E 10 9 x x / K x | E 10 9 4 3 / K 2 | 3 | 94 % | 94,4 % | 100,0 % |
| 105 | E D B x x x / x x x x | E D B 8 7 6 / 5 4 3 2 | 6 | 50 % | 50,0 % | 50,0 % |
| 107 | D B x x x x / E x x x | D B 8 7 6 5 / E 4 3 2 | 6 | 39 % | 39,0 % | 50,0 % |
| 86 | E x x x x x / D B x | E 7 6 5 4 3 / D B 2 | 6 | 20 % | 20,3 % | 50,0 % |
| 86 | E x x x x x / D B x | E 7 6 5 4 3 / D B 2 | 5 | 95 % | 95,2 % | 100,0 % |
| 6 | E D 9 x / B x | E D 9 3 / B 2 | 3 | 56 % | 55,7 % | 68,2 % |
| 67 | E D 9 x / B x x x | E D 9 5 / B 4 3 2 | 4 | 14 % | 13,6 % | 26,8 % |
| 67 | E D 9 x / B x x x | E D 9 5 / B 4 3 2 | 3 | 90 % | 89,6 % | 97,2 % |
| 76 | D B 9 x / E x x x | D B 9 5 / E 4 3 2 | 4 | 14 % | 13,6 % | 16,4 % |
| 76 | D B 9 x / E x x x | D B 9 5 / E 4 3 2 | 3 | 90 % | 89,6 % | 97,2 % |
| 40 | E D B 9 x x / x x | E D B 9 5 4 / 3 2 | 6 | 34 % | 33,9 % | 33,9 % |
| 40 | E D B 9 x x / x x | E D B 9 5 4 / 3 2 | 5 | 85 % | 84,8 % | 84,8 % |
| 40 | E D B 9 x x / x x | E D B 9 5 4 / 3 2 | 4 | 98 % | 98,0 % | 100,0 % |
| 2.12 | E K 10 9 x x / x x | E K 10 9 5 4 / 3 2 | 6 | 14 % | 13,6 % | 13,6 % |
| 2.12 | E K 10 9 x x / x x | E K 10 9 5 4 / 3 2 | 5 | 88 % | 87,6 % | 87,6 % |
| 2.12 | E K 10 9 x x / x x | E K 10 9 5 4 / 3 2 | 4 | 98 % | 98,0 % | 100,0 % |
| 28 | E D 8 x / B x x | E D 8 4 / B 3 2 | 3 | 57 % | 56,8 % | 59,4 % |
| 53 | E D x x x / B 9 x | E D 5 4 3 / B 9 2 | 5 | 14 % | 13,6 % | 24,9 % |
| 53 | E D x x x / B 9 x | E D 5 4 3 / B 9 2 | 4 | 79 % | 79,1 % | 89,6 % |
| 53 | E D x x x / B 9 x | E D 5 4 3 / B 9 2 | 3 | 98 % | 98,0 % | 100,0 % |
| 57 | E 9 x x x / D B x | E 9 5 4 3 / D B 2 | 5 | 14 % | 13,6 % | 16,4 % |
| 57 | E 9 x x x / D B x | E 9 5 4 3 / D B 2 | 4 | 93 % | 93,3 % | 93,3 % |
| 57 | E 9 x x x / D B x | E 9 5 4 3 / D B 2 | 3 | 100 % | 100,0 % | 100,0 % |
| 60 | B 9 x x x / E D x | B 9 5 4 3 / E D 2 | 5 | 16 % | 16,4 % | 16,4 % |
| 60 | B 9 x x x / E D x | B 9 5 4 3 / E D 2 | 4 | 88 % | 87,6 % | 93,3 % |
| 60 | B 9 x x x / E D x | B 9 5 4 3 / E D 2 | 3 | 100 % | 98,0 % | 100,0 % |
| 2.15 | E K 10 9 x / x x x | E K 10 9 5 / 4 3 2 | 5 | 22 % | 22,0 % | 22,0 % |
| 2.15 | E K 10 9 x / x x x | E K 10 9 5 / 4 3 2 | 4 | 90 % | 89,6 % | 89,6 % |
| 2.15 | E K 10 9 x / x x x | E K 10 9 5 / 4 3 2 | 3 | 98 % | 98,0 % | 100,0 % |
| 2.19 | E 10 x x x / K 9 x | E 10 5 4 3 / K 9 2 | 5 | 7 % | 6,8 % | 9,0 % |
| 2.19 | E 10 x x x / K 9 x | E 10 5 4 3 / K 9 2 | 4 | 90 % | 90,4 % | 94,3 % |
| 2.19 | E 10 x x x / K 9 x | E 10 5 4 3 / K 9 2 | 3 | 100 % | 100,0 % | 100,0 % |
| 108 | E D B x x / x x x x x | E D B 8 7 / 6 5 4 3 2 | 5 | 50 % | 50,0 % | 50,0 % |
| 3 | E D B 9 x / x | E D B 9 3 / 2 | 4 | 32 % | 31,8 % | 40,8 % |
| 3 | E D B 9 x / x | E D B 9 3 / 2 | 3 | 86 % | 85,9 % | 100,0 % |
| 13 | E D B 9 x x / x | E D B 9 4 3 / 2 | 6 | 2 % | 1,6 % | 1,6 % |
| 13 | E D B 9 x x / x | E D B 9 4 3 / 2 | 5 | 58 % | 58,1 % | 61,8 % |
| 13 | E D B 9 x x / x | E D B 9 4 3 / 2 | 4 | 92 % | 92,5 % | 100,0 % |
| 13 | E D B 9 x x / x | E D B 9 4 3 / 2 | 3 | 99 % | 99,3 % | 100,0 % |
| 80 | D B x x x x x / E x | D B 7 6 5 4 3 / E 2 | 7 | 20 % | 20,3 % | 26,6 % |
| 80 | D B x x x x x / E x | D B 7 6 5 4 3 / E 2 | 6 | 90 % | 90,4 % | 100,0 % |
| 42 | E D 9 x x x / B x | E D 9 5 4 3 / B 2 | 6 | 14 % | 13,6 % | 13,6 % |
| 42 | E D 9 x x x / B x | E D 9 5 4 3 / B 2 | 5 | 82 % | 82,0 % | 84,8 % |
| 42 | E D 9 x x x / B x | E D 9 5 4 3 / B 2 | 4 | 98 % | 98,0 % | 100,0 % |
| 47 | D B 9 x x x / E x | D B 9 5 4 3 / E 2 | 6 | 10 % | 10,2 % | 10,2 % |
| 47 | D B 9 x x x / E x | D B 9 5 4 3 / E 2 | 5 | 79 % | 79,1 % | 79,1 % |
| 47 | D B 9 x x x / E x | D B 9 5 4 3 / E 2 | 4 | 98 % | 98,0 % | 100,0 % |
| 2.13 | E 10 9 x x x / K x | E 10 9 5 4 3 / K 2 | 6 | 7 % | 6,8 % | 6,8 % |
| 2.13 | E 10 9 x x x / K x | E 10 9 5 4 3 / K 2 | 5 | 88 % | 87,6 % | 87,6 % |
| 2.13 | E 10 9 x x x / K x | E 10 9 5 4 3 / K 2 | 4 | 98 % | 98,0 % | 100,0 % |
| 2.26 | E 10 x x / K 8 x x | E 10 5 4 / K 8 3 2 | 4 | 7 % | 6,8 % | 9,0 % |
| 2.26 | E 10 x x / K 8 x x | E 10 5 4 / K 8 3 2 | 3 | 87 % | 86,7 % | 86,7 % |
| 11 | E x x / D B 9 | E 3 2 / D B 9 | 3 | 5 % | 4,8 % | 4,8 % |
| 95 | E 9 x x x / D B x x | E 9 6 5 4 / D B 3 2 | 5 | 27 % | 26,6 % | 26,6 % |
| 95 | E 9 x x x / D B x x | E 9 6 5 4 / D B 3 2 | 4 | 100 % | 100,0 % | 100,0 % |
| 98 | D B 9 x x / E x x x | D B 9 6 5 / E 4 3 2 | 5 | 27 % | 26,6 % | 26,6 % |
| 98 | D B 9 x x / E x x x | D B 9 6 5 / E 4 3 2 | 4 | 95 % | 95,2 % | 100,0 % |
| 2.33 | E K 9 x x / 10 x x x | E K 9 6 5 / 10 4 3 2 | 5 | 46 % | 46,3 % | 46,3 % |
| 2.33 | E K 9 x x / 10 x x x | E K 9 6 5 / 10 4 3 2 | 4 | 95 % | 95,2 % | 95,2 % |
| 2.35 | E 10 x x x / K 9 x x | E 10 6 5 4 / K 9 3 2 | 5 | 46 % | 46,3 % | 46,3 % |
| 2.35 | E 10 x x x / K 9 x x | E 10 6 5 4 / K 9 3 2 | 4 | 100 % | 100,0 % | 100,0 % |
| 51 | E D 8 x x / B x x | E D 8 5 4 / B 3 2 | 5 | 14 % | 13,6 % | 13,6 % |
| 51 | E D 8 x x / B x x | E D 8 5 4 / B 3 2 | 4 | 79 % | 79,1 % | 81,1 % |
| 51 | E D 8 x x / B x x | E D 8 5 4 / B 3 2 | 3 | 100 % | 98,0 % | 100,0 % |
| 2.17 | E K 8 x x / 10 x x | E K 8 5 4 / 10 3 2 | 5 | 7 % | 6,8 % | 6,8 % |
| 2.17 | E K 8 x x / 10 x x | E K 8 5 4 / 10 3 2 | 4 | 82 % | 82,0 % | 82,0 % |
| 2.17 | E K 8 x x / 10 x x | E K 8 5 4 / 10 3 2 | 3 | 100 % | 100,0 % | 100,0 % |
| 4 | E D B 9 / x x | E D B 9 / 3 2 | 4 | 5 % | 5,2 % | 5,2 % |
| 4 | E D B 9 / x x | E D B 9 / 3 2 | 3 | 68 % | 68,2 % | 68,2 % |
| 8 | E D x x / B 9 | E D 3 2 / B 9 | 3 | 50 % | 50,5 % | 68,2 % |
| 2.2 | E K 10 9 / x x | E K 10 9 / 3 2 | 4 | 5 % | 5,2 % | 5,2 % |
| 2.2 | E K 10 9 / x x | E K 10 9 / 3 2 | 3 | 76 % | 76,0 % | 76,0 % |
| 2.3 | E 9 x x / K 10 | E 9 3 2 / K 10 | 3 | 55 % | 55,2 % | 56,1 % |
| 104 | D B x x x x x / E x x | D B 8 7 6 5 4 / E 3 2 | 7 | 39 % | 39,0 % | 50,0 % |
| 81 | E D 9 x x x / B x x | E D 9 6 5 4 / B 3 2 | 6 | 33 % | 32,8 % | 32,8 % |
| 81 | E D 9 x x x / B x x | E D 9 6 5 4 / B 3 2 | 5 | 95 % | 95,2 % | 100,0 % |
| 87 | D B 9 x x x / E x x | D B 9 6 5 4 / E 3 2 | 6 | 27 % | 26,6 % | 26,6 % |
| 87 | D B 9 x x x / E x x | D B 9 6 5 4 / E 3 2 | 5 | 95 % | 95,2 % | 100,0 % |
| 2.28 | E K 10 9 x x / x x x | E K 10 9 6 5 / 4 3 2 | 6 | 46 % | 46,3 % | 46,3 % |
| 2.28 | E K 10 9 x x / x x x | E K 10 9 6 5 / 4 3 2 | 5 | 95 % | 95,2 % | 95,2 % |
| 31 | E 9 8 x / D B x | E 9 8 3 / D B 2 | 4 | 9 % | 9,3 % | 9,3 % |
| 31 | E 9 8 x / D B x | E 9 8 3 / D B 2 | 3 | 83 % | 82,6 % | 82,6 % |
| 36 | B 9 8 x / E D x | B 9 8 3 / E D 2 | 4 | 9 % | 9,3 % | 9,9 % |
| 36 | B 9 8 x / E D x | B 9 8 3 / E D 2 | 3 | 78 % | 77,8 % | 77,8 % |
| 2.9 | E 10 9 x / K 8 x | E 10 9 3 / K 8 2 | 4 | 4 % | 4,0 % | 4,0 % |
| 2.9 | E 10 9 x / K 8 x | E 10 9 3 / K 8 2 | 3 | 82 % | 81,6 % | 81,6 % |
| 18 | E D x x x / B 9 | E D 4 3 2 / B 9 | 5 | 7 % | 0,0 % | 8,7 % |
| 18 | E D x x x / B 9 | E D 4 3 2 / B 9 | 4 | 58 % | 49,1 % | 71,5 % |
| 18 | E D x x x / B 9 | E D 4 3 2 / B 9 | 3 | 93 % | 93,2 % | 100,0 % |
| 22 | D B x x x / E 9 | D B 4 3 2 / E 9 | 4 | 50 % | 50,1 % | 63,0 % |
| 22 | D B x x x / E 9 | D B 4 3 2 / E 9 | 3 | 93 % | 93,2 % | 100,0 % |
| 2.5 | E 10 x x x / K 9 | E 10 4 3 2 / K 9 | 4 | 61 % | 61,4 % | 69,4 % |
| 2.5 | E 10 x x x / K 9 | E 10 4 3 2 / K 9 | 3 | 92 % | 92,0 % | 100,0 % |
| 68 | E D 8 x / B x x x | E D 8 5 / B 4 3 2 | 4 | 14 % | 13,6 % | 13,6 % |
| 68 | E D 8 x / B x x x | E D 8 5 / B 4 3 2 | 3 | 81 % | 81,1 % | 84,8 % |
| 69 | E D x x / B 9 8 x | E D 4 3 / B 9 8 2 | 4 | 19 % | 19,2 % | 26,8 % |
| 69 | E D x x / B 9 8 x | E D 4 3 / B 9 8 2 | 3 | 97 % | 97,2 % | 97,2 % |
| 74 | E 9 8 x / D B x x | E 9 8 4 / D B 3 2 | 4 | 16 % | 16,4 % | 16,4 % |
| 74 | E 9 8 x / D B x x | E 9 8 4 / D B 3 2 | 3 | 97 % | 97,2 % | 97,2 % |
| 2.23 | E K 8 x / 10 x x x | E K 8 5 / 10 4 3 2 | 4 | 7 % | 6,8 % | 6,8 % |
| 2.23 | E K 8 x / 10 x x x | E K 8 5 / 10 4 3 2 | 3 | 82 % | 82,0 % | 82,0 % |
| 2.20 | E 10 x x x / K 8 x | E 10 5 4 3 / K 8 2 | 5 | 7 % | 6,8 % | 9,0 % |
| 2.20 | E 10 x x x / K 8 x | E 10 5 4 3 / K 8 2 | 4 | 82 % | 82,0 % | 84,8 % |
| 2.20 | E 10 x x x / K 8 x | E 10 5 4 3 / K 8 2 | 3 | 100 % | 100,0 % | 100,0 % |
| 39 | E D B 9 x x x / x | E D B 9 5 4 3 / 2 | 7 | 14 % | 13,6 % | 13,6 % |
| 39 | E D B 9 x x x / x | E D B 9 5 4 3 / 2 | 6 | 79 % | 79,1 % | 79,1 % |
| 39 | E D B 9 x x x / x | E D B 9 5 4 3 / 2 | 5 | 98 % | 98,0 % | 100,0 % |
| 16 | E D 9 8 x / B x | E D 9 8 3 / B 2 | 5 | 9 % | 8,7 % | 8,7 % |
| 16 | E D 9 8 x / B x | E D 9 8 3 / B 2 | 4 | 71 % | 71,5 % | 71,5 % |
| 96 | E x x x x / D B 9 x | E 6 5 4 3 / D B 9 2 | 5 | 27 % | 26,6 % | 26,6 % |
| 96 | E x x x x / D B 9 x | E 6 5 4 3 / D B 9 2 | 4 | 95 % | 95,2 % | 100,0 % |
| 2.32 | E K 10 9 x / x x x x | E K 10 9 6 / 5 4 3 2 | 5 | 46 % | 46,3 % | 46,3 % |
| 2.32 | E K 10 9 x / x x x x | E K 10 9 6 / 5 4 3 2 | 4 | 95 % | 95,2 % | 95,2 % |
| 1 | E D B 9 / x | E D B 9 / 2 | 4 | 0.3 % | 0,3 % | 0,3 % |
| 1 | E D B 9 / x | E D B 9 / 2 | 3 | 52 % | 52,3 % | 52,3 % |
| 41 | E D 9 8 x x / B x | E D 9 8 4 3 / B 2 | 6 | 34 % | 13,6 % | 13,6 % |
| 41 | E D 9 8 x x / B x | E D 9 8 4 3 / B 2 | 5 | 85 % | 84,8 % | 84,8 % |
| 41 | E D 9 8 x x / B x | E D 9 8 4 3 / B 2 | 4 | 98 % | 100,0 % | 100,0 % |
| 94 | E 9 8 x x / D B x x | E 9 8 5 4 / D B 3 2 | 5 | 27 % | 26,6 % | 26,6 % |
| 100 | B 9 8 x x / E D x x | B 9 8 5 4 / E D 3 2 | 5 | 33 % | 32,8 % | 32,8 % |
| 2.22 | E K 10 9 / x x x x | E K 10 9 / 5 4 3 2 | 4 | 24 % | 24,0 % | 24,0 % |
| 2.22 | E K 10 9 / x x x x | E K 10 9 / 5 4 3 2 | 3 | 90 % | 89,6 % | 89,6 % |
| 12 | E D B 9 8 x / x | E D B 9 8 3 / 2 | 6 | 2 % | 1,6 % | 1,6 % |
| 12 | E D B 9 8 x / x | E D B 9 8 3 / 2 | 5 | 62 % | 61,8 % | 61,8 % |
| 12 | E D B 9 8 x / x | E D B 9 8 3 / 2 | 4 | 99 % | 98,5 % | 100,0 % |
| 2.30 | E 10 x x x x / K 9 x | E 10 6 5 4 3 / K 9 2 | 6 | 46 % | 46,3 % | 46,3 % |
| 2.30 | E 10 x x x x / K 9 x | E 10 6 5 4 3 / K 9 2 | 5 | 100 % | 100,0 % | 100,0 % |
| 25 | E D 9 8 / B x x | E D 9 8 / B 3 2 | 4 | 25 % | 25,2 % | 25,2 % |
| 25 | E D 9 8 / B x x | E D 9 8 / B 3 2 | 3 | 79 % | 79,0 % | 79,0 % |
| 29 | E D x x / B 9 8 | E D 3 2 / B 9 8 | 4 | 8 % | 8,3 % | 25,2 % |
| 29 | E D x x / B 9 8 | E D 3 2 / B 9 8 | 3 | 77 % | 77,0 % | 79,0 % |
| 58 | E x x x x / D B 9 | E 5 4 3 2 / D B 9 | 4 | 82 % | 84,8 % | 93,3 % |
| 58 | E x x x x / D B 9 | E 5 4 3 2 / D B 9 | 3 | 98 % | 98,0 % | 100,0 % |
| 61 | B x x x x / E D 9 | B 5 4 3 2 / E D 9 | 5 | 14 % | 13,6 % | 16,4 % |
| 61 | B x x x x / E D 9 | B 5 4 3 2 / E D 9 | 4 | 88 % | 84,8 % | 93,3 % |
| 61 | B x x x x / E D 9 | B 5 4 3 2 / E D 9 | 3 | 98 % | 98,0 % | 100,0 % |
| 56 | E D 7 x x / B x x | E D 7 5 4 / B 3 2 | 5 | 14 % | 13,6 % | 13,6 % |
| 56 | E D 7 x x / B x x | E D 7 5 4 / B 3 2 | 4 | 76 % | 76,3 % | 76,3 % |
| 56 | E D 7 x x / B x x | E D 7 5 4 / B 3 2 | 3 | 96 % | 96,1 % | 98,0 % |
| 111 | E D B x x x / x x x x x | E D B 9 8 7 / 6 5 4 3 2 | 6 | 52 % | 52,0 % | 52,0 % |
| 14 | E D B 9 8 / x x | E D B 9 8 / 3 2 | 5 | 19 % | 19,4 % | 19,4 % |
| 14 | E D B 9 8 / x x | E D B 9 8 / 3 2 | 4 | 71 % | 71,5 % | 71,5 % |
| 93 | E D 8 x x / B x x x | E D 8 6 5 / B 4 3 2 | 5 | 27 % | 26,6 % | 26,6 % |
| 93 | E D 8 x x / B x x x | E D 8 6 5 / B 4 3 2 | 4 | 95 % | 95,2 % | 95,2 % |
| 2.34 | E K 8 x x / 10 x x x | E K 8 6 5 / 10 4 3 2 | 5 | 41 % | 40,7 % | 40,7 % |
| 2.34 | E K 8 x x / 10 x x x | E K 8 6 5 / 10 4 3 2 | 4 | 95 % | 95,2 % | 95,2 % |
| 5 | E D 9 8 / B x | E D 9 8 / B 2 | 4 | 4 % | 5,2 % | 5,2 % |
| 5 | E D 9 8 / B x | E D 9 8 / B 2 | 3 | 3 % | 68,2 % | 68,2 % |
| 7 | E D 8 x / B 9 | E D 8 2 / B 9 | 3 | 68 % | 68,2 % | 68,2 % |
| 43 | E D x x x x / B 9 | E D 5 4 3 2 / B 9 | 5 | 76 % | 76,3 % | 84,8 % |
| 43 | E D x x x x / B 9 | E D 5 4 3 2 / B 9 | 4 | 98 % | 98,0 % | 100,0 % |
| 2.14 | E 10 x x x x / K 9 | E 10 5 4 3 2 / K 9 | 6 | 7 % | 6,8 % | 6,8 % |
| 2.14 | E 10 x x x x / K 9 | E 10 5 4 3 2 / K 9 | 5 | 82 % | 82,0 % | 87,6 % |
| 2.14 | E 10 x x x x / K 9 | E 10 5 4 3 2 / K 9 | 4 | 98 % | 98,0 % | 100,0 % |
| 79 | E D 9 x x x x / B x | E D 9 6 5 4 3 / B 2 | 7 | 33 % | 32,8 % | 32,8 % |
| 79 | E D 9 x x x x / B x | E D 9 6 5 4 3 / B 2 | 6 | 95 % | 95,2 % | 95,2 % |
| 27 | E D 8 7 / B x x | E D 8 7 / B 3 2 | 4 | 2 % | 2,4 % | 2,4 % |
| 27 | E D 8 7 / B x x | E D 8 7 / B 3 2 | 3 | 59 % | 59,4 % | 59,4 % |
| 66 | E D 9 8 / B x x x | E D 9 8 / B 4 3 2 | 4 | 27 % | 26,8 % | 26,8 % |
| 66 | E D 9 8 / B x x x | E D 9 8 / B 4 3 2 | 3 | 97 % | 97,2 % | 97,2 % |
| 2.24 | E 10 9 8 / K x x x | E 10 9 8 / K 4 3 2 | 4 | 9 % | 9,0 % | 9,0 % |
| 2.24 | E 10 9 8 / K x x x | E 10 9 8 / K 4 3 2 | 3 | 94 % | 94,3 % | 94,3 % |
| 106 | E B 9 x x x / D x x x | E B 9 7 6 5 / D 4 3 2 | 6 | 50 % | 50,0 % | 50,0 % |
| 82 | E D 8 x x x / B x x | E D 8 6 5 4 / B 3 2 | 6 | 27 % | 26,6 % | 26,6 % |
| 82 | E D 8 x x x / B x x | E D 8 6 5 4 / B 3 2 | 5 | 95 % | 95,2 % | 95,2 % |
| 89 | B 9 8 x x x / E D x | B 9 8 5 4 3 / E D 2 | 6 | 33 % | 32,8 % | 32,8 % |
| 2.29 | E K 8 x x x / 10 x x | E K 8 6 5 4 / 10 3 2 | 6 | 41 % | 40,7 % | 40,7 % |
| 2.29 | E K 8 x x x / 10 x x | E K 8 6 5 4 / 10 3 2 | 5 | 95 % | 95,2 % | 95,2 % |
| 52 | E D x x x / B 9 8 | E D 4 3 2 / B 9 8 | 5 | 16 % | 16,4 % | 24,9 % |
| 52 | E D x x x / B 9 8 | E D 4 3 2 / B 9 8 | 4 | 85 % | 84,8 % | 89,6 % |
| 2 | E D B 9 8 / x | E D B 9 8 / 2 | 5 | 0.7 % | 0,7 % | 0,7 % |
| 2 | E D B 9 8 / x | E D B 9 8 / 2 | 4 | 41 % | 40,8 % | 40,8 % |
| 2.1 | E K 10 9 8 / x | E K 10 9 8 / 2 | 5 | 1 % | 1,5 % | 1,5 % |
| 2.1 | E K 10 9 8 / x | E K 10 9 8 / 2 | 4 | 45 % | 45,2 % | 45,2 % |
| 109 | E B 9 x x / D x x x x | E B 9 7 6 / D 5 4 3 2 | 5 | 50 % | 50,0 % | 50,0 % |
| 91 | E D 9 7 x / B 8 x x | E D 9 7 4 / B 8 3 2 | 5 | 33 % | 32,8 % | 32,8 % |
| 54 | E D 6 x x / B 9 x | E D 6 4 3 / B 9 2 | 5 | 14 % | 13,6 % | 13,6 % |
| 54 | E D 6 x x / B 9 x | E D 6 4 3 / B 9 2 | 4 | 82 % | 82,0 % | 82,0 % |
| 54 | E D 6 x x / B 9 x | E D 6 4 3 / B 9 2 | 3 | 98 % | 98,0 % | 100,0 % |
| 35 | B 9 8 7 / E D x | B 9 8 7 / E D 2 | 4 | 10 % | 9,9 % | 9,9 % |
| 35 | B 9 8 7 / E D x | B 9 8 7 / E D 2 | 3 | 78 % | 77,8 % | 77,8 % |
| 103 | E B 9 x x x x / D x x | E B 9 7 6 5 4 / D 3 2 | 7 | 50 % | 50,0 % | 50,0 % |
| 2.36 | E K x x x / 10 9 8 x x | E K 6 5 4 / 10 9 8 3 2 | 5 | 78 % | 78,0 % | 78,0 % |
| 62 | B 7 x x x / E D 9 | B 7 4 3 2 / E D 9 | 5 | 14 % | 13,6 % | 13,6 % |
| 62 | B 7 x x x / E D 9 | B 7 4 3 2 / E D 9 | 4 | 88 % | 87,6 % | 87,6 % |
| 62 | B 7 x x x / E D 9 | B 7 4 3 2 / E D 9 | 3 | 98 % | 98,0 % | 100,0 % |
| 20 | D B 9 8 7 / E x | D B 9 8 7 / E 2 | 5 | 2 % | 1,6 % | 1,6 % |
| 20 | D B 9 8 7 / E x | D B 9 8 7 / E 2 | 4 | 63 % | 63,0 % | 63,0 % |
| 85 | E x x x x x / D B 9 | E 6 5 4 3 2 / D B 9 | 6 | 27 % | 26,6 % | 26,6 % |
| 85 | E x x x x x / D B 9 | E 6 5 4 3 2 / D B 9 | 5 | 95 % | 95,2 % | 100,0 % |
| 84 | E D x x x x / B 9 8 | E D 5 4 3 2 / B 9 8 | 6 | 33 % | 32,8 % | 32,8 % |
| 84 | E D x x x x / B 9 8 | E D 5 4 3 2 / B 9 8 | 5 | 95 % | 95,2 % | 100,0 % |
| 2.31 | 9 8 7 6 x x / E K x | 9 8 7 6 4 3 / E K 2 | 6 | 41 % | 40,7 % | 40,7 % |
| 2.31 | 9 8 7 6 x x / E K x | 9 8 7 6 4 3 / E K 2 | 5 | 95 % | 95,2 % | 95,2 % |
| 49 | E D 9 7 6 / B 8 x | E D 9 7 6 / B 8 2 | 5 | 25 % | 24,9 % | 24,9 % |
| 49 | E D 9 7 6 / B 8 x | E D 9 7 6 / B 8 2 | 4 | 90 % | 89,6 % | 89,6 % |
| 63 | B 7 x x x / E D 6 | B 7 4 3 2 / E D 6 | 5 | 14 % | 13,6 % | 13,6 % |
| 63 | B 7 x x x / E D 6 | B 7 4 3 2 / E D 6 | 4 | 73 % | 76,3 % | 76,3 % |
| 63 | B 7 x x x / E D 6 | B 7 4 3 2 / E D 6 | 3 | 96 % | 98,0 % | 98,0 % |
| 83 | E D 7 x x x / B 9 8 | E D 7 4 3 2 / B 9 8 | 6 | 33 % | 32,8 % | 32,8 % |
| 102 | E D B x x x x / 8 7 6 | E D B 5 4 3 2 / 8 7 6 | 7 | 50 % | 50,0 % | 50,0 % |
