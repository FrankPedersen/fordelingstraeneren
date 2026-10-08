/**
 * Forsidens menupunkter og grupper (SPEC-navigation.md). Én linje pr. menupunkt: spor, gruppe, titel og ⓘ-tekst på
 * begge sprog og skærmen, knappen åbner. Et nyt spor med ét menupunkt tilføjes med én linje her; forsiden skal ikke
 * ændres. Listen har ingen logik fra sporene.
 */

export type GroupId = 'counting' | 'play' | 'evaluation';

/** Tekst på begge sprog. */
export interface Both {
  da: string;
  en: string;
}

export interface Group {
  id: GroupId;
  title: Both;
  help: Both;
}

export interface TrackItem {
  id: string;
  /** Sporet, menupunktet hører til; fordelingssporets punkter står under overskriften Fordeling. */
  track: string;
  group: GroupId;
  /** Skærmen i `App.tsx`, som knappen åbner. */
  screen: string;
  title: Both;
  help: Both;
}

/** Grupperne i den rækkefølge, de står på forsiden. Tomme grupper vises ikke. */
export const GROUPS: readonly Group[] = [
  {
    id: 'counting',
    title: { da: 'Optælling', en: 'Counting' },
    help: {
      da: 'Træner at tælle hænder ud: fordelingernes mønstre og hyppighed, 13-sudokuen i den daglige session og honnørpoint i Pointregnskab.',
      en: 'Trains counting out hands: the patterns and frequencies of distributions, the 13-sudoku in the daily session and high-card points in Point count.',
    },
  },
  {
    id: 'play',
    title: { da: 'Spilføring', en: 'Declarer play' },
    help: {
      da: 'Træner spilføring: hvilken linje i én farve, der giver størst chance for de stik, du skal bruge.',
      en: 'Trains declarer play: which line in one suit gives the best chance of the tricks you need.',
    },
  },
  {
    id: 'evaluation',
    title: { da: 'Vurdering', en: 'Hand evaluation' },
    help: {
      da: 'Træner vurdering af egen og makkers hånd med Franks P-model: honnørpoint, hvornår fordelingen må lægges til, og niveaubeslutningen ud fra parrets samlede P i Håndevaluering.',
      en: "Trains evaluating your own and your partner's hand with Frank's P-model: honour points, when distribution may be added, and the level decision from the pair's total P in Hand evaluation.",
    },
  },
];

/** Fordelingssporets id; dets punkter står først i Optælling under overskriften Fordeling. */
export const DISTRIBUTION_TRACK = 'fordeling';

/** Menupunkterne. Inden for en gruppe står de som i dag, med nye spor sidst. */
export const TRACK_ITEMS: readonly TrackItem[] = [
  { id: 'palace', track: 'fordeling', group: 'counting', screen: 'palace', title: { da: 'Huskepalads', en: 'Memory palace' }, help: { da: 'Læg de 13 mest almindelige mønstre på 13 stationer på en rute, du kender udenad, fx hjemmet eller klubben. Navngiv hver station og skriv en scene med mønstrets billede. Paladset hjælper i starten og trappes ud.', en: 'Place the 13 most common patterns on 13 stations along a route you know by heart, such as your home or the club. Name each station and write a scene with the pattern’s image. The palace helps at first and is faded out.' } },
  { id: 'album', track: 'fordeling', group: 'counting', screen: 'album', title: { da: 'Album', en: 'Album' }, help: { da: 'Albummet har 39 pladser, én pr. mønster. Et mønster samles, første gang det optræder i en tilfældig hånd i Lynaflæsning; sjældne fund fejres med deres odds. Legendariske kan også låses op med tre rigtige svar.', en: 'The album has 39 slots, one per pattern. A pattern is collected the first time it appears in a random hand in Lightning reading; rare finds are celebrated with their odds. Legendary ones can also be unlocked with three right answers.' } },
  { id: 'club', track: 'fordeling', group: 'counting', screen: 'club', title: { da: 'Klubaften', en: 'Club evening' }, help: { da: 'En klubaften er 25 spil × 4 hænder = 100 hænder. Her ser du, hvor mange af dem der i gennemsnit har hvert mønster. Tryk på et mønster for at fremhæve dets hænder.', en: 'A club evening is 25 boards × 4 hands = 100 hands. Here you see how many of them have each pattern on average. Tap a pattern to highlight its hands.' } },
  { id: 'curves', track: 'fordeling', group: 'counting', screen: 'curves', title: { da: 'Kurver', en: 'Charts' }, help: { da: 'Kurverne viser din udvikling uge for uge: rigtige svar pr. minut i lynrunden og træfsikkerheden pr. grad.', en: 'The charts show your progress week by week: correct answers per minute in the lightning round and accuracy per grade.' } },
  { id: 'pointregnskab', track: 'pointregnskab', group: 'counting', screen: 'pointregnskab', title: { da: 'Pointregnskab', en: 'Point count' }, help: { da: 'Et selvstændigt spor om at tælle honnørpoint under spillet: hvor mange point har modparten, hvem har vist hvad, og hvor sidder de manglende honnører? Med egen daglig session, streak og XP.', en: 'A separate track about counting high-card points during play: how many points do the opponents have, who has shown what, and where are the missing honours? With its own daily session, streak and XP.' } },
  { id: 'farvebehandling', track: 'farvebehandling', group: 'play', screen: 'farvebehandling', title: { da: 'Farvebehandling', en: 'Suit combinations' }, help: { da: 'Et selvstændigt spor om at spille én farve: hvilken linje giver størst chance for de stik, du skal bruge? Med egen daglig session, streak og XP, selvvalgt træning, analyse af 657 kombinationer og en løser.', en: 'A separate track about playing one suit: which line gives the best chance of the tricks you need? With its own daily session, streak and XP, free practice, analysis of 657 combinations and a solver.' } },
  { id: 'haandevaluering', track: 'haandevaluering', group: 'evaluation', screen: 'haandevaluering', title: { da: 'Håndevaluering', en: 'Hand evaluation' }, help: { da: 'Et selvstændigt spor om at vurdere hånden med Franks P-model: honnørpoint, hvornår fordelingen må lægges til, og niveaubeslutningen ud fra parrets samlede P. Med egen daglig session, streak og XP.', en: "A separate track about valuing your hand with Frank's P-model: honour points, when distribution may be added, and the level decision from the pair's total P. With its own daily session, streak and XP." } },
];
