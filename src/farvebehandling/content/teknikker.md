# Teknik pr. kombination

Genereret af `scripts/solve.ts` til godkendelse (åbent punkt i specen: "Teknik pr. case"). Hver kombination får én teknik, og teknikken er rummet i paladset. Reglerne står i `src/farvebehandling/techniques.ts`:

0. **Begrænset valg:** i første runde af den bedste linje falder én af to eller flere ligeværdige honnører hos modparten (i mindst 5 % af spillene), og så er kipning klart bedst.
1. **Sikkerhedsspil:** til et lavere mål giver linjen med flest stik i gennemsnit mere end 0,5 procentpoint mindre end den bedste linje.
2. **Hovedmålet** er det mål, hvor valget af linje betyder mest. Mål under 25 % tæller kun, hvis alle mål ligger under. Er flere linjer lige gode (inden for 0,5 procentpoint), vælges den mest lærerige: dobbelt kipning, enkelt kipning, spil mod honnør, sikkerhedsspil, fald.
3. **Hovedlinjens første kipning:** modpartens kort over kortet ligger i to huller (fx K og B over E D 10) = dobbelt kipning; spilles der mod det højeste kort, der er tilbage i hånden = spil mod honnør; ellers enkelt kipning, mod damen eller knægten med 8 kort eller flere fald eller kip.
4. **Små kort fra begge hænder** er en kipning (som i punkt 3), når det laveste kort har en eller to af modpartens kort over sig; ellers et sikkerhedsspil.
5. **Ingen kipning:** fald eller kip.


## Enkelt kipning (97)

| Rang | Hånd / bordet | Mål | Begrundelse |
| --- | --- | --- | --- |
| 40 | E 10 6 5 / 4 3 2 | 2 | Kipning mod 10'eren med 7 kort. |
| 51 | E D 4 / B 3 2 | 3, 2 | Knægten spilles ud og løber med 6 kort. |
| 58 | E 10 6 5 4 / 3 2 | 3, 2 | 10'eren spilles ud og løber med 7 kort. |
| 60 | E 10 5 4 / K 3 2 | 3 | Kipning mod 10'eren med 7 kort. |
| 65 | E B 5 4 3 / K 2 | 5, 4, 3 | Kipning mod knægten med 7 kort. |
| 75 | E B 4 / 10 3 2 | 2 | Kipning mod knægten med 6 kort. |
| 89 | E K B 5 4 3 / 2 | 6, 5, 4, 3 | Kipning mod knægten med 7 kort. |
| 91 | E D 6 5 / 10 4 3 2 | 4, 3 | Kipning mod damen med 8 kort. |
| 97 | E D B 7 6 / 5 4 3 2 | 5, 4 | Kipning mod damen med 9 kort. |
| 115 | E B 10 4 3 / 2 | 3, 2 | Kipning mod knægten med 6 kort. |
| 127 | E 10 9 4 / 3 2 | 2 | Kipning mod 10'eren med 6 kort. |
| 130 | E D 10 5 4 / B 3 2 | 5, 4 | Kipning mod damen med 8 kort. |
| 136 | B 10 4 3 / E K 2 | 4 | Knægten spilles ud og løber med 7 kort. |
| 137 | E B 10 3 / 2 | 3, 2 | Kipning mod knægten med 5 kort. |
| 144 | E 5 4 3 / 10 9 2 | 2 | 10'eren spilles ud og løber med 7 kort. |
| 151 | E B 10 4 3 / K 2 | 5, 4 | Kipning mod knægten med 7 kort. |
| 165 | E B 10 / 4 3 2 | 2 | Små kort fra begge hænder kipper med 10'eren med 6 kort. |
| 169 | E 10 8 4 / 3 2 | 2 | Kipning mod 10'eren med 6 kort. |
| 182 | E 10 4 3 / K 9 2 | 4, 3 | Kipning mod 9'eren med 7 kort. |
| 187 | 10 9 4 3 / E D 2 | 4, 3 | Kipning mod damen med 7 kort. |
| 205 | E 8 7 6 5 / D B 4 3 2 | 5 | Damen spilles ud og løber med 10 kort. |
| 209 | E D 9 5 4 / B 3 2 | 5, 4, 3 | Kipning mod damen med 8 kort. |
| 249 | E D B 8 7 6 / 5 4 3 2 | 6 | Kipning mod damen med 10 kort. |
| 250 | D B 8 7 6 5 / E 4 3 2 | 6 | Damen spilles ud og løber med 10 kort. |
| 254 | E K D 10 3 / 2 | 5, 4 | Kipning mod 10'eren med 6 kort. |
| 256 | E B 9 3 / K 2 | 4, 3 | Kipning mod knægten med 6 kort. |
| 260 | E 10 8 5 4 / 3 2 | 3, 2 | Kipning mod 10'eren med 7 kort. |
| 276 | E D 9 5 / B 4 3 2 | 4, 3 | Kipning mod damen med 8 kort. |
| 282 | E D B 9 5 4 / 3 2 | 6, 5, 4 | Kipning mod damen med 8 kort. |
| 284 | E D 10 9 5 4 / 3 2 | 6, 5, 4 | Kipning mod damen med 8 kort. |
| 297 | E D 8 4 / B 3 2 | 3 | Kipning mod damen med 7 kort. |
| 311 | E D B 8 7 / 6 5 4 3 2 | 5 | Kipning mod damen med 10 kort. |
| 322 | E B 10 9 3 / 2 | 4, 3 | Kipning mod knægten med 6 kort. |
| 324 | E K B 10 / 4 3 2 | 4 | Små kort fra begge hænder kipper med 10'eren med 7 kort. |
| 335 | D B 7 6 5 4 3 / E 2 | 7, 6 | Damen spilles ud og løber med 9 kort. |
| 343 | E K 4 3 2 / D 10 | 5, 4 | Små kort fra begge hænder kipper med 10'eren med 7 kort. |
| 346 | E D 9 5 4 3 / B 2 | 6, 5, 4 | Knægten spilles ud og løber med 8 kort. |
| 355 | E 3 2 / D B 9 | 3 | Damen spilles ud og løber med 6 kort. |
| 357 | E 3 2 / B 10 9 | 2 | Knægten spilles ud og løber med 6 kort. |
| 363 | D B 9 6 5 / E 4 3 2 | 5, 4 | Damen spilles ud og løber med 9 kort. |
| 374 | E K D 9 / 3 2 | 4 | Små kort fra begge hænder kipper med 9'eren med 6 kort. |
| 377 | E D B 9 / 3 2 | 4, 3 | Kipning mod damen med 6 kort. |
| 379 | E K 10 9 / 3 2 | 4, 3 | Små kort fra begge hænder kipper med 9'eren med 6 kort. |
| 380 | E 9 3 2 / K 10 | 3 | Små kort fra begge hænder kipper med 10'eren med 6 kort. |
| 385 | E B 10 9 / 3 2 | 3 | Små kort fra begge hænder kipper med 9'eren med 6 kort. |
| 389 | D B 8 7 6 5 4 / E 3 2 | 7 | Damen spilles ud og løber med 10 kort. |
| 395 | K D 10 9 / 4 3 2 | 3 | Kongen spilles ud og løber med 7 kort. |
| 397 | E B 10 9 / 4 3 2 | 3 | Små kort fra begge hænder kipper med 9'eren med 7 kort. |
| 398 | E 4 3 2 / B 10 9 | 3 | Knægten spilles ud og løber med 7 kort. |
| 404 | E D 9 6 5 4 / B 3 2 | 6, 5 | Kipning mod damen med 9 kort. |
| 405 | D B 9 6 5 4 / E 3 2 | 6, 5 | Damen spilles ud og løber med 9 kort. |
| 412 | E B 9 8 4 3 / 2 | 5, 4, 3, 2 | Kipning mod knægten med 7 kort. |
| 420 | E 10 9 3 / K 8 2 | 4, 3 | 10'eren spilles ud og løber med 7 kort. |
| 421 | E B 8 / 10 3 2 | 2 | 10'eren spilles ud og løber med 6 kort. |
| 425 | E 10 4 3 2 / K 9 | 4, 3 | Små kort fra begge hænder kipper med 9'eren med 7 kort. |
| 431 | E D 4 3 / B 9 8 2 | 4, 3 | Kipning mod damen med 8 kort. |
| 432 | E 9 8 4 / D B 3 2 | 4, 3 | Damen spilles ud og løber med 8 kort. |
| 463 | E D 10 9 5 4 3 / 2 | 7, 6, 5 | Kipning mod damen med 8 kort. |
| 474 | E K D 10 / 2 | 4 | Små kort fra begge hænder kipper med 10'eren med 5 kort. |
| 475 | E K B 10 / 2 | 4 | Små kort fra begge hænder kipper med 10'eren med 5 kort. |
| 479 | E K 3 2 / B 10 9 | 4 | Knægten spilles ud og løber med 7 kort. |
| 481 | E B 8 / 10 2 | 2 | 10'eren spilles ud og løber med 5 kort. |
| 482 | E 6 5 4 3 / D B 9 2 | 5, 4 | Damen spilles ud og løber med 9 kort. |
| 493 | E B 10 9 / 2 | 3 | Små kort fra begge hænder kipper med 9'eren med 5 kort. |
| 506 | E D 9 8 4 3 / B 2 | 6, 5 | Knægten spilles ud og løber med 8 kort. |
| 508 | E 9 8 5 4 / D B 3 2 | 5 | Damen spilles ud og løber med 9 kort. |
| 509 | B 9 8 5 4 / E D 3 2 | 5 | Kipning mod damen med 9 kort. |
| 510 | K D 9 5 4 / B 8 3 2 | 4 | Kongen spilles ud og løber med 9 kort. |
| 518 | E K B 10 9 / 3 2 | 5 | Små kort fra begge hænder kipper med 9'eren med 7 kort. |
| 528 | E B 10 9 8 3 / 2 | 5, 4 | Kipning mod knægten med 7 kort. |
| 538 | B 5 4 3 2 / E D 9 | 5, 4, 3 | Kipning mod damen med 8 kort. |
| 547 | K D 7 4 / B 9 3 2 | 3 | Kongen spilles ud og løber med 8 kort. |
| 554 | E D 10 8 7 / 6 5 4 3 2 | 5, 4 | Kipning mod damen med 10 kort. |
| 557 | E D B 9 8 / 3 2 | 5, 4 | Kipning mod damen med 7 kort. |
| 561 | E D 8 6 5 / B 4 3 2 | 5, 4 | Knægten spilles ud og løber med 9 kort. |
| 563 | K D 8 6 5 / B 4 3 2 | 4 | Knægten spilles ud og løber med 9 kort. |
| 566 | E D 9 8 / B 2 | 4, 3 | Knægten spilles ud og løber med 6 kort. |
| 567 | E D 8 2 / B 9 | 3 | Knægten spilles ud og løber med 6 kort. |
| 582 | E D 8 7 / B 3 2 | 4, 3 | Knægten spilles ud og løber med 7 kort. |
| 583 | E 9 8 7 / B 3 2 | 3, 2 | Knægten spilles ud og løber med 7 kort. |
| 593 | E B 9 7 6 5 / D 4 3 2 | 6 | Damen spilles ud og løber med 10 kort. |
| 595 | E D 8 6 5 4 / B 3 2 | 6, 5 | Knægten spilles ud og løber med 9 kort. |
| 596 | B 9 8 5 4 3 / E D 2 | 6 | Kipning mod damen med 9 kort. |
| 598 | K D 9 5 4 3 / B 8 2 | 5 | Kongen spilles ud og løber med 9 kort. |
| 599 | K D 8 6 5 4 / B 3 2 | 5 | Knægten spilles ud og løber med 9 kort. |
| 601 | E D 4 3 2 / B 9 8 | 5, 4 | Knægten spilles ud og løber med 8 kort. |
| 604 | E K 10 9 8 / 2 | 5, 4 | Små kort fra begge hænder kipper med 8'eren med 6 kort. |
| 607 | E B 10 9 8 / 2 | 4 | Små kort fra begge hænder kipper med 8'eren med 6 kort. |
| 609 | E B 9 7 6 / D 5 4 3 2 | 5 | Damen spilles ud og løber med 10 kort. |
| 621 | E D 9 7 4 / B 8 3 2 | 5 | Kipning mod damen med 9 kort. |
| 628 | E B 9 7 6 5 4 / D 3 2 | 7 | Damen spilles ud og løber med 10 kort. |
| 635 | B 7 4 3 2 / E D 9 | 5, 4, 3 | Kipning mod damen med 8 kort. |
| 640 | E 6 5 4 3 2 / D B 9 | 6, 5 | Damen spilles ud og løber med 9 kort. |
| 648 | E D 5 4 3 2 / B 9 8 | 6, 5 | Kipning mod damen med 9 kort. |
| 652 | E D 9 7 6 / B 8 2 | 5, 4 | Knægten spilles ud og løber med 8 kort. |
| 654 | E D 7 4 3 2 / B 9 8 | 6 | Kipning mod damen med 9 kort. |
| 657 | E D B 5 4 3 2 / 8 7 6 | 7 | Kipning mod damen med 10 kort. |

