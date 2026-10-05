# SPEC-pointregnskab

Oct 5, 2026 · @Frank

Pointregnskabet træner optælling af honnørpoint under spillet og bygges som et nyt, selvstændigt spor i fordelingstræneren. Den eksisterende app, SPEC.md og SPEC-farvebehandling.md forbliver uændrede.

Version 3 (5. oktober 2026): Franks afgørelser af de åbne punkter er skrevet ind, og svarerens pas giver kun en grænse, når Nord–Syd har passet imellem. Version 2 gjorde sporet tosproget (dansk og engelsk) med ⓘ-hjælp ved elementerne som resten af appen. Alle afklaringer står under Afklaret til sidst.

## Afgrænsning

Fordelingssporets og farvebehandlingens adfærd, data og udseende må ikke ændres. Pointregnskabet bygges i sin egen mappe, `src/pointregnskab/`, og bruger eksisterende kode som bibliotek.

Før arbejdet starter:

1. Commit og tag den nuværende app, fx `v3-tosproget`.
2. Arbejd på grenen `pointregnskab`, og flet først ind efter godkendelse.
3. Kør alle eksisterende tests før og efter. De skal bestå uændret.

| Sted | Må ske | Må ikke ske |
| --- | --- | --- |
| Navigation | ét nyt menupunkt på forsiden: Pointregnskab (engelsk: Point count), med ⓘ som de andre menupunkter | ændre eksisterende menupunkter eller ruter |
| Vejledning | et nyt afsnit om Pointregnskabet i den samlede vejledning (`src/app/screens/GuideScreen.tsx`), på begge sprog | ændre de eksisterende afsnit |
| Sprog (`src/i18n.ts`) | bruges som bibliotek: `getLang()` og `tx()`; sproget vælges stadig kun på forsiden | ændre sprogvalget eller dets lagring |
| Hjælp (`src/ui/Info.tsx`) | bruges som bibliotek til ⓘ | ændre komponenten |
| Motor (`src/engine/`) | bruges som bibliotek: streak, XP, datoer, PRNG, Leitner og kombinatorik | ændres |
| Systemfil (`src/system/dk-2over1.json`) | læses for meldingernes hp-intervaller og forklaringer (`text` og `textEn`) | ændres |
| Meldegiveren (`src/system/interpreter.ts`, `chooseCall`) | kaldes som bibliotek | ændres; `auction.ts` ændres heller ikke |
| 13-sudokuens generator | kaldes som bibliotek i Fuldt regnskab | ændres, eller påvirke dagens sudoku |
| Lagring | ny nøgle `pointregnskab:v1` | læse eller skrive andre nøgler; sproget læses med `getLang()`, ikke fra `fordelingstraener:v1` |
| Designtokens | nye tokens tilføjes `design/tokens.json` | ændre eksisterende tokens |

Kræver noget alligevel en ændring i eksisterende kode, skal Claude Code stoppe og spørge.

Besked til Claude Code:

> Byg Pointregnskabet som et nyt, selvstændigt spor efter SPEC-pointregnskab.md. Sporet er på dansk og engelsk og har ⓘ-hjælp ved elementerne som resten af appen. Eksisterende spor, systemfilen, meldegiveren og 13-sudokuens generator må ikke ændres. Kør de eksisterende tests før og efter; de skal alle bestå uændret.

## Formål og placering

Brugeren lærer at holde regnskab med honnørpoint under spillet og at slutte sig til, hvor de manglende honnører sidder. Det er søsteren til 13-sudokuen: hvor 13-sudokuen tæller kort pr. farve, tæller Pointregnskabet de 40 honnørpoint.

- **Placering:** fordelingstræneren, som en del af optælling. Konventionstræneren bruger ikke sporet.
- **Skala:** 4-3-2-1. Meldeintervallerne i systemet er i HCP, så optællingen skal være det også. P-modellen fra MODEL.md bruges ikke her; den hører til vurdering af egen og makkers hånd. MODEL.md og konventionstræneren ligger uden for repoet og skal ikke bruges.
- **Brugssituation:** spilfører med sin egen hånd og bordet synlige, meldinger fra modparten og honnører, der falder i spillet.
- **Slutmålet:** at kunne svare på "Hvem har damen?" og "Kan Øst have esset?", før kipningen skal tages.
- **Forbindelse til farvebehandling:** en sikker placering af en honnør afgør retningen for en kipning. Opgaver af den type henviser til farvebehandlingens analyse, men ændrer den ikke.
- **Sprog:** dansk og engelsk som resten af appen (se Sprog og hjælp).

