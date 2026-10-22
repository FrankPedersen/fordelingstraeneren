# SPEC-haandevaluering-kalibrering

21. oktober 2026 · Frank · version 2: trumflængden er med

SPEC-haandevaluering.md har fire åbne punkter, som ventede på tal fra Franks simuleringer (`fit_deals.csv` bag MODEL.md). Tallene er regnet med `bridge-model/scripts/aabne_punkter.py`, og de afslørede en fejl i MODEL.md's tekst om trumflængden. Denne spec retter tre ting i håndevalueringen:

1. **Trumflængden i P** følger scripterne, som tabellen, grænserne og R² er regnet med.
2. **HCP-grænsen i opgave 8** bliver 23 HCP.
3. **Lilleslem** kræver højst ét manglende nøglekort.

Kortfarvepoint, storeslem og IMP-grænserne bekræftes uændret.

## Resultaterne

Datagrundlaget med alle tal, metoden og en henvisning til scriptet står i [docs/resultater-aabne-punkter.md](docs/resultater-aabne-punkter.md).

| Punkt | Franks tal | Beslutning |
| --- | --- | --- |
| Trumflængden | Scripterne regner 1½ × (trumf − 4) pr. hånd, også negativt. MODEL.md's tekst ("1½ per trumf du selv har ud over 4") giver 1½ point mere pr. trumf under 4: +1½ ved 5-3, +3 ved 6-2, +4½ ved 7-1. Med scripternes formel: R² 0,794, middelfejl 0,736 stik, 87,5 % rigtige udgangsbeslutninger. Med tekstens: 0,765, 0,844 stik (lover 0,40 stik for meget) og 85,6 % | **Scripternes formel** (Franks valg 21. oktober 2026), skrevet pr. hånd: "1½ pr. trumf ud over 4, minus 1½ pr. trumf under 4" |
| HCP-grænse i opgave 8 | 82,5 % rigtige udgangsbeslutninger ved 23 HCP; 25 HCP giver 79,3 % | **23 HCP** |
| Kortfarvepoint i trumffarven | "Kun sidefarver" er bedst, især ved højst 2 trumf: R² 0,754 mod 0,727 og 86,4 % mod 85,1 % | Bekræftet, ingen ændring |
| Lilleslem | 12 stik i 87,8 % uden manglende es, 67,7 % med ét og 29,1 % med to. Ét manglende es uden trumfkongen: 30,6 % (36 fordelinger) | **Nøglekort** (Franks valg 21. oktober 2026): højst ét manglende af de fem nøglekort, de fire es og trumfkongen |
| Storeslem | Alle fire es: 13 stik i 73,8 % med trumfkongen og 38,9 % uden (P ≥ 38) | Bekræftet: alle fem nøglekort |
| IMP-grænser i opgave 9 | Med scripternes P nås 37 %, 45 % og 50 % første gang ved 27½ (44,6 %), 28 (47,1 %) og 28½ (61,7 %); lige under ligger 27 på 35,4 % | Bekræftet, ingen ændring. Grænserne gælder P med scripternes formel, som appen får med denne spec |

## Afgrænsning

Før arbejdet starter:

1. Commit og tag den nuværende app, fx `v15-foer-kalibrering`.
2. Arbejd på grenen `haandevaluering-kalibrering`, og flet først ind efter godkendelse.
3. Kør alle eksisterende tests før og efter. Tests, der låser den gamle trumflængde, 25 HCP eller es-reglen, rettes og nævnes under Afklaret.

