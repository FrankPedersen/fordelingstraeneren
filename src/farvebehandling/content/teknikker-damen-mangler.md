# Teknik pr. kombination: damen mangler

Genereret af `scripts/techniques.ts` til godkendelse (åbent punkt i specen: "Teknik pr. case"). Hver kombination får én teknik, og teknikken er rummet i paladset. Reglerne står i `src/farvebehandling/techniques.ts`:

1. **Sikkerhedsspil:** til et lavere mål giver linjen med flest stik i gennemsnit mere end 0,5 procentpoint mindre end den bedste linje.
2. **Hovedmålet** er det mål, hvor valget af linje betyder mest. Mål under 25 % tæller kun, hvis alle mål ligger under.
3. **Hovedlinjens første kipning:** to eller flere af modpartens kort over kortet = dobbelt kipning; spilles der mod det højeste kort, der er tilbage i hånden = spil mod honnør; ellers enkelt kipning, med 8 kort eller flere fald eller kip.
4. **Små kort fra begge hænder** er en kipning, når det laveste kort har en eller to af modpartens kort over sig; ellers et sikkerhedsspil.
5. **Ingen kipning:** fald eller kip.

Begrænset valg kræver to ligeværdige honnører hos modparten og forekommer ikke på siden.

## Enkelt kipning (11)

| Rang | Hånd / bordet | Mål | Begrundelse |
| --- | --- | --- | --- |
| 6 | E B 5 4 3 / K 2 | 5, 4, 3 | Kipning mod knægten med 7 kort. |
| 8 | E K B 5 4 3 / 2 | 6, 5, 4, 3 | Kipning mod knægten med 7 kort. |
| 10 | B 10 4 3 / E K 2 | 4 | Knægten spilles ud og løber med 7 kort. |
| 11 | E B 10 4 3 / K 2 | 5, 4 | Kipning mod knægten med 7 kort. |
| 26 | E B 9 3 / K 2 | 4, 3 | Kipning mod knægten med 6 kort. |
| 34 | E K B 10 / 4 3 2 | 4 | Små kort fra begge hænder kipper med 10'eren med 7 kort. |
| 36 | E K 9 / B 3 2 | 3 | Knægten spilles ud og løber med 6 kort. |
| 56 | E K B 10 / 2 | 4 | Små kort fra begge hænder kipper med 10'eren med 5 kort. |
| 57 | E K 3 2 / B 10 9 | 4 | Knægten spilles ud og løber med 7 kort. |
| 61 | E K B 10 9 / 3 2 | 5 | Små kort fra begge hænder kipper med 9'eren med 7 kort. |
| 71 | E K 9 8 / B 2 | 4, 3 | Knægten spilles ud og løber med 6 kort. |

## Fald eller kip (30)

| Rang | Hånd / bordet | Mål | Begrundelse |
| --- | --- | --- | --- |
| 3 | E K 4 / B 3 2 | 3 | Linjen spiller på fald med 6 kort. |
| 9 | B 7 6 5 4 / E K 3 2 | 5, 4 | Linjen spiller på fald med 9 kort. |
| 12 | E K B 10 5 4 / 3 2 | 6, 5 | Kipning mod knægten med 8 kort: fald eller kip. |
| 18 | E B 8 7 6 / K 5 4 3 2 | 5 | Linjen spiller på fald med 10 kort. |
| 21 | E B 9 5 4 / K 3 2 | 5, 4, 3 | Kipning mod knægten med 8 kort: fald eller kip. |
| 27 | E K B 3 2 / – | 3 | Linjen spiller på fald med 5 kort. |
| 29 | E K B 9 5 4 / 3 2 | 6, 5, 4 | Kipning mod knægten med 8 kort: fald eller kip. |
| 37 | E B 9 5 4 / K 10 3 2 | 5 | Linjen spiller på fald med 9 kort. |
| 38 | E B 6 5 4 / K 9 3 2 | 5 | Linjen spiller på fald med 9 kort. |
| 39 | E 9 6 5 4 / K B 3 2 | 5 | Linjen spiller på fald med 9 kort. |
| 40 | B 10 9 5 4 / E K 3 2 | 5 | Linjen spiller på fald med 9 kort. |
| 43 | E K B 5 4 3 2 / – | 6, 5, 4 | Linjen spiller på fald med 7 kort. |
| 44 | E B 8 7 6 5 4 / K 3 2 | 7 | Linjen spiller på fald med 10 kort. |
| 47 | E K B 10 / 5 4 3 2 | 4 | Små kort fra begge hænder kipper med 10'eren med 8 kort: fald eller kip. |
| 48 | E K 9 6 5 4 / B 3 2 | 6 | Linjen spiller på fald med 9 kort. |
| 55 | E K B 10 3 2 / – | 6, 5 | Linjen spiller på fald med 6 kort. |
| 58 | E K B 10 9 4 3 / 2 | 7 | Kipning mod knægten med 8 kort: fald eller kip. |
| 60 | E B 8 5 4 3 / K 2 | 6, 5, 4 | Kipning mod knægten med 8 kort: fald eller kip. |
| 62 | E B 6 5 4 3 / K 9 2 | 6 | Linjen spiller på fald med 9 kort. |
| 63 | E B 9 6 5 / K 10 4 3 2 | 5 | Linjen spiller på fald med 10 kort. |
| 64 | E K B 10 2 / – | 4 | Linjen spiller på fald med 5 kort. |
| 67 | E K 4 3 2 / B 10 9 | 5 | Knægten spilles ud og løber med 8 kort: fald eller kip. |
| 72 | E K 9 7 6 5 / B 4 3 2 | 6 | Linjen spiller på fald med 10 kort. |
| 75 | E K 9 7 6 / B 5 4 3 2 | 5 | Linjen spiller på fald med 10 kort. |
| 76 | K 9 6 5 4 3 / E B 10 2 | 6 | Linjen spiller på fald med 10 kort. |
| 78 | E K B 8 4 3 2 / – | 6, 5, 4 | Linjen spiller på fald med 7 kort. |
| 79 | E K 5 4 3 2 / B 10 9 | 6 | Linjen spiller på fald med 9 kort. |
| 80 | E K 9 7 6 5 4 / B 3 2 | 7 | Linjen spiller på fald med 10 kort. |
| 82 | E K B 9 8 7 3 / 2 | 7, 6 | Kipning mod knægten med 8 kort: fald eller kip. |
| 85 | K 6 5 4 3 2 / E B 9 8 | 6 | Linjen spiller på fald med 10 kort. |

