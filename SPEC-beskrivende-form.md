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

- [ ] Listen i `docs/beskrivende-form.md` er godkendt af Frank.
- [ ] Alle instruktioner og forklaringer på listen står i beskrivende form på dansk og engelsk med den godkendte ordlyd.
- [ ] Knapper, links og navne på opgaver og øvelser er uændrede.
- [ ] Testen for bydeform fejler, hvis en dansk instruktion begynder med et udsagnsord i bydeform, også efter kolon og semikolon, og består for knapperne og navnene på undtagelseslisten.
- [ ] Ingen ændringer i logik, data eller layout: kun tekststrenge og testene er ændret, og bankens filer er uændrede.
- [ ] `npm test` er grøn, og `node scripts/sprogtjek.ts` finder ingen ukendte ord.
- [ ] Skærmbilleder af tre skærme med ændret tekst ligger i `C:\Users\frank\Kontraktbridge\skaermbilleder\beskrivende-form\`.

## Afklaret

1. **Reglen** og undtagelserne er Franks valg 30. oktober 2026.
2. **Fordelingstræneren først**; konventionstræneren og forsiden tages bagefter som en særskilt opgave.
3. **Åbne spørgsmål til Frank** står i listen under "Til afgørelse": løserens linjer i bankens data, huskereglerne, `docs/MODEL.md`, spørgsmålene i dialoger, to overskrifter og sidefodens sætning.
