# Validering: Suit Combinations 5 – 5 High Card Point held by opponents - The Ace and Jack / 5 High Card Point held by opponents - The King and Queen

Kilde: [https://www.bridgehands.com/S/Suit_Combination_5.htm](https://www.bridgehands.com/S/Suit_Combination_5.htm), læst 2026-10-04. Genereret af `scripts/solve.ts`.

Model: Optimalt modspil: modspillet kender alle kort og blander sine valg; spilføreren ser kun de spillede kort. Ubegrænsede forbindelser, chancer a priori.

Fortolkninger af x: **lav** = spilførerens x'er er de laveste kort (specens regel); **høj** = spilførerens x'er er de højeste kort under det laveste navngivne kort, så modpartens små kort er lavere.

Kilden har kun hele procenter, så en afvigelse over 0,5 procentpoint gennemgås.

## Resultat

109 brugbare cases. De 10 hyppigste dækker 46 % af sidens samlede hyppighed, de 30 hyppigste 76 %.

- Brugbare cases: 109 af 124, med 209 mål.
- Fortolkning "lav": 204 af 209 mål inden for 0,5 procentpoint, 205 inden for 1 procentpoint.
- Fortolkning "høj": 63 af 209 mål inden for 0,5 procentpoint, 73 inden for 1 procentpoint.
- Mindst én af fortolkningerne inden for 0,5 procentpoint: 204 af 209 mål.
- Mål, hvor den bedste linje kræver, at spilføreren blander (ingen ren linje inden for 0,002 procentpoint): 0.
- Fejl i kilden, fjernet fra appen: 1 mål, hvor kildens procent afviger mere end 1,5 procentpoint med begge fortolkninger, og alle linjer giver det samme; 1 case har ikke flere mål og er ikke med.

## Afvigelser over 0,5 procentpoint med fortolkningen "lav"

| Case | Hånd / bordet | Mål | Kilde | Lav | Høj | Nærmest | Årsag | Kildens bemærkning |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 21 | K x x x / D 10 x | 2 | 76 % | 76,6 % | 100,0 % | lav | lille afvigelse | Finesse J (low toward 10) then low toward K | Play low to Q then finesse J (low to 10) |
| 6 | K D 10 9 / x x | 3 | 3 % | 50,0 % | 50,0 % | lav | passer ikke med nogen fortolkning | Finesse J 10 then low to 9 |
| 2.15 | E B 8 / 10 x x | 2 | 24 % | 39,7 % | 39,7 % | lav | passer ikke med nogen fortolkning | Finesse 9 |
| 7 | K D 9 8 / x x | 3 | 50 % | 5,2 % | 5,2 % | lav | samme mål og procenter som case 2.9, der passer | Finesse J 10 then low to 9 |
| 1 | K D 10 9 / x | 2 | 11 % | 100,0 % | 100,0 % | lav | målet er sikkert med begge fortolkninger; **fjernet** (alle linjer giver det samme) | Finesse J |

## Sorteret fra

| Case | Holding | Grund |
| --- | --- | --- |
| 9 | K D 10 / x x x | holdingen har 3+3 kort, men fordelingen er 4-2 |
| 38 | K D 10 x x x / x x | holdingen har 6+2 kort, men fordelingen er 7-2 |
| 39 | K D 10 9 x … x / – | uklart antal kort (…) |
| 40 | K D 9 x … x / – | uklart antal kort (…) |
| 41 | K D 8 x x x / x x x | samme kort som side 5 case 43 |
| 48 | K D 9 x … x / x | uklart antal kort (…) |
| 49 | K D 10 x … x / x x | uklart antal kort (…) |
| 50 | K D x … x / x x | uklart antal kort (…) |
| 51 | K D x … x / x x x | uklart antal kort (…) |
| 52 | K 10 x … x / D x x | uklart antal kort (…) |
| 2.45 | E 9 8 x x x x / B x | holdingen har 7+2 kort, men fordelingen er 6-2 |
| 2.59 | E B 10 9 x … x / x | uklart antal kort (…) |
| 2.60 | E B 10 8 x … x / x | uklart antal kort (…) |
| 2.61 | E B 9 8 x … x / x | uklart antal kort (…) |
| 2.64 | E 8 7 x x x x / x x | for få små kort under det laveste navngivne kort til x |

## Alle brugbare cases

| Case | Hånd / bordet | Konkret (lav) | Mål | Kilde | Lav | Høj |
| --- | --- | --- | --- | --- | --- | --- |
| 37 | K x x x / D x x x | K 7 6 5 / D 4 3 2 | 3 | 14 % | 13,6 % | 100,0 % |
| 37 | K x x x / D x x x | K 7 6 5 / D 4 3 2 | 2 | 73 % | 73,5 % | 100,0 % |
| 2.3 | E B x x / x | E B 4 3 / 2 | 2 | 6 % | 5,7 % | 100,0 % |
| 43 | K D x x x x / x x x | K D 8 7 6 5 / 4 3 2 | 5 | 66 % | 65,6 % | 100,0 % |
| 43 | K D x x x x / x x x | K D 8 7 6 5 / 4 3 2 | 4 | 95 % | 95,2 % | 100,0 % |
| 2.34 | E B x x / 10 x x | E B 5 4 / 10 3 2 | 3 | 9 % | 8,7 % | 76,0 % |
| 2.34 | E B x x / 10 x x | E B 5 4 / 10 3 2 | 2 | 87 % | 87,1 % | 100,0 % |
| 2.16 | E B x / 10 x x | E B 4 / 10 3 2 | 2 | 33 % | 33,0 % | 76,0 % |
| 8 | K D x x / 10 x | K D 4 3 / 10 2 | 2 | 56 % | 55,7 % | 100,0 % |
| 2.12 | E B x x / 10 x | E B 4 3 / 10 2 | 2 | 55 % | 55,4 % | 100,0 % |
| 21 | K x x x / D 10 x | K 5 4 3 / D 10 2 | 3 | 19 % | 19,4 % | 52,8 % |
| 21 | K x x x / D 10 x | K 5 4 3 / D 10 2 | 2 | 76 % | 76,6 % | 100,0 % |
| 2.30 | E B 10 x / x x x | E B 10 5 / 4 3 2 | 3 | 45 % | 45,3 % | 76,0 % |
| 2.30 | E B 10 x / x x x | E B 10 5 / 4 3 2 | 2 | 85 % | 84,7 % | 100,0 % |
| 2.37 | B x x x / E 10 x | B 5 4 3 / E 10 2 | 3 | 9 % | 8,7 % | 60,7 % |
| 2.37 | B x x x / E 10 x | B 5 4 3 / E 10 2 | 2 | 87 % | 87,1 % | 100,0 % |
| 35 | K 10 x x / D x x x | K 10 6 5 / D 4 3 2 | 3 | 40 % | 40,1 % | 56,2 % |
| 35 | K 10 x x / D x x x | K 10 6 5 / D 4 3 2 | 2 | 90 % | 89,6 % | 100,0 % |
| 2.57 | E B x x / 10 x x x | E B 6 5 / 10 4 3 2 | 3 | 37 % | 37,3 % | 76,0 % |
| 2.57 | E B x x / 10 x x x | E B 6 5 / 10 4 3 2 | 2 | 100 % | 100,0 % | 100,0 % |
| 29 | K D 10 x x / x x x | K D 10 6 5 / 4 3 2 | 4 | 55 % | 55,4 % | 61,0 % |
| 29 | K D 10 x x / x x x | K D 10 6 5 / 4 3 2 | 3 | 90 % | 89,6 % | 100,0 % |
| 29 | K D 10 x x / x x x | K D 10 6 5 / 4 3 2 | 2 | 98 % | 98,0 % | 100,0 % |
| 2.48 | E B 10 x x / x x x | E B 10 6 5 / 4 3 2 | 4 | 63 % | 62,7 % | 76,0 % |
| 2.48 | E B 10 x x / x x x | E B 10 6 5 / 4 3 2 | 3 | 90 % | 89,6 % | 100,0 % |
| 2.48 | E B 10 x x / x x x | E B 10 6 5 / 4 3 2 | 2 | 98 % | 98,0 % | 100,0 % |
| 2.51 | E B x x x / 10 x x | E B 6 5 4 / 10 3 2 | 4 | 37 % | 37,3 % | 76,0 % |
| 2.51 | E B x x x / 10 x x | E B 6 5 4 / 10 3 2 | 3 | 96 % | 96,1 % | 100,0 % |
| 15 | K D x x x / 10 x | K D 5 4 3 / 10 2 | 4 | 18 % | 17,8 % | 43,2 % |
| 15 | K D x x x / 10 x | K D 5 4 3 / 10 2 | 3 | 61 % | 61,4 % | 100,0 % |
| 15 | K D x x x / 10 x | K D 5 4 3 / 10 2 | 2 | 93 % | 93,2 % | 100,0 % |
| 25 | K D x x x x x / x | K D 7 6 5 4 3 / 2 | 6 | 14 % | 13,6 % | 100,0 % |
| 25 | K D x x x x x / x | K D 7 6 5 4 3 / 2 | 5 | 73 % | 73,5 % | 100,0 % |
| 25 | K D x x x x x / x | K D 7 6 5 4 3 / 2 | 4 | 96 % | 96,1 % | 100,0 % |
| 2.8 | E B 10 x x / x | E B 10 4 3 / 2 | 3 | 36 % | 36,3 % | 100,0 % |
| 2.8 | E B 10 x x / x | E B 10 4 3 / 2 | 2 | 82 % | 81,8 % | 100,0 % |
| 3 | K 10 x / D x | K 10 3 / D 2 | 2 | 50 % | 50,5 % | 50,5 % |
| 2.10 | E B 9 x / x x | E B 9 4 / 3 2 | 3 | 1 % | 0,9 % | 9,4 % |
| 2.10 | E B 9 x / x x | E B 9 4 / 3 2 | 2 | 41 % | 41,3 % | 81,3 % |
| 27 | K D 10 x x x / x x | K D 10 6 5 4 / 3 2 | 5 | 47 % | 47,5 % | 53,1 % |
| 27 | K D 10 x x x / x x | K D 10 6 5 4 / 3 2 | 4 | 88 % | 87,6 % | 100,0 % |
| 27 | K D 10 x x x / x x | K D 10 6 5 4 / 3 2 | 3 | 98 % | 98,0 % | 100,0 % |
| 2.2 | E B 10 x / x | E B 10 3 / 2 | 3 | 0.6 % | 0,6 % | 7,2 % |
| 2.2 | E B 10 x / x | E B 10 3 / 2 | 2 | 43 % | 43,5 % | 100,0 % |
| 2.32 | E B 9 x / x x x | E B 9 5 / 4 3 2 | 3 | 22 % | 21,7 % | 37,0 % |
| 2.32 | E B 9 x / x x x | E B 9 5 / 4 3 2 | 2 | 69 % | 69,4 % | 89,0 % |
| 34 | K D 10 x / x x x x | K D 10 6 / 5 4 3 2 | 3 | 57 % | 57,3 % | 63,0 % |
| 34 | K D 10 x / x x x x | K D 10 6 / 5 4 3 2 | 2 | 90 % | 89,6 % | 100,0 % |
| 32 | K x x x x / D 10 x | K 6 5 4 3 / D 10 2 | 4 | 37 % | 37,3 % | 54,3 % |
| 32 | K x x x x / D 10 x | K 6 5 4 3 / D 10 2 | 3 | 88 % | 87,6 % | 100,0 % |
| 32 | K x x x x / D 10 x | K 6 5 4 3 / D 10 2 | 2 | 98 % | 98,0 % | 100,0 % |
| 2.13 | E B 10 / x x x | E B 10 / 4 3 2 | 2 | 76 % | 76,0 % | 76,0 % |
| 2.71 | E B x x x / 10 x x x | E B 7 6 5 / 10 4 3 2 | 4 | 66 % | 65,6 % | 76,0 % |
| 18 | K 10 9 x / D x x | K 10 9 4 / D 3 2 | 3 | 53 % | 52,8 % | 52,8 % |
| 19 | K 10 x x / D 9 x | K 10 4 3 / D 9 2 | 3 | 31 % | 31,1 % | 52,8 % |
| 2 | K D 10 / x x | K D 10 / 3 2 | 2 | 52 % | 52,3 % | 52,3 % |
| 4 | K x x / D 10 | K 3 2 / D 10 | 2 | 50 % | 50,2 % | 50,5 % |
| 2.49 | E B 9 x x / x x x | E B 9 6 5 / 4 3 2 | 4 | 33 % | 32,8 % | 38,4 % |
| 2.49 | E B 9 x x / x x x | E B 9 6 5 / 4 3 2 | 3 | 84 % | 83,9 % | 92,4 % |
| 2.49 | E B 9 x x / x x x | E B 9 6 5 / 4 3 2 | 2 | 98 % | 98,0 % | 100,0 % |
| 2.54 | B 10 9 x x / E x x | B 10 9 5 4 / E 3 2 | 4 | 60 % | 59,9 % | 68,4 % |
| 2.54 | B 10 9 x x / E x x | B 10 9 5 4 / E 3 2 | 3 | 98 % | 98,0 % | 100,0 % |
| 28 | K D x x x x / 10 x | K D 6 5 4 3 / 10 2 | 5 | 34 % | 33,9 % | 53,1 % |
| 28 | K D x x x x / 10 x | K D 6 5 4 3 / 10 2 | 4 | 85 % | 84,8 % | 100,0 % |
| 28 | K D x x x x / 10 x | K D 6 5 4 3 / 10 2 | 3 | 98 % | 98,0 % | 100,0 % |
| 2.44 | E B x x x x / 10 x | E B 6 5 4 3 / 10 2 | 5 | 24 % | 23,7 % | 68,4 % |
| 2.44 | E B x x x x / 10 x | E B 6 5 4 3 / 10 2 | 4 | 90 % | 90,4 % | 100,0 % |
| 2.65 | E B 10 x x x / x x x | E B 10 7 6 5 / 4 3 2 | 5 | 76 % | 76,0 % | 76,0 % |
| 2.65 | E B 10 x x x / x x x | E B 10 7 6 5 / 4 3 2 | 4 | 95 % | 95,2 % | 100,0 % |
| 13 | K D 10 9 x / x x | K D 10 9 4 / 3 2 | 4 | 42 % | 42,0 % | 43,2 % |
| 13 | K D 10 9 x / x x | K D 10 9 4 / 3 2 | 3 | 93 % | 93,2 % | 100,0 % |
| 2.24 | E B 10 9 x / x x | E B 10 9 4 / 3 2 | 4 | 53 % | 52,6 % | 55,1 % |
| 2.24 | E B 10 9 x / x x | E B 10 9 4 / 3 2 | 3 | 92 % | 92,0 % | 100,0 % |
| 2.4 | E B 9 / x x | E B 9 / 3 2 | 2 | 37 % | 37,3 % | 37,3 % |
| 2.14 | E B 9 / x x x | E B 9 / 4 3 2 | 2 | 38 % | 37,7 % | 37,7 % |
| 26 | K D 10 9 x x / x x | K D 10 9 5 4 / 3 2 | 5 | 53 % | 53,1 % | 53,1 % |
| 26 | K D 10 9 x x / x x | K D 10 9 5 4 / 3 2 | 4 | 98 % | 98,0 % | 100,0 % |
| 42 | K D x x x x / 10 x x | K D 7 6 5 4 / 10 3 2 | 5 | 72 % | 71,8 % | 76,6 % |
| 2.43 | E B 9 x x x / x x | E B 9 6 5 4 / 3 2 | 5 | 27 % | 27,1 % | 27,1 % |
| 2.43 | E B 9 x x x / x x | E B 9 6 5 4 / 3 2 | 4 | 79 % | 79,1 % | 92,4 % |
| 2.43 | E B 9 x x x / x x | E B 9 6 5 4 / 3 2 | 3 | 98 % | 98,0 % | 100,0 % |
| 2.67 | E B x x x x / 10 x x | E B 7 6 5 4 / 10 3 2 | 5 | 66 % | 65,6 % | 76,0 % |
| 30 | K 9 x x x / D 10 x | K 9 5 4 3 / D 10 2 | 4 | 46 % | 45,8 % | 54,3 % |
| 30 | K 9 x x x / D 10 x | K 9 5 4 3 / D 10 2 | 3 | 96 % | 96,1 % | 100,0 % |
| 2.33 | E B 8 x / 10 x x | E B 8 4 / 10 3 2 | 3 | 27 % | 26,5 % | 38,6 % |
| 2.33 | E B 8 x / 10 x x | E B 8 4 / 10 3 2 | 2 | 90 % | 90,3 % | 90,8 % |
| 10 | K D 10 9 x x / x | K D 10 9 4 3 / 2 | 5 | 26 % | 25,8 % | 27,0 % |
| 10 | K D 10 9 x x / x | K D 10 9 4 3 / 2 | 4 | 88 % | 87,6 % | 100,0 % |
| 10 | K D 10 9 x x / x | K D 10 9 4 3 / 2 | 3 | 99 % | 98,5 % | 100,0 % |
| 2.7 | E B 10 9 x / x | E B 10 9 3 / 2 | 4 | 4 % | 4,4 % | 14,1 % |
| 2.7 | E B 10 9 x / x | E B 10 9 3 / 2 | 3 | 72 % | 71,9 % | 100,0 % |
| 2.19 | E B 10 9 x x / x | E B 10 9 4 3 / 2 | 5 | 23 % | 23,3 % | 25,7 % |
| 2.19 | E B 10 9 x x / x | E B 10 9 4 3 / 2 | 4 | 89 % | 88,8 % | 100,0 % |
| 2.19 | E B 10 9 x x / x | E B 10 9 4 3 / 2 | 3 | 99 % | 98,5 % | 100,0 % |
| 2.11 | E B 8 x / 10 x | E B 8 3 / 10 2 | 3 | 1 % | 0,9 % | 9,9 % |
| 2.11 | E B 8 x / 10 x | E B 8 3 / 10 2 | 2 | 74 % | 74,3 % | 85,6 % |
| 24 | K D 10 x x x x / x | K D 10 6 5 4 3 / 2 | 6 | 34 % | 33,9 % | 36,7 % |
| 24 | K D 10 x x x x / x | K D 10 6 5 4 3 / 2 | 5 | 85 % | 84,8 % | 100,0 % |
| 24 | K D 10 x x x x / x | K D 10 6 5 4 3 / 2 | 4 | 98 % | 98,0 % | 100,0 % |
| 2.40 | E B 10 x x x x / x | E B 10 6 5 4 3 / 2 | 6 | 37 % | 37,3 % | 43,0 % |
| 2.40 | E B 10 x x x x / x | E B 10 6 5 4 3 / 2 | 5 | 82 % | 82,0 % | 100,0 % |
| 2.40 | E B 10 x x x x / x | E B 10 6 5 4 3 / 2 | 4 | 98 % | 98,0 % | 100,0 % |
| 14 | K D 9 8 x / x x | K D 9 8 4 / 3 2 | 4 | 21 % | 21,0 % | 21,0 % |
| 14 | K D 9 8 x / x x | K D 9 8 4 / 3 2 | 3 | 74 % | 74,3 % | 79,1 % |
| 14 | K D 9 8 x / x x | K D 9 8 4 / 3 2 | 2 | 96 % | 95,6 % | 100,0 % |
| 2.25 | E B 10 8 x / x x | E B 10 8 4 / 3 2 | 4 | 38 % | 38,1 % | 38,1 % |
| 2.25 | E B 10 8 x / x x | E B 10 8 4 / 3 2 | 3 | 80 % | 80,3 % | 86,7 % |
| 2.25 | E B 10 8 x / x x | E B 10 8 4 / 3 2 | 2 | 96 % | 95,6 % | 100,0 % |
| 2.26 | E B 9 8 x / x x | E B 9 8 4 / 3 2 | 4 | 16 % | 15,7 % | 15,7 % |
| 2.26 | E B 9 8 x / x x | E B 9 8 4 / 3 2 | 3 | 76 % | 75,9 % | 83,9 % |
| 2.26 | E B 9 8 x / x x | E B 9 8 4 / 3 2 | 2 | 96 % | 95,6 % | 100,0 % |
| 2.27 | E B 8 x x / 10 x | E B 8 4 3 / 10 2 | 4 | 12 % | 12,4 % | 15,7 % |
| 2.27 | E B 8 x x / 10 x | E B 8 4 3 / 10 2 | 3 | 69 % | 69,4 % | 86,7 % |
| 2.27 | E B 8 x x / 10 x | E B 8 4 3 / 10 2 | 2 | 98 % | 97,6 % | 100,0 % |
| 2.28 | E B 8 x x / 9 x | E B 8 4 3 / 9 2 | 4 | 12 % | 12,4 % | 15,7 % |
| 2.28 | E B 8 x x / 9 x | E B 8 4 3 / 9 2 | 3 | 58 % | 58,1 % | 83,9 % |
| 2.28 | E B 8 x x / 9 x | E B 8 4 3 / 9 2 | 2 | 96 % | 96,4 % | 100,0 % |
| 2.42 | E B 10 x x x / 9 x | E B 10 5 4 3 / 9 2 | 5 | 60 % | 59,9 % | 68,4 % |
| 2.42 | E B 10 x x x / 9 x | E B 10 5 4 3 / 9 2 | 4 | 96 % | 96,1 % | 100,0 % |
| 2.17 | E x x / B 10 9 | E 3 2 / B 10 9 | 2 | 76 % | 76,0 % | 76,0 % |
| 45 | K 9 x x x / D 10 x x | K 9 6 5 4 / D 10 3 2 | 4 | 59 % | 59,3 % | 64,1 % |
| 6 | K D 10 9 / x x | K D 10 9 / 3 2 | 3 | 3 % | 50,0 % | 50,0 % |
| 2.9 | E B 10 9 / x x | E B 10 9 / 3 2 | 3 | 50 % | 50,0 % | 50,0 % |
| 16 | K D 10 9 / x x x | K D 10 9 / 4 3 2 | 3 | 51 % | 51,2 % | 51,2 % |
| 20 | K x x x / D 10 9 | K 4 3 2 / D 10 9 | 3 | 50 % | 50,0 % | 52,8 % |
| 2.29 | E B 10 9 / x x x | E B 10 9 / 4 3 2 | 3 | 76 % | 76,0 % | 76,0 % |
| 2.36 | E x x x / B 10 9 | E 4 3 2 / B 10 9 | 3 | 28 % | 28,4 % | 76,0 % |
| 11 | K D 10 8 x x / x | K D 10 8 4 3 / 2 | 5 | 19 % | 19,4 % | 19,4 % |
| 11 | K D 10 8 x x / x | K D 10 8 4 3 / 2 | 4 | 68 % | 67,8 % | 71,5 % |
| 11 | K D 10 8 x x / x | K D 10 8 4 3 / 2 | 3 | 94 % | 93,7 % | 100,0 % |
| 11 | K D 10 8 x x / x | K D 10 8 4 3 / 2 | 2 | 99 % | 99,3 % | 100,0 % |
| 12 | K D 9 8 x x / x | K D 9 8 4 3 / 2 | 5 | 3 % | 3,2 % | 3,2 % |
| 12 | K D 9 8 x x / x | K D 9 8 4 3 / 2 | 4 | 65 % | 64,6 % | 69,4 % |
| 12 | K D 9 8 x x / x | K D 9 8 4 3 / 2 | 3 | 92 % | 92,5 % | 100,0 % |
| 12 | K D 9 8 x x / x | K D 9 8 4 3 / 2 | 2 | 99 % | 99,3 % | 100,0 % |
| 2.20 | E B 10 8 x x / x | E B 10 8 4 3 / 2 | 5 | 10 % | 10,3 % | 10,3 % |
| 2.20 | E B 10 8 x x / x | E B 10 8 4 3 / 2 | 4 | 74 % | 74,3 % | 77,9 % |
| 2.20 | E B 10 8 x x / x | E B 10 8 4 3 / 2 | 3 | 94 % | 93,7 % | 100,0 % |
| 2.20 | E B 10 8 x x / x | E B 10 8 4 3 / 2 | 2 | 99 % | 99,3 % | 100,0 % |
| 2.21 | E B 9 8 x x / x | E B 9 8 4 3 / 2 | 5 | 3 % | 3,2 % | 3,2 % |
| 2.21 | E B 9 8 x x / x | E B 9 8 4 3 / 2 | 4 | 69 % | 69,4 % | 74,3 % |
| 2.21 | E B 9 8 x x / x | E B 9 8 4 3 / 2 | 3 | 92 % | 92,5 % | 100,0 % |
| 2.21 | E B 9 8 x x / x | E B 9 8 4 3 / 2 | 2 | 99 % | 99,3 % | 100,0 % |
| 2.22 | E B 8 x x x / x | E B 8 5 4 3 / 2 | 4 | 39 % | 38,8 % | 51,7 % |
| 2.22 | E B 8 x x x / x | E B 8 5 4 3 / 2 | 3 | 84 % | 84,0 % | 93,7 % |
| 2.22 | E B 8 x x x / x | E B 8 5 4 3 / 2 | 2 | 99 % | 98,5 % | 100,0 % |
| 2.47 | E 9 x x x x / B x | E 9 6 5 4 3 / B 2 | 5 | 7 % | 6,8 % | 6,8 % |
| 2.47 | E 9 x x x x / B x | E 9 6 5 4 3 / B 2 | 4 | 73 % | 73,5 % | 92,4 % |
| 2.47 | E 9 x x x x / B x | E 9 6 5 4 3 / B 2 | 3 | 96 % | 96,1 % | 100,0 % |
| 2.15 | E B 8 / 10 x x | E B 8 / 10 3 2 | 2 | 24 % | 39,7 % | 39,7 % |
| 2.56 | E B 8 x / 10 x x x | E B 8 5 / 10 4 3 2 | 3 | 44 % | 44,3 % | 46,0 % |
| 2.56 | E B 8 x / 10 x x x | E B 8 5 / 10 4 3 2 | 2 | 100 % | 100,0 % | 100,0 % |
| 7 | K D 9 8 / x x | K D 9 8 / 3 2 | 3 | 50 % | 5,2 % | 5,2 % |
| 47 | K 9 x x x / D x x x | K 9 7 6 5 / D 4 3 2 | 4 | 53 % | 52,6 % | 52,6 % |
| 47 | K 9 x x x / D x x x | K 9 7 6 5 / D 4 3 2 | 3 | 95 % | 95,2 % | 100,0 % |
| 2.72 | E 9 x x x / B x x x | E 9 7 6 5 / B 4 3 2 | 4 | 53 % | 53,1 % | 53,1 % |
| 23 | K D 10 9 x x x / x | K D 10 9 5 4 3 / 2 | 6 | 37 % | 36,7 % | 36,7 % |
| 23 | K D 10 9 x x x / x | K D 10 9 5 4 3 / 2 | 5 | 96 % | 96,1 % | 100,0 % |
| 2.38 | E B 10 9 x x x / x | E B 10 9 5 4 3 / 2 | 6 | 43 % | 43,0 % | 43,0 % |
| 2.38 | E B 10 9 x x x / x | E B 10 9 5 4 3 / 2 | 5 | 96 % | 96,1 % | 100,0 % |
| 2.66 | E B 9 x x x / x x x | E B 9 7 6 5 / 4 3 2 | 5 | 57 % | 57,3 % | 57,3 % |
| 2.66 | E B 9 x x x / x x x | E B 9 7 6 5 / 4 3 2 | 4 | 95 % | 95,2 % | 95,2 % |
| 2.62 | E B 10 9 x x x / x x | E B 10 9 6 5 4 / 3 2 | 6 | 76 % | 76,0 % | 76,0 % |
| 2.5 | E B 8 / 10 x | E B 8 / 10 2 | 2 | 38 % | 38,1 % | 38,1 % |
| 44 | K D 10 9 x / x x x x | K D 10 9 6 / 5 4 3 2 | 4 | 77 % | 76,6 % | 76,6 % |
| 2.70 | E B 9 x x / x x x x | E B 9 7 6 / 5 4 3 2 | 4 | 57 % | 57,3 % | 57,3 % |
| 2.70 | E B 9 x x / x x x x | E B 9 7 6 / 5 4 3 2 | 3 | 95 % | 95,2 % | 95,2 % |
| 1 | K D 10 9 / x | K D 10 9 / 2 | 2 | 11 % | 100,0 % | 100,0 % |
| 2.1 | E B 10 9 / x | E B 10 9 / 2 | 3 | 7 % | 7,2 % | 7,2 % |
| 17 | K D 9 8 / x x x | K D 9 8 / 4 3 2 | 3 | 24 % | 24,0 % | 24,0 % |
| 17 | K D 9 8 / x x x | K D 9 8 / 4 3 2 | 2 | 89 % | 89,0 % | 89,0 % |
| 2.31 | E B 9 8 / x x x | E B 9 8 / 4 3 2 | 3 | 37 % | 37,0 % | 37,0 % |
| 2.31 | E B 9 8 / x x x | E B 9 8 / 4 3 2 | 2 | 89 % | 89,0 % | 89,0 % |
| 2.23 | B 10 9 x x x / E | B 10 9 4 3 2 / E | 5 | 3 % | 3,2 % | 8,1 % |
| 2.23 | B 10 9 x x x / E | B 10 9 4 3 2 / E | 4 | 89 % | 88,8 % | 100,0 % |
| 2.23 | B 10 9 x x x / E | B 10 9 4 3 2 / E | 3 | 99 % | 98,5 % | 100,0 % |
| 2.41 | E B 9 x x x x / x | E B 9 6 5 4 3 / 2 | 6 | 14 % | 13,6 % | 13,6 % |
| 2.41 | E B 9 x x x x / x | E B 9 6 5 4 3 / 2 | 5 | 71 % | 70,7 % | 84,8 % |
| 2.41 | E B 9 x x x x / x | E B 9 6 5 4 3 / 2 | 4 | 96 % | 96,1 % | 100,0 % |
| 33 | K D 10 9 / x x x x | K D 10 9 / 5 4 3 2 | 3 | 63 % | 63,0 % | 63,0 % |
| 2.55 | E B 10 9 / x x x x | E B 10 9 / 5 4 3 2 | 3 | 76 % | 76,0 % | 76,0 % |
| 2.18 | E B 10 9 8 x / x | E B 10 9 8 3 / 2 | 5 | 26 % | 25,7 % | 25,7 % |
| 2.18 | E B 10 9 8 x / x | E B 10 9 8 3 / 2 | 4 | 99 % | 98,5 % | 100,0 % |
| 2.68 | E 9 x x x x / B x x | E 9 7 6 5 4 / B 3 2 | 5 | 53 % | 53,1 % | 53,1 % |
| 2.68 | E 9 x x x x / B x x | E 9 7 6 5 4 / B 3 2 | 4 | 100 % | 100,0 % | 100,0 % |
| 31 | K x x x x / D 10 9 | K 5 4 3 2 / D 10 9 | 4 | 48 % | 48,0 % | 54,3 % |
| 31 | K x x x x / D 10 9 | K 5 4 3 2 / D 10 9 | 3 | 98 % | 98,0 % | 100,0 % |
| 2.53 | E x x x x / B 10 9 | E 5 4 3 2 / B 10 9 | 4 | 54 % | 54,3 % | 76,0 % |
| 2.53 | E x x x x / B 10 9 | E 5 4 3 2 / B 10 9 | 3 | 96 % | 96,1 % | 100,0 % |
| 2.50 | E B 8 7 x / 10 x x | E B 8 7 4 / 10 3 2 | 4 | 42 % | 42,4 % | 42,4 % |
| 2.50 | E B 8 7 x / 10 x x | E B 8 7 4 / 10 3 2 | 3 | 98 % | 98,0 % | 98,0 % |
| 2.52 | E 9 8 7 x / B x x | E 9 8 7 4 / B 3 2 | 4 | 13 % | 13,0 % | 13,0 % |
| 2.52 | E 9 8 7 x / B x x | E 9 8 7 4 / B 3 2 | 3 | 93 % | 93,3 % | 95,2 % |
| 2.74 | E B 10 x x / x x x x x | E B 10 8 7 / 6 5 4 3 2 | 4 | 89 % | 89,0 % | 89,0 % |
| 2.39 | E B 10 8 x x x / x | E B 10 8 5 4 3 / 2 | 6 | 37 % | 37,3 % | 37,3 % |
| 2.39 | E B 10 8 x x x / x | E B 10 8 5 4 3 / 2 | 5 | 88 % | 87,6 % | 87,6 % |
| 2.39 | E B 10 8 x x x / x | E B 10 8 5 4 3 / 2 | 4 | 98 % | 98,0 % | 100,0 % |
| 2.63 | E B 9 x x x x / x x | E B 9 7 6 5 4 / 3 2 | 6 | 53 % | 53,1 % | 53,1 % |
| 2.63 | E B 9 x x x x / x x | E B 9 7 6 5 4 / 3 2 | 5 | 95 % | 95,2 % | 95,2 % |
| 2.35 | E 9 8 7 / B x x | E 9 8 7 / B 3 2 | 3 | 6 % | 6,1 % | 6,1 % |
| 2.35 | E 9 8 7 / B x x | E 9 8 7 / B 3 2 | 2 | 89 % | 89,0 % | 89,0 % |
| 36 | K x x x / D 10 9 8 | K 4 3 2 / D 10 9 8 | 3 | 56 % | 56,2 % | 56,2 % |
| 5 | K D 10 9 8 / x | K D 10 9 8 / 2 | 4 | 18 % | 18,2 % | 18,2 % |
| 2.6 | E B 10 9 8 / x | E B 10 9 8 / 2 | 4 | 14 % | 14,1 % | 14,1 % |
| 22 | 10 9 8 7 / K D x | 10 9 8 7 / K D 2 | 3 | 36 % | 36,3 % | 36,3 % |
| 2.58 | E 9 8 7 / B x x x | E 9 8 7 / B 4 3 2 | 3 | 13 % | 13,0 % | 13,0 % |
| 2.58 | E 9 8 7 / B x x x | E 9 8 7 / B 4 3 2 | 2 | 97 % | 97,2 % | 97,2 % |
| 2.69 | E x x x x x / B 10 9 | E 6 5 4 3 2 / B 10 9 | 5 | 71 % | 71,2 % | 76,0 % |
| 2.73 | E x x x x / B 10 9 8 | E 5 4 3 2 / B 10 9 8 | 4 | 76 % | 76,0 % | 76,0 % |
