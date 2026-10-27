# SPEC-analyse-modul

20. oktober 2026 · Frank

Analyse i farvebehandling bliver også et selvstændigt modul. Det har sin egen adresse (`#analyse`), sit eget kort på appens forside og sit eget kort på forsiden af www.kontraktbridge.dk, ved siden af Håndevaluering. Guiden til analysen ("Guide til Farvebehandling – Analyse") kommer ind i modulet som en knap øverst.

Analyse bliver samtidig, hvor den er i dag: som fanen Analyse i sporet Farvebehandling. Det er samme skærm, samme data og samme lagring to steder fra.

Forudsætning: guiden lægges først ind, når SPEC-forbindelser.md er udgivet, og guiden er opdateret med forbindelserne og notationen for sidninger (leverancetrin 3). Trin 1 og 2 kan bygges før.

## Afgrænsning

Før arbejdet starter:

1. Commit og tag den nuværende app, fx `v12-foer-analyse-modul` (eller næste ledige nummer).
2. Arbejd på grenen `analyse-modul`, og flet først ind efter godkendelse.
3. Kør alle eksisterende tests før og efter. De skal bestå uændret, undtagen de tests, der tæller forsidens kort; dem retter Claude Code og nævner under Afklaret.

| Sted | Må ske | Må ikke ske |
| --- | --- | --- |
| `src/app/App.tsx` | skærmen og adressen `analyse` | ændre de andre spors adresser og Tilbage-adfærd |
| `src/app/tracks.ts` | ét kort "Analyse" i gruppen Spilføring efter Farvebehandling, med ⓘ | ændre de andre kort og grupper |
| `src/app/status.ts` | intet; modulet har ingen streak eller niveau | alt |
| `ui/FarvebehandlingScreen.tsx` | en valgfri prop, der viser Analyse alene uden fanerne Træning og Selvvalgt | ændre fanerne, sessionen eller indlæsningen af banken |
| `ui/Analysevindue.tsx` | knappen Guide øverst | ændre resten af analysen |
| `ui/Guide.tsx` (ny), `content/guide-analyse.md` (ny) | guiden og en lille visning af den (trin 3) | et markdown-bibliotek eller andre nye afhængigheder |
| `ui/texts.ts` | nye tekster på dansk og engelsk med ⓘ | — |
| Lagring | intet; modulet bruger `farvebehandling:v1` som fanen | nye felter, ny nøgle |
| Løseren, banken, appens data, tokens | intet | alt |
| Repoet `frankpedersen.github.io` (`index.html`) | ét kort efter Håndevaluering og ét link i sidefodens liste (trin 2) | ændre de andre kort, stilen eller menuen |
| `SPEC-farvebehandling.md`, `CLAUDE.md` | opdateres i samme commit som adfærden | — |

Kræver noget alligevel en ændring ud over tabellen, skal Claude Code stoppe og spørge.

Besked til Claude Code:

> Læs CLAUDE.md, SPEC-farvebehandling.md, SPEC-forside-spor.md og SPEC-analyse-modul.md. Byg leverancetrin 1 på grenen `analyse-modul`, skriv accepttestene først, og stop efter trinnet, så jeg kan godkende. Fanen Analyse i Farvebehandling skal virke præcis som i dag.

## Modulet i appen

| Del | Indhold |
| --- | --- |
| Adresse | `#analyse` åbner Analyse direkte, også som første side (link fra kontraktbridge.dk). Tilbage fører til forsiden som i de andre spor |
| Skærmen | `FarvebehandlingScreen` med Analyse alene: overskriften "Farvebehandling – Analyse" / "Suit combinations – Analysis", ingen faner. Bank, kortvælger, import, situation, linjer, egne linjer og Spil den selv virker som i fanen |
| Forsidekortet | i gruppen Spilføring efter Farvebehandling: "Analyse" / "Analysis", beskrivelse "Slå en kombination op · linjer, chancer og sidninger" / "Look up a combination · lines, chances and layouts". Kortet har ingen streak eller niveau og intet "I dag"-forslag |
| ⓘ på kortet | "Analysen fra Farvebehandling som selvstændigt modul: slå enhver kombination op, og se linjerne, chancerne og sidningerne, også med kendte kort, hp-grænser og forbindelser. Den findes også som fanen Analyse i Farvebehandling." / engelsk tilsvarende |
| Data | samme lagring som fanen: en egen linje gemt i modulet ses i fanen og omvendt. Et kig i modulet skriver intet, som i dag |

