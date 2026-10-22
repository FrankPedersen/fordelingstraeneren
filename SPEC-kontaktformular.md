# SPEC-kontaktformular

22. oktober 2026 · Frank · version 2: egen Azure Function (løsning B)

Om mig på www.kontraktbridge.dk får en kontaktformular i stedet for e-mailadressen. kontraktbridge.dk ligger på GitHub Pages uden server, så formularen sender til en lille, selvstændig Azure Function: `kontraktbridge-kontakt`. Koden kopieres fra Proteinkøkkens kontakt-API (`protein-opskrifter/api`), og den bruger samme e-mailtjeneste (Azure Communication Services, ACS). Proteinkøkken ændres ikke (Franks valg 22. oktober 2026).

Specen har tre dele:

1. **`kontraktbridge-kontakt`** (ny mappe og nyt repo): Function App'en med `POST /api/contact`.
2. **`frankpedersen.github.io`**: formularen på Om mig, og e-mailadressen fjernes.
3. **`fordelingstraeneren`**: sidefodens e-maillink peger på formularen i stedet.

## Afgrænsning

Før arbejdet starter i et eksisterende repo: commit og tag den nuværende udgave, arbejd på grenen `kontaktformular`, og flet først ind efter godkendelse.

| Sted | Må ske | Må ikke ske |
| --- | --- | --- |
| `C:\Users\frank\kontraktbridge-kontakt` (ny) | kopi af `protein-opskrifter/api` (funktionen, `contact-protection.js`, tests, `host.json`, `package.json`) tilpasset Kontraktbridge; README; `local.settings.json` i `.gitignore` | hemmeligheder i filer, der committes |
| Azure | én ny Function App med lagerkonto i samme ressourcegruppe som Proteinkøkken (eller en ny, som Frank vælger), Node 20 eller nyere, Flex Consumption; app-indstillinger og CORS | ændre Proteinkøkkens Static Web App eller ACS-ressourcen |
| `protein-opskrifter` | intet | alt. Er del 1 fra version 1 påbegyndt på en gren, slettes grenen |
| `frankpedersen.github.io`: `om-mig/index.html` | formularen i boksen Kontakt; e-mailadressen fjernes | ændre resten af siden, sidefoden eller stilen i øvrigt |
| `fordelingstraeneren`: `src/ui/Footer.tsx` og testen af sidefoden | e-maillinket bliver "Skriv til mig" → `/om-mig/#kontakt` | ændre de andre kolonner |

Kræver noget alligevel en ændring ud over tabellen, skal Claude Code stoppe og spørge. Handlinger i Azure, der opretter ressourcer eller koster penge, skal Frank godkende, før de udføres.

## Del 1: Function App'en

| Del | Indhold |
| --- | --- |
| Kode | `api/src/functions/contact.js` og `api/src/contact-protection.js` fra Proteinkøkken, ændret så emnelinjen er "Ny besked fra Kontraktbridge". Validering, beskeder og spambeskyttelse (honeypot-feltet `website`, mindst 2 sekunder, 3 forsøg pr. IP pr. 15 minutter, højst 10 kB) er de samme |
| Rute | `POST https://<navn>.azurewebsites.net/api/contact`, `authLevel: anonymous` |
| CORS | sættes i Function App'ens platformsindstillinger (CORS) til `https://www.kontraktbridge.dk` og `https://kontraktbridge.dk`. Platformen svarer selv på browserens `OPTIONS`, så koden skal ikke håndtere det |
| App-indstillinger | `COMMUNICATION_SERVICES_CONNECTION_STRING`, `CONTACT_SENDER` og `CONTACT_RECIPIENT` med de samme værdier som Proteinkøkkens Static Web App. Claude Code kan kopiere dem med `az staticwebapp appsettings list` og `az functionapp config appsettings set` uden at skrive dem ud eller gemme dem i filer, eller Frank sætter dem i portalen |
| Udrulning | `func azure functionapp publish <navn>` fra mappen. En GitHub Actions-udrulning kan komme senere |
| Repo | nyt GitHub-repo `kontraktbridge-kontakt`, gerne privat; Frank opretter det, eller Claude Code gør det med `gh` efter godkendelse |
| README | hvad funktionen gør, app-indstillingerne (uden værdier), CORS, lokal kørsel og udrulning |
| Pris | Flex Consumption er gratis i det mængde, en kontaktformular bruger; lagerkontoen koster få kroner om måneden |

## Del 2: Formularen på Om mig

Boksen Kontakt (`aside.om-kontakt`) beholder overskriften, men e-maillinket erstattes af formularen:

| Felt | Etiket | Pladsholder | Krav |
| --- | --- | --- | --- |
| Navn | Navn | Hvad skal jeg kalde dig? | påkrævet, højst 120 tegn |
| E-mail | E-mail | din@email.dk | påkrævet, `type="email"`, højst 254 tegn |
| Besked | Besked | Fx en fejl, du har fundet, eller en idé til en ny træner | påkrævet, højst 5000 tegn, 5 linjer |
| Honeypot | Lad dette felt stå tomt | — | skjult for brugere og skærmlæsere, `tabindex="-1"` |