## Model

Regnskabet er eksakt. Appen gennemgår alle måder, de usete honnører kan fordeles på Vest og Øst, og beholder dem, der passer med meldinger og viste kort.

1. **Modpartens point:** M = 40 − (Nords hp + Syds hp). Tallet er altid kendt.
2. **Tilladte point:** hver modspiller har en mængde af tilladte samlede point fra sine meldinger (se Meldeinformation). Som regel er det ét interval \[min, max\], men systemfilen har meldinger med to intervaller: Michaels-cuebid og usædvanlig 2NT viser 8–15 eller 17+. Mængden er så foreningen af intervallerne, og løseren regner med den. Uden melding er mængden \[0, M\].
3. **Viste point:** når en modspiller lægger en honnør, lægges den til hans viste point.
4. **Usete honnører:** de E, K, D og B, som hverken Nord, Syd eller de spillede kort viser.
5. **Løser:** alle 2ʰ placeringer af de h usete honnører på Vest og Øst gennemgås (højst 16 honnører, dvs. 65.536 placeringer). En placering er mulig, når Vests samlede point ligger i hans mængde og Østs i hans.
6. **Svar pr. honnør:** sikkert hos Vest, sikkert hos Øst eller kan ikke afgøres, afhængigt af om honnøren sidder samme sted i alle mulige placeringer.
7. **Restinterval:** det mindste og største antal point, hver modspiller kan have tilbage, over alle mulige placeringer. Det vises i facit, ikke i regnskabspanelet.
8. **Fuldt regnskab:** kendte farvelængder fra en 13-sudoku indgår. En placering er kun mulig, hvis ingen modspiller får flere honnører i en farve, end han har kort i den.

**Eksempel.** Vest åbnede 1NT (15–17) og har vist ♠E, ♠K og ♥K, i alt 10 point. De eneste usete honnører er ♣D og ♦E. Vest mangler 5–7 point, og af mulighederne 0, 2, 4 og 6 passer kun 6. Begge honnører sidder derfor hos Vest, forudsat at Østs interval tillader, at han ikke har flere point.

I første version afgør løseren kun sikkert, umuligt eller uafgjort. Sandsynligheden i de uafgjorte tilfælde (vægtet med ledige pladser) er en senere udvidelse.

## Meldeinformation og pas-slutninger

Modspillernes tilladte point kommer fra systemfilen. Pas-slutninger, som systemfilen ikke dækker, ligger i Pointregnskabets egen fil.

- **Åbninger og indmeldinger:** hp-intervallerne læses direkte fra `src/system/dk-2over1.json`, fx 1NT 15–17, svag 2 5–11, indmelding på 1-trinnet 8–17 og Michaels 8–15 eller 17+. Forklaringen vises fra feltet `text` på dansk og `textEn` på engelsk.
- **Pas i åbningsposition:** højst 11 hp. Det følger af systemfilen, fordi en hånd med 12 hp eller mere altid har en åbning. Kontrolleret 5. oktober 2026: ingen af 100.001 tilfældige hænder med 12+ hp passer efter `chooseCall('opening', …)`.
- **Pas efter modpartens åbning:** giver ingen grænse (\[0, M\]), fordi en stærk hånd uden passende indmelding også passer, medmindre pas-reglerne siger andet.
- **Ingen melding:** har en modspiller ikke haft lejlighed til at melde, er mængden \[0, M\].
- **Hårde grænser:** intervallerne bruges som hårde grænser. Skøn, fx en god 11'er der åbner, indgår ikke.

Pas-regler uden for systemfilen ligger i `src/pointregnskab/content/pas-regler.json` med tekst på begge sprog:

```json
{ "context": "responder-pass-after-1-suit", "hcp": [0, 5],
  "text": "Svarer passede på makkers åbning i 1 farve",
  "textEn": "Responder passed partner's one-level suit opening" }
```

