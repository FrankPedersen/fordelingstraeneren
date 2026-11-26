# Håndevaluering i bridge — en datadrevet model

Udledt ved dobbeltdummy-simulering. Alle tal i dette dokument stammer fra
egne kørsler; datasæt og kildekode ligger i `data/` og `scripts/`.

**Datagrundlag**

| Datasæt | n | Indhold |
|---|---|---|
| `fit_deals.csv` | 11.168 | N-S har 8+ korts major-fit. Facit = stik i trumffarven |
| `nt_balanced_deals.csv` | 4.000 | Begge hænder balancerede, ingen major-fit. Facit = sansstik |
| `nt_anyshape_deals.csv` | 5.024 | Ingen major-fit, fri fordeling. Facit = sansstik |
| `leads_suit.csv` | 3.100 fordelinger | Alle mulige udspil mod 4 i major |
| `leads_notrump.csv` | 3.100 fordelinger | Alle mulige udspil mod 3NT |
| `technique_*.csv` | 896 + 896 | Positionsafhængighed og trumfværdi |

Værktøj: `endplay` 0.5.12 (Bo Haglunds DDS). Facit er antal stik ved
perfekt spil fra begge sider.

---

## 1. Hovedmodellen (farvekontrakt med bekræftet 8+ fit)

### Enkelthåndsversion — det du kan regne ved bordet

```
p = honnørpoint
  + 1½ pr. trumf du selv har ud over 4, minus 1½ pr. trumf under 4 (for parret det samme som 1½ pr. trumf ud over 8)
  + kortfarvepoint: renonce 5, singleton 3, doubleton 1
  − 1 per konge over for makkers viste korthed
```

**Honnørpoint** = `5·E + 3·K + 1½·D + ½·B + ¼·T`

Genvej, matematisk identisk: **hp + 1 per es − ½ per dame − ½ per knægt + ¼ per tier**

De to fordelingsled må først lægges til, når fittet er bekræftet.

### Samlet vurdering

**P = din p + makkers p**

> **Antal stik ≈ 0,31 × P + 0,75**

| P | Gns. stik | 4M holder | 6M | 7M |
|---|---|---|---|---|
| 24 | 8,1 | 7 % | – | – |
| 26 | 8,8 | 22 % | – | – |
| **28½** | 9,4 | **50 %** | 1 % | – |
| 30 | 10,0 | 74 % | 4 % | – |
| 32 | 10,6 | 91 % | 13 % | 1 % |
| 34 | 11,1 | 98 % | 33 % | 5 % |
| 36 | 11,7 | 99 % | 64 % | 13 % |
| 38 | 11,9 | 99 % | 74 % | 24 % |
| 40 | 12,3 | 100 % | 90 % | 44 % |

**Grænser:** udgang P ≥ 28½ · slem P ≥ 35 · storeslem P ≥ 41 (og kontroltjek)

**Kontroltjek:** nøglekort er de fire es og trumfkongen. Lilleslem kræver, at
parret højst mangler ét nøglekort: ved P ≥ 35 gav 12 stik i 87,8 % uden
manglende es, 67,7 % med ét manglende es og 29,1 % med to, og ét manglende es
uden trumfkongen kun 30,6 % (36 fordelinger). Storeslem kræver alle fem: med
alle fire es gav 13 stik i 73,8 % med trumfkongen og 38,9 % uden (P ≥ 38).

**Præstation:** R² = 0,794, middelfejl 0,74 stik, udgangsbeslutningen korrekt
i 87,5 % af tilfældene (mod 82,5 % for ren hp med udgang fra 23 hp; 25 hp
giver 79,3 %).

### Hvad makker skal have

| Du har | Makker skal have til udgang |
|---|---|
| 12 | 16½ |
| 14 | 14½ |
| 16 | 12½ |
| 18 | 10½ |
| 21 | 7½ |
| 24 | 4½ |

---

## 2. Sanskontrakt — en anden model

**Farveskalaen bruges ikke i sans.** Den er materialets dårligste dér.

```
Point i sans = hp (4-3-2-1) + ¼ per tier
Ingen længdepoint. Ingen fladhedsstraf.
I stedet tjekkes alle fire farver for stoppere.
```

Datadrevne honnørværdier i sans, skaleret til es = 4:
**A 4,00 · K 2,62 · Q 1,47 · J 0,83 · T 0,38**

### Længdepoint i sans er værd nul

| Element | hp-ækvivalent |
|---|---|
| Femkortsfarve | −0,07 |
| Sekskortsfarve | −0,20 |
| Syvkortsfarve | −0,31 |
| Honnørpoint i den lange farve (ud over hp) | +0,01 |
| 4-3-3-3-fordeling | −0,05 |
| Løbefarve (8+ kort, 2+ topkort) | −0,06 |

