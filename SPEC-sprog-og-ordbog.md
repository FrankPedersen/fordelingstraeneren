# SPEC-sprog-og-ordbog

22. oktober 2026 · Frank

Hele kontraktbridge.dk får en sprogkontrol og en bridgeordbog. Specen gælder tre repoer: `frankpedersen.github.io` (forsiden, Om mig og ordbogen), `fordelingstraeneren` og `konventionstraener`. Den lægges i roden af hvert repo, og Claude Code bygger kun den del, der hører til repoet.

1. **Ordbogen** får sin egen side, www.kontraktbridge.dk/ordbog/, bygget fra `Dansk_bridgeordbog.md` (version 1.1, 403 opslag).
2. **Sidefoden** får en ny kolonne, **Opslag**, med linket **Bridgeordbog** på alle sider og i begge apps.
3. **Stavefejl og fagord** rettes efter listen nedenfor.
4. **En varig kontrol** forhindrer, at fejlene og de forkerte fagord kommer igen.

## Husets fagord

Gælder i al dansk tekst på sitet og i ordbogen (Franks valg 22. oktober 2026). De andre ord må kun stå i ordbogen som alternative termer, der peger på husets ord.

| Husets ord | Ikke | Engelsk |
| --- | --- | --- |
| bordet | blindemand, den blinde | dummy |
| kipning, kippe, dobbelt kipning | knibning, snit, dobbeltknibning | finesse |
| forbindelser, indgang | broer | entries |
| slutspil om det generelle; indspil kun om den særlige form, hvor en modspiller sættes ind | — (begge ord er rigtige, se Afklaret 3) | endplay, throw-in |

Tre ord mere foreslås fastlagt (se Åbne punkter). De bygges først, når Frank har sagt ja:

| Forslag | I dag | Hvor |
| --- | --- | --- |
| T1: **hp** i dansk tekst, HCP kun på engelsk | "HCP" i danske tekster | ca. 28 steder i `src/haandevaluering/ui/texts.ts` (fx "HCP og Zar er uenige") og et par steder i konventionstræneren |
| T2: **dobbeltton** | "doubleton" | ca. 50 steder i konventionstræneren (`data/kort/`, `dealer/`, puljerne); Fordelingstræneren og MODEL.md skriver dobbeltton |
| T3: **fitten** | "fittet" | ca. 19 steder i konventionstræneren; Fordelingstræneren skriver fitten |

## Afgrænsning

Før arbejdet starter i hvert repo:

1. Commit og tag den nuværende udgave, fx `v-foer-sprog`.
2. Arbejd på grenen `sprog-og-ordbog`, og flet først ind efter godkendelse.
3. Kør de eksisterende tests før og efter.

| Repo og sted | Må ske | Må ikke ske |
| --- | --- | --- |
| `frankpedersen.github.io`: `ordbog/Dansk_bridgeordbog.md` (ny) | ordbogen som kilde, som Frank leverer den | rettes af Claude Code; rettelser skrives som forslag til Frank |
| `frankpedersen.github.io`: `tools/build_ordbog.py` (ny), `ordbog/index.html` (genereres) | siden bygges fra markdown; `index.html` rettes aldrig i hånden | eksterne biblioteker i browseren |
| `frankpedersen.github.io`: `index.html`, `om-mig/index.html`, `sitemap.xml` | kolonnen Opslag i sidefoden; `/ordbog/` i sitemap | ændre kortene, menuen eller stilen i øvrigt |
| `fordelingstraeneren`: `src/ui/Footer.tsx` | kolonnen Opslag med linket til `/ordbog/` | ændre de andre kolonner |
| `konventionstraener`: `assets/footer.js` | kolonnen Opslag med linket til `/ordbog/` | ændre de andre kolonner |
| Alle tre: teksterne i rettelseslisten | rette præcis de ord, listen nævner | omskrive tekster i øvrigt |
| Alle tre: `tools/sprogtjek.py` eller `scripts/sprogtjek.ts` (ny), en fagordstest (ny) | den varige kontrol (se nedenfor) | gøre `npm test` afhængig af netværk |
| Lagring, tokens, data, løsere, puljernes indhold ud over ordene | intet | alt |