| Situation | Interval | Status |
| --- | --- | --- |
| Svarer passer på makkers åbning i 1 farve | 0–5 hp | bekræftet |
| Svarer passer på makkers 1NT-åbning | 0–7 hp | bekræftet |

Pas-reglerne gælder kun, når Nord–Syd har passet mellem åbningen og svarerens pas. Har Nord eller Syd meldt ind eller doblet, giver svarerens pas ingen grænse (\[0, M\]), fordi han kan have point uden en passende melding.

## Øvelser, sværhedsgrader og husketeknikker

Seks øvelser fører fra regnestykket til det fulde regnskab ved bordet.

1. **Regnestykket** (The sum): Nords og Syds hænder vises. "Hvor mange point har modparten?" Svaret tastes.
2. **Løbende tælling** (Running count): honnørerne vises én ad gangen, som de falder, uden notatfelt. Til sidst: "Hvor mange point har Vest vist? Og Øst?" Visningstiden starter på 2 s pr. kort og tilpasses (se Session).
3. **Kan han have den?** (Can he have it?): "Kan Øst have ♠E?" Ja eller nej.
4. **Hvem har den?** (Who has it?): "Hvem har ♣D?" Vest, Øst eller kan ikke afgøres.
5. **Kipningsretning** (Finesse direction): "Du skal kippe mod ♣D. Hvilken vej?" Svaret er Vest, Øst eller "det er et gæt".
6. **Fuldt regnskab** (Full count): længder fra en 13-sudoku og point i samme opgave.

"Kan ikke afgøres" og "det er et gæt" er altid gyldige svar. At vide, hvornår man ikke ved det, er en del af færdigheden.

| Niveau | Indhold |
| --- | --- |
| 1 | ét interval (fx en 1NT-åbner) og én uset honnør |
| 2 | ét interval og flere usete honnører |
| 3 | to intervaller, fx åbning og pas, så restintervallet skal bruges |
| 4 | løbende tælling, hvor regnskabspanelet er skjult |
| 5 | fuldt regnskab med længder |

Sværheden tilpasses efter de seneste 20 svar: over 90 % rigtige rykker et niveau op, under 80 % ét ned.

Husketeknikker:

- **Regn oppefra:** højeste mulige minus vist = det, han højst har tilbage. "Vest har højst 17 og har vist 14, så esset kan han ikke have."
- **Ankre:** 40 i alt og 10 pr. hånd i snit. En makker, der har passet en åbning i 1 farve, har højst 5.
- **Blokke:** honnørerne i en farve tælles som én blok: E K = 7, E D = 6, K D = 5, E K D = 9, D B = 3. Blokkene trænes som en lille Leitner-bunke i opvarmningen.
- **Intervalkort:** meldingernes hp-intervaller fra systemfilen trænes som en lille Leitner-bunke. Kun intervallerne hører til her; selve konventionerne trænes i konventionstræneren (bekræftet).

## Generator

Opgaverne genereres fra tilfældige fordelinger, og facit beregnes altid af løseren. Intet facit skrives i hånden.

1. **Fordeling:** motorens kortgiver med seedbar PRNG. Nord og Syd er spilførersiden.
2. **Giver:** tilfældig blandt de fire pladser, som i 13-sudokuen.
3. **Meldeforløbet:** Pointregnskabet bygger selv Øst–Vests meldinger med `chooseCall` som bibliotek, fordi `simulateAuction` kun melder den første åbning og én indmelding:
   - Pladserne melder i rækkefølge fra giveren. Den første, der kan åbne efter `chooseCall('opening', …)`, åbner; de foregående har passet i åbningsposition (højst 11 hp).
   - Åbner Øst eller Vest i 1 farve eller 1NT, kan næste modstander (Nord eller Syd) melde ind. Passer Nord–Syd, passer svareren hos Øst–Vest efter pas-reglerne, og generatoren beholder kun fordelinger, hvor svarerens point ligger i pas-reglens interval; ellers ville han have meldt. Har Nord eller Syd meldt ind eller doblet, giver svarerens pas ingen grænse.
   - Åbner Nord eller Syd, kan næste modspiller melde ind efter systemfilens `over-…`-kontekster; ellers passer han (ingen grænse).
   - Nord–Syds meldinger indgår ikke i regnskabet. Kun kontrakten vises kort, fx "Syd spiller 4♠" (engelsk "South plays 4♠").