- **Indledningen** bliver: "Har du fundet en fejl, eller har du en idé til en ny træner? Skriv til mig her. Jeg læser alle beskeder."
- **Knappen** "Send besked" bliver til "Sender …" og er låst, mens beskeden sendes.
- **Afsendelse:** `fetch` med JSON til Function App'ens fulde adresse (en konstant øverst i scriptet) med `name`, `email`, `message`, `website` og `elapsedMilliseconds` (fra første fokus i formularen).
- **Svar:** API'ets besked vises under knappen: "Tak for din besked. Den er sendt." ved succes (`role="status"`), fejlbeskeden ved fejl (`role="alert"`). Formularen tømmes efter succes. Kan API'et ikke nås: "Beskeden kunne ikke sendes. Prøv igen senere."
- **Stil:** sidens Subtle Gradient-stil i den mørke boks: lys tekst, `--primary` på knap og fokus, ingen nye farver. Intet bibliotek; scriptet ligger i siden.
- **Uden JavaScript** står der: "Formularen kræver JavaScript."

## Del 3: Sidefoden i Fordelingstræneren

Kolonnen Kontakt i `src/ui/Footer.tsx` viser i dag e-mailadressen. Den bliver linket "Skriv til mig" / "Write to me" til `/om-mig/#kontakt`. Testen i `src/app/forside.test.tsx`, der låser e-maillinket, rettes.

## Leverancetrin

1. **Function App'en:** koden og testene lokalt, så Franks godkendelse af ressourcerne i Azure, oprettelse, app-indstillinger, CORS og udrulning. Prøvet med `curl` mod den udrullede adresse.
2. **Formularen på Om mig.**
3. **Sidefoden i Fordelingstræneren.**

## Accepttest

Del 1:

- [x] Testene fra Proteinkøkken består i den nye mappe (`npm test`), og en ny test låser emnelinjen "Ny besked fra Kontraktbridge".
- [x] `OPTIONS` mod `/api/contact` med `Origin: https://www.kontraktbridge.dk` giver `Access-Control-Allow-Origin: https://www.kontraktbridge.dk`; med `Origin: https://example.com` kommer der ingen sådan header.
- [x] `POST` med gyldige felter sender en e-mail til Frank med emnet "Ny besked fra Kontraktbridge" og afsenderens adresse som svar-til.
- [x] Honeypot, 2-sekundersgrænsen og 3 forsøg pr. 15 minutter virker.
- [x] Der står ingen forbindelsesstreng, afsender eller modtageradresse i repoet.
- [x] Proteinkøkkens formular virker som før.

Del 2:

- [x] Om mig viser formularen i boksen Kontakt, og e-mailadressen står ikke længere på siden (heller ikke i kildekoden).
- [x] En besked sendt fra www.kontraktbridge.dk/om-mig/ kommer frem.
- [x] Sendes formularen inden for 2 sekunder, eller er honeypot-feltet udfyldt, kommer der ingen e-mail.
- [x] Felterne har etiketter, beskeder læses op af skærmlæsere, og formularen kan bruges med tastatur.
- [x] Ved 390 px er der ingen vandret rulning.

Del 3:

- [x] Sidefoden i Fordelingstræneren har "Skriv til mig" til `/om-mig/#kontakt` på dansk og "Write to me" på engelsk, og e-mailadressen står ikke i den byggede app.

## Afklaret

1. **Egen Function App** (Franks valg 22. oktober 2026, løsning B) i stedet for at genbruge Proteinkøkkens API: Kontraktbridge er uafhængig af Proteinkøkken, men deler e-mailtjeneste og modtager.
2. **E-mailadressen fjernes** fra Om mig og fra Fordelingstrænerens sidefod (Franks valg 22. oktober 2026).
3. **CORS i platformen** frem for i koden, fordi Function Apps har det indbygget.
4. **Placering af koden** (Franks besked 22. oktober 2026): API'et ligger i `frankpedersen.github.io/_kontakt-api/` i stedet for et nyt repo. Mappen starter med `_`, så GitHub Pages (Jekyll) ikke udgiver den (prøvet: 404).
5. **Azure** (Franks ja 22. oktober 2026): ressourcegruppen Kontraktbridge i West Europe med Function App'en `kontraktbridge-kontakt` (Flex Consumption, planen `ASP-Kontraktbridge-a8dd`, Node 22, fordi Node 20 udløb i april 2026), lagerkontoen `kontraktbridgekontakt` og Application Insights `kontraktbridge-kontakt` med Log Analytics-arbejdsområdet `kontraktbridge-kontakt-logs`. Adressen er `https://kontraktbridge-kontakt.azurewebsites.net/api/contact`. Udrullet med zip og fjernbygning (`az functionapp deployment source config-zip --build-remote true`), da Functions Core Tools ikke er installeret.
6. **Klientens IP:** Azure Functions sender `x-forwarded-for` som "ip:port", og porten skifter med hver forbindelse, så grænsen på 3 beskeder virkede ikke, før porten blev fjernet i `getClientIp` (med test). Prøvet live: nr. 4 inden for 15 minutter giver 429.
7. **Emnelinjen** bygges i `src/contact-email.js`, så en test kan låse den uden at sende mail.
8. **Prøvet live** 22. oktober 2026: Frank har modtaget testmailene med det rigtige emne og svar-til, og en besked sendt med formularen på www.kontraktbridge.dk/om-mig/ gav "Tak for din besked. Den er sendt."
