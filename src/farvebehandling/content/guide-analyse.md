# Guide til Farvebehandling – Analyse

Opdateret 21. oktober 2026

Analysen finder den linje i én farve, der giver størst chance for det nødvendige antal stik, og regner den eksakt med optimalt modspil. På 11 kombinationer fra bridgelitteraturen finder den bøgernes linje eller en bedre.

## 1 Introduktion og appen

Farvebehandling er et spor i Fordelingstræneren, der lærer dig at spille én farve bedst muligt. Analysen er sporets værktøj: du vælger kortene og målet, og den viser de bedste linjer med chance, gennemsnitligt antal stik og de sidninger, linjerne vinder og taber på.

Appen ligger på [www.kontraktbridge.dk/fordelingstraeneren](https://www.kontraktbridge.dk/fordelingstraeneren/) og virker i alle moderne browsere, også på telefon og tablet. Den kan installeres som app og bruges uden net.

Analysen findes to steder: som fanen Analyse i Farvebehandling og som det selvstændige modul Analyse på forsiden ([www.kontraktbridge.dk/fordelingstraeneren/#analyse](https://www.kontraktbridge.dk/fordelingstraeneren/#analyse)). Det er den samme analyse med de samme data, så en egen linje, du gemmer det ene sted, findes også det andet. Knappen Guide øverst i analysen åbner denne guide.

Farvebehandling har tre faner:

| Fane | Hvad du gør | Hvornår vises facit |
| --- | --- | --- |
| Træning | Løser opgaver, som appen vælger efter Leitner-systemet | Efter dit valg af linje og dit gæt på chancen |
| Selvvalgt | Vælger selv teknik, antal kort, manglende honnører og mål | Efter dit valg af linje |
| Analyse | Vælger en kombination og ser løsningen | Straks |

Opgavebanken har 657 kombinationer fra de klassiske farvebehandlinger med inspiration fra Suit Combinations in Bridge (Jethalal M. Shah), ordnet efter hvor tit de opstår ved bordet. Analysen viser bankens kombinationer straks, fordi løsningerne er regnet på forhånd. Andre kombinationer regnes i browseren, når du beder om det.

## 2 Brug af analysen

### 2.1 Analysér en kombination

Du trykker kortene ind i kortvælgeren for bordet (Nord) og hånden (Syd) og vælger målet i stik. De kort, du ikke vælger, sidder hos modparten. Bordet vises som et klassisk diagram med Nord øverst, Syd nederst og de manglende kort i midten.

Du kan også indsætte kombinationen i feltet "Indsæt kombination eller spil" over kortvælgeren og trykke Importér:

| Indsæt | Eksempel | Resultat |
| --- | --- | --- |
| Bordet-hånden | `EK65-B43` eller `AK65-J43` | Kombinationen stilles op direkte |
| En LIN-tekst | Teksten fra en LIN-fil, der begynder med `md` | Vælg en af spillets 8 kombinationer |
| Adressen fra BBO's handviewer | `…handviewer.html?lin=…` eller `?n=…&s=…` | Vælg en af spillets 8 kombinationer |

Fra et spil vælger du hver farve for Nord–Syd eller Øst–Vest, og den første hånd bliver bordet. Dansk (E K D B 10) og engelsk (A K Q J T) notation virker begge. Appen læser kun teksten og henter intet fra nettet.

Eksempel: bordet har E D B 10, hånden 6 5 4 3 2, og målet er 5 stik.

| Linje | Chance for 5 stik |
| --- | --- |
| Lille fra begge hænder; lægger Vest en honnør, tages den med esset | 50,00 % |
| Esset slås | 12,43 % |
| Damen fra bordet; dækker Øst, lægges der lille, ellers løber den | 0 % |

Hver linje står på et linjekort med nummererede trin og hvis/så-grene. Under trinene står linjens gennemsnitlige antal stik. Analysen viser den bedste linje for hvert første udspil: alle linjer inden for 0,5 procentpoint af den bedste og op til tre alternativer, der ligger længere nede.

Under linjerne står forudsætningerne, fx "a priori · ubegrænsede forbindelser · optimalt modspil". Med en situation eller begrænsede forbindelser står de i stedet her (afsnit 2.4 og 2.5).

### 2.2 Sidningerne

Sandsynlighedsbåndet har én vandret søjle pr. linje, delt i sidninger efter deres chance. Felterne står i samme rækkefølge for alle linjer, så du kan se, hvor linjerne er uenige. Blåt med ✓ er nås, orange med ✕ er nås ikke.

Under båndet står sidningerne i en tabel med Vest, Øst, chancen og én kolonne pr. linje. De sidninger, hvor linjerne giver forskelligt resultat, står først under mærket "afgør" med deres antal og samlede chance, fx "4 sidninger · 25,00 %". "Vis alle sidninger" folder resten ud, grupperet efter fordeling eller efter hvor honnørerne sidder. Hver gruppe har en mellemoverskrift med sin chance og sit antal sidninger, fx "2–2 · 40,70 % · 6 sidninger" eller "K · 50,00 % · 8 sidninger".

En række samler de sidninger, der kun adskiller sig i små kort. Ligger modpartens kort i et hul mellem dine kort, hvor de alle er 10 eller højere, vises de konkret; ellers vises de som x (afsnit 4.3). Tallet i parentes i Øst-cellen er antallet af sidninger i rækken, og under rækkens samlede chance står chancen for hver af dem:

| Vest | Øst | Chance |
| --- | --- | --- |
| K x | x x (3) | 20,35 % (3 × 6,78 %) |
| K x x | x (3) | 18,65 % (3 × 6,22 %) |
| K | x x x | 6,22 % |
| K x x x | – | 4,78 % |

I eksemplet med E D B 10 over 6 5 4 3 2 mangler K 9 8 7, og linjen "lille fra begge hænder" vinder, når kongen sidder hos Vest. Det er de fire rækker ovenfor, i kort form `Kx–xx(3)`, `Kxx–x(3)`, `K–xxx` og `Kxxx–renonce`: 8 sidninger og tilsammen 50,00 %. Den korte form bruges også i sætninger som "Linjerne er uenige i …", og de tæller sidninger, ikke rækker.

### 2.3 Sammenlign linjer

Mærket "afgør" viser de sidninger, hvor linjerne giver forskelligt resultat. Som standard sammenlignes de viste linjer.

- **Sammenlign:** med præcis to linjer krydset af viser båndet og tabellen kun de to, og "afgør" gælder dem. Over tabellen står, hvor tit hver linje vinder alene, fx "Linje A vinder alene i 3 sidninger (14,0 %), linje B i 1 (6,2 %)". Forskellen mellem de to tal er forskellen mellem linjernes chance.
- **Vis alle udspil:** viser alle første udspil, også dem langt under den bedste og dem med 0 %, fx "damen fra bordet". De viste linjer beholder deres bogstaver.
- **Egne linjer:** du kan skrive din egen linje i linjeeditoren og få den regnet og sammenlignet ved siden af løserens.

### 2.4 Situationen

Panelet Situationen under bordet bruger det, du ved fra meldingerne og spillet. "Angiv situationen" åbner felterne, som sættes med − og +:

| Felt | Vest | Øst | Standard |
| --- | --- | --- | --- |
| Kendte kort i andre farver | 0–13 | 0–13 | 0 |
| Maks. hp i farven | 0–10 | 0–10 | 10 |

- **Kendte kort** er de kort, en modspiller har vist i de andre farver. Ledige pladser er 13 minus de kendte kort (afsnit 4.1).
- **Maks. hp** er de fleste honnørpoint i farven (E 4, K 3, D 2, B 1), en modspiller kan have, fx fordi han har passet.
- **Chancerne er betingede:** procenten er chancen givet situationen. Udelukkede sidninger står ikke i båndet og tabellen, og en linje siger, hvor mange de er.
- **Beregningen** sker i browseren, fordi bankens tal er a priori. Den starter af sig selv lige efter dit sidste tryk og viser den tid, der er gået. Du kan stoppe den.

| Bordet / hånden, 5 stik | Situation | Chance |
| --- | --- | --- |
| E D B 10 / 6 5 4 3 2 | Ingen | 50,00 % |
| E D B 10 / 6 5 4 3 2 | Vest 5, Øst 2 kendte kort | 42,11 % |
| E D B 10 / 6 5 4 3 2 | Øst maks. 0 hp | 100,00 % |
| E D B 10 / 6 5 4 3 2 | Vest maks. 0 hp | 12,43 % |
| E D B 10 / 6 5 4 3 2 | Vest maks. 0 hp, Vest 5 og Øst 2 kendte kort | 6,86 % |
| B 5 / E D 7 6 4 2 | Vest maks. 0 hp | 84,78 % (knægten fra bordet) |

Spil den selv, åbnet fra Analyse, giver kun sidninger, der er mulige i situationen. Træningens opgavetype "Med optælling" bruger de samme ledige pladser.

### 2.5 Forbindelser

Som standard er forbindelserne ubegrænsede: spilføreren spiller ud fra den hånd, han vil, som i banken. I panelet Situationen kan du i blokken Forbindelser sætte, hvor mange sikre indgange Nord og Syd har i de andre farver, og hvem der er inde:

| Felt | Valg | Standard |
| --- | --- | --- |
| Indgange til Nord | 0–5 eller ubegrænset | Ubegrænset |
| Indgange til Syd | 0–5 eller ubegrænset | Ubegrænset |
| Inde | Nord eller Syd | Syd |

Feltet Inde vises kun, når en hånd har begrænsede indgange. Reglerne er:

- **Udspil fra hånden, der er inde,** er gratis. Et udspil fra den anden hånd bruger en indgang til den hånd. Uden indgange kan der ikke spilles ud derfra.
- **Vinder du stikket,** er hånden med det vindende kort inde.
- **Vinder modspillet stikket,** er ingen hånd inde, og næste udspil bruger en indgang, uanset hvilken hånd du spiller ud fra.
- **Mange indgange er det samme som ubegrænset:** har en hånd mindst lige så mange indgange, som den har kort, regnes den som ubegrænset. Er begge hænder det, bruges bankens tal.

Valgene står som chips under bordet, fx "Syd inde · Syd 2 indgange", og i forudsætningslinjen, fx "a priori · Syd inde, Nord ubegrænset og Syd 2 indgange · optimalt modspil". Et udspil, der bruger en indgang, står i linjen som fx "Hånden nås med en sideindgang, og der spilles lille til esset." En egen linje, der spiller ud fra en hånd uden indgang, afvises med en besked om, hvilket trin det gælder. I Spil den selv, åbnet fra Analyse, tælles indgangene ned, og knapperne for en hånd, der ikke kan nås, er grået ud.

Den blokerede farve viser, hvad forbindelserne betyder. Bordet har esset alene, og hånden har K D B 3 2:

| Forbindelser | 4 stik | 5 stik |
| --- | --- | --- |
| Ubegrænsede | 100,00 % | 62,17 % |
| Nord inde, Syd 0 indgange | 0,00 % | 0,00 % |
| Syd inde, Nord og Syd 0 indgange | 0,00 % | 0,00 % |
| Nord inde, Syd 1 indgang | 100,00 % | 62,17 % |
| Syd inde, Syd 1 indgang | 100,00 % | 62,17 % |

Esset skal væk, før hånden kan tage sine stik, og så kræver det én indgang til hånden. Uden den bliver det ét stik.

Med E D B 10 over 6 5 4 3 2, 5 stik, Syd inde og Nord ubegrænset afhænger chancen af indgangene til hånden:

| Indgange til Syd | Chance for 5 stik |
| --- | --- |
| 1 | 26,57 % |
| 2 | 45,22 % |
| 3 eller ubegrænset | 50,00 % |

Med to indgange taber linjen kun sidningen Kxxx–renonce (4,78 %), fordi kipningerne og den sidste lille i hånden kræver tre indgange til hånden. Med én indgang vinder den kun, når Vest har kongen single eller K x.

### 2.6 Hvad nu?

Efter første runde er et kort faldet, og du skal vælge fortsættelsen. Opgavetypen bruger løserens chancer efter det, der er set, og det er her, begrænset valg trænes. Lægger Øst damen under esset med bordet E K 10 3 2 og hånden 7 6 5 4, vinder kipningen mod knægten 64,7 %.

### 2.7 Spil den selv

Du spiller kombinationen stik for stik mod et regelstyret modspil. Anden hånd lægger lavt og dækker 10 eller højere med det billigste kort, der slår. Fjerde hånd vinder så billigt som muligt. Den aktuelle sidning lyser op i båndet. Åbnet fra Analyse med begrænsede forbindelser står det under bordet, hvem der er inde, og hvor mange indgange der er tilbage, fx "Nord inde · Syd 0 indgange".

### 2.8 Hold eller par

Nogle kombinationer har én bedste linje til holdkamp (chancen for målet) og en anden til parturnering (flest stik i gennemsnit). Opgavetypen "Hold eller par" viser begge linjer og hvad sikkerhedsspillet koster i stik.

## 3 Eksempler

Tabellen viser løserens resultat for 11 kombinationer, de fleste fra bridgelitteraturen. Alle løsninger er certificeret optimale (afsnit 4.5), og procenterne stemmer med to decimaler med en uafhængig beregning.

| Bordet | Hånden | Mål | Bedste linje | Chance | Kilde |
| --- | --- | --- | --- | --- | --- |
| E D B 10 | 6 5 4 3 2 | 5 | Lille fra begge hænder | 50,00 % | Eksempel |
| E D B 10 | 6 5 4 3 2 | 5 | Samme, sidefarve 5-2 hos Vest | 42,11 % | Eksempel |
| B 5 | E D 7 6 4 2 | 5 | Knægten fra bordet | 76,30 % | Kelsey |
| B 5 | E D 7 4 3 2 | 5 | Esset slås | 73,48 % | Kelsey |
| D 10 4 | E 9 8 6 3 2 | 5 | Lille mod 10'eren | 81,35 % | Dormer |
| D 10 4 | E 8 7 6 3 2 | 5 | Esset slås | 78,00 % | Dormer |
| E 5 | B 10 6 4 3 | 3 | Esset slås | 66,21 % | Kelsey |
| B 6 5 | E K 7 2 | 3 | Lille til esset | 72,04 % | Villy Dam |
| K D B 6 | 8 7 3 | 3 | Lille mod kongen | 70,83 % | Villy Dam |
| D B 6 | E 7 4 2 | 3 | Lille mod damen | 70,83 % | Root |
| E B 8 | 10 3 2 | 2 | 10'eren fra hånden | 39,66 % | Encyclopedia |

Tre af eksemplerne viser, hvad analysen kan bruges til:

- **Standardlinjen er ikke altid bedst.** Med B 5 over E D 7 6 4 2 anbefaler Kelsey esset først (73,48 %). Knægten fra bordet giver 76,30 %, fordi den også vinder mod singleton 8, 9 eller 10 hos Vest. Byttes 6'eren med 3'eren, bliver esset bedst igen.
- **Mellemkortene afgør.** Med D 10 4 over E 9 8 6 3 2 giver lille mod 10'eren 81,35 % mod esset først 78,00 %. Byttes 9'eren med 7'eren, er esset først bedst.
- **Små forbedringer findes også.** Med E B 8 over 10 3 2 giver Encyclopedia 39 % for lille mod 8'eren. 10'eren fra hånden giver 39,66 % mod 38,70 %.

De fire eksempler om begrænset valg (Kelsey, Villy Dam og Root) handler om, hvad der sker efter første eller anden runde. I Farvebehandling er det opgavetypen "Hvad nu?".

## 4 Beregningsmodellen

Løseren behandler farvebehandling som et spil mellem to parter med skjult information og løser det eksakt. Spilføreren ser kun de spillede kort, modspillet kender alle kort, og resultatet er den linje, der giver størst chance mod det bedste modspil. Intet procenttal er tastet ind; alt regnes ud fra kortene.

### 4.1 Sidninger og deres vægt

Farven mangler n kort. En sidning er en konkret fordeling af dem mellem Vest og Øst, så der er 2ⁿ sidninger. Har Vest k bestemte af kortene, er chancen

`P = C(U − n, v_V − k) / C(U, v_V), hvor U = v_V + v_Ø`

Her er C(a, b) antallet af måder at vælge b ud af a, og v_V og v_Ø er de ledige pladser hos Vest og Øst. Uden anden viden er begge 13. Kendes antallet af kort i andre farver, trækkes de fra. Med fire manglende kort giver formlen 6,78 % pr. konkret 2-2-sidning, 6,22 % pr. 3-1 og 4,78 % pr. 4-0.

Chancerne regnes som eksakte brøker med store heltal, så der ikke opstår afrundingsfejl undervejs.

### 4.2 Spillet

Spilføreren styrer Nord og Syd og vil maksimere chancen for målet. Modspillerne vil minimere den. Spillet har fem slags knuder: udspil, 2. hånd, 3. hånd, 4. hånd og slut. Ved udspil og 3. hånd beslutter spilføreren, ved 2. og 4. hånd en modspiller.

To regler gør modellen realistisk:

- **Spilføreren ser kun de spillede kort.** To sidninger, der ser ens ud for ham, får samme beslutning. Derfor bruges dobbeltdummy ikke: den vælger den heldige spillemåde i hver sidning og giver for høje tal.
- **Modspillet kender alle kort og blander sine valg.** Et fast regelsæt for modspillet kan løseren udnytte. Med E 10 8 x over K B 9 x giver et regelstyret modspil 100 % for 4 stik, mod ca. 53 % i virkeligheden.

Begrænset valg følger af sig selv. Har Øst K D, lægger han hver honnør halvdelen af gangene. Med singleton dame er han tvunget. Derfor vinder kipningen, når damen falder, 64,7 % med bordet E K 10 3 2 og hånden 7 6 5 4.

**Med begrænsede forbindelser** er hvem der er inde og antallet af indgange en del af spillets tilstand. Ved udspil kan spilføreren kun vælge de hænder, der kan nås, og et udspil fra den anden hånd tæller dens indgange ned. Hvem der er inde og indgangene er offentlige, så de ændrer ikke, hvad spilføreren og modspillet ved. Uden begrænsning er spillet præcis som i banken. Kan ingen hånd med kort nås, slutter spillet med de stik, der er vundet.

### 4.3 Huller og ligeværdige kort

Modpartens kort, der ligger mellem to af spilførerens kort, er ligeværdige. De udgør et hul. Det eneste, der tæller, er hvor mange kort Vest og Øst har i hvert hul. Spilførerens egne ligeværdige kort behandles også som ét. Det gør spiltræet mange gange mindre uden at ændre spillets værdi.

Træet skelner mellem knuder og items. En knude er det, spilføreren ved: de spillede kort. Et item er en knude sammen med én sidning: det, modspillet ved. Knuderne er nummereret dybde-først, så et deltræ fylder et sammenhængende interval.

**Med en hp-grænse deles hullerne.** Er en grænse for maks. hp sat, og binder den, er kortene i et hul ikke længere ligeværdige: Vest med kongen kan være udelukket, mens Vest med 9'eren er mulig. Hvert hul deles derfor efter honnørpoint, så E, K, D og B står hver for sig, og 10'eren og lavere står samlet. Delene holdes adskilt hele spillet, også når to huller slås sammen, fordi spilføreren har spillet kortet imellem dem. Ved bordet ser spilføreren, hvilken honnør der faldt, og det gør han også i løseren.

En sidnings vægt er a priori-vægten med de ledige pladser, når begge modspilleres hp ligger inden for grænserne, ellers 0. Nævneren er summen af vægtene, så chancerne bliver betingede. Uden en bindende grænse deles intet, og spillet er præcis som før.

### 4.4 Løsning med CFR+

Spillet løses med CFR+ (counterfactual regret minimization). Begge sider spiller træet igennem igen og igen og flytter vægt mod de valg, de fortryder ikke at have taget. Gennemsnittet af strategierne nærmer sig ligevægten, hvor ingen af parterne kan gøre det bedre.

Undervejs giver to tal en ramme om den sande værdi:

| Grænse | Hvordan den findes |
| --- | --- |
| Nedre | Modspillets bedste svar på spilførerens gennemsnitlige strategi |
| Øvre | Spilførerens bedste svar på modspillets gennemsnitlige strategi |

Hvert første udspil er et selvstændigt delspil, fordi udspillet er offentligt. Løseren finder derfor den bedste linje for hvert udspil for sig. Den bedste af dem er kombinationens værdi, og de andre er alternativerne. Løseren stopper efter højst 20.000 runder.

### 4.5 Certificering

Løseren søger en ren linje: ét bestemt valg i hver af spilførerens knuder. Linjens garanti regnes eksakt: i hver sidning vælger modspillet det værste for spilføreren. Ligger garantien inden for 0,002 procentpoint af den øvre grænse, er linjen bevist optimal, og den eksakte garanti er resultatet.

Kræver det optimale spil, at spilføreren blander, fx om en honnør skal dækkes, findes ingen ren linje. Så stopper løseren, når grænserne ligger inden for 0,01 procentpoint, og værdien er midten af dem. Resultatet mærkes ikke-certificeret.

### 4.6 Mål og parturnering

Til holdkamp maksimeres chancen for at nå målet, P(stik ≥ mål). Til parturnering maksimeres det forventede antal stik. Den samme løser klarer begge; kun udbetalingen i slutknuderne skifter fra 1/0 til antal stik.

Linjer inden for 0,5 procentpoint af den bedste regnes som lige gode. Grænsen kommer fra kilderne, der kun angiver hele procenter.

### 4.7 Fra strategi til tekst

Løserens resultat er et strategitræ. Det oversættes til en kort hovedlinje og de grene, der er nødvendige, med faste sætningsskabeloner, fx "Knægten fra bordet; dækker Øst, tages stikket med esset, ellers løber den". Bruger et udspil en indgang, begynder trinnet med "Hånden nås med en sideindgang" eller "Bordet nås med en sideindgang". Trinene står i beskrivende form, fx "Esset slås." Hver skabelon findes på dansk og engelsk. Efter linjens sidste trin spiller løseren resten optimalt ud fra det, der er set.

### 4.8 Hyppighed

Opgaverne kommer i rækkefølge efter, hvor tit kombinationen opstår ved bordet. Hyppigheden er chancen pr. spil for, at du og makker har kombinationen i en af de fire farver:

`P = C(39, 13 − a) · C(26 + a, 13 − b) / (C(52, 13) · C(39, 13)) · w · 4 · s`

Her er a og b antal kort i hånden og på bordet, w antal måder at vælge de små kort på, og s = 2, når hånd og bord er forskellige. Appen viser tallet som naturlig frekvens, fx "ca. hver 5. klubaften" (25 spil).

### 4.9 Forudsætninger og grænser

| Forudsætning | I dag |
| --- | --- |
| Chancer | A priori, eller betinget af situationen: kendte kort og maks. hp |
| Forbindelser | Ubegrænsede i banken. I Analyse kan indgangene til Nord og Syd og hvem der er inde sættes; indgangene er sikre |
| Modspillet | Spiller aldrig farven selv, heller ikke for at tage en indgang |
| Manglende kort | Op til 8 |

Bankens 657 kombinationer er regnet på forhånd a priori og med ubegrænsede forbindelser med `scripts/solve.ts`. Andre kombinationer og alle situationer regnes i browseren i en Web Worker, så appen ikke fryser.

Beregningstiden kan blive lang. Målt i Node på en bærbar for ét mål (3 stik):

| Kombination | Situation | Knuder | Median | Chance |
| --- | --- | --- | --- | --- |
| D B 6 / E 7 4 2 | Ingen | 759 405 | 246 s | 70,83 % |
| D B 6 / E 7 4 2 | Vest maks. 2 hp | 800 765 | 188 s | 45,22 % |
| D B 6 / E 7 4 2 | Syd inde, Nord 1 og Syd 1 indgang | 404 545 | 60 s | 44,81 % |
| E 10 3 2 / K 9 5 4 | Ingen | 269 343 | 21,3 s | 94,35 % |
| E 10 3 2 / K 9 5 4 | Vest maks. 2 hp | 593 365 | 45,5 s | 100,00 % |

Delingen af huller gør træet fra 5 % til 2,2 gange større, og tiden følger træet. Med begrænsede forbindelser er træet højst 2 % større end uden og ofte mindre, fordi indgangene skærer linjer væk. På en telefon tager det længere.

### 4.10 Validering

Løseren er kontrolleret mod fire kilder:

| Kilde | Omfang | Resultat |
| --- | --- | --- |
| Accepttests i Vitest | B432 / E1065, toppe eller kipning, begrænset valg, forbindelser m.fl. | Alle består |
| De klassiske farvebehandlinger (inspiration: Suit Combinations in Bridge, Jethalal M. Shah) | Alle brugbare cases, begge fortolkninger af x | 14 mål og 3 cases fjernet som kildefejl; resten bruger løserens tal |
| The Official Encyclopedia of Bridge | 55 kombinationer, 92 mål, 28 gennemsnit | Inden for 0,5 procentpoint, kendte afvigelser dokumenteret |
| Uafhængig beregning | 11 eksempler | Samme procent med to decimaler i alle |

De klassiske farvebehandlinger angiver x som små kort uden at sige, om spilførerens x'er er de laveste. Valideringsrapporten regner begge fortolkninger, og appen bruger "lav": spilførerens x'er er de laveste kort.

## 5 Styrker og begrænsninger

Modellen er eksakt: den beviser, at linjen er optimal mod det bedste modspil, også med en situation og begrænsede forbindelser. De tilbageværende begrænsninger er beregningstiden og to forudsætninger: indgangene i de andre farver er sikre, og modspillet spiller aldrig farven.

| Emne | I dag |  |
| --- | --- | --- |
| Metode | Spil med skjult information, løst med CFR+ | Styrke |
| Garanti | Certificeret optimal linje, eller grænser på 0,01 procentpoint | Styrke |
| Modspil | Optimalt og blandet; kender alle kort | Styrke |
| Begrænset valg | Følger af modspillets blandede valg | Styrke |
| Parturnering | Flest stik i gennemsnit og "Hold eller par" | Styrke |
| Hyppighed | Pr. spil og pr. klubaften | Styrke |
| Situationen | Kendte kort og maks. hp hos Vest og Øst, eksakt | Styrke |
| Forbindelser | Indgange til Nord og Syd (0–5 eller ubegrænset) og hvem der er inde, eksakt | Styrke |
| Sidninger | Kompakt notation med antal og chance pr. sidning | Styrke |
| Input | Kortvælger, bankens kombinationer og import af tekst, LIN og BBO-adresser | Styrke |
| Sammenligning | To valgte linjer med unikke vindere; alle første udspil | Styrke |
| Sideindgange | Regnes som sikre; modspillet kan ikke tage dem og spiller aldrig farven | Begrænsning |
| Beregningstid | 3–4 min. i Node for de tungeste kombinationer | Begrænsning |

## 6 Udvidelser

Analysen er udbygget i flere omgange:

| Udgivet | Udvidelse | Afsnit |
| --- | --- | --- |
| 18. oktober 2026 | Situationen, import af tekst, LIN og BBO-adresser, og valg af linjer | 2.1, 2.3 og 2.4 |
| 20. oktober 2026 | Kompakt notation for sidninger | 2.2 |
| 21. oktober 2026 | Begrænsede forbindelser | 2.5 |
| 21. oktober 2026 | Analyse som selvstændigt modul | 1 |

Der er ingen planlagte udvidelser lige nu.
