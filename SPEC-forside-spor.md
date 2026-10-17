# SPEC-forside-spor

17. oktober 2026 · Frank

Forsiden viser de fire spor side om side med hver sit kort, og Fordeling får sin egen skærm ligesom de andre spor. Øverst står, hvor mange spor der er trænet i dag. Alle skærme får den samme sorte sidefod som www.kontraktbridge.dk. Designgrundlaget er tegnefladen "Ny struktur for trænerne" (https://claude.ai/artifact/Y9sKNd1KgmKQtHTVr2mMAw), skærmene "Fordelingstræneren · Forside", "· Fordeling-sporets egen side", "· Pointregnskab", "· Farvebehandling", "· Håndevaluering" og "· Farvebehandling, Analyse". Opgaven bygges efter leverancetrin 4 i håndevaluering, eller før, hvis Frank beslutter det.

Det er Franks beslutning (17. oktober 2026), at forsiden må læse sporenes gemte data. Den går forud for reglen i SPEC-navigation.md om, at forsiden ikke læser nøgler ud over dem, den læser i dag, men kun for læsning som beskrevet her.

## Afgrænsning

Før arbejdet starter:

1. Commit og tag den nuværende app, fx `v7-foer-forside-spor`.
2. Arbejd på grenen `forside-spor`, og flet først ind efter godkendelse.
3. Kør alle eksisterende tests før og efter.

| Sted | Må ske | Må ikke ske |
| --- | --- | --- |
| Forsiden (`src/app/screens/HomeScreen.tsx`) | ny opbygning som beskrevet nedenfor | fjerne et menupunkt eller ændre, hvilken skærm en knap åbner |
| Ny skærm Fordeling (`src/app/screens/DistributionScreen.tsx`) | fordelingssporets elementer flyttes uændrede hertil fra forsiden | ændre elementernes indhold eller adfærd |
| `src/app/tracks.ts` | ét kort pr. spor med titel, kort beskrivelse og skærm på begge sprog | indeholde logik fra sporene |
| `src/app/App.tsx` | ruten til Fordeling-skærmen; adresser pr. spor (se nedenfor) | ændre de andre skærmes adfærd |
| Ny fil `src/app/status.ts` | læser hvert spors streak, niveau og dagens status | skrive nogen nøgle |
| Sporenes egne skærme | sidefoden nederst | ændre indhold, layout eller adfærd |
| `src/ui/styles.css` og `design/tokens.json` | tre nye tokens til sidefoden (se nedenfor) | ændre værdien af eksisterende tokens |
| Vejledningen | et kort afsnit om forsiden og sidefoden på begge sprog | ændre de eksisterende afsnit |
| Lagring | ingen ændringer | skrive nogen nøgle |

Kræver noget alligevel en ændring ud over tabellen, skal Claude Code stoppe og spørge.

Besked til Claude Code:

> Byg forsiden og Fordeling-skærmen efter SPEC-forside-spor.md og skærmene på tegnefladen. Forsiden læser sporenes data, men skriver intet. Sporenes egne skærme ændres kun med sidefoden. Kør alle tests før og efter, og nævn de tests af forsiden, du har opdateret.

## Forsiden

Øverst til nederst:

1. **Topbjælke** (se "Topbjælken" nedenfor) og derunder **hoved** som i dag: appens skyline-ikon, "Fordelingstræneren" og sprogknappen. "Ny version" står under som i dag.
2. **I dag** (kun når man har trænet før): eyebrow "I dag · <ugedag og dato>", overskriften "2 af 4 spor er trænet", en måler i `ink` og en linje om det næste spor: "Næste: Fordeling, med 4 emner til repetition og 1 nyt mønster. Ca. 5 minutter." Primærknappen "Start dagens session i <spor>" starter det næste spors session direkte.
   - Det næste spor er det første spor i forsidens rækkefølge, der ikke er trænet i dag. Er alle trænet: "Alle fire spor er trænet i dag." og knappen "Tag en ekstra session i Fordeling".
3. **Velkomst** (første besøg i stedet for I dag): "Velkommen", "Bridgetræning fem minutter om dagen. Appen har fire spor, og hvert spor har sin egen daglige session, streak og XP.", "Start med Fordeling, hvis du er i tvivl. Du kan altid skifte spor her på forsiden.", knappen "Start med Fordeling" og "Se en klubaften: 100 hænder" som i dag.
4. **Grupperne** Optælling, Spilføring og Vurdering som i dag (overskrift og ⓘ). Under hver gruppe ét kort pr. spor:
   - navn og en pil, en kort beskrivelse (fra `tracks.ts`)
   - "<streak> dage i træk" og niveauet, fx "Niveau 2 · ualmindelig" eller "Niveau 3"
   - ét mærke: "✓ Trænet i dag" (`ok` på `ok-bg`), "<antal> emner til repetition" (`accent-soft`) eller "Ikke startet endnu" (`surface-2`)
   - hele kortet er én knap, der åbner sporets skærm
5. **Vejledning** og **Indstillinger** som i dag.
6. **Sidefoden.**

Fordelingssporets elementer (streak, XP og joker, niveau, I dag, Start dagens session og menupunkterne Huskepalads, Album, Klubaften og Kurver) står ikke længere på forsiden, men på Fordeling-skærmen.

## Fordeling-skærmen

- Hoved: rund tilbage-knap (←) og gruppen "Optælling" som eyebrow, derunder "Fordeling" med ⓘ og linjen "De 39 mønstre og deres hyppighed – fem minutter om dagen."
- Derunder fordelingssporets elementer med samme indhold og i samme rækkefølge som på forsiden i dag.
- Tilbage-knappen og browserens tilbage-knap fører til forsiden.

## Status fra sporene (`src/app/status.ts`)

- Læser kun: `fordelingstraener:v1`, `pointregnskab:v1`, `farvebehandling:v1` og `haandevaluering:v1` via sporenes egne indlæsningsfunktioner, så migreringer og ulæselige data håndteres som i dag.
- For hvert spor: streak i dag (`streakOn`), niveau, om dagens session er gennemført (`streak.lastDay === today`) og antal emner til repetition, hvor sporet har det.
- Mangler et spors data, eller kan de ikke læses, vises kortet som "Ikke startet endnu" uden tal.
- Dagen skifter kl. 04 som i resten af appen.
- `src/engine/` må stadig ikke importere fra `src/domain/` eller `src/system/`.

## Adresser pr. spor

Forsiden på www.kontraktbridge.dk skal kunne linke direkte til et spor:

- `#fordeling`, `#pointregnskab`, `#farvebehandling` og `#haandevaluering` åbner sporets skærm.
- Uden hash åbnes forsiden som i dag.
- Skifter man skærm, opdateres hashen, så browserens tilbage-knap virker.
- PWA'en og service workeren skal stadig virke offline med hash-adresserne.

Claude Code foreslår løsningen og spørger, før den bygges, hvis den kræver mere end ruten i `App.tsx`.

## Topbjælken

En smal sort bjælke helt øverst på forsiden og alle sporenes skærme, ikke i en session og ikke i dialoger. Den er én komponent, `src/ui/TopBar.tsx`.

- **Fuld bredde**, uden afrundede hjørner og uden luft omkring (klassen `kb-bar slim` på tegnefladen).
- Indhold: 7NT-logoet (orange meldekort, 30 × 30 px, hjørner 8 px, Manrope 800, tekst #1a1a1a) og "Kontraktbridge" (Manrope 800, 16 px, hvid) som ét link til https://www.kontraktbridge.dk/, derefter "· Fordelingstræneren" i lysegrå (#c9cdd2). Ingen menu og ingen sprogknap i bjælken; sprogknappen står i appens hoved som i dag.
- Farver ens i lys og mørk tilstand: baggrund #1a1a1a, tekst #f2f3f4, fokusring 2 px #ff9f4a. Brug `footer-bg`, `footer-text` og `footer-accent`.
- Bjælken respekterer `env(safe-area-inset-top)`, når appen er installeret.

### Fælles regler for alle sider på www.kontraktbridge.dk

- **Topbjælke:** I appsene er den fuld bredde øverst. På hubsiden står menuen inde i det sorte hero-felt. Det er bevidst.
- **Sprogknap:** På alle sider, der findes på engelsk, også hubsiden (Franks beslutning 17. oktober 2026). Fordelingstræneren gemmer sproget i sine egne indstillinger og følger derfor ikke valget fra hubsiden.
- **Sidefod:** Om mig, Trænere (5 links) og Kontakt overalt. Kun Konventionstræneren har også "Aftaler og notater".

## Sidefoden

Samme sorte sidefod nederst på forsiden og alle sporenes skærme, ikke i en session og ikke i dialoger. Den er én komponent, `src/ui/Footer.tsx`, med al ordlyd på begge sprog.

- "Kontraktbridge" (link til https://www.kontraktbridge.dk/), mellemoverskriften "Om mig" / "About me" og teksten: "Jeg er bridgeentusiast med forkærlighed for spillets kognitive udfordringer og det gode fællesskab omkring bordet. Jeg elsker at skabe og forbedre ting – og med AI som ny medspiller har jeg bygget et digitalt bridge-univers, der kombinerer logik, læring og spilleglæde."
- "Kontakt" / "Contact": "Har du fundet en fejl, eller har du en idé til en ny træner? Skriv til mig." og frank.steen.pedersen@gmail.com som `mailto:`-link.
- "Trænere" / "Trainers": Konventionstræner (`/konventionstraener/`), Fordeling, Pointregnskab, Farvebehandling og Håndevaluering. De fire sidste åbner sporets skærm i appen. Samme fem links som på www.kontraktbridge.dk og i Konventionstræneren.
- Ingen kolonne "Aftaler og notater". Den findes kun i Konventionstræneren.
- Nederst under en streg: "© 2026 Frank Pedersen".
- Nye tokens, ens i lys og mørk tilstand, så sidefoden ser ud som på www.kontraktbridge.dk:

| Token | Værdi | Brug |
| --- | --- | --- |
| `footer-bg` | #1a1a1a | sidefodens flade |
| `footer-text` | #f2f3f4 | tekst og links (15,7:1) |
| `footer-accent` | #ff9f4a | "Kontraktbridge" og mail-linket (8,5:1) |

- Hjørner `radius`, margen `space-16`, trykflader på mindst 44 px.
- Links, der fører ud af appen, åbnes i samme vindue. De virker kun online.

## Sporenes skærme

Pointregnskab, Farvebehandling (også Analyse) og Håndevaluering ændres ikke, bortset fra sidefoden nederst. Tegnefladens skærme for dem viser, hvordan de passer sammen med forsiden. Analyse følger det godkendte artboard "Analysevindue v2" som i dag.

## Accepttest

- [ ] Alle eksisterende tests består; kun tests af forsidens opbygning er opdateret, og de er nævnt ved aflevering.
- [ ] Hver knap åbner den samme skærm som før; fordelingssporets menupunkter åbnes fra Fordeling-skærmen.
- [ ] Fordeling-skærmen har fordelingssporets elementer med samme indhold og i samme rækkefølge som forsiden før.
- [ ] Ingen nøgle i localStorage ændres ved at åbne forsiden, et spor eller sidefoden.
- [ ] I dag tæller rigtigt: et spor er trænet, når dagens session er gennemført, og dagen skifter kl. 04.
- [ ] Et spor uden data vises som "Ikke startet endnu"; ulæselige data får ikke forsiden til at fejle.
- [ ] `#farvebehandling` åbner Farvebehandling direkte, også offline, og tilbage-knappen fører til forsiden.
- [ ] Sidefoden står på forsiden og alle sporenes skærme, men ikke i en session.
- [ ] Topbjælken står i fuld bredde på forsiden og alle sporenes skærme, men ikke i en session.
- [ ] Sidefodens Trænere har de samme 5 links som www.kontraktbridge.dk.
- [ ] De nye tokens består 4,5:1, og `design/tokens.json` er i takt med `styles.css`.
- [ ] På engelsk står der intet dansk på forsiden, Fordeling-skærmen eller i sidefoden.

## Afklaret

Claude Codes bygning på grenen `forside-spor` (17. oktober 2026). Bygget før leverancetrin 4 i håndevaluering, fordi Frank bad Claude Code fortsætte med de øvrige projekter; grenen flettes først ind efter Franks godkendelse.

**Åbne spørgsmål til Frank**

1. **"Start dagens session i <spor>"** starter Fordelings session direkte. For Pointregnskab, Farvebehandling og Håndevaluering åbner knappen sporets skærm, hvor sporets egen startknap står, for at starte deres session direkte kræver en lille ændring i de tre skærme (en valgfri prop, der starter sessionen), og tabellen tillader kun sidefoden dér. Skal den ændring laves (Forsiden, punkt 2)?
2. **Vejledningen:** det nye afsnit "Forsiden, sporenes kort og sidefoden" er tilføjet. Afsnittene "Kom i gang" ('Tryk "Start dagens session" på forsiden') og "Forsidens grupper" (fordelingssporets elementer under Fordeling) beskriver nu den gamle forside, men tabellen tillader ikke at ændre de eksisterende afsnit. Skal de rettes?

**Claude Codes valg**

3. **Topbjælken på sporenes skærme:** tabellen nævner kun sidefoden for sporenes skærme, men afsnittet Topbjælken gælder dem også, så topbjælken er sat ind samme sted. Under en session vises ingen af dem; i Farvebehandling melder Træning sessionen med den nye prop `onSession`, fordi sessionen ligger inde i fanen (Sporenes skærme, Topbjælken).
4. **Ingen skrivning:** `status.ts` læser med sporenes `readPrSaved`, `readFbSaved` og `readHeSaved` og aldrig med `load…`, fordi de skriver en kopi af ulæselige data. Data, der mangler eller ikke kan læses, giver "Ikke startet endnu" (Status fra sporene).
5. **Emner til repetition:** Fordeling som på Fordeling-skærmen (`dueItemKeys`); Pointregnskab og Håndevaluering de forfaldne kort i opvarmningens kø uden de nye kort; Farvebehandling de forfaldne emner som sporets `dueItems`, men uden at tjekke dem mod opgavebanken, så banken ikke hentes på forsiden. Et gemt emne til et mål, der er fjernet fra banken, tælles derfor med (Status fra sporene).
6. **Et fjerde mærke:** et startet spor, der ikke er trænet i dag og intet har til repetition, får "Ikke trænet i dag" / "Not trained today" (surface-2), så kortet altid har ét mærke (Forsiden, punkt 4).
7. **ⓘ på kortene:** hvert kort har et ⓘ som alle nye elementer (CLAUDE.md), med sporets hjælpetekst fra de tidligere menupunkter; Fordeling har sin egen.
8. **Næste-linjen:** "med … til repetition og … nye mønstre" kun med de tal, der ikke er 0, og "Ca. 5 minutter." for alle spor, som Velkomst siger "fem minutter om dagen".
9. **Hovedet** er som i dag: "Fordelingstræneren" og sprogknappen. Specen nævner "appens skyline-ikon", men det stod ikke på forsiden før, og med ikonet er der ikke plads til navn og sprogknap på én linje ved 390 px. På en meget smal skærm (320 px) brydes sprogknappen ned på næste linje (Forsiden, punkt 1).
10. **Sidefoden:** rækkefølgen Om mig, Trænere, Kontakt og 7NT-logoet foran "Kontraktbridge" som på www.kontraktbridge.dk og i Konventionstræneren (Fælles regler). På engelsk hedder linket til Konventionstræneren "Convention trainer", fordi appens i18n-test kun tillader appens eget navn på dansk.
11. **Skrift:** topbjælken og sidefoden henter ikke Manrope udefra (appen virker offline uden eksterne kald); Manrope bruges, hvis den findes på enheden, ellers appens skrift.
12. **Adresserne** ligger kun i `App.tsx`: at åbne et spor lægger en historikpost (#spor); Tilbage i appen går et skridt tilbage i browseren, når appen selv lagde posten, ellers fjernes hashen. Huskepalads, Album, Klubaften, Kurver og sessionen vender tilbage til den skærm, de blev åbnet fra (Fordeling-skærmen eller forsiden).
13. **Tests, der er opdateret** (alle fordi forsiden er bygget om, eller fordi adressen nu huskes mellem tests i samme fil):
    - `src/app/navigation.test.tsx`: skrevet om til kortene og Fordeling-skærmen med samme hensigt.
    - `src/app/App.test.tsx`: første test tjekker Velkomst; 11 steder er der et tryk på "Fordeling" før fordelingssporets knapper; adressen nulstilles før hver test.
    - `src/app/i18n.test.tsx`: Velkomst-knapperne og Fordeling-skærmen; adressen nulstilles.
    - `FarvebehandlingScreen.test.tsx`, `HaandevalueringScreen.test.tsx` og `PointregnskabScreen.test.tsx`: adressen nulstilles før hver test; Pointregnskab ser forsiden på "Start med Fordeling".
    - `src/pointregnskab/ui/i18n.test.tsx` og `src/haandevaluering/ui/i18n.test.tsx`: appens navn "Fordelingstræneren" i topbjælken er undtaget som i `src/app/i18n.test.tsx`.
    - Nye: `src/app/status.test.ts` og `src/app/forside.test.tsx` (accepttesten ovenfor).
