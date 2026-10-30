# SPEC-beskrivende-form

30. oktober 2026 · Franks regel, skrevet ud af Claude Code

Ny regel for husets sprog (Franks valg 30. oktober 2026): instruktioner og forklaringer skrives i beskrivende form, ikke i bydeform. "Spil ud fra bordet eller hånden." bliver fx "Udspillet kan komme fra bordet eller hånden.", og "Læg din og makkers p sammen til P." bliver fx "Parrets P er din og makkers p lagt sammen." Engelsk følger samme regel for instruktioner og forklaringer.

Undtagelser, der bliver i bydeform på begge sprog:

- knapper og links ("Start dagens session", "Luk", "Skriv til mig", "Prøv igen senere");
- navnene på opgaver og øvelser ("Spil den selv", "Find hullet", "Vælg linjen", "Gæt chancen").

Reglen står i den fælles `../CLAUDE.md` under Husets ord. Denne spec gælder Fordelingstræneren; konventionstræneren og forsiden tages bagefter som en særskilt opgave med samme regel.

## Afgrænsning

Før arbejdet starter: `main` er tagget `v27-foer-beskrivende-form`, og arbejdet sker på grenen `beskrivende-form`. Der flettes først efter Franks godkendelse.

Kun ordlyd i dansk og engelsk tekst. Ingen ændringer i logik, data eller layout.

| Sted | Må ske | Må ikke ske |
| --- | --- | --- |
| Tekstfilerne (`src/*/ui/texts.ts`), `tx(…)` i komponenterne, `src/app/tracks.ts` og `src/farvebehandling/content/guide-analyse.md` / `.en.md` | ordlyden i de instruktioner og forklaringer, Frank har godkendt i listen | knapper, links og navne på opgaver og øvelser; nøgler, funktioner og struktur |
| `src/sprog/` | testen for bydeform og listen over undtagelser | fagordstesten |
| Eksisterende tests | den forventede tekst, hvor en test søger efter en tekst, der er skrevet om | testens hensigt |
| Bankens data (`content/app/side-N.json`, `solutions.json`) og `describe.ts` | intet | løserens linjer ("Slå esset.") |
| `content/techniques.json` (huskeregler) og `docs/MODEL.md` | kun det, Frank godkender i listen | resten |

Kræver noget alligevel en ændring ud over tabellen, skal Claude Code stoppe og spørge.

## Arbejdsgang

1. Alle danske tekster i bydeform findes med `src/sprog/danskTekst.ts` og deles i tre: knapper og links (bliver), navne på opgaver og øvelser (bliver) og instruktioner og forklaringer (skrives om). Listen med forslag til ny ordlyd, dansk og engelsk, står i `docs/beskrivende-form.md`. Intet rettes, før Frank har godkendt listen.
2. Efter godkendelsen rettes teksterne.
3. En test i `src/sprog/` ligesom fagordstesten fejler, hvis en dansk instruktion begynder med et udsagnsord i bydeform. Knapperne og navnene står på en liste over undtagelser i `src/sprog/`.
4. `npm test` og sprogtjekket køres, og Frank ser skærmbilleder af tre skærme med ændret tekst. Claude Code stopper før fletning.

## Accepttest

- [x] Listen i `docs/beskrivende-form.md` er godkendt af Frank.
- [x] Alle instruktioner og forklaringer på listen står i beskrivende form på dansk og engelsk med den godkendte ordlyd.
- [x] Knapper, links og navne på opgaver og øvelser er uændrede.
- [x] Testen for bydeform fejler, hvis en dansk instruktion begynder med et udsagnsord i bydeform, også efter kolon og semikolon, og består for knapperne og navnene på undtagelseslisten.
- [x] Ingen ændringer i logik, data eller layout: kun tekststrenge og testene er ændret, og bankens filer er uændrede.
- [x] `npm test` er grøn, og `node scripts/sprogtjek.ts` finder ingen ukendte ord.
- [x] Skærmbilleder af tre skærme med ændret tekst ligger i `C:\Users\frank\Kontraktbridge\skaermbilleder\beskrivende-form\`.

## Afklaret

1. **Reglen** og undtagelserne er Franks valg 30. oktober 2026.
2. **Fordelingstræneren først**; konventionstræneren og forsiden tages bagefter som en særskilt opgave.
3. **Listen er godkendt** (Frank, 30. oktober 2026) med rettelser til F3, B4, B5 og B6; de står i `docs/beskrivende-form.md` under Godkendelse.
4. **"Du" som grundled** er beskrivende form (Franks valg 30. oktober 2026): mange passive -es-former i træk undgås, og hvor tre eller flere stod tæt, er "du" brugt, fx "Du taster svaret med ½ og ¼."
5. **A1:** løserens linjer i bankens data ("Slå esset.") og deres skabeloner i `describe.ts` bliver, og testen springer dem over. **A2–A4:** huskereglerne, de to sætninger i `docs/MODEL.md` og spørgsmålene i dialoger er skrevet om som foreslået. **A5:** "Første skridt" og "Mønstrets billede" / "The pattern's image". **A6:** sidefodens "Skriv til mig." venter, til sidefødderne ændres samlet med forsiden og konventionstræneren, og står på undtagelseslisten.
6. **Testen** `src/sprog/bydeform.test.ts` læser al dansk tekst med `danskTekst.ts` og fejler, hvis en sætning eller et led efter kolon eller semikolon begynder med et udsagnsord i bydeform. Bydeformerne, undtagelserne og de falske træf står i `src/sprog/bydeform.ts`. Enkeltord med små bogstaver er kode (fx `'hold'`, `'vælg-linjen'`) og tæller ikke; sætninger deles ikke efter forkortelser som "pr." og "fx."; "pas" (meldingen) og "lav" (tillægsordet) er ikke på listen over bydeformer.
7. **Åbent:** `docs/MODEL.md` har en tredje sætning i bydeform, "**Brug ikke farveskalaen i sans.** Den er materialets dårligste dér.", som ikke stod på listen. Den står på undtagelseslisten, til Frank har svaret på forslaget "**Farveskalaen bruges ikke i sans.**".
