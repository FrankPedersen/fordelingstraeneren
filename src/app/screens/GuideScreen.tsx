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
