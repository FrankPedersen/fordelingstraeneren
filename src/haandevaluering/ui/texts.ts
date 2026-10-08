import type { Card } from '../../domain/cards';
import { getLang } from '../../i18n';
import type { Exercise } from '../model/generator';
import type { Decision } from '../model/pmodel';
import type { HeImportError } from '../storage';
import type { Terms } from '../training/scoring';

const SUITS = ['♠', '♥', '♦', '♣'];

/** Kortets værdi: 0 = 2 … 8 = 10, 9 = knægt, 10 = dame, 11 = konge, 12 = es. */
const rankWith = (letters: readonly string[]) => (rank: number) => (rank >= 9 ? letters[rank - 9] : `${rank + 2}`);
const rankDa = rankWith(['B', 'D', 'K', 'E']);
const rankEn = rankWith(['J', 'Q', 'K', 'A']);

const MONTHS_DA = ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'december'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dayParts = (day: string) => day.split('-').map(Number);

/** Genvejens led og deres navne i ental og flertal. */
export type ShortcutKind = 'ace' | 'queen' | 'jack' | 'ten';

/** Leitner-bunkens grupper (nøglens første del). */
export type DeckGroup = 'anker' | 'korthed' | 'genvej' | 'moenster' | 'makker' | 'stik';

/** Al ordlyd i Håndevalueringens brugerflade på dansk. EN nedenfor har samme type. */
const DA = {
  title: 'Håndevaluering',
  back: 'Tilbage til forsiden',
  backToHome: 'Tilbage til Håndevaluering',
  saveFailed: 'Dine data kunne ikke gemmes i browseren. Eksportér en kopi under Indstillinger.',

  rank: rankDa,
  card: (card: Card) => `${SUITS[Math.floor(card / 13)]}${rankDa(card % 13)}`,
  you: 'Dig',
  partner: 'Makker',

  // Forsiden
  level: (n: number) => `Niveau ${n}`,
  levelNames: {
    1: 'honnørpoint og makkers krav',
    2: 'fordelingsled, og hvornår de må lægges til',
    3: 'niveaubeslutningen og spildte værdier',
    4: 'farve eller sans',
    5: 'blandede opgaver',
  } as Record<number, string>,
  streak: 'Streak',
  daysInRow: (n: number): string => (n === 1 ? 'dag i træk' : 'dage i træk'),
  xp: 'XP',
  today: 'I dag',
  todayPlan: (cards: number, level: number) =>
    `${cards === 1 ? '1 kort' : `${cards} kort`} til opvarmning · lynrunde med honnørpoint · niveau ${level}`,
  doneToday: 'Dagens session er gennemført. Du kan tage en til.',
  ownTrack: 'Håndevaluering har sin egen streak og XP, adskilt fra de andre spor.',
  start: 'Start dagens session',
  techniques: 'Husketeknikker',
  techniqueList: [
    { key: 'anchors', name: 'Ankre', text: 'Udgang, lilleslem og storeslem ved P = 28½ – 35 – 41.' },
    { key: 'tricks', name: 'Stik ≈ P/3', text: 'Huskeversionen af stikforventningen. Den ligger inden for 0,2 stik af tabellen fra P = 24 til 32.' },
    { key: 'shortcut', name: 'Genvejen', text: 'Honnørpoint = HCP + 1 pr. es − ½ pr. dame − ½ pr. knægt + ¼ pr. tier.' },
    { key: 'shortness', name: 'Korthed 5-3-1', text: 'Renonce 5, singleton 3 og dobbeltton 1, i begge hænder, men kun i sidefarverne.' },
    { key: 'rules', name: 'Tre huskeregler', text: '"Fit først", "Kun kongen spildes" og "Sans tæller stoppere, ikke længde".' },
    { key: 'patterns', name: 'Kortfarvepoint pr. mønster', text: 'Koblingen til fordelingssporet: 4-4-3-2 giver 1, 5-4-3-1 giver 3 og 6-4-3-0 giver 5.' },
  ],
  settings: 'Indstillinger',
  data: 'Dine data',
  exportReminder: 'Det er over en måned siden, du sidst gemte en kopi af Håndevalueringens data.',
  exportNow: 'Eksportér nu',

  // Sessionen
  phases: { warmup: 'Opvarmning', lightning: 'Lynrunde', level: 'Niveau', status: 'Status' },
  sessionMeta: (xp: number) => `${xp} XP`,
  stop: 'Afbryd sessionen',
  exercises: {
    honors: 'Honnørpoint',
    distribution: 'Fordelingsled',
    add: 'Må det lægges til?',
    decision: 'Niveaubeslutningen',
    partner: 'Hvad makker skal have',
    strain: 'Farve eller sans',
    wasted: 'Spildte værdier',
    compare: 'Sammenlign metoder',
    form: 'Turneringsform',
  } as Record<Exercise, string>,

  // Meldingerne
  auction: 'Meldinger',
  fitFound: (suit: string) => `Fit fundet i ${suit}`,
  partnerOpens: (call: string, range: string) => `Makker åbner ${call} (${range} hp)`,
  shortnessShown: (suit: string) => `Makker har vist korthed i ${suit}`,

  // Regnskabet
  count: 'Regnskab',
  rows: { honors: 'Honnørpoint', trump: 'Trumflængde', shortness: 'Korthed', wasted: 'Spildte værdier', p: 'p' },
  total: (P: string, tricks: string) => `P = ${P} · stik ≈ ${tricks}`,

  // Spørgsmålene
  honorsPrompt: 'Hvor mange honnørpoint har du?',
  distributionPrompt: (suit: string) => `Fitten i ${suit} er bekræftet. Hvad er din p nu?`,
  addPrompt: 'Hvilke led gælder for din hånd nu?',
  terms: { honors: 'Kun honnørpoint', distribution: 'Honnørpoint + fordeling', notrump: 'Sansmodellen' } as Record<Terms, string>,
  decisionPrompt: 'Hvilket niveau?',
  decisions: { partscore: 'Delkontrakt', game: 'Udgang', slam: 'Lilleslem', grand: 'Storeslem' } as Record<Decision, string>,
  partnerPrompt: (p: string) => `Du har ${p}. Hvad skal makker have til udgang?`,
  strainPrompt: 'Hvilken udgang?',
  wastedPrompt: (suit: string) => `Makker har vist korthed i ${suit}. Hvad er din p nu?`,
  answers: 'Svar',
  half: 'En halv',
  quarter: 'En kvart',
  erase: 'Slet',
  ok: 'OK',

  // Facit
  facit: 'Facit',
  right: 'Rigtigt',
  rightSlow: 'Rigtigt, men over tidsgrænsen',
  wrong: 'Forkert',
  gained: (xp: number) => `+${xp} XP`,
  next: 'Næste',
  yourAnswer: (text: string) => `Dit svar: ${text}`,
  shortcutFacit: (hcp: number, parts: readonly string[], total: string) =>
    `Genvejen: ${hcp} HCP${parts.length ? ` ${parts.join(' ')}` : ''} = ${total} honnørpoint.`,
  shortcutPart: (kind: ShortcutKind, count: number, value: string) => {
    const names = { ace: ['es', 'es'], queen: ['dame', 'damer'], jack: ['knægt', 'knægte'], ten: ['tier', 'tiere'] }[kind];
    return `${value} (${count === 1 ? names[0] : `${count} ${names[1]}`})`;
  },
  honorsPart: (points: string) => `Honnørpoint ${points}`,
  trumpPart: (points: string, trumps: number) => `trumflængde ${points} (${trumps} trumf)`,
  shortnessPart: (points: string, suits: readonly string[]) => `korthed ${points} (${suits.join(', ')})`,
  shortSuit: (length: number, suit: string) => `${['renonce', 'singleton', 'dobbeltton'][length]} i ${suit}`,
  wastedPart: (points: string, kings: readonly string[]) => `spildte værdier ${points} (${kings.join(' og ')} over for makkers korthed)`,
  pFacit: (parts: readonly string[], p: string) => `${parts.join(', ')}: p = ${p}.`,
  trumpShortNote: 'Korthed i trumffarven tæller ikke: en kort trumffarve giver ingen stjælestik.',
  onlyKingNote: 'Kun kongen spildes: en dame eller knægt over for makkers korthed koster ikke noget.',
  partnerFacit: (game: string, you: string, needs: string) => `${game} − ${you} = ${needs}: makker skal have ${needs}.`,
  addFacit: {
    honors: 'Fitten er ikke bekræftet, så kun honnørpointene tæller. Fordelingen lægges først til, når fitten er fundet.',
    distribution: 'Makker har mindst 5 kort i farven, og du har mindst 3, så fitten er bekræftet: honnørpoint + trumflængde og korthed.',
    notrump: 'Efter 1NT og uden firekortsmajor spilles der sans: HCP + ¼ pr. tier, ingen længdepoint, og stopperne tæller.',
  } as Record<Terms, string>,
  decisionFacit: (you: string, partner: string, P: string, decision: string) => `P = ${you} + ${partner} = ${P}: ${decision}.`,
  tricksLine: (tricks: string) => `Forventet antal stik: ca. ${tricks}.`,
  chanceLine: (contract: string, k: number, n: number) =>
    k === 0 ? `${contract} holder næsten aldrig.` : k === n ? `${contract} holder næsten altid.` : `${contract} holder ca. ${k} ud af ${n} gange.`,
  neighbours: (limit: string, below: string, at: string) =>
    `P ligger inden for ½ point af grænsen ${limit}, så både ${below.toLowerCase()} og ${at.toLowerCase()} er rigtige.`,
  controlsNote: (missing: number) => `Parret mangler ${missing} es, så slem er udelukket (højst ét es må mangle).`,
  caveat: (lo: string, hi: string) => `Tallene er dobbeltdummy (perfekt spil med alle kort synlige) og typisk ${lo}–${hi} stik for optimistiske.`,
  strainMajor: (contract: string, trumps: number, gain: string) => `Fit først: med ${trumps} trumf giver ${contract} ca. ${gain} stik mere end sans.`,
  strainNotrump: (lo: number, hi: number, k: number, n: number) =>
    `Ingen major-fit, og alle fire farver er stoppet: 3NT. Ved ${lo}–${hi} HCP holder 3NT ca. ${k} ud af ${n} gange med alle farver stoppet.`,

  // Opvarmningen
  deckGroups: {
    anker: 'Ankre',
    korthed: 'Korthed 5-3-1',
    genvej: 'Genvejen',
    moenster: 'Kortfarvepoint pr. mønster',
    makker: 'Hvad makker skal have',
    stik: 'Stikforventning',
  } as Record<DeckGroup, string>,
  anchorPrompt: { game: 'Grænsen for udgang: P ≥ ?', slam: 'Grænsen for lilleslem: P ≥ ?', grand: 'Grænsen for storeslem: P ≥ ?' } as Record<string, string>,
  shortnessPrompt: (length: number) => `Kortfarvepoint for en ${['renonce', 'singleton', 'dobbeltton'][length]}?`,
  shortcutPrompt: (kind: ShortcutKind) => `Genvejen: hvad lægges til HCP pr. ${{ ace: 'es', queen: 'dame', jack: 'knægt', ten: 'tier' }[kind]}?`,
  patternPrompt: (pattern: string) => `Kortfarvepoint for mønstret ${pattern}?`,
  tricksPrompt: (P: string) => `P = ${P}. Hvor mange stik i gennemsnit?`,
  deckFacit: (answer: string) => `Facit: ${answer}`,
  mnemonic: (value: string) => `Huskeversionen P/3 giver ${value}.`,

  // Status
  sessionDone: 'Sessionen er gennemført',
  sessionScore: (correct: number, total: number) => `${correct} af ${total} rigtige`,
  sessionXp: (xp: number) => `${xp} XP i denne session`,
  levelNow: (n: number, name: string) => `Niveau ${n}: ${name}`,
  toHome: 'Til Håndevalueringens forside',

  // Indstillinger og data
  levelInfo: 'Niveau',
  dataHelp: 'Håndevalueringens data ligger kun i denne browser. Gem en kopi som fil, og hent den igen på en anden enhed.',
  exportData: 'Eksportér data',
  importData: 'Importér data',
  importFile: 'Vælg en fil med Håndevalueringens data',
  exported: 'Filen er gemt.',
  imported: 'Dataene er importeret.',
  importErrors: {
    json: 'Filen er ikke gyldig JSON.',
    'not-haandevaluering': 'Filen indeholder ikke data fra Håndevaluering.',
    newer: 'Filen er fra en nyere version af appen.',
    invalid: 'Filen er ugyldig.',
  } as Record<HeImportError, string>,
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
      'Håndevaluering træner at regne din hånd med Franks P-model: honnørpoint (E 5, K 3, D 1½, B ½, 10 ¼), og når fitten er fundet også trumflængde og korthed. Parrets P afgør niveauet. Niveauet stiger, når over 90 % af de seneste 20 svar er rigtige, og falder under 80 %.',
    today:
      'Dagens plan: opvarmning med nøgletal og kortfarvepoint pr. mønster (de kort, Leitner-systemet har sat til i dag, og op til 3 nye), en lynrunde med honnørpoint og opgaver på dit niveau.',
    start:
      'En session tager ca. 5 minutter: opvarmning (45 s), lynrunde (45 s), niveauopgaver (150 s) og status. Timeren er blød, så opgaven, du er i gang med, gøres altid færdig. Dagen tæller i streaken, når status vises.',
    techniques: 'Nøgletallene og huskereglerne fra P-modellen. Ankrene, genvejen, korthed, stikforventningen og kortfarvepoint pr. mønster øves i opvarmningen.',
    settings: 'Dit niveau og Håndevalueringens egen eksport og import.',
    data: 'Håndevaluering har sine egne data. Eksportér en kopi som fil; en import viser først et resumé og erstatter så dataene her. De andre spors data røres ikke.',
    level:
      'Niveau 1: honnørpoint og hvad makker skal have. 2: fordelingsled, og hvornår de må lægges til. 3: niveaubeslutningen og spildte værdier. 4: farve eller sans. 5: blandede opgaver.',
    exercises: {
      honors: 'Tast honnørpointene: E 5, K 3, D 1½, B ½ og 10 ¼. Genvejen er HCP + 1 pr. es − ½ pr. dame − ½ pr. knægt + ¼ pr. tier. Inden for 8 s giver 10 XP, ellers 5.',
      distribution:
        'Fitten er bekræftet, så fordelingen tæller: 1½ pr. trumf ud over 4 og korthed 5-3-1 (renonce, singleton, dobbeltton) i sidefarverne. Tast din p; inden for 20 s giver 10 XP.',
      add: 'Fordelingen må først lægges til, når fitten er bekræftet. Uden fit tæller kun honnørpointene, og i sans gælder sansmodellen: HCP + ¼ pr. tier og stoppere i stedet for længde.',
      decision:
        'Læg din og makkers p sammen til P. Under 28½ er delkontrakt, fra 28½ udgang, fra 35 lilleslem (højst ét es må mangle) og fra 41 storeslem. Inden for ½ point af en grænse er begge nabovalg rigtige.',
      partner: 'Udgang kræver P = 28½, så makker skal have 28½ minus dine point. Tast svaret med ½ og ¼.',
      strain: 'Fit først: med en 8+ major-fit giver farvekontrakten 2–4 stik mere end sans. Uden major-fit og med alle fire farver stoppet er 3NT rigtigt.',
      wasted: 'Makker har vist korthed. En konge i den farve er spildt og koster 1; en dame eller knægt koster ikke noget. Tast din p igen.',
      compare: 'Samme hånd regnet med HCP, Zar og P: hvilken metode giver den rigtige kontrakt? Kommer i en senere version.',
      form: 'Niveaubeslutningen med zone og holdturnering eller parturnering. Kommer i en senere version.',
    } as Record<Exercise, string>,
    count:
      'Regnskabet for dig og makker: honnørpoint, trumflængde (1½ pr. trumf ud over 4), korthed i sidefarverne og spildte konger. p er summen, og P er parrets samlede p. Stikforventningen kommer fra tabellen i MODEL.md.',
    auction:
      'Meldingerne viser, hvad der er kendt: en bekræftet fit, makkers åbning med hp-intervallet fra systemfilen eller makkers viste korthed. Begge hænder er synlige i denne version.',
    facit:
      'Facit regnes af P-modellen: honnørpoint, trumflængde og korthed, parrets P og tabellen over stik og chancer. Chancen vises som naturlig frekvens, fx 3 ud af 5 gange.',
    status: 'Sessionens resultat. Streak og XP er Håndevalueringens egne, adskilt fra de andre spor.',
    deck: {
      anker: 'Ankrene for niveaubeslutningen: udgang ved P = 28½, lilleslem ved 35 og storeslem ved 41. Tast tallet med ½.',
      korthed: 'Kortfarvepoint i farvekontrakt: renonce 5, singleton 3 og dobbeltton 1. De tælles i begge hænder, men kun i sidefarverne.',
      genvej: 'Genvejen fra HCP til honnørpoint: + 1 pr. es, − ½ pr. dame, − ½ pr. knægt og + ¼ pr. tier. Kongen er den samme.',
      moenster: 'Kortfarvepoint pr. mønster er summen over farverne: 5 for en renonce, 3 for en singleton og 1 for en dobbeltton.',
      makker: 'Udgang kræver P = 28½, så makker skal have 28½ minus dine point.',
      stik: 'Stikforventningen er tabellen fra MODEL.md. Huskeversionen er P/3, som ligger inden for 0,2 stik fra P = 24 til 32.',
    } as Record<DeckGroup, string>,
  },
};