## Fald eller kip (94)

| Rang | Hånd / bordet | Mål | Begrundelse |
| --- | --- | --- | --- |
| 20 | E K D 6 5 4 / 3 2 | 6, 5 | Linjen spiller på fald med 8 kort. |
| 29 | E K D 7 6 5 / 4 3 2 | 6 | Linjen spiller på fald med 9 kort. |
| 33 | E K D 6 / 5 4 3 2 | 4 | Linjen spiller på fald med 8 kort. |
| 48 | E K 4 / B 3 2 | 3 | Linjen spiller på fald med 6 kort. |
| 77 | E K D 7 6 5 4 / 3 2 | 7 | Linjen spiller på fald med 9 kort. |
| 90 | E 10 6 5 / K 4 3 2 | 4, 3 | Kipning mod 10'eren med 8 kort: fald eller kip. |
| 96 | B 7 6 5 4 / E K 3 2 | 5, 4 | Linjen spiller på fald med 9 kort. |
| 102 | E 10 6 5 4 / K 3 2 | 5, 4, 3 | Kipning mod 10'eren med 8 kort: fald eller kip. |
| 111 | E K D 6 5 4 3 / 2 | 7, 6 | Linjen spiller på fald med 8 kort. |
| 153 | E K D 10 5 4 / 3 2 | 6, 5 | Linjen spiller på fald med 8 kort. |
| 154 | E K B 10 5 4 / 3 2 | 6, 5 | Kipning mod knægten med 8 kort: fald eller kip. |
| 158 | E K D 10 5 / 4 3 2 | 5, 4 | Linjen spiller på fald med 8 kort. |
| 166 | E K 10 6 5 / D 4 3 2 | 5 | Linjen spiller på fald med 9 kort. |
| 168 | E B 7 6 5 / 10 4 3 2 | 4 | Linjen spiller på fald med 9 kort. |
| 191 | E K D 4 3 2 / – | 5, 4 | Linjen spiller på fald med 6 kort. |
| 195 | E 10 5 4 / K 9 3 2 | 4, 3 | Kipning mod 10'eren med 8 kort: fald eller kip. |
| 199 | E K D B 3 / 2 | 5 | Linjen spiller på fald med 6 kort. |
| 204 | E B 8 7 6 / K 5 4 3 2 | 5 | Linjen spiller på fald med 10 kort. |
| 208 | E B 9 5 4 / K 3 2 | 5, 4, 3 | Kipning mod knægten med 8 kort: fald eller kip. |
| 225 | E K 10 6 5 4 / D 3 2 | 6 | Linjen spiller på fald med 9 kort. |
| 253 | E K 9 3 / D 2 | 4 | Linjen spiller på fald med 6 kort. |
| 267 | E K B 3 2 / – | 3 | Linjen spiller på fald med 5 kort. |
| 274 | E K 9 5 / D 4 3 2 | 4 | Linjen spiller på fald med 8 kort. |
| 281 | E K B 9 5 4 / 3 2 | 6, 5, 4 | Kipning mod knægten med 8 kort: fald eller kip. |
| 286 | E 10 7 6 5 4 / D 3 2 | 5 | Linjen spiller på fald med 9 kort. |
| 290 | E B 7 6 5 4 / 10 3 2 | 5 | Linjen spiller på fald med 9 kort. |
| 293 | E K D 5 4 3 2 / – | 7, 6, 5 | Linjen spiller på fald med 7 kort. |
| 301 | E K 10 9 5 / 4 3 2 | 5, 4, 3 | Kipning mod 10'eren med 8 kort: fald eller kip. |
| 313 | E K D 9 4 3 / 2 | 6, 5, 4 | Linjen spiller på fald med 7 kort. |
| 325 | E K D 10 6 5 4 / 3 2 | 7 | Linjen spiller på fald med 9 kort. |
| 326 | E K D 10 6 / 5 4 3 2 | 5 | Linjen spiller på fald med 9 kort. |
| 332 | E B 10 6 5 4 3 / 2 | 6, 5, 4 | Kipning mod knægten med 8 kort: fald eller kip. |
| 333 | E K 10 4 / D 9 3 2 | 4 | Linjen spiller på fald med 8 kort. |
| 358 | E B 9 5 4 / K 10 3 2 | 5 | Linjen spiller på fald med 9 kort. |
| 359 | E B 6 5 4 / K 9 3 2 | 5 | Linjen spiller på fald med 9 kort. |
| 360 | E 9 6 5 4 / K B 3 2 | 5 | Linjen spiller på fald med 9 kort. |
| 361 | B 10 9 5 4 / E K 3 2 | 5 | Linjen spiller på fald med 9 kort. |
| 364 | E K 9 6 5 / 10 4 3 2 | 5, 4 | Linjen spiller på fald med 9 kort. |
| 366 | E 10 9 6 5 / D 4 3 2 | 5, 4 | Linjen spiller på fald med 9 kort. |
| 367 | E 10 6 5 4 / D 9 3 2 | 5, 4 | Linjen spiller på fald med 9 kort. |
| 387 | E K B 5 4 3 2 / – | 6, 5, 4 | Linjen spiller på fald med 7 kort. |
| 388 | E B 8 7 6 5 4 / K 3 2 | 7 | Linjen spiller på fald med 10 kort. |
| 399 | E K 10 9 3 / D 2 | 5 | Linjen spiller på fald med 7 kort. |
| 401 | E K D 10 / 5 4 3 2 | 4 | Linjen spiller på fald med 8 kort. |
| 402 | E K B 10 / 5 4 3 2 | 4 | Små kort fra begge hænder kipper med 10'eren med 8 kort: fald eller kip. |
| 403 | E K 9 6 5 4 / B 3 2 | 6 | Linjen spiller på fald med 9 kort. |
| 407 | E 10 9 6 5 4 / D 3 2 | 6, 5 | Linjen spiller på fald med 9 kort. |
| 415 | E 10 7 6 5 4 3 / 2 | 5, 4 | Kipning mod 10'eren med 8 kort: fald eller kip. |
| 416 | E K D B 3 2 / – | 6, 5 | Linjen spiller på fald med 6 kort. |
| 427 | E K 9 4 / D 8 3 2 | 4 | Linjen spiller på fald med 8 kort. |
| 446 | E 10 7 6 5 / 9 4 3 2 | 4, 3 | 9'eren spilles ud og løber med 9 kort: fald eller kip. |
| 452 | D 7 6 5 4 3 / E 10 2 | 5 | Linjen spiller på fald med 9 kort. |
| 465 | E B 10 9 5 4 3 / 2 | 6, 5 | Kipning mod knægten med 8 kort: fald eller kip. |
| 467 | E K D B 4 3 2 / – | 7, 6 | Linjen spiller på fald med 7 kort. |
| 472 | E K D 10 3 2 / – | 6, 5, 4 | Linjen spiller på fald med 6 kort. |
| 473 | E K B 10 3 2 / – | 6, 5 | Linjen spiller på fald med 6 kort. |
| 476 | E K D 10 9 3 / 2 | 6, 5 | Linjen spiller på fald med 7 kort. |
| 489 | E K D 9 / 2 | 4 | Linjen spiller på fald med 5 kort. |
| 500 | E K B 10 9 4 3 / 2 | 7 | Kipning mod knægten med 8 kort: fald eller kip. |
| 501 | B 10 9 4 3 2 / E | 5, 4, 3 | Linjen spiller på fald med 7 kort. |
| 502 | E B 9 6 5 4 3 / 2 | 6, 5, 4 | Kipning mod knægten med 8 kort: fald eller kip. |
| 505 | E B 8 5 4 3 / K 2 | 6, 5, 4 | Kipning mod knægten med 8 kort: fald eller kip. |
| 507 | E K D 9 3 2 / – | 6, 5, 4 | Linjen spiller på fald med 6 kort. |
| 511 | E 10 9 5 4 / D 8 3 2 | 5, 4 | Linjen spiller på fald med 9 kort. |
| 517 | E K D 10 9 / 3 2 | 5 | Linjen spiller på fald med 7 kort. |
| 519 | E K 10 9 / 5 4 3 2 | 4, 3 | Små kort fra begge hænder kipper med 9'eren med 8 kort: fald eller kip. |
| 523 | E B 10 9 / 5 4 3 2 | 3 | Små kort fra begge hænder kipper med 9'eren med 8 kort: fald eller kip. |
| 525 | E B 6 5 4 3 / K 9 2 | 6 | Linjen spiller på fald med 9 kort. |
| 530 | E B 9 6 5 / K 10 4 3 2 | 5 | Linjen spiller på fald med 10 kort. |
| 531 | E K B 10 2 / – | 4 | Linjen spiller på fald med 5 kort. |
| 534 | E K 4 3 2 / B 10 9 | 5 | Knægten spilles ud og løber med 8 kort: fald eller kip. |
| 546 | E 10 8 3 / K B 9 2 | 4 | Kipning mod 9'eren med 8 kort: fald eller kip. |
| 553 | E D B 9 8 7 / 6 5 4 3 2 | 6 | Linjen spiller på fald med 11 kort. |
| 555 | E B 10 8 7 / 6 5 4 3 2 | 4 | Kipning mod knægten med 10 kort: fald eller kip. |
| 569 | E 10 5 4 3 2 / K 9 | 6, 5, 4 | Små kort fra begge hænder kipper med 9'eren med 8 kort: fald eller kip. |
| 579 | E 10 9 7 6 5 4 / 3 2 | 6, 5 | Kipning mod 10'eren med 9 kort: fald eller kip. |
| 581 | E K D 9 4 3 2 / – | 7, 6, 5 | Linjen spiller på fald med 7 kort. |
| 587 | E K D 10 9 / 2 | 5 | Linjen spiller på fald med 6 kort. |
| 589 | E 10 9 8 / K 4 3 2 | 4, 3 | Små kort fra begge hænder kipper med 8'eren med 8 kort: fald eller kip. |
| 592 | E K 9 7 6 5 / B 4 3 2 | 6 | Linjen spiller på fald med 10 kort. |
| 608 | E K 9 7 6 / B 5 4 3 2 | 5 | Linjen spiller på fald med 10 kort. |
| 615 | K 9 6 5 4 3 / E B 10 2 | 6 | Linjen spiller på fald med 10 kort. |
| 618 | E K D 10 9 3 2 / – | 6, 5 | Linjen spiller på fald med 7 kort. |
| 620 | E K B 8 4 3 2 / – | 6, 5, 4 | Linjen spiller på fald med 7 kort. |
| 622 | E K 5 4 3 2 / B 10 9 | 6 | Linjen spiller på fald med 9 kort. |
| 626 | 10 9 8 7 / K D 2 | 3 | Linjen spiller på fald med 7 kort. |
| 627 | E K 9 7 6 5 4 / B 3 2 | 7 | Linjen spiller på fald med 10 kort. |
| 633 | E K 6 5 4 / 10 9 8 3 2 | 5 | Linjen spiller på fald med 10 kort. |
| 639 | E K B 9 8 7 3 / 2 | 7, 6 | Kipning mod knægten med 8 kort: fald eller kip. |
| 642 | E 6 5 4 3 2 / B 10 9 | 5 | Knægten spilles ud og løber med 9 kort: fald eller kip. |
| 643 | E 5 4 3 2 / B 10 9 8 | 4 | Knægten spilles ud og løber med 9 kort: fald eller kip. |
| 649 | D 8 5 4 3 2 / E 10 9 | 6, 5 | Linjen spiller på fald med 9 kort. |
| 655 | E D 10 9 8 7 / 6 5 4 3 2 | 6 | Linjen spiller på fald med 11 kort. |
| 656 | K 6 5 4 3 2 / E B 9 8 | 6 | Linjen spiller på fald med 10 kort. |

