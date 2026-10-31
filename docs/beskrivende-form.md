# Beskrivende form – listen til godkendelse

SPEC-beskrivende-form.md, 30. oktober 2026. Intet er rettet endnu.

Listen bygger på al dansk synlig tekst fra `src/sprog/danskTekst.ts`: kildekoden, bankens data, teknikkerne, P-modellen, pas-reglerne, systemfilen, guiden til Analyse og `docs/MODEL.md`. Alle sætninger, der begynder med et udsagnsord i bydeform, er fundet, og ligeså bydeform efter kolon, semikolon og ", og" (fx "13-sudoku: udled …"). De er delt i:

1. Knapper og links – bliver.
2. Navne på opgaver og øvelser – bliver.
3. Instruktioner og forklaringer – skrives om (forslag på dansk og engelsk).
4. Til afgørelse – grupper, hvor Frank skal vælge.
5. Falske træf – ikke bydeform, men testen skal kende dem.

I gruppe 3 står kun den del af teksten, der ændres; "…" er resten af teksten, som er uændret.

## 1. Knapper og links (bliver)

- **Fordelingssporet og forsiden:** Start dagens session · Start dagens session i … · Tag en ekstra session · Tag en ekstra session i … · Start med Fordeling · Se en klubaften: 100 hænder · Læs vejledningen · Opdatér · Skift sprog til engelsk (knappens navn for skærmlæsere) · Luk · Prøv igen senere · Lås op med tre spørgsmål · Brug skabelonen · Vis ledetråd · Afbryd · Afbryd sessionen · Fortsæt sessionen · Gæt · Svar · Eksportér data · Importér data · Overskriv mine data · Annullér · Vis som tabel · Vis løsningen · Ryd cellen · Slet (taster) · Fjern … · Flyt … op · Skriv til mig (link)
- **Farvebehandling:** Start dagens session · Afbryd sessionen · Svar · Spil den selv ▶ · Prøv den · Luk · Vælg kombination · Ryd · Regn den ud · Stop · Angiv situationen · Fold sammen · Nulstil · Regn med situationen · Vis alle sidninger · Vis kun de afgørende · Gruppér · Vis alle udspil · Vis kun de vigtigste udspil · Sammenlign · Sammenlign linje … · Importér · Gem og regn · Fjern trin … · Slet · Ret · Ret … · Start · n kombinationer · Skift filter · Annullér · Åbn i Analyse · Øv i Selvvalgt · Øv … i Selvvalgt · Eksportér nu · Vælg fil · Erstat mine data
- **Pointregnskab og Håndevaluering:** Start dagens session · Afbryd sessionen · Svar · Slet · Eksportér nu · Eksportér data · Importér data · Vælg en fil med Pointregnskabs/Håndevalueringens data · Annullér

## 2. Navne på opgaver og øvelser (bliver)

- **Farvebehandling:** Spil den selv · Find hullet · Vælg linjen · Gæt chancen (valgfrit) (feltet, der hører til opgaven) · Hold eller par · Vælg selv (overskriften i Selvvalgt)
- **Teknikkerne** (`techniques.json`): Fald eller kip · Spil mod honnør
- **Håndevaluering:** Sammenlign metoder (opgave 8)
- **Pointregnskab:** Regn oppefra (ledetrådens navn)

## 3. Instruktioner og forklaringer (skrives om)

### Forsiden, vejledningen og indstillingerne

**F1** · `HomeScreen.tsx`, Velkomst
- DA nu: Start med Fordeling, hvis du er i tvivl. …
- DA forslag: Fordeling er et godt sted at begynde, hvis du er i tvivl. …
- EN nu: Start with Distribution if you are unsure. …
- EN forslag: Distribution is a good place to begin if you are unsure. …

**F2** · `HomeScreen.tsx`, kortet Vejledning
- DA nu: … Tryk på ⓘ ved et element for at få en kort forklaring.
- DA forslag: … ⓘ ved et element giver en kort forklaring.
- EN nu: … Tap ⓘ next to an element for a short explanation.
- EN forslag: … ⓘ next to an element gives a short explanation.

**F3** · `tracks.ts`, kortenes undertekst
- DA nu: Tæl honnørpoint under spillet · Slå en kombination op · linjer, chancer og sidninger · Vurdér hånden med P-modellen
- DA forslag: Honnørpoint talt under spillet · Opslag af en kombination · linjer, chancer og sidninger · Hånden vurderet med P-modellen
- EN nu: Count high-card points during play · Look up a combination · lines, chances and layouts · Value your hand with the P-model
- EN forslag: High-card points counted during play · Any combination looked up · lines, chances and layouts · Your hand valued with the P-model

**F4** · `tracks.ts`, ⓘ ved Huskepalads
- DA nu: Læg de 13 mest almindelige mønstre på 13 stationer på en rute, du kender udenad, fx hjemmet eller klubben. Navngiv hver station og skriv en scene med mønstrets billede. …
- DA forslag: De 13 mest almindelige mønstre ligger på 13 stationer på en rute, du kender udenad, fx hjemmet eller klubben. Hver station får et navn og en scene med mønstrets billede. …
- EN nu: Place the 13 most common patterns on 13 stations along a route you know by heart, such as your home or the club. Name each station and write a scene with the pattern's image. …
- EN forslag: The 13 most common patterns lie on 13 stations along a route you know by heart, such as your home or the club. Each station gets a name and a scene with the pattern's image. …

**F5** · `tracks.ts`, ⓘ ved Klubaften
- DA nu: … Tryk på et mønster for at fremhæve dets hænder.
- DA forslag: … Et tryk på et mønster fremhæver dets hænder.
- EN nu: … Tap a pattern to highlight its hands.
- EN forslag: … Tapping a pattern highlights its hands.

