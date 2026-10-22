# Resultater for de åbne punkter i håndevalueringen

Regnet 21. oktober 2026 til de åbne punkter i SPEC-haandevaluering.md. Franks beslutninger ud fra tallene står i [SPEC-haandevaluering-kalibrering.md](../SPEC-haandevaluering-kalibrering.md); punkterne "Til afgørelse" nedenfor er afgjort dér.

**Data:** `bridge-model/data/fit_deals.csv` med 11.168 fordelinger, hvor N-S har mindst 8 trumf i en major. Facit er dobbeltdummy-stik i trumffarven med den bedste spilfører af nord og syd. Datafilerne er kun læst, ikke ændret. Udgang = mindst 10 stik, og det holder i 35,0 % af fordelingerne.

**P** er regnet som i Franks scripts (`final.py`, `skala.py`, `systemer.py`):
honnørpoint 5-3-1½-½-¼ + 1½ × (trumf − 4) pr. hånd + kortfarvepoint 5/3/1 i sidefarverne i begge hænder. Kongen over for korthed er ikke med, for fordelingerne har ingen meldinger.
Kontrol: R² 0,794, middelfejl 0,736 stik og 87,5 % rigtige udgangsbeslutninger ved P ≥ 28½. Det er præcis tallene i MODEL.md, så CSV-filen og beregningen stemmer.

**Metode** som i `korthed.py`: stik = a·P + b tilpasses med mindste kvadrater på alle fordelinger, og R² og middelfejl er regnet ud fra den linje. "Rigtige udgangsbeslutninger" er andelen, hvor "P ≥ grænsen" og "mindst 10 stik" giver det samme. Grænsen er den bedste i halve point fra 20 til 44½.

**Gentag beregningen:** `python3 scripts/aabne_punkter.py` i `bridge-model` (kun Python 3, ingen pakker).

## Test af appens valg

| Punkt | Appens valg | Resultat | Tallene |
| --- | --- | --- | --- |
| HCP-grænse (opgave 8) | 25 HCP, foreløbig | **Ikke bekræftet: ret til 23** | 82,5 % rigtige ved HCP ≥ 23; 25 HCP giver 79,3 % |
| Kortfarvepoint i trumffarven | kun sidefarver | **Bekræftet** | Bedre i alle tal, mest ved ≤ 2 trumf: R² 0,754 mod 0,727, middelfejl 0,796 mod 0,836 og 86,4 % mod 85,1 % rigtige |
| IMP-grænser (opgave 9) | 27½, 28, 28½ | **Bekræftet med dataenes P**, ikke med appens | Den laveste gruppe, der når 37 %, 45 % og 50 %, er 27½, 28 og 28½; gruppen under ligger på 35,4 %, 44,6 % og 47,1 % |
| Kontroltjek, lilleslem | højst ét es mangler | **Bekræftet** | 12 stik ved P ≥ 35: 87,8 % uden manglende es, 67,7 % med ét og 29,1 % med to |
| Kontroltjek, storeslem | alle fire es og trumfkongen | **Bekræftet ved lavere P** | Ved P ≥ 41 er der kun én fordeling uden trumfkongen. Med alle fire es giver P ≥ 38 13 stik i 73,8 % med trumfkongen og 38,9 % uden (18 fordelinger); ved P ≥ 35 er det 53,5 % og 22,7 % (66) |

Forbehold:

- **IMP-grænserne** gælder P som i MODEL.md. Ved 45 % og 50 % ligger tallene på kanten; en udglattet kurve giver 27,7 og 28,1. Med appens trumfled har grupperne 27½, 28 og 28½ kun 35,2 %, 33,3 % og 41,4 %, og grænserne ville være 28½, 29 og 29½ (se næste afsnit).
- **Lilleslem:** reglen tillader ét manglende es uden trumfkongen, men det giver kun 30,6 % (36 fordelinger), lige så lidt som to manglende es. Se "Hvad tallene viser" i afsnit 4.

---

## Først: appens trumfled er ikke det samme som i dataene

MODEL.md afsnit 1 skriver "1½ per trumf du selv har ud over 4", altså **1½ × max(0, trumf − 4) pr. hånd**. Det regner appen også (`trumpPoints` i `pmodel.ts`). Scripterne regner i stedet **1½ × (trumf − 4) pr. hånd**, og det bliver negativt ved 3 trumf eller færre. Ingen af scripterne bruger max(0, …).

**Hvor trumflængden regnes i scripterne:**