## Kortet på kontraktbridge.dk

Kortet står efter Håndevaluering i `index.html` i repoet `frankpedersen.github.io` og følger de andre kort (`<a class="card">` med `art`, `kicker`, `h3`, `p` og `meta`, og `data-en` på al tekst):

| Felt | Dansk | Engelsk |
| --- | --- | --- |
| `href` | `/fordelingstraeneren/#analyse` | |
| `art` | stort tal `62,17 %` og mørk pille `5 stik` (samme opbygning som Håndevaluerings `P 26` og `Udgang`) | `62.17 %` · `5 tricks` |
| `kicker` | Spilføring | Declarer play |
| `h3` | Analyse | Analysis |
| `p` | Slå enhver kombination op, og se linjerne, chancerne og sidningerne – også med kendte kort, hp-grænser og forbindelser. Med guide til regnemodellen. | Look up any combination and see the lines, the chances and the layouts – also with known cards, HCP limits and entries. With a guide to the calculation model. |
| `meta` | I Fordelingstræneren · Åbn analysen → | In Fordelingstræneren · Open the analysis → |

Sidefodens liste over trænerne får linket "Analyse" / "Analysis" til `/fordelingstraeneren/#analyse` efter Håndevaluering. Teksten "med guide til regnemodellen" tilføjes først, når trin 3 er udgivet; indtil da slutter teksten efter "forbindelser".

## Guiden i toppen

| Del | Indhold |
| --- | --- |
| Kilden | to filer: `src/farvebehandling/content/guide-analyse.md` (dansk) og `guide-analyse.en.md` (engelsk), eksporteret fra Franks dokument "Guide til Farvebehandling – Analyse" og den engelske udgave "Guide to Suit Combinations – Analysis" i den opdaterede udgave. De to har samme afsnit og nummerering. Claude Code skriver ikke i guidens tekst |
| Knappen | "Guide" øverst i Analyse, til højre for overskriften, både i modulet og i fanen, med ⓘ: "Sådan bruger du analysen, og sådan regner den." |
| Visningen | `ui/Guide.tsx` viser guiden i samme skærm med Tilbage til analysen; den valgte kombination og situationen er uændrede bagefter. Visningen klarer det, guiden bruger: overskrifter, afsnit, punkt- og nummerlister, tabeller, fed og kode. Tabeller rulles vandret i deres egen boks |
| Indholdsfortegnelse | afsnittenes overskrifter (niveau 2) øverst som links |
| Indlæsning | guiden hentes dovent, første gang knappen bruges, og er med offline |
| Sprog | guiden vises på appens sprog: dansk fra `guide-analyse.md`, engelsk fra `guide-analyse.en.md`. Knappen hedder "Guide" på begge sprog, og ⓘ-teksten på engelsk er "How to use the analysis, and how it calculates." |

## Leverancetrin

1. **Modulet i appen:** adressen, skærmen uden faner, forsidekortet med ⓘ og tests.
2. **Kortet på kontraktbridge.dk** og linket i sidefoden. Udgives efter trin 1, så linket virker.
3. **Guiden:** når SPEC-forbindelser.md er udgivet, opdateres dokumentet (afsnit 2 om Situationen og forbindelserne, sidningstabellen med notationen, afsnit 5 om begrænsningerne og afsnit 6), og den engelske udgave skrives ud fra den. Frank lægger de to eksporterede filer i repoet, og Claude Code bygger knappen og visningen.