| Sted | Må ske | Må ikke ske |
| --- | --- | --- |
| `src/haandevaluering/content/p-model.json` | `trumflaengde` med ny `afsnit`-tekst og et felt, der tillader negative point (fx `negativ: true`); `hcpMetode.udgang` = 23; `kontroller` med nøglekortreglen (fx `slemHoejstManglendeNoeglekort: 1`, `storeslemKraeverTrumfkongen: true`) | ændre tabellen, grænserne 28½, 35 og 41, kortfarvepoint, honnørskalaen, Zar eller `turnering` |
| `model/pmodel.ts` | `trumpPoints(t)` = 1½ × (t − 4), også negativt; `slamAllowed` tæller nøglekort; `grandAllowed` er uændret i virkning | ændre honnørpoint, kortfarvepoint, spildte konger eller tabellen |
| `model/generator.ts` | opgaverne regnes med den nye P; opgave 8 bruger 23 HCP; slem vælges efter nøglekortreglen. Kravene til P (fx opgave 4 højst 37, P 24–40) er uændrede | ændre opgavernes krav i øvrigt |
| `training/deck.ts` | Leitner-kortene med nøgletal om trumflængden får den nye regel | nye korttyper |
| `ui/texts.ts`, `ui/Facit.tsx`, `ui/Regnskab*` | reglen på dansk og engelsk (se Ordlyd); et negativt trumfled vises med minus, fx "−1½ trumf"; slem-forklaringen taler om nøglekort | ændre facit i øvrigt |
| `src/app/screens/GuideScreen.tsx` | sætningen om trumflængden og kontroltjekket ved slem | ændre andre afsnit |
| `scripts/p-model-facit.ts`, `content/p-model.facit.json` | køres igen; facitfilen får eksempler med 5-3-, 6-2- og 7-1-fit og med ét manglende es uden trumfkongen | rettes i hånden |
| `docs/MODEL.md` | afsnit 1: trumfleddet får ordlyden nedenfor (Frank har godkendt den); tallene for HCP-grænsen og kontroltjekket tilføjes. Ingen andre tal ændres, fordi de er regnet med scripternes formel | ændre modellen i øvrigt |
| `SPEC-haandevaluering.md` | formlen i afsnit 1 og de fire åbne punkter lukkes med henvisning hertil | — |
| Lagring | ingen nye felter; gemte svar beholder deres point | ændre skemaet |
| Tokens, andre spor | intet | alt |

Kræver noget alligevel en ændring ud over tabellen, skal Claude Code stoppe og spørge.

Konventionstræneren kopierer `p-model.json` og `p-model.facit.json` og kører samme facittest. Claude Code skriver i Afklaret, hvilke filer Frank skal kopiere derover, og om konventionstræneren selv bruger trumflængden i tekster.

Besked til Claude Code:

> Læs CLAUDE.md, SPEC-haandevaluering.md, docs/MODEL.md og SPEC-haandevaluering-kalibrering.md. Byg specen på grenen `haandevaluering-kalibrering`, skriv accepttestene først, og stop, når testene er grønne, så jeg kan godkende. Ret trumflængden, HCP-grænsen og kontroltjekket ved slem; tabellen, grænserne og de andre konstanter ændres ikke.

## Ordlyd

| Sted | Dansk | Engelsk |
| --- | --- | --- |
| MODEL.md afsnit 1 og SPEC-haandevaluering.md | + 1½ pr. trumf du selv har ud over 4, minus 1½ pr. trumf under 4 (for parret det samme som 1½ pr. trumf ud over 8) | — |
| Appens regel | 1½ pr. trumf ud over 4, minus 1½ pr. trumf under 4 | 1½ per trump beyond 4, minus 1½ per trump short of 4 |
| Eksempel i vejledningen | 5-3-fit: den med 5 trumf får +1½, den med 3 trumf −1½, så parret får 0 | 5-3 fit: the hand with 5 trumps gets +1½, the hand with 3 trumps −1½, so the pair gets 0 |

## Nøglekortreglen

- **Nøglekort** er de fire es og kongen i trumffarven.
- **Lilleslem** kræver, at parret højst mangler ét nøglekort.
- **Storeslem** kræver alle fem nøglekort.
- P-grænserne 35 og 41 er uændrede.

## Accepttest

Tallene er regnet med appens model og den nye trumflængde.