4. **Krav til meldingerne:** mindst én modspiller skal have tilladte point, der begrænser, dvs. ikke \[0, M\].
5. **Ledetrådsstrøm:** i første version vises en tilfældig delmængde af modspillernes honnører i tilfældig rækkefølge. Et rigtigt spilforløb, hvor honnører falder, når de vinder, dækker eller er tvunget, er en senere udvidelse.
6. **Spørgsmålet:** en uset honnør vælges, og løseren giver facit. Ca. hver fjerde opgave skal have facit "kan ikke afgøres".
7. **Kvalitet:** fra niveau 2 skal mindst én honnør være sikkert placeret uden at være set. Opgaver, hvor svaret kan aflæses direkte, forkastes.
8. **Fuldt regnskab:** længderne kommer fra 13-sudokuens generator, kaldt som bibliotek med et nyt seed, aldrig dagens sudoku. Kun Vests og Østs længder bruges.
9. **Genskabelse:** hver opgave har et seed og kan genskabes præcist. Opgavens tekster bygges på det sprog, der gælder, når opgaven vises.

## Session, scoring, progression og data

Pointregnskabet har sin egen 5-minutterssession:

1. **Opvarmning, 45 s:** blokke og intervalkort fra Leitner-bunken.
2. **Regnestykket, 45 s:** lynrunde.
3. **Niveau, 150 s:** 3–4 opgaver af type 2–5 på det aktuelle niveau.
4. **Status, 30 s:** streak, XP og niveau.

Fuldt regnskab er ugens boss: hver 7. session med dobbelt XP.

| Svar | Resultat | XP |
| --- | --- | --- |
| rigtigt inden for tidsgrænsen | rigtigt | 10 |
| rigtigt over tidsgrænsen | rigtigt | 5 |
| ét af to tal rigtigt i løbende tælling | halvt | 5 |
| forkert | forkert | 0 |

- **Tidsgrænser:** 5 s for regnestykket og 15 s for de øvrige spørgsmål.
- **Overmod:** at svare "sikkert hos Vest", når facit er "kan ikke afgøres", er forkert og får sin egen feedback: "Det kunne du ikke vide endnu." (engelsk: "You couldn't know that yet.").
- **Visningstiden i løbende tælling** følger samme regel som Lynaflæsning (SPEC.md): den starter på 2.000 ms pr. kort, bliver 10 % kortere efter et rigtigt svar og 15 % længere efter en fejl, inden for 800–4.000 ms pr. kort. Den gemmes i `pointregnskab:v1`.
- **Leitner** bruges kun til blokke og intervalkort. Opgaverne genereres og styres af niveauet, ikke af en fast bank.
- **Streak og XP** er adskilt fra de andre spor. Det er et bevidst valg.

Data ligger i ét JSON-objekt under nøglen `pointregnskab:v1`:

- **Indhold:** version, indstillinger, niveau og glidende træfsikkerhed pr. øvelse, visningstiden for løbende tælling, Leitner-emner for blokke og intervalkort, XP, streak og sessioner. Sproget gemmes ikke her; det læses med `getLang()`.
- **Skema:** Claude Code skriver det som en TypeScript-type i samme stil som de andre spor. Typen godkendes, før brugerfladen bygges.
- **Eksport og import:** egen eksport og import under Pointregnskabets indstillinger.
- **Versioner:** ved en ny skemaversion migreres data, og ukendte felter bevares.

## Sprog og hjælp

Appen er tosproget: dansk som standard og engelsk, når brugeren vælger det med knappen øverst på forsiden. Pointregnskabet følger valget.

