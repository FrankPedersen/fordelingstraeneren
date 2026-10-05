import type { Card } from '../../domain/cards';
import { getLang } from '../../i18n';
import type { Exercise } from '../model/generator';
import type { Defender } from '../model/points';
import type { PrImportError } from '../storage';
import type { RangeId } from '../training/deck';

/** Notat på en Honnørchip: Vest, Øst eller usikker. */
export type Note = 'W' | 'E' | 'open';

const SUITS = ['♠', '♥', '♦', '♣'];

/** Kortets værdi: 0 = 2 … 8 = 10, 9 = bonde, 10 = dame, 11 = konge, 12 = es. */
const rankWith = (letters: readonly string[]) => (rank: number) => (rank >= 9 ? letters[rank - 9] : `${rank + 2}`);
const rankDa = rankWith(['B', 'D', 'K', 'E']);
const rankEn = rankWith(['J', 'Q', 'K', 'A']);

/** En liste som "♣D og ♦E" eller "♣D, ♦E og ♠K". */
const listWith = (and: string) => (items: readonly string[]) =>
  items.length > 1 ? `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}` : (items[0] ?? '');
const listDa = listWith('og');
const listEn = listWith('and');

const SUIT_DA = ['spar', 'hjerter', 'ruder', 'klør'];
const SUIT_EN = ['spade', 'heart', 'diamond', 'club'];

const MONTHS_DA = ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'december'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dayParts = (day: string) => day.split('-').map(Number);