**F6** · `tracks.ts` og `farvebehandling/ui/texts.ts` (modulet Analyse, samme tekst to steder)
- DA nu: Analysen fra Farvebehandling som selvstændigt modul: slå enhver kombination op, og se linjerne, chancerne og sidningerne, også med kendte kort, hp-grænser og forbindelser. …
- DA forslag: Analysen fra Farvebehandling som selvstændigt modul: enhver kombination kan slås op med linjerne, chancerne og sidningerne, også med kendte kort, hp-grænser og forbindelser. …
- EN nu: … as a separate module: look up any combination and see the lines, the chances and the layouts, also with … 
- EN forslag: … as a separate module: any combination can be looked up with the lines, the chances and the layouts, also with …

**F7** · `GuideScreen.tsx`, Kom i gang
- DA nu: Tryk på knappen under I dag på forsiden: den starter dagens session i det næste spor. …
- DA forslag: Knappen under I dag på forsiden starter dagens session i det næste spor. …
- EN nu: Tap the button under Today on the front page: it starts today's session in the next track. …
- EN forslag: The button under Today on the front page starts today's session in the next track. …

**F8** · `GuideScreen.tsx`, Kom i gang
- DA nu: Tryk på ⓘ ved et element for at få en kort forklaring lige der.
- DA forslag: ⓘ ved et element viser en kort forklaring lige der.
- EN nu: Tap ⓘ next to an element for a short explanation right there.
- EN forslag: ⓘ next to an element shows a short explanation right there.

**F9** · `GuideScreen.tsx`, øvelserne
- DA nu: Mønstertastaturet: tast de fire længder i vilkårlig rækkefølge; den fjerde udfyldes selv. …
- DA forslag: Mønstertastaturet: de fire længder tastes i vilkårlig rækkefølge; den fjerde udfyldes selv. …
- EN nu: The pattern keypad: type the four lengths in any order; the fourth fills itself in. …
- EN forslag: The pattern keypad: the four lengths are typed in any order; the fourth fills itself in. …

**F10** · `GuideScreen.tsx`, øvelserne
- DA nu: Højere/lavere: tryk på det hyppigste af to mønstre, eller ≈, når de er lige hyppige (under 2 % forskel).
- DA forslag: Højere/lavere: svaret er det hyppigste af to mønstre, eller ≈, når de er lige hyppige (under 2 % forskel).
- EN nu: Higher/lower: tap the more frequent of two patterns, or ≈ when they are equally frequent (less than 2 % apart).
- EN forslag: Higher/lower: the answer is the more frequent of two patterns, or ≈ when they are equally frequent (less than 2 % apart).

**F11** · `GuideScreen.tsx`, øvelserne
- DA nu: Lynaflæsning: en tilfældig hånd vises; tast dens mønster. …
- DA forslag: Lynaflæsning: en tilfældig hånd vises, og dens mønster tastes. …
- EN nu: Lightning reading: a random hand is shown; type its pattern. …
- EN forslag: Lightning reading: a random hand is shown, and its pattern is typed. …

**F12** · `GuideScreen.tsx`, øvelserne
- DA nu: 13-sudoku: udled alle fire hænders længder ud fra meldinger og spilhændelser. Lås fordelingen, når du er sikker; jo færre ledetråde, jo flere point.
- DA forslag: 13-sudoku: alle fire hænders længder udledes af meldinger og spilhændelser. Fordelingen låses, når du er sikker; jo færre ledetråde, jo flere point.
- EN nu: 13-sudoku: work out the lengths of all four hands from the bidding and play events. Lock the distribution when you are sure; …
- EN forslag: 13-sudoku: the lengths of all four hands are worked out from the bidding and play events. The distribution is locked when you are sure; …

**F13** · `GuideScreen.tsx`, husketeknikkerne
- DA nu: Huskepalads: … Navngiv stationerne og skriv en scene.
- DA forslag: Huskepalads: … Stationerne får navne og hver sin scene.
- EN nu: Memory palace: … Name the stations and write a scene.
- EN forslag: Memory palace: … The stations get names and a scene each.

**F14** · `GuideScreen.tsx`, farvebehandling
- DA nu: Selvvalgt: vælg teknik, antal kort, manglende honnører og mål; …
- DA forslag: Selvvalgt: teknik, antal kort, manglende honnører og mål vælges frit; …
- EN nu: Free practice: choose technique, number of cards, missing honours and goal; …
- EN forslag: Free practice: technique, number of cards, missing honours and goal are chosen freely; …

**F15** · `GuideScreen.tsx`, dine data
- DA nu: Eksportér jævnligt: Indstillinger → Sikkerhedskopi, og i farvebehandling Træning → Dine data.
- DA forslag: En jævnlig eksport sikrer dine data: Indstillinger → Sikkerhedskopi, og i farvebehandling Træning → Dine data.
- EN nu: Export regularly: Settings → Backup, and in suit combinations Training → Your data.
- EN forslag: A regular export keeps your data safe: Settings → Backup, and in suit combinations Training → Your data.

**F16** · `SettingsScreen.tsx`, Sikkerhedskopi
- DA nu: … Eksportér dem jævnligt, og importér filen, hvis du skifter enhed eller browser.
- DA forslag: … En jævnlig eksport sikrer dem, og filen kan importeres, hvis du skifter enhed eller browser.
- EN nu: … Export it regularly, and import the file if you change device or browser.
- EN forslag: … A regular export keeps it safe, and the file can be imported if you change device or browser.

**F17** · `SettingsScreen.tsx`, ⓘ ved Hurtige svar
- DA nu: … Tryk − og + for at justere.
- DA forslag: … − og + justerer tærsklen.
- EN nu: … Tap − and + to adjust.
- EN forslag: … − and + adjust the threshold.

### Fordelingssporets øvelser

**Ø1** · `AlbumScreen.tsx`, ⓘ
- DA nu: Tryk på en plads for at se mønstrets grad, hyppighed og placeringer og skrive dit eget billede. …
- DA forslag: Et tryk på en plads viser mønstrets grad, hyppighed og placeringer, og der kan du skrive dit eget billede. …
- EN nu: Tap a slot to see the pattern's grade, frequency and arrangements and to write your own image. …
- EN forslag: Tapping a slot shows the pattern's grade, frequency and arrangements, and there you can write your own image. …