## Spil mod honnør (5)

| Rang | Hånd / bordet | Mål | Begrundelse |
| --- | --- | --- | --- |
| 1 | E K 5 4 / B 3 2 | 3 | Der spilles mod knægten, som er det højeste kort, der er tilbage i hånden. |
| 5 | B 5 4 3 / E K 2 | 3 | Der spilles mod knægten, som er det højeste kort, der er tilbage i hånden. |
| 13 | E K 9 4 / B 3 2 | 4, 3 | Der spilles mod knægten, som er det højeste kort, der er tilbage i hånden. |
| 25 | E K 9 3 / B 2 | 3 | Der spilles mod knægten, som er det højeste kort, der er tilbage i hånden. |
| 49 | B 9 8 3 / E K 2 | 4, 3 | Der spilles mod knægten, som er det højeste kort, der er tilbage i hånden. |

## Dobbelt kipning (6)

| Rang | Hånd / bordet | Mål | Begrundelse |
| --- | --- | --- | --- |
| 23 | E B 9 4 3 / K 2 | 5, 4, 3 | Der kippes mod 9'eren, og 2 af modpartens kort er højere. |
| 24 | K B 9 4 3 / E 2 | 5, 4, 3 | Der kippes mod 9'eren, og 2 af modpartens kort er højere. |
| 33 | E K B 9 4 3 / 2 | 6, 5, 4, 3 | Der kippes mod 9'eren, og 2 af modpartens kort er højere. |
| 41 | E K B 9 / 3 2 | 4, 3 | Små kort fra begge hænder kipper med 9'eren, og 2 af modpartens kort er højere. |
| 42 | E B 3 2 / K 9 | 3 | Små kort fra begge hænder kipper med 9'eren, og 2 af modpartens kort er højere. |
| 77 | E K 9 8 7 3 / B 2 | 6, 5 | Der kippes mod 9'eren, og 2 af modpartens kort er højere. |

## Sikkerhedsspil (33)