## Spil mod honnør (68)

| Rang | Hånd / bordet | Mål | Begrundelse |
| --- | --- | --- | --- |
| 16 | D 4 3 / B 2 | 1 | Der spilles mod knægten, som er det højeste kort, der er tilbage i hånden. |
| 18 | K 7 6 5 / B 4 3 2 | 3, 2, 1 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 22 | B 10 5 4 / 3 2 | 1 | Der spilles mod knægten, som er det højeste kort, der er tilbage i hånden. |
| 23 | E K 5 4 / B 3 2 | 3 | Der spilles mod knægten, som er det højeste kort, der er tilbage i hånden. |
| 25 | D B 5 4 / E 3 2 | 3 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 26 | K D 5 4 / B 3 2 | 3 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 28 | D B 7 6 5 / 4 3 2 | 3, 2, 1 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 35 | E 6 5 4 / D B 3 2 | 3 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 37 | D 4 3 / 10 2 | 1 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 47 | D 5 4 3 / 10 2 | 1 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 50 | B 5 4 3 / E K 2 | 3 | Der spilles mod knægten, som er det højeste kort, der er tilbage i hånden. |
| 53 | B 5 4 3 / E D 2 | 3 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 54 | K 5 4 3 / D B 2 | 3 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 57 | E D 4 3 / B 2 | 3 | Der spilles mod knægten, som er det højeste kort, der er tilbage i hånden. |
| 62 | E 10 5 4 / D 3 2 | 3, 2 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 63 | E B 5 4 / 10 3 2 | 3, 2 | Der spilles mod 10'eren, som er det højeste kort, der er tilbage i hånden. |
| 67 | D B 7 6 5 4 / 3 2 | 4, 3, 2 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 69 | D 9 4 / 3 2 | 1 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 70 | K D B 4 3 / 2 | 3 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 72 | E D 4 / 10 3 2 | 3, 2 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 73 | E 10 4 / D 3 2 | 2 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 79 | E B 4 3 / 10 2 | 2 | Der spilles mod 10'eren, som er det højeste kort, der er tilbage i hånden. |
| 92 | E 10 6 5 / D 4 3 2 | 3, 2 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 105 | E 10 6 5 4 / D 3 2 | 4, 3 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 106 | K D 10 6 5 / 4 3 2 | 4, 3, 2 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 117 | D 9 4 / B 3 2 | 1 | Der spilles mod knægten, som er det højeste kort, der er tilbage i hånden. |
| 124 | E 10 3 / D 2 | 2 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 138 | D B 10 3 / 2 | 2 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 145 | D B 9 5 / 4 3 2 | 2, 1 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 152 | K D 10 6 / 5 4 3 2 | 3, 2 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 156 | D 10 9 3 / 2 | 2, 1 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 173 | E K 9 4 / B 3 2 | 4, 3 | Der spilles mod knægten, som er det højeste kort, der er tilbage i hånden. |
| 178 | E D 4 3 / B 9 2 | 4, 3 | Der spilles mod knægten, som er det højeste kort, der er tilbage i hånden. |
| 179 | E 9 4 3 / D B 2 | 4, 3 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 183 | K D 4 3 / B 9 2 | 3 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 184 | K 9 4 3 / D B 2 | 3 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 188 | K 10 9 4 / D 3 2 | 3 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 189 | K 10 4 3 / D 9 2 | 3 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 202 | K D 10 / 3 2 | 2 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 213 | K D 9 5 4 / B 3 2 | 4, 3 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 228 | K D 6 5 4 3 / 10 2 | 5, 4, 3 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 242 | K D B 9 4 / 3 2 | 4 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 255 | E K 9 3 / B 2 | 3 | Der spilles mod knægten, som er det højeste kort, der er tilbage i hånden. |
| 257 | E D 9 3 / B 2 | 3 | Der spilles mod knægten, som er det højeste kort, der er tilbage i hånden. |
| 258 | K D 9 3 / B 2 | 3 | Der spilles mod knægten, som er det højeste kort, der er tilbage i hånden. |
| 259 | E 10 9 3 / D 2 | 3 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 264 | D B 9 / 3 2 | 1 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 270 | K B 9 / 4 3 2 | 2, 1 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 271 | D B 9 / 4 3 2 | 1 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 278 | K D 9 5 / B 4 3 2 | 3 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 288 | K D 7 6 5 4 / 10 3 2 | 5 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 303 | K D 5 4 3 / B 9 2 | 4, 3 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 306 | K 9 5 4 3 / D 10 2 | 4, 3 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 327 | E B 8 3 / 10 2 | 3, 2 | Der spilles mod 10'eren, som er det højeste kort, der er tilbage i hånden. |
| 344 | D 6 5 4 3 / B 9 2 | 3, 2 | Der spilles mod knægten, som er det højeste kort, der er tilbage i hånden. |
| 368 | K 9 6 5 4 / D 10 3 2 | 4 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 371 | K D 8 5 4 / B 3 2 | 4, 3 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 381 | K D B 9 / 3 2 | 3 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 391 | K D B 9 / 4 3 2 | 3 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 417 | B 9 8 3 / E K 2 | 4, 3 | Der spilles mod knægten, som er det højeste kort, der er tilbage i hånden. |
| 434 | K D 8 5 / B 4 3 2 | 3 | Der spilles mod knægten, som er det højeste kort, der er tilbage i hånden. |
| 457 | K D 9 4 3 / B 8 2 | 4 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 485 | K D 10 9 6 / 5 4 3 2 | 4 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 520 | K D B 9 / 5 4 3 2 | 3 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 522 | K D 10 9 / 5 4 3 2 | 3 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 537 | E 5 4 3 2 / D B 9 | 4, 3 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 549 | K D 9 7 4 / B 3 2 | 4 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 558 | K D B 9 8 / 3 2 | 4 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |

## Dobbelt kipning (112)

