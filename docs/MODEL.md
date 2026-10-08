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
  + 1½ per trumf du selv har ud over 4
  + kortfarvepoint: renonce 5, singleton 3, dobbeltton 1
  − 1 per konge over for makkers viste korthed
```

**Honnørpoint** = `5·E + 3·K + 1½·D + ½·B + ¼·T`

Genvej, matematisk identisk: **HCP + 1 per es − ½ per dame − ½ per knægt + ¼ per tier**

De to fordelingsled må først lægges til, når fitten er bekræftet.

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

**Præstation:** R² = 0,794, middelfejl 0,74 stik, udgangsbeslutningen korrekt
i 87,5 % af tilfældene (mod 82,5 % for ren HCP).

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

**Brug ikke farveskalaen i sans.** Den er materialets dårligste dér.

```
Point i sans = HCP (4-3-2-1) + ¼ per tier
Ingen længdepoint. Ingen fladhedsstraf.
Tjek i stedet alle fire farver for stoppere.
```

Datadrevne honnørværdier i sans, skaleret til es = 4:
**A 4,00 · K 2,62 · Q 1,47 · J 0,83 · T 0,38**

### Længdepoint i sans er værd nul

| Element | HCP-ækvivalent |
|---|---|
| Femkortsfarve | −0,07 |
| Sekskortsfarve | −0,20 |
| Syvkortsfarve | −0,31 |
| Honnørpoint i den lange farve (ud over HCP) | +0,01 |
| 4-3-3-3-fordeling | −0,05 |
| Løbefarve (8+ kort, 2+ topkort) | −0,06 |

### Det der faktisk betyder noget: stoppere

Ved 24–26 HCP:

| | Gns. stik | 3NT holder |
|---|---|---|
| 3 farver stoppet | 7,97 | **31 %** |
| 4 farver stoppet | 8,74 | **60 %** |

Per stoppet farve: +0,31 HCP-ækvivalent i regressionen, men den direkte
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

Bemærk: modellens egen skala er **dårligst i sans**. Skalaen er
kontrakttype-specifik.

### Kortfarvepoint: 5/3/1, ikke 3/2/1

Fri regression, alt andet konstant:

| Korthed | Stik | HCP-ækvivalent |
|---|---|---|
| Renonce | +1,37 | 4,8 |
| Singleton | +0,69 | 2,4 |
| Dobbeltton | +0,21 | 0,7 |

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

Ved 23–26 HCP: 8 trumf → 9,79 stik · 9 trumf → 10,49 · 10 trumf → 10,81.
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
| HCP + kortfarvepoint | 0,724 | 0,85 |
| NLTC (Koelman) | 0,695 | 0,90 |
| HCP | 0,652 | 0,96 |
| Kontroller | 0,619 | 1,02 |
| **LTC (standard)** | **0,538** | **1,11** |

Marginal værdi:

| Model | R² |
|---|---|
| HCP + trumflængde + korthed + kontroller | 0,786 |
| **+ LTC oven i det hele** | **0,789** |

I sans: HCP alene 0,839 → HCP + LTC 0,839. Nul bidrag.

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

`ZP = HCP + kontroller + (a + b) + (a − d)` hvor a≥b≥c≥d er farvelængder.

Højkortsdelen er 6-4-2-1, som omregnet til 40 er identisk med Four
Aces-skalaen fra 1930'erne.

| Metode | R² | Udgang |
|---|---|---|
| Denne models P (med fit-viden) | 0,794 | 87,5 % |
| **Zar Points (uden fit-viden)** | **0,730** | **85,2 %** |
| HCP + kontroller | 0,674 | 83,2 % |
| HCP | 0,652 | 82,5 % |

Zars grænser testet: ZP 52 → 38 % udgang (zoneaggressivt, men forsvarligt
ved IMP), ZP 62 → 48 % slem (break-even, velkalibreret). Men Zars egen
stikformel (ZP−2)/5 har bias **+1,01 stik** — den lover systematisk for meget.

Zar åbner 46 % af hænderne mod 35 % med HCP ≥ 12.

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
| Dobbeltton, to små | 39,1 % | 71,7 % |
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
| Dobbeltton, to små | 32,5 % | 60,1 % |
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
python3 scripts/analyse2.py              # hovedanalyse: LTC, HCP, kombinationer
python3 scripts/korthed.py               # kortfarvepoint-skalaer
python3 scripts/skala.py                 # honnørskalaer
python3 scripts/systemer.py              # sammenligning af offentliggjorte systemer
python3 scripts/zar.py                   # Zar Points
python3 scripts/sanslaengde.py           # længdepoint i sans
python3 scripts/teknik.py fit 900        # positionsafhængighed + trumfværdi
python3 scripts/udspil.py fit 900 10 5 0 # udspilsanalyse
python3 scripts/udspil2.py               # udspil, tætte kontrakter
```

Scripterne forventer at ligge i samme mappe som datafilerne, eller at
stierne i toppen af hvert script rettes til.