### Det der faktisk betyder noget: stoppere

Ved 24–26 hp:

| | Gns. stik | 3NT holder |
|---|---|---|
| 3 farver stoppet | 7,97 | **31 %** |
| 4 farver stoppet | 8,74 | **60 %** |

Per stoppet farve: +0,31 hp-ækvivalent i regressionen, men den direkte
måling viser 29 procentpoint. Den ustoppede farve er det eneste forhold i
sansvurdering, der kan måle sig med selve pointtallet.

---

## 3. Hvorfor modellen ser ud som den gør

### Honnørvægtene

Datadrevne værdier, skaleret til es = 4,00:

| | A | K | Q | J | T |
|---|---|---|---|---|---|
| Farvekontrakt | 4,00 | 2,40 | 1,21 | 0,63 | 0,27 |
| Sanskontrakt | 4,00 | 2,62 | 1,47 | 0,83 | 0,38 |

4-3-2-1 overvurderer damer og knægte i begge tilfælde, mest i farvekontrakt.

Test af hele modellen med forskellige offentliggjorte skalaer:

| Skala | R² farve | Udgang | R² sans |
|---|---|---|---|
| 5-3-1½-½-¼ (denne model) | **0,794** | **87,5 %** | 0,825 |
| BUM-RAP 4,5-3-1,5-0,75-0,25 | 0,791 | 87,4 % | 0,840 |
| Four Aces / Zar HP (skaleret) | 0,789 | 87,4 % | 0,835 |
| Bamberger 7-5-3-1 | 0,780 | 86,9 % | — |
| Robertson 7-5-3-2-1 | 0,773 | 86,7 % | **0,847** |
| Milton Work 4-3-2-1 | 0,764 | 86,1 % | 0,839 |

Bemærkning: modellens egen skala er **dårligst i sans**. Skalaen er
kontrakttype-specifik.

### Kortfarvepoint: 5/3/1, ikke 3/2/1

Fri regression, alt andet konstant:

| Korthed | Stik | hp-ækvivalent |
|---|---|---|
| Renonce | +1,37 | 4,8 |
| Singleton | +0,69 | 2,4 |
| Doubleton | +0,21 | 0,7 |

Skalaer afprøvet i formlen:

| Skala | R² | Udgang |
|---|---|---|
| 5/3/1, begge hænder | **0,790** | **87,3 %** |
| 4/2½/1, begge hænder | 0,788 | 87,3 % |
| 5/3/1 kort hånd + 3/2/1 lang hånd | 0,781 | 87,1 % |
| 3/2/1, begge hænder | 0,779 | 86,8 % |
| 5/3/1, kun i den korte hånd | 0,744 | 85,7 % |

**Korthed skal tælles i begge hænder.** Den klassiske regel om kun at tælle
i støttehånden koster 1,6 procentpoint.

### Trumflængde

Ved 23–26 hp: 8 trumf → 9,79 stik · 9 trumf → 10,49 · 10 trumf → 10,81.
Næsten et helt stik mellem 8 og 9 trumf.

### Spildte værdier

| Over for makkers korthed | Effekt |
|---|---|
| Konge | −0,33 stik |
| Dame eller knægt | +0,02 stik |
| Honnørkoncentration i lange farver | +0,03 P-point per point |

Kun kongen koster. Damer og knægte er i forvejen næsten værdiløse i
farvekontrakt, så der er intet at spilde. Koncentrationsbonussen, som
mange lærebøger anbefaler, har ingen støtte i data.

---

## 4. Losing Trick Count — konklusionen

LTC virker, men er svagere end pointtælling og bidrager stort set intet
oven i en model der måler fordeling direkte.

| Metode | R² | Middelfejl |
|---|---|---|
| hp + kortfarvepoint | 0,724 | 0,85 |
| NLTC (Koelman) | 0,695 | 0,90 |
| hp | 0,652 | 0,96 |
| Kontroller | 0,619 | 1,02 |
| **LTC (standard)** | **0,538** | **1,11** |

Marginal værdi:

| Model | R² |
|---|---|
| hp + trumflængde + korthed + kontroller | 0,786 |
| **+ LTC oven i det hele** | **0,789** |

I sans: hp alene 0,839 → hp + LTC 0,839. Nul bidrag.

**Hvorfor LTC taber:** data giver manglende es 1,00, manglende konge 0,52,
manglende dame 0,24. Standard-LTC bruger 1/1/1 og behandler altså en
manglende dame som lige så alvorlig som et manglende es. NLTC's 1,5/1,0/0,5
rammer tættere; data peger på ca. 1,5/0,75/0,35.