| Rang | Hånd / bordet | Mål | Begrundelse |
| --- | --- | --- | --- |
| 10 | K 5 4 / B 3 2 | 2, 1 | Der kippes mod knægten, og modpartens kort over den ligger i to huller. |
| 15 | K B 5 / 4 3 2 | 2, 1 | Der kippes mod knægten, og modpartens kort over den ligger i to huller. |
| 21 | D 10 5 4 / 3 2 | 2, 1 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 38 | K 10 4 / 3 2 | 1 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 39 | D 10 4 / 3 2 | 1 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 42 | D 10 5 / 4 3 2 | 1 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 44 | D 6 5 4 / 10 3 2 | 2, 1 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 59 | D 10 6 5 4 / 3 2 | 3, 2, 1 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 74 | E 4 3 / D 10 2 | 3, 2 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 78 | K D 4 3 / 10 2 | 2 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 87 | K 5 4 3 / B 10 2 | 2 | Der kippes mod knægten, og modpartens kort over den ligger i to huller. |
| 93 | E 6 5 4 / D 10 3 2 | 3, 2 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 99 | K B 8 7 6 / 5 4 3 2 | 4, 3, 2 | Der kippes mod knægten, og modpartens kort over den ligger i to huller. |
| 110 | D 10 7 6 5 / 4 3 2 | 3, 2, 1 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 112 | E D 5 4 3 / 10 2 | 4, 3, 2 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 116 | K 4 3 / B 9 2 | 2, 1 | Der kippes mod knægten, og modpartens kort over den ligger i to huller. |
| 119 | K 10 7 6 / 5 4 3 2 | 2, 1 | 10'eren spilles ud og løber, og modpartens kort over den ligger i to huller. |
| 120 | D 10 7 6 / 5 4 3 2 | 2, 1 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 125 | K 10 3 / D 2 | 2 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 143 | K 5 4 3 / B 9 2 | 2, 1 | Der kippes mod 9'eren, og modpartens kort over den ligger i to huller. |
| 146 | D 10 9 5 / 4 3 2 | 2, 1 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 157 | D B 9 3 / 2 | 2, 1 | Der kippes mod 9'eren, og modpartens kort over den ligger i to huller. |
| 162 | K 6 5 4 3 / B 10 2 | 4, 3, 2 | Der kippes mod knægten, og modpartens kort over den ligger i to huller. |
| 164 | E D 10 / 4 3 2 | 3, 2 | Små kort fra begge hænder kipper med 10'eren, og modpartens kort over den ligger i to huller. |
| 185 | E 10 9 4 / D 3 2 | 3 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 186 | E 10 4 3 / D 9 2 | 3 | Der kippes mod 9'eren, og modpartens kort over den ligger i to huller. |
| 190 | D 4 3 2 / E 10 | 2 | Små kort fra begge hænder kipper med 10'eren, og modpartens kort over den ligger i to huller. |
| 196 | E 10 5 4 / D 9 3 2 | 3 | Der kippes mod 9'eren, og modpartens kort over den ligger i to huller. |
| 200 | E D 10 / 3 2 | 3, 2 | Små kort fra begge hænder kipper med 10'eren, og modpartens kort over den ligger i to huller. |
| 201 | D 3 2 / E 10 | 2 | Små kort fra begge hænder kipper med 10'eren, og modpartens kort over den ligger i to huller. |
| 203 | K 3 2 / D 10 | 2 | Små kort fra begge hænder kipper med 10'eren, og modpartens kort over den ligger i to huller. |
| 215 | E D 9 6 5 / 4 3 2 | 4, 3, 2 | Der kippes mod 9'eren, og modpartens kort over den ligger i to huller. |
| 216 | E 10 9 5 4 / D 3 2 | 5, 4, 3 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 217 | E B 9 6 5 / 4 3 2 | 4, 3, 2 | Der kippes mod 9'eren, og modpartens kort over den ligger i to huller. |
| 221 | D 10 9 6 5 / 4 3 2 | 3, 2, 1 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 226 | E D 6 5 4 3 / 10 2 | 5, 4 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 231 | E 10 8 3 / 2 | 2 | 8'eren spilles ud og løber, og modpartens kort over den ligger i to huller. |
| 235 | E B 9 4 3 / K 2 | 5, 4, 3 | Der kippes mod 9'eren, og modpartens kort over den ligger i to huller. |
| 236 | K B 9 4 3 / E 2 | 5, 4, 3 | Der kippes mod 9'eren, og modpartens kort over den ligger i to huller. |
| 245 | E D 10 9 4 / 3 2 | 5, 4, 3 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 247 | K D 10 9 4 / 3 2 | 4, 3 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 263 | K B 9 / 3 2 | 2, 1 | Der kippes mod knægten, og modpartens kort over den ligger i to huller. |
| 279 | E 10 9 5 / D 4 3 2 | 3 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 304 | E D 10 9 5 / 4 3 2 | 4, 3 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 305 | E 9 5 4 3 / D 10 2 | 4, 3 | 9'eren spilles ud og løber, og modpartens kort over den ligger i to huller. |
| 308 | K 10 8 4 / B 3 2 | 3 | Der kippes mod 8'eren, og modpartens kort over den ligger i to huller. |
| 314 | E K B 9 4 3 / 2 | 6, 5, 4, 3 | Der kippes mod 9'eren, og modpartens kort over den ligger i to huller. |
| 315 | E D B 9 3 / 2 | 4, 3 | Der kippes mod 9'eren, og modpartens kort over den ligger i to huller. |
| 317 | K D B 9 3 / 2 | 4, 3 | Der kippes mod 9'eren, og modpartens kort over den ligger i to huller. |
| 320 | D 5 4 3 2 / E 10 | 4, 3, 2 | Små kort fra begge hænder kipper med 10'eren, og modpartens kort over den ligger i to huller. |
| 331 | K D 10 6 5 4 3 / 2 | 6, 5, 4 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 334 | E D 9 6 / 5 4 3 2 | 3, 2 | 9'eren spilles ud og løber, og modpartens kort over den ligger i to huller. |
| 350 | E 10 9 5 4 3 / D 2 | 5, 4 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 352 | K 10 8 7 6 5 / 4 3 2 | 5, 4, 3 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 354 | E K 9 / B 3 2 | 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 356 | E 10 9 / D 3 2 | 3, 2 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 372 | K 10 8 5 4 / B 3 2 | 4, 3, 2 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 375 | E K B 9 / 3 2 | 4, 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 376 | E B 3 2 / K 9 | 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 378 | E D 3 2 / B 9 | 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 382 | E D 10 9 / 3 2 | 4, 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 383 | D 9 3 2 / E 10 | 3 | Små kort fra begge hænder kipper med 10'eren, og modpartens kort over den ligger i to huller. |
| 384 | K D 10 9 / 3 2 | 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 386 | K B 10 9 / 3 2 | 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 392 | E D 10 9 / 4 3 2 | 4, 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 393 | E 4 3 2 / D 10 9 | 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 394 | D 4 3 2 / E 10 9 | 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 396 | K 4 3 2 / D 10 9 | 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 409 | K D 10 8 4 3 / 2 | 5, 4, 3, 2 | Der kippes mod 8'eren, og modpartens kort over den ligger i to huller. |
| 411 | E B 10 8 4 3 / 2 | 5, 4, 3, 2 | Der kippes mod 8'eren, og modpartens kort over den ligger i to huller. |
| 413 | E B 8 5 4 3 / 2 | 4, 3, 2 | 8'eren spilles ud og løber, og modpartens kort over den ligger i to huller. |
| 422 | K 9 8 / B 3 2 | 2, 1 | Knægten spilles ud og løber, og modpartens kort over den ligger i to huller. |
| 423 | E D 4 3 2 / B 9 | 4, 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 424 | D B 4 3 2 / E 9 | 4, 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 426 | K D 4 3 2 / B 9 | 4, 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 436 | K 10 8 5 / B 4 3 2 | 3, 2 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 448 | D 9 7 6 5 / B 4 3 2 | 3 | Der kippes mod 9'eren, og modpartens kort over den ligger i to huller. |
| 459 | D 10 9 4 3 / E 8 2 | 5, 4 | 10'eren spilles ud og løber, og modpartens kort over den ligger i to huller. |
| 460 | D 9 8 6 5 / 4 3 2 | 3, 2 | Der kippes mod 9'eren, og modpartens kort over den ligger i to huller. |
| 464 | K D 10 9 5 4 3 / 2 | 6, 5 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 470 | E 10 9 / D 2 | 3, 2 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 471 | D 10 9 / E 2 | 3, 2 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 487 | K B 9 7 6 / 5 4 3 2 | 4, 3, 2 | Der kippes mod knægten, og modpartens kort over den ligger i to huller. |
| 490 | E D B 9 / 2 | 4, 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 491 | K D B 9 / 2 | 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 492 | E D 10 9 / 2 | 4, 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 503 | K B 8 7 6 5 / 10 4 3 2 | 5 | 10'eren spilles ud og løber, og modpartens kort over den ligger i to huller. |
| 512 | D 6 5 4 3 2 / E 10 | 4, 3 | 10'eren spilles ud og løber, og modpartens kort over den ligger i to huller. |
| 521 | E D 10 9 / 5 4 3 2 | 4, 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 526 | E D B 9 8 3 / 2 | 6, 5, 4 | Der kippes mod 9'eren, og modpartens kort over den ligger i to huller. |
| 536 | E D 3 2 / B 9 8 | 4, 3 | Små kort fra begge hænder kipper med 8'eren, og modpartens kort over den ligger i to huller. |
| 539 | E 10 9 8 / D 3 2 | 4, 3 | Små kort fra begge hænder kipper med 8'eren, og modpartens kort over den ligger i to huller. |
| 540 | D 10 9 8 / E 3 2 | 4, 3 | 10'eren spilles ud og løber, og modpartens kort over den ligger i to huller. |
| 541 | E 5 4 3 2 / D 10 9 | 4, 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 542 | K 5 4 3 2 / D 10 9 | 4, 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 565 | E K 9 8 / B 2 | 4, 3 | Små kort fra begge hænder kipper med 8'eren, og modpartens kort over den ligger i to huller. |
| 571 | D 10 9 8 / E 2 | 3 | 10'eren spilles ud og løber, og modpartens kort over den ligger i to huller. |
| 572 | D 9 5 4 3 2 / E 10 | 5, 4 | 10'eren spilles ud og løber, og modpartens kort over den ligger i to huller. |
| 576 | E 10 9 6 5 4 3 / D 2 | 7, 6 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 584 | K 9 8 7 / B 3 2 | 3, 2 | Knægten spilles ud og løber, og modpartens kort over den ligger i to huller. |
| 590 | E 10 9 8 / D 4 3 2 | 4, 3 | Små kort fra begge hænder kipper med 8'eren, og modpartens kort over den ligger i to huller. |
| 591 | K 4 3 2 / D 10 9 8 | 3 | Små kort fra begge hænder kipper med 8'eren, og modpartens kort over den ligger i to huller. |
| 602 | E 9 4 3 2 / D 10 8 | 5, 4 | 10'eren spilles ud og løber, og modpartens kort over den ligger i to huller. |
| 603 | E D B 9 8 / 2 | 5, 4 | Små kort fra begge hænder kipper med 8'eren, og modpartens kort over den ligger i to huller. |
| 605 | E D 10 9 8 / 2 | 5, 4 | Små kort fra begge hænder kipper med 8'eren, og modpartens kort over den ligger i to huller. |
| 606 | K D 10 9 8 / 2 | 4 | Små kort fra begge hænder kipper med 8'eren, og modpartens kort over den ligger i to huller. |
| 617 | E K 9 8 7 3 / B 2 | 6, 5 | Der kippes mod 9'eren, og modpartens kort over den ligger i to huller. |
| 619 | E 10 9 8 5 4 3 / D 2 | 7, 6 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 629 | D 4 3 2 / E 10 8 7 | 4, 3, 2 | 10'eren spilles ud og løber, og modpartens kort over den ligger i to huller. |
| 636 | E 9 7 3 2 / D 10 8 | 5, 4 | 10'eren spilles ud og løber, og modpartens kort over den ligger i to huller. |
| 644 | K 5 4 3 2 / B 10 9 8 | 4 | Knægten spilles ud og løber, og modpartens kort over den ligger i to huller. |
| 645 | K 7 6 5 4 3 / B 10 9 2 | 5 | Knægten spilles ud og løber, og modpartens kort over den ligger i to huller. |

