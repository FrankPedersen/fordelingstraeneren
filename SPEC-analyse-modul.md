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
| `src/app/screens/HomeScreen.tsx` | et kort uden status (fx `status: false` på kortet i `tracks.ts`): ingen streak, niveau eller mærke, og kortet tælles ikke i I dag ("x af 4 spor") eller i forslaget til dagens session | ændre sporenes kort, I dag, Velkomst eller rækkefølgen af forslag |
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

- [ ] Alle eksisterende tests består; tests, der tæller forsidens kort, er rettet og nævnt under Afklaret.
- [ ] `#analyse` som første adresse åbner Analyse med banken og den hyppigste kombination, uden fanerne Træning og Selvvalgt.
- [ ] Tilbage fra modulet fører til forsiden; åbnet fra forsiden går Tilbage et skridt tilbage i browseren.
- [ ] Fanen Analyse i Farvebehandling virker som i dag, også når den åbnes fra klubaftenen.
- [ ] En egen linje gemt i modulet findes i fanen Analyse, og `farvebehandling:v1` har ingen nye felter.
- [ ] At åbne modulet og kigge skriver intet i lagringen, og forsidens status for Farvebehandling (streak, niveau, I dag) er uændret.
- [ ] Forsidekortet "Analyse" står i Spilføring efter Farvebehandling, har ⓘ og ingen streak, niveau eller mærke.
- [ ] I dag tæller fortsat 4 spor ("x af 4 spor"), og når alle fire spor er trænet, foreslår knappen aldrig Analyse.
- [ ] Ved 390 px er `document.documentElement.scrollWidth` lig med skærmbredden i modulet.
- [ ] Alle nye tekster findes på dansk og engelsk, og de engelske skærme indeholder ingen dansk tekst.

Trin 2:

- [ ] Kortet står efter Håndevaluering, linker til `/fordelingstraeneren/#analyse`, og al tekst har `data-en`.
- [ ] Linket åbner Analyse direkte på www.kontraktbridge.dk, på computer og mobil.
- [ ] Ved 390 px har forsiden ingen vandret rulning.

Trin 3:

- [ ] Knappen Guide står øverst i Analyse i modulet og i fanen og åbner guiden; Tilbage viser samme kombination og situation som før.
- [ ] Hver overskrift i `guide-analyse.md` vises på dansk og hver overskrift i `guide-analyse.en.md` på engelsk, og indholdsfortegnelsen linker til afsnittene på niveau 2.
- [ ] De to filer har samme antal overskrifter med samme nummerering (fx "2.1"), så de ikke kommer ud af takt.
- [ ] Guidens tabeller vises som tabeller, og ved 390 px rulles de i deres egen boks uden vandret rulning på siden.
- [ ] Guiden er ikke med i appens første indlæsning, men kan åbnes offline efter første besøg.
- [ ] På engelsk viser knappen Guide den engelske guide, og skærmen indeholder ingen dansk tekst (testen i `ui/i18n.test.tsx`).
- [ ] Ingen af guiderne indeholder "bridgehands".
- [ ] Komponentfilerne indeholder ingen farveværdier og ingen tal med enhed, undtagen 0, 1px-streger og procenter.

## Afklaret

1. **Ét modul, to indgange.** Det selvstændige modul og fanen er samme komponent med samme data. Ingen kopi af analysen.
2. **Ingen streak:** analysen er et opslagsværk, ikke en daglig træning, så kortet har ingen status og indgår ikke i "I dag". `HomeScreen.tsx` må ændres til det (Claude Codes spørgsmål, Franks svar 20. oktober 2026).
3. **Guiden skrives i dokumentet**, ikke i koden. En ny udgave af guiden er en ny eksport af begge filer.
4. **Guiden findes på dansk og engelsk** (Franks valg 20. oktober 2026). Trin 3 udgives først, når begge filer er der.

Åbne punkter: ingen.