**Anden fejl — dobbelttælling af korthed.** Fejl i (24 − LTC):

| Kortfarvepoint | Gns. fejl |
|---|---|
| 0–1 | −0,55 |
| 2 | −0,25 |
| 3 | +0,23 |
| 4 | +0,66 |
| 5+ | **+1,66** |

---

## 5. Zar Points

`ZP = hp + kontroller + (a + b) + (a − d)` hvor a≥b≥c≥d er farvelængder.

Højkortsdelen er 6-4-2-1, som omregnet til 40 er identisk med Four
Aces-skalaen fra 1930'erne.

| Metode | R² | Udgang |
|---|---|---|
| Denne models P (med fit-viden) | 0,794 | 87,5 % |
| **Zar Points (uden fit-viden)** | **0,730** | **85,2 %** |
| hp + kontroller | 0,674 | 83,2 % |
| hp | 0,652 | 82,5 % |

Zars grænser testet: ZP 52 → 38 % udgang (zoneaggressivt, men forsvarligt
ved IMP), ZP 62 → 48 % slem (break-even, velkalibreret). Men Zars egen
stikformel (ZP−2)/5 har bias **+1,01 stik** — den lover systematisk for meget.

Zar åbner 46 % af hænderne mod 35 % med hp ≥ 12.

---

## 6. Spilteknik — hvad der optræder hyppigst

### Hvor mange stik skal skabes?

| | Gns. stik | Sikre topstik | Skal skabes |
|---|---|---|---|
| Farvekontrakt | 8,66 | 3,88 | **4,78 (55 %)** |
| Sanskontrakt | 5,98 | 3,67 | 2,31 (39 %) |

I 59 % af farvekontrakterne skal fem stik eller flere produceres.

### Positionsafhængighed (øst og vest byttet om)

| Udsving | Farvekontrakt | Sans |
|---|---|---|
| Ingen forskel | **55,1 %** | 46,7 % |
| 1 stik | 37,9 % | 35,3 % |
| 2 stik | 6,1 % | 12,3 % |
| 3+ stik | 0,8 % | 5,8 % |

I over halvdelen af farvekontrakterne er det ligegyldigt hvor honnørerne
sidder — der er ingen kipning der virker eller fejler.

### Trumfens værdi (samme kort, farve mod sans)

| Trumflængde | Gevinst |
|---|---|
| 8 trumf | +2,22 stik |
| 9 trumf | +2,98 stik |
| 10 trumf | +3,81 stik |

88 % af fordelingerne giver flere stik i farvekontrakt, 1 % i sans.

### Prioriteret træningsliste

1. **Trumfstyring** — 2,2–3,8 stik per fordeling, i hver eneste farvekontrakt
2. **Stikproduktion og optælling** — 4,78 stik per fordeling
3. **Forbindelser** — implicit i alt ovenstående
4. **Sikkerhedsspil** — 55 % af fordelingerne har en linje uden gæt
5. **Kipning** — relevant i 45 %, typisk ét stik værd
6. **Slutspil og pres** — sjældne, men afgørende i den lille hale

---

## 7. Udspil

Begrænset til tætte kontrakter (bedste forsvar giver 3–4 stik mod 4M,
4–5 mod 3NT).

| | 4 i major | 3NT |
|---|---|---|
| n | 1.067 | 582 |
| Gns. forskel bedste/dårligste udspil | 0,98 stik | **1,33 stik** |
| Udspillet er ligegyldigt | 27 % | 18 % |
| Kontrakten kan slås | 56 % | 58 % |

### Farvekontrakt

| Udspil | Slår | Optimalt |
|---|---|---|
| **Sekvens (KQ/QJ/JT)** | **45,6 %** | 75,2 % |
| Singleton (n=129) | 44,2 % | **80,6 %** |
| Doubleton, to små | 39,1 % | 71,7 % |
| Fra AK | 39,1 % | 62,7 % |
| Fra 3-farve u/ sekvens | 38,5 % | 70,6 % |
| Es uden konge | 36,4 % | 62,9 % |
| Fra 5+ farve u/ sekvens | 36,2 % | 73,5 % |
| Fra 4-farve u/ sekvens | 35,9 % | 72,9 % |
| **Trumf** | **33,8 %** | **61,1 %** |

### Sanskontrakt