/** Al ordlyd i Pointregnskabets brugerflade på dansk. EN nedenfor har samme type. */
const DA = {
  title: 'Pointregnskab',
  back: 'Tilbage til forsiden',
  backToHome: 'Tilbage til Pointregnskab',
  saveFailed: 'Dine data kunne ikke gemmes i browseren. Eksportér en kopi under Indstillinger.',

  rank: rankDa,
  card: (card: Card) => `${SUITS[Math.floor(card / 13)]}${rankDa(card % 13)}`,
  list: listDa,
  seat: { W: 'Vest', E: 'Øst', N: 'Nord', S: 'Syd' } as Record<Defender | 'N' | 'S', string>,
  hp: (points: number | string) => `${points} hp`,

  // Forsiden
  level: (n: number) => `Niveau ${n}`,
  levelNames: {
    1: 'ét interval og én uset honnør',
    2: 'ét interval og flere usete honnører',
    3: 'to intervaller, så restintervallet skal bruges',
    4: 'løbende tælling uden regnskabspanel',
    5: 'fuldt regnskab med længder',
  } as Record<number, string>,
  streak: 'Streak',
  daysInRow: (n: number): string => (n === 1 ? 'dag i træk' : 'dage i træk'),
  xp: 'XP',
  today: 'I dag',
  todayPlan: (cards: number, level: number, boss: boolean) =>
    `${cards === 1 ? '1 kort' : `${cards} kort`} til opvarmning · regnestykket · niveau ${level}${boss ? ' · ugens boss: Fuldt regnskab med dobbelt XP' : ''}`,
  doneToday: 'Dagens session er gennemført. Du kan tage en til.',
  ownTrack: 'Pointregnskab har sin egen streak og XP, adskilt fra de andre spor.',
  start: 'Start dagens session',
  techniques: 'Husketeknikker',
  techniqueList: [
    { key: 'top', name: 'Regn oppefra', text: 'Højeste mulige minus vist er det, han højst har tilbage. "Vest har højst 17 og har vist 14, så esset kan han ikke have."' },
    { key: 'anchors', name: 'Ankre', text: '40 i alt og 10 pr. hånd i snit. En makker, der har passet en åbning i 1 farve, har højst 5.' },
    { key: 'blocks', name: 'Blokke', text: 'Honnørerne i en farve tælles som én blok: E K = 7, E D = 6, K D = 5, E K D = 9, D B = 3.' },
    { key: 'ranges', name: 'Intervalkort', text: 'Meldingernes hp-intervaller fra systemfilen, fx 1NT 15–17 og svag 2 5–11.' },
  ],
  settings: 'Indstillinger',
  data: 'Dine data',
  exportReminder: 'Det er over en måned siden, du sidst gemte en kopi af Pointregnskabs data.',
  exportNow: 'Eksportér nu',

  // Sessionen
  phases: { warmup: 'Opvarmning', sum: 'Regnestykket', level: 'Niveau', status: 'Status' },
  sessionMeta: (xp: number, boss: boolean) => `${xp} XP${boss ? ' · ugens boss' : ''}`,
  stop: 'Afbryd sessionen',
  exercises: {
    sum: 'Regnestykket',
    running: 'Løbende tælling',
    can: 'Kan han have den?',
    who: 'Hvem har den?',
    finesse: 'Kipningsretning',
    full: 'Fuldt regnskab',
  } as Record<Exercise, string>,

  // Situationen
  contract: (contract: string) => `Syd spiller ${contract}`,
  auction: 'Meldingerne',
  pass: 'pas',
  noCall: 'ingen melding',
  callRange: (call: string, range: string) => `${call} (${range})`,
  freePass: 'pas (ingen grænse)',
  openingPassText: 'Pas i åbningsposition: højst 11 hp, for med 12 hp eller mere åbner man altid.',
  freePassText: 'Pas uden grænse: en stærk hånd uden en passende melding passer også.',
  noCallText: (seat: string) => `${seat} har ikke meldt: ingen grænse.`,
  dummy: 'Bordet (Nord)',
  you: 'Dig (Syd)',
  hand: (who: string) => `${who}s hånd`,
  opponentsHave: (points: number) => `Modparten har ${points} hp`,
  lengths: 'Længderne fra 13-sudokuen',
  lengthsLine: (west: string, east: string) => `Vest ${west} · Øst ${east}`,

  // Regnskabspanelet, ledetrådene og chippene
  count: 'Regnskab',
  range: 'Interval',
  shown: 'Vist',
  left: 'Rest',
  latest: 'Seneste',
  plays: (seat: string, card: string) => `${seat} lægger ${card}`,
  noClues: 'Ingen honnører er faldet endnu.',
  clueCounter: (n: number, total: number) => `${n} af ${total}`,
  watch: 'Tæl med: honnørerne vises én ad gangen.',
  unseen: 'Usete honnører',
  notes: { W: 'V', E: 'Ø', open: '?' } as Record<Note, string>,
  noteNames: { none: 'intet notat', W: 'Vest', E: 'Øst', open: 'usikker' } as Record<Note | 'none', string>,
  chipLabel: (card: string, note: string) => `${card}: ${note}`,

  // Spørgsmålene
  sumPrompt: 'Hvor mange point har modparten?',
  runningWest: 'Hvor mange point har Vest vist?',
  runningEast: 'Og Øst?',
  canPrompt: (seat: string, card: string) => `Kan ${seat} have ${card}?`,
  whoPrompt: (card: string) => `Hvem har ${card}?`,
  finessePrompt: (card: string) => `Du skal kippe mod ${card}. Hvilken vej?`,
  yes: 'Ja',
  no: 'Nej',
  cantTell: 'Kan ikke afgøres',
  guess: 'Det er et gæt',
  answers: 'Svar',

  // Facit
  facit: 'Facit',
  right: 'Rigtigt',
  rightSlow: 'Rigtigt, men over tidsgrænsen',
  half: 'Halvt rigtigt',
  wrong: 'Forkert',
  overconfident: 'Det kunne du ikke vide endnu.',
  gained: (xp: number) => `+${xp} XP`,
  next: 'Næste',
  yourAnswer: (text: string) => `Dit svar: ${text}`,
  sumFacit: (north: number, south: number, m: number) => `Modparten har 40 − ${north} − ${south} = ${m} hp.`,
  runningFacit: (west: number, east: number) => `Vest har vist ${west} hp og Øst ${east} hp.`,
  runningAnswer: (west: number, east: number) => `Vest ${west}, Øst ${east}`,
  canFacit: (yes: boolean, seat: string, card: string) => (yes ? `Ja, ${seat} kan have ${card}.` : `Nej, ${seat} kan ikke have ${card}.`),
  placementFacit: (holder: string, card: string) => `${card} sidder hos ${holder}.`,
  openFacit: (card: string) => `${card} kan ikke afgøres.`,
  guessFacit: (card: string) => `Kipningen mod ${card} er et gæt.`,
  /** Den anden kan ikke have den. */
  otherCannot: (other: string, max: number, card: string, value: number, holder: string) =>
    `${other} kan højst have ${max} hp tilbage, og ${card} er ${value}, så den sidder hos ${holder}.`,
  otherCannotGap: (other: string, rest: string, card: string, value: number, holder: string, alone: boolean) =>
    `${other} kan have ${rest} hp tilbage, og ${card} (${value}) passer ikke ind${alone ? '' : ', heller ikke sammen med de andre usete honnører'}, så den sidder hos ${holder}.`,
  /** Han skal have den. */
  mustHave: (holder: string, rest: string, cards: readonly string[]) =>
    `${holder} mangler ${rest} og kan kun nå det med ${cards.length > 1 ? 'både ' : ''}${listDa(cards)}.`,
  /** Kan ikke afgøres. */
  bothFit: (card: string, west: number, east: number) =>
    `Begge placeringer passer: ${card} hos Vest giver Vest ${west} hp, ${card} hos Øst giver Øst ${east} hp.`,
  /** Farven er brugt op. */
  usedUp: (seat: string, length: number, suit: number, cards: readonly string[], other: string) =>
    `${seat} ${length === 0 ? `har ingen ${SUIT_DA[suit]}` : length === 1 ? `har vist sin eneste ${SUIT_DA[suit]}` : `har vist alle sine ${length} ${SUIT_DA[suit]}`}, så ${listDa(cards)} sidder hos ${other}.`,
  /** Ikke plads. */
  noRoom: (seat: string, room: number, suit: number, cards: readonly string[], other: string) =>
    `${seat} har kun ${room} ${SUIT_DA[suit]} tilbage, men der er ${cards.length} usete ${SUIT_DA[suit]}-honnører (${cards.join(' ')}), så mindst ${cards.length - room === 1 ? 'én' : cards.length - room} af dem sidder hos ${other}.`,
  placements: 'De mulige placeringer',
  placementLine: (west: string, east: string) => `Vest: ${west} · Øst: ${east}`,
  nothing: 'ingen',
  solverRest: (west: string, east: string) => `Løserens restinterval: Vest ${west} hp, Øst ${east} hp.`,
  finesseNote: 'En sikker placering afgør retningen for kipningen. Kombinationen kan ses i Farvebehandling under Analyse.',

  // Opvarmningen
  blockPrompt: 'Hvor mange hp er blokken?',
  rangePrompt: 'Hvilket interval viser den?',
  blocks: 'Blokke',
  rangeCards: 'Intervalkort',
  rangeNames: {
    'opening-1NT': 'Åbning 1NT',
    'opening-1-suit': 'Åbning i 1 farve',
    'opening-2NT': 'Åbning 2NT',
    'opening-2C': 'Åbning 2♣ (stærk)',
    'opening-weak-2': 'Svag 2-åbning',
    'opening-3': 'Spærreåbning på 3-trinnet',
    'overcall-1': 'Indmelding på 1-trinnet',
    'overcall-2': 'Indmelding på 2-trinnet',
    'overcall-1NT': 'Indmelding 1NT',
    'takeout-double': 'Oplysningsdobling',
    'two-suited': 'Michaels-cuebid og usædvanlig 2NT',
    dont: 'DONT over 1NT',
    'dont-double': 'DONT-dobling over 1NT',
    'opening-pass': 'Pas i åbningsposition',
    'responder-pass-after-1-suit': 'Svarer passer på makkers åbning i 1 farve',
    'responder-pass-after-1NT': 'Svarer passer på makkers 1NT',
  } as Record<RangeId, string>,
  blockFacit: (cards: string, points: number) => `${cards} = ${points} hp`,
  rangeFacit: (name: string, range: string) => `${name}: ${range} hp`,

  // Status
  sessionDone: 'Sessionen er gennemført',
  sessionScore: (correct: string, total: number) => `${correct} af ${total} rigtige`,
  sessionXp: (xp: number) => `${xp} XP i denne session`,
  levelNow: (n: number, name: string) => `Niveau ${n}: ${name}`,
  toHome: 'Til Pointregnskabs forside',

  // Indstillinger og data
  levelInfo: 'Niveau',
  runningInfo: (seconds: string) => `Visningstid i løbende tælling: ${seconds} s pr. honnør.`,
  dataHelp: 'Pointregnskabs data ligger kun i denne browser. Gem en kopi som fil, og hent den igen på en anden enhed.',
  exportData: 'Eksportér data',
  importData: 'Importér data',
  importFile: 'Vælg en fil med Pointregnskabs data',
  exported: 'Filen er gemt.',
  imported: 'Dataene er importeret.',
  importErrors: {
    json: 'Filen er ikke gyldig JSON.',
    'not-pointregnskab': 'Filen indeholder ikke data fra Pointregnskab.',
    newer: 'Filen er fra en nyere version af appen.',
    invalid: 'Filen er ugyldig.',
  } as Record<PrImportError, string>,
  importSummary: (xp: number, items: number, sessions: number, streak: number) =>
    `Filen har ${xp} XP, ${items} kort i bunken, ${sessions} sessioner og en streak på ${streak}. Erstat dataene her?`,
  cancel: 'Annullér',
  replace: 'Erstat',
  lastExport: (date: string) => `Seneste eksport: ${date}.`,
  neverExported: 'Du har ikke eksporteret endnu.',
  dateText: (day: string) => {
    const [y, m, d] = dayParts(day);
    return `${d}. ${MONTHS_DA[m - 1]} ${y}`;
  },

  help: {
    screen:
      'Pointregnskab træner optælling af honnørpoint (E 4, K 3, D 2, B 1) som spilfører: hvor mange point har modparten, hvem har vist hvad, og hvor sidder de manglende honnører? Niveauet stiger, når over 90 % af de seneste 20 svar er rigtige, og falder under 80 %.',
    today:
      'Dagens plan: opvarmning med blokke og intervalkort (de kort, Leitner-systemet har sat til i dag, og op til 3 nye), regnestykket og 3–4 opgaver på dit niveau. Hver 7. session er ugens boss med Fuldt regnskab og dobbelt XP.',
    start:
      'En session tager ca. 5 minutter: opvarmning (45 s), regnestykket (45 s), niveau (3–4 opgaver) og status. Timeren er blød, så opgaven, du er i gang med, gøres altid færdig. Dagen tæller i streaken, når status vises.',
    techniques: 'Fire måder at holde regnskab på ved bordet. Blokkene og intervalkortene øves i opvarmningen.',
    blocks: 'Tæl honnørerne i en farve som én blok: E K = 7, E D = 6, K D = 5, E K D = 9, D B = 3. Tast blokkens point; inden for 5 s er hurtigt.',
    rangeCards:
      'Meldingernes hp-intervaller fra systemfilen, fx 1NT 15–17 og pas i åbningsposition højst 11. Vælg det interval, meldingen viser. Kun intervallerne øves her, ikke konventionerne.',
    settings: 'Dit niveau, visningstiden i løbende tælling og Pointregnskabs egen eksport og import.',
    data: 'Pointregnskab har sine egne data. Eksportér en kopi som fil; en import viser først et resumé og erstatter så dataene her. De andre spors data røres ikke.',
    level:
      'Niveau 1: ét interval og én uset honnør. 2: flere usete honnører. 3: begge modspillere har et interval, så restintervallet skal bruges. 4: honnørerne vises én ad gangen, og regnskabspanelet er skjult. 5: fuldt regnskab med længder.',
    exercises: {
      sum: 'Tæl Nords og Syds honnørpoint, og træk dem fra 40. Tast svaret; inden for 5 s giver 10 XP, ellers 5.',
      running:
        'Honnørerne vises én ad gangen, som de falder. Hold regnskab i hovedet, og tast til sidst, hvor mange point Vest og Øst har vist. Ét af to tal rigtigt giver halvt. Visningstiden bliver kortere efter rigtige svar og længere efter fejl.',
      can: 'Kan modspilleren have honnøren med de point, hans meldinger tillader? Svar ja, hvis han kan; nej kun, hvis den sikkert sidder hos den anden.',
      who: 'Svar Vest eller Øst, hvis honnøren sidder samme sted i alle placeringer, der passer med meldingerne og de viste point; ellers "kan ikke afgøres". At svare sikkert, når det ikke kan afgøres, er forkert.',
      finesse: 'Kip mod den modspiller, der sikkert har honnøren. Sidder den ikke sikkert hos nogen af dem, er det et gæt.',
      full: 'Som Hvem har den?, men Vests og Østs farvelængder fra en 13-sudoku er kendt: ingen kan have flere honnører i en farve, end han har kort i den.',
    } as Record<Exercise, string>,
    panel:
      'Regnskabet for hver modspiller: interval er de point, hans meldinger tillader, vist er de honnører, han har lagt, og rest er interval minus vist. Panelet viser aldrig løserens slutning, og det er skjult fra niveau 4.',
    auction:
      'Øst og Vests meldinger med hp-intervallerne fra systemfilen. Pas i åbningsposition viser højst 11 hp. Svarerens pas viser 0–5 efter en åbning i 1 farve og 0–7 efter 1NT, men kun når Nord–Syd har passet imellem. Nord–Syds meldinger indgår ikke; kun kontrakten vises.',
    stream: 'Honnørerne, modspillerne har lagt, med den nyeste øverst. De tæller som vist.',
    chips: 'De honnører, du ikke har set. Tryk på en chip for at notere V, Ø eller ? (giver ikke point). Notaterne er slået fra fra niveau 4.',
    lengths: 'Vests og Østs længder i ♠♥♦♣-orden fra en 13-sudoku. Ingen modspiller kan have flere honnører i en farve, end han har kort i den.',
    facit:
      'Begrundelsen kommer fra løseren, der gennemgår alle måder, de usete honnører kan sidde på, og beholder dem, der passer med meldinger og viste point. Restintervallet er det, hver modspiller kan have tilbage.',
    status: 'Sessionens resultat. Streak og XP er Pointregnskabs egne, adskilt fra de andre spor.',
  },
};