| Rang | Hånd / bordet | Mål | Begrundelse |
| --- | --- | --- | --- |
| 2 | E B 3 2 / K 5 4 | 4, 3 | Til 3 stik giver den bedste linje 77,0 %, linjen med flest stik kun 69,0 %. |
| 4 | E K B 5 / 4 3 2 | 4, 3 | Til 3 stik giver den bedste linje 77,0 %, linjen med flest stik kun 69,0 %. |
| 7 | E K 10 5 / 4 3 2 | 4, 3 | Til 3 stik giver den bedste linje 56,5 %, linjen med flest stik kun 52,4 %. |
| 14 | E K 4 3 / B 9 2 | 4, 3 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 15 | E B 9 4 / K 3 2 | 4, 3 | Til 3 stik giver den bedste linje 84,7 %, linjen med flest stik kun 78,3 %. |
| 16 | K 9 4 3 / E B 2 | 4, 3 | Til 3 stik giver den bedste linje 83,9 %, linjen med flest stik kun 82,6 %. |
| 17 | E B 5 4 / K 9 3 2 | 4, 3 | Til 3 stik giver den bedste linje 100,0 %, linjen med flest stik kun 97,2 %. |
| 19 | E K B 10 4 3 / 2 | 6, 5, 4 | Til 5 stik giver den bedste linje 86,4 %, linjen med flest stik kun 85,2 %. |
| 20 | E K 9 5 4 / B 3 2 | 5, 4 | Til 4 stik giver den bedste linje 96,1 %, linjen med flest stik kun 79,1 %. |
| 22 | E K 9 4 3 / B 2 | 5, 4, 3 | Til 3 stik giver den bedste linje 98,8 %, linjen med flest stik kun 93,9 %. |
| 28 | E K 9 5 / B 4 3 2 | 4, 3 | Til 3 stik giver den bedste linje 100,0 %, linjen med flest stik kun 91,5 %. |
| 30 | E K 5 4 3 / B 9 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 87,6 %, linjen med flest stik kun 76,3 %. |
| 31 | E B 5 4 3 / K 9 2 | 5, 4 | Til 4 stik giver den bedste linje 96,1 %, linjen med flest stik kun 87,6 %. |
| 32 | E 9 5 4 3 / K B 2 | 5, 4 | Til 4 stik giver den bedste linje 96,1 %, linjen med flest stik kun 93,3 %. |
| 35 | E K 9 5 4 3 / B 2 | 6, 5, 4 | Til 4 stik giver den bedste linje 100,0 %, linjen med flest stik kun 98,0 %. |
| 45 | E K B 9 / 4 3 2 | 4, 3 | Til 3 stik giver den bedste linje 84,7 %, linjen med flest stik kun 78,3 %. |
| 46 | E B 10 9 3 / K 2 | 5 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 50 | E K 8 5 / B 4 3 2 | 4, 3 | Til 3 stik giver den bedste linje 92,4 %, linjen med flest stik kun 86,7 %. |
| 51 | E K 4 3 / B 9 8 2 | 4, 3 | Til 3 stik giver den bedste linje 100,0 %, linjen med flest stik kun 91,5 %. |
| 52 | E K 9 8 4 / B 3 2 | 5, 4 | Til 4 stik giver den bedste linje 96,1 %, linjen med flest stik kun 89,6 %. |
| 53 | B 9 8 4 3 / E K 2 | 5, 4 | Til 4 stik giver den bedste linje 96,1 %, linjen med flest stik kun 87,6 %. |
| 54 | E K 9 8 3 / B 2 | 5, 4 | Til 4 stik giver den bedste linje 72,7 %, linjen med flest stik kun 70,2 %. |
| 59 | E K 9 8 4 3 / B 2 | 6, 5 | Til 5 stik giver den bedste linje 87,6 %, linjen med flest stik kun 84,8 %. |
| 65 | E K 9 8 / B 3 2 | 4, 3 | Til 3 stik giver den bedste linje 83,9 %, linjen med flest stik kun 78,3 %. |
| 66 | E K 3 2 / B 9 8 | 4, 3 | Til 3 stik giver den bedste linje 78,3 %, linjen med flest stik kun 77,0 %. |
| 68 | E 10 8 3 / K B 9 2 | 4 | Små kort fra begge hænder giver et stik væk for at sikre resten. |
| 69 | E K B 9 8 / 3 2 | 5, 4, 3 | Til 4 stik giver den bedste linje 77,0 %, linjen med flest stik kun 75,8 %. |
| 70 | E K 8 6 5 / B 4 3 2 | 5, 4 | Til 4 stik giver den bedste linje 100,0 %, linjen med flest stik kun 95,2 %. |
| 73 | E K 8 6 5 4 / B 3 2 | 6, 5 | Til 5 stik giver den bedste linje 100,0 %, linjen med flest stik kun 95,2 %. |
| 74 | E K 4 3 2 / B 9 8 | 5, 4, 3 | Til 4 stik giver den bedste linje 87,6 %, linjen med flest stik kun 76,3 %. |
| 81 | E K 7 3 2 / B 9 8 | 5, 4 | Til 4 stik giver den bedste linje 97,2 %, linjen med flest stik kun 89,6 %. |
| 83 | E K 5 4 3 2 / B 9 8 | 6, 5 | Til 5 stik giver den bedste linje 100,0 %, linjen med flest stik kun 95,2 %. |
| 84 | E B 4 3 2 / K 9 8 7 | 5, 4 | Til 4 stik giver den bedste linje 100,0 %, linjen med flest stik kun 95,2 %. |

## Begrænset valg (0)

Ingen kombinationer.