| Udspil | Slår | Optimalt |
|---|---|---|
| **Fra AK** | **42,0 %** | 64,7 % |
| **Es uden konge** | **41,9 %** | 64,4 % |
| Sekvens | 39,1 % | **66,1 %** |
| Fra 3-farve u/ sekvens | 32,9 % | 59,6 % |
| Fra 5+ farve u/ sekvens | 32,9 % | 55,8 % |
| Doubleton, to små | 32,5 % | 60,1 % |
| Fra 4-farve u/ sekvens | 32,1 % | 64,5 % |

| Stil | Slår | Optimalt |
|---|---|---|
| **Aggressivt** (top af honnører) | **40,7 %** | **65,2 %** |
| Længde (4-5 farve uden honnører) | 32,4 % | 61,0 % |
| Passivt (småkort) | 32,8 % | 59,8 % |

**Konklusioner:** trumfudspil er dårligst i farvekontrakt. Aggressive
honnørudspil er klart bedst i sans. Udspil fra en lang farve uden topkort
er materialets dårligste sanskategori.

Disse tre konklusioner matcher David Bird og Taf Anthias' resultater i
*Winning Notrump Leads* (2011) og *Winning Suit Contract Leads* (2012),
som brugte samme metode på meldeforløbs-filtrerede fordelinger.

---

## 7a. Kompendiets udspilsråd mod dobbeltdummy

Afsnittet tester udspilsrådene i *Kompendium over modspilsaftaler* påstand
for påstand mod dobbeltdummy. Data er Fordelingstrænerens datasæt til
Modspil v2 (`tools/udspil/raa/`): 150 hænder til Vest i hvert meldeforløb,
hver med 100 fordelinger af de andre 39 kort, der passer med meldingerne
efter appens system, og modspillets stik med DDS for alle 13 udspil. Til
singleton, doubleton uden honnør og "table feeling" er der desuden 150
ekstra hænder pr. variant, hvor Vests hånd har formen ("base + variant").
Syd er spilfører, og meldeforløbene er S1 1NT – 3NT, S2 1NT – 2♣ – 2♦ – 3NT,
S3 1NT – 2♦ – 2♥ – 3NT (transfer), S4 1♥ – 2♥ – 4♥, S5 1♠ – 2♥ – 2♠ – 4♠,
S6 1♥ – 1♠ – 2♣ og S8 1♠ – 3♠.

Hver påstand sammenligner to udspil, A og B, på de samme hænder og
fordelinger. Udspillet i en farve er det kort, profilen Standard spiller;
ved "table feeling" tæller det bedste af de to kort, undtagen i P9, der
sammenligner dem. B er altid én bestemt farve efter en fast regel, og
hænder, hvor A ikke er entydig, er udeladt. Forskellen er gennemsnittet
over hænderne af A's middelstik minus B's (modspillets stik), hånden er
enheden, og 95 %-intervallet er ± 1,96 standardfejl. "A bedre / lige /
B bedre" bruger appens grænse på 0,1 stik, og "Sætter" er forskellen i
procentpoint i chancen for at sætte kontrakten. Dommen er "For få hænder"
under 30 hænder, "Kompendiet holder", når intervallet ligger helt på
Kompendiets side af 0, "Kompendiet tager fejl", når det ligger helt på den
anden side, og ellers "Ingen forskel påvist"; under 0,05 stik fra 0 står
der desuden "uden praktisk betydning". P9 har ingen retning, fordi "table
feeling" overlader valget til spilleren, og dommen siger dér, hvilket kort
der er bedst. Valgene står i `SPEC-udspilsraad.md`.

<!-- raadanalyse:start -->
### Påstandene