Kræver noget alligevel en ændring ud over tabellen, skal Claude Code stoppe og spørge.

Besked til Claude Code (samme i alle tre repoer):

> Læs CLAUDE.md og SPEC-sprog-og-ordbog.md. Byg den del af specen, der hører til dette repo, på grenen `sprog-og-ordbog`. Skriv accepttestene først, og stop, når testene er grønne, så jeg kan godkende. T1–T3 bygges først, når jeg har svaret på dem.

## Ordbogssiden

| Del | Indhold |
| --- | --- |
| Adresse | www.kontraktbridge.dk/ordbog/ med samme topbjælke, sidefod og stil (Subtle Gradient) som forsiden og Om mig |
| Overskrift | "Bridgeordbog" med undertekst "403 bridgeord på dansk med engelsk oversættelse." (tallet regnes af scriptet) |
| Søgning | ét felt øverst, der filtrerer på opslagsord, alternative termer og engelsk, mens man skriver; "Ingen opslag passer" ved nul |
| Filtre | kategori og niveau som knapper; A–Å-linje til spring |
| Opslag | opslagsord som overskrift med anker `#id`; Engelsk, Alternative termer, Forkortelse, Niveau, Kategori og Systemafhængig som en lille linje; Kort definition; Forklaring kun når den er forskellig fra definitionen; Relaterede begreber som links til deres anker |
| Indekser | Engelsk–dansk som foldbar liste nederst; Dansk–engelsk vises ikke, fordi hvert opslag allerede har det engelske ord |
| Sprog | siden er dansk; sidens faste tekster har `data-en` som forsiden, men opslagene er kun på dansk |
| Mobil | ingen vandret rulning ved 390 px |
| Byg | `python3 tools/build_ordbog.py` læser `ordbog/Dansk_bridgeordbog.md` og skriver `ordbog/index.html`. Scriptet stopper med en fejl ved døde henvisninger, dobbelte id'er eller et opslagsord, der er et af husets "Ikke"-ord |

## Sidefoden

Kolonnen kommer efter Trænere i alle sidefødder:

| Overskrift | Link | Engelsk |
| --- | --- | --- |
| Opslag | Bridgeordbog → `/ordbog/` | Reference · Bridge dictionary |

Det gælder forsiden, Om mig, ordbogssiden, Fordelingstrænerens `Footer.tsx` og konventionstrænerens `footer.js`, så sidefoden er ens på hele sitet.

## Rettelser

Fundet med en dansk stavekontrol (hunspell da_DK) af al synlig tekst i de tre repoer, 22. oktober 2026. De fleste ukendte ord var bridgeord og engelsk tekst; her er de rigtige fejl:

| Repo og fil | Står der | Rettes til |
| --- | --- | --- |
| konventionstraener `dealer/ff_trial.py` (og puljen `pools/ff-trial-bids.json`, der bygges igen) | "Støtte til en ny trumffarv" | "Støtte til en ny trumffarve" |
| konventionstraener `data/kort/ff-ogust.json` | "hvor gode trumfene er" | "hvor gode trumferne er" |
| konventionstraener `viden/2-over-1-makker2.html` | "bekræft especielt hvad …" | "bekræft især hvad …" |
| konventionstraener `viden/2-over-1-makker2.html` (2 steder) | "stærke hændertyper" | "stærke håndtyper" |
| konventionstraener `viden/kampen-om-kontrakten.html` | "stopmeldinger fra invitter" | "stopmeldinger fra invitationer" |

Er en side genereret (fx fra et systemdokument), rettes kilden, og siden bygges igen.

## Den varige kontrol