**Ø2** · `AlbumScreen.tsx` og `PalaceScreen.tsx`, pladsholderen i feltet
- DA nu: Skriv dit eget billede
- DA forslag: Dit eget billede
- EN nu: Write your own image
- EN forslag: Your own image

**Ø3** · `KlubaftenScreen.tsx`, ⓘ
- DA nu: Tryk på et mønster under gitteret for at fremhæve dets hænder; tryk igen for at se alle. …
- DA forslag: Et tryk på et mønster under gitteret fremhæver dets hænder; et nyt tryk viser alle igen. …
- EN nu: Tap a pattern below the grid to highlight its hands; tap again to see all. …
- EN forslag: Tapping a pattern below the grid highlights its hands; tapping again shows them all. …

**Ø4** · `ui/Klubaften.tsx`, under gitteret
- DA nu: Vælg et mønster for at se dets hænder.
- DA forslag: Hænderne står her, når et mønster er valgt.
- EN nu: Choose a pattern to see its hands.
- EN forslag: The hands appear here when a pattern is chosen.

**Ø5** · `PalaceScreen.tsx`, ⓘ
- DA nu: Tryk på en station for at navngive den, skrive dit eget billede og en scene. …
- DA forslag: Et tryk på en station åbner den, så du kan navngive den og skrive dit eget billede og en scene. …
- EN nu: Tap a station to name it and write your own image and a scene. …
- EN forslag: Tapping a station opens it, so you can name it and write your own image and a scene. …

**Ø6** · `PalaceScreen.tsx`, under overskriften
- DA nu: Vælg en rute, du kender udenad – fx dit hjem, klubben eller en fast gåtur – og læg 13 stationer på den. Station n rummer mønstret med rang n. Skriv en scene til hver station.
- DA forslag: Paladset er en rute, du kender udenad – fx dit hjem, klubben eller en fast gåtur – med 13 stationer. Station n rummer mønstret med rang n, og hver station har sin scene.
- EN nu: Choose a route you know by heart – your home, the club or a regular walk – and place 13 stations along it. Station n holds the pattern with rank n. Write a scene for each station.
- EN forslag: The palace is a route you know by heart – your home, the club or a regular walk – with 13 stations along it. Station n holds the pattern with rank n, and each station has its own scene.

**Ø7** · `PalaceScreen.tsx`, en station uden navn
- DA nu: Navngiv stationen
- DA forslag: Stationen har intet navn endnu
- EN nu: Name the station
- EN forslag: The station has no name yet

**Ø8** · `PalaceScreen.tsx`, under skabelonen
- DA nu: Gør billedet overdrevet, lad det bevæge sig, og lad det røre ved stationen.
- DA forslag: Et godt billede er overdrevet, bevæger sig og rører ved stationen.
- EN nu: Make the image exaggerated, let it move, and let it touch the station.
- EN forslag: A good image is exaggerated, moves and touches the station.

**Ø9** · `modes/palace/PalaceView.tsx`, ⓘ (to steder)
- DA nu: Paladsvandring øver ruten i dit huskepalads begge veje: tast mønstret, der bor ved en station, eller vælg stationen, hvor et mønster bor. …
- DA forslag: Paladsvandring øver ruten i dit huskepalads begge veje: fra stationen til mønstret, der bor dér, og fra mønstret til stationen, hvor det bor. …
- EN nu: Palace walk practises the route in your memory palace both ways: type the pattern that lives at a station, or choose the station where a pattern lives. …
- EN forslag: Palace walk practises the route in your memory palace both ways: from a station to the pattern that lives there, and from a pattern to the station where it lives. …

**Ø10** · `modes/complete/task.ts`, opgaven i Fuldfør
- DA nu: Tast mønstret. · Tast de mulige mønstre – hyppigste først. · Tast de tre hyppigste mønstre – hyppigste først.
- DA forslag: Hvilket mønster er det? · Hvilke mønstre er mulige? Hyppigste først. · Hvilke tre mønstre er hyppigst? Hyppigste først.
- EN nu: Type the pattern. · Type the possible patterns – most frequent first. · Type the three most frequent patterns – most frequent first.
- EN forslag: Which pattern is it? · Which patterns are possible? Most frequent first. · Which three patterns are most frequent? Most frequent first.

**Ø11** · `CompleteView.tsx`, ⓘ
- DA nu: Tast de mulige mønstre på mønstertastaturet, hyppigste først: …
- DA forslag: De mulige mønstre tastes på mønstertastaturet, hyppigste først: …
- EN nu: Type the possible patterns on the pattern keypad, most frequent first: …
- EN forslag: The possible patterns are typed on the pattern keypad, most frequent first: …

**Ø12** · `CompleteView.tsx`, den tomme liste
- DA nu: Tast et mønster nedenfor.
- DA forslag: Mønstrene, du taster nedenfor, står her.
- EN nu: Type a pattern below.
- EN forslag: The patterns you type below appear here.

**Ø13** · `EstimateView.tsx`, ⓘ
- DA nu: Tast dit bud på, hvor mange af 100 hænder (25 spil × 4) der har mønstret. …
- DA forslag: Buddet er, hvor mange af 100 hænder (25 spil × 4) der har mønstret. …
- EN nu: Type your estimate of how many of 100 hands (25 boards × 4) have the pattern. …
- EN forslag: The estimate is how many of 100 hands (25 boards × 4) have the pattern. …

**Ø14** · `HigherLowerView.tsx`, ⓘ
- DA nu: Tryk på det mønster, der forekommer oftest. …
- DA forslag: Det rigtige svar er det mønster, der forekommer oftest. …
- EN nu: Tap the pattern that occurs more often. …
- EN forslag: The right answer is the pattern that occurs more often. …