Hvert trin er færdigt, når `npm test` er grøn, `SPEC-farvebehandling.md` er opdateret, og Frank har godkendt.

## Accepttest

Trin 1:

- [x] Alle eksisterende tests består; tests, der tæller forsidens kort, er rettet og nævnt under Afklaret.
- [x] `#analyse` som første adresse åbner Analyse med banken og den hyppigste kombination, uden fanerne Træning og Selvvalgt.
- [x] Tilbage fra modulet fører til forsiden; åbnet fra forsiden går Tilbage et skridt tilbage i browseren.
- [x] Fanen Analyse i Farvebehandling virker som i dag, også når den åbnes fra klubaftenen.
- [x] En egen linje gemt i modulet findes i fanen Analyse, og `farvebehandling:v1` har ingen nye felter.
- [x] At åbne modulet og kigge skriver intet i lagringen, og forsidens status for Farvebehandling (streak, niveau, I dag) er uændret.
- [x] Forsidekortet "Analyse" står i Spilføring efter Farvebehandling, har ⓘ og ingen streak.
- [x] Ved 390 px er `document.documentElement.scrollWidth` lig med skærmbredden i modulet.
- [x] Alle nye tekster findes på dansk og engelsk, og de engelske skærme indeholder ingen dansk tekst.

Trin 2:

- [x] Kortet står efter Håndevaluering, linker til `/fordelingstraeneren/#analyse`, og al tekst har `data-en`.
- [x] Linket åbner Analyse direkte på www.kontraktbridge.dk, på computer og mobil.
- [x] Ved 390 px har forsiden ingen vandret rulning.

Trin 3:

- [x] Knappen Guide står øverst i Analyse i modulet og i fanen og åbner guiden; Tilbage viser samme kombination og situation som før.
- [x] Hver overskrift i `guide-analyse.md` vises på dansk og hver overskrift i `guide-analyse.en.md` på engelsk, og indholdsfortegnelsen linker til afsnittene på niveau 2.
- [x] De to filer har samme antal overskrifter med samme nummerering (fx "2.1"), så de ikke kommer ud af takt.
- [x] Guidens tabeller vises som tabeller, og ved 390 px rulles de i deres egen boks uden vandret rulning på siden.
- [x] Guiden er ikke med i appens første indlæsning, men kan åbnes offline efter første besøg.
- [x] På engelsk viser knappen Guide den engelske guide, og skærmen indeholder ingen dansk tekst (testen i `ui/i18n.test.tsx`).
- [x] Ingen af guiderne indeholder "bridgehands".
- [x] Komponentfilerne indeholder ingen farveværdier og ingen tal med enhed, undtagen 0, 1px-streger og procenter.

## Afklaret

1. **Ét modul, to indgange.** Det selvstændige modul og fanen er samme komponent med samme data. Ingen kopi af analysen.
2. **Ingen streak:** analysen er et opslagsværk, ikke en daglig træning, så kortet har ingen status og indgår ikke i "I dag".
3. **Guiden skrives i dokumentet**, ikke i koden. En ny udgave af guiden er en ny eksport af begge filer.
4. **Guiden findes på dansk og engelsk** (Franks valg 20. oktober 2026). Trin 3 udgives først, når begge filer er der.

Claude Codes bygning af leverancetrin 1 på grenen `analyse-modul` (20. oktober 2026; appen før er tagget `v12-foer-analyse-modul`):

5. **Forsiden (Franks svar 20. oktober 2026):** "Ja, du må ændre `src/app/screens/HomeScreen.tsx`, men kun så et kort kan være uden status, fx med et felt `status: false` på kortet i `tracks.ts`. Kortet Analyse viser ingen streak, intet niveau og intet mærke. Det tælles ikke med i I dag, så der står fortsat 'x af 4 spor', og det kommer aldrig med i forslaget til dagens session. Sporenes kort, I dag, Velkomst og rækkefølgen af forslagene skal være som i dag."

   Bygget sådan: `TrackCard` har det valgfrie felt `status?: false`, og kortet Analyse står i `TRACK_CARDS` efter Farvebehandling med `status: false`. Forsiden regner I dag, Velkomst, det næste spor og den ekstra session ud fra kortene med status alene, i samme rækkefølge som før, og tegner et kort uden status med navn, pil, beskrivelse og ⓘ, men uden streak, niveau og mærke. Ellers er `HomeScreen.tsx` uændret.
