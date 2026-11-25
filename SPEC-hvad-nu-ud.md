# SPEC-hvad-nu-ud

25. november 2026 · Franks valg. Bygges på grenen `hvad-nu-ud`; `main` før er tagget `v48-foer-hvad-nu-ud`.

## Baggrund

Opgaverne i Farvebehandling starter med en uåbnet farve. Opgavetypen Hvad nu? (nr. 5 i SPEC-farvebehandling.md) starter efter første runde, og motoren kunne trække den både i Træning og i Selvvalgt. Det så ud som en frisk farve med kort, der var væk: i facit stod Syds K10 5 4 som 10 5 4, og kompassets "… mangler" talte de spillede kort med ("E K D 9 8 7 6 3 mangler" med 4 kort ude). Frank valgte 25. november 2026, at Hvad nu? tages ud af både Træning og Selvvalgt.

## Ændringen

1. **Motoren vælger aldrig Hvad nu?** `'hvad-nu'` fjernes fra `WEIGHT` i `training/session.ts`, så `chooseType` aldrig giver typen, hverken i Træning (`taskFor`) eller i Selvvalgt (`ui/Selvvalgt.tsx`). Det er samme mekanisme som Splitprocenter.
2. **Koden bliver.** `possibleTypes`, `makeTask`, `grade`, Opgave- og Facit-visningen for `hvad-nu`, `hvad-nu.json` og typen i `storage.ts` er uændrede, så gemte svar og Statistikken med gamle Hvad nu?-svar kan læses som før.
3. **Teksterne:** vejledningens liste over opgavetyper (`GuideScreen.tsx`) har ikke Hvad nu? / What now?. Analysens vejledning (`guide-analyse.md` og `.en.md`) har ikke afsnittet 2.6 Hvad nu?; 2.7 og 2.8 bliver 2.6 og 2.7, og sætningen om begrænset valg siger, at Farvebehandlings opgaver starter med en uåbnet farve. SPEC-farvebehandling.md markerer type 5 som taget ud.

## Afgrænsning

| Sted | Må ske | Må ikke ske |
| --- | --- | --- |
| `chooseType` | Hvad nu? vælges aldrig | de andre typers vægte ændres |
| Gemte data og Statistik | intet | gamle `hvad-nu`-svar forsvinder eller kan ikke læses |
| Analyse og Spil den selv | intet | noget ændres |
| Vejledningerne | Hvad nu? fjernes fra listen og afsnittet | andre afsnit ændres |

## Accepttest

- [x] **Træning og Selvvalgt:** for alle bankens kombinationer og mål, hvor `possibleTypes` giver `hvad-nu`, og 50 seeds giver `chooseType` aldrig `hvad-nu`, med og uden historik.
- [x] **Begge veje går gennem `chooseType`:** Træningens repetition og niveau (`taskFor` uden `only`) og Selvvalgt kalder `chooseType`; lynrunden har kun Linje mod linje.
- [x] **Gamle svar:** et gemt Selvvalgt-svar med `task: 'hvad-nu'` læses og tæller i statistikken pr. opgavetype som før.
- [x] **Vejledningerne:** listen over opgavetyper i `GuideScreen.tsx` nævner hverken "Hvad nu?" eller "What now?", og `guide-analyse.md` / `.en.md` har ingen overskrift "Hvad nu?" / "What now?".
- [ ] `npm test` er grøn. (Session 1, 25. nov.: `tsc` og 1.000+ tests i `src/farvebehandling/training`, `ui`, `model`, `play`, rodens tests, `src/app`, `src/sprog`, `src/modes`, `src/haandevaluering`, `src/pointregnskab`, `src/domain`, `src/engine`, `src/memory`, `src/system` og det meste af `src/modspil` er grønne. `src/farvebehandling/solver` og `src/modspil/*.test.ts` løb over 3 minutters grænsen i Cowork og køres af Frank med `npm test`; de bruger ikke de ændrede filer.)

## Afklaret

- **Træning med** (Franks svar 25. november 2026): Hvad nu? tages ud af både Træning og Selvvalgt.
- **"… mangler" i Hvad nu?** rettes ikke, fordi typen ikke længere vises. Kommer Hvad nu? tilbage, skal listen kun vise modpartens kort, der stadig er ude.