**Ø15** · `ReadView.tsx`, opgaven i Lynaflæsning
- DA nu: Se hånden, og tryk Klar · Se hånden …
- DA forslag: Hånden står, til du trykker Klar · Hånden vises …
- EN nu: Look at the hand, and tap Ready · Look at the hand …
- EN forslag: The hand stays until you tap Ready · The hand is shown …

**Ø16** · `ReadView.tsx`, ⓘ
- DA nu: Tæl farverne i hånden, og tast mønstret: de fire længder, …
- DA forslag: Mønstret er farvernes længder i hånden: de fire længder, …
- EN nu: Count the suits in the hand and type the pattern: the four lengths, …
- EN forslag: The pattern is the lengths of the suits in the hand: the four lengths, …

**Ø17** · `SudokuView.tsx`, opgaven
- DA nu: Find Østs og Vests fordeling
- DA forslag: Hvad er Østs og Vests fordeling?
- EN nu: Find East's and West's distribution
- EN forslag: What are East's and West's distributions?

**Ø18** · `SudokuView.tsx`, ⓘ
- DA nu: Tryk på en celle i Østs eller Vests række, og tast antallet af kort. "Noter" lader dig skrive flere muligheder i en celle. Hent ledetråde én ad gangen, og tryk "Lås", når hele fordelingen er udfyldt: …
- DA forslag: En celle i Østs eller Vests række vælges med et tryk, og antallet af kort tastes. "Noter" lader dig skrive flere muligheder i en celle. Ledetrådene hentes én ad gangen, og "Lås" låser fordelingen, når den er udfyldt: …
- EN nu: Tap a cell in East's or West's row and type the number of cards. "Notes" lets you write several possibilities in a cell. Fetch clues one at a time, and tap "Lock" when the whole distribution is filled in: …
- EN forslag: A cell in East's or West's row is chosen with a tap, and the number of cards is typed. "Notes" lets you write several possibilities in a cell. Clues are fetched one at a time, and "Lock" locks the distribution when it is filled in: …

**Ø19** · `ui/LineChart.tsx`, under kurven
- DA nu: Tryk på kurven for at se en uge.
- DA forslag: Et tryk på kurven viser en uge.
- EN nu: Tap the curve to see a week.
- EN forslag: Tapping the curve shows a week.

### Farvebehandling (`farvebehandling/ui/texts.ts`, `guide-analyse.md`)

**B1** · `guide.failed` og `loadFailed`
- DA nu: Guiden kunne ikke hentes. Prøv igen, når du er på nettet. · Banken kunne ikke hentes. Prøv igen, når du er online.
- DA forslag: Guiden kunne ikke hentes. Den kan hentes, når du er på nettet igen. · Banken kunne ikke hentes. Den kan hentes, når du er på nettet igen.
- EN nu: … Try again when you are online.
- EN forslag: … It can be loaded when you are online again.

**B2** · `pickerHelp` og ⓘ ved kortvælgeren
- DA nu: Tryk på et kort én gang for bordet, to gange for din hånd og tre gange for at fjerne det.
- DA forslag: Ét tryk på et kort giver det til bordet, to tryk til din hånd, og tre tryk fjerner det.
- EN nu: Tap a card once for dummy, twice for your hand and three times to remove it.
- EN forslag: One tap on a card gives it to dummy, two taps to your hand, and three taps remove it.

**B3** · `pickMore`
- DA nu: Vælg kort til bordet og din hånd.
- DA forslag: Bordet og din hånd mangler kort.
- EN nu: Choose cards for dummy and your hand.
- EN forslag: Dummy and your hand need cards.

**B4** · importfeltet: `label`, `choose` (gruppens navn for skærmlæsere) og `empty`
- DA nu: Indsæt kombination eller spil · Vælg en kombination fra spillet · Indsæt en kombination, fx EK65-B43, eller et spil fra BBO.
- DA forslag: Kombination eller spil · Kombinationerne i spillet · Feltet tager en kombination, fx EK65-B43, eller et spil fra BBO.
- EN nu: Paste a combination or a deal · Choose a combination from the deal · Paste a combination, e.g. AK65-J43, or a deal from BBO.
- EN forslag: Combination or deal · The combinations in the deal · The field takes a combination, e.g. AK65-J43, or a deal from BBO.

**B5** · importfeltets fejl
- DA nu: … Skriv kortene som E K D B 10 9 … 2 eller A K Q J T 9 … 2. · … Ret det, og prøv igen. · … Åbn spillet i handvieweren og kopiér den lange adresse. · Skriv bordet og hånden med en streg imellem, fx EK65-B43. · … Fjern et kort. · … Kopiér hele spillet igen. · … Kopiér hele LIN-teksten med md|…, eller handviewerens lange adresse.
- DA forslag: … Kortene skrives som E K D B 10 9 … 2 eller A K Q J T 9 … 2. · … Når det er rettet, kan teksten importeres. · … Den lange adresse fra handvieweren virker; den står, når spillet er åbnet dér. · Bordet og hånden skrives med en streg imellem, fx EK65-B43. · … Et kort skal fjernes. · … Hele spillet skal kopieres igen. · … Hele LIN-teksten med md|… virker, og det gør handviewerens lange adresse også.
- EN nu: … Write the cards as A K Q J T 9 … 2. · … Correct it and try again. · … Open the deal in the hand viewer and copy the long address. · Write dummy and your hand with a dash between them, e.g. AK65-J43. · … Remove a card. · … Copy the whole deal again. · … Copy the whole LIN text with md|…, or the long address from the hand viewer.
- EN forslag: … The cards are written as A K Q J T 9 … 2. · … Once it is corrected, the text can be imported. · … The long address from the hand viewer works; it appears when the deal is open there. · Dummy and your hand are written with a dash between them, e.g. AK65-J43. · … One card has to be removed. · … The whole deal has to be copied again. · … The whole LIN text with md|… works, and so does the long address from the hand viewer.

