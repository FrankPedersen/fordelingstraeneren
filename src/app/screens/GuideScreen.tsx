import type { ReactNode } from 'react';
import { tx } from '../../i18n';

interface Section {
  title: string;
  body: ReactNode;
}

/** Punkter som liste: hvert punkt er en tekst på det aktuelle sprog. */
const List = ({ items }: { items: string[] }) => (
  <ul>
    {items.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
);

function sections(): Section[] {
  return [
    {
      title: tx('Kom i gang', 'Getting started'),
      body: (
        <>
          <p>
            {tx(
              'Fordelingstræneren træner hånd-fordelinger i bridge i daglige sessioner på 5 minutter. Først lærer du de 39 mønstres rangorden og hyppighed, dernæst at tænke i mønstre under optælling: når Vest har vist 5 spar og 4 hjerter, ser du "5-4-3-1 eller 5-4-2-2" uden at regne.',
              'Fordelingstræneren trains hand distributions in bridge in daily 5-minute sessions. First you learn the order and frequency of the 39 patterns, then to think in patterns while counting: when West has shown 5 spades and 4 hearts, you see "5-4-3-1 or 5-4-2-2" without calculating.',
            )}
          </p>
          <List
            items={[
              tx('Tryk "Start dagens session" på forsiden. Appen vælger selv opgaverne.', 'Tap "Start today\'s session" on the front page. The app chooses the tasks.'),
              tx('Tryk på ⓘ ved et element for at få en kort forklaring lige der.', 'Tap ⓘ next to an element for a short explanation right there.'),
              tx('Knappen øverst på forsiden skifter mellem dansk og engelsk.', 'The button at the top of the front page switches between Danish and English.'),
              tx('Alt gemmes i din browser. Ingen login og ingen server.', 'Everything is saved in your browser. No login and no server.'),
            ]}
          />
        </>
      ),
    },
    {
      title: tx('Forsidens grupper', 'The groups on the front page'),
      body: (
        <List
          items={[
            tx(
              'Forsiden er delt i grupper efter, hvad sporene træner: Optælling (Fordeling og Pointregnskab), Spilføring (Farvebehandling) og Vurdering (Håndevaluering). Grupper uden spor vises ikke.',
              'The front page is divided into groups by what the tracks train: Counting (Distribution and Point count), Declarer play (Suit combinations) and Hand evaluation (the track of the same name). Groups without a track are not shown.',
            ),
            tx(
              'Under Fordeling står fordelingssporets streak, XP, niveau, dagens plan og startknap og menupunkterne Huskepalads, Album, Klubaften og Kurver. Streak og XP hører til fordelingssporet; de andre spor har deres egne inde i sporet.',
              "Under Distribution are the distribution track's streak, XP, level, today's plan and start button and the menu items Memory palace, Album, Club evening and Charts. The streak and XP belong to the distribution track; the other tracks have their own inside the track.",
            ),
            tx(
              'Hvert spor åbnes med ét tryk, og ⓘ ved en gruppe forklarer, hvad den træner. Vejledningen og Indstillinger står under grupperne.',
              'Each track opens with one tap, and ⓘ next to a group explains what it trains. The guide and Settings are below the groups.',
            ),
          ]}
        />
      ),
    },
    {
      title: tx('Den daglige session', 'The daily session'),
      body: (
        <>
          <List
            items={[
              tx('Repetition (ca. 60 s): emner, der er forfaldne i dag, blandet på tværs af øvelserne.', 'Review (about 60 s): items due today, mixed across the exercises.'),
              tx('Niveauøvelse: Fuldfør mønsteret eller Paladsvandring på dit niveau; nye mønstre præsenteres her.', 'Level practice: Complete the pattern or Palace walk at your level; new patterns are presented here.'),
              tx('Lynrunde (60 s): Højere/lavere og Lynaflæsning skiftevis fra dag til dag. Måles i rigtige svar pr. minut.', 'Lightning round (60 s): Higher/lower and Lightning reading on alternate days. Measured in correct answers per minute.'),
              tx('13-sudoku: én opgave, hvis der er tid. Hver 7. session er ugens boss med dobbelt XP.', '13-sudoku: one task if there is time. Every 7th session is the weekly boss with double XP.'),
              tx('Status: streak, XP, dagens kurvepunkt og hvad der kommer igen i morgen.', "Status: streak, XP, today's chart point and what comes back tomorrow."),
            ]}
          />
          <p>
            {tx(
              'Timeren er blød: opgaven, du er i gang med, gøres altid færdig. Dagen tæller i din streak, når en session er gennemført, og ugens joker dækker én glemt dag pr. uge.',
              'The timer is soft: the task you are on is always finished. The day counts in your streak when a session is complete, and the weekly joker covers one missed day per week.',
            )}
          </p>
        </>
      ),
    },
    {
      title: tx('Øvelserne', 'The exercises'),
      body: (
        <List
          items={[
            tx('Mønstertastaturet: tast de fire længder i vilkårlig rækkefølge; den fjerde udfyldes selv. "10+" er den lange farve.', 'The pattern keypad: type the four lengths in any order; the fourth fills itself in. "10+" is the long suit.'),
            tx('Højere/lavere: tryk på det hyppigste af to mønstre, eller ≈, når de er lige hyppige (under 2 % forskel).', 'Higher/lower: tap the more frequent of two patterns, or ≈ when they are equally frequent (less than 2 % apart).'),
            tx('Fuldfør mønsteret: ud fra 1–2 kendte farvelængder taster du de mulige mønstre, hyppigste først.', 'Complete the pattern: from 1–2 known suit lengths you type the possible patterns, most frequent first.'),
            tx('Lynaflæsning: en tilfældig hånd vises; tast dens mønster. Hånden står, til du trykker Klar (eller i t ms, se Indstillinger).', 'Lightning reading: a random hand is shown; type its pattern. The hand stays until you tap Ready (or for t ms, see Settings).'),
            tx('Paladsvandring: station → mønster (tastes) og mønster → station (vælges på ruten).', 'Palace walk: station → pattern (typed) and pattern → station (chosen on the route).'),
            tx('Klubaften-estimat: hvor mange af aftenens 100 hænder har et givet mønster? Rigtigt inden for ±1 (±2 over 10).', 'Club evening estimate: how many of the evening’s 100 hands have a given pattern? Right within ±1 (±2 above 10).'),
            tx('13-sudoku: udled alle fire hænders længder ud fra meldinger og spilhændelser. Lås fordelingen, når du er sikker; jo færre ledetråde, jo flere point.', '13-sudoku: work out the lengths of all four hands from the bidding and play events. Lock the distribution when you are sure; the fewer clues, the more points.'),
          ]}
        />
      ),
    },
    {
      title: tx('Leitner, støtte og XP', 'Leitner, support and XP'),
      body: (
        <List
          items={[
            tx('Hvert emne (mønster × færdighed) står i en kasse 1–5 og kommer igen om 1, 2, 4, 8 eller 16 dage.', 'Each item (pattern × skill) sits in a box 1–5 and comes back in 1, 2, 4, 8 or 16 days.'),
            tx('Rigtigt og hurtigt: én kasse op. Rigtigt men langsomt: bliver stående. Forkert: kasse 1.', 'Right and fast: one box up. Right but slow: stays. Wrong: box 1.'),
            tx('Indsats i repetitionen: "Sikker" giver +15/−10 XP, "Gæt" +5/0. Et forkert "sikker" gentages sidst i sessionen.', 'Stake in review: "Sure" gives +15/−10 XP, "Guess" +5/0. A wrong "sure" is repeated at the end of the session.'),
            tx('Støtte trappes ud: først præsentation og ledetråd, siden kun facit. En ledetråd koster 5 XP på støtteniveau 2.', 'Support is faded out: first presentation and hint, later only the answer. A hint costs 5 XP at support level 2.'),
            tx('Combo: ×1,5 efter 5 rigtige i træk og ×2 efter 10.', 'Combo: ×1.5 after 5 right in a row and ×2 after 10.'),
          ]}
        />
      ),
    },
    {
      title: tx('Husketeknikker, album, klubaften og kurver', 'Memory techniques, album, club evening and charts'),
      body: (
        <List
          items={[
            tx('Huskepalads: de 13 hyppigste mønstre på 13 stationer på en rute, du kender; de episke ligger på Loftet. Navngiv stationerne og skriv en scene.', 'Memory palace: the 13 most frequent patterns on 13 stations along a route you know; the epic ones live in the Attic. Name the stations and write a scene.'),
            tx('Skyline: hvert mønster tegnes som fire faldende søjler med et billede, der udspringer af formen. Du kan skrive dit eget billede.', 'Skyline: every pattern is drawn as four descending bars with an image that grows out of the shape. You can write your own image.'),
            tx('Familiefarver: længste farve giver farven: blå (4), grøn (5), rav (6) og violet (7+). Der står altid tekst eller tal ved.', 'Family colours: the longest suit gives the colour: blue (4), green (5), amber (6) and violet (7+). There is always text or a number with it.'),
            tx('Album: 39 pladser; et mønster samles første gang, det optræder i en tilfældig hånd.', 'Album: 39 slots; a pattern is collected the first time it appears in a random hand.'),
            tx('Klubaften: 100 hænder (25 spil × 4) vist som små skylines i rangorden.', 'Club evening: 100 hands (25 boards × 4) shown as small skylines in order of rank.'),
            tx('Kurver: rigtige pr. minut i lynrunden og træfsikkerhed pr. grad, uge for uge.', 'Charts: correct per minute in the lightning round and accuracy per grade, week by week.'),
          ]}
        />
      ),
    },
    {
      title: tx('Farvebehandling', 'Suit combinations'),
      body: (
        <>
          <p>
            {tx(
              'Et selvstændigt spor om at spille én farve: hvilken linje giver størst chance for det antal stik, du skal bruge? Tallene er løserens med optimalt modspil og ubegrænsede forbindelser, a priori.',
              'A separate track about playing one suit: which line gives the best chance of the number of tricks you need? The figures are the solver’s, with best defence and unlimited entries, a priori.',
            )}
          </p>
          <List
            items={[
              tx('Træning: din egen daglige session med repetition, niveau, lynrunde og status, egen streak og XP.', 'Training: your own daily session with review, level, lightning round and status, its own streak and XP.'),
              tx('Opgavetyperne: Vælg linjen, Hvor stor er chancen?, Linje mod linje, Nyt mål, Hvad nu?, Find hullet, Spil den selv, Med optælling og Hold eller par.', 'Task types: Choose the line, How big is the chance?, Line against line, New goal, What now?, Find the hole, Play it yourself, With counting and Teams or pairs.'),
              tx('Selvvalgt: vælg teknik, antal kort, manglende honnører og mål; svarene logges, men ændrer ikke dagsplanen.', 'Free practice: choose technique, number of cards, missing honours and goal; answers are logged but do not change the daily plan.'),
              tx('Analyse: bankens kombinationer, kortvælgeren (regner også kombinationer uden for banken), linjerne, sandsynlighedsbåndet og dine egne linjer.', 'Analysis: the bank’s combinations, the card picker (also solves combinations outside the bank), the lines, the probability band and your own lines.'),
              tx('Paladset, Klubaften (de 100 hyppigste kombinationer), Statistik (dine svage punkter) og Dine data findes på Trænings forside.', 'The palace, Club evening (the 100 most frequent combinations), Statistics (your weak spots) and Your data are on the Training front page.'),
            ]}
          />
        </>
      ),
    },
    {
      title: tx('Pointregnskab', 'Point count'),
      body: (
        <>
          <p>
            {tx(
              'Pointregnskab er et selvstændigt spor om at tælle honnørpoint (E 4, K 3, D 2, B 1) som spilfører og slutte sig til, hvor de manglende honnører sidder. Det har sin egen daglige session, streak og XP.',
              'Point count is a separate track about counting high-card points (A 4, K 3, Q 2, J 1) as declarer and working out where the missing honours are. It has its own daily session, streak and XP.',
            )}
          </p>
          <List
            items={[
              tx('Sessionen: opvarmning med blokke og intervalkort, regnestykket som lynrunde, 3–4 opgaver på dit niveau og status. Hver 7. session er ugens boss med Fuldt regnskab og dobbelt XP.', 'The session: a warm-up with blocks and range cards, the sum as a lightning round, 3–4 tasks at your level and status. Every 7th session is the weekly boss with Full count and double XP.'),
              tx('Øvelserne: Regnestykket, Løbende tælling, Kan han have den?, Hvem har den?, Kipningsretning og Fuldt regnskab med længder fra en 13-sudoku.', 'The exercises: The sum, Running count, Can he have it?, Who has it?, Finesse direction and Full count with lengths from a 13-sudoku.'),
              tx('Regnskabspanelet viser interval, vist og rest for Vest og Øst. Rest er interval minus vist; panelet afslører aldrig løserens slutning og er skjult fra niveau 4.', 'The count panel shows range, shown and left for West and East. Left is range minus shown; the panel never reveals what the solver concludes and is hidden from level 4.'),
              tx('"Kan ikke afgøres" og "det er et gæt" er altid gyldige svar. At svare sikkert, når det ikke kan afgøres, er forkert: "Det kunne du ikke vide endnu."', `"Can't tell" and "it's a guess" are always valid answers. Answering as if sure when it can't be told is wrong: "You couldn't know that yet."`),
              tx('Niveauet stiger, når over 90 % af de seneste 20 svar er rigtige, og falder under 80 %. Data og eksport ligger under Pointregnskab → Indstillinger.', 'Your level rises when more than 90% of your last 20 answers are right, and falls below 80%. Data and export are under Point count → Settings.'),
            ]}
          />
        </>
      ),
    },
    {
      title: tx('Håndevaluering', 'Hand evaluation'),
      body: (
        <>
          <p>
            {tx(
              'Håndevaluering er et selvstændigt spor i gruppen Vurdering. Det træner at regne din hånd med Franks P-model og at vælge niveau ud fra parrets samlede styrke. Det har sin egen daglige session, streak og XP.',
              "Hand evaluation is a separate track with its own group on the front page. It trains valuing your hand with Frank's P-model and choosing the level from the pair's total strength. It has its own daily session, streak and XP.",
            )}
          </p>
          <List
            items={[
              tx('Honnørpoint: E 5, K 3, D 1½, B ½ og 10 ¼, eller genvejen HCP + 1 pr. es − ½ pr. dame − ½ pr. knægt + ¼ pr. tier. Sporets talpanel har ½ og ¼.', 'Honour points: A 5, K 3, Q 1½, J ½ and 10 ¼, or the shortcut HCP + 1 per ace − ½ per queen − ½ per jack + ¼ per ten. The track’s keypad has ½ and ¼.'),
              tx('Når fitten er bekræftet: 1½ pr. trumf ud over 4 og korthed 5-3-1 i sidefarverne, minus 1 pr. konge over for makkers viste korthed. Det giver din p.', 'Once the fit is confirmed: 1½ per trump beyond 4 and shortness 5-3-1 in the side suits, minus 1 per king opposite partner’s shown shortness. That gives your p.'),
              tx('P er din p plus makkers. Udgang ved P ≥ 28½, lilleslem ved 35 og storeslem ved 41; stik ≈ P/3. I sans tæller HCP + ¼ pr. tier og stoppere, ikke længde.', 'P is your p plus partner’s. Game at P ≥ 28½, small slam at 35 and grand slam at 41; tricks ≈ P/3. In notrump, HCP + ¼ per ten and stoppers count, not length.'),
              tx('Sessionen: opvarmning med nøgletal og kortfarvepoint pr. mønster, en lynrunde med honnørpoint, opgaver på dit niveau og status.', 'The session: a warm-up with key numbers and shortness points per pattern, a lightning round with honour points, tasks at your level and status.'),
              tx('Niveauet stiger, når over 90 % af de seneste 20 svar er rigtige, og falder under 80 %. Data og eksport ligger under Håndevaluering → Indstillinger.', 'Your level rises when more than 90% of your last 20 answers are right, and falls below 80%. Data and export are under Hand evaluation → Settings.'),
            ]}
          />
        </>
      ),
    },
    {
      title: tx('Sprog og hjælp', 'Language and help'),
      body: (
        <List
          items={[
            tx('Knappen øverst på forsiden skifter hele appen mellem dansk og engelsk. Valget gemmes.', 'The button at the top of the front page switches the whole app between Danish and English. The choice is saved.'),
            tx('På engelsk vises honnørerne som A K Q J; på dansk som E K D B.', 'In English the honours are shown as A K Q J; in Danish as E K D B.'),
            tx('Et ⓘ ved et element viser en kort forklaring; et nyt tryk skjuler den.', 'An ⓘ next to an element shows a short explanation; tap again to hide it.'),
          ]}
        />
      ),
    },
    {
      title: tx('Dine data', 'Your data'),
      body: (
        <List
          items={[
            tx('Alt ligger i din browser på denne enhed. Fordelingssporet og farvebehandling har hver deres data og hver deres eksport.', 'Everything is stored in your browser on this device. The distribution track and suit combinations each have their own data and their own export.'),
            tx('Eksportér jævnligt: Indstillinger → Sikkerhedskopi, og i farvebehandling Træning → Dine data.', 'Export regularly: Settings → Backup, and in suit combinations Training → Your data.'),
            tx('Appen beder browseren om fast lagring og minder dig om at eksportere, når det er over en måned siden.', 'The app asks the browser for persistent storage and reminds you to export when it has been more than a month.'),
            tx('En ny version vises som en knap på forsiden; appen genindlæser aldrig midt i en session.', 'A new version shows up as a button on the front page; the app never reloads in the middle of a session.'),
          ]}
        />
      ),
    },
  ];
}

/** Den samlede vejledning: hvert afsnit kan foldes ud. */
export function GuideScreen({ onBack }: { onBack(): void }) {
  return (
    <main className="screen guide">
      <header className="screen-head">
        <button type="button" className="round" aria-label={tx('Tilbage', 'Back')} onClick={onBack}>
          ←
        </button>
        <h1>{tx('Vejledning', 'Guide')}</h1>
      </header>
      <section className="card">
        {sections().map((s, i) => (
          <details key={s.title} open={i === 0}>
            <summary>{s.title}</summary>
            {s.body}
          </details>
        ))}
      </section>
    </main>
  );
}