| Række | Kompendiets påstand (s.) | A | B |
| --- | --- | --- | --- |
| P1 | En kort major er bedre end en minor med 4 kort og en eller to honnører (s. 11–12, 14) | den korteste major (højst 3 kort) | en minor med præcis 4 kort og 1–2 honnører |
| P2 | Mod 1NT – 3NT helst den korteste major (s. 11–12) | den korteste major | den længste major |
| P3 · ♦ | Efter transfer har ♠ en lille fordel blandt de andre farver (s. 14) | ♠ | ♦ |
| P3 · ♣ | Efter transfer har ♠ en lille fordel blandt de andre farver (s. 14) | ♠ | ♣ |
| P4 | Bordets viste ♥ er sjældent rigtigt uden en dyb sekvens (s. 14) | ♥ uden dyb sekvens | ♠ |
| P5 | En singleton i en sidefarve er et glimrende udspil (s. 19–20) | singletonen i en sidefarve | sidefarven med 3+ kort uden honnør |
| P6 | En doubleton uden honnør er bedre end sit rygte (s. 19) | doubletonen uden honnør i en sidefarve | sidefarven med 3+ kort uden honnør |
| P7 | Med et svagt bord er småkort bedre end en farve med en eller to honnører (s. 19) | sidefarven med 3+ kort uden honnør | sidefarven med 3+ kort og 1–2 honnører uden sekvens |
| P8 · ♠ | Trumf ud er stærkt efter 1♥ – 1♠ – 2♣ (s. 4), kun attraktivt, når ingen sidefarve er det (s. 19), og ofte det dårligste i delkontrakten (s. 19) | trumf | ♠ |
| P8 · ♥ | Trumf ud er stærkt efter 1♥ – 1♠ – 2♣ (s. 4), kun attraktivt, når ingen sidefarve er det (s. 19), og ofte det dårligste i delkontrakten (s. 19) | trumf | ♥ |
| P8 · ♦ | Trumf ud er stærkt efter 1♥ – 1♠ – 2♣ (s. 4), kun attraktivt, når ingen sidefarve er det (s. 19), og ofte det dårligste i delkontrakten (s. 19) | trumf | ♦ |
| P8 · ♣ | Trumf ud er stærkt efter 1♥ – 1♠ – 2♣ (s. 4), kun attraktivt, når ingen sidefarve er det (s. 19), og ofte det dårligste i delkontrakten (s. 19) | trumf | ♣ |
| P9 | "Table feeling" mod sans: toppen eller det lave kort fra to honnører i træk | toppen | det lave kort (Standard) i samme farve |

### Resultaterne

