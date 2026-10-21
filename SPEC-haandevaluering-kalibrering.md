# SPEC-haandevaluering-kalibrering

21. oktober 2026 · Frank

SPEC-haandevaluering.md har fire åbne punkter, som ventede på tal fra Franks simuleringer (datasættet `fit_deals.csv` bag MODEL.md). Tallene er nu regnet. To punkter bekræfter det, appen gør i dag. To ændrer appen: HCP-grænsen i opgave 8 og kontroltjekket ved lilleslem. IMP-grænserne i opgave 9 forbliver åbne, fordi tallene afslørede en forskel mellem MODEL.md og simuleringernes P (se Åbne punkter).

## Resultaterne

| Punkt | Franks tal | Beslutning |
| --- | --- | --- |
| HCP-grænse i opgave 8 | 82,5 % rigtige udgangsbeslutninger ved 23 HCP; 25 HCP giver 79,3 % | **Rettes til 23 HCP** |
| Kortfarvepoint i trumffarven | "Kun sidefarver" er bedst på alle fordelinger og især ved højst 2 trumf: R² 0,754 mod 0,727 og 86,4 % mod 85,1 % rigtige beslutninger | Bekræftet, ingen ændring |
| Lilleslem | 12 stik i 87,8 % uden manglende es, 67,7 % med ét manglende es og 29,1 % med to. Med ét manglende es og uden trumfkongen kun 30,6 % (36 fordelinger) | **Nøglekort** (Franks valg 21. oktober 2026): højst ét manglende af de fem nøglekort, de fire es og trumfkongen |
| Storeslem | Alle fire es: 13 stik i 73,8 % med trumfkongen og 38,9 % uden (P ≥ 38); 53,5 % og 22,7 % ved P ≥ 35 | Bekræftet: alle fem nøglekort. Ved P ≥ 41 har kun én fordeling alle es uden trumfkongen, så testen er lavet ved lavere P |
| IMP-grænser i opgave 9 | Med simuleringernes P nås 37 %, 45 % og 50 % ved 27½, 28 og 28½. Med appens P giver de samme grænser 35,2 %, 33,3 % og 41,4 % | **Åbent** (se Åbne punkter) |

## Afgrænsning

Før arbejdet starter:

1. Commit og tag den nuværende app, fx `v15-foer-kalibrering`.
2. Arbejd på grenen `haandevaluering-kalibrering`, og flet først ind efter godkendelse.
3. Kør alle eksisterende tests før og efter. Tests, der låser 25 HCP eller es-reglen, rettes og nævnes under Afklaret.

| Sted | Må ske | Må ikke ske |
| --- | --- | --- |
| `src/haandevaluering/content/p-model.json` | `hcpMetode.udgang` = 23 med ny `afsnit`-tekst; `kontroller` får nøglekortreglen (fx `slemHoejstManglendeNoeglekort: 1`, `storeslemKraeverTrumfkongen: true`) | ændre de øvrige konstanter, også `turnering` og `trumflaengde` |
| `model/pmodel.ts` | `slamAllowed` tæller nøglekort (fire es og trumfkongen); `grandAllowed` er uændret i virkning | ændre P, grænserne eller tabellen |
| `model/generator.ts` | opgave 8 bruger 23 HCP via `hcpMetode.udgang`; opgaver med slem vælges efter den nye regel | ændre de andre opgavers krav |
| `ui/Facit.tsx`, `ui/texts.ts` | forklaringen ved slem taler om nøglekort, fx "Parret mangler 2 nøglekort (♠K og et es), så lilleslem er for meget." på dansk og engelsk | ændre facit i øvrigt |
| `scripts/p-model-facit.ts`, `content/p-model.facit.json` | køres igen; nye eksempler for nøglekort | rettes i hånden |
| `docs/MODEL.md` | afsnit 1: tallene for HCP-grænsen og kontroltjekket fra tabellen ovenfor (Frank har godkendt dem) | ændre modellen eller de øvrige tal |
| `SPEC-haandevaluering.md` | de fire åbne punkter: tre lukkes med henvisning hertil, IMP-grænserne står fortsat åbne med forskellen beskrevet | — |
| Den samlede vejledning (`GuideScreen.tsx`) | sætningen om kontroltjek ved slem, hvis den nævner es-reglen | — |
| `CLAUDE.md` | Håndevaluerings status og beslutninger; linjen under "Næste opgaver", der stadig siger, at leverancetrin 4 mangler, rettes | — |
| Lagring, tokens, andre spor | intet | alt |