| Script | Kode | Formel |
| --- | --- | --- |
| `analyse2.py:82` | `trumps=len(byN[fit]) + len(byS[fit])` | Ingen P-formel. Parrets antal trumf indgår som fri variabel i regressionerne (linje 146–149) og med 1 point pr. trumf i `thr(fit.hcp + fit.trumps, …)` (linje 174) |
| `final.py:10` | `1.5*(len(b[f])-4)` | 1½ × (trumf − 4) pr. hånd |
| `skala.py:19`, `systemer.py:31`, `zar.py:18`, `konc.py:19` | `1.5*(D.Ntr-4)+1.5*(D.Str-4)` | 1½ × (trumf − 4) pr. hånd |
| `korthed.py:46` og `:56`, `praktisk.py:22` og `:37`, `extra.py:10`, `hands.py:22` | `1.5*(trumps-8)` | 1½ × (parrets trumf − 8), samme tal; disse scripts bruger HCP i stedet for honnørpoint |

Tallene 0,794 og 87,5 % i MODEL.md kommer fra `systemer.py`, `skala.py` og `zar.py` og er altså regnet med 1½ × (trumf − 4). De to formler giver det samme, når begge hænder har mindst 4 trumf (4-4, 5-4, 5-5, 6-4). For hver hånd med færre end 4 trumf giver MODEL.md's formel 1½ point mere pr. manglende trumf: 5-3 og 6-3 får +1½, 6-2 og 7-2 +3, og 7-1 +4½.

**Side om side** (P = 27 betyder gruppen 27–27¼, da P går i kvarte point; antal fordelinger i parentes):

| | Scripterne: 1½ × (trumf − 4) pr. hånd | MODEL.md afsnit 1: 1½ × max(0, trumf − 4) |
| --- | --- | --- |
| R² | **0,794** | 0,765 |
| Middelfejl, egen tilpasset linje | **0,736** stik | 0,791 stik |
| Den tilpassede linje | 0,307 × P + 0,76 | 0,298 × P + 0,67 |
| Middelfejl med MODEL.md's 0,31 × P + 0,75 | **0,736** stik | 0,844 stik |
| Skævhed med 0,31 × P + 0,75 | +0,06 stik | +0,40 stik |
| Gennemsnitligt P | 25,5 | 26,6 |
| Rigtige udgangsbeslutninger ved P ≥ 28½ | **87,5 %** | 85,6 % |
| Bedste grænse | 28½ (87,5 %) | 29½ (86,3 %) |
| Mindst 10 stik ved P = 27 | 35,4 % (367) | 27,0 % (363) |
| P = 27½ | 44,6 % (368) | 35,2 % (355) |
| P = 28 | 47,1 % (333) | 33,3 % (348) |
| P = 28½ | 61,7 % (298) | 41,4 % (348) |
| P = 29 | 62,5 % (315) | 47,2 % (352) |
| P = 30 | 77,2 % (272) | 63,8 % (287) |

MODEL.md's formel giver i gennemsnit 1,1 point mere. Linjen 0,31 × P + 0,75 lover derfor 0,4 stik for meget, og 50 % for udgang nås først mellem P = 29 og 29½ i stedet for omkring 28½. MODEL.md's tabel, grænser og præstationstal passer kun med scripternes formel. Teksten "1½ per trumf du selv har ud over 4" svarer til **"1½ pr. trumf ud over 4, minus 1½ pr. trumf under 4"** eller, regnet for parret, **"1½ pr. trumf ud over 8"**.

Gennemsnitlig fejl pr. fittype (forventede minus faktiske stik; plus betyder, at P lover for meget):

| Fit | Antal | P som i dataene | P som i appen |
| --- | --- | --- | --- |
| 5-3 | 3.123 | +0,07 | +0,20 |
| 4-4 | 2.118 | +0,02 | −0,30 |
| 5-4 | 1.947 | −0,12 | −0,46 |
| 6-2 | 1.208 | +0,00 | +0,58 |
| 6-3 | 1.030 | −0,09 | +0,02 |
| 6-4 | 467 | +0,05 | −0,30 |
| 5-5 | 312 | +0,04 | −0,32 |
| 7-2 | 312 | −0,12 | +0,43 |
| 7-1 | 191 | −0,10 | +0,92 |
| 7-3 | 185 | −0,04 | +0,05 |

Dataenes P har næsten ingen skævhed på tværs af fittyperne. Appens P overvurderer de skæve fit og undervurderer de jævne. Afsnittene nedenfor bruger dataenes P; de steder, hvor appens P giver et andet svar, står det til sidst i afsnittet.