| Række | Situation | Kompendiets retning | Hænder (base + variant) | Udeladt | A − B (stik) | Standardfejl | 95 %-interval | A bedre / lige / B bedre | Sætter, A − B (procentpoint) | Dom |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | S1 + S2 | A | 71 | 13 (to lige lange majorer) | +0,03 | 0,02 | [−0,01; +0,06] | 32 % / 51 % / 17 % | +1,1 | Ingen forskel påvist, uden praktisk betydning |
| P2 | S1 + S2 | A | 240 | 58 (to lige lange majorer) | −0,10 | 0,01 | [−0,13; −0,08] | 10 % / 40 % / 51 % | −1,8 | Kompendiet tager fejl |
| P2 · korteste major 1–2 kort | S1 + S2 | A | 103 |  | −0,12 | 0,02 | [−0,15; −0,09] | 10 % / 33 % / 57 % | −2,4 | Kompendiet tager fejl |
| P2 · korteste major 3 kort | S1 + S2 | A | 120 |  | −0,10 | 0,02 | [−0,14; −0,06] | 9 % / 44 % / 47 % | −1,1 | Kompendiet tager fejl |
| P2 · korteste major 4+ kort | S1 + S2 | A | 17 |  | −0,03 | 0,07 | [−0,17; +0,12] | 12 % / 47 % / 41 % | −3,4 | For få hænder |
| P3 · ♦ | S3 | A | 149 | – | +0,03 | 0,02 | [−0,01; +0,06] | 31 % / 48 % / 21 % | +0,5 | Ingen forskel påvist, uden praktisk betydning |
| P3 · ♣ | S3 | A | 149 | – | +0,02 | 0,01 | [−0,01; +0,05] | 30 % / 47 % / 23 % | +0,6 | Ingen forskel påvist, uden praktisk betydning |
| P4 | S3 | B | 150 | – | −0,12 | 0,01 | [−0,14; −0,09] | 9 % / 39 % / 52 % | −1,6 | Kompendiet holder |
| P5 | S4 | A | 5 + 150 = 155 | – | +0,13 | 0,01 | [+0,12; +0,15] | 62 % / 38 % / 0 % | +4,4 | Kompendiet holder |
| P5 | S5 | A | 4 + 146 = 150 | 4 (samme hånd to gange) | +0,11 | 0,01 | [+0,09; +0,14] | 47 % / 46 % / 7 % | +3,0 | Kompendiet holder |
| P5 | S8 | A | 3 + 150 = 153 | – | +0,17 | 0,01 | [+0,15; +0,19] | 79 % / 17 % / 4 % | +3,4 | Kompendiet holder |
| P6 | S4 | A | 11 + 150 = 161 | – | −0,02 | 0,00 | [−0,03; −0,01] | 3 % / 87 % / 10 % | +0,4 | Kompendiet tager fejl, uden praktisk betydning |
| P6 | S8 | A | 10 + 150 = 160 | – | −0,02 | 0,01 | [−0,03; −0,01] | 9 % / 78 % / 13 % | +1,3 | Kompendiet tager fejl, uden praktisk betydning |
| P7 | S4 | A | 59 | 4 (to sidefarver med 3+ kort uden honnør) | +0,15 | 0,02 | [+0,12; +0,18] | 64 % / 34 % / 2 % | +1,7 | Kompendiet holder |
| P8 · ♠ | S6 | A | 149 | – | +0,07 | 0,02 | [+0,02; +0,11] | 46 % / 26 % / 29 % | +2,7 | Kompendiet holder |
| P8 · ♠ | S4 | B | 143 | – | −0,06 | 0,02 | [−0,10; −0,01] | 24 % / 45 % / 31 % | −1,2 | Kompendiet holder |
| P8 · ♥ | S6 | A | 149 | – | +0,32 | 0,03 | [+0,26; +0,37] | 76 % / 15 % / 9 % | +5,6 | Kompendiet holder |
| P8 · ♥ | S8 | B | 142 | – | −0,06 | 0,02 | [−0,10; −0,02] | 21 % / 51 % / 28 % | −0,9 | Kompendiet holder |
| P8 · ♦ | S6 | A | 149 | – | +0,03 | 0,02 | [0,00; +0,07] | 40 % / 32 % / 28 % | +2,4 | Ingen forskel påvist, uden praktisk betydning |
| P8 · ♦ | S4 | B | 144 | – | −0,06 | 0,02 | [−0,10; −0,02] | 22 % / 49 % / 30 % | −1,2 | Kompendiet holder |
| P8 · ♦ | S8 | B | 141 | – | −0,06 | 0,02 | [−0,10; −0,02] | 21 % / 45 % / 33 % | −0,8 | Kompendiet holder |
| P8 · ♣ | S4 | B | 144 | – | −0,04 | 0,02 | [−0,08; 0,00] | 24 % / 51 % / 26 % | −0,9 | Kompendiet holder, uden praktisk betydning |
| P8 · ♣ | S8 | B | 142 | – | −0,06 | 0,02 | [−0,09; −0,02] | 16 % / 58 % / 26 % | −0,9 | Kompendiet holder |
| P9 | S1 + S2 | – | 31 + 293 = 324 | 8 ("table feeling" i to farver) | +0,31 | 0,02 | [+0,27; +0,35] | 79 % / 20 % / 1 % | +3,2 | A bedre |
| P9 · E K | S1 + S2 | – | 7 + 46 = 53 |  | +0,83 | 0,08 | [+0,68; +0,98] | 100 % / 0 % / 0 % | +12,3 | A bedre |
| P9 · K D | S1 + S2 | – | 6 + 96 = 102 |  | +0,32 | 0,01 | [+0,30; +0,35] | 93 % / 6 % / 1 % | +2,4 | A bedre |
| P9 · D B | S1 + S2 | – | 18 + 151 = 169 |  | +0,14 | 0,01 | [+0,12; +0,16] | 64 % / 34 % / 2 % | +1,0 | A bedre |
| P9 · 3 kort | S1 + S2 | – | 11 + 98 = 109 |  | +0,36 | 0,02 | [+0,32; +0,40] | 98 % / 2 % / 0 % | +4,6 | A bedre |
| P9 · 4 kort | S1 + S2 | – | 15 + 123 = 138 |  | +0,23 | 0,02 | [+0,19; +0,26] | 68 % / 29 % / 3 % | +2,4 | A bedre |
| P9 · 5+ kort | S1 + S2 | – | 5 + 72 = 77 |  | +0,39 | 0,07 | [+0,26; +0,52] | 71 % / 29 % / 0 % | +3,0 | A bedre |

Fast eksempel i P9: S1 opgave 55 (seed 2556829236, ♠K B 7 6 ♥E K 4 3 ♦10 8 6 3 ♣B): ♥E giver 3,35 stik og sætter i 14 %, ♥3 giver 2,52 stik og sætter i 4 %.

### Hyppigheden af varianternes former i basen

| Variant | Formen | Hænder i basen med formen |
| --- | --- | --- |
| S4-singleton | singleton i en sidefarve og en anden sidefarve med 3+ kort uden honnør | 5 af 150 (3 %) |
| S5-singleton | singleton i en sidefarve og en anden sidefarve med 3+ kort uden honnør | 4 af 150 (3 %) |
| S8-singleton | singleton i en sidefarve og en anden sidefarve med 3+ kort uden honnør | 3 af 150 (2 %) |
| S4-doubleton | doubleton uden honnør i en sidefarve og en anden sidefarve med 3+ kort uden honnør | 11 af 150 (7 %) |
| S8-doubleton | doubleton uden honnør i en sidefarve og en anden sidefarve med 3+ kort uden honnør | 10 af 150 (7 %) |
| S1-tablefeeling | "table feeling" i en farve med 3+ kort (E K, K D eller D B) | 15 af 150 (10 %) |
| S2-tablefeeling | "table feeling" i en farve med 3+ kort (E K, K D eller D B) | 17 af 150 (11 %) |

