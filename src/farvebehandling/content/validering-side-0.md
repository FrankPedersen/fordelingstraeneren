# Validering: Suit Combinations 0 – Zero High Card Points held by opponents

Kilde: [https://www.bridgehands.com/S/Suit_Combination_0.htm](https://www.bridgehands.com/S/Suit_Combination_0.htm), læst 2026-10-04. Genereret af `scripts/solve.ts`.

Model: Optimalt modspil: modspillet kender alle kort og blander sine valg; spilføreren ser kun de spillede kort. Ubegrænsede forbindelser, chancer a priori.

Fortolkninger af x: **lav** = spilførerens x'er er de laveste kort (specens regel); **høj** = spilførerens x'er er de højeste kort under det laveste navngivne kort, så modpartens små kort er lavere.

Kilden har kun hele procenter, så en afvigelse over 0,5 procentpoint gennemgås.

## Resultat

3 brugbare cases. De 10 hyppigste dækker 100 % af sidens samlede hyppighed, de 30 hyppigste 100 %.

- Brugbare cases: 3 af 6, med 5 mål.
- Fortolkning "lav": 5 af 5 mål inden for 0,5 procentpoint, 5 inden for 1 procentpoint.
- Fortolkning "høj": 0 af 5 mål inden for 0,5 procentpoint, 1 inden for 1 procentpoint.
- Mindst én af fortolkningerne inden for 0,5 procentpoint: 5 af 5 mål.
- Mål, hvor den bedste linje kræver, at spilføreren blander (ingen ren linje inden for 0,002 procentpoint): 0.

## Afvigelser over 0,5 procentpoint med fortolkningen "lav"

| Case | Hånd / bordet | Mål | Kilde | Lav | Høj | Nærmest | Kildens bemærkning |
| --- | --- | --- | --- | --- | --- | --- | --- |

## Sorteret fra

| Case | Holding | Grund |
| --- | --- | --- |
| 4 |  / E K D B x x | holdingen har 0+6 kort, men fordelingen er 6-1 |
| 5 |  / E K D B x | holdingen har 0+5 kort, men fordelingen er 5-2 |
| 6 | E K D B x / x x x | holdingen har 5+3 kort, men fordelingen er 8 |

## Alle brugbare cases

| Case | Hånd / bordet | Konkret (lav) | Mål | Kilde | Lav | Høj |
| --- | --- | --- | --- | --- | --- | --- |
| 2 | E K D B x / x | E K D B 3 / 2 | 5 | 62 % | 62,2 % | 100,0 % |
| 1 | E K D B x x / – | E K D B 3 2 / – | 6 | 62 % | 62,2 % | 100,0 % |
| 1 | E K D B x x / – | E K D B 3 2 / – | 5 | 93 % | 92,7 % | 100,0 % |
| 3 | E K D B x x x / – | E K D B 4 3 2 / – | 7 | 84 % | 84,0 % | 100,0 % |
| 3 | E K D B x x x / – | E K D B 4 3 2 / – | 6 | 99 % | 98,5 % | 100,0 % |