**Til afgørelse (Frank):** skal MODEL.md's tekst og appen regne trumfleddet som scripterne ("1½ pr. trumf, parret har ud over 8", eller 1½ × (trumf − 4) pr. hånd, også negativt), eller skal teksten stå og tabellen og grænserne regnes om? Afgørelsen påvirker også facitfilen, som konventionstræneren bruger. Jeg har ikke ændret noget.

---

## 1. HCP-grænsen til udgang

**Grænsen er 23 HCP:** HCP ≥ 23 giver 82,50 %, og ingen anden grænse giver det tal. Den er fundet som i `zar.py`, dvs. som den bedste grænse over alle HCP-værdier; `analyse2.py` afsnit 5 giver den samme.

| Udgang ved | Rigtige | Melder udgang | Udgang uden 10 stik | 10+ stik i delkontrakt |
| --- | --- | --- | --- | --- |
| HCP ≥ 22 | 81,4 % | 38,4 % | 11,0 % | 7,6 % |
| **HCP ≥ 23** | **82,5 %** | 30,7 % | 6,6 % | 10,9 % |
| HCP ≥ 24 | 81,7 % | 23,5 % | 3,4 % | 14,9 % |
| HCP ≥ 25 | 79,3 % | 17,4 % | 1,6 % | 19,1 % |
| HCP ≥ 26 | 76,0 % | 12,3 % | 0,6 % | 23,3 % |
| HCP ≥ 27 | 73,2 % | 8,7 % | 0,3 % | 26,5 % |

Alle andele er af de 11.168 fordelinger. Opgave 8 bruger nu 25 HCP (79,3 %). Grænsen afhænger ikke af trumfleddet.

---

## 2. Kortfarvepoint i trumffarven

"En hånd har 2 eller færre trumf" betyder, at den korteste trumfhånd har højst 2 (6-2, 7-2, 7-1, 8-2 osv.). Det gælder 1.803 fordelinger (16,1 %). Delmængden er regnet med den samme linje og den samme grænse som alle fordelinger.

| Kortfarvepoint | Alle: R² | Middelfejl | Rigtige | ≤ 2 trumf: R² | Middelfejl | Rigtige |
| --- | --- | --- | --- | --- | --- | --- |
| Kun i sidefarverne | **0,794** | **0,736** | **87,5 %** (P ≥ 28½) | **0,754** | **0,796** | **86,4 %** |
| I alle farver | 0,789 | 0,745 | 87,3 % (P ≥ 28½) | 0,727 | 0,836 | 85,1 % |

- **Skævhed** i delmængden: kun sidefarverne −0,03 stik, alle farver +0,30 stik. Kortfarvepoint i trumffarven får P til at love ca. 1 P-point for meget.
- **Med delmængdens egen linje og grænse** står sidefarverne stadig bedst: R² 0,755, middelfejl 0,796 og 86,4 % (P ≥ 28½), mod alle farvers 0,749, 0,812 og 86,1 % (P ≥ 29½).

**Reglen holder:** kortfarvepoint i trumffarven gør alle tal dårligere, mest i de fordelinger, hvor de gør en forskel.

**Med appens trumfled:** sidefarverne alene giver R² 0,765, middelfejl 0,791 og 86,3 % (P ≥ 29½) på alle fordelinger og R² 0,668, middelfejl 0,930 og 82,8 % ved ≤ 2 trumf. Alle farver giver 0,740, 0,829 og 85,4 % og ved ≤ 2 trumf 0,543, 1,103 og 77,0 %. Skævheden ved ≤ 2 trumf er +0,60 stik allerede uden trumffarven, fordi den lange trumfhånd får point for længden, uden at den korte trækkes fra.

---

## 3. IMP-grænserne

P går i kvarte point, så hver gruppe har to værdier (gruppen 27½ er P = 27½ og 27¾).

| P | Antal | Mindst 10 stik |
| --- | --- | --- |
| 26 | 363 | 25,6 % |
| 26½ | 394 | 27,4 % |
| 27 | 367 | 35,4 % |
| **27½** | 368 | **44,6 %** |
| **28** | 333 | **47,1 %** |
| **28½** | 298 | **61,7 %** |
| 29 | 315 | 62,5 % |
| 29½ | 305 | 73,8 % |
| 30 | 272 | 77,2 % |

| Chance | Laveste P |
| --- | --- |
| Mindst 37 % (IMP i zonen) | **27½** |
| Mindst 45 % (IMP uden for zonen) | **28** |
| Mindst 50 % (parturnering) | **28½** |

