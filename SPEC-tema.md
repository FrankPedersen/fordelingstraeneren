# SPEC-tema

5. oktober 2026 · Frank

Appen får et nyt, ensartet tema: en blødere accent i stedet for næsten sort, bridgebordet som klassisk diagram og farvebehandlingens blå og orange for "nås" og "nås ikke". Kun udseendet ændres; adfærd og data er uændrede. Opgaven bygges efter Pointregnskabet og før navigationen.

Det er Franks beslutning (5. oktober 2026), at temaet gælder hele appen. Den går forud for reglen i SPEC-farvebehandling.md og SPEC-pointregnskab.md om, at de andre spors udseende ikke må ændres, men kun for de punkter, denne spec nævner.

## Afgrænsning

Før arbejdet starter:

1. Commit og tag den nuværende app, fx `v5-foer-tema`.
2. Arbejd på grenen `tema`, og flet først ind efter godkendelse.
3. Kør alle eksisterende tests før og efter.

| Sted | Må ske | Må ikke ske |
| --- | --- | --- |
| `src/ui/styles.css` og `design/tokens.json` | de nye tokens tilføjes, og `fb-hit`/`fb-miss` får nye værdier (tabellen nedenfor) | ændre værdien af andre eksisterende tokens, også `ink` |
| `src/farvebehandling/ui/tokens.css` | aliaserne for `fb-hit`, `fb-miss` og de nye `-line`/`-text` opdateres | — |
| Komponenter, der bruger `ink` til primærknapper og valgte elementer | skiftes til `accent` og `accent-soft` som beskrevet under Brug | ændre layout, tekst eller adfærd |
| Farvebehandlingens Bridgebord | bygges som diagrammet på det godkendte artboard | ændre data eller kortvælgerens adfærd |
| Rigtigt og forkert i de øvrige øvelser | uændret (`ok`, `ok-bg`, `bad-bg` og stiplet kant) | få blå eller orange |
| Lagring | ingen ændringer | læse eller skrive nogen nøgle |

Kræver noget alligevel en ændring ud over tabellen, skal Claude Code stoppe og spørge.

Besked til Claude Code:

> Indfør temaet efter SPEC-tema.md. Kun udseendet ændres; adfærd, data og layout er uændrede. Designsystemet "Fordelingstræneren" i Claude Design har allerede de nye tokens; hold `design/tokens.json` i takt med det. Kør alle tests før og efter.

## Tokens

Designsystemet [Fordelingstræneren](https://claude.ai/artifact/NmcghGRGc1WRhmSMnjwTq3) er opdateret med disse værdier, og alle tekstpar består 4,5:1.

| Token | Lys | Mørk | Brug |
| --- | --- | --- | --- |
| `accent` | #5b6b82 | #9fb0c6 | primærknapper og kanten på valgte elementer |
| `accent-soft` | #e3e9f1 | #2a3442 | flade for valgte elementer |
| `accent-text` | #ffffff | #12161c | tekst på `accent` (5,4:1 / 8,2:1) |
| `table` | #1f5c4a | #1a4437 | bridgebordets kompas |
| `table-text` | #ffffff | #e8ecf1 | tekst og verdenshjørner på `table` (7,8:1 / 9,2:1) |
| `fb-hit` | #d6e4f5 | #1e3a5f | målet nås (kun farvebehandling) |
| `fb-hit-text` | #163e73 | #d6e4f5 | tekst og ✓ på `fb-hit` (8,3:1 / 8,9:1) |
| `fb-hit-line` | #8daad3 | #5b84bd | kant på `fb-hit` |
| `fb-miss` | #f8dfcc | #4a2a14 | målet nås ikke og mærket "afgør" (kun farvebehandling) |
| `fb-miss-text` | #7a3410 | #f8dfcc | tekst og ✕ på `fb-miss` (7,1:1 / 10,1:1) |
| `fb-miss-line` | #e0a27a | #b9774a | stiplet kant på `fb-miss` |

`ink` beholder sin værdi og bruges fortsat til målere, fremdrift og andre mørke markeringer.

## Brug

- **Primærknapper:** baggrund `accent`, tekst `accent-text`.
- **Valgte elementer** (aktiv fane, valgt mål, valgt svarvalg, valgte taster): flade `accent-soft`, 2px kant i `accent` og tekst i `text`. I kortvælgeren har bordets kort fuld kant og din hånds kort stiplet kant, så de kan skelnes uden farve.
- **Bridgebordet i farvebehandling:** klassisk diagram med hænderne skrevet som i systemnotatet ("♠ B432" over "♠ E1065"), Vest og Øst ved siderne og et kompas i `table` med N, V, Ø, S og de manglende kort i `table-text`.
- **Farvebehandlingens felter, bånd og mærket "afgør":** `fb-hit` med ✓ og `fb-miss` med stiplet kant og ✕. Farven står aldrig alene uden symbol.
- **Den bedste linje** i resultatet: kant i `ok`, flade `ok-bg`, mærket "✓ Bedste linje" og procenten i `ok`.

## Godkendt artboard

[Analysevindue v2](https://claude.ai/artifact/S5p4ANVzT2BGLpH98nehwn) på tegnefladen "Analysevindue – farvebehandling" er godkendt og gælder for Analysevinduet. Claude Code læser tegnefladen direkte. Skriv navnet ind under "Godkendte artboards" i SPEC-farvebehandling.md i samme commit.

## Specer, der rettes i samme commit

- **SPEC-farvebehandling.md:** reglen om, at nås og nås ikke skelnes på lyshed og symbol, erstattes af `fb-hit`/`fb-miss` med ✓/✕; bordet beskrives som diagrammet ovenfor; "Analysevindue v2" står som godkendt artboard.
- **CLAUDE.md:** en linje om temaet under Beslutninger.
- **SPEC.md og SPEC-pointregnskab.md:** kun hvis de nævner `ink` til primærknapper eller valg; i så fald rettes det til `accent`.

## Accepttest

- [x] Alle eksisterende tests består, også App-testens flows.
- [x] `design/tokens.json` og `src/ui/styles.css` er i takt (`src/tokens.test.ts`), og værdierne svarer til tabellen ovenfor.
- [x] Ny kontrasttest: alle tekstpar i tabellen er mindst 4,5:1 i både lys og mørk tilstand.
- [x] Ingen primærknap eller valgt tilstand bruger `ink` længere; `ink` har samme værdi som før.
- [x] I farvebehandling står `fb-hit` altid med ✓ og `fb-miss` altid med ✕.
- [x] Rigtigt og forkert i fordelingssporets og Pointregnskabets øvelser er uændret.
- [x] Ingen nøgle i localStorage ændres.