**B6** · ⓘ ved importfeltet
- DA nu: Indsæt en kombination som bordet-hånden (EK65-B43 eller AK65-J43), en LIN-tekst eller adressen fra BBO's handviewer. …
- DA forslag: Feltet tager en kombination som bordet-hånden (EK65-B43 eller AK65-J43), en LIN-tekst eller adressen fra BBO's handviewer. …
- EN nu: Paste a combination as dummy-hand (AK65-J43), a LIN text or the address from BBO's hand viewer. …
- EN forslag: The field takes a combination as dummy-hand (AK65-J43), a LIN text or the address from BBO's hand viewer. …

**B7** · ⓘ ved Vælg kombination
- DA nu: Vælg en kombination fra banken (hyppigste først; kan filtreres efter modpartens honnørpoint), eller byg den selv i kortvælgeren. …
- DA forslag: Kombinationen kommer fra banken (hyppigste først; kan filtreres efter modpartens honnørpoint) eller fra kortvælgeren, hvor du bygger den selv. …
- EN nu: Choose a combination from the bank (…), or build it yourself in the card picker. …
- EN forslag: The combination comes from the bank (…) or from the card picker, where you build it yourself. …

**B8** · ⓘ ved fanerne
- DA nu: … Selvvalgt: vælg selv, hvad du vil øve, uden at dagsplanen ændres. Analyse: slå enhver kombination op og se linjerne, chancerne og sidningerne.
- DA forslag: … Selvvalgt: du vælger selv, hvad du vil øve, uden at dagsplanen ændres. Analyse: enhver kombination kan slås op med linjerne, chancerne og sidningerne.
- EN nu: … Free practice: choose for yourself what to practise without changing the daily plan. Analysis: look up any combination and see the lines, the chances and the layouts.
- EN forslag: … Free practice: you choose for yourself what to practise without changing the daily plan. Analysis: any combination can be looked up with the lines, the chances and the layouts.