- **Sproget:** læses med `getLang()` fra `src/i18n.ts`. App tegner hele træet igen ved et sprogskift, så skærmene skal ikke selv lytte.
- **Tekstfilen:** al ordlyd ligger i `src/pointregnskab/ui/texts.ts` med en dansk og en engelsk udgave af samme type, som `src/farvebehandling/ui/texts.ts` (`TEXT` vælger efter sproget). Der står ingen ordlyd i komponenterne.
- **Data:** pas-reglerne har `text` og `textEn`; meldingernes forklaringer kommer fra systemfilens `text` og `textEn`.
- **Kort og tal:** på dansk E K D B, på engelsk A K Q J. Tal formateres med `formatInt` og `formatDecimal` fra motoren, der skriver decimalkomma på dansk og decimalpunktum på engelsk.
- **Engelsk bridgesprog:** HCP, opening, overcall, takeout double, pass, declarer, dummy, finesse. Ordlisten nedenfor bruges overalt.
- **ⓘ-hjælp:** med `src/ui/Info.tsx` står et ⓘ ved hvert element nedenfor. Et tryk viser en kort forklaring på begge sprog lige under elementet: hvad det gør, og hvordan det bruges. Et nyt tryk skjuler den. ⓘ står ved siden af elementet i en `.with-info`-række.
  - Menupunktet på forsiden og Pointregnskabets egen forside (dagens plan, startknappen, indstillinger og data).
  - Hver af de seks øvelser ved spørgsmålet.
  - Regnskabspanelet (interval, vist og rest), Meldelinjen, ledetrådsstrømmen og Honnørchippene (notater).
  - Facit, husketeknikkerne (blokke og intervalkort) og status.
- **Vejledningen:** den samlede vejledning på forsiden får et afsnit om Pointregnskabet på begge sprog.

| Dansk | Engelsk |
| --- | --- |
| Pointregnskab | Point count |
| Regnestykket | The sum |
| Løbende tælling | Running count |
| Kan han have den? | Can he have it? |
| Hvem har den? | Who has it? |
| Kipningsretning | Finesse direction |
| Fuldt regnskab | Full count |
| Regnskab, interval, vist, rest | Count, range, shown, left |
| Usete honnører | Unseen honours |
| Kan ikke afgøres | Can't tell |
| Det er et gæt | It's a guess |
| Regn oppefra, ankre, blokke, intervalkort | Count down from the top, anchors, blocks, range cards |

## Layout og brugerflade

Pointregnskabet ligger i appens 480 px-kolonne og følger samme læseretning som de andre spor: situationen, kortene, regnskabet og spørgsmålet. Wireframe og regler nedenfor er designgrundlaget; ⓘ står ved elementerne efter reglerne i Sprog og hjælp.

```text
┌──────────────────────────────────┐
│ Pointregnskab        ⓘ  Niveau 3 │
├──────────────────────────────────┤
│ Syd spiller 4♠                   │
│ Vest: 1NT (15–17) · Øst: pas   ⓘ │
├──────────────────────────────────┤
│ BORDET (Nord)             11 hp  │
│ ♠ K 4 3  ♥ E 7 2  ♦ D 6 5  ♣ …   │
│ DIG (Syd)                 13 hp  │
│ ♠ E D B 9 …                      │
│ Modparten har            16 hp   │
├──────────────────────────────────┤
│ REGNSKAB      ⓘ  Vest      Øst   │
│ Interval       15–17      0–5    │
│ Vist              10        0    │
│ Rest             5–7      0–5    │
├──────────────────────────────────┤
│ Seneste: Vest lægger ♥K          │
│ Usete honnører: ⓘ [♣D]  [♦E]     │
├──────────────────────────────────┤
│ Hvem har ♣D?                   ⓘ │
│ [Vest]   [Øst]   [Kan ikke afg.] │
└──────────────────────────────────┘
```

