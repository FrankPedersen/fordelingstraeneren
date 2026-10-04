# Teknik pr. kombination

Genereret af `scripts/solve.ts` til godkendelse (åbent punkt i specen: "Teknik pr. case"). Hver kombination får én teknik, og teknikken er rummet i paladset. Reglerne står i `src/farvebehandling/techniques.ts`:

0. **Begrænset valg:** i første runde af den bedste linje falder én af to eller flere ligeværdige honnører hos modparten (i mindst 5 % af spillene), og så er kipning klart bedst.
1. **Sikkerhedsspil:** til et lavere mål giver linjen med flest stik i gennemsnit mere end 0,5 procentpoint mindre end den bedste linje.
2. **Hovedmålet** er det mål, hvor valget af linje betyder mest. Mål under 25 % tæller kun, hvis alle mål ligger under. Er flere linjer lige gode (inden for 0,5 procentpoint), vælges den mest lærerige: dobbelt kipning, enkelt kipning, spil mod honnør, sikkerhedsspil, fald.
3. **Hovedlinjens første kipning:** modpartens kort over kortet ligger i to huller (fx K og B over E D 10) = dobbelt kipning; spilles der mod det højeste kort, der er tilbage i hånden = spil mod honnør; ellers enkelt kipning, mod damen eller knægten med 8 kort eller flere fald eller kip.
4. **Små kort fra begge hænder** er en kipning (som i punkt 3), når det laveste kort har en eller to af modpartens kort over sig; ellers et sikkerhedsspil.
5. **Ingen kipning:** fald eller kip.


## Enkelt kipning (98)

| Rang | Hånd / bordet | Mål | Begrundelse |
| --- | --- | --- | --- |
| 40 | E 10 6 5 / 4 3 2 | 2 | Kipning mod 10'eren med 7 kort. |
| 51 | E D 4 / B 3 2 | 3, 2 | Knægten spilles ud og løber med 6 kort. |
| 58 | E 10 6 5 4 / 3 2 | 3, 2 | 10'eren spilles ud og løber med 7 kort. |
| 60 | E 10 5 4 / K 3 2 | 3 | Kipning mod 10'eren med 7 kort. |
| 65 | E B 5 4 3 / K 2 | 5, 4, 3 | Kipning mod knægten med 7 kort. |
| 68 | E 10 5 4 3 / 2 | 3, 2 | 10'eren spilles ud og løber med 6 kort. |
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
| 166 | E B 10 / 4 3 2 | 2 | Små kort fra begge hænder kipper med 10'eren med 6 kort. |
| 170 | E 10 8 4 / 3 2 | 2 | Kipning mod 10'eren med 6 kort. |
| 183 | E 10 4 3 / K 9 2 | 4, 3 | Kipning mod 9'eren med 7 kort. |
| 188 | 10 9 4 3 / E D 2 | 4, 3 | Kipning mod damen med 7 kort. |
| 206 | E 8 7 6 5 / D B 4 3 2 | 5 | Damen spilles ud og løber med 10 kort. |
| 210 | E D 9 5 4 / B 3 2 | 5, 4, 3 | Kipning mod damen med 8 kort. |
| 250 | E D B 8 7 6 / 5 4 3 2 | 6 | Kipning mod damen med 10 kort. |
| 251 | D B 8 7 6 5 / E 4 3 2 | 6 | Damen spilles ud og løber med 10 kort. |
| 255 | E K D 10 3 / 2 | 5, 4 | Kipning mod 10'eren med 6 kort. |
| 257 | E B 9 3 / K 2 | 4, 3 | Kipning mod knægten med 6 kort. |
| 261 | E 10 8 5 4 / 3 2 | 3, 2 | Kipning mod 10'eren med 7 kort. |
| 277 | E D 9 5 / B 4 3 2 | 4, 3 | Kipning mod damen med 8 kort. |
| 283 | E D B 9 5 4 / 3 2 | 6, 5, 4 | Kipning mod damen med 8 kort. |
| 285 | E D 10 9 5 4 / 3 2 | 6, 5, 4 | Kipning mod damen med 8 kort. |
| 298 | E D 8 4 / B 3 2 | 3 | Kipning mod damen med 7 kort. |
| 312 | E D B 8 7 / 6 5 4 3 2 | 5 | Kipning mod damen med 10 kort. |
| 323 | E B 10 9 3 / 2 | 4, 3 | Kipning mod knægten med 6 kort. |
| 325 | E K B 10 / 4 3 2 | 4 | Små kort fra begge hænder kipper med 10'eren med 7 kort. |
| 336 | D B 7 6 5 4 3 / E 2 | 7, 6 | Damen spilles ud og løber med 9 kort. |
| 344 | E K 4 3 2 / D 10 | 5, 4 | Små kort fra begge hænder kipper med 10'eren med 7 kort. |
| 347 | E D 9 5 4 3 / B 2 | 6, 5, 4 | Knægten spilles ud og løber med 8 kort. |
| 356 | E 3 2 / D B 9 | 3 | Damen spilles ud og løber med 6 kort. |
| 358 | E 3 2 / B 10 9 | 2 | Knægten spilles ud og løber med 6 kort. |
| 364 | D B 9 6 5 / E 4 3 2 | 5, 4 | Damen spilles ud og løber med 9 kort. |
| 375 | E K D 9 / 3 2 | 4 | Små kort fra begge hænder kipper med 9'eren med 6 kort. |
| 378 | E D B 9 / 3 2 | 4, 3 | Kipning mod damen med 6 kort. |
| 380 | E K 10 9 / 3 2 | 4, 3 | Små kort fra begge hænder kipper med 9'eren med 6 kort. |
| 381 | E 9 3 2 / K 10 | 3 | Små kort fra begge hænder kipper med 10'eren med 6 kort. |
| 386 | E B 10 9 / 3 2 | 3 | Små kort fra begge hænder kipper med 9'eren med 6 kort. |
| 390 | D B 8 7 6 5 4 / E 3 2 | 7 | Damen spilles ud og løber med 10 kort. |
| 396 | K D 10 9 / 4 3 2 | 3 | Kongen spilles ud og løber med 7 kort. |
| 398 | E B 10 9 / 4 3 2 | 3 | Små kort fra begge hænder kipper med 9'eren med 7 kort. |
| 399 | E 4 3 2 / B 10 9 | 3 | Knægten spilles ud og løber med 7 kort. |
| 405 | E D 9 6 5 4 / B 3 2 | 6, 5 | Kipning mod damen med 9 kort. |
| 406 | D B 9 6 5 4 / E 3 2 | 6, 5 | Damen spilles ud og løber med 9 kort. |
| 413 | E B 9 8 4 3 / 2 | 5, 4, 3, 2 | Kipning mod knægten med 7 kort. |
| 421 | E 10 9 3 / K 8 2 | 4, 3 | 10'eren spilles ud og løber med 7 kort. |
| 422 | E B 8 / 10 3 2 | 2 | 10'eren spilles ud og løber med 6 kort. |
| 426 | E 10 4 3 2 / K 9 | 4, 3 | Små kort fra begge hænder kipper med 9'eren med 7 kort. |
| 432 | E D 4 3 / B 9 8 2 | 4, 3 | Kipning mod damen med 8 kort. |
| 433 | E 9 8 4 / D B 3 2 | 4, 3 | Damen spilles ud og løber med 8 kort. |
| 464 | E D 10 9 5 4 3 / 2 | 7, 6, 5 | Kipning mod damen med 8 kort. |
| 475 | E K D 10 / 2 | 4 | Små kort fra begge hænder kipper med 10'eren med 5 kort. |
| 476 | E K B 10 / 2 | 4 | Små kort fra begge hænder kipper med 10'eren med 5 kort. |
| 480 | E K 3 2 / B 10 9 | 4 | Knægten spilles ud og løber med 7 kort. |
| 482 | E B 8 / 10 2 | 2 | 10'eren spilles ud og løber med 5 kort. |
| 483 | E 6 5 4 3 / D B 9 2 | 5, 4 | Damen spilles ud og løber med 9 kort. |
| 495 | E B 10 9 / 2 | 3 | Små kort fra begge hænder kipper med 9'eren med 5 kort. |
| 508 | E D 9 8 4 3 / B 2 | 6, 5, 4 | Knægten spilles ud og løber med 8 kort. |
| 510 | E 9 8 5 4 / D B 3 2 | 5 | Damen spilles ud og løber med 9 kort. |
| 511 | B 9 8 5 4 / E D 3 2 | 5 | Kipning mod damen med 9 kort. |
| 512 | K D 9 5 4 / B 8 3 2 | 4 | Kongen spilles ud og løber med 9 kort. |
| 520 | E K B 10 9 / 3 2 | 5 | Små kort fra begge hænder kipper med 9'eren med 7 kort. |
| 530 | E B 10 9 8 3 / 2 | 5, 4 | Kipning mod knægten med 7 kort. |
| 541 | B 5 4 3 2 / E D 9 | 5, 4, 3 | Kipning mod damen med 8 kort. |
| 550 | K D 7 4 / B 9 3 2 | 3 | Kongen spilles ud og løber med 8 kort. |
| 557 | E D 10 8 7 / 6 5 4 3 2 | 5, 4 | Kipning mod damen med 10 kort. |
| 560 | E D B 9 8 / 3 2 | 5, 4 | Kipning mod damen med 7 kort. |
| 564 | E D 8 6 5 / B 4 3 2 | 5, 4 | Knægten spilles ud og løber med 9 kort. |
| 566 | K D 8 6 5 / B 4 3 2 | 4 | Knægten spilles ud og løber med 9 kort. |
| 569 | E D 9 8 / B 2 | 4, 3 | Knægten spilles ud og løber med 6 kort. |
| 570 | E D 8 2 / B 9 | 3 | Knægten spilles ud og løber med 6 kort. |
| 585 | E D 8 7 / B 3 2 | 4, 3 | Knægten spilles ud og løber med 7 kort. |
| 586 | E 9 8 7 / B 3 2 | 3, 2 | Knægten spilles ud og løber med 7 kort. |
| 596 | E B 9 7 6 5 / D 4 3 2 | 6 | Damen spilles ud og løber med 10 kort. |
| 598 | E D 8 6 5 4 / B 3 2 | 6, 5 | Knægten spilles ud og løber med 9 kort. |
| 599 | B 9 8 5 4 3 / E D 2 | 6 | Kipning mod damen med 9 kort. |
| 601 | K D 9 5 4 3 / B 8 2 | 5 | Kongen spilles ud og løber med 9 kort. |
| 602 | K D 8 6 5 4 / B 3 2 | 5 | Knægten spilles ud og løber med 9 kort. |
| 604 | E D 4 3 2 / B 9 8 | 5, 4 | Knægten spilles ud og løber med 8 kort. |
| 607 | E K 10 9 8 / 2 | 5, 4 | Små kort fra begge hænder kipper med 8'eren med 6 kort. |
| 610 | E B 10 9 8 / 2 | 4 | Små kort fra begge hænder kipper med 8'eren med 6 kort. |
| 612 | E B 9 7 6 / D 5 4 3 2 | 5 | Damen spilles ud og løber med 10 kort. |
| 624 | E D 9 7 4 / B 8 3 2 | 5 | Kipning mod damen med 9 kort. |
| 631 | E B 9 7 6 5 4 / D 3 2 | 7 | Damen spilles ud og løber med 10 kort. |
| 638 | B 7 4 3 2 / E D 9 | 5, 4, 3 | Kipning mod damen med 8 kort. |
| 643 | E 6 5 4 3 2 / D B 9 | 6, 5 | Damen spilles ud og løber med 9 kort. |
| 651 | E D 5 4 3 2 / B 9 8 | 6, 5 | Kipning mod damen med 9 kort. |
| 655 | E D 9 7 6 / B 8 2 | 5, 4 | Knægten spilles ud og løber med 8 kort. |
| 657 | E D 7 4 3 2 / B 9 8 | 6 | Kipning mod damen med 9 kort. |
| 660 | E D B 5 4 3 2 / 8 7 6 | 7 | Kipning mod damen med 10 kort. |