1. **Fagordstest i hvert repo:** en test, der læser al dansk synlig tekst (de danske tekstfiler, data og sider) og fejler, hvis et af husets "Ikke"-ord står der. "i snit" (gennemsnit) er tilladt. Når T1–T3 er godkendt, kommer de med i testen. Testen kører i `npm test` (Fordelingstræneren) og i `tools/tjek_*.py` (konventionstræneren og forsiden).
2. **Stavekontrol som værktøj:** `sprogtjek` kører hunspell-reglerne for dansk (fx Python-pakken `spylls` med `da_DK` fra `dictionary-da`) på al dansk synlig tekst og skriver en liste over ukendte ord. Bridgeord, der er rigtige, står i `ordliste.txt` (fx cuebid, sleminvit, Stayman, sidninger, kipning), og listen fyldes også med ordbogens opslagsord. Værktøjet køres med hånden før hver udgivelse og er ikke en del af `npm test`.

## Accepttest

- [ ] www.kontraktbridge.dk/ordbog/ viser 403 opslag, og søgning på "finesse", "knibning" og "kipning" finder alle opslaget Kipning.
- [ ] Søgning på "blindemand" finder Bordet. Søgning på "indspil" finder Indspil, og Slutspil og Indspil linker til hinanden.
- [ ] Hvert opslags Relaterede begreber linker til et anker, der findes på siden.
- [ ] Opslag, hvor Forklaring er den samme som Kort definition, viser kun definitionen.
- [ ] `build_ordbog.py` fejler, hvis et opslagsord er "Knibning", "Snit" eller "Den blinde".
- [ ] Sidefoden har kolonnen Opslag med Bridgeordbog på forsiden, Om mig, ordbogen, i Fordelingstræneren og i konventionstræneren, på dansk og engelsk.
- [ ] Ved 390 px har ordbogssiden og forsiden ingen vandret rulning.
- [ ] Alle ord i rettelseslisten er rettet, og puljerne er bygget igen med `build_pools.py`.
- [ ] Fagordstesten består i alle tre repoer og fejler, hvis man skriver "knibning" i en dansk tekst.
- [ ] `sprogtjek` kører og giver højst de ord, der står i `ordliste.txt`, eller en liste, Frank har set.

## Afklaret

1. **Husets ord** gælder: bordet, kipning, forbindelser og slutspil. Ordbogen er rettet til dem i version 1.1: Kipning, Dobbelt kipning og Bordet er opslagsord, og Knibning, Snit, Den blinde og Blindemand står kun som alternative søgeord, der fører til dem.
2. **Ordbogen version 1.1** har 403 opslag. Tre dubletter er slået sammen: Adjusted score (AdjS) ind i Justeret score, Contract ind i Kontrakt og Screen ind i Skærm. Bordets forklaring er rettet: spilføreren vælger også bordets kort. Indekserne er bygget igen.
3. **Slutspil og indspil er to begreber** (Franks valg 22. oktober 2026): slutspil (endplay) er overbegrebet, hvor en modspiller tvinges til at give et stik; indspil (throw-in) er én form for slutspil, hvor en modspiller sættes ind og må spille ud til spilførerens fordel. Skvis og Morton's Fork er andre former. Ordbogen har et opslag for hver, og "indspil" er ikke et forbudt ord i fagordstesten.
4. **Placering:** egen side med overskriften Opslag i sidefoden (Franks valg 22. oktober 2026).
5. **T1–T3** (Franks svar 22. oktober 2026): husets ord i dansk tekst er **hp** (HCP kun på engelsk), **doubleton** (ikke dobbeltton) og **fittet** (ikke fitten). Det er konventionstrænerens ord, så forslaget i tabellen ovenfor er vendt for T2 og T3. I Fordelingstræneren rettes de i håndevalueringen, vejledningen, `docs/MODEL.md` og `SPEC-haandevaluering.md`; engelsk beholder HCP, og feltnavne i koden og `p-model.json` er uændrede.

Claude Codes valg i Fordelingstræneren (22. oktober 2026, grenen `sprog-og-ordbog`; appen før er tagget `v16-foer-sprog`):