- **Kortene:** bordet og hånden vises farve for farve (♠ ♥ ♦ ♣) med honnører i fed; ♥ og ♦ i appens røde farvetoken. Hp-tallet står ved hver hånd.
- **Regnskabspanelet:** viser interval, vist og rest for hver modspiller. Rest er kun de tilladte point minus det viste, så panelet aldrig afslører løserens slutning. Har en modspiller to intervaller, vises de begge, fx "8–15 / 17+" og resten "0–5 / 7+". Panelet er skjult fra niveau 4.
- **Usete honnører:** vises som chips. Brugeren kan trykke på en chip og markere Vest, Øst eller ? som notat; notaterne gives ikke point og er slået fra på niveau 4.
- **Ledetrådsstrømmen:** én linje pr. hændelse, fx "Vest lægger ♥K", med den nyeste øverst.
- **Facit:** én sætning med begrundelsen fra en fast skabelon, og de få mulige placeringer, når der er højst fire. Skabelonerne, på begge sprog:
  - *Den anden kan ikke have den:* "Øst kan højst have 3 hp tilbage, og ♠E er 4, så den sidder hos Vest." (engelsk: "East can have at most 3 HCP left, and ♠A is worth 4, so it is with West.") Bruges, når honnøren er mere værd end modspillerens største rest.
  - *Han skal have den:* "Vest mangler 5–7 og kan kun nå det med både ♣D og ♦E." ("West needs 5–7 more and can only get there with both ♣Q and ♦A.") Bruges, når modspilleren kun kan nå sit minimum med honnøren.
  - *Kan ikke afgøres:* "Begge placeringer passer: ♣D hos Vest giver Vest 12 hp, ♣D hos Øst giver Øst 5 hp." ("Both placements fit: ♣Q with West gives West 12 HCP, ♣Q with East gives East 5 HCP.") Viser en mulig placering for hver side.
  - *Overmod:* "Det kunne du ikke vide endnu." ("You couldn't know that yet.") efterfulgt af sætningen for "kan ikke afgøres".
- **Øvrigt:** samme tone, mørk tilstand, systemskrift, trykflader på mindst 44 px (ⓘ har en trykflade på ca. 44 px, selv om cirklen er mindre) og kontrast på mindst 4,5:1 som resten af appen.

## Designarbejde i Claude Design

Wireframe og regler i afsnittet Layout er designgrundlaget, så brugerfladen kan bygges nu. Claude Design bruges bagefter, når designet skal ændres.

