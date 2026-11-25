# SPEC-modspil-kompas: bordet med rigtige verdenshjørner i Modspil

Grenen `modspil-kompas`; `main` før ændringen tagges `v49-foer-modspil-kompas`. Mock-up'en ligger i `docs/specs/design/modspil-kompas/` (`kompas-390.html` og `kompas-390.png`).

## Baggrund

I Modspil (øvelse 1–7) står brugerens hånd under det grønne felt, dér hvor Syd sidder, med overskriften "Øst · dig" eller "Vest · dig". Feltet viser V til venstre, Ø til højre og "S · spilfører" forneden, så hånden og kompasset siger to forskellige ting (Franks skærmbillede 25. november 2026: 2♥–4♥, udspil ♣4, Øst med ♠D983 ♥3 ♦109742 ♣962). Mock-up'erne i `docs/specs/design/modspil/` har samme fejl.

Appens eget princip står i `Bridgebord` (Farvebehandling): Nord (bordet) øverst, Syd forneden og Vest og Øst ved siderne af kompasset.

## Franks valg (25. november 2026)

1. Bordet står som et klassisk diagram: Nord over feltet, brugerens hånd ved sin egen side (Øst til højre for feltet, Vest til venstre) og Syd forneden i feltet. Bordet drejes ikke.
2. Kortknapperne i Vælg kortet og vælg-varianten af øvelse 6 og 7 står i spørgsmålets kort som de andre svarknapper. Hånden ved feltet er kun til at se på.
3. "hp" står med små bogstaver i etiketterne (i dag "14 HP" på grund af versalerne i `.eyebrow`), i v1 og i øvelse 8.
4. Ved "table feeling" viser facit-tabellen i Find udspillet begge kort med stik og pris.

## Afgrænsning

Ændres:

- `src/modspil/ui/Opgave.tsx` og `src/modspil/ui/modspil.css`: bordet, hænderne, kortknapperne og hp.
- `src/modspil/ui/FindUdspil.tsx` og `src/modspil/model/udspilPris.ts`: hp i etiketten og rækkerne ved "table feeling".
- Testene i `src/modspil/ui/` og `src/modspil/udspil-skaerme/`, der beskriver den gamle placering (`skaerme.test.tsx` punkt 4 og 6, `pris.test.tsx`), og Modspil-delen af `scripts/tjek-bred-layout.mjs`.
- SPEC-modspil.md og SPEC-modspil-v2.md i `docs/specs/` får en note om ændringen; `CLAUDE.md` og `../SYSTEM.md` får linjen om grenen.

Ændres ikke: modellen, generatoren, facit, lagringen `modspil:v1`, øvelse 8's spørgsmål og alt uden for `src/modspil/`.

## Layoutet

**Bordet** (`.ms-bord`) er et gitter med tre felter:

- Nord over feltet: overskriften "Nord · bordet" (med hp i øvelse 1–3) og hånden med én farve pr. linje, venstrestillet og centreret over feltet.
- Feltet (`.ms-stik`) som i dag: N, V, Ø og "S · spilfører" og stikkets kort ved deres plads.
- Brugerens hånd ved sin side af feltet: til højre for Øst, til venstre for Vest. Overskriften "Øst · dig" / "Vest · dig" (med hp i øvelse 1–3) og én farve pr. linje. Hånden har `data-plads="E"` eller `data-plads="W"`.

Rækkefølgen i HTML er stadig Nord, stikket og brugerens hånd, så skærmlæsere og tab følger diagrammet; kun CSS sætter Vests hånd til venstre. Tidligere stik (Første afkast og Forsinket kald) står under bordet over hele bredden.

Ved 320 px og op er der ingen vandret scroll, og feltet er mindst 180 px bredt. Fra 1000 px står bordet i venstre spalte som i dag.

**Kortknapperne:** I Vælg kortet og vælg-varianten står kortknapperne i spørgsmålets kort under spørgsmålet (og under "Aftalen" i Vælg kortet) i en gruppe med navnet "Svar". Hånden ved feltet viser alle brugerens kort, der ikke er spillet; farven med de kort, der kan spilles, står i sort, og resten er gråtonet som i dag. I facit får det rigtige kort grøn kant, og det valgte er trykket, som i dag.

**hp:** Tallet og "hp" står i et `<span class="ms-hp">` uden versaler (`text-transform: none`), i v1's to hænder og i øvelse 8's "Vest · dig · 12 hp". Engelsk "HCP" er uændret.

**Table feeling:** Fra niveau 3 får en farve, hvor profilen giver to kort ("table feeling"), en række for hvert kort. Kortet, der giver farvens værdi, står først med farvens tal og mærker som i dag. Det andet kort står lige under med sine egne stik, sit eget antal sætninger og sin pris (det bedste svars middelstik minus kortets) og mærket "table feeling". Er farven rigtig, er begge kort stadig rigtige svar (modellen er uændret), og prisen i "Dit svar" er stadig ingen ved et rigtigt svar; rækken viser kun, hvad kortet koster efter dobbeltdummy. Er det valgte kort det andet kort, står "dit svar" på dets række i stedet for efter kortet i farvens række.

## Accepttest

1. **Kompasset (Vitest, `src/modspil/ui/kompas.test.tsx`):** for alle eksempler i `eksempler()` har brugerens hånd `data-plads` lig opgavens plads, overskriften "<Plads> · dig", og hver farve står i sit eget element (`.ms-farvelinje`) i både Nords og brugerens hånd. Ingen kortknap står i `.ms-bord`.
2. **Kortknapperne (Vitest, samme fil):** i opgaver, hvor brugeren vælger et kort, står kortknapperne i gruppen "Svar" efter `<h1>`, og brugerens hånd ved feltet viser alle kort, der ikke er spillet, som tekst. Et klik svarer med kortet; i facit har det rigtige kort klassen `ms-rigtig`.
3. **hp (Vitest):** i øvelse 1–3 og øvelse 8 står "<n> hp" i et element med klassen `ms-hp`, og `modspil.css` giver `.ms-hp` `text-transform: none`.
4. **Table feeling (Vitest, `src/modspil/udspil-skaerme/table-feeling.test.tsx`):** S1 opgave 55 med Standard på niveau 3 (♥E 3,35 og ♥3 2,52) viser rækkerne ♥E og ♥3 med hver sine stik, og ♥3's række har mærket "table feeling" og prisen 0,8. `udspilPris` giver en række pr. kort i farver med to kort fra niveau 3 og ellers samme rækker som før.
5. **Geometrien (Chrome, `node scripts/tjek-bred-layout.mjs --modspil`):** ved 320, 390, 1000 og 1280 px i lys og mørk tilstand står Nords hånd over feltet, Østs hånd til højre for feltet og Vests til venstre (hændernes kasser overlapper ikke feltet og ligger lodret ud for det), feltet er mindst 180 px bredt, og der er ingen vandret scroll. Skærmbillederne gemmes i `../skaermbilleder/modspil-kompas/`.
6. **Resten:** `npm test` (med fagords- og bydeformstesten) og stavekontrollen er grønne.

## Afklaret

- 25. nov. 2026: Franks fire valg ovenfor (spørgsmålene i Cowork-chatten med mock-up'en).
- Forslag, Frank skal se: mærket "table feeling" og prisen på det andet korts række, også når farven er rigtig. Vil Frank hellere have "–" i Koster for det andet kort i en rigtig farve, er det én linje i `udspilPris.ts`.