export type Texts = typeof DA;

const EN: Texts = {
  title: 'Point count',
  back: 'Back to the front page',
  backToHome: 'Back to Point count',
  saveFailed: 'Your data could not be saved in the browser. Export a copy under Settings.',

  rank: rankEn,
  card: (card: Card) => `${SUITS[Math.floor(card / 13)]}${rankEn(card % 13)}`,
  list: listEn,
  seat: { W: 'West', E: 'East', N: 'North', S: 'South' },
  hp: (points: number | string) => `${points} HCP`,

  level: (n: number) => `Level ${n}`,
  levelNames: {
    1: 'one range and one unseen honour',
    2: 'one range and several unseen honours',
    3: 'two ranges, so the range left must be used',
    4: 'running count without the count panel',
    5: 'full count with lengths',
  },
  streak: 'Streak',
  daysInRow: (n: number): string => (n === 1 ? 'day in a row' : 'days in a row'),
  xp: 'XP',
  today: 'Today',
  todayPlan: (cards: number, level: number, boss: boolean) =>
    `${cards === 1 ? '1 card' : `${cards} cards`} in the warm-up · the sum · level ${level}${boss ? ' · weekly boss: Full count with double XP' : ''}`,
  doneToday: "Today's session is complete. You can take another one.",
  ownTrack: 'Point count has its own streak and XP, separate from the other tracks.',
  start: "Start today's session",
  techniques: 'Memory techniques',
  techniqueList: [
    { key: 'top', name: 'Count down from the top', text: 'Highest possible minus shown is the most he has left. "West has at most 17 and has shown 14, so he cannot have the ace."' },
    { key: 'anchors', name: 'Anchors', text: '40 in all and 10 per hand on average. A partner who passed a one-level suit opening has at most 5.' },
    { key: 'blocks', name: 'Blocks', text: 'Count the honours in a suit as one block: A K = 7, A Q = 6, K Q = 5, A K Q = 9, Q J = 3.' },
    { key: 'ranges', name: 'Range cards', text: 'The HCP ranges of the calls in the system file, e.g. 1NT 15–17 and a weak two 5–11.' },
  ],
  settings: 'Settings',
  data: 'Your data',
  exportReminder: 'It is more than a month since you last saved a copy of your Point count data.',
  exportNow: 'Export now',

  phases: { warmup: 'Warm-up', sum: 'The sum', level: 'Level', status: 'Status' },
  sessionMeta: (xp: number, boss: boolean) => `${xp} XP${boss ? ' · weekly boss' : ''}`,
  stop: 'Stop the session',
  exercises: {
    sum: 'The sum',
    running: 'Running count',
    can: 'Can he have it?',
    who: 'Who has it?',
    finesse: 'Finesse direction',
    full: 'Full count',
  },

  contract: (contract: string) => `South plays ${contract}`,
  auction: 'The bidding',
  pass: 'pass',
  noCall: 'no call',
  callRange: (call: string, range: string) => `${call} (${range})`,
  freePass: 'pass (no limit)',
  openingPassText: 'Pass in opening position: at most 11 HCP, because with 12 HCP or more you always open.',
  freePassText: 'Pass without a limit: a strong hand with no suitable call passes too.',
  noCallText: (seat: string) => `${seat} has not bid: no limit.`,
  dummy: 'Dummy (North)',
  you: 'You (South)',
  hand: (who: string) => `${who}'s hand`,
  opponentsHave: (points: number) => `The opponents have ${points} HCP`,
  lengths: 'The lengths from the 13-sudoku',
  lengthsLine: (west: string, east: string) => `West ${west} · East ${east}`,

  count: 'Count',
  range: 'Range',
  shown: 'Shown',
  left: 'Left',
  latest: 'Latest',
  plays: (seat: string, card: string) => `${seat} plays ${card}`,
  noClues: 'No honours have fallen yet.',
  clueCounter: (n: number, total: number) => `${n} of ${total}`,
  watch: 'Keep count: the honours are shown one at a time.',
  unseen: 'Unseen honours',
  notes: { W: 'W', E: 'E', open: '?' },
  noteNames: { none: 'no note', W: 'West', E: 'East', open: 'unsure' },
  chipLabel: (card: string, note: string) => `${card}: ${note}`,

  sumPrompt: 'How many points do the opponents have?',
  runningWest: 'How many points has West shown?',
  runningEast: 'And East?',
  canPrompt: (seat: string, card: string) => `Can ${seat} have ${card}?`,
  whoPrompt: (card: string) => `Who has ${card}?`,
  finessePrompt: (card: string) => `You must finesse against ${card}. Which way?`,
  yes: 'Yes',
  no: 'No',
  cantTell: "Can't tell",
  guess: "It's a guess",
  answers: 'Answers',

  facit: 'Answer',
  right: 'Right',
  rightSlow: 'Right, but over the time limit',
  half: 'Half right',
  wrong: 'Wrong',
  overconfident: "You couldn't know that yet.",
  gained: (xp: number) => `+${xp} XP`,
  next: 'Next',
  yourAnswer: (text: string) => `Your answer: ${text}`,
  sumFacit: (north: number, south: number, m: number) => `The opponents have 40 − ${north} − ${south} = ${m} HCP.`,
  runningFacit: (west: number, east: number) => `West has shown ${west} HCP and East ${east} HCP.`,
  runningAnswer: (west: number, east: number) => `West ${west}, East ${east}`,
  canFacit: (yes: boolean, seat: string, card: string) => (yes ? `Yes, ${seat} can have ${card}.` : `No, ${seat} cannot have ${card}.`),
  placementFacit: (holder: string, card: string) => `${card} is with ${holder}.`,
  openFacit: (card: string) => `${card}: can't tell.`,
  guessFacit: (card: string) => `The finesse against ${card} is a guess.`,
  otherCannot: (other: string, max: number, card: string, value: number, holder: string) =>
    `${other} can have at most ${max} HCP left, and ${card} is worth ${value}, so it is with ${holder}.`,
  otherCannotGap: (other: string, rest: string, card: string, value: number, holder: string, alone: boolean) =>
    `${other} can have ${rest} HCP left, and ${card} (${value}) does not fit${alone ? '' : ', not even together with the other unseen honours'}, so it is with ${holder}.`,
  mustHave: (holder: string, rest: string, cards: readonly string[]) =>
    `${holder} needs ${rest} more and can only get there with ${cards.length > 1 ? 'both ' : ''}${listEn(cards)}.`,
  bothFit: (card: string, west: number, east: number) =>
    `Both placements fit: ${card} with West gives West ${west} HCP, ${card} with East gives East ${east} HCP.`,
  usedUp: (seat: string, length: number, suit: number, cards: readonly string[], other: string) =>
    `${seat} ${length === 0 ? `has no ${SUIT_EN[suit]}s` : length === 1 ? `has shown his only ${SUIT_EN[suit]}` : `has shown all ${length} of his ${SUIT_EN[suit]}s`}, so ${listEn(cards)} ${cards.length === 1 ? 'is' : 'are'} with ${other}.`,
  noRoom: (seat: string, room: number, suit: number, cards: readonly string[], other: string) =>
    `${seat} has only ${room} ${SUIT_EN[suit]}${room === 1 ? '' : 's'} left, but there are ${cards.length} unseen ${SUIT_EN[suit]} honours (${cards.join(' ')}), so at least ${cards.length - room === 1 ? 'one' : cards.length - room} of them ${cards.length - room === 1 ? 'is' : 'are'} with ${other}.`,
  placements: 'The possible placements',
  placementLine: (west: string, east: string) => `West: ${west} · East: ${east}`,
  nothing: 'none',
  solverRest: (west: string, east: string) => `The solver's range left: West ${west} HCP, East ${east} HCP.`,
  finesseNote: 'A sure placement decides the direction of the finesse. The combination can be studied in Suit combinations under Analysis.',

  blockPrompt: 'How many HCP is the block?',
  rangePrompt: 'Which range does it show?',
  blocks: 'Blocks',
  rangeCards: 'Range cards',
  rangeNames: {
    'opening-1NT': 'Opening 1NT',
    'opening-1-suit': 'One-level suit opening',
    'opening-2NT': 'Opening 2NT',
    'opening-2C': 'Opening 2♣ (strong)',
    'opening-weak-2': 'Weak two opening',
    'opening-3': 'Three-level preempt',
    'overcall-1': 'One-level overcall',
    'overcall-2': 'Two-level overcall',
    'overcall-1NT': '1NT overcall',
    'takeout-double': 'Takeout double',
    'two-suited': 'Michaels cuebid and unusual 2NT',
    dont: 'DONT over 1NT',
    'dont-double': 'DONT double over 1NT',
    'opening-pass': 'Pass in opening position',
    'responder-pass-after-1-suit': "Responder passes partner's one-level suit opening",
    'responder-pass-after-1NT': "Responder passes partner's 1NT",
  },
  blockFacit: (cards: string, points: number) => `${cards} = ${points} HCP`,
  rangeFacit: (name: string, range: string) => `${name}: ${range} HCP`,

  sessionDone: 'The session is complete',
  sessionScore: (correct: string, total: number) => `${correct} of ${total} right`,
  sessionXp: (xp: number) => `${xp} XP in this session`,
  levelNow: (n: number, name: string) => `Level ${n}: ${name}`,
  toHome: 'To the Point count front page',

  levelInfo: 'Level',
  runningInfo: (seconds: string) => `Display time in the running count: ${seconds} s per honour.`,
  dataHelp: 'Your Point count data is stored only in this browser. Save a copy as a file and load it again on another device.',
  exportData: 'Export data',
  importData: 'Import data',
  importFile: 'Choose a file with Point count data',
  exported: 'The file has been saved.',
  imported: 'The data has been imported.',
  importErrors: {
    json: 'The file is not valid JSON.',
    'not-pointregnskab': 'The file does not contain Point count data.',
    newer: 'The file is from a newer version of the app.',
    invalid: 'The file is invalid.',
  },
  importSummary: (xp: number, items: number, sessions: number, streak: number) =>
    `The file has ${xp} XP, ${items} cards in the deck, ${sessions} sessions and a streak of ${streak}. Replace the data here?`,
  cancel: 'Cancel',
  replace: 'Replace',
  lastExport: (date: string) => `Last export: ${date}.`,
  neverExported: 'You have not exported yet.',
  dateText: (day: string) => {
    const [y, m, d] = dayParts(day);
    return `${d} ${MONTHS_EN[m - 1]} ${y}`;
  },

  help: {
    screen:
      'Point count trains counting high-card points (A 4, K 3, Q 2, J 1) as declarer: how many points do the opponents have, who has shown what, and where are the missing honours? Your level rises when more than 90% of your last 20 answers are right, and falls below 80%.',
    today:
      "Today's plan: a warm-up with blocks and range cards (the cards the Leitner system has scheduled for today, and up to 3 new ones), the sum and 3–4 tasks at your level. Every 7th session is the weekly boss with Full count and double XP.",
    start:
      'A session takes about 5 minutes: warm-up (45 s), the sum (45 s), level (3–4 tasks) and status. The timer is soft, so the task you are working on is always finished. The day counts in your streak when the status is shown.',
    techniques: 'Four ways to keep count at the table. The blocks and range cards are practised in the warm-up.',
    blocks: 'Count the honours in a suit as one block: A K = 7, A Q = 6, K Q = 5, A K Q = 9, Q J = 3. Type the points of the block; within 5 s is fast.',
    rangeCards:
      'The HCP ranges of the calls in the system file, e.g. 1NT 15–17 and a pass in opening position at most 11. Choose the range the call shows. Only the ranges are practised here, not the conventions.',
    settings: 'Your level, the display time in the running count and the separate export and import of your Point count data.',
    data: 'Point count has its own data. Export a copy as a file; an import first shows a summary and then replaces the data here. The data of the other tracks is not touched.',
    level:
      'Level 1: one range and one unseen honour. 2: several unseen honours. 3: both defenders have a range, so the range left must be used. 4: the honours are shown one at a time and the count panel is hidden. 5: full count with lengths.',
    exercises: {
      sum: "Count North's and South's high-card points and subtract them from 40. Type the answer; within 5 s gives 10 XP, otherwise 5.",
      running:
        'The honours are shown one at a time as they fall. Keep count in your head, and at the end type how many points West and East have shown. One of two numbers right gives half. The display time gets shorter after right answers and longer after mistakes.',
      can: 'Can the defender have the honour with the points his bidding allows? Answer yes if he can; no only if it is surely with the other defender.',
      who: "Answer West or East if the honour is in the same place in every placement that fits the bidding and the points shown; otherwise \"can't tell\". Answering as if sure when it can't be told is wrong.",
      finesse: 'Finesse against the defender who surely has the honour. If it is not surely with either of them, it is a guess.',
      full: 'Like Who has it?, but the suit lengths of West and East from a 13-sudoku are known: nobody can have more honours in a suit than he has cards in it.',
    },
    panel:
      'The count for each defender: range is the points his bidding allows, shown is the honours he has played, and left is range minus shown. The panel never reveals what the solver concludes, and it is hidden from level 4.',
    auction:
      "East and West's calls with the HCP ranges from the system file. A pass in opening position shows at most 11 HCP. Responder's pass shows 0–5 after a one-level suit opening and 0–7 after 1NT, but only when North–South passed in between. North–South's calls are not counted; only the contract is shown.",
    stream: 'The honours the defenders have played, newest first. They count as shown.',
    chips: 'The honours you have not seen. Tap a chip to note W, E or ? (no points). Notes are off from level 4.',
    lengths: "West's and East's lengths in ♠♥♦♣ order from a 13-sudoku. No defender can have more honours in a suit than he has cards in it.",
    facit:
      'The reason comes from the solver, which goes through every way the unseen honours can lie and keeps those that fit the bidding and the points shown. The range left is what each defender can have left.',
    status: 'The result of the session. The streak and XP belong to Point count, separate from the other tracks.',
  },
};

export const TEXT: Texts = new Proxy(DA, {
  get: (_target, key) => (getLang() === 'en' ? EN : DA)[key as keyof Texts],
});

/** Begge udgaver, til testene af, at de har samme form. */
export const TEXTS = { da: DA, en: EN } as const;