- **Designsystem:** [Fordelingstræneren](https://claude.ai/artifact/NmcghGRGc1WRhmSMnjwTq3), bygget på `design/tokens.json`. Komponenterne Kort og Spillekort genbruges.
- **Nye komponenter:** Regnskabspanel, Honnørchip og Meldelinje. De tegnes ind i designsystemet, når de er bygget.
- **Nye tokens:** kun hvis Regnskabspanelet kræver det; de tilføjes `design/tokens.json` uden at ændre eksisterende tokens.
- **Godkendte artboards:** ingen endnu. Når et artboard godkendes, skrives navnet her, og så gælder det frem for wireframen.

Krav til Pointregnskabets komponenter:

- **Kun tokens:** ingen farveværdier og ingen tal med enhed i komponentfilerne, undtagen 0, 1px-streger og procenter.
- **Tekster:** al ordlyd ligger i én tekstfil med en dansk og en engelsk udgave af samme type (se Sprog og hjælp).
- **Rækkefølge ved ændringer:** udseende på tegnefladen, adfærd i specen, tal i accepttestene, og først derefter koden.

## Leverancetrin, accepttest og åbne punkter

Pointregnskabet bygges i fem trin. Hvert trin leveres på begge sprog og med ⓘ ved sine elementer.

1. **Model og løser:** regnskab, løser med tilladte point som mængder, pas-regler og tests.
2. **Generator** med meldeforløb, kvalitetskrav og seeds.
3. **Øvelse 1–4** med session, scoring og Leitner-bunken.
4. **Kipningsretning og løbende tælling** med skjult regnskabspanel og tilpasset visningstid.
5. **Fuldt regnskab** med længder fra 13-sudokuens generator, og afsnittet i den samlede vejledning.

Accepttest i Vitest:

- [ ] Alle eksisterende tests består uændret. Systemfilen, meldegiveren, 13-sudokuens generator og de andre spors nøgler i localStorage er uændrede.
- [ ] Modpartens point = 40 − (Nords hp + Syds hp) for 10.000 tilfældige fordelinger.
- [ ] Vest åbnede 1NT (15–17) og har vist 10, Øst passede (0–5) og har vist 0, og de usete honnører er ♣D og ♦E: begge sidder sikkert hos Vest.
- [ ] Samme situation, men Vest åbnede 1♥ (12–21): både ♣D og ♦E giver "kan ikke afgøres".
- [ ] To intervaller: Øst har meldt Michaels (8–15 eller 17+) og har vist 15. Med ♦B som eneste usete honnør kan Øst ikke have den (16 er ikke tilladt), så den sidder sikkert hos Vest, når Vests interval tillader det.
- [ ] Ingen af 100.000 tilfældige hænder med 12 hp eller mere passer i åbningsposition efter `chooseCall('opening', …)`.
- [ ] Meldeforløbet: hvert vist pas passer med sin regel (pas i åbningsposition højst 11 hp, svarerens pas i pas-reglens interval), og Nord–Syds meldinger indgår ikke i regnskabet.
- [ ] Har Nord eller Syd meldt ind eller doblet efter Øst–Vests åbning, giver svarerens pas tilladte point \[0, M\].
- [ ] Fuldt regnskab: en modspiller med 1 kort i en farve kan ikke få to honnører i den.
- [ ] Generatoren: 20–30 % af 1.000 opgaver har facit "kan ikke afgøres", ingen opgave kan aflæses direkte, og samme seed giver samme opgave.
- [ ] Regnskabspanelets "Rest" er altid de tilladte point minus det viste, aldrig løserens slutning.
- [ ] Løbende tælling: ét af to tal rigtigt giver halvt. Visningstiden bliver 10 % kortere efter rigtigt og 15 % længere efter forkert, inden for 800–4.000 ms pr. kort.
- [ ] Facit: hvert svar har en sætning fra en af skabelonerne, og sætningen bruger kun løserens facit.
- [ ] Sprog: på engelsk står der intet dansk på Pointregnskabets skærme, heller ikke i ⓘ-forklaringerne, facit eller meldingerne (test som `src/app/i18n.test.tsx`), og den danske og den engelske tekstfil har samme type.
- [ ] ⓘ: hvert element fra Sprog og hjælp har et ⓘ med en forklaring på begge sprog.
- [ ] Komponentfilerne indeholder ingen farveværdier og ingen tal med enhed, undtagen 0, 1px-streger og procenter.

Åbne punkter (Frank afgør; bygges som beskrevet indtil da):

- **Fælles menu:** forsiden grupperes i en særskilt navigationsopgave (SPEC-navigation.md), før næste spor bygges. Pointregnskabet får indtil da sit eget menupunkt som beskrevet.
- **Flere pas-regler:** kan tilføjes senere i `pas-regler.json`, fx åbners pas på svarerens melding.
- **Version 2:** rigtigt spilforløb og sandsynlighed i de uafgjorte tilfælde.

Afklaret (5. oktober 2026, efter Claude Codes gennemgang af version 1):

1. **Sprog og hjælp:** sporet er tosproget og har ⓘ ved elementerne og et afsnit i den samlede vejledning (Sprog og hjælp).
2. **To intervaller:** modspillernes tilladte point er en mængde, ikke ét interval, fordi Michaels og usædvanlig 2NT viser 8–15 eller 17+ (Model punkt 2, Layout).
3. **Meldeforløbet:** `simulateAuction` melder kun den første åbning og én indmelding. Pointregnskabet bygger selv Øst–Vests meldinger med `chooseCall` og pas-reglerne uden at ændre `auction.ts` (Generator punkt 3).
4. **Giver og rækkefølge:** giveren er tilfældig; pladserne melder i rækkefølge, og Nord–Syd kan åbne før Øst–Vest. Kun kontrakten vises for Nord–Syd (Generator punkt 2 og 3).
5. **Visningstiden i løbende tælling:** samme regel som Lynaflæsning, 2.000 ms pr. kort fra start (Session).
6. **Facit-sætningen:** faste skabeloner for hver slags facit på begge sprog (Layout, Facit).
7. **Specens egne åbne punkter:** MODEL.md og konventionstræneren ligger uden for repoet og bruges ikke.

Afklaret (5. oktober 2026, Franks afgørelser):

8. **Pas-regler:** 0–5 efter en åbning i 1 farve og 0–7 efter 1NT er bekræftet. De gælder kun, når Nord–Syd har passet imellem (Meldeinformation, Generator punkt 3).
9. **Intervalkort:** kun meldingernes hp-intervaller trænes her; konventionerne bliver i konventionstræneren.
10. **Fælles menu:** besluttes i en særskilt navigationsopgave (SPEC-navigation.md), før næste spor bygges. Pointregnskabet bygges med sit eget menupunkt, som navigationsopgaven derefter placerer i gruppen Optælling.
