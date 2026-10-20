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

const helpOf = (id: string): Both => TRACK_ITEMS.find((item) => item.id === id)!.help;

/** Et spor på forsiden (SPEC-forside-spor.md): ét kort pr. spor med navn, kort beskrivelse og skærmen, kortet åbner. */
export interface TrackCard {
  track: string;
  group: GroupId;
  /** Skærmen i `App.tsx`; den er også sporets adresse (`#fordeling` osv.). */
  screen: string;
  title: Both;
  description: Both;
  /** Kortets ⓘ. */
  help: Both;
}

/** Sporene i forsidens rækkefølge. Rækkefølgen afgør også, hvilket spor der er "næste" i I dag. */
export const TRACK_CARDS: readonly TrackCard[] = [
  { track: 'fordeling', group: 'counting', screen: 'fordeling', title: { da: 'Fordeling', en: 'Distribution' }, description: { da: 'De 39 mønstre og deres hyppighed', en: 'The 39 patterns and how often they occur' }, help: { da: 'Fordelingssporet: de 39 mønstre og deres hyppighed. Den daglige session tager ca. 5 minutter, og på sporets skærm finder du også huskepaladset, albummet, klubaftenen og kurverne.', en: 'The distribution track: the 39 patterns and how often they occur. The daily session takes about 5 minutes, and on the track’s screen you also find the memory palace, the album, the club evening and the charts.' } },
  { track: 'pointregnskab', group: 'counting', screen: 'pointregnskab', title: { da: 'Pointregnskab', en: 'Point count' }, description: { da: 'Tæl honnørpoint under spillet', en: 'Count high-card points during play' }, help: helpOf('pointregnskab') },
  { track: 'farvebehandling', group: 'play', screen: 'farvebehandling', title: { da: 'Farvebehandling', en: 'Suit combinations' }, description: { da: 'Den bedste linje i én farve · 657 kombinationer', en: 'The best line in one suit · 657 combinations' }, help: helpOf('farvebehandling') },
  { track: 'haandevaluering', group: 'evaluation', screen: 'haandevaluering', title: { da: 'Håndevaluering', en: 'Hand evaluation' }, description: { da: 'Vurdér hånden med P-modellen', en: 'Value your hand with the P-model' }, help: helpOf('haandevaluering') },
];

/**
 * Moduler uden daglig session (SPEC-analyse-modul.md): kortet står i sin gruppe efter sporene, men har ingen streak,
 * intet niveau og intet mærke og indgår ikke i I dag.
 */
export const MODULE_CARDS: readonly TrackCard[] = [
  {
    track: 'analyse',
    group: 'play',
    screen: 'analyse',
    title: { da: 'Analyse', en: 'Analysis' },
    description: { da: 'Slå en kombination op · linjer, chancer og sidninger', en: 'Look up a combination · lines, chances and layouts' },
    help: {
      da: 'Analysen fra Farvebehandling som selvstændigt modul: slå enhver kombination op, og se linjerne, chancerne og sidningerne, også med kendte kort, hp-grænser og forbindelser. Den findes også som fanen Analyse i Farvebehandling.',
      en: 'The analysis from Suit combinations as a separate module: look up any combination and see the lines, the chances and the layouts, also with known cards, HCP limits and entries. It is also the Analysis tab in Suit combinations.',
    },
  },
];