export type Texts = typeof DA;

const EN: Texts = {
  title: 'Hand evaluation',
  back: 'Back to the front page',
  backToHome: 'Back to Hand evaluation',
  saveFailed: 'Your data could not be saved in the browser. Export a copy under Settings.',

  rank: rankEn,
  card: (card: Card) => `${SUITS[Math.floor(card / 13)]}${rankEn(card % 13)}`,
  you: 'You',
  partner: 'Partner',

  level: (n: number) => `Level ${n}`,
  levelNames: {
    1: "honour points and partner's needs",
    2: 'distribution points, and when they may be added',
    3: 'the level decision and wasted values',
    4: 'suit or notrump',
    5: 'mixed tasks',
  },
  streak: 'Streak',
  daysInRow: (n: number): string => (n === 1 ? 'day in a row' : 'days in a row'),
  xp: 'XP',
  today: 'Today',
  todayPlan: (cards: number, level: number) =>
    `${cards === 1 ? '1 card' : `${cards} cards`} in the warm-up · lightning round with honour points · level ${level}`,
  doneToday: "Today's session is complete. You can take another one.",
  ownTrack: 'Hand evaluation has its own streak and XP, separate from the other tracks.',
  start: "Start today's session",
  techniques: 'Memory techniques',
  techniqueList: [
    { key: 'anchors', name: 'Anchors', text: 'Game, small slam and grand slam at P = 28½ – 35 – 41.' },
    { key: 'tricks', name: 'Tricks ≈ P/3', text: 'The short version of the expected tricks. It is within 0.2 tricks of the table from P = 24 to 32.' },
    { key: 'shortcut', name: 'The shortcut', text: 'Honour points = HCP + 1 per ace − ½ per queen − ½ per jack + ¼ per ten.' },
    { key: 'shortness', name: 'Shortness 5-3-1', text: 'Void 5, singleton 3 and doubleton 1, in both hands, but only in the side suits.' },
    { key: 'rules', name: 'Three rules', text: '"Fit first", "Only the king is wasted" and "Notrump counts stoppers, not length".' },
    { key: 'patterns', name: 'Shortness points per pattern', text: 'The link to the distribution track: 4-4-3-2 gives 1, 5-4-3-1 gives 3 and 6-4-3-0 gives 5.' },
  ],
  settings: 'Settings',
  data: 'Your data',
  exportReminder: 'It is more than a month since you last saved a copy of your Hand evaluation data.',
  exportNow: 'Export now',

  phases: { warmup: 'Warm-up', lightning: 'Lightning round', level: 'Level', status: 'Status' },
  sessionMeta: (xp: number) => `${xp} XP`,
  stop: 'Stop the session',
  exercises: {
    honors: 'Honour points',
    distribution: 'Distribution points',
    add: 'May it be added?',
    decision: 'The level decision',
    partner: 'What partner needs',
    strain: 'Suit or notrump',
    wasted: 'Wasted values',
    compare: 'Compare methods',
    form: 'Form of scoring',
  },

  auction: 'Bidding',
  fitFound: (suit: string) => `Fit found in ${suit}`,
  partnerOpens: (call: string, range: string) => `Partner opens ${call} (${range} HCP)`,
  shortnessShown: (suit: string) => `Partner has shown shortness in ${suit}`,

  count: 'Count',
  rows: { honors: 'Honour points', trump: 'Trump length', shortness: 'Shortness', wasted: 'Wasted values', p: 'p' },
  total: (P: string, tricks: string) => `P = ${P} · tricks ≈ ${tricks}`,

  honorsPrompt: 'How many honour points do you have?',
  distributionPrompt: (suit: string) => `The fit in ${suit} is confirmed. What is your p now?`,
  addPrompt: 'Which terms count for your hand now?',
  terms: { honors: 'Honour points only', distribution: 'Honour points + distribution', notrump: 'The notrump model' },
  decisionPrompt: 'Which level?',
  decisions: { partscore: 'Partscore', game: 'Game', slam: 'Small slam', grand: 'Grand slam' },
  partnerPrompt: (p: string) => `You have ${p}. What does partner need for game?`,
  strainPrompt: 'Which game?',
  wastedPrompt: (suit: string) => `Partner has shown shortness in ${suit}. What is your p now?`,
  answers: 'Answers',
  half: 'A half',
  quarter: 'A quarter',
  erase: 'Delete',
  ok: 'OK',

  facit: 'Answer',
  right: 'Right',
  rightSlow: 'Right, but over the time limit',
  wrong: 'Wrong',
  gained: (xp: number) => `+${xp} XP`,
  next: 'Next',
  yourAnswer: (text: string) => `Your answer: ${text}`,
  shortcutFacit: (hcp: number, parts: readonly string[], total: string) =>
    `The shortcut: ${hcp} HCP${parts.length ? ` ${parts.join(' ')}` : ''} = ${total} honour points.`,
  shortcutPart: (kind: ShortcutKind, count: number, value: string) => {
    const names = { ace: ['ace', 'aces'], queen: ['queen', 'queens'], jack: ['jack', 'jacks'], ten: ['ten', 'tens'] }[kind];
    return `${value} (${count === 1 ? names[0] : `${count} ${names[1]}`})`;
  },
  honorsPart: (points: string) => `Honour points ${points}`,
  trumpPart: (points: string, trumps: number) => `trump length ${points} (${trumps} trumps)`,
  shortnessPart: (points: string, suits: readonly string[]) => `shortness ${points} (${suits.join(', ')})`,
  shortSuit: (length: number, suit: string) => `${['void', 'singleton', 'doubleton'][length]} in ${suit}`,
  wastedPart: (points: string, kings: readonly string[]) => `wasted values ${points} (${kings.join(' and ')} opposite partner's shortness)`,
  pFacit: (parts: readonly string[], p: string) => `${parts.join(', ')}: p = ${p}.`,
  trumpShortNote: 'Shortness in the trump suit does not count: a short trump suit gives no ruffs.',
  onlyKingNote: "Only the king is wasted: a queen or jack opposite partner's shortness costs nothing.",
  partnerFacit: (game: string, you: string, needs: string) => `${game} − ${you} = ${needs}: partner needs ${needs}.`,
  addFacit: {
    honors: 'The fit is not confirmed, so only the honour points count. Distribution is added only once the fit is found.',
    distribution: 'Partner has at least 5 cards in the suit and you have at least 3, so the fit is confirmed: honour points + trump length and shortness.',
    notrump: 'After 1NT and without a four-card major you play notrump: HCP + ¼ per ten, no length points, and the stoppers count.',
  },
  decisionFacit: (you: string, partner: string, P: string, decision: string) => `P = ${you} + ${partner} = ${P}: ${decision}.`,
  tricksLine: (tricks: string) => `Expected tricks: about ${tricks}.`,
  chanceLine: (contract: string, k: number, n: number) =>
    k === 0 ? `${contract} almost never makes.` : k === n ? `${contract} almost always makes.` : `${contract} makes about ${k} times in ${n}.`,
  neighbours: (limit: string, below: string, at: string) =>
    `P is within ½ point of the limit ${limit}, so both ${below.toLowerCase()} and ${at.toLowerCase()} are right.`,
  controlsNote: (missing: number) => `The pair is missing ${missing} aces, so slam is ruled out (at most one ace may be missing).`,
  caveat: (lo: string, hi: string) => `The figures are double dummy (perfect play with all cards visible) and typically ${lo}–${hi} tricks too optimistic.`,
  strainMajor: (contract: string, trumps: number, gain: string) => `Fit first: with ${trumps} trumps ${contract} takes about ${gain} tricks more than notrump.`,
  strainNotrump: (lo: number, hi: number, k: number, n: number) =>
    `No major fit, and all four suits are stopped: 3NT. With ${lo}–${hi} HCP, 3NT makes about ${k} times in ${n} with all suits stopped.`,

  deckGroups: {
    anker: 'Anchors',
    korthed: 'Shortness 5-3-1',
    genvej: 'The shortcut',
    moenster: 'Shortness points per pattern',
    makker: 'What partner needs',
    stik: 'Expected tricks',
  },
  anchorPrompt: { game: 'The limit for game: P ≥ ?', slam: 'The limit for small slam: P ≥ ?', grand: 'The limit for grand slam: P ≥ ?' },
  shortnessPrompt: (length: number) => `Shortness points for a ${['void', 'singleton', 'doubleton'][length]}?`,
  shortcutPrompt: (kind: ShortcutKind) => `The shortcut: what is added to HCP per ${kind}?`,
  patternPrompt: (pattern: string) => `Shortness points for the pattern ${pattern}?`,
  tricksPrompt: (P: string) => `P = ${P}. How many tricks on average?`,
  deckFacit: (answer: string) => `Answer: ${answer}`,
  mnemonic: (value: string) => `The short version P/3 gives ${value}.`,

  sessionDone: 'The session is complete',
  sessionScore: (correct: number, total: number) => `${correct} of ${total} right`,
  sessionXp: (xp: number) => `${xp} XP in this session`,
  levelNow: (n: number, name: string) => `Level ${n}: ${name}`,
  toHome: 'To the Hand evaluation front page',

  levelInfo: 'Level',
  dataHelp: 'Your Hand evaluation data is stored only in this browser. Save a copy as a file and load it again on another device.',
  exportData: 'Export data',
  importData: 'Import data',
  importFile: 'Choose a file with Hand evaluation data',
  exported: 'The file has been saved.',
  imported: 'The data has been imported.',
  importErrors: {
    json: 'The file is not valid JSON.',
    'not-haandevaluering': 'The file does not contain Hand evaluation data.',
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
      "Hand evaluation trains valuing your hand with Frank's P-model: honour points (A 5, K 3, Q 1½, J ½, 10 ¼), and once the fit is found also trump length and shortness. The pair's P decides the level. Your level rises when more than 90% of your last 20 answers are right, and falls below 80%.",
    today:
      "Today's plan: a warm-up with key numbers and shortness points per pattern (the cards the Leitner system has scheduled for today, and up to 3 new ones), a lightning round with honour points and tasks at your level.",
    start:
      'A session takes about 5 minutes: warm-up (45 s), lightning round (45 s), level tasks (150 s) and status. The timer is soft, so the task you are working on is always finished. The day counts in your streak when the status is shown.',
    techniques: 'The key numbers and rules of the P-model. The anchors, the shortcut, shortness, the expected tricks and shortness points per pattern are practised in the warm-up.',
    settings: 'Your level and the separate export and import of your Hand evaluation data.',
    data: 'Hand evaluation has its own data. Export a copy as a file; an import first shows a summary and then replaces the data here. The data of the other tracks is not touched.',
    level:
      "Level 1: honour points and what partner needs. 2: distribution points, and when they may be added. 3: the level decision and wasted values. 4: suit or notrump. 5: mixed tasks.",
    exercises: {
      honors: 'Type the honour points: A 5, K 3, Q 1½, J ½ and 10 ¼. The shortcut is HCP + 1 per ace − ½ per queen − ½ per jack + ¼ per ten. Within 8 s gives 10 XP, otherwise 5.',
      distribution:
        'The fit is confirmed, so distribution counts: 1½ per trump beyond 4 and shortness 5-3-1 (void, singleton, doubleton) in the side suits. Type your p; within 20 s gives 10 XP.',
      add: 'Distribution may be added only once the fit is confirmed. Without a fit only the honour points count, and in notrump the notrump model applies: HCP + ¼ per ten and stoppers instead of length.',
      decision:
        "Add your p and partner's p to get P. Below 28½ is partscore, from 28½ game, from 35 small slam (at most one ace missing) and from 41 grand slam. Within ½ point of a limit both neighbouring choices are right.",
      partner: 'Game needs P = 28½, so partner needs 28½ minus your points. Type the answer with ½ and ¼.',
      strain: 'Fit first: with an 8+ major fit the suit contract takes 2–4 tricks more than notrump. Without a major fit and with all four suits stopped, 3NT is right.',
      wasted: 'Partner has shown shortness. A king in that suit is wasted and costs 1; a queen or jack costs nothing. Type your p again.',
      compare: 'The same hand valued with HCP, Zar and P: which method gives the right contract? Coming in a later version.',
      form: 'The level decision with vulnerability and teams or pairs scoring. Coming in a later version.',
    },
    count:
      "The count for you and partner: honour points, trump length (1½ per trump beyond 4), shortness in the side suits and wasted kings. p is the sum, and P is the pair's total. The expected tricks come from the table in MODEL.md.",
    auction:
      "The bidding shows what is known: a confirmed fit, partner's opening with the HCP range from the system file or partner's shown shortness. Both hands are visible in this version.",
    facit:
      "The answer is worked out by the P-model: honour points, trump length and shortness, the pair's P and the table of tricks and chances. The chance is shown as a natural frequency, e.g. 3 times in 5.",
    status: 'The result of the session. The streak and XP belong to Hand evaluation, separate from the other tracks.',
    deck: {
      anker: 'The anchors of the level decision: game at P = 28½, small slam at 35 and grand slam at 41. Type the number with ½.',
      korthed: 'Shortness points in a suit contract: void 5, singleton 3 and doubleton 1. They count in both hands, but only in the side suits.',
      genvej: 'The shortcut from HCP to honour points: + 1 per ace, − ½ per queen, − ½ per jack and + ¼ per ten. The king is the same.',
      moenster: 'Shortness points per pattern are the sum over the suits: 5 for a void, 3 for a singleton and 1 for a doubleton.',
      makker: 'Game needs P = 28½, so partner needs 28½ minus your points.',
      stik: 'The expected tricks are the table from MODEL.md. The short version is P/3, which is within 0.2 tricks from P = 24 to 32.',
    },
  },
};

export const TEXT: Texts = new Proxy(DA, {
  get: (_target, key) => (getLang() === 'en' ? EN : DA)[key as keyof Texts],
});

/** Begge udgaver, til testene af, at de har samme form. */
export const TEXTS = { da: DA, en: EN } as const;