Kræver noget alligevel en ændring ud over tabellen, skal Claude Code stoppe og spørge.

Konventionstræneren kopierer `p-model.json` og `p-model.facit.json` og kører samme facittest (CLAUDE.md, Håndevaluering). Claude Code skriver i Afklaret, hvilke filer Frank skal kopiere derover bagefter.

Besked til Claude Code:

> Læs CLAUDE.md, SPEC-haandevaluering.md, docs/MODEL.md og SPEC-haandevaluering-kalibrering.md. Byg specen på grenen `haandevaluering-kalibrering`, skriv accepttestene først, og stop, når testene er grønne, så jeg kan godkende. Ret kun HCP-grænsen og kontroltjekket ved slem; IMP-grænserne og P-modellen ændres ikke.

## Nøglekortreglen

- **Nøglekort** er de fire es og kongen i trumffarven.
- **Lilleslem** kræver, at parret højst mangler ét nøglekort.
- **Storeslem** kræver alle fem nøglekort (som i dag: alle es og trumfkongen).
- Kontroltjekket gælder kun farvekontrakter med fit. P-grænserne 35 og 41 er uændrede.

## Accepttest

- [ ] Alle eksisterende tests består; tests, der låste 25 HCP eller es-reglen, er rettet og nævnt under Afklaret.
- [ ] `P_MODEL.hcpMetode.udgang` er 23, og opgave 8 regner HCP-metodens beslutning med den: 23 HCP er udgang, 22 HCP er delkontrakt.
- [ ] Opgave 8 har stadig kun fordelinger, hvor HCP og Zar er uenige, og HCP og Zar har ret lige ofte i generatoren.
- [ ] Opgave 8's eksempel "HCP har ret" i specen (E 8 6 · K D 8 · 8 2 · D 10 4 3 2 / D B 5 · E 7 6 4 2 · K 7 6 4 · B, 22 HCP, 52 ZP, P 27¼) er stadig en opgave med HCP som rigtigt svar. Eksemplet "Zar har ret" (23 HCP) er ikke længere en opgave, fordi HCP nu siger udgang; testen skriver det.
- [ ] `slamAllowed`: alle es og trumfkongen → ja; ét es mangler, trumfkongen er der → ja; alle es, trumfkongen mangler → ja; ét es og trumfkongen mangler → nej; to es mangler → nej.
- [ ] `grandAllowed`: alle es og trumfkongen → ja; ét nøglekort mangler → nej.
- [ ] Med P = 36, ét manglende es og uden trumfkongen er den rigtige beslutning udgang, og facit nævner de to manglende nøglekort.
- [ ] `p-model.facit.json` er regnet igen af scriptet og har et eksempel med ét manglende es uden trumfkongen.
- [ ] Alle nye tekster findes på dansk og engelsk, og de engelske skærme indeholder ingen dansk tekst.

## Afklaret

1. **HCP-grænsen** er 23 HCP, fordi den giver de 82,5 %, MODEL.md angiver for ren HCP (Franks kørsel 21. oktober 2026).
2. **Kortfarvepoint tælles kun i sidefarverne**, som i dag (bekræftet af Franks data).
3. **Nøglekort ved slem** er Franks valg 21. oktober 2026: ét manglende es uden trumfkongen gav kun 30,6 %, lige så lidt som to manglende es.

Åbne punkter:

1. **Trumflængden i P (Franks undersøgelse):** appen regner som MODEL.md afsnit 1: "1½ per trumf du selv har ud over 4". Simuleringernes P regner trumflængden anderledes, og med appens P ligger andelen med mindst 10 stik under det, tabellen lover (41,4 % ved 28½ mod 50 %). Det gælder ikke kun IMP-grænserne, men alle grænser og tabellen i appen. Frank finder i simuleringsprojektet, hvilken formel scripts bruger, og om MODEL.md eller scripts er rigtig. Først derefter kan IMP-grænserne og eventuelt trumflængden rettes i en ny spec.
2. **45 % og 50 % ligger på kanten:** en udglattet kurve giver 27,7 og 28,1. Afgøres sammen med punkt 1.