## Sikkerhedsspil (207)

| Rang | Hånd / bordet | Mål | Begrundelse |
| --- | --- | --- | --- |
| 1 | K 7 6 5 / 4 3 2 | 2, 1 | Til 1 stik giver den bedste linje 77,0 %, linjen med flest stik kun 69,0 %. |
| 2 | K 8 7 6 / 5 4 3 2 | 2, 1 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 3 | E D 6 5 / 4 3 2 | 3, 2 | Til 2 stik giver den bedste linje 77,0 %, linjen med flest stik kun 69,0 %. |
| 4 | D 5 4 3 / 2 | 1 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 5 | K 7 6 5 / D 4 3 2 | 3, 2 | Til 2 stik giver den bedste linje 73,5 %, linjen med flest stik kun 70,7 %. |
| 6 | D 8 7 6 / 5 4 3 2 | 2, 1 | Til 1 stik giver den bedste linje 83,9 %, linjen med flest stik kun 78,3 %. |
| 7 | E D 7 6 5 / 4 3 2 | 4, 3, 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 8 | D 8 7 6 5 / 4 3 2 | 3, 2, 1 | Til 2 stik giver den bedste linje 82,0 %, linjen med flest stik kun 76,3 %. |
| 9 | E D 5 / 4 3 2 | 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 11 | E D 7 6 / 5 4 3 2 | 3, 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 12 | K 9 8 7 6 5 / 4 3 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 71,8 %, linjen med flest stik kun 65,6 %. |
| 13 | K 6 5 4 / B 3 2 | 2, 1 | Til 1 stik giver den bedste linje 93,5 %, linjen med flest stik kun 85,9 %. |
| 14 | D 6 5 4 / B 3 2 | 2, 1 | Til 1 stik giver den bedste linje 87,1 %, linjen med flest stik kun 84,7 %. |
| 17 | E D 8 7 6 / 5 4 3 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 71,8 %, linjen med flest stik kun 65,6 %. |
| 19 | D 7 6 5 / B 4 3 2 | 2, 1 | Til 1 stik giver den bedste linje 100,0 %, linjen med flest stik kun 94,3 %. |
| 24 | E B 3 2 / K 5 4 | 4, 3 | Til 3 stik giver den bedste linje 77,0 %, linjen med flest stik kun 69,0 %. |
| 27 | E B 4 3 / 2 | 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 30 | E D 8 7 6 5 / 4 3 2 | 6, 5, 4 | Til 5 stik giver den bedste linje 71,8 %, linjen med flest stik kun 65,6 %. |
| 31 | K D 8 7 6 5 / 4 3 2 | 5, 4 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 32 | D 9 8 7 6 / 5 4 3 2 | 3, 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 34 | E D 6 5 / B 4 3 2 | 4, 3 | Til 3 stik giver den bedste linje 73,5 %, linjen med flest stik kun 70,7 %. |
| 41 | K 10 6 5 / 4 3 2 | 2, 1 | Til 1 stik giver den bedste linje 78,7 %, linjen med flest stik kun 75,4 %. |
| 43 | D 10 6 5 / 4 3 2 | 2, 1 | Til 1 stik giver den bedste linje 69,4 %, linjen med flest stik kun 67,8 %. |
| 49 | E K B 5 / 4 3 2 | 4, 3 | Til 3 stik giver den bedste linje 77,0 %, linjen med flest stik kun 69,0 %. |
| 52 | E D B 5 / 4 3 2 | 4, 3 | Til 3 stik giver den bedste linje 69,0 %, linjen med flest stik kun 67,8 %. |
| 55 | E K D 4 3 / 2 | 4 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 56 | E 10 4 3 / 2 | 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 61 | E D 5 4 / 10 3 2 | 3, 2 | Til 2 stik giver den bedste linje 93,5 %, linjen med flest stik kun 85,9 %. |
| 64 | K 10 5 4 / B 3 2 | 3, 2 | Til 2 stik giver den bedste linje 69,0 %, linjen med flest stik kun 67,8 %. |
| 66 | E D 5 4 3 / B 2 | 4, 3 | Til 3 stik giver den bedste linje 86,4 %, linjen med flest stik kun 85,2 %. |
| 68 | E 10 5 4 3 / 2 | 3 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 76 | D B 7 6 5 / E 4 3 2 | 5, 4 | Til 4 stik giver den bedste linje 95,2 %, linjen med flest stik kun 90,4 %. |
| 80 | E D B 6 / 5 4 3 2 | 4, 3 | Til 3 stik giver den bedste linje 86,7 %, linjen med flest stik kun 83,9 %. |
| 81 | E K 10 5 / 4 3 2 | 4, 3 | Til 3 stik giver den bedste linje 56,5 %, linjen med flest stik kun 52,4 %. |
| 82 | E D 10 5 / 4 3 2 | 4, 3, 2 | Til 3 stik giver den bedste linje 46,5 %, linjen med flest stik kun 45,3 %. |
| 83 | D 5 4 3 / E 10 2 | 3, 2 | Til 2 stik giver den bedste linje 93,5 %, linjen med flest stik kun 85,9 %. |
| 84 | K 5 4 3 / D 10 2 | 3, 2 | Til 2 stik giver den bedste linje 76,6 %, linjen med flest stik kun 75,4 %. |
| 85 | E B 10 5 / 4 3 2 | 3, 2 | Til 2 stik giver den bedste linje 84,7 %, linjen med flest stik kun 83,1 %. |
| 86 | B 5 4 3 / E 10 2 | 3, 2 | Til 2 stik giver den bedste linje 87,1 %, linjen med flest stik kun 84,7 %. |
| 94 | K 10 6 5 / D 4 3 2 | 3, 2 | Til 2 stik giver den bedste linje 89,6 %, linjen med flest stik kun 86,7 %. |
| 95 | E B 6 5 / 10 4 3 2 | 3, 2 | Til 2 stik giver den bedste linje 100,0 %, linjen med flest stik kun 94,3 %. |
| 98 | E 7 6 5 4 / D B 3 2 | 5, 4 | Til 4 stik giver den bedste linje 95,2 %, linjen med flest stik kun 90,4 %. |
| 103 | E D 10 6 5 / 4 3 2 | 5, 4, 3, 2 | Til 4 stik giver den bedste linje 65,6 %, linjen med flest stik kun 62,7 %. |
| 104 | E D 6 5 4 / 10 3 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 50,3 %, linjen med flest stik kun 47,5 %. |
| 108 | E B 6 5 4 / 10 3 2 | 4, 3 | Til 3 stik giver den bedste linje 96,1 %, linjen med flest stik kun 82,0 %. |
| 113 | K D 5 4 3 / 10 2 | 4, 3, 2 | Til 3 stik giver den bedste linje 61,4 %, linjen med flest stik kun 59,8 %. |
| 114 | K D 7 6 5 4 3 / 2 | 6, 5, 4 | Til 5 stik giver den bedste linje 73,5 %, linjen med flest stik kun 70,7 %. |
| 122 | E D 6 5 4 3 / B 2 | 5, 4 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 123 | D B 7 6 5 4 / E 3 2 | 6, 5 | Til 5 stik giver den bedste linje 95,2 %, linjen med flest stik kun 90,4 %. |
| 131 | D 7 6 5 4 / 10 3 2 | 3, 2, 1 | Til 1 stik giver den bedste linje 100,0 %, linjen med flest stik kun 98,0 %. |
| 132 | K D 10 6 5 4 / 3 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 87,6 %, linjen med flest stik kun 84,8 %. |
| 134 | E 10 9 5 4 / 3 2 | 3, 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 135 | D B 9 5 4 / 3 2 | 3, 2, 1 | Til 2 stik giver den bedste linje 80,3 %, linjen med flest stik kun 78,7 %. |
| 139 | B 10 9 4 3 / 2 | 2, 1 | Til 1 stik giver den bedste linje 86,9 %, linjen med flest stik kun 83,3 %. |
| 140 | K D 9 5 / 4 3 2 | 3, 2 | Til 2 stik giver den bedste linje 75,4 %, linjen med flest stik kun 72,6 %. |
| 141 | E D 9 5 / 4 3 2 | 3, 2 | Til 2 stik giver den bedste linje 78,7 %, linjen med flest stik kun 75,4 %. |
| 142 | E B 9 5 / 4 3 2 | 3, 2 | Til 2 stik giver den bedste linje 69,4 %, linjen med flest stik kun 67,8 %. |
| 150 | E K D 10 4 / 3 2 | 5, 4 | Til 4 stik giver den bedste linje 93,2 %, linjen med flest stik kun 87,1 %. |
| 155 | E 10 9 3 / 2 | 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 159 | E 6 5 4 3 / D 10 2 | 4, 3, 2 | Til 3 stik giver den bedste linje 89,6 %, linjen med flest stik kun 87,6 %. |
| 160 | D 6 5 4 3 / E 10 2 | 4, 3 | Til 3 stik giver den bedste linje 96,1 %, linjen med flest stik kun 93,3 %. |
| 161 | K 6 5 4 3 / D 10 2 | 4, 3, 2 | Til 3 stik giver den bedste linje 87,6 %, linjen med flest stik kun 84,8 %. |
| 163 | D B 5 4 3 / 9 2 | 3, 2, 1 | Til 2 stik giver den bedste linje 74,3 %, linjen med flest stik kun 72,7 %. |
| 167 | E D 7 6 5 / 10 4 3 2 | 5, 4 | Til 4 stik giver den bedste linje 78,0 %, linjen med flest stik kun 71,8 %. |
| 174 | E K 4 3 / B 9 2 | 4, 3 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 175 | E B 9 4 / K 3 2 | 4, 3 | Til 3 stik giver den bedste linje 84,7 %, linjen med flest stik kun 78,3 %. |
| 176 | K 9 4 3 / E B 2 | 4, 3 | Til 3 stik giver den bedste linje 83,9 %, linjen med flest stik kun 82,6 %. |
| 177 | E D 9 4 / B 3 2 | 4, 3 | Til 3 stik giver den bedste linje 71,8 %, linjen med flest stik kun 68,3 %. |
| 180 | B 9 4 3 / E D 2 | 4, 3 | Til 3 stik giver den bedste linje 68,6 %, linjen med flest stik kun 67,4 %. |
| 181 | E K 9 4 / 10 3 2 | 4, 3 | Til 3 stik giver den bedste linje 71,8 %, linjen med flest stik kun 69,4 %. |
| 192 | E B 5 4 / K 9 3 2 | 4, 3 | Til 3 stik giver den bedste linje 100,0 %, linjen med flest stik kun 97,2 %. |
| 193 | E D 5 4 / B 9 3 2 | 4, 3 | Til 3 stik giver den bedste linje 89,6 %, linjen med flest stik kun 86,7 %. |
| 194 | D B 5 4 / E 9 3 2 | 4, 3 | Til 3 stik giver den bedste linje 97,2 %, linjen med flest stik kun 86,7 %. |
| 197 | K 6 5 4 / B 9 3 2 | 3, 2, 1 | Til 1 stik giver den bedste linje 100,0 %, linjen med flest stik kun 97,2 %. |
| 206 | E K B 10 4 3 / 2 | 6, 5, 4 | Til 5 stik giver den bedste linje 86,4 %, linjen med flest stik kun 85,2 %. |
| 207 | E K 9 5 4 / B 3 2 | 5, 4 | Til 4 stik giver den bedste linje 96,1 %, linjen med flest stik kun 79,1 %. |
| 210 | D B 9 5 4 / E 3 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 87,6 %, linjen med flest stik kun 84,8 %. |
| 211 | E K 9 5 4 / 10 3 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 87,6 %, linjen med flest stik kun 82,0 %. |
| 214 | E D 9 5 4 / 10 3 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 71,2 %, linjen med flest stik kun 68,4 %. |
| 227 | E D 10 7 6 5 / 4 3 2 | 6, 5, 4 | Til 5 stik giver den bedste linje 82,8 %, linjen med flest stik kun 76,6 %. |
| 232 | E K D 9 4 / 3 2 | 5, 4 | Til 4 stik giver den bedste linje 89,6 %, linjen med flest stik kun 84,0 %. |
| 233 | E K 9 4 3 / D 2 | 5, 4 | Til 4 stik giver den bedste linje 86,4 %, linjen med flest stik kun 84,0 %. |
| 234 | E K 9 4 3 / B 2 | 5, 4, 3 | Til 3 stik giver den bedste linje 98,8 %, linjen med flest stik kun 93,9 %. |
| 237 | E D B 9 4 / 3 2 | 5, 4, 3 | Til 3 stik giver den bedste linje 94,4 %, linjen med flest stik kun 93,2 %. |
| 238 | E D 9 4 3 / B 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 58,1 %, linjen med flest stik kun 54,9 %. |
| 239 | D B 9 4 3 / E 2 | 4, 3 | Til 3 stik giver den bedste linje 94,4 %, linjen med flest stik kun 89,6 %. |
| 241 | E 10 9 4 3 / K 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 64,6 %, linjen med flest stik kun 61,4 %. |
| 243 | K D B 4 3 / 9 2 | 4, 3 | Til 3 stik giver den bedste linje 93,2 %, linjen med flest stik kun 87,6 %. |
| 244 | K D 9 4 3 / B 2 | 4, 3 | Til 3 stik giver den bedste linje 93,2 %, linjen med flest stik kun 88,4 %. |
| 246 | E 10 9 4 3 / D 2 | 4, 3 | Til 3 stik giver den bedste linje 88,8 %, linjen med flest stik kun 86,4 %. |
| 251 | E D 10 7 6 / 5 4 3 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 82,8 %, linjen med flest stik kun 76,6 %. |
| 252 | E 7 6 5 4 3 / D B 2 | 6, 5 | Til 5 stik giver den bedste linje 95,2 %, linjen med flest stik kun 90,4 %. |
| 261 | E D 9 / 3 2 | 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 262 | E B 9 / 3 2 | 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 265 | K 10 9 / 3 2 | 1 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 266 | D 10 9 / 3 2 | 1 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 268 | E D 9 / 4 3 2 | 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 269 | E B 9 / 4 3 2 | 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 272 | K 10 9 / 4 3 2 | 1 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 273 | D 10 9 / 4 3 2 | 1 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 275 | E K 9 5 / B 4 3 2 | 4, 3 | Til 3 stik giver den bedste linje 100,0 %, linjen med flest stik kun 91,5 %. |
| 277 | D B 9 5 / E 4 3 2 | 4, 3 | Til 3 stik giver den bedste linje 89,6 %, linjen med flest stik kun 86,7 %. |
| 280 | E 5 4 3 / D 10 9 2 | 4, 3 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 285 | E D 7 6 5 4 / 10 3 2 | 6, 5 | Til 5 stik giver den bedste linje 78,0 %, linjen med flest stik kun 71,8 %. |
| 287 | K D 10 9 5 4 / 3 2 | 5, 4 | Til 4 stik giver den bedste linje 98,0 %, linjen med flest stik kun 96,1 %. |
| 292 | D 4 3 2 / B 9 | 1 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 294 | E K 5 4 3 / B 9 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 87,6 %, linjen med flest stik kun 76,3 %. |
| 295 | E B 5 4 3 / K 9 2 | 5, 4 | Til 4 stik giver den bedste linje 96,1 %, linjen med flest stik kun 87,6 %. |
| 296 | E 9 5 4 3 / K B 2 | 5, 4 | Til 4 stik giver den bedste linje 96,1 %, linjen med flest stik kun 93,3 %. |
| 298 | E D 5 4 3 / B 9 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 79,1 %, linjen med flest stik kun 76,3 %. |
| 299 | E 9 5 4 3 / D B 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 93,3 %, linjen med flest stik kun 84,8 %. |
| 300 | B 9 5 4 3 / E D 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 87,6 %, linjen med flest stik kun 84,8 %. |
| 302 | E 10 5 4 3 / K 9 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 90,4 %, linjen med flest stik kun 87,6 %. |
| 307 | E B 8 4 / 10 3 2 | 3, 2 | Til 2 stik giver den bedste linje 90,3 %, linjen med flest stik kun 88,3 %. |
| 312 | E K D 9 3 / 2 | 5, 4 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 316 | E D B 9 4 3 / 2 | 6, 5, 4, 3 | Til 4 stik giver den bedste linje 92,5 %, linjen med flest stik kun 87,6 %. |
| 318 | K D B 9 4 3 / 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 92,5 %, linjen med flest stik kun 87,6 %. |
| 319 | E D 10 9 4 3 / 2 | 6, 5, 4, 3 | Til 4 stik giver den bedste linje 88,8 %, linjen med flest stik kun 87,6 %. |
| 321 | K D 10 9 4 3 / 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 87,6 %, linjen med flest stik kun 86,4 %. |
| 323 | E B 10 9 4 3 / 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 88,8 %, linjen med flest stik kun 86,4 %. |
| 330 | E K D 10 5 4 3 / 2 | 7, 6 | Til 6 stik giver den bedste linje 98,0 %, linjen med flest stik kun 96,1 %. |
| 337 | K D 9 8 4 / 3 2 | 4, 3, 2 | Til 2 stik giver den bedste linje 95,6 %, linjen med flest stik kun 94,4 %. |
| 345 | E K 9 5 4 3 / B 2 | 6, 5, 4 | Til 4 stik giver den bedste linje 100,0 %, linjen med flest stik kun 98,0 %. |
| 347 | D B 9 5 4 3 / E 2 | 6, 5, 4 | Til 5 stik giver den bedste linje 79,1 %, linjen med flest stik kun 76,3 %. |
| 349 | K D B 5 4 3 / 9 2 | 5, 4 | Til 4 stik giver den bedste linje 98,0 %, linjen med flest stik kun 96,1 %. |
| 362 | E 9 6 5 4 / D B 3 2 | 5, 4 | Til 4 stik giver den bedste linje 100,0 %, linjen med flest stik kun 95,2 %. |
| 369 | E D 8 5 4 / B 3 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 79,1 %, linjen med flest stik kun 76,3 %. |
| 373 | K 9 8 5 4 / B 3 2 | 4, 3, 2 | Til 3 stik giver den bedste linje 83,7 %, linjen med flest stik kun 80,8 %. |
| 390 | E K B 9 / 4 3 2 | 4, 3 | Til 3 stik giver den bedste linje 84,7 %, linjen med flest stik kun 78,3 %. |
| 400 | E B 10 9 3 / K 2 | 5 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 408 | D 10 9 6 5 4 / E 3 2 | 6, 5 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 410 | K D 9 8 4 3 / 2 | 5, 4, 3, 2 | Til 3 stik giver den bedste linje 92,5 %, linjen med flest stik kun 90,0 %. |
| 418 | E 9 8 3 / D B 2 | 4, 3 | Til 3 stik giver den bedste linje 82,6 %, linjen med flest stik kun 79,0 %. |
| 419 | B 9 8 3 / E D 2 | 4, 3 | Til 3 stik giver den bedste linje 77,8 %, linjen med flest stik kun 76,2 %. |
| 428 | E K 8 5 / B 4 3 2 | 4, 3 | Til 3 stik giver den bedste linje 92,4 %, linjen med flest stik kun 86,7 %. |
| 429 | E K 4 3 / B 9 8 2 | 4, 3 | Til 3 stik giver den bedste linje 100,0 %, linjen med flest stik kun 91,5 %. |
| 430 | E D 8 5 / B 4 3 2 | 4, 3 | Til 3 stik giver den bedste linje 81,1 %, linjen med flest stik kun 76,3 %. |
| 437 | K 5 4 3 / B 10 8 2 | 3, 2 | Til 2 stik giver den bedste linje 92,4 %, linjen med flest stik kun 83,9 %. |
| 439 | E D 10 8 / 3 2 | 4, 3, 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 440 | E D 9 8 / 3 2 | 3, 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 441 | K D 9 8 / 3 2 | 3 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 444 | E B 9 8 / 3 2 | 3, 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 445 | E 10 9 8 / 3 2 | 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 447 | D B 9 8 / 3 2 | 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 449 | K 10 9 8 / 3 2 | 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 450 | D 10 9 8 / 3 2 | 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 451 | E 7 6 5 4 3 / D 10 2 | 6, 5, 4 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 454 | E K 9 8 4 / B 3 2 | 5, 4 | Til 4 stik giver den bedste linje 96,1 %, linjen med flest stik kun 89,6 %. |
| 455 | B 9 8 4 3 / E K 2 | 5, 4 | Til 4 stik giver den bedste linje 96,1 %, linjen med flest stik kun 87,6 %. |
| 458 | E D 10 8 5 / 4 3 2 | 5, 4, 3, 2 | Til 4 stik giver den bedste linje 65,6 %, linjen med flest stik kun 62,7 %. |
| 461 | E D B 9 5 4 3 / 2 | 7, 6, 5 | Til 6 stik giver den bedste linje 79,1 %, linjen med flest stik kun 76,3 %. |
| 462 | K D B 9 5 4 3 / 2 | 6, 5 | Til 5 stik giver den bedste linje 98,0 %, linjen med flest stik kun 96,1 %. |
| 468 | E K 9 8 3 / B 2 | 5, 4 | Til 4 stik giver den bedste linje 72,7 %, linjen med flest stik kun 70,2 %. |
| 469 | E D 9 8 3 / B 2 | 5, 4 | Til 4 stik giver den bedste linje 71,5 %, linjen med flest stik kun 70,2 %. |
| 484 | E 6 5 4 3 / D 10 9 2 | 5, 4 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 494 | E D 10 8 / 4 3 2 | 4, 3, 2 | Til 3 stik giver den bedste linje 53,0 %, linjen med flest stik kun 50,9 %. |
| 495 | E D 9 8 / 4 3 2 | 3, 2 | Til 2 stik giver den bedste linje 90,8 %, linjen med flest stik kun 89,2 %. |
| 497 | E B 9 8 / 4 3 2 | 3, 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 498 | K B 9 8 / 4 3 2 | 3, 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 499 | K 10 9 8 / 4 3 2 | 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 504 | E K 9 8 4 3 / B 2 | 6, 5 | Til 5 stik giver den bedste linje 87,6 %, linjen med flest stik kun 84,8 %. |
| 513 | E 10 9 8 / 2 | 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 514 | D B 9 8 / 2 | 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 515 | D B 10 8 / 2 | 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 516 | D 10 9 8 / 2 | 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 524 | E D 7 6 5 4 3 / 10 2 | 7, 6, 5 | Til 6 stik giver den bedste linje 78,0 %, linjen med flest stik kun 71,8 %. |
| 532 | E K 9 8 / B 3 2 | 4, 3 | Til 3 stik giver den bedste linje 83,9 %, linjen med flest stik kun 78,3 %. |
| 533 | E K 3 2 / B 9 8 | 4, 3 | Til 3 stik giver den bedste linje 78,3 %, linjen med flest stik kun 77,0 %. |
| 535 | E D 9 8 / B 3 2 | 4, 3 | Til 3 stik giver den bedste linje 79,0 %, linjen med flest stik kun 77,6 %. |
| 544 | D B 8 7 / 2 | 2, 1 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 545 | D 10 8 7 / 2 | 2, 1 | Til 1 stik giver den bedste linje 15,1 %, linjen med flest stik kun 14,3 %. |
| 548 | E D 7 5 4 / B 3 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 76,3 %, linjen med flest stik kun 70,7 %. |
| 556 | E K B 9 8 / 3 2 | 5, 4 | Til 4 stik giver den bedste linje 77,0 %, linjen med flest stik kun 75,8 %. |
| 559 | K D 9 3 2 / B 8 | 4, 3 | Til 3 stik giver den bedste linje 100,0 %, linjen med flest stik kun 95,2 %. |
| 560 | E K 8 6 5 / B 4 3 2 | 5, 4 | Til 4 stik giver den bedste linje 100,0 %, linjen med flest stik kun 95,2 %. |
| 562 | E K 8 6 5 / 10 4 3 2 | 5, 4 | Til 4 stik giver den bedste linje 95,2 %, linjen med flest stik kun 90,4 %. |
| 568 | E D 5 4 3 2 / B 9 | 5, 4 | Til 4 stik giver den bedste linje 98,0 %, linjen med flest stik kun 96,1 %. |
| 570 | K D 5 4 3 2 / B 9 | 5, 4 | Til 4 stik giver den bedste linje 98,0 %, linjen med flest stik kun 96,1 %. |
| 573 | E B 10 8 5 4 3 / 2 | 6, 5, 4 | Til 5 stik giver den bedste linje 87,6 %, linjen med flest stik kun 84,8 %. |
| 574 | E 10 9 8 5 4 3 / 2 | 5, 4 | Til 4 stik giver den bedste linje 98,0 %, linjen med flest stik kun 96,1 %. |
| 575 | E D 9 6 5 4 3 / B 2 | 7, 6 | Til 6 stik giver den bedste linje 95,2 %, linjen med flest stik kun 90,4 %. |
| 577 | D 10 9 6 5 4 3 / E 2 | 7, 6 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 585 | K 9 8 7 / 4 3 2 | 2, 1 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 586 | D 9 8 7 / 4 3 2 | 2, 1 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 588 | E D 9 8 / B 4 3 2 | 4, 3 | Til 3 stik giver den bedste linje 97,2 %, linjen med flest stik kun 89,6 %. |
| 594 | E K 8 6 5 4 / B 3 2 | 6, 5 | Til 5 stik giver den bedste linje 100,0 %, linjen med flest stik kun 95,2 %. |
| 597 | E K 8 6 5 4 / 10 3 2 | 6, 5 | Til 5 stik giver den bedste linje 95,2 %, linjen med flest stik kun 90,4 %. |
| 600 | E K 4 3 2 / B 9 8 | 5, 4, 3 | Til 4 stik giver den bedste linje 87,6 %, linjen med flest stik kun 76,3 %. |
| 610 | E 10 9 7 6 / D 5 4 3 2 | 5, 4 | Til 4 stik giver den bedste linje 100,0 %, linjen med flest stik kun 89,0 %. |
| 611 | E D 10 8 / 5 4 3 2 | 4, 3, 2 | Til 3 stik giver den bedste linje 67,5 %, linjen med flest stik kun 64,7 %. |
| 612 | K B 9 8 / 5 4 3 2 | 3, 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 613 | E 10 9 8 / 5 4 3 2 | 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 614 | K 10 9 8 / 5 4 3 2 | 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 616 | K 9 8 7 6 / 5 4 3 2 | 4, 3, 2 | Til 3 stik giver den bedste linje 71,8 %, linjen med flest stik kun 65,6 %. |
| 623 | E D 6 4 3 / B 9 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 82,0 %, linjen med flest stik kun 76,3 %. |
| 624 | B 9 8 7 / E D 2 | 4, 3 | Til 3 stik giver den bedste linje 77,8 %, linjen med flest stik kun 77,0 %. |
| 625 | 10 9 8 7 / E D 2 | 4, 3 | Til 3 stik giver den bedste linje 61,9 %, linjen med flest stik kun 60,7 %. |
| 631 | K 9 8 7 / B 4 3 2 | 3, 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 634 | E K 7 3 2 / B 9 8 | 5, 4 | Til 4 stik giver den bedste linje 97,2 %, linjen med flest stik kun 89,6 %. |
| 637 | D B 9 8 7 / E 2 | 5, 4 | Til 4 stik giver den bedste linje 63,0 %, linjen med flest stik kun 61,8 %. |
| 638 | K 9 8 7 5 / B 4 3 2 | 4, 3 | Til 3 stik giver den bedste linje 93,8 %, linjen med flest stik kun 89,0 %. |
| 641 | E 6 5 4 3 2 / D 10 9 | 6, 5, 4 | Til 5 stik giver den bedste linje 78,0 %, linjen med flest stik kun 75,4 %. |
| 646 | D 7 6 5 4 3 2 / E 10 | 6, 5 | Til 5 stik giver den bedste linje 100,0 %, linjen med flest stik kun 95,2 %. |
| 647 | E K 5 4 3 2 / B 9 8 | 6, 5 | Til 5 stik giver den bedste linje 100,0 %, linjen med flest stik kun 95,2 %. |
| 650 | E B 4 3 2 / K 9 8 7 | 5, 4 | Til 4 stik giver den bedste linje 100,0 %, linjen med flest stik kun 95,2 %. |
| 651 | 9 8 7 6 4 3 / E K 2 | 6, 5 | Til 5 stik giver den bedste linje 95,2 %, linjen med flest stik kun 90,4 %. |
| 653 | B 7 4 3 2 / E D 6 | 5, 4, 3 | Til 4 stik giver den bedste linje 76,3 %, linjen med flest stik kun 70,7 %. |