- [x] Alle eksisterende tests består; tests, der låste den gamle trumflængde, 25 HCP eller es-reglen, er rettet og nævnt under Afklaret.
- [x] `trumpPoints`: 3 trumf → −1½, 4 → 0, 5 → +1½, 2 → −3, 1 → −4½, 7 → +4½.
- [x] For parret er trumfleddet 1½ × (fittens længde − 8): 5-3 → 0, 4-4 → 0, 6-2 → 0, 5-4 → +1½, 6-3 → +1½.
- [x] ♠ E K 7 5 2 ♥ 4 ♦ K D 6 3 ♣ 8 5 2 over for ♠ D 9 6 3 ♥ K 8 7 2 ♦ 9 4 ♣ E 7 3 med fit i ♠: p = 17 og 10½, P = 27½ (uændret, fordi begge har mindst 4 trumf).
- [x] ♠ E 8 6 ♥ K D 8 ♦ 8 2 ♣ D 10 4 3 2 over for ♠ D B 5 ♥ E 7 6 4 2 ♦ K 7 6 4 ♣ B med fit i ♥: Syds trumfled er −1½ og Nords +1½, P = 25¾ (før 27¼). Opgave 8: HCP 22 → delkontrakt, Zar 52 → udgang, P → delkontrakt, så HCP har ret.
- [x] `P_MODEL.hcpMetode.udgang` er 23: 23 HCP er udgang, 22 HCP er delkontrakt. Opgave 8 har stadig kun fordelinger, hvor HCP og Zar er uenige, og de har ret lige ofte i generatoren.
- [x] `slamAllowed`: alle nøglekort → ja; ét es mangler → ja; trumfkongen mangler → ja; ét es og trumfkongen mangler → nej; to es mangler → nej. `grandAllowed`: alle fem → ja; ét nøglekort mangler → nej.
- [x] Med P = 36, ét manglende es og uden trumfkongen er den rigtige beslutning udgang, og facit nævner de to manglende nøglekort.
- [x] Opgave 9's grænser er stadig 27½, 28 og 28½.
- [x] `p-model.facit.json` er regnet igen af scriptet og har eksempler med 5-3-, 6-2- og 7-1-fit og med ét manglende es uden trumfkongen.
- [x] Facit viser et negativt trumfled med minus, fx for Syd i eksemplet ovenfor: "honnørpoint 11¼, trumf −1½, korthed 1, p = 10¾".
- [x] Alle nye tekster findes på dansk og engelsk, og de engelske skærme indeholder ingen dansk tekst.

## Afklaret

1. **Trumflængden følger scripterne** (Franks valg 21. oktober 2026). Tabellen, grænserne 28½, 35 og 41, R² 0,794 og de 87,5 % er regnet med den formel, så de passer igen, når appen bruger den. MODEL.md's tidligere tekst gav i gennemsnit 1,1 point for meget.
2. **Reglen skrives pr. hånd** (Franks valg 21. oktober 2026), så hver spiller regner sin egen p. En hånd med færre end 4 trumf får minus.
3. **HCP-grænsen** er 23 HCP, fordi den giver de 82,5 %, MODEL.md angiver for ren HCP.
4. **Kortfarvepoint tælles kun i sidefarverne**, som i dag.
5. **Nøglekort ved slem** (Franks valg 21. oktober 2026): ét manglende es uden trumfkongen gav kun 30,6 %, lige så lidt som to manglende es.
6. **IMP-grænserne** 27½, 28 og 28½ er bekræftet med scripternes P. En udglattet kurve giver 27,7 og 28,1 for 45 % og 50 %; de afrundes til de samme halve point.

Claude Codes valg under bygningen (22. oktober 2026, grenen `haandevaluering-kalibrering`; appen før er tagget `v15-foer-kalibrering`):