### Trumfs plads blandt Vests farver (P8)

| Situation | Trumf | Hænder med trumf | 1. | 2. | 3. | 4. |
| --- | --- | --- | --- | --- | --- | --- |
| S6 | ♣ | 149 | 68 (46 %) | 35 (23 %) | 29 (19 %) | 17 (11 %) |
| S4 | ♥ | 144 | 23 (16 %) | 49 (34 %) | 39 (27 %) | 33 (23 %) |
| S8 | ♠ | 142 | 12 (8 %) | 41 (29 %) | 52 (37 %) | 37 (26 %) |

### S4 og S6: hænderne, hvor rådet ikke er blandt dobbeltdummys bedste farver

|  | S4 (♥): rådet ikke blandt de bedste | S4: alle hænder | S6 (♣): rådet ikke blandt de bedste | S6: alle hænder |
| --- | --- | --- | --- | --- |
| Hænder | 30 | 150 | 59 | 150 |
| Bedste farve ♠ | 7 (23 %) | 47 (31 %) | 28 (47 %) | 42 (28 %) |
| Bedste farve ♥ | 4 (13 %) | 21 (14 %) | 0 (0 %) | 0 (0 %) |
| Bedste farve ♦ | 13 (43 %) | 46 (31 %) | 31 (53 %) | 44 (29 %) |
| Bedste farve ♣ | 6 (20 %) | 36 (24 %) | 0 (0 %) | 64 (43 %) |
| Trumflængde 0 | 3 (10 %) | 6 (4 %) | 1 (2 %) | 1 (1 %) |
| Trumflængde 1 | 7 (23 %) | 28 (19 %) | 8 (14 %) | 19 (13 %) |
| Trumflængde 2 | 9 (30 %) | 56 (37 %) | 16 (27 %) | 44 (29 %) |
| Trumflængde 3 | 11 (37 %) | 46 (31 %) | 26 (44 %) | 54 (36 %) |
| Trumflængde 4+ | 0 (0 %) | 14 (9 %) | 8 (14 %) | 32 (21 %) |
| Honnør i trumf | 6 (20 %) | 51 (34 %) | 44 (75 %) | 95 (63 %) |
| Singleton eller doubleton i en sidefarve | 15 (50 %) | 71 (47 %) | 25 (42 %) | 52 (35 %) |
| Honnørsekvens i en sidefarve | 21 (70 %) | 64 (43 %) | 25 (42 %) | 54 (36 %) |

Rådet er blandt dobbeltdummys bedste farver (under 0,1 stik fra den bedste) i S4 120 af 150 (80 %) og S6 91 af 150 (61 %).
<!-- raadanalyse:slut -->

**Forbehold**

- **Dobbeltdummy kender alle kort.** Spilføreren gætter aldrig forkert, og
  modspillet finder altid skiftet. Udspil, der virker, fordi spilføreren
  skal gætte (passive og korte udspil), undervurderes; aktive udspil, især
  esudspil, overvurderes, fordi modspillet "ser" det rigtige skift efter at
  have set bordet (afsnit 8). Det gælder især P2 og P9.
- **Gennemsnitlige stik er parturneringens mål.** I holdturnering tæller
  chancen for at sætte mere; den står derfor ved siden af.
- **Fordelingerne passer med meldingerne efter appens system**, ikke med
  alle måder at melde på, og varianternes hænder er udvalgt efter formen,
  så de siger intet om, hvor ofte formen forekommer; det gør tabellen over
  hyppigheden.
- **Kun de otte situationer.** Konklusionerne gælder meldeforløbene, ikke
  udspil generelt.
- **Kompendiet citeres ikke**; påstandene er omskrevet med siden.

**Konklusioner**

1. **Singleton i en sidefarve holder (P5).** I 4♥, 4♠ og 3♠ giver
   singletonen 0,11–0,17 stik mere end en sidefarve med småkort og sætter
   3–4 procentpoint oftere; småkort er 0,1 stik bedre eller mere i højst
   7 % af hænderne. Formen er sjælden (2–3 % af basens hænder), så tallene
   bygger næsten kun på de ekstra hænder.
