# SPEC-sprog-kipning-toppe

31. oktober 2026 · Franks valg, skrevet ud af Claude Code

Husets ord ændres i alle tre repoer (Franks valg 31. oktober 2026; `../CLAUDE.md`, Husets ord, og tabellen i `docs/specs/SPEC-sprog-og-ordbog.md`):

- **kipning, dobbelt kipning**, altid som navneord. Ikke "kip", "kippe", "kipper", "kippes" eller "kippet", og heller ikke knibning, snit eller dobbeltknibning. Udsagnsordet skrives om, fx "Lille fra bordet mod kongen (kipning)", "Kipningen går mod ♣D" og "Med 8 kort tages kipningen".
- **toppe** farven om at spille på, at en honnør falder. "Fald" bruges ikke som navn på teknikken; "damen falder" er stadig rigtigt.
- **frafald** og "falde fra" bruges kun om hold-up.
- Engelsk er uændret: finesse og play for the drop.

Konventionstræneren og forsiden har hver deres spec med samme navn.

## Afgrænsning

`main` er tagget `v29-foer-sprog-kipning-toppe`, og arbejdet sker på grenen `sprog-kipning-toppe`. Der flettes først efter Franks godkendelse.

| Sted | Må ske | Må ikke ske |
| --- | --- | --- |
| `src/farvebehandling/solver/describe.ts` | "(kip)" bliver "(kipning)" | løserens valg og chancer |
| `src/farvebehandling/techniques.ts`, `content/techniques.json` | teknikken hedder "Toppe eller kipning" (engelsk "Drop or finesse"); huskereglen "Med 8 kort tages kipningen, med 9 toppes farven."; begrundelserne uden kip-udsagnsord og "fald" | teknikkens id `fald-eller-kip`, som brugerens data bruger |
| `src/pointregnskab/ui/texts.ts` | Kipningsretning: "Kipningen går mod ♣D. Hvilken vej?" | øvelsens navn |
| `src/farvebehandling/lineText.ts` | genkender "(kipning)" | den engelske tekst |
| Banken (`content/app/side-N.json`, `solutions.json`, `suit-combinations.json`, `hvad-nu.*`, `teknikker.md`, `linjer-side-N.md`) | bygges igen med `LINES_VERSION` 3 | chancerne |
| `src/sprog/fagord.ts` og testene | fagordstesten fejler på kip, kippe, kipper, kippes, kippet og "fald" som navn på teknikken | andre ord |
| `guide-analyse.md`, vejledningen, specerne og `CLAUDE.md` | de samme ord rettes | historikken i `docs/beskrivende-form.md` |

## Accepttest

- [ ] E D 6 5 / 4 3 2 viser "Lille fra bordet mod damen (kipning); …".
- [ ] Filteret viser "Toppe eller kipning (94)"; på engelsk "Drop or finesse".
- [ ] Huskereglen er "Med 8 kort tages kipningen, med 9 toppes farven.", og Kipningsretning spørger "Kipningen går mod ♣D. Hvilken vej?"
- [ ] Fagordstesten fejler på kip, kippe, kipper, kippes og kippet og på "Fald eller", "spil på fald" og "fald ="; kipning, kipningen, kipninger, toppe, toppes og falder går igennem.
- [ ] Banken er bygget igen med `LINES_VERSION` 3, og chancerne er de samme som før.
- [ ] `npm test` er grøn, og `node scripts/sprogtjek.ts` finder ingen ukendte ord.

## Afklaret

1. **Valget** er Franks, 31. oktober 2026.
2. **Teknikkens id** `fald-eller-kip` bliver, fordi brugerens gemte data og filtre bruger det; kun navnet ændres.