6. **Tests:** `src/app/status.test.ts` byggede sporenes rækkefølge ud fra `TRACK_CARDS`; den tager nu kun kortene med status (en linje). Ingen andre eksisterende tests er rettet. Accepttesten står i `src/app/analyse-modul.test.tsx` (10 tests, også Velkomst ved første besøg og "4 af 4 spor" uden forslag om Analyse).
7. **Skærmen:** `FarvebehandlingScreen` med `analysisOnly`: overskriften "Farvebehandling – Analyse" med ⓘ (samme tekst som kortets), ingen faner, topbjælke og sidefod som på sporenes skærme. `App.tsx` har `analyse` med de andre adresser, så Tilbage og browserens tilbage-knap virker som i sporene.
8. **Bredden ved 390 px** er målt i Chrome (headless, 390 × 844) på den byggede app: forsiden, også med kortets ⓘ åbent, og modulet som første adresse, med ⓘ i hovedet, alle sidninger, Situationen og kortvælgeren åbne. `scrollWidth` er 390 i alle 7 målinger. jsdom kan ikke måle bredder, så målingen er ikke en Vitest-test.
9. **Forbindelserne:** kortets ⓘ nævner forbindelser, som kommer med SPEC-forbindelser.md (grenen `forbindelser`). Flettes modulet ind før forbindelserne, nævner teksten noget, appen endnu ikke har.

10. **Trin 1 er godkendt af Frank** (20. oktober 2026).

Claude Codes bygning af leverancetrin 2 (20. oktober 2026):

11. **Appens egen sidefod (Franks svar 20. oktober 2026: "ja tak egen sidefod"):** `src/ui/Footer.tsx` får linket "Analyse" / "Analysis" til `#analyse` efter Håndevaluering, så Trænere har de samme links som www.kontraktbridge.dk. Testen af sidefodens links i `src/app/forside.test.tsx` er rettet til de seks links, og `src/app/analyse-modul.test.tsx` tjekker, at linket åbner modulet.
12. **Kortet på kontraktbridge.dk** står i `index.html` efter Håndevaluering med samme opbygning som Håndevaluerings (`art` med stort tal og mørk pille, `kicker`, `h3`, `p` og `meta` med to dele: "I Fordelingstræneren" og "Åbn analysen →"). Teksten slutter efter "forbindelser", til trin 3 er udgivet. Sidefodens liste har linket "Analyse" til `/fordelingstraeneren/#analyse` efter Håndevaluering. Ændringen ligger på grenen `analyse-kort` i repoet `frankpedersen.github.io` og pushes først, når trin 1 er udgivet.
13. **Bredden** er målt i Chrome (headless) på `index.html`: ved 390 px er `scrollWidth` 390 på dansk og engelsk, og kortets tal og pille holder sig inden for feltet. Ved 1280 px er der heller ingen vandret rulning.
14. **"Linket åbner Analyse direkte på www.kontraktbridge.dk"** er prøvet efter udgivelsen (21. oktober 2026) i Chrome (headless) ved 390 px (mobil) og 1280 px: kortet står på www.kontraktbridge.dk, et tryk åbner `/fordelingstraeneren/#analyse` med overskriften "Farvebehandling – Analyse" og uden faner, og ved 390 px er der ingen vandret rulning på forsiden eller i modulet. Om mig har linket.
15. **Om mig (Franks svar 20. oktober 2026):** siden Om mig og kontakt (`om-mig/index.html`) har samme liste over trænere i sidefoden og får også linket "Analyse" efter Håndevaluering, så sidefoden er ens på hele kontraktbridge.dk. Siden findes kun på dansk, så linket har ingen `data-en`.
16. **Udgivelsen ventede på forbindelser (Franks valg 20. oktober 2026; udgivet 21. oktober 2026):** kortets tekst og ⓘ nævner forbindelser, så `analyse-modul` flettes først ind, når SPEC-forbindelser.md (grenen `forbindelser`, trin 3 mangler) er godkendt og flettet ind. Derefter flettes `analyse-modul` ind, og når `#analyse` virker på www.kontraktbridge.dk/fordelingstraeneren/, pushes `analyse-kort` til `main` i `frankpedersen.github.io`.