7. **Trumflængden:** `trumflaengde` har feltet `negativ: true`, og `trumpPoints` regner 1½ × (trumf − 4) uden at runde op til 0, når feltet er sat. `over` og `point` er uændrede.
8. **Nøglekort:** `missingKeyCards` i `pmodel.ts` tæller de manglende es og trumfkongen, og `slamAllowed` tillader højst `slemHoejstManglendeNoeglekort` (1). Nøglen `slemHoejstManglendeEs` er erstattet, ikke beholdt ved siden af, så filen kun har én regel (godkendt af Frank 22. oktober 2026). `grandAllowed` er uændret.
9. **Facit ved slem:** "Parret mangler 2 nøglekort (♠K og et es), så lilleslem er for meget." eller "… (to es) …"; på engelsk "The pair is missing 2 key cards (♠K and an ace), so small slam is too much." Sætningen vises som før, når P er mindst 34½, og parret mangler mere end ét nøglekort. `controlsNote` i `texts.ts` er erstattet af `keyCardsNote`.
10. **Et negativt trumfled** bruger facits og regnskabets eksisterende form med minus: "trumflængde −1½ (3 trumf)" i facit og "−1½" i regnskabet. Specens "trumf −1½, korthed 1" er et eksempel.
11. **Tekster:** ⓘ-teksterne til Fordelingsled og Regnskab har den nye regel, Niveaubeslutningen nøglekortene og Sammenlign metoder 23 HCP. I vejledningen har punktet om fitten reglen og eksemplet med 5-3-fit, og punktet om P har nøglekortene.
12. **`training/deck.ts` er uændret:** bunken har intet kort om trumflængden, og specen tillader ingen nye korttyper. Der kommer intet kort om trumflængden (Frank, 22. oktober 2026).
13. **Generatoren:** kun kommentaren til opgave 8 er rettet. Opgaverne regnes med den nye P gennem `pOf`, opgave 8 læser 23 fra `hcpMetode.udgang`, og facit vælger slem efter nøglekortreglen. Ingen opgave udvælges efter es.
14. **Facitfilen:** nye eksempler `tre-trumf` (hånd), `fit-5-3`, `fit-6-2`, `fit-7-1` og `noeglekort-es-og-trumfkonge` (par); `slem-uden-kontroller` henviser nu hertil. Den første fordeling fra kortgiveren for hver kontrakt er fundet igen med den nye P.
15. **Rettede tests:**
    - `model/model.test.ts`: "kortfarvepoint tælles ikke i trumffarven" forventede trumflængde 0 for 2 og 1 trumf, nu −3 og −4½. "kontroltjekket" forventede lilleslem med 3 es uden trumfkongen, nu udgang, og en linje med 3 es og trumfkongen (lilleslem) er tilføjet.
    - `model/trin4.test.ts`: HCP-grænsen 25 er nu 23.
    - `ui/trin4.test.tsx`: "(grænse 25)" og "(limit 25)" er nu 23 i eksempel 2, som stadig er en opgave (26 HCP siger udgang, Zar og P delkontrakt).
    - `training/training.test.ts`: hjælpelinjen for nabovalg ved lilleslem talte es (mindst 3), nu nøglekort (højst ét manglende). Testen bestod også før, men udtrykte es-reglen.
16. **Konventionstræneren** (`Downloads/Konventionstræner`) har endnu ingen kopi af `p-model.json` og `p-model.facit.json`. Når den tager P-modellen i brug, kopierer den begge filer fra `src/haandevaluering/content/` og følger de nye regler: trumflængden med `negativ` og nøglekortene med `slemHoejstManglendeNoeglekort`. Dens facittest kræver dem. Dens egne tekster med støttepoint ("1 pr. trumf ud over fem", fx `dealer/ff_trial.py`, `dealer/omvendt_bergen.py` og `viden/2-over-1.html`) ændres ikke (Frank, 22. oktober 2026).
17. **Lagring:** skemaet er uændret. Gamle seeds må gerne give en anden fordeling, så længe det gemte svar og dets point er uændrede (Frank, 22. oktober 2026). Generatoren vælger fordelinger med den nye P, så et seed i svarloggen kan give en anden fordeling end dengang; svaret og dets point står, som de blev gemt.
18. **SPEC-haandevaluering.md:** ud over formlen og de åbne punkter er fem steder rettet med henvisning hertil (fagligt valg 5, opgave 8, Afklaret 13 og Claude Codes valg 3 og 21), så specen ikke siger to forskellige ting (godkendt af Frank 22. oktober 2026).

Åbne punkter: ingen.