## Fald eller kip (96)

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
| 155 | E K 7 6 5 4 3 / D 2 | 7 | Linjen spiller på fald med 9 kort. |
| 159 | E K D 10 5 / 4 3 2 | 5, 4 | Linjen spiller på fald med 8 kort. |
| 167 | E K 10 6 5 / D 4 3 2 | 5 | Linjen spiller på fald med 9 kort. |
| 169 | E B 7 6 5 / 10 4 3 2 | 4 | Linjen spiller på fald med 9 kort. |
| 192 | E K D 4 3 2 / – | 5, 4 | Linjen spiller på fald med 6 kort. |
| 196 | E 10 5 4 / K 9 3 2 | 4, 3 | Kipning mod 10'eren med 8 kort: fald eller kip. |
| 200 | E K D B 3 / 2 | 5 | Linjen spiller på fald med 6 kort. |
| 205 | E B 8 7 6 / K 5 4 3 2 | 5 | Linjen spiller på fald med 10 kort. |
| 209 | E B 9 5 4 / K 3 2 | 5, 4, 3 | Kipning mod knægten med 8 kort: fald eller kip. |
| 226 | E K 10 6 5 4 / D 3 2 | 6 | Linjen spiller på fald med 9 kort. |
| 254 | E K 9 3 / D 2 | 4 | Linjen spiller på fald med 6 kort. |
| 268 | E K B 3 2 / – | 3 | Linjen spiller på fald med 5 kort. |
| 275 | E K 9 5 / D 4 3 2 | 4 | Linjen spiller på fald med 8 kort. |
| 282 | E K B 9 5 4 / 3 2 | 6, 5, 4 | Kipning mod knægten med 8 kort: fald eller kip. |
| 287 | E 10 7 6 5 4 / D 3 2 | 5 | Linjen spiller på fald med 9 kort. |
| 291 | E B 7 6 5 4 / 10 3 2 | 5 | Linjen spiller på fald med 9 kort. |
| 294 | E K D 5 4 3 2 / – | 7, 6, 5 | Linjen spiller på fald med 7 kort. |
| 302 | E K 10 9 5 / 4 3 2 | 5, 4, 3 | Kipning mod 10'eren med 8 kort: fald eller kip. |
| 314 | E K D 9 4 3 / 2 | 6, 5, 4 | Linjen spiller på fald med 7 kort. |
| 326 | E K D 10 6 5 4 / 3 2 | 7 | Linjen spiller på fald med 9 kort. |
| 327 | E K D 10 6 / 5 4 3 2 | 5 | Linjen spiller på fald med 9 kort. |
| 333 | E B 10 6 5 4 3 / 2 | 6, 5, 4 | Kipning mod knægten med 8 kort: fald eller kip. |
| 334 | E K 10 4 / D 9 3 2 | 4 | Linjen spiller på fald med 8 kort. |
| 359 | E B 9 5 4 / K 10 3 2 | 5 | Linjen spiller på fald med 9 kort. |
| 360 | E B 6 5 4 / K 9 3 2 | 5 | Linjen spiller på fald med 9 kort. |
| 361 | E 9 6 5 4 / K B 3 2 | 5 | Linjen spiller på fald med 9 kort. |
| 362 | B 10 9 5 4 / E K 3 2 | 5 | Linjen spiller på fald med 9 kort. |
| 365 | E K 9 6 5 / 10 4 3 2 | 5, 4 | Linjen spiller på fald med 9 kort. |
| 367 | E 10 9 6 5 / D 4 3 2 | 5, 4 | Linjen spiller på fald med 9 kort. |
| 368 | E 10 6 5 4 / D 9 3 2 | 5, 4 | Linjen spiller på fald med 9 kort. |
| 388 | E K B 5 4 3 2 / – | 6, 5, 4 | Linjen spiller på fald med 7 kort. |
| 389 | E B 8 7 6 5 4 / K 3 2 | 7 | Linjen spiller på fald med 10 kort. |
| 400 | E K 10 9 3 / D 2 | 5 | Linjen spiller på fald med 7 kort. |
| 402 | E K D 10 / 5 4 3 2 | 4 | Linjen spiller på fald med 8 kort. |
| 403 | E K B 10 / 5 4 3 2 | 4 | Små kort fra begge hænder kipper med 10'eren med 8 kort: fald eller kip. |
| 404 | E K 9 6 5 4 / B 3 2 | 6 | Linjen spiller på fald med 9 kort. |
| 408 | E 10 9 6 5 4 / D 3 2 | 6, 5 | Linjen spiller på fald med 9 kort. |
| 416 | E 10 7 6 5 4 3 / 2 | 5, 4 | Kipning mod 10'eren med 8 kort: fald eller kip. |
| 417 | E K D B 3 2 / – | 6, 5 | Linjen spiller på fald med 6 kort. |
| 428 | E K 9 4 / D 8 3 2 | 4 | Linjen spiller på fald med 8 kort. |
| 447 | E 10 7 6 5 / 9 4 3 2 | 4, 3 | 9'eren spilles ud og løber med 9 kort: fald eller kip. |
| 453 | D 7 6 5 4 3 / E 10 2 | 5 | Linjen spiller på fald med 9 kort. |
| 466 | E B 10 9 5 4 3 / 2 | 6, 5 | Kipning mod knægten med 8 kort: fald eller kip. |
| 468 | E K D B 4 3 2 / – | 7, 6 | Linjen spiller på fald med 7 kort. |
| 473 | E K D 10 3 2 / – | 6, 5, 4 | Linjen spiller på fald med 6 kort. |
| 474 | E K B 10 3 2 / – | 6, 5 | Linjen spiller på fald med 6 kort. |
| 477 | E K D 10 9 3 / 2 | 6, 5 | Linjen spiller på fald med 7 kort. |
| 490 | E K D 9 / 2 | 4 | Linjen spiller på fald med 5 kort. |
| 502 | E K B 10 9 4 3 / 2 | 7 | Kipning mod knægten med 8 kort: fald eller kip. |
| 503 | B 10 9 4 3 2 / E | 5, 4, 3 | Linjen spiller på fald med 7 kort. |
| 504 | E B 9 6 5 4 3 / 2 | 6, 5, 4 | Kipning mod knægten med 8 kort: fald eller kip. |
| 507 | E B 8 5 4 3 / K 2 | 6, 5, 4 | Kipning mod knægten med 8 kort: fald eller kip. |
| 509 | E K D 9 3 2 / – | 6, 5, 4 | Linjen spiller på fald med 6 kort. |
| 513 | E 10 9 5 4 / D 8 3 2 | 5, 4 | Linjen spiller på fald med 9 kort. |
| 519 | E K D 10 9 / 3 2 | 5 | Linjen spiller på fald med 7 kort. |
| 521 | E K 10 9 / 5 4 3 2 | 4, 3 | Små kort fra begge hænder kipper med 9'eren med 8 kort: fald eller kip. |
| 525 | E B 10 9 / 5 4 3 2 | 3 | Små kort fra begge hænder kipper med 9'eren med 8 kort: fald eller kip. |
| 527 | E B 6 5 4 3 / K 9 2 | 6 | Linjen spiller på fald med 9 kort. |
| 532 | E 10 7 6 5 4 / 9 3 2 | 6, 5 | 9'eren spilles ud og løber med 9 kort: fald eller kip. |
| 533 | E B 9 6 5 / K 10 4 3 2 | 5 | Linjen spiller på fald med 10 kort. |
| 534 | E K B 10 2 / – | 4 | Linjen spiller på fald med 5 kort. |
| 537 | E K 4 3 2 / B 10 9 | 5 | Knægten spilles ud og løber med 8 kort: fald eller kip. |
| 549 | E 10 8 3 / K B 9 2 | 4 | Kipning mod 9'eren med 8 kort: fald eller kip. |
| 556 | E D B 9 8 7 / 6 5 4 3 2 | 6 | Linjen spiller på fald med 11 kort. |
| 558 | E B 10 8 7 / 6 5 4 3 2 | 4 | Kipning mod knægten med 10 kort: fald eller kip. |
| 572 | E 10 5 4 3 2 / K 9 | 6, 5, 4 | Små kort fra begge hænder kipper med 9'eren med 8 kort: fald eller kip. |
| 582 | E 10 9 7 6 5 4 / 3 2 | 6, 5 | Kipning mod 10'eren med 9 kort: fald eller kip. |
| 584 | E K D 9 4 3 2 / – | 7, 6, 5 | Linjen spiller på fald med 7 kort. |
| 590 | E K D 10 9 / 2 | 5 | Linjen spiller på fald med 6 kort. |
| 592 | E 10 9 8 / K 4 3 2 | 4, 3 | Små kort fra begge hænder kipper med 8'eren med 8 kort: fald eller kip. |
| 595 | E K 9 7 6 5 / B 4 3 2 | 6 | Linjen spiller på fald med 10 kort. |
| 611 | E K 9 7 6 / B 5 4 3 2 | 5 | Linjen spiller på fald med 10 kort. |
| 618 | K 9 6 5 4 3 / E B 10 2 | 6 | Linjen spiller på fald med 10 kort. |
| 621 | E K D 10 9 3 2 / – | 6, 5 | Linjen spiller på fald med 7 kort. |
| 623 | E K B 8 4 3 2 / – | 6, 5, 4 | Linjen spiller på fald med 7 kort. |
| 625 | E K 5 4 3 2 / B 10 9 | 6 | Linjen spiller på fald med 9 kort. |
| 629 | 10 9 8 7 / K D 2 | 3 | Linjen spiller på fald med 7 kort. |
| 630 | E K 9 7 6 5 4 / B 3 2 | 7 | Linjen spiller på fald med 10 kort. |
| 636 | E K 6 5 4 / 10 9 8 3 2 | 5 | Linjen spiller på fald med 10 kort. |
| 642 | E K B 9 8 7 3 / 2 | 7, 6 | Kipning mod knægten med 8 kort: fald eller kip. |
| 645 | E 6 5 4 3 2 / B 10 9 | 5 | Knægten spilles ud og løber med 9 kort: fald eller kip. |
| 646 | E 5 4 3 2 / B 10 9 8 | 4 | Knægten spilles ud og løber med 9 kort: fald eller kip. |
| 652 | D 8 5 4 3 2 / E 10 9 | 6, 5 | Linjen spiller på fald med 9 kort. |
| 658 | E D 10 9 8 7 / 6 5 4 3 2 | 6 | Linjen spiller på fald med 11 kort. |
| 659 | K 6 5 4 3 2 / E B 9 8 | 6 | Linjen spiller på fald med 10 kort. |

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
| 53 | B 5 4 3 / E D 2 | 4, 3 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
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
| 157 | D 10 9 3 / 2 | 2, 1 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 174 | E K 9 4 / B 3 2 | 4, 3 | Der spilles mod knægten, som er det højeste kort, der er tilbage i hånden. |
| 179 | E D 4 3 / B 9 2 | 4, 3 | Der spilles mod knægten, som er det højeste kort, der er tilbage i hånden. |
| 180 | E 9 4 3 / D B 2 | 4, 3 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 184 | K D 4 3 / B 9 2 | 3 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 185 | K 9 4 3 / D B 2 | 3 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 189 | K 10 9 4 / D 3 2 | 3 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 190 | K 10 4 3 / D 9 2 | 3 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 203 | K D 10 / 3 2 | 2 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 214 | K D 9 5 4 / B 3 2 | 4, 3 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 229 | K D 6 5 4 3 / 10 2 | 5, 4, 3 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 243 | K D B 9 4 / 3 2 | 4 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 256 | E K 9 3 / B 2 | 3 | Der spilles mod knægten, som er det højeste kort, der er tilbage i hånden. |
| 258 | E D 9 3 / B 2 | 3 | Der spilles mod knægten, som er det højeste kort, der er tilbage i hånden. |
| 259 | K D 9 3 / B 2 | 3 | Der spilles mod knægten, som er det højeste kort, der er tilbage i hånden. |
| 260 | E 10 9 3 / D 2 | 3 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 265 | D B 9 / 3 2 | 1 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 271 | K B 9 / 4 3 2 | 2, 1 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 272 | D B 9 / 4 3 2 | 1 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 279 | K D 9 5 / B 4 3 2 | 3 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 289 | K D 7 6 5 4 / 10 3 2 | 5 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 304 | K D 5 4 3 / B 9 2 | 4, 3 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 307 | K 9 5 4 3 / D 10 2 | 4, 3 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 328 | E B 8 3 / 10 2 | 3, 2 | Der spilles mod 10'eren, som er det højeste kort, der er tilbage i hånden. |
| 345 | D 6 5 4 3 / B 9 2 | 3, 2 | Der spilles mod knægten, som er det højeste kort, der er tilbage i hånden. |
| 369 | K 9 6 5 4 / D 10 3 2 | 4 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 372 | K D 8 5 4 / B 3 2 | 4, 3 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 382 | K D B 9 / 3 2 | 3 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 392 | K D B 9 / 4 3 2 | 3 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 418 | B 9 8 3 / E K 2 | 4, 3 | Der spilles mod knægten, som er det højeste kort, der er tilbage i hånden. |
| 435 | K D 8 5 / B 4 3 2 | 3 | Der spilles mod knægten, som er det højeste kort, der er tilbage i hånden. |
| 458 | K D 9 4 3 / B 8 2 | 4 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 486 | K D 10 9 6 / 5 4 3 2 | 4 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 522 | K D B 9 / 5 4 3 2 | 3 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 524 | K D 10 9 / 5 4 3 2 | 3 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 540 | E 5 4 3 2 / D B 9 | 4, 3 | Der spilles mod damen, som er det højeste kort, der er tilbage i hånden. |
| 552 | K D 9 7 4 / B 3 2 | 4 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |
| 561 | K D B 9 8 / 3 2 | 4 | Der spilles mod kongen, som er det højeste kort, der er tilbage i hånden. |

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
| 158 | D B 9 3 / 2 | 2, 1 | Der kippes mod 9'eren, og modpartens kort over den ligger i to huller. |
| 163 | K 6 5 4 3 / B 10 2 | 4, 3, 2 | Der kippes mod knægten, og modpartens kort over den ligger i to huller. |
| 165 | E D 10 / 4 3 2 | 3, 2 | Små kort fra begge hænder kipper med 10'eren, og modpartens kort over den ligger i to huller. |
| 186 | E 10 9 4 / D 3 2 | 3 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 187 | E 10 4 3 / D 9 2 | 3 | Der kippes mod 9'eren, og modpartens kort over den ligger i to huller. |
| 191 | D 4 3 2 / E 10 | 2 | Små kort fra begge hænder kipper med 10'eren, og modpartens kort over den ligger i to huller. |
| 197 | E 10 5 4 / D 9 3 2 | 3 | Der kippes mod 9'eren, og modpartens kort over den ligger i to huller. |
| 201 | E D 10 / 3 2 | 3, 2 | Små kort fra begge hænder kipper med 10'eren, og modpartens kort over den ligger i to huller. |
| 202 | D 3 2 / E 10 | 2 | Små kort fra begge hænder kipper med 10'eren, og modpartens kort over den ligger i to huller. |
| 204 | K 3 2 / D 10 | 2 | Små kort fra begge hænder kipper med 10'eren, og modpartens kort over den ligger i to huller. |
| 216 | E D 9 6 5 / 4 3 2 | 4, 3, 2 | Der kippes mod 9'eren, og modpartens kort over den ligger i to huller. |
| 217 | E 10 9 5 4 / D 3 2 | 5, 4, 3 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 218 | E B 9 6 5 / 4 3 2 | 4, 3, 2 | Der kippes mod 9'eren, og modpartens kort over den ligger i to huller. |
| 222 | D 10 9 6 5 / 4 3 2 | 3, 2, 1 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 232 | E 10 8 3 / 2 | 2 | 8'eren spilles ud og løber, og modpartens kort over den ligger i to huller. |
| 236 | E B 9 4 3 / K 2 | 5, 4, 3 | Der kippes mod 9'eren, og modpartens kort over den ligger i to huller. |
| 237 | K B 9 4 3 / E 2 | 5, 4, 3 | Der kippes mod 9'eren, og modpartens kort over den ligger i to huller. |
| 246 | E D 10 9 4 / 3 2 | 5, 4, 3 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 248 | K D 10 9 4 / 3 2 | 4, 3 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 264 | K B 9 / 3 2 | 2, 1 | Der kippes mod knægten, og modpartens kort over den ligger i to huller. |
| 280 | E 10 9 5 / D 4 3 2 | 3 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 305 | E D 10 9 5 / 4 3 2 | 4, 3, 2 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 306 | E 9 5 4 3 / D 10 2 | 4, 3 | 9'eren spilles ud og løber, og modpartens kort over den ligger i to huller. |
| 309 | K 10 8 4 / B 3 2 | 4, 3 | Der kippes mod 8'eren, og modpartens kort over den ligger i to huller. |
| 315 | E K B 9 4 3 / 2 | 6, 5, 4, 3 | Der kippes mod 9'eren, og modpartens kort over den ligger i to huller. |
| 316 | E D B 9 3 / 2 | 4, 3 | Der kippes mod 9'eren, og modpartens kort over den ligger i to huller. |
| 318 | K D B 9 3 / 2 | 4, 3 | Der kippes mod 9'eren, og modpartens kort over den ligger i to huller. |
| 321 | D 5 4 3 2 / E 10 | 4, 3, 2 | Små kort fra begge hænder kipper med 10'eren, og modpartens kort over den ligger i to huller. |
| 332 | K D 10 6 5 4 3 / 2 | 6, 5, 4 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 335 | E D 9 6 / 5 4 3 2 | 3, 2 | 9'eren spilles ud og løber, og modpartens kort over den ligger i to huller. |
| 351 | E 10 9 5 4 3 / D 2 | 5, 4 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 353 | K 10 8 7 6 5 / 4 3 2 | 5, 4, 3 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 355 | E K 9 / B 3 2 | 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 357 | E 10 9 / D 3 2 | 3, 2 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 373 | K 10 8 5 4 / B 3 2 | 4, 3, 2 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 376 | E K B 9 / 3 2 | 4, 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 377 | E B 3 2 / K 9 | 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 379 | E D 3 2 / B 9 | 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 383 | E D 10 9 / 3 2 | 4, 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 384 | D 9 3 2 / E 10 | 3 | Små kort fra begge hænder kipper med 10'eren, og modpartens kort over den ligger i to huller. |
| 385 | K D 10 9 / 3 2 | 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 387 | K B 10 9 / 3 2 | 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 393 | E D 10 9 / 4 3 2 | 4, 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 394 | E 4 3 2 / D 10 9 | 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 395 | D 4 3 2 / E 10 9 | 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 397 | K 4 3 2 / D 10 9 | 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 410 | K D 10 8 4 3 / 2 | 5, 4, 3, 2 | Der kippes mod 8'eren, og modpartens kort over den ligger i to huller. |
| 412 | E B 10 8 4 3 / 2 | 5, 4, 3, 2 | Der kippes mod 8'eren, og modpartens kort over den ligger i to huller. |
| 414 | E B 8 5 4 3 / 2 | 4, 3, 2 | 8'eren spilles ud og løber, og modpartens kort over den ligger i to huller. |
| 423 | K 9 8 / B 3 2 | 2, 1 | Knægten spilles ud og løber, og modpartens kort over den ligger i to huller. |
| 424 | E D 4 3 2 / B 9 | 5, 4, 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 425 | D B 4 3 2 / E 9 | 4, 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 427 | K D 4 3 2 / B 9 | 4, 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 437 | K 10 8 5 / B 4 3 2 | 3, 2 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 449 | D 9 7 6 5 / B 4 3 2 | 3 | Der kippes mod 9'eren, og modpartens kort over den ligger i to huller. |
| 460 | D 10 9 4 3 / E 8 2 | 5, 4 | 10'eren spilles ud og løber, og modpartens kort over den ligger i to huller. |
| 461 | D 9 8 6 5 / 4 3 2 | 3, 2 | Der kippes mod 9'eren, og modpartens kort over den ligger i to huller. |
| 465 | K D 10 9 5 4 3 / 2 | 6, 5 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 471 | E 10 9 / D 2 | 3, 2 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 472 | D 10 9 / E 2 | 3, 2 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 488 | K B 9 7 6 / 5 4 3 2 | 4, 3, 2 | Der kippes mod knægten, og modpartens kort over den ligger i to huller. |
| 491 | E D B 9 / 2 | 4, 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 492 | K D B 9 / 2 | 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 493 | E D 10 9 / 2 | 4, 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 494 | K D 10 9 / 2 | 2 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 505 | K B 8 7 6 5 / 10 4 3 2 | 5 | 10'eren spilles ud og løber, og modpartens kort over den ligger i to huller. |
| 514 | D 6 5 4 3 2 / E 10 | 4, 3, 2 | 10'eren spilles ud og løber, og modpartens kort over den ligger i to huller. |
| 523 | E D 10 9 / 5 4 3 2 | 4, 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 528 | E D B 9 8 3 / 2 | 6, 5, 4 | Der kippes mod 9'eren, og modpartens kort over den ligger i to huller. |
| 539 | E D 3 2 / B 9 8 | 4, 3 | Små kort fra begge hænder kipper med 8'eren, og modpartens kort over den ligger i to huller. |
| 542 | E 10 9 8 / D 3 2 | 4, 3 | Små kort fra begge hænder kipper med 8'eren, og modpartens kort over den ligger i to huller. |
| 543 | D 10 9 8 / E 3 2 | 4, 3 | 10'eren spilles ud og løber, og modpartens kort over den ligger i to huller. |
| 544 | E 5 4 3 2 / D 10 9 | 4, 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 545 | K 5 4 3 2 / D 10 9 | 4, 3 | Små kort fra begge hænder kipper med 9'eren, og modpartens kort over den ligger i to huller. |
| 568 | E K 9 8 / B 2 | 4, 3 | Små kort fra begge hænder kipper med 8'eren, og modpartens kort over den ligger i to huller. |
| 574 | D 10 9 8 / E 2 | 3 | 10'eren spilles ud og løber, og modpartens kort over den ligger i to huller. |
| 575 | D 9 5 4 3 2 / E 10 | 5, 4 | 10'eren spilles ud og løber, og modpartens kort over den ligger i to huller. |
| 579 | E 10 9 6 5 4 3 / D 2 | 7, 6 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 587 | K 9 8 7 / B 3 2 | 3, 2 | Knægten spilles ud og løber, og modpartens kort over den ligger i to huller. |
| 593 | E 10 9 8 / D 4 3 2 | 4, 3 | Små kort fra begge hænder kipper med 8'eren, og modpartens kort over den ligger i to huller. |
| 594 | K 4 3 2 / D 10 9 8 | 3 | Små kort fra begge hænder kipper med 8'eren, og modpartens kort over den ligger i to huller. |
| 605 | E 9 4 3 2 / D 10 8 | 5, 4 | 10'eren spilles ud og løber, og modpartens kort over den ligger i to huller. |
| 606 | E D B 9 8 / 2 | 5, 4 | Små kort fra begge hænder kipper med 8'eren, og modpartens kort over den ligger i to huller. |
| 608 | E D 10 9 8 / 2 | 5, 4 | Små kort fra begge hænder kipper med 8'eren, og modpartens kort over den ligger i to huller. |
| 609 | K D 10 9 8 / 2 | 4 | Små kort fra begge hænder kipper med 8'eren, og modpartens kort over den ligger i to huller. |
| 620 | E K 9 8 7 3 / B 2 | 6, 5 | Der kippes mod 9'eren, og modpartens kort over den ligger i to huller. |
| 622 | E 10 9 8 5 4 3 / D 2 | 7, 6 | Der kippes mod 10'eren, og modpartens kort over den ligger i to huller. |
| 632 | D 4 3 2 / E 10 8 7 | 4, 3, 2 | 10'eren spilles ud og løber, og modpartens kort over den ligger i to huller. |
| 639 | E 9 7 3 2 / D 10 8 | 5, 4 | 10'eren spilles ud og løber, og modpartens kort over den ligger i to huller. |
| 647 | K 5 4 3 2 / B 10 9 8 | 4 | Knægten spilles ud og løber, og modpartens kort over den ligger i to huller. |
| 648 | K 7 6 5 4 3 / B 10 9 2 | 5 | Knægten spilles ud og løber, og modpartens kort over den ligger i to huller. |

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
| 156 | E 10 9 3 / 2 | 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 160 | E 6 5 4 3 / D 10 2 | 4, 3, 2 | Til 3 stik giver den bedste linje 89,6 %, linjen med flest stik kun 87,6 %. |
| 161 | D 6 5 4 3 / E 10 2 | 4, 3 | Til 3 stik giver den bedste linje 96,1 %, linjen med flest stik kun 93,3 %. |
| 162 | K 6 5 4 3 / D 10 2 | 4, 3, 2 | Til 3 stik giver den bedste linje 87,6 %, linjen med flest stik kun 84,8 %. |
| 164 | D B 5 4 3 / 9 2 | 3, 2, 1 | Til 2 stik giver den bedste linje 74,3 %, linjen med flest stik kun 72,7 %. |
| 168 | E D 7 6 5 / 10 4 3 2 | 5, 4 | Til 4 stik giver den bedste linje 78,0 %, linjen med flest stik kun 71,8 %. |
| 175 | E K 4 3 / B 9 2 | 4, 3 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 176 | E B 9 4 / K 3 2 | 4, 3 | Til 3 stik giver den bedste linje 84,7 %, linjen med flest stik kun 78,3 %. |
| 177 | K 9 4 3 / E B 2 | 4, 3 | Til 3 stik giver den bedste linje 83,9 %, linjen med flest stik kun 82,6 %. |
| 178 | E D 9 4 / B 3 2 | 4, 3 | Til 3 stik giver den bedste linje 71,8 %, linjen med flest stik kun 68,3 %. |
| 181 | B 9 4 3 / E D 2 | 4, 3 | Til 3 stik giver den bedste linje 68,6 %, linjen med flest stik kun 67,4 %. |
| 182 | E K 9 4 / 10 3 2 | 4, 3 | Til 3 stik giver den bedste linje 71,8 %, linjen med flest stik kun 69,4 %. |
| 193 | E B 5 4 / K 9 3 2 | 4, 3 | Til 3 stik giver den bedste linje 100,0 %, linjen med flest stik kun 97,2 %. |
| 194 | E D 5 4 / B 9 3 2 | 4, 3 | Til 3 stik giver den bedste linje 89,6 %, linjen med flest stik kun 86,7 %. |
| 195 | D B 5 4 / E 9 3 2 | 4, 3 | Til 3 stik giver den bedste linje 97,2 %, linjen med flest stik kun 86,7 %. |
| 198 | K 6 5 4 / B 9 3 2 | 3, 2, 1 | Til 1 stik giver den bedste linje 100,0 %, linjen med flest stik kun 97,2 %. |
| 207 | E K B 10 4 3 / 2 | 6, 5, 4 | Til 5 stik giver den bedste linje 86,4 %, linjen med flest stik kun 85,2 %. |
| 208 | E K 9 5 4 / B 3 2 | 5, 4 | Til 4 stik giver den bedste linje 96,1 %, linjen med flest stik kun 79,1 %. |
| 211 | D B 9 5 4 / E 3 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 87,6 %, linjen med flest stik kun 84,8 %. |
| 212 | E K 9 5 4 / 10 3 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 87,6 %, linjen med flest stik kun 82,0 %. |
| 215 | E D 9 5 4 / 10 3 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 71,2 %, linjen med flest stik kun 68,4 %. |
| 227 | E D 6 5 4 3 / 10 2 | 6, 5, 4 | Til 5 stik giver den bedste linje 37,3 %, linjen med flest stik kun 33,9 %. |
| 228 | E D 10 7 6 5 / 4 3 2 | 6, 5, 4 | Til 5 stik giver den bedste linje 82,8 %, linjen med flest stik kun 76,6 %. |
| 233 | E K D 9 4 / 3 2 | 5, 4 | Til 4 stik giver den bedste linje 89,6 %, linjen med flest stik kun 84,0 %. |
| 234 | E K 9 4 3 / D 2 | 5, 4 | Til 4 stik giver den bedste linje 86,4 %, linjen med flest stik kun 84,0 %. |
| 235 | E K 9 4 3 / B 2 | 5, 4, 3 | Til 3 stik giver den bedste linje 98,8 %, linjen med flest stik kun 93,9 %. |
| 238 | E D B 9 4 / 3 2 | 5, 4, 3 | Til 3 stik giver den bedste linje 94,4 %, linjen med flest stik kun 93,2 %. |
| 239 | E D 9 4 3 / B 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 58,1 %, linjen med flest stik kun 54,9 %. |
| 240 | D B 9 4 3 / E 2 | 4, 3 | Til 3 stik giver den bedste linje 94,4 %, linjen med flest stik kun 89,6 %. |
| 242 | E 10 9 4 3 / K 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 64,6 %, linjen med flest stik kun 61,4 %. |
| 244 | K D B 4 3 / 9 2 | 4, 3 | Til 3 stik giver den bedste linje 93,2 %, linjen med flest stik kun 87,6 %. |
| 245 | K D 9 4 3 / B 2 | 4, 3 | Til 3 stik giver den bedste linje 93,2 %, linjen med flest stik kun 88,4 %. |
| 247 | E 10 9 4 3 / D 2 | 4, 3 | Til 3 stik giver den bedste linje 88,8 %, linjen med flest stik kun 86,4 %. |
| 252 | E D 10 7 6 / 5 4 3 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 82,8 %, linjen med flest stik kun 76,6 %. |
| 253 | E 7 6 5 4 3 / D B 2 | 6, 5 | Til 5 stik giver den bedste linje 95,2 %, linjen med flest stik kun 90,4 %. |
| 262 | E D 9 / 3 2 | 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 263 | E B 9 / 3 2 | 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 266 | K 10 9 / 3 2 | 1 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 267 | D 10 9 / 3 2 | 1 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 269 | E D 9 / 4 3 2 | 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 270 | E B 9 / 4 3 2 | 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 273 | K 10 9 / 4 3 2 | 1 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 274 | D 10 9 / 4 3 2 | 1 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 276 | E K 9 5 / B 4 3 2 | 4, 3 | Til 3 stik giver den bedste linje 100,0 %, linjen med flest stik kun 91,5 %. |
| 278 | D B 9 5 / E 4 3 2 | 4, 3 | Til 3 stik giver den bedste linje 89,6 %, linjen med flest stik kun 86,7 %. |
| 281 | E 5 4 3 / D 10 9 2 | 4, 3 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 286 | E D 7 6 5 4 / 10 3 2 | 6, 5 | Til 5 stik giver den bedste linje 78,0 %, linjen med flest stik kun 71,8 %. |
| 288 | K D 10 9 5 4 / 3 2 | 5, 4 | Til 4 stik giver den bedste linje 98,0 %, linjen med flest stik kun 96,1 %. |
| 293 | D 4 3 2 / B 9 | 2, 1 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 295 | E K 5 4 3 / B 9 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 87,6 %, linjen med flest stik kun 76,3 %. |
| 296 | E B 5 4 3 / K 9 2 | 5, 4 | Til 4 stik giver den bedste linje 96,1 %, linjen med flest stik kun 87,6 %. |
| 297 | E 9 5 4 3 / K B 2 | 5, 4 | Til 4 stik giver den bedste linje 96,1 %, linjen med flest stik kun 93,3 %. |
| 299 | E D 5 4 3 / B 9 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 79,1 %, linjen med flest stik kun 76,3 %. |
| 300 | E 9 5 4 3 / D B 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 93,3 %, linjen med flest stik kun 84,8 %. |
| 301 | B 9 5 4 3 / E D 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 87,6 %, linjen med flest stik kun 84,8 %. |
| 303 | E 10 5 4 3 / K 9 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 90,4 %, linjen med flest stik kun 87,6 %. |
| 308 | E B 8 4 / 10 3 2 | 3, 2 | Til 2 stik giver den bedste linje 90,3 %, linjen med flest stik kun 88,3 %. |
| 313 | E K D 9 3 / 2 | 5, 4 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 317 | E D B 9 4 3 / 2 | 6, 5, 4, 3 | Til 4 stik giver den bedste linje 92,5 %, linjen med flest stik kun 87,6 %. |
| 319 | K D B 9 4 3 / 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 92,5 %, linjen med flest stik kun 87,6 %. |
| 320 | E D 10 9 4 3 / 2 | 6, 5, 4, 3 | Til 4 stik giver den bedste linje 88,8 %, linjen med flest stik kun 87,6 %. |
| 322 | K D 10 9 4 3 / 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 87,6 %, linjen med flest stik kun 86,4 %. |
| 324 | E B 10 9 4 3 / 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 88,8 %, linjen med flest stik kun 86,4 %. |
| 331 | E K D 10 5 4 3 / 2 | 7, 6 | Til 6 stik giver den bedste linje 98,0 %, linjen med flest stik kun 96,1 %. |
| 338 | K D 9 8 4 / 3 2 | 4, 3, 2 | Til 2 stik giver den bedste linje 95,6 %, linjen med flest stik kun 94,4 %. |
| 346 | E K 9 5 4 3 / B 2 | 6, 5, 4 | Til 4 stik giver den bedste linje 100,0 %, linjen med flest stik kun 98,0 %. |
| 348 | D B 9 5 4 3 / E 2 | 6, 5, 4 | Til 5 stik giver den bedste linje 79,1 %, linjen med flest stik kun 76,3 %. |
| 350 | K D B 5 4 3 / 9 2 | 5, 4 | Til 4 stik giver den bedste linje 98,0 %, linjen med flest stik kun 96,1 %. |
| 363 | E 9 6 5 4 / D B 3 2 | 5, 4 | Til 4 stik giver den bedste linje 100,0 %, linjen med flest stik kun 95,2 %. |
| 370 | E D 8 5 4 / B 3 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 79,1 %, linjen med flest stik kun 76,3 %. |
| 374 | K 9 8 5 4 / B 3 2 | 4, 3, 2 | Til 3 stik giver den bedste linje 83,7 %, linjen med flest stik kun 80,8 %. |
| 391 | E K B 9 / 4 3 2 | 4, 3 | Til 3 stik giver den bedste linje 84,7 %, linjen med flest stik kun 78,3 %. |
| 401 | E B 10 9 3 / K 2 | 5 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 409 | D 10 9 6 5 4 / E 3 2 | 6, 5 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 411 | K D 9 8 4 3 / 2 | 5, 4, 3, 2 | Til 3 stik giver den bedste linje 92,5 %, linjen med flest stik kun 90,0 %. |
| 419 | E 9 8 3 / D B 2 | 4, 3 | Til 3 stik giver den bedste linje 82,6 %, linjen med flest stik kun 79,0 %. |
| 420 | B 9 8 3 / E D 2 | 4, 3 | Til 3 stik giver den bedste linje 77,8 %, linjen med flest stik kun 76,2 %. |
| 429 | E K 8 5 / B 4 3 2 | 4, 3 | Til 3 stik giver den bedste linje 92,4 %, linjen med flest stik kun 86,7 %. |
| 430 | E K 4 3 / B 9 8 2 | 4, 3 | Til 3 stik giver den bedste linje 100,0 %, linjen med flest stik kun 91,5 %. |
| 431 | E D 8 5 / B 4 3 2 | 4, 3 | Til 3 stik giver den bedste linje 81,1 %, linjen med flest stik kun 76,3 %. |
| 438 | K 5 4 3 / B 10 8 2 | 3, 2 | Til 2 stik giver den bedste linje 92,4 %, linjen med flest stik kun 83,9 %. |
| 440 | E D 10 8 / 3 2 | 4, 3, 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 441 | E D 9 8 / 3 2 | 3, 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 442 | K D 9 8 / 3 2 | 3 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 445 | E B 9 8 / 3 2 | 3, 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 446 | E 10 9 8 / 3 2 | 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 448 | D B 9 8 / 3 2 | 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 450 | K 10 9 8 / 3 2 | 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 451 | D 10 9 8 / 3 2 | 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 452 | E 7 6 5 4 3 / D 10 2 | 6, 5, 4 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 455 | E K 9 8 4 / B 3 2 | 5, 4 | Til 4 stik giver den bedste linje 96,1 %, linjen med flest stik kun 89,6 %. |
| 456 | B 9 8 4 3 / E K 2 | 5, 4 | Til 4 stik giver den bedste linje 96,1 %, linjen med flest stik kun 87,6 %. |
| 459 | E D 10 8 5 / 4 3 2 | 5, 4, 3, 2 | Til 4 stik giver den bedste linje 65,6 %, linjen med flest stik kun 62,7 %. |
| 462 | E D B 9 5 4 3 / 2 | 7, 6, 5 | Til 6 stik giver den bedste linje 79,1 %, linjen med flest stik kun 76,3 %. |
| 463 | K D B 9 5 4 3 / 2 | 6, 5 | Til 5 stik giver den bedste linje 98,0 %, linjen med flest stik kun 96,1 %. |
| 469 | E K 9 8 3 / B 2 | 5, 4 | Til 4 stik giver den bedste linje 72,7 %, linjen med flest stik kun 70,2 %. |
| 470 | E D 9 8 3 / B 2 | 5, 4 | Til 4 stik giver den bedste linje 71,5 %, linjen med flest stik kun 70,2 %. |
| 485 | E 6 5 4 3 / D 10 9 2 | 5, 4 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 496 | E D 10 8 / 4 3 2 | 4, 3, 2 | Til 3 stik giver den bedste linje 53,0 %, linjen med flest stik kun 50,9 %. |
| 497 | E D 9 8 / 4 3 2 | 3, 2 | Til 2 stik giver den bedste linje 90,8 %, linjen med flest stik kun 89,2 %. |
| 499 | E B 9 8 / 4 3 2 | 3, 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 500 | K B 9 8 / 4 3 2 | 3, 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 501 | K 10 9 8 / 4 3 2 | 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 506 | E K 9 8 4 3 / B 2 | 6, 5 | Til 5 stik giver den bedste linje 87,6 %, linjen med flest stik kun 84,8 %. |
| 515 | E 10 9 8 / 2 | 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 516 | D B 9 8 / 2 | 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 517 | D B 10 8 / 2 | 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 518 | D 10 9 8 / 2 | 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 526 | E D 7 6 5 4 3 / 10 2 | 7, 6, 5 | Til 6 stik giver den bedste linje 78,0 %, linjen med flest stik kun 71,8 %. |
| 535 | E K 9 8 / B 3 2 | 4, 3 | Til 3 stik giver den bedste linje 83,9 %, linjen med flest stik kun 78,3 %. |
| 536 | E K 3 2 / B 9 8 | 4, 3 | Til 3 stik giver den bedste linje 78,3 %, linjen med flest stik kun 77,0 %. |
| 538 | E D 9 8 / B 3 2 | 4, 3 | Til 3 stik giver den bedste linje 79,0 %, linjen med flest stik kun 77,6 %. |
| 547 | D B 8 7 / 2 | 2, 1 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 548 | D 10 8 7 / 2 | 2, 1 | Til 1 stik giver den bedste linje 15,1 %, linjen med flest stik kun 14,3 %. |
| 551 | E D 7 5 4 / B 3 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 76,3 %, linjen med flest stik kun 70,7 %. |
| 559 | E K B 9 8 / 3 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 77,0 %, linjen med flest stik kun 75,8 %. |
| 562 | K D 9 3 2 / B 8 | 4, 3 | Til 3 stik giver den bedste linje 100,0 %, linjen med flest stik kun 95,2 %. |
| 563 | E K 8 6 5 / B 4 3 2 | 5, 4 | Til 4 stik giver den bedste linje 100,0 %, linjen med flest stik kun 95,2 %. |
| 565 | E K 8 6 5 / 10 4 3 2 | 5, 4 | Til 4 stik giver den bedste linje 95,2 %, linjen med flest stik kun 90,4 %. |
| 571 | E D 5 4 3 2 / B 9 | 5, 4 | Til 4 stik giver den bedste linje 98,0 %, linjen med flest stik kun 96,1 %. |
| 573 | K D 5 4 3 2 / B 9 | 5, 4 | Til 4 stik giver den bedste linje 98,0 %, linjen med flest stik kun 96,1 %. |
| 576 | E B 10 8 5 4 3 / 2 | 6, 5, 4 | Til 5 stik giver den bedste linje 87,6 %, linjen med flest stik kun 84,8 %. |
| 577 | E 10 9 8 5 4 3 / 2 | 5, 4 | Til 4 stik giver den bedste linje 98,0 %, linjen med flest stik kun 96,1 %. |
| 578 | E D 9 6 5 4 3 / B 2 | 7, 6 | Til 6 stik giver den bedste linje 95,2 %, linjen med flest stik kun 90,4 %. |
| 580 | D 10 9 6 5 4 3 / E 2 | 7, 6 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 588 | K 9 8 7 / 4 3 2 | 2, 1 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 589 | D 9 8 7 / 4 3 2 | 2, 1 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 591 | E D 9 8 / B 4 3 2 | 4, 3 | Til 3 stik giver den bedste linje 97,2 %, linjen med flest stik kun 89,6 %. |
| 597 | E K 8 6 5 4 / B 3 2 | 6, 5 | Til 5 stik giver den bedste linje 100,0 %, linjen med flest stik kun 95,2 %. |
| 600 | E K 8 6 5 4 / 10 3 2 | 6, 5 | Til 5 stik giver den bedste linje 95,2 %, linjen med flest stik kun 90,4 %. |
| 603 | E K 4 3 2 / B 9 8 | 5, 4, 3 | Til 4 stik giver den bedste linje 87,6 %, linjen med flest stik kun 76,3 %. |
| 613 | E 10 9 7 6 / D 5 4 3 2 | 5, 4 | Til 4 stik giver den bedste linje 100,0 %, linjen med flest stik kun 89,0 %. |
| 614 | E D 10 8 / 5 4 3 2 | 4, 3, 2 | Til 3 stik giver den bedste linje 67,5 %, linjen med flest stik kun 64,7 %. |
| 615 | K B 9 8 / 5 4 3 2 | 3, 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 616 | E 10 9 8 / 5 4 3 2 | 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 617 | K 10 9 8 / 5 4 3 2 | 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 619 | K 9 8 7 6 / 5 4 3 2 | 4, 3, 2 | Til 3 stik giver den bedste linje 71,8 %, linjen med flest stik kun 65,6 %. |
| 626 | E D 6 4 3 / B 9 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 82,0 %, linjen med flest stik kun 76,3 %. |
| 627 | B 9 8 7 / E D 2 | 4, 3 | Til 3 stik giver den bedste linje 77,8 %, linjen med flest stik kun 77,0 %. |
| 628 | 10 9 8 7 / E D 2 | 4, 3 | Til 3 stik giver den bedste linje 61,9 %, linjen med flest stik kun 60,7 %. |
| 634 | K 9 8 7 / B 4 3 2 | 3, 2 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 637 | E K 7 3 2 / B 9 8 | 5, 4 | Til 4 stik giver den bedste linje 97,2 %, linjen med flest stik kun 89,6 %. |
| 640 | D B 9 8 7 / E 2 | 5, 4 | Til 4 stik giver den bedste linje 63,0 %, linjen med flest stik kun 61,8 %. |
| 641 | K 9 8 7 5 / B 4 3 2 | 4, 3 | Til 3 stik giver den bedste linje 93,8 %, linjen med flest stik kun 89,0 %. |
| 644 | E 6 5 4 3 2 / D 10 9 | 6, 5, 4 | Til 5 stik giver den bedste linje 78,0 %, linjen med flest stik kun 75,4 %. |
| 649 | D 7 6 5 4 3 2 / E 10 | 6, 5 | Til 5 stik giver den bedste linje 100,0 %, linjen med flest stik kun 95,2 %. |
| 650 | E K 5 4 3 2 / B 9 8 | 6, 5 | Til 5 stik giver den bedste linje 100,0 %, linjen med flest stik kun 95,2 %. |
| 653 | E B 4 3 2 / K 9 8 7 | 5, 4 | Til 4 stik giver den bedste linje 100,0 %, linjen med flest stik kun 95,2 %. |
| 654 | 9 8 7 6 4 3 / E K 2 | 6, 5 | Til 5 stik giver den bedste linje 95,2 %, linjen med flest stik kun 90,4 %. |
| 656 | B 7 4 3 2 / E D 6 | 5, 4, 3 | Til 4 stik giver den bedste linje 76,3 %, linjen med flest stik kun 70,7 %. |

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
| 171 | D B 8 4 / 3 2 | 2, 1 | Falder esset i første runde, er kipning bedst (71,7 % mod 37,3 %). |
| 172 | D 10 8 4 / 3 2 | 2, 1 | Falder esset i første runde, er kipning bedst (73,6 % mod 27,8 %). |
| 173 | B 10 8 4 / 3 2 | 1 | Falder esset i første runde, er kipning bedst (90,9 % mod 50,0 %). |
| 199 | D 9 6 5 / B 4 3 2 | 2, 1 | Falder esset i første runde, er kipning bedst (55,8 % mod 28,8 %). |
| 213 | E 10 9 5 4 / K 3 2 | 5, 4, 3 | Falder damen i første runde, er kipning bedst (62,5 % mod 37,5 %). |
| 219 | B 10 9 5 4 / E 3 2 | 4, 3 | Falder kongen i første runde, er kipning bedst (87,6 % mod 79,3 %). |
| 220 | E 10 6 5 4 / 9 3 2 | 3, 2 | Falder kongen i første runde, er kipning bedst (100,0 % mod 61,5 %). |
| 221 | D B 9 6 5 / 4 3 2 | 3, 2 | Falder esset i første runde, er kipning bedst (73,1 % mod 28,8 %). |
| 223 | D 10 9 5 4 / B 3 2 | 3 | Falder esset i første runde, er kipning bedst (100,0 % mod 34,7 %). |
| 224 | K 10 9 6 5 / 4 3 2 | 3, 2 | Falder damen i første runde, er kipning bedst (78,8 % mod 28,8 %). |
| 225 | K 10 6 5 4 / 9 3 2 | 3, 2 | Falder damen i første runde, er kipning bedst (100,0 % mod 90,4 %). |
| 230 | E B 6 5 4 3 / 10 2 | 5, 4 | Falder kongen i første runde, er kipning bedst (91,7 % mod 79,3 %). |
| 231 | E B 10 7 6 5 / 4 3 2 | 5, 4 | Falder kongen i første runde, er kipning bedst (67,3 % mod 57,7 %). |
| 241 | E K 10 9 4 / 3 2 | 5, 4, 3 | Falder damen i første runde, er kipning bedst (64,7 % mod 59,0 %). |
| 249 | E B 10 9 4 / 3 2 | 4, 3 | Falder kongen i første runde, er kipning bedst (47,0 % mod 20,0 %). |
| 284 | E K 10 9 5 4 / 3 2 | 6, 5, 4 | Falder damen i første runde, er kipning bedst (100,0 % mod 37,5 %). |
| 290 | E B 9 6 5 4 / 3 2 | 5, 4, 3 | Falder kongen i første runde, er kipning bedst (100,0 % mod 80,8 %). |
| 292 | D B 9 6 5 4 / 3 2 | 4, 3, 2 | Falder esset i første runde, er kipning bedst (69,2 % mod 28,8 %). |
| 310 | D 9 8 5 / 4 3 2 | 2, 1 | Falder knægten i første runde, er kipning bedst (68,4 % mod 53,3 %). |
| 311 | B 10 8 5 / 4 3 2 | 1 | Falder esset i første runde, er kipning bedst (68,1 % mod 48,6 %). |
| 329 | E 9 8 3 / 10 2 | 2 | Falder kongen i første runde, er kipning bedst (40,2 % mod 26,4 %). |
| 330 | K 8 7 6 5 / 10 4 3 2 | 4, 3 | Falder damen i første runde, er kipning bedst (100,0 % mod 35,3 %). |
| 337 | E D 9 8 4 / 3 2 | 4, 3, 2 | Falder knægten i første runde, er kipning bedst (81,7 % mod 69,9 %). |
| 339 | E B 10 8 4 / 3 2 | 4, 3, 2 | Falder kongen i første runde, er kipning bedst (93,0 % mod 50,9 %). |
| 340 | E B 9 8 4 / 3 2 | 4, 3, 2 | Falder kongen i første runde, er kipning bedst (93,0 % mod 65,0 %). |
| 341 | E B 8 4 3 / 10 2 | 4, 3, 2 | Falder kongen i første runde, er kipning bedst (69,9 % mod 58,1 %). |
| 342 | E B 8 4 3 / 9 2 | 4, 3, 2 | Falder kongen i første runde, er kipning bedst (93,0 % mod 65,0 %). |
| 343 | E 10 9 8 4 / 3 2 | 3 | Falder kongen i første runde, er kipning bedst (78,7 % mod 66,6 %). |
| 349 | E 10 9 5 4 3 / K 2 | 6, 5, 4 | Falder damen i første runde, er kipning bedst (100,0 % mod 37,5 %). |
| 352 | E B 10 5 4 3 / 9 2 | 5, 4 | Falder kongen i første runde, er kipning bedst (100,0 % mod 79,3 %). |
| 354 | E 10 5 4 / K 8 3 2 | 4, 3 | Falder damen i første runde, er kipning bedst (100,0 % mod 37,5 %). |
| 366 | E 10 6 5 4 / K 9 3 2 | 5, 4 | Falder damen i første runde, er kipning bedst (64,7 % mod 35,3 %). |
| 371 | E K 8 5 4 / 10 3 2 | 5, 4, 3 | Falder damen i første runde, er kipning bedst (100,0 % mod 37,5 %). |
| 407 | E K 10 9 6 5 / 4 3 2 | 6, 5 | Falder damen i første runde, er kipning bedst (64,7 % mod 35,3 %). |
| 415 | E 9 6 5 4 3 / B 2 | 5, 4, 3 | Falder kongen i første runde, er kipning bedst (100,0 % mod 70,6 %). |
| 434 | E K 8 5 / 10 4 3 2 | 4, 3 | Falder damen i første runde, er kipning bedst (100,0 % mod 37,5 %). |
| 436 | E B 8 5 / 10 4 3 2 | 3, 2 | Falder kongen i første runde, er kipning bedst (55,8 % mod 28,8 %). |
| 439 | E 10 9 8 5 4 / 3 2 | 4, 3 | Falder kongen i første runde, er kipning bedst (91,7 % mod 79,3 %). |
| 443 | K 9 7 6 5 / D 4 3 2 | 4, 3 | Falder knægten i første runde, er kipning bedst (64,7 % mod 35,3 %). |
| 444 | E 9 7 6 5 / B 4 3 2 | 4 | Falder kongen i første runde, er kipning bedst (100,0 % mod 35,3 %). |
| 454 | K 8 7 6 5 4 / 10 3 2 | 5, 4, 3 | Falder damen i første runde, er kipning bedst (100,0 % mod 35,3 %). |
| 457 | E 10 5 4 3 / K 8 2 | 5, 4, 3 | Falder damen i første runde, er kipning bedst (100,0 % mod 37,5 %). |
| 467 | D 8 7 6 5 4 3 / B 2 | 5 | Falder esset i første runde, er kipning bedst (100,0 % mod 35,3 %). |
| 478 | E B 9 7 6 5 / 4 3 2 | 5, 4 | Falder kongen i første runde, er kipning bedst (64,7 % mod 35,3 %). |
| 479 | K 10 9 7 6 5 / 4 3 2 | 5, 4, 3 | Falder damen i første runde, er kipning bedst (100,0 % mod 35,3 %). |
| 481 | E B 10 9 6 5 4 / 3 2 | 6 | Falder kongen i første runde, er kipning bedst (67,3 % mod 57,7 %). |
| 484 | E K 10 9 6 / 5 4 3 2 | 5, 4 | Falder damen i første runde, er kipning bedst (64,7 % mod 35,3 %). |
| 487 | E B 9 7 6 / 5 4 3 2 | 4, 3 | Falder kongen i første runde, er kipning bedst (64,7 % mod 35,3 %). |
| 489 | D 10 9 7 6 / 5 4 3 2 | 3 | Falder esset i første runde, er kipning bedst (100,0 % mod 68,6 %). |
| 498 | K D 9 8 / 4 3 2 | 3, 2 | Falder knægten i første runde, er kipning bedst (85,0 % mod 70,1 %). |
| 529 | E 10 6 5 4 3 / K 9 2 | 6, 5 | Falder damen i første runde, er kipning bedst (64,7 % mod 35,3 %). |
| 531 | E 9 7 6 5 4 / B 3 2 | 5, 4 | Falder kongen i første runde, er kipning bedst (100,0 % mod 35,3 %). |
| 546 | E 5 4 3 2 / B 10 9 | 4, 3 | Falder kongen i første runde, er kipning bedst (100,0 % mod 61,5 %). |
| 553 | E B 8 7 4 / 10 3 2 | 4, 3 | Falder kongen i første runde, er kipning bedst (55,8 % mod 28,8 %). |
| 554 | E 9 8 7 4 / B 3 2 | 4, 3 | Falder kongen i første runde, er kipning bedst (23,1 % mod 11,5 %). |
| 555 | E 8 7 5 4 / 10 3 2 | 3, 2 | Falder kongen i første runde, er kipning bedst (100,0 % mod 87,8 %). |
| 567 | D B 8 6 5 / 10 4 3 2 | 3 | Falder esset i første runde, er kipning bedst (100,0 % mod 52,2 %). |
| 581 | E B 9 7 6 5 4 / 3 2 | 6, 5 | Falder kongen i første runde, er kipning bedst (100,0 % mod 35,3 %). |
| 583 | D B 9 7 6 5 4 / 3 2 | 5, 4 | Falder esset i første runde, er kipning bedst (100,0 % mod 68,6 %). |
| 633 | E 9 8 7 / B 4 3 2 | 3, 2 | Falder kongen i første runde, er kipning bedst (23,1 % mod 11,5 %). |
| 635 | D 9 8 7 / B 4 3 2 | 2 | Falder esset i første runde, er kipning bedst (100,0 % mod 37,5 %). |