## Begrænset valg (79)

| Rang | Hånd / bordet | Mål | Begrundelse |
| --- | --- | --- | --- |
| 36 | B 8 7 6 / 5 4 3 2 | 1 | Falder esset i første runde, er kipning bedst (100,0 % mod 61,5 %). |
| 45 | B 10 6 5 / 4 3 2 | 1 | Falder esset i første runde, er kipning bedst (65,1 % mod 48,4 %). |
| 46 | B 6 5 4 / 10 3 2 | 1 | Falder esset i første runde, er kipning bedst (100,0 % mod 64,6 %). |
| 71 | D B 10 5 4 / 3 2 | 3, 2 | Falder esset i første runde, er kipning bedst (56,8 % mod 39,0 %). |
| 88 | D B 10 5 / 4 3 2 | 2 | Falder esset i første runde, er kipning bedst (77,8 % mod 39,0 %). |
| 100 | D B 8 7 6 / 5 4 3 2 | 3, 2 | Falder esset i første runde, er kipning bedst (100,0 % mod 35,3 %). |
| 101 | D 8 7 6 5 / B 4 3 2 | 3 | Falder esset i første runde, er kipning bedst (78,8 % mod 57,7 %). |
| 107 | E B 10 6 5 / 4 3 2 | 4, 3, 2 | Falder kongen i første runde, er kipning bedst (59,5 % mod 34,7 %). |
| 109 | D B 10 6 5 / 4 3 2 | 3, 2 | Falder esset i første runde, er kipning bedst (87,6 % mod 79,3 %). |
| 118 | D 9 6 5 / 4 3 2 | 2, 1 | Falder knægten i første runde, er kipning bedst (45,4 % mod 37,0 %). |
| 121 | B 10 7 6 / 5 4 3 2 | 1 | Falder esset i første runde, er kipning bedst (91,7 % mod 79,3 %). |
| 126 | E B 9 4 / 3 2 | 3, 2 | Falder kongen i første runde, er kipning bedst (66,2 % mod 30,7 %). |
| 128 | D 10 9 4 / 3 2 | 2, 1 | Falder esset i første runde, er kipning bedst (100,0 % mod 43,4 %). |
| 129 | B 10 9 4 / 3 2 | 1 | Falder esset i første runde, er kipning bedst (73,3 % mod 26,4 %). |
| 133 | D B 10 6 5 4 / 3 2 | 4, 3 | Falder esset i første runde, er kipning bedst (79,3 % mod 34,7 %). |
| 147 | D 5 4 3 / B 9 2 | 2, 1 | Falder esset i første runde, er kipning bedst (50,9 % mod 46,3 %). |
| 148 | K 10 9 5 / 4 3 2 | 2, 1 | Falder damen i første runde, er kipning bedst (100,0 % mod 35,5 %). |
| 149 | D 5 4 3 / 10 9 2 | 2, 1 | Falder esset i første runde, er kipning bedst (100,0 % mod 65,0 %). |
| 170 | D B 8 4 / 3 2 | 2, 1 | Falder esset i første runde, er kipning bedst (71,7 % mod 37,3 %). |
| 171 | D 10 8 4 / 3 2 | 2, 1 | Falder esset i første runde, er kipning bedst (73,6 % mod 27,8 %). |
| 172 | B 10 8 4 / 3 2 | 1 | Falder esset i første runde, er kipning bedst (90,9 % mod 50,0 %). |
| 198 | D 9 6 5 / B 4 3 2 | 2, 1 | Falder esset i første runde, er kipning bedst (55,8 % mod 28,8 %). |
| 212 | E 10 9 5 4 / K 3 2 | 5, 4, 3 | Falder damen i første runde, er kipning bedst (62,5 % mod 37,5 %). |
| 218 | B 10 9 5 4 / E 3 2 | 4, 3 | Falder kongen i første runde, er kipning bedst (87,6 % mod 79,3 %). |
| 219 | E 10 6 5 4 / 9 3 2 | 3, 2 | Falder kongen i første runde, er kipning bedst (100,0 % mod 61,5 %). |
| 220 | D B 9 6 5 / 4 3 2 | 3, 2 | Falder esset i første runde, er kipning bedst (73,1 % mod 28,8 %). |
| 222 | D 10 9 5 4 / B 3 2 | 3 | Falder esset i første runde, er kipning bedst (100,0 % mod 34,7 %). |
| 223 | K 10 9 6 5 / 4 3 2 | 3, 2 | Falder damen i første runde, er kipning bedst (78,8 % mod 28,8 %). |
| 224 | K 10 6 5 4 / 9 3 2 | 3, 2 | Falder damen i første runde, er kipning bedst (100,0 % mod 90,4 %). |
| 229 | E B 6 5 4 3 / 10 2 | 5, 4 | Falder kongen i første runde, er kipning bedst (91,7 % mod 79,3 %). |
| 230 | E B 10 7 6 5 / 4 3 2 | 5, 4 | Falder kongen i første runde, er kipning bedst (67,3 % mod 57,7 %). |
| 240 | E K 10 9 4 / 3 2 | 5, 4, 3 | Falder damen i første runde, er kipning bedst (64,7 % mod 59,0 %). |
| 248 | E B 10 9 4 / 3 2 | 4, 3 | Falder kongen i første runde, er kipning bedst (47,0 % mod 20,0 %). |
| 283 | E K 10 9 5 4 / 3 2 | 6, 5, 4 | Falder damen i første runde, er kipning bedst (100,0 % mod 37,5 %). |
| 289 | E B 9 6 5 4 / 3 2 | 5, 4, 3 | Falder kongen i første runde, er kipning bedst (100,0 % mod 80,8 %). |
| 291 | D B 9 6 5 4 / 3 2 | 4, 3, 2 | Falder esset i første runde, er kipning bedst (69,2 % mod 28,8 %). |
| 309 | D 9 8 5 / 4 3 2 | 2, 1 | Falder knægten i første runde, er kipning bedst (68,4 % mod 53,3 %). |
| 310 | B 10 8 5 / 4 3 2 | 1 | Falder esset i første runde, er kipning bedst (68,1 % mod 48,6 %). |
| 328 | E 9 8 3 / 10 2 | 2 | Falder kongen i første runde, er kipning bedst (40,2 % mod 26,4 %). |
| 329 | K 8 7 6 5 / 10 4 3 2 | 4, 3 | Falder damen i første runde, er kipning bedst (100,0 % mod 35,3 %). |
| 336 | E D 9 8 4 / 3 2 | 4, 3, 2 | Falder knægten i første runde, er kipning bedst (81,7 % mod 69,9 %). |
| 338 | E B 10 8 4 / 3 2 | 4, 3, 2 | Falder kongen i første runde, er kipning bedst (93,0 % mod 50,9 %). |
| 339 | E B 9 8 4 / 3 2 | 4, 3, 2 | Falder kongen i første runde, er kipning bedst (93,0 % mod 65,0 %). |
| 340 | E B 8 4 3 / 10 2 | 4, 3, 2 | Falder kongen i første runde, er kipning bedst (69,9 % mod 58,1 %). |
| 341 | E B 8 4 3 / 9 2 | 4, 3, 2 | Falder kongen i første runde, er kipning bedst (93,0 % mod 65,0 %). |
| 342 | E 10 9 8 4 / 3 2 | 3 | Falder kongen i første runde, er kipning bedst (78,7 % mod 66,6 %). |
| 348 | E 10 9 5 4 3 / K 2 | 6, 5, 4 | Falder damen i første runde, er kipning bedst (100,0 % mod 37,5 %). |
| 351 | E B 10 5 4 3 / 9 2 | 5, 4 | Falder kongen i første runde, er kipning bedst (100,0 % mod 79,3 %). |
| 353 | E 10 5 4 / K 8 3 2 | 4, 3 | Falder damen i første runde, er kipning bedst (100,0 % mod 37,5 %). |
| 365 | E 10 6 5 4 / K 9 3 2 | 5, 4 | Falder damen i første runde, er kipning bedst (64,7 % mod 35,3 %). |
| 370 | E K 8 5 4 / 10 3 2 | 5, 4, 3 | Falder damen i første runde, er kipning bedst (100,0 % mod 37,5 %). |
| 406 | E K 10 9 6 5 / 4 3 2 | 6, 5 | Falder damen i første runde, er kipning bedst (64,7 % mod 35,3 %). |
| 414 | E 9 6 5 4 3 / B 2 | 5, 4, 3 | Falder kongen i første runde, er kipning bedst (100,0 % mod 70,6 %). |
| 433 | E K 8 5 / 10 4 3 2 | 4, 3 | Falder damen i første runde, er kipning bedst (100,0 % mod 37,5 %). |
| 435 | E B 8 5 / 10 4 3 2 | 3, 2 | Falder kongen i første runde, er kipning bedst (55,8 % mod 28,8 %). |
| 438 | E 10 9 8 5 4 / 3 2 | 4, 3 | Falder kongen i første runde, er kipning bedst (91,7 % mod 79,3 %). |
| 442 | K 9 7 6 5 / D 4 3 2 | 4, 3 | Falder knægten i første runde, er kipning bedst (64,7 % mod 35,3 %). |
| 443 | E 9 7 6 5 / B 4 3 2 | 4 | Falder kongen i første runde, er kipning bedst (100,0 % mod 35,3 %). |
| 453 | K 8 7 6 5 4 / 10 3 2 | 5, 4, 3 | Falder damen i første runde, er kipning bedst (100,0 % mod 35,3 %). |
| 456 | E 10 5 4 3 / K 8 2 | 5, 4, 3 | Falder damen i første runde, er kipning bedst (100,0 % mod 37,5 %). |
| 466 | D 8 7 6 5 4 3 / B 2 | 5 | Falder esset i første runde, er kipning bedst (100,0 % mod 35,3 %). |
| 477 | E B 9 7 6 5 / 4 3 2 | 5, 4 | Falder kongen i første runde, er kipning bedst (64,7 % mod 35,3 %). |
| 478 | K 10 9 7 6 5 / 4 3 2 | 5, 4, 3 | Falder damen i første runde, er kipning bedst (100,0 % mod 35,3 %). |
| 480 | E B 10 9 6 5 4 / 3 2 | 6 | Falder kongen i første runde, er kipning bedst (67,3 % mod 57,7 %). |
| 483 | E K 10 9 6 / 5 4 3 2 | 5, 4 | Falder damen i første runde, er kipning bedst (64,7 % mod 35,3 %). |
| 486 | E B 9 7 6 / 5 4 3 2 | 4, 3 | Falder kongen i første runde, er kipning bedst (64,7 % mod 35,3 %). |
| 488 | D 10 9 7 6 / 5 4 3 2 | 3 | Falder esset i første runde, er kipning bedst (100,0 % mod 68,6 %). |
| 496 | K D 9 8 / 4 3 2 | 3, 2 | Falder knægten i første runde, er kipning bedst (85,0 % mod 70,1 %). |
| 527 | E 10 6 5 4 3 / K 9 2 | 6, 5 | Falder damen i første runde, er kipning bedst (64,7 % mod 35,3 %). |
| 529 | E 9 7 6 5 4 / B 3 2 | 5, 4 | Falder kongen i første runde, er kipning bedst (100,0 % mod 35,3 %). |
| 543 | E 5 4 3 2 / B 10 9 | 4, 3 | Falder kongen i første runde, er kipning bedst (100,0 % mod 61,5 %). |
| 550 | E B 8 7 4 / 10 3 2 | 4, 3 | Falder kongen i første runde, er kipning bedst (55,8 % mod 28,8 %). |
| 551 | E 9 8 7 4 / B 3 2 | 4, 3 | Falder kongen i første runde, er kipning bedst (23,1 % mod 11,5 %). |
| 552 | E 8 7 5 4 / 10 3 2 | 3, 2 | Falder kongen i første runde, er kipning bedst (100,0 % mod 87,8 %). |
| 564 | D B 8 6 5 / 10 4 3 2 | 3 | Falder esset i første runde, er kipning bedst (100,0 % mod 52,2 %). |
| 578 | E B 9 7 6 5 4 / 3 2 | 6, 5 | Falder kongen i første runde, er kipning bedst (100,0 % mod 35,3 %). |
| 580 | D B 9 7 6 5 4 / 3 2 | 5, 4 | Falder esset i første runde, er kipning bedst (100,0 % mod 68,6 %). |
| 630 | E 9 8 7 / B 4 3 2 | 3, 2 | Falder kongen i første runde, er kipning bedst (23,1 % mod 11,5 %). |
| 632 | D 9 8 7 / B 4 3 2 | 2 | Falder esset i første runde, er kipning bedst (100,0 % mod 37,5 %). |