2. **Den korteste major mod 1NT – 3NT tager fejl (P2).** Den korteste major
   giver 0,10 stik mindre end den længste og sætter 1,8 procentpoint
   sjældnere, både med 1–2 og med 3 kort. Mod en minor med 4 kort og en
   eller to honnører (P1) er forskellen +0,03 stik, uden praktisk
   betydning. Forbeholdet om dobbeltdummy gælder især her.
3. **Efter transfer holder rådet mod bordets ♥ (P4):** ♥ uden dyb sekvens
   giver 0,12 stik mindre end ♠. ♠'s lille fordel frem for ♦ og ♣ (P3) ses
   ikke; forskellen er +0,02 til +0,03 stik, uden praktisk betydning.
4. **Doubleton uden honnør og småkort er lige gode (P6), og småkort slår
   honnørfarven (P7).** Doubletonen giver 0,02 stik mindre end småkort,
   men sætter 0,4–1,3 procentpoint oftere, og 78–87 % af hænderne er under
   0,1 stik fra hinanden. Småkort giver 0,15 stik mere end en sidefarve med
   en eller to honnører uden sekvens. I 4♥ (S4) er Kompendiets råd blandt
   dobbeltdummys bedste farver i 80 % af hænderne; i de øvrige 30 har Vest
   oftere en honnørsekvens i en sidefarve (70 % mod 43 % af alle hænder) og
   sjældnere en honnør i trumf (20 % mod 34 %).
5. **Trumf ud følger Kompendiet (P8).** Efter 1♥ – 1♠ – 2♣ er trumf bedre
   end bordets ♠ (+0,07) og især end Syds ♥ (+0,32), men ikke påviseligt
   bedre end ♦, og trumf er den bedste farve i 46 % af hænderne. Rådet
   (trumf) er blandt de bedste farver i 61 %; i de øvrige 59 hænder er den
   bedste farve ♠ eller ♦, aldrig ♥. I 4♥ og 3♠ giver hver sidefarve
   0,04–0,06 stik mere end trumf, og trumf er den bedste farve i 16 % og
   8 % af hænderne; forskellene er små og ligger tæt ved grænsen for
   praktisk betydning.
6. **"Table feeling" mod sans (P9): toppen giver 0,31 stik mere end det lave
   kort**, mest fra E K (+0,83) og mindst fra D B (+0,14), og sætter 3,2
   procentpoint oftere. Dobbeltdummy overvurderer netop esudspil, fordi
   modspillet ser det rigtige skift efter at have set bordet, så tallet er
   en øvre grænse, især fra E K.

---

## 8. Forbehold

- **Dobbeltdummy overvurderer.** Facit er perfekt spil fra begge sider med
  alle kort synlige. Typisk 0,2–0,3 stik mere end virkeligt spil, mest i sans.
  Rangordenen mellem metoder er upåvirket; absolutte niveauer er optimistiske.
- **Ingen meldeforløb.** Fordelingerne er tilfældige, ikke udvalgt efter hvad
  der faktisk ville blive meldt. Det gælder især udspilsanalysen, hvor
  meldeforløbet ved bordet ændrer alt.
- **Udspilsanalysen har en kendt skævhed.** Et esudspil scorer højt delvis
  fordi dobbeltdummy-forsvaret derefter finder det rigtige skift — noget der
  sjældent lykkes ved bordet.
- **Spilfører = bedste af nord og syd.** En anelse gavmildt.
- **Sansdatasættet udelukker 8-korts major-fit,** så lange majorfarver har
  per konstruktion ikke støtte hos makker.
- **Signalsystemet indgår ikke** i udspilsvurderingen.

---

## 9. Sådan reproducerer du det

```bash
pip install endplay numpy pandas --break-system-packages

python3 scripts/gen2.py fit 3500 21      # generér fit-fordelinger (gentag med nye seeds)
python3 scripts/gen3.py ntx 4500 71      # sans, fri fordeling
python3 scripts/analyse2.py              # hovedanalyse: LTC, hp, kombinationer
python3 scripts/korthed.py               # kortfarvepoint-skalaer
python3 scripts/skala.py                 # honnørskalaer
python3 scripts/systemer.py              # sammenligning af offentliggjorte systemer
python3 scripts/zar.py                   # Zar Points
python3 scripts/sanslaengde.py           # længdepoint i sans
python3 scripts/teknik.py fit 900        # positionsafhængighed + trumfværdi
python3 scripts/udspil.py fit 900 10 5 0 # udspilsanalyse
python3 scripts/udspil2.py               # udspil, tætte kontrakter
node tools/udspil/raadanalyse.mjs --markdown  # afsnit 7a (Fordelingstrænerens rod)
```

Scripterne forventer at ligge i samme mappe som datafilerne, eller at
stierne i toppen af hvert script rettes til.
