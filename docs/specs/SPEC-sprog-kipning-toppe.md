# SPEC-sprog-kipning-toppe

31. oktober 2026 · Franks valg, skrevet ud af Claude Code

Husets ord ændres i alle tre repoer (Franks valg 31. oktober 2026; `../CLAUDE.md`, Husets ord, og tabellen i `docs/specs/SPEC-sprog-og-ordbog.md`):

- **kipning, dobbelt kipning**, altid som navneord. Ikke "kip", "kippe", "kipper", "kippes" eller "kippet", og heller ikke knibning, snit eller dobbeltknibning. Udsagnsordet skrives om, fx "Lille fra bordet mod kongen (kipning)", "Kipningen går mod ♣D" og "Med 8 kort tages kipningen".
- **toppe** farven om at spille på, at en honnør falder. "Fald" bruges ikke som navn på teknikken; "damen falder" er stadig rigtigt.
- **frafald** og "falde fra" bruges kun om hold-up.
- Engelsk er uændret: finesse og play for the drop.
- **Linjeteksterne følger beskrivende form** (Franks valg 31. oktober 2026), så de er i takt med reglen i `../CLAUDE.md`. Trinene i en linje er forklaringer, ikke knapper, og står derfor ikke i bydeform: "Slå esset." bliver "Esset slås.", "ellers lad den løbe" bliver "ellers løber den", "Slå kongen." bliver "Kongen slås.". Trin, der allerede er beskrivende eller uden udsagnsord, er uændrede, fx "Lille fra bordet til esset." og "Lille fra begge hænder.". Det engelske følger samme regel, fx "The ace is cashed." og "otherwise it runs". Opgavenavnet "Vælg linjen" er stadig i bydeform.

Konventionstræneren og forsiden har hver deres spec med samme navn.

## Afgrænsning

`main` er tagget `v29-foer-sprog-kipning-toppe`, og arbejdet sker på grenen `sprog-kipning-toppe`. Der flettes først efter Franks godkendelse.

| Sted | Må ske | Må ikke ske |
| --- | --- | --- |
| `src/farvebehandling/solver/describe.ts` | "(kip)" bliver "(kipning)"; alle skabeloner i bydeform skrives i beskrivende form (fx "Slå …" → "… slås", "lad den løbe" → "løber den") | løserens valg og chancer |
| `src/farvebehandling/techniques.ts`, `content/techniques.json` | teknikken hedder "Toppe eller kipning" (engelsk "Drop or finesse"); huskereglen "Med 8 kort tages kipningen, med 9 toppes farven."; begrundelserne uden kip-udsagnsord og "fald" | teknikkens id `fald-eller-kip`, som brugerens data bruger |
| `src/pointregnskab/ui/texts.ts` | Kipningsretning: "Kipningen går mod ♣D. Hvilken vej?" | øvelsens navn |
| `src/farvebehandling/lineText.ts` | genkender "(kipning)" og de nye beskrivende skabeloner; den engelske tekst følger samme regel ("The ace is cashed.") | linjernes betydning |
| Testen for beskrivende form | dækker også linjeteksterne på dansk og engelsk, så den fejler, hvis et trin begynder med et udsagnsord i bydeform eller indeholder "ellers lad" | undtagelserne for knapper og opgavenavne |
| `../CLAUDE.md`, Beskrivende form | en linje om, at linjeteksterne i farvebehandling også er omfattet | resten |
| Banken (`content/app/side-N.json`, `solutions.json`, `suit-combinations.json`, `hvad-nu.*`, `teknikker.md`, `linjer-side-N.md`) | bygges igen med `LINES_VERSION` 3 | chancerne |
| `src/sprog/fagord.ts` og testene | fagordstesten fejler på kip, kippe, kipper, kippes, kippet og "fald" som navn på teknikken | andre ord |
| `guide-analyse.md`, vejledningen, specerne og `CLAUDE.md` | de samme ord rettes | historikken i `docs/beskrivende-form.md` |

## Accepttest

- [x] E D 6 5 / 4 3 2 viser "Lille fra bordet mod damen (kipning); …".
- [x] E D 6 5 / 4 3 2, 2 stik, Linje B viser "Damen fra hånden; dækker Vest, lægges der lille, ellers løber den." og "Esset slås.".
- [x] Ingen linjetekst i banken begynder med et udsagnsord i bydeform (Slå, Spil, Tag, Lad, Læg …) på dansk eller engelsk, og testen for beskrivende form fejler, hvis en gør.
- [x] Filteret viser "Toppe eller kipning (94)"; på engelsk "Drop or finesse".
- [x] Huskereglen er "Med 8 kort tages kipningen, med 9 toppes farven.", og Kipningsretning spørger "Kipningen går mod ♣D. Hvilken vej?"
- [x] Fagordstesten fejler på kip, kippe, kipper, kippes og kippet og på "Fald eller", "spil på fald" og "fald ="; kipning, kipningen, kipninger, toppe, toppes og falder går igennem.
- [x] Banken er bygget igen med `LINES_VERSION` 3, og chancerne er de samme som før.
- [x] `npm test` er grøn, og `node scripts/sprogtjek.ts` finder ingen ukendte ord.

## Afklaret

1. **Valget** er Franks, 31. oktober 2026.
2. **Teknikkens id** `fald-eller-kip` bliver, fordi brugerens gemte data og filtre bruger det; kun navnet ændres.
3. **Linjeteksterne** følger beskrivende form på dansk og engelsk (Franks valg 31. oktober 2026). De bygges igen i samme omgang som "(kipning)", så banken kun bygges én gang.
4. **Linje B** i appen for E D 6 5 / 4 3 2, 2 stik, er linje C i dataene (appen ordner linjerne); accepttesten finder linjen på dens trin.
5. **Indgangssætningen** er nu "Hånden (Bordet) nås med en sideindgang, og der spilles …" og "…, og esset slås."; engelsk "Hand (Dummy) is reached with a side entry, and low is led …" og "…, and the ace is cashed.". Uden en kontrast står "; den løber" og "; 9'eren lægges" (engelsk "; it runs" og "; the 9 is played"). Vejledningen til Analyse er rettet på begge sprog.
6. **Banken løst én gang** (10 processer, ca. 3 timer) med "(kipning)". Beskrivende form kom til i specen, mens løseren kørte, så teksterne i mellemlageret er skrevet om med samme regler som de nye skabeloner i `describe.ts` (12.629 trin). Det er kontrolleret: 22 cases, der dækker hver regel (970 trin), er løst forfra med de nye skabeloner og er identiske med de omskrevne. Den samlede bank er identisk med den gamle, når de gamle tekster oversættes efter reglerne, så chancerne er uændrede.
7. **Fagordstesten** læser ikke et id med bindestreger som tekst (teknikkens id `fald-eller-kip`).