Det er de grænser, specen bruger. Alle højere grupper når også andelen.

- **Usikkerhed:** hver gruppe har en usikkerhed på ca. ±5 procentpoint (95 %). Gruppen 27½ ligger lige under 45 %, og gruppen 28 lige under 50 %.
- **Udglattet kontrol** med en logistisk kurve over P fra 22 til 34 (7.180 fordelinger): 37 % ved P = 27,2, 45 % ved 27,7 og 50 % ved 28,1. Det er samme grænse eller ½ point lavere, så grænserne for 45 % og 50 % ligger på kanten.

**Med appens trumfled** ligger alt ét point højere. De laveste grupper er **28½, 29 og 29½**, og den logistiske kurve giver 28,3, 28,9 og 29,2. Grupperne fra 26 til 30 har 15,3 %, 18,3 %, 27,0 %, 35,2 %, 33,3 %, 41,4 %, 47,2 %, 55,7 % og 63,8 %.

---

## 4. Kontroltjekket ved slem

### Lilleslem: P ≥ 35 (661 fordelinger, 72,9 % med mindst 12 stik)

| Parret mangler | I alt | Med trumfkongen | Uden trumfkongen |
| --- | --- | --- | --- |
| 0 es | 87,8 % (279) | 91,5 % (213) | 75,8 % (66) |
| 1 es | 67,7 % (325) | 72,3 % (289) | **30,6 %** (36) |
| 2 es | 29,1 % (55) | 29,1 % (55) | – (0) |
| I alt | 72,9 % (661) | 75,3 % (558) | 60,2 % (103) |

Antal fordelinger i parentes. To fordelinger mangler 3 es (den ene gav 12 stik); de tæller med i "I alt", men ikke i rækkerne.

### Storeslem: P ≥ 41 (47 fordelinger, 66,0 % med 13 stik)

| Parret mangler | I alt | Med trumfkongen | Uden trumfkongen |
| --- | --- | --- | --- |
| 0 es | 75,7 % (37) | 75,0 % (36) | 1 af 1 |
| 1 es | 30,0 % (10) | 3 af 10 | – (0) |
| I alt | 66,0 % (47) | 65,2 % (46) | 1 af 1 |

Et manglende es kan tage 0 stik, hvis farven kan stjæles. Det forklarer de 3 af 10.

### Hvad tallene viser

- **Lilleslem:** "højst ét manglende es" holder for esserne alene: 1 manglende es giver 67,7 % og 2 es 29,1 %. Men **ét manglende es uden trumfkongen giver kun 30,6 %**, lige så lidt som 2 manglende es. Gruppen er lille (36), men tallene passer med, at trumfkongen tæller som et femte es (nøglekort):

  | Manglende nøglekort (4 es + trumfkongen) | 12 stik ved P ≥ 35 |
  | --- | --- |
  | 0 | 91,5 % (213) |
  | 1 | 73,0 % (355) |
  | 2 | 29,7 % (91) |
  | 3 eller 4 | 1 af 2 |

  En regel som "højst ét af de fem nøglekort mangler" adskiller tydeligere end esserne alene. **Til afgørelse (Frank)**, da kontroltjekket står som et åbent punkt.
- **Storeslem:** "alle fire es" støttes (75,7 % mod 30,0 %). Ved P ≥ 41 har kun én fordeling alle fire es uden trumfkongen, så trumfkongen kan ikke testes ved selve grænsen. Grupperet efter nøglekort er det 75,0 % (36) uden manglende nøglekort og 36,4 % (11) med ét manglende. Ved lavere P er der nok fordelinger med alle fire es og uden trumfkongen, og trumfkongen gør en stor forskel:

  | Alle fire es, 13 stik | Med trumfkongen | Uden trumfkongen |
  | --- | --- | --- |
  | P ≥ 32 | 41,2 % (306) | 13,7 % (139) |
  | P ≥ 35 | 53,5 % (213) | 22,7 % (66) |
  | P ≥ 38 | 73,8 % (103) | 38,9 % (18) |
  | P ≥ 41 | 75,0 % (36) | 1 af 1 |

**Med appens trumfled** kommer flere fordelinger med (972 ved P ≥ 35 og 94 ved P ≥ 41), og andelene er lavere. Lilleslem: 60,1 % i alt, og efter manglende nøglekort 0: 87,3 % (245), 1: 61,8 % (526), 2: 22,8 % (189) og 3: 1 af 11. Storeslem: 62,8 % i alt, 0 manglende nøglekort 80,6 % (62) og 1 manglende 28,1 % (32). Mønstret er det samme.