**B9** · ⓘ ved båndet, sidningerne og klubaftenen; `clubHint`
- DA nu: … Tryk på et felt for at se sidningen ved bordet. · … Gruppér efter fordeling (Vests antal kort) eller efter honnørernes placering. · … Tryk på et felt for detaljer; tekniknapperne … · Tryk på et felt for at se kombinationen og hyppigheden.
- DA forslag: … Et tryk på et felt viser sidningen ved bordet. · … Sidningerne kan grupperes efter fordeling (Vests antal kort) eller efter honnørernes placering. · … Et tryk på et felt viser detaljerne; tekniknapperne … · Et tryk på et felt viser kombinationen og hyppigheden.
- EN nu: … Tap a field to see the layout at the table. · … Group by distribution (West's number of cards) or by where the honours are. · … Tap a field for details; the technique buttons … · Tap a field to see the combination and how often it occurs.
- EN forslag: … Tapping a field shows the layout at the table. · … The layouts can be grouped by distribution (West's number of cards) or by where the honours are. · … Tapping a field shows the details; the technique buttons … · Tapping a field shows the combination and how often it occurs.

**B10** · ⓘ ved Sammenlign
- DA nu: Kryds præcis to linjer af med Sammenlign: båndet og tabellen viser så kun de to, …
- DA forslag: Med præcis to linjer krydset af under Sammenlign viser båndet og tabellen kun de to, …
- EN nu: Tick exactly two lines with Compare: the band and the table then show only those two, …
- EN forslag: With exactly two lines ticked under Compare, the band and the table show only those two, …

**B11** · Egne linjer: `editorHelp` og ⓘ
- DA nu: Byg linjen trin for trin. … · Byg din egen linje trin for trin og se dens chance ved siden af løserens. …
- DA forslag: Linjen bygges trin for trin. … · Din egen linje bygges trin for trin, og dens chance står ved siden af løserens. …
- EN nu: Build the line step by step. … · Build your own line step by step and see its chance next to the solver's. …
- EN forslag: The line is built step by step. … · Your own line is built step by step, and its chance is shown next to the solver's. …

**B12** · Spil den selv: `playLeadPrompt`, `playThirdPrompt` og ⓘ
- DA nu: Spil ud fra bordet eller hånden. · Læg et kort fra bordet. / Læg et kort fra hånden. · Spil ud fra bordet eller hånden, og læg 3. håndens kort. …
- DA forslag: Udspillet kan komme fra bordet eller hånden. · Bordet er i turen. / Hånden er i turen. · Du spiller ud fra bordet eller hånden og lægger 3. håndens kort. …
- EN nu: Lead from dummy or from your hand. · Play a card from dummy. / Play a card from your hand. · Lead from dummy or your hand, and play the 3rd-hand card. …
- EN forslag: The lead can come from dummy or from your hand. · It is dummy's turn. / It is your hand's turn. · You lead from dummy or your hand and play the 3rd-hand card. …

**B13** · Opgaverne: `pickBest` og `findHole`
- DA nu: Tryk på den bedste linje · Hvor taber linjen? Vælg sidningen.
- DA forslag: Hvilken linje er bedst? · Hvor taber linjen? Svaret er en af sidningerne.
- EN nu: Tap the best line · Where does the line fail? Choose the layout.
- EN forslag: Which line is better? · Where does the line fail? The answer is one of the layouts.

**B14** · ⓘ ved opgavetyperne
- DA nu: Vælg den linje, der giver størst chance for målet, og gæt chancen. … · Linjen er givet; gæt chancen for målet. … · Tryk på den bedste af to linjer. … · … Vælg den bedste fortsættelse, og gæt chancen nu. … · Linjen er givet; vælg den sidning (fordelingen af modpartens kort), hvor den taber. · Spil farven kort for kort mod normalt modspil. … · Vælg linjen til holdkamp (nå målet) og linjen til parturnering (flest stik i gennemsnit). …
- DA forslag: Opgaven er at finde den linje, der giver størst chance for målet, og gætte chancen. … · Linjen er givet, og chancen for målet skal gættes. … · Opgaven er at finde den bedste af to linjer. … · … Opgaven er at finde den bedste fortsættelse og gætte chancen nu. … · Linjen er givet, og svaret er den sidning (fordelingen af modpartens kort), hvor den taber. · Farven spilles kort for kort mod normalt modspil. … · Opgaven er at finde linjen til holdkamp (målet nås) og linjen til parturnering (flest stik i gennemsnit). …
- EN nu: Choose the line that gives the best chance of the goal, and guess the chance. … · The line is given; guess the chance of the goal. … · Tap the better of two lines. … · … Choose the best continuation and guess the chance now. … · The line is given; choose the layout (…) where it fails. · Play the suit card by card against normal defence. … · Choose the line for teams (make the goal) and the line for pairs (most tricks on average). …
- EN forslag: The task is to find the line that gives the best chance of the goal and to guess the chance. … · The line is given, and the chance of the goal is to be guessed. … · The task is to find the better of two lines. … · … The task is to find the best continuation and guess the chance now. … · The line is given, and the answer is the layout (…) where it fails. · The suit is played card by card against normal defence. … · The task is to find the line for teams (making the goal) and the line for pairs (most tricks on average). …

**B15** · Selvvalgt: `practiceHelp` og ⓘ
- DA nu: Øv det, du vil. … · Vælg filtre; tallet i parentes er antallet af kombinationer, …
- DA forslag: Her øver du det, du vil. … · Filtrene afgrænser opgaverne; tallet i parentes er antallet af kombinationer, …
- EN nu: Practise what you want. … · Choose filters; the number in brackets is the number of combinations, …
- EN forslag: Here you practise what you want. … · The filters narrow down the tasks; the number in brackets is the number of combinations, …

**B16** · Dine data: `persistTemporary`
- DA nu: … Eksportér jævnligt.
- DA forslag: … En jævnlig eksport sikrer dem.
- EN nu: … Export regularly.
- EN forslag: … A regular export keeps it safe.

**B17** · `guide-analyse.md` og `.en.md`, afsnit 1 og 2.3
- DA nu: Tryk kortene ind i kortvælgeren for bordet (Nord) og hånden (Syd), og vælg målet i stik. … · … Tryk "Angiv situationen", og sæt felterne med − og +:
- DA forslag: Kortene trykkes ind i kortvælgeren for bordet (Nord) og hånden (Syd), og målet vælges i stik. … · … "Angiv situationen" åbner felterne, som sættes med − og +:
- EN nu: Tap the cards into the card picker for dummy (North) and your hand (South), and choose the goal in tricks. … · … Tap "Set the situation", and set the fields with − and +:
- EN forslag: The cards are tapped into the card picker for dummy (North) and your hand (South), and the goal is chosen in tricks. … · … "Set the situation" opens the fields, which are set with − and +:

### Pointregnskab (`pointregnskab/ui/texts.ts`)

**P1** · `saveFailed` (også i Håndevaluering), `dataHelp` og ⓘ ved Dine data (begge spor)
- DA nu: … Eksportér en kopi under Indstillinger. · … Gem en kopi som fil, og hent den igen på en anden enhed. · … Eksportér en kopi som fil; en import viser først et resumé …
- DA forslag: … En kopi kan eksporteres under Indstillinger. · … En kopi kan gemmes som fil og hentes igen på en anden enhed. · … En kopi kan eksporteres som fil; en import viser først et resumé …
- EN nu: … Export a copy under Settings. · … Save a copy as a file and load it again on another device. · … Export a copy as a file; an import first shows a summary …
- EN forslag: … A copy can be exported under Settings. · … A copy can be saved as a file and loaded again on another device. · … A copy can be exported as a file; an import first shows a summary …

**P2** · `watch` (Løbende tælling)
- DA nu: Tæl med: honnørerne vises én ad gangen.
- DA forslag: Honnørerne vises én ad gangen, mens du tæller med.
- EN nu: Keep count: the honours are shown one at a time.
- EN forslag: The honours are shown one at a time while you keep count.

**P3** · ⓘ ved Blokke, Intervalkort og Regnestykket
- DA nu: Tæl honnørerne i en farve som én blok: … Tast blokkens point; inden for 5 s er hurtigt. · … Vælg det interval, meldingen viser. … · Tæl Nords og Syds honnørpoint, og træk dem fra 40. Tast svaret; …
- DA forslag: Honnørerne i en farve tælles som én blok: … Svaret er blokkens point; inden for 5 s er hurtigt. · … Svaret er det interval, meldingen viser. … · Modpartens honnørpoint er 40 minus Nords og Syds. Svaret tastes; …
- EN nu: Count the honours in a suit as one block: … Type the points of the block; within 5 s is fast. · … Choose the range the call shows. … · Count North's and South's high-card points and subtract them from 40. Type the answer; …
- EN forslag: The honours in a suit are counted as one block: … The answer is the points of the block; within 5 s is fast. · … The answer is the range the call shows. … · The opponents' high-card points are 40 minus North's and South's. The answer is typed; …

**P4** · ⓘ ved Løbende tælling, Kan han have den?, Hvem har den? og Kipningsretning
- DA nu: … Hold regnskab i hovedet, og tast til sidst, hvor mange point Vest og Øst har vist. … · … Svar ja, hvis han kan; nej kun, hvis den sikkert sidder hos den anden. · Svar Vest eller Øst, hvis honnøren sidder samme sted …; ellers "kan ikke afgøres". … · Kip mod den modspiller, der sikkert har honnøren. …
- DA forslag: … Regnskabet holdes i hovedet, og til sidst tastes, hvor mange point Vest og Øst har vist. … · … Svaret er ja, hvis han kan; nej kun, hvis den sikkert sidder hos den anden. · Svaret er Vest eller Øst, hvis honnøren sidder samme sted …; ellers "kan ikke afgøres". … · Kipningen går mod den modspiller, der sikkert har honnøren. …
- EN nu: … Keep count in your head, and at the end type how many points West and East have shown. … · … Answer yes if he can; no only if it is surely with the other defender. · Answer West or East if the honour is in the same place …; otherwise "can't tell". … · Finesse against the defender who surely has the honour. …
- EN forslag: … The count is kept in your head, and at the end you type how many points West and East have shown. … · … The answer is yes if he can; no only if it is surely with the other defender. · The answer is West or East if the honour is in the same place …; otherwise "can't tell". … · The finesse goes against the defender who surely has the honour. …

**P5** · ⓘ ved regnskabspanelets chips
- DA nu: … Tryk på en chip for at notere V, Ø eller ? (giver ikke point). …
- DA forslag: … Et tryk på en chip noterer V, Ø eller ? (giver ikke point). …
- EN nu: … Tap a chip to note W, E or ? (no points). …
- EN forslag: … Tapping a chip notes W, E or ? (no points). …

### Håndevaluering (`haandevaluering/ui/texts.ts`)

**H1** · ⓘ ved Honnørpoint og Trumflængde og korthed
- DA nu: Tast honnørpointene: E 5, K 3, D 1½, B ½ og 10 ¼. … · … Tast din p; inden for 20 s giver 10 XP.
- DA forslag: Honnørpointene er E 5, K 3, D 1½, B ½ og 10 ¼. … · … Svaret er din p; inden for 20 s giver 10 XP.
- EN nu: Type the honour points: A 5, K 3, Q 1½, J ½ and 10 ¼. … · … Type your p; within 20 s gives 10 XP.
- EN forslag: The honour points are A 5, K 3, Q 1½, J ½ and 10 ¼. … · … The answer is your p; within 20 s gives 10 XP.

**H2** · ⓘ ved Niveaubeslutningen
- DA nu: Læg din og makkers p sammen til P. …
- DA forslag: Parrets P er din og makkers p lagt sammen. …
- EN nu: Add your p and partner's p to get P. …
- EN forslag: The pair's P is your p and partner's p added together. …

**H3** · ⓘ ved Hvad makker skal have, Spildte værdier og Ankre
- DA nu: … Tast svaret med ½ og ¼. · … Tast din p igen. · … Tast tallet med ½.
- DA forslag: … Svaret tastes med ½ og ¼. · … Svaret er din nye p. · … Tallet tastes med ½.
- EN nu: … Type the answer with ½ and ¼. · … Type your p again. · … Type the number with ½.
- EN forslag: … The answer is typed with ½ and ¼. · … The answer is your new p. · … The number is typed with ½.

**H4** · ⓘ ved Sammenlign metoder
- DA nu: … De to er uenige: regn P, og vælg den metode, der giver P-modellens kontrakt. …
- DA forslag: … De to er uenige, og svaret er den metode, der giver P-modellens kontrakt. …
- EN nu: … The two disagree: work out P and choose the method that gives the P-model's contract. …
- EN forslag: … The two disagree, and the answer is the method that gives the P-model's contract. …

## 4. Til afgørelse

**A1 · Løserens linjer i bankens data.** Linjeteksterne i `content/app/side-N.json` begynder ofte med bydeform: 3.168 trin i appens data begynder med "Slå …", heraf 1.858 "Slå esset.", fx også "Slå esset og kongen." og med begrænsede forbindelser "Gå ind på hånden med en sideindgang, og spil lille …". De er data, som løseren skriver (`describe.ts`), og de står i guiden som eksempler. At ændre dem kræver en ny skabelon i `describe.ts` og `lineText.ts`, at `LINES_VERSION` tælles op, og at hele banken løses igen (ca. 3 timer). Afgrænsningen siger "ingen ændringer i data". **Forslag:** de bliver, som de er; linjerne er spillets trin, ligesom navnene på opgaverne, og testen springer bankens data over.

**A2 · Huskereglerne i `techniques.json`.** "Spil mod honnøren, ikke fra den.", "Spil mod det kort, du vil gøre til stik.", "Kip først mod det laveste hul." og "Sikr målet, ikke maksimum." er korte huskeregler i bydeform. **Forslag:** de skrives om, så de stadig er korte (engelsk tilsvarende):
- Spil mod honnøren, ikke fra den. → Udspillet går mod honnøren, ikke fra den.
- Spil mod det kort, du vil gøre til stik. → Udspillet går mod det kort, der skal blive stik.
- Kip først mod det laveste hul. → Den første kipning går mod det laveste hul.
- Sikr målet, ikke maksimum. → Målet før maksimum.

**A3 · `docs/MODEL.md`** (ændres kun med Franks godkendelse): "Tjek i stedet alle fire farver for stoppere." og "Bemærk: modellens egen skala er dårligst i sans." **Forslag:** "I stedet tjekkes alle fire farver for stoppere." og "Bemærkning: modellens egen skala er dårligst i sans."

**A4 · Spørgsmål i dialoger** (overskriften over to knapper): "Afbryd sessionen?", "Importér filen?" og "Filen har … Erstat dataene her?" (Pointregnskab og Håndevaluering). **Forslag:** "Skal sessionen afbrydes?", "Skal filen importeres?" og "Skal dataene her erstattes?"; engelsk "Should the session be stopped?", "Should the file be imported?" og "Should the data here be replaced?".

**A5 · To overskrifter.** "Kom i gang" (vejledningens første afsnit) og "Husk" (kortet med mønstrets billede i sessionen). **Forslag:** "Første skridt" (engelsk "Getting started" bliver) og "Til at huske" (engelsk "To remember").

**A6 · Sidefodens sætning.** "Har du fundet en fejl, eller har du en idé til en ny træner? Skriv til mig." (linket "Skriv til mig" bliver). Sidefoden er den samme som på www.kontraktbridge.dk. **Forslag:** "… Så hører jeg gerne fra dig." / "… I would be glad to hear from you." – eller den venter til forsiden, så de to sidefødder ændres sammen.

## 5. Falske træf (bliver)

Sætninger, der begynder med et ord, der kan være bydeform, men ikke er det her. Testen skal kende dem:

- Meldingen pas: "Pas i åbningsposition: …", "Pas uden grænse: …", "Pas i åbningsposition viser højst 11 hp."
- En knap eller opgave som grundled: "Eksportér gemmer …", "Importér viser først …", "Start giver opgaver af blandede typer.", "\"Vis alle sidninger\" folder resten ud …", "\"Noter\" lader dig skrive …", "Spil den selv, åbnet fra Analyse, giver …", "Gæt: +5 ved rigtigt."
- Lister med navne: "Opgavetyperne: Vælg linjen, Hvor stor er chancen?, …" og "Niveau 4 og 5: Sammenlign metoder, hvor …"

## Testen (efter godkendelsen)

`src/sprog/bydeform.test.ts` læser al dansk tekst med `danskTekst.ts` som fagordstesten og fejler, hvis en sætning begynder med et udsagnsord i bydeform, også efter kolon og semikolon. Listen over bydeformer og listen over undtagelser (gruppe 1, 2 og 5 og de valg, Frank træffer i gruppe 4) står i `src/sprog/bydeform.ts`. Bankens linjer springes over, hvis A1 bliver som foreslået.

## Godkendelse (Frank, 30. oktober 2026)

Listen er godkendt med disse rettelser, og teksterne er rettet efter dem:

- **F3** med navneord: "Honnørpoint under spillet", "Opslag af kombinationer · linjer, chancer og sidninger" og "Håndvurdering med P-modellen" / "High-card points during play", "Combination look-up · lines, chances and layouts" og "Hand evaluation with the P-model".
- **B4 og B6:** "Feltet tager imod en kombination …" / "The field accepts a combination …".
- **B5:** "Handviewerens lange adresse virker også; den står i adresselinjen, når spillet er åbnet dér." / "The hand viewer's long address works too; it is in the address bar when the deal is open there."
- **Generelt:** mange passive -es-former i træk undgås. "Du" som grundled er beskrivende form og bruges, hvor tre eller flere -es-former stod tæt, fx "Du taster svaret med ½ og ¼." (H3), "Du vælger en celle … og taster antallet af kort" (Ø18), "Du holder regnskab i hovedet og taster til sidst …" (P4), "du udleder … og låser fordelingen" (F12), "Mønstertastaturet: du taster …" (F9), "Du taster de mulige mønstre …" (Ø11), "en tilfældig hånd vises, og du taster dens mønster" (F11), "Du trykker kortene ind …" (B17) og "Selvvalgt: du vælger frit …" (F14).
- **A1:** løserens linjer bliver, og testen springer bankens data og `describe.ts` over.
- **A2:** huskereglerne som foreslået. **A3:** de to sætninger i `docs/MODEL.md` som foreslået. **A4:** som foreslået.
- **A5:** "Første skridt" og "Mønstrets billede" / "The pattern's image".
- **A6:** sidefodens sætning venter, til sidefødderne ændres samlet med forsiden og konventionstræneren.

Fundet under rettelsen og rettet efter samme mønster: `persistUnknown` ("… En jævnlig eksport sikrer dem.") ved siden af B16, guidens "**Sammenlign:** kryds præcis to linjer af." ved siden af B10 ("**Sammenlign:** med præcis to linjer krydset af viser båndet og tabellen kun de to, …") og den engelske etiket på importfeltet ("Combination or deal").

`docs/MODEL.md` havde en tredje sætning i bydeform, "**Brug ikke farveskalaen i sans.** Den er materialets dårligste dér.", som ikke stod på listen. Frank godkendte forslaget "**Farveskalaen bruges ikke i sans.** Den er materialets dårligste dér." 30. oktober 2026, og sætningen er taget af testens undtagelsesliste.

## Del 2: sidefoden (grenen `beskrivende-form`, 30. oktober 2026, til godkendelse)

Sammen med forsiden og konventionstræneren (Franks opgave 30. oktober 2026). Appen før er tagget `v28-foer-beskrivende-form`.

- `src/ui/Footer.tsx`
  - DA nu: Har du fundet en fejl, eller har du en idé til en ny træner? Skriv til mig.
  - DA forslag: Har du fundet en fejl, eller har du en idé til en ny træner? Så hører jeg gerne fra dig.
  - EN nu: Have you found a mistake, or do you have an idea for a new trainer? Write to me.
  - EN forslag: Have you found a mistake, or do you have an idea for a new trainer? I would be glad to hear from you.
- Linket "Skriv til mig" / "Write to me" bliver.
- `src/sprog/bydeform.ts`: undtagelsen "Skriv til mig." (A6) fjernes, ingen test søger efter sætningen.

**Godkendt** (Frank, 30. oktober 2026): sætningen rettes kun dér, hvor den står (forsidens liste, A1 valg a), og undtagelsen "Skriv til mig." er fjernet fra `src/sprog/bydeform.ts`.

**Fundet bagefter:** meta-beskrivelsen i `index.html` (`description` og `og:description`) begynder i bydeform: "Træn bridge fem minutter om dagen: de 39 fordelinger, …". `danskTekst.ts` læser ikke sidens `<head>`, og "træn" var ikke på listen over bydeformer, så hverken skanningen eller testen så den. Forslag: "Bridgetræning fem minutter om dagen: de 39 fordelinger, pointregnskab under spillet, farvebehandling og håndevaluering med P-modellen. Gratis og uden login." `src/app/meta.test.ts` søger efter begyndelsen og rettes med. **Godkendt** (Frank, 31. oktober 2026) og rettet; `meta.test.ts` tjekker nu også, at beskrivelsen står i beskrivende form, og "træn" står på listen over bydeformer.