Claude Codes bygning af leverancetrin 3 på grenen `analyse-modul-guide` (21. oktober 2026, godkendt af Frank samme dag; appen før er tagget `v13-foer-analyse-guide`). Guidefilerne er hentet fra Franks gren `guide-analyse`:

17. **Knappen Guide** står øverst i analysen til højre med ⓘ, i `Analysevindue.tsx`, så den findes både i modulet og i fanen. Skærmens overskrift står i `FarvebehandlingScreen.tsx`, som tabellen kun åbner for `analysisOnly`, så knappen står lige under overskriften og ikke på samme linje.
18. **Visningen** er `ui/Guide.tsx` med en lille tolk, `ui/guideMarkdown.ts`, uden nye afhængigheder. Den klarer overskrifter, afsnit, punkt- og nummerlister, tabeller, fed, kode og links (guiden linker til appens adresse). Guidens titel (#) vises som h2 under skærmens h1, afsnittene (##) som h3 og underafsnittene (###) som h4. Indholdsfortegnelsen "Indhold" / "Contents" står lige under titlen med links til afsnittene på niveau 2; et tryk ruller til afsnittet uden at ændre adressen, fordi appen bruger adressen til skærmene (`#analyse`). "Tilbage til analysen" / "Back to the analysis" står øverst og nederst. Kombinationen og situationen ligger i analysen og er uændrede bagefter.
19. **Indlæsning og offline:** hver guide hentes med `import('…?raw')`, første gang knappen bruges, og ligger i sin egen fil, som service workeren gemmer med resten af appen (`vite.config.ts` er uændret). `guide.dist.test.ts` bygger appen og tjekker, at filerne ikke hentes ved første indlæsning og står i service workerens liste. I Chrome (headless) på den byggede app åbner guiden også, efter at serveren er slukket.
20. **Bredden ved 390 px** er målt i Chrome på den byggede app: guiden på dansk og engelsk er 390 px bred, og de brede tabeller (4 på dansk, 3 på engelsk) ruller i deres egen boks. Lange links og kodelinjer brydes. Forsiden og modulet er målt igen og er stadig 390 px.
21. **Renonce på engelsk:** `compactLayout` skriver "void" på engelsk (fx `Kxxx–void`) og "renonce" på dansk (Franks ønske 21. oktober 2026).
22. **Tests:** `src/farvebehandling/guide.test.ts` (filerne, tolken og `compactLayout`), `ui/guide.test.tsx` (knappen, Tilbage, overskrifterne, indholdsfortegnelsen, tabellerne og engelsk), `guide.dist.test.ts` (den byggede app) og en test i `ui/i18n.test.tsx`, der undtager appens navn "Fordelingstræneren" som de andre engelsk-tests.
23. **Udgivet 21. oktober 2026:** guiden er prøvet live i Chrome (headless) ved 390 px på dansk og engelsk (16 tabeller, 6 links i indholdsfortegnelsen, ingen vandret rulning). Derefter fik kortet på www.kontraktbridge.dk "Med guide til regnemodellen." og i `data-en` "With a guide to the calculation model." (`index.html` i `frankpedersen.github.io`), og kortet åbner stadig `/fordelingstraeneren/#analyse`.