6. **Sidefoden:** kolonnen Opslag står i `src/ui/Footer.tsx` efter Trænere med Bridgeordbog → `/ordbog/` (Reference · Bridge dictionary). Linket fører ud af appen og virker kun online, som linket til konventionstræneren.
7. **Fagordstesten** er `src/sprog/sprog.test.ts` i `npm test` med `src/sprog/fagord.ts` (husets ord og T1–T3) og `src/sprog/danskTekst.ts` (al dansk synlig tekst). Kildekoden læses med Vites `parseAst`, fordi TypeScript 7 ikke har noget JavaScript-API; `package.json` er uændret. Engelsk springes over: det engelske argument til `tx`, EN-objekterne (`const EN`, `MONTHS_EN` …), felterne `en`/`…En`, grenen `getLang() === 'en' ? …`, typer, import-stier og kodeattributter som `className`. Data er de filer, appen henter (banken, teknikkerne, P-modellen, pas-reglerne, systemfilen og guiden til Analyse), og `docs/MODEL.md`. `lineText.ts` (den engelske oversættelse af løserens linjer) springes over. Testen bruger intet netværk.
8. **hp i opgave 8:** metodens navn er "hp" og står med stort, hvor det indleder en sætning: "Hp og Zar er uenige. Hvem har ret?", "Hp: 12 + 14 = 26 hp → udgang (grænse 23)", "Hp har ret." og "Hp overså …". Svarknapperne hedder hp og Zar. Enheden kommer fra den nye tekst `pointUnits` (hp/ZP, på engelsk HCP/ZP) i stedet for "HCP" i `Opgave.tsx`.
9. **p-model.json:** kun de danske `afsnit`-tekster har fået hp; nøglerne (`hcp`, `hcpMetode`, `dobbeltton` …) er uændrede, så facitfilen og konventionstrænerens kopi er upåvirkede. Kodekommentarer er ikke rettet.
10. **MODEL.md og SPEC-haandevaluering.md:** HCP er hp, Dobbeltton er Doubleton og fitten er fittet i dansk tekst, også i tabeller. Specens linje "Engelsk bridgesprog: HCP, points, fit …" er engelsk og står uændret.
11. **Rettede tests:** `haandevaluering/ui/trin4.test.tsx` og `haandevaluering/ui/kalibrering.test.tsx` forventede den gamle danske ordlyd ("HCP: 12 + 14 = 26 HCP …", "HCP og Zar er uenige", svarknappen "HCP", "dobbeltton i ♦" og "23 HCP" i hjælpen). De engelske forventninger er uændrede.
12. **Sprogtjek** er `scripts/sprogtjek.ts` med `scripts/ordliste.txt` og bruger samme tekst som fagordstesten. Ordene slås op med Python-pakken `spylls` og da_DK fra npm-pakken dictionary-da (hentes første gang til brugerens cache, den samme som konventionstrænerens). Det giver i dag ét ord til Franks liste: "trinene" i `src/farvebehandling/content/guide-analyse.md` (retskrivningen er *trinnene*).
13. **Forslag til Frank:** med *fittet* (intetkøn) bør "en fit" i Zar-forklaringen i opgave 8 (`haandevaluering/ui/texts.ts`, `zarTooHigh`) nok være "et fit", som konventionstræneren skriver "et 4-3-fit". Det er ikke rettet, fordi T3 kun nævner fitten.

Åbne punkter:

1. **T1–T3:** besvaret, se Afklaret 5.
2. **Ordbogens kvalitet** (Franks arbejde, ikke Claude Codes): 173 af 403 opslagsord er engelske (fx Appeal, Average, Nine (9)); 356 står i kategorien Grundlæggende begreber og 374 på niveau begynder, så filtrene siger ikke meget endnu; i 363 opslag er Forklaring den samme som Kort definition. Siden virker, men ordbogen bliver bedre med danske opslagsord, rigtige kategorier og niveauer og egentlige forklaringer i en version 1.2.
