import type { Card } from '../../domain/cards';
import type { Seat } from '../../domain/dealer';
import { getLang } from '../../i18n';
import type { Niveau, Ovelse } from '../model/generator';
import type { MsImportError } from '../storage';

/**
 * Al ordlyd i Modspils brugerflade (SPEC-modspil.md, trin 2) på dansk; EN nedenfor har samme type. Instruktioner og
 * forklaringer står i beskrivende form; knapper og øvelsernes navne må stå i bydeform (../CLAUDE.md). Farvesymbolerne
 * står i teksten, og brugerfladen gør ♥ og ♦ røde.
 */

const FARVE_DA = ['spar', 'hjerter', 'ruder', 'klør'];
const FARVE_EN = ['spades', 'hearts', 'diamonds', 'clubs'];
const KORTFARVE_DA = ['Spar', 'Hjerter', 'Ruder', 'Klør'];
const KORTFARVE_EN = ['spades', 'hearts', 'diamonds', 'clubs'];
const HONNOER_DA: Record<number, string> = { 11: 'knægt', 12: 'dame', 13: 'konge', 14: 'es' };
const HONNOER_EN: Record<number, string> = { 11: 'Jack', 12: 'Queen', 13: 'King', 14: 'Ace' };
const DATO_DA = ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'december'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dagDele = (day: string) => day.split('-').map(Number);

/** "4 eller 5", "1, 3 eller 5". */
const ellerMed = (ord: string) => (xs: readonly (string | number)[]) =>
  xs.length > 1 ? `${xs.slice(0, -1).join(', ')} ${ord} ${xs[xs.length - 1]}` : String(xs[0] ?? '');
/** "♠E og ♠B". */
const ogMed = (ord: string) => (xs: readonly string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} ${ord} ${xs[xs.length - 1]}` : (xs[0] ?? ''));

const DA = {
  titel: 'Modspil',
  tilbage: 'Tilbage til forsiden',
  tilbageTilSporet: 'Tilbage til Modspil',
  gemFejl: 'Dine data kunne ikke gemmes i browseren. En kopi kan eksporteres under Indstillinger.',

  // Kort, farver og pladser
  farve: (f: number) => FARVE_DA[f],
  kortLabel: (farve: number, vaerdi: number) => `${KORTFARVE_DA[farve]} ${HONNOER_DA[vaerdi] ?? vaerdi}`,
  plads: { W: 'Vest', N: 'Nord', E: 'Øst', S: 'Syd' } as Record<Seat, string>,
  pladsKort: { W: 'V', N: 'N', E: 'Ø', S: 'S' } as Record<Seat, string>,
  eller: ellerMed('eller'),
  og: ogMed('og'),
  hp: (n: number | string) => `${n} hp`,

  // Sporets forside
  niveau: (n: number) => `Niveau ${n}`,
  niveauNavne: {
    1: 'makkers point, regel 11 og 12 og udspillets længde',
    2: 'markeringerne og Vælg kortet',
    3: 'første afkast, forsinket kald og "kan ikke afgøres"',
    4: 'meldingerne indskrænker svaret',
    5: 'tvetydige markeringer',
  } as Record<Niveau, string>,
  niveauNu: (n: number, navn: string) => `Niveau ${n}: ${navn}`,
  dageITraek: (n: number): string => (n === 1 ? 'dag i træk' : 'dage i træk'),
  xp: 'XP',
  iDag: 'I dag',
  dagensPlan: (repetition: number, opgaver: number, niveau: number) =>
    `${opgaver} opgaver på niveau ${niveau}${repetition ? `, heraf ${repetition === 1 ? 'én øvelse' : `${repetition} øvelser`} til repetition` : ''}.`,
  gennemfoertIDag: 'Dagens session er gennemført. Du kan tage en til.',
  egetSpor: 'Modspil har sin egen streak og XP, adskilt fra de andre spor.',
  start: 'Start dagens session',
  metoder: 'Metoderne',
  dinProfil: (navn: string) => `Profilen er ${navn}. Facit og forklaringer følger dens metoder.`,
  indstillinger: 'Indstillinger',
  eksportPaamindelse: 'Det er over en måned siden, du sidst gemte en kopi af Modspils data.',
  eksportNu: 'Eksportér nu',

  // Sessionen
  faser: { repetition: 'Repetition', niveau: 'På dit niveau' },
  sessionMeta: (xp: number) => `${xp} XP`,
  afbryd: 'Afbryd sessionen',
  sessionGennemfoert: 'Sessionen er gennemført',
  sessionScore: (rigtige: number, i_alt: number) => `${rigtige} af ${i_alt} rigtige.`,
  sessionXp: (xp: number) => `+${xp} XP i sessionen.`,
  streak: 'Streak',

  // Opgaven
  hoved: (niveau: number, nummer: number, antal: number) => `Niveau ${niveau} · opgave ${nummer} af ${antal}`,
  status: 'Sessionen',
  meldeforloebet: 'Meldeforløbet',
  aabning: (melding: string, interval: string) => `${melding}: ${interval} hp.`,
  aabningsPas: (plads: string, interval: string) => `Pas fra ${plads}: ${interval} hp.`,
  kontrakt: (kontrakt: string) => `Syd spiller ${kontrakt}.`,
  bordet: 'bordet',
  dig: 'dig',
  dineKort: (farve: number) => `dine ${FARVE_DA[farve]}`,
  afkastet: 'afkast',
  spilfoerer: 'spilfører',
  resten: 'Resten af hånden',
  stik: (nummer: number) => `Stik ${nummer}`,
  udspilMidte: (kort: string) => `udspil ${kort}`,
  skalLaegge: (plads: string) => `${plads} skal lægge til`,
  stikLabel: (nummer: number, kort: string[]) => `Stik ${nummer}: ${kort.join(', ')}`,
  tidligere: 'Spillet før',
  ovelser: {
    point: 'Makkers point',
    regel11: 'Regel 11 og 12',
    laengde: 'Udspillets længde',
    markering: 'Aflæs markeringen',
    'vaelg-kort': 'Vælg kortet',
    afkast: 'Første afkast',
    forsinket: 'Forsinket kald',
  } as Record<Ovelse, string>,
  regel11: 'Regel 11',
  vaelgAfkastet: 'Vælg afkastet',
  ovelseHjaelp: {
    point:
      'Makkers hp er 40 minus dine, bordets og spilførers. Spilførers interval kommer fra hans åbning, og et pas i åbningsposition viser højst 11 hp.',
    regel11:
      'Med 4.-højeste har de tre andre hænder 11 minus udspillets værdi kort over udspillet; med 3.-højeste 12 minus værdien. Bordets og dine kort over udspillet trækkes fra.',
    laengde: 'Udspilsreglen og de kort, du kan se, afgør, hvor mange kort makker kan have i farven. Er der flere end to muligheder, kan det ikke afgøres.',
    markering: 'Makkers tilspil læses efter jeres aftale om kald og afvisning, romersk kald eller længde. Et kort er lavt, når det er et af de to laveste, du ikke kan se.',
    'vaelg-kort': 'Du vælger det kort, der viser makker det, du vil have, efter jeres aftale. Aftalen står under spørgsmålet.',
    afkast: 'Første gang en modspiller ikke kan bekende, viser afkastet, hvilken farve han vil have spillet, efter jeres aftale om afkast.',
    forsinket: 'I spilførers første farve viser rækkefølgen af kortene, om modspilleren spiller passivt (lav-høj) eller aktivt (høj-lav).',
  } as Record<Ovelse, string>,
  maerkeLabel: (profil: string, metode?: string) => (metode ? `${profil} · ${metode}` : profil),

  // Spørgsmålene
  pointSpm: 'Hvor mange hp kan makker have?',
  udspilFjerde: 'Makker spiller 4.-højeste ud.',
  udspilEfter: (metode: string) => `Makker spiller ud efter ${metode}.`,
  regel11Spm: (farve: number, kort: string) => `Hvor mange ${FARVE_DA[farve]} over ${kort} har spilfører?`,
  laengdeSpm: (farve: number) => `Hvor mange ${FARVE_DA[farve]} har makker?`,
  markeringSpm: (kort: string) => `Makker lægger ${kort} til dit udspil. Hvad viser kortet?`,
  markeringLaengdeSpm: (kort: string, farve: number) => `Makker lægger ${kort} til dit udspil. Hvor mange ${FARVE_DA[farve]} har spilfører?`,
  vaelgKortSpm: (onske: 'kald' | 'afvisning' | 'skift', farve: number, til: number) =>
    `${onske === 'kald' ? `Du vil have makker til at fortsætte i ${FARVE_DA[farve]}.` : onske === 'afvisning' ? `Du vil afvise ${FARVE_DA[farve]}.` : `Du vil have makker til at skifte til ${FARVE_DA[til]}.`} Hvilket kort i ${FARVE_DA[farve]} lægger du?`,
  afkastAflaesSpm: (kort: string) => `Makker kan ikke bekende og kaster ${kort} af. Hvad beder afkastet om?`,
  afkastVaelgSpm: (farve: number) => `Du kan ikke bekende og vil have makker til at spille ${FARVE_DA[farve]}. Hvilket kort kaster du af?`,
  forsinketAflaesSpm: (foerste: string, anden: string) => `Makker lægger ${foerste} og så ${anden} i spilførers første farve. Hvad viser rækkefølgen?`,
  forsinketVaelgSpm: (onske: 'passiv' | 'aktiv', farve: number) =>
    `${onske === 'passiv' ? 'Du vil spille passivt' : 'Du vil have makker til at skifte farve'} og lægger til i ${FARVE_DA[farve]}. Hvilket kort lægger du?`,
  aftalen: (metode: string) => `Aftalen: ${metode}`,
  tip: 'Tip: 11 − udspillets værdi = kort over udspillet hos de tre andre hænder.',

  // Svarene
  svar: 'Svar',
  svarKnap: 'Svar',
  hvilke: 'Hvilke?',
  hvilkeSpm: (n: number, kort: string) => `Hvilke ${n === 1 ? 'kort' : `${n} kort`} over ${kort} har spilfører?`,
  kanIkke: 'Kan ikke afgøres',
  tvetydig: 'Tvetydig',
  kald: 'Kald',
  kaldTil: (farve: string) => `Kald til ${farve}`,
  afvisning: 'Afvisning',
  skifteTil: (farve: string) => `Skifte til ${farve}`,
  passivt: 'Passivt',
  aktivt: 'Aktivt',

  // Facit
  rigtigt: 'Rigtigt',
  forkert: 'Forkert',
  dom: (rigtigt: boolean, facit: string) => `${rigtigt ? 'Rigtigt' : 'Forkert'}: ${facit}`,
  ditSvar: 'Dit svar',
  xpVundet: (xp: number) => `+${xp} XP`,
  iTraek: (n: number) => `${n} rigtige i træk`,
  facit: {
    kanIkke: 'det kan ikke afgøres',
    tvetydig: 'markeringen er tvetydig',
    point: (interval: string) => `makker har ${interval} hp`,
    regel11: (n: number) => `spilfører har ${n}`,
    regel11Hvilke: (n: number, kort: string) => `spilfører har ${n}: ${kort}`,
    laengde: (laengder: string) => `makker har ${laengder} kort`,
    spilfoerersLaengde: (laengder: string) => `spilfører har ${laengder} kort`,
    kald: 'makker kalder',
    afvisning: 'makker afviser',
    skifte: (farve: string) => `makker vil have skifte til ${farve}`,
    kort: (kort: string) => `kortet er ${kort}`,
    afkastKald: (farve: string) => `afkastet kalder til ${farve}`,
    afkastAfvisning: (farve: string) => `afkastet afviser ${farve}`,
    afkastBeder: (farve: string) => `afkastet beder om ${farve}`,
    passiv: 'makker spiller passivt',
    aktiv: 'makker vil have en anden farve',
  },
  regnestykket: 'Regnestykket',
  regning: {
    iAlt: '40 hp i alt',
    dig: 'Dig',
    bordet: 'Bordet',
    tilsammen: 'Makker og spilfører',
    spilfoererViste: (melding: string) => `Spilfører viste med ${melding}`,
    makker: 'Makker',
    overIAlt: (kort: string) => `Over ${kort} i alt`,
    bordetKort: (kort: string) => `Bordet: ${kort || 'ingen'}`,
    digKort: (kort: string) => `Dig: ${kort || 'ingen'}`,
    spilfoerer: 'Spilfører',
  },
  vedBordet: 'Ved bordet',
  ved: {
    point: 'Hver honnør, makker viser under spillet, trækkes fra intervallet. Så ved du hele tiden, hvor meget makker højst har tilbage.',
    regel11: (n: number, kort: string) =>
      `Spilfører har ${n} kort over ${kort}. Det afgør, hvor højt du skal lægge til, og om farven kan spilles igen, når du kommer ind.`,
    uklar: 'Når kortene ikke afgør det, venter du på flere kort i farven og tæller videre, når de falder.',
    laengde: (laengder: string, farve: number) =>
      `Makker har ${laengder} ${FARVE_DA[farve]}. Med bordets og dine kort ved du så, hvor mange spilfører har, og hvornår han er renonce.`,
    kald: 'Makker kalder, så farven fortsættes, når det er muligt.',
    afvisning: 'Makker afviser, så et skifte til en anden farve er bedre, når du er inde igen.',
    skifte: (farve: string) => `Makker vil have ${farve}, så det er den farve, du spiller, når du er inde igen.`,
    skifteUklar: 'Makker vil have et skifte, men retningen er uklar, så meldingerne og bordets kort afgør, hvilken farve du vælger.',
    tvetydig: 'Markeringen er tvetydig, så du vejer den med meldingerne og bordets kort.',
    spilfoerersLaengde: 'Med spilførers længde ved du, hvor mange stik farven kan give ham, og hvornår han er renonce.',
    vaelgKort: 'Makker læser dit kort efter aftalen og ved så, om farven skal fortsættes, eller hvilken farve han skal skifte til.',
    afkastBeder: (farve: string) => `Makker beder om ${farve}, så det er farven, du spiller, når du kommer ind.`,
    afkastAfviser: (farve: string) => `Makker beder ikke om ${farve}, så du spiller en anden farve, når du kommer ind.`,
    afkastVaelg: (farve: string) => `Med dit afkast ved makker, at han skal spille ${farve}, når han kommer ind.`,
    afkastTvetydig: 'Intet afkast er sikkert her, så det bedste kort er det, makker oftest læser rigtigt.',
    passiv: 'Makker er passiv, så farven fortsættes, og intet vigtigere skal fortælles.',
    aktiv: 'Makker vil have en anden farve, så du skifter farve, når du kommer ind.',
    vaelgPassiv: 'Lav-høj fortæller makker, at du er passiv, og at farven kan fortsættes.',
    vaelgAktiv: 'Høj-lav fortæller makker, at du vil have et skifte, når han kommer ind.',
  },
  ordbog: {
    honnoerpoint: 'Honnørpoint i ordbogen',
    'regel-11': 'Regel 11 i ordbogen',
    udspil: 'Udspil i ordbogen',
    fjerdehoejeste: '4.-højeste i ordbogen',
    'kald-afvisning': 'Kald og afvisning i ordbogen',
    modspilssignal: 'Modspilssignal i ordbogen',
    fordelingssignal: 'Fordelingssignal i ordbogen',
    afkast: 'Afkast i ordbogen',
    'lavinthal-signal': 'Lavinthal i ordbogen',
  } as Record<string, string>,
  naeste: 'Næste opgave',

  // Øvelse 8, Find udspillet (SPEC-modspil-v2.md, trin 3, og mock-up'en i docs/specs/design/modspil-v2/)
  udspil: {
    navn: 'Find udspillet',
    hjaelp:
      'Du sidder som Vest og vælger udspillet ud fra din hånd og meldeforløbet: farven på niveau 1–2 og fra niveau 3 kortet efter profilens udspilsregel. Facit er regnet med dobbeltdummy på 100 fordelinger, der passer med meldingerne, og det bedste udspil giver flest stik i gennemsnit.',
    spmFarve: 'Hvilken farve spilles ud?',
    spmKort: 'Hvilket kort spilles ud?',
    vist: (min: number, max: number) => `Syd har vist ${min}–${max} hp.`,
    duSpillerUd: 'Du spiller ud.',
    allePasser: 'alle passer',
    antalKort: (n: number) => `${n} kort`,
    farveLabel: (farve: number, n: number) => `${KORTFARVE_DA[farve]}, ${n} kort`,
    flestStik: (svar: readonly string[]) => `${ogMed('og')(svar)} giver flest stik`,
    koster: (pris: string) => `koster ${pris} stik i snit`,
    kosterUnder: (pris: string) => `koster under ${pris} stik i snit`,
    kolonner: ['Udspil', 'Stik', 'Sætter', 'Koster'],
    tabelNavn: 'Udspillene',
    bedst: 'bedst',
    ditSvarRaekke: 'dit svar',
    procent: (n: number) => `${n} %`,
    tabelNote: (kontrakt: string, n: number) =>
      `Middelstik til modspillet og chancen for at sætte ${kontrakt} over ${n} fordelinger, der passer med meldingerne (dobbeltdummy).`,
    henter: 'Opgaven hentes …',
    hentFejl: 'Opgaven kunne ikke hentes og springes over.',
  },

  // Indstillinger
  profilOgMetoder: 'Metoder · profil',
  profilIntro: 'Facit og forklaringer følger de metoder, du vælger. Du vælger en profil og kan rette enkelte metoder herunder.',
  profilResume: {
    standard: '4.-højeste · højt = kald · højt-lavt = lige',
    omvendt: '3. og 5. mod farve · lavt = kald · lavt-højt = lige',
    kompendiet: 'ALA mod sans · romersk kald mod farve · O/E · omvendt forsinket kald',
  } as Record<string, string>,
  metoderneI: (profil: string) => `Metoderne i ${profil}`,
  /** Rullelistens navn på en metode, der mod sans spilles som en anden: den anden metode og så metoden mod farve. */
  sansOgFarve: (sans: string, farve: string) => `${sans}; ${farve} mod farve`,
  egenNote: 'Ændrer du en metode, hedder profilen "Egen". Øvelser, som metoderne ikke har, springes over.',
  data: 'Dine data',
  dataHjaelp: 'Modspils data ligger kun i denne browser. En eksport gemmer dem som en fil, og en import erstatter dem.',
  eksporter: 'Eksportér data',
  importer: 'Importér data',
  importFil: 'Vælg en fil med Modspils data',
  eksporteret: 'Dataene er gemt som en fil.',
  importeret: 'Dataene er importeret.',
  importFejl: {
    json: 'Filen kunne ikke læses som data.',
    'not-modspil': 'Filen er ikke Modspils data.',
    newer: 'Filen er fra en nyere version af appen.',
    invalid: 'Filen har ugyldige data, så intet er ændret.',
  } as Record<MsImportError, string>,
  importResume: (xp: number, ovelser: number, sessioner: number, streak: number) =>
    `Filen har ${xp} XP, ${ovelser} øvelser i bunken, ${sessioner} sessioner og en streak på ${streak}. Dine nuværende data i Modspil erstattes.`,
  annuller: 'Annullér',
  erstat: 'Erstat mine data',
  senesteEksport: (dato: string) => `Seneste eksport: ${dato}.`,
  aldrigEksporteret: 'Der er ikke eksporteret endnu.',
  datoTekst: (day: string) => {
    const [y, m, d] = dagDele(day);
    return `${d}. ${DATO_DA[m - 1]} ${y}`;
  },

  hjaelp: {
    skaerm:
      'Modspil træner at tælle og aflæse som modspiller: makkers point, regel 11 og 12, udspillets længde og markeringerne efter de metoder, du vælger i Indstillinger. I Find udspillet vælger du udspillet ud fra hånden og meldeforløbet. De andre øvelser har svaret "Kan ikke afgøres", når kortene ikke afgør det.',
    iDag: 'Dagens session har fire opgaver: først højst to øvelser til repetition, så opgaver på dit niveau. Sessionen tæller i din streak, når status vises.',
    start: 'Sessionen tager få minutter. Efter hvert svar står facit med forklaringen, og Næste opgave går videre.',
    metoder: 'Profilen vælger én metode i hver af de syv kategorier. Under Indstillinger kan profilen skiftes og enkelte metoder rettes.',
    indstillinger: 'Profil og metoder, niveauet og Modspils egen eksport og import. Andre spors data røres ikke.',
    profil: 'Standard, Omvendt og Kompendiet er de tre færdige profiler. Kompendiet er Kompendium over modspilsaftaler.',
    niveau:
      'Niveauet stiger, når over 90 % af de seneste 20 svar på niveauet er rigtige, og falder, når under 80 % er. Repetitionen tæller ikke med.',
    data: 'En eksport gemmer Modspils data som en fil; en import viser først et resumé, før dine data erstattes.',
    status: 'Resultatet af sessionen. Streak og XP hører til Modspil, adskilt fra de andre spor.',
  },
};

type Tekster = typeof DA;

const EN: Tekster = {
  titel: 'Defence',
  tilbage: 'Back to the front page',
  tilbageTilSporet: 'Back to Defence',
  gemFejl: 'Your data could not be saved in the browser. A copy can be exported under Settings.',

  farve: (f: number) => FARVE_EN[f],
  kortLabel: (farve: number, vaerdi: number) => `${HONNOER_EN[vaerdi] ?? vaerdi} of ${KORTFARVE_EN[farve]}`,
  plads: { W: 'West', N: 'North', E: 'East', S: 'South' } as Record<Seat, string>,
  pladsKort: { W: 'W', N: 'N', E: 'E', S: 'S' } as Record<Seat, string>,
  eller: ellerMed('or'),
  og: ogMed('and'),
  hp: (n: number | string) => `${n} HCP`,

  niveau: (n: number) => `Level ${n}`,
  niveauNavne: {
    1: "partner's points, the rule of 11 and 12 and the length from the lead",
    2: 'the signals and Choose the card',
    3: 'first discard, delayed signal and "can\'t tell"',
    4: 'the bidding narrows the answer',
    5: 'ambiguous signals',
  } as Record<Niveau, string>,
  niveauNu: (n: number, navn: string) => `Level ${n}: ${navn}`,
  dageITraek: (n: number) => (n === 1 ? 'day in a row' : 'days in a row'),
  xp: 'XP',
  iDag: 'Today',
  dagensPlan: (repetition: number, opgaver: number, niveau: number) =>
    `${opgaver} tasks at level ${niveau}${repetition ? `, ${repetition === 1 ? 'one exercise' : `${repetition} exercises`} of them for review` : ''}.`,
  gennemfoertIDag: "Today's session is complete. You can take another one.",
  egetSpor: 'Defence has its own streak and XP, separate from the other tracks.',
  start: "Start today's session",
  metoder: 'The methods',
  dinProfil: (navn: string) => `The profile is ${navn}. The answers and explanations follow its methods.`,
  indstillinger: 'Settings',
  eksportPaamindelse: 'It is more than a month since you last saved a copy of the Defence data.',
  eksportNu: 'Export now',

  faser: { repetition: 'Review', niveau: 'At your level' },
  sessionMeta: (xp: number) => `${xp} XP`,
  afbryd: 'Stop the session',
  sessionGennemfoert: 'The session is complete',
  sessionScore: (rigtige: number, i_alt: number) => `${rigtige} of ${i_alt} right.`,
  sessionXp: (xp: number) => `+${xp} XP this session.`,
  streak: 'Streak',

  hoved: (niveau: number, nummer: number, antal: number) => `Level ${niveau} · task ${nummer} of ${antal}`,
  status: 'The session',
  meldeforloebet: 'The bidding',
  aabning: (melding: string, interval: string) => `${melding}: ${interval} HCP.`,
  aabningsPas: (plads: string, interval: string) => `${plads}'s pass: ${interval} HCP.`,
  kontrakt: (kontrakt: string) => `South plays ${kontrakt}.`,
  bordet: 'dummy',
  dig: 'you',
  dineKort: (farve: number) => `your ${FARVE_EN[farve]}`,
  afkastet: 'discard',
  spilfoerer: 'declarer',
  resten: 'The rest of the hand',
  stik: (nummer: number) => `Trick ${nummer}`,
  udspilMidte: (kort: string) => `lead ${kort}`,
  skalLaegge: (plads: string) => `${plads} to play`,
  stikLabel: (nummer: number, kort: string[]) => `Trick ${nummer}: ${kort.join(', ')}`,
  tidligere: 'Played before',
  ovelser: {
    point: "Partner's points",
    regel11: 'Rule of 11 and 12',
    laengde: 'Length from the lead',
    markering: 'Read the signal',
    'vaelg-kort': 'Choose the card',
    afkast: 'First discard',
    forsinket: 'Delayed signal',
  } as Record<Ovelse, string>,
  regel11: 'Rule of 11',
  vaelgAfkastet: 'Choose the discard',
  ovelseHjaelp: {
    point: "Partner's HCP are 40 minus yours, dummy's and declarer's. Declarer's range comes from his opening, and a pass in opening position shows at most 11 HCP.",
    regel11:
      'With fourth highest the other three hands hold 11 minus the value of the card led above it; with third highest 12 minus the value. The cards above it in dummy and in your hand are taken off.',
    laengde: 'The lead rule and the cards you can see decide how many cards partner can hold in the suit. With more than two possibilities it cannot be told.',
    markering: 'Partner’s card to the trick is read by your agreement: attitude, Roman signals or count. A card is low when it is one of the two lowest cards you cannot see.',
    'vaelg-kort': 'You choose the card that shows partner what you want, by your agreement. The agreement is below the question.',
    afkast: 'The first time a defender cannot follow suit, the discard shows which suit he wants played, by your discard agreement.',
    forsinket: "In declarer's first suit the order of the cards shows whether the defender plays passively (low-high) or actively (high-low).",
  } as Record<Ovelse, string>,
  maerkeLabel: (profil: string, metode?: string) => (metode ? `${profil} · ${metode}` : profil),

  pointSpm: 'How many HCP can partner have?',
  udspilFjerde: 'Partner leads fourth highest.',
  udspilEfter: (metode: string) => `Partner leads by ${metode}.`,
  regel11Spm: (farve: number, kort: string) => `How many ${FARVE_EN[farve]} above the ${kort} does declarer hold?`,
  laengdeSpm: (farve: number) => `How many ${FARVE_EN[farve]} does partner hold?`,
  markeringSpm: (kort: string) => `Partner plays the ${kort} to your lead. What does the card show?`,
  markeringLaengdeSpm: (kort: string, farve: number) => `Partner plays the ${kort} to your lead. How many ${FARVE_EN[farve]} does declarer hold?`,
  vaelgKortSpm: (onske: 'kald' | 'afvisning' | 'skift', farve: number, til: number) =>
    `${onske === 'kald' ? `You want partner to continue ${FARVE_EN[farve]}.` : onske === 'afvisning' ? `You want to discourage ${FARVE_EN[farve]}.` : `You want partner to switch to ${FARVE_EN[til]}.`} Which of your ${FARVE_EN[farve]} do you play?`,
  afkastAflaesSpm: (kort: string) => `Partner shows out and discards the ${kort}. What does the discard ask for?`,
  afkastVaelgSpm: (farve: number) => `You show out and want partner to play ${FARVE_EN[farve]}. Which card do you discard?`,
  forsinketAflaesSpm: (foerste: string, anden: string) => `Partner plays the ${foerste} and then the ${anden} in declarer's first suit. What does the order show?`,
  forsinketVaelgSpm: (onske: 'passiv' | 'aktiv', farve: number) =>
    `${onske === 'passiv' ? 'You want to play passively' : 'You want partner to switch suits'} and follow in ${FARVE_EN[farve]}. Which card do you play?`,
  aftalen: (metode: string) => `Agreement: ${metode}`,
  tip: 'Tip: 11 − the value of the card led = cards above it in the other three hands.',

  svar: 'Answers',
  svarKnap: 'Answer',
  hvilke: 'Which?',
  hvilkeSpm: (n: number, kort: string) => `Which ${n === 1 ? 'card' : `${n} cards`} above the ${kort} does declarer hold?`,
  kanIkke: "Can't tell",
  tvetydig: 'Ambiguous',
  kald: 'Encourage',
  kaldTil: (farve: string) => `Encourages ${farve}`,
  afvisning: 'Discourage',
  skifteTil: (farve: string) => `Switch to ${farve}`,
  passivt: 'Passive',
  aktivt: 'Active',

  rigtigt: 'Right',
  forkert: 'Wrong',
  dom: (rigtigt: boolean, facit: string) => `${rigtigt ? 'Right' : 'Wrong'}: ${facit}`,
  ditSvar: 'Your answer',
  xpVundet: (xp: number) => `+${xp} XP`,
  iTraek: (n: number) => `${n} right in a row`,
  facit: {
    kanIkke: 'it cannot be told',
    tvetydig: 'the signal is ambiguous',
    point: (interval: string) => `partner has ${interval} HCP`,
    regel11: (n: number) => `declarer has ${n}`,
    regel11Hvilke: (n: number, kort: string) => `declarer has ${n}: ${kort}`,
    laengde: (laengder: string) => `partner has ${laengder} cards`,
    spilfoerersLaengde: (laengder: string) => `declarer has ${laengder} cards`,
    kald: 'partner encourages',
    afvisning: 'partner discourages',
    skifte: (farve: string) => `partner wants a switch to ${farve}`,
    kort: (kort: string) => `the card is ${kort}`,
    afkastKald: (farve: string) => `the discard encourages ${farve}`,
    afkastAfvisning: (farve: string) => `the discard discourages ${farve}`,
    afkastBeder: (farve: string) => `the discard asks for ${farve}`,
    passiv: 'partner plays passively',
    aktiv: 'partner wants another suit',
  },
  regnestykket: 'The sum',
  regning: {
    iAlt: '40 HCP in all',
    dig: 'You',
    bordet: 'Dummy',
    tilsammen: 'Partner and declarer',
    spilfoererViste: (melding: string) => `Declarer showed with ${melding}`,
    makker: 'Partner',
    overIAlt: (kort: string) => `Above the ${kort} in all`,
    bordetKort: (kort: string) => `Dummy: ${kort || 'none'}`,
    digKort: (kort: string) => `You: ${kort || 'none'}`,
    spilfoerer: 'Declarer',
  },
  vedBordet: 'At the table',
  ved: {
    point: 'Each honour partner shows during play is taken off the range, so you always know the most partner can have left.',
    regel11: (n: number, kort: string) =>
      `Declarer has ${n} ${n === 1 ? 'card' : 'cards'} above the ${kort}. That decides how high you need to play and whether the suit can be played again when you get in.`,
    uklar: 'When the cards do not settle it, you wait for more cards in the suit and keep counting as they fall.',
    laengde: (laengder: string, farve: number) =>
      `Partner has ${laengder} ${FARVE_EN[farve]}. With dummy's cards and your own you then know how many declarer has, and when he is void.`,
    kald: 'Partner encourages, so the suit is continued when possible.',
    afvisning: 'Partner discourages, so a switch to another suit is better when you are in again.',
    skifte: (farve: string) => `Partner wants ${farve}, so that is the suit you play when you are in again.`,
    skifteUklar: 'Partner wants a switch, but the direction is unclear, so the bidding and the cards in dummy decide which suit you choose.',
    tvetydig: 'The signal is ambiguous, so you weigh it against the bidding and the cards in dummy.',
    spilfoerersLaengde: "With declarer's length you know how many tricks the suit can give him, and when he is void.",
    vaelgKort: 'Partner reads your card by the agreement and then knows whether to continue the suit or which suit to switch to.',
    afkastBeder: (farve: string) => `Partner asks for ${farve}, so that is the suit you play when you get in.`,
    afkastAfviser: (farve: string) => `Partner does not ask for ${farve}, so you play another suit when you get in.`,
    afkastVaelg: (farve: string) => `With your discard partner knows to play ${farve} when he gets in.`,
    afkastTvetydig: 'No discard is safe here, so the best card is the one partner reads correctly most often.',
    passiv: 'Partner is passive, so the suit is continued and there is nothing more important to tell.',
    aktiv: 'Partner wants another suit, so you switch when you get in.',
    vaelgPassiv: 'Low-high tells partner that you are passive and that the suit can be continued.',
    vaelgAktiv: 'High-low tells partner that you want a switch when he gets in.',
  },
  ordbog: {
    honnoerpoint: 'High-card points in the dictionary',
    'regel-11': 'Rule of 11 in the dictionary',
    udspil: 'Leads in the dictionary',
    fjerdehoejeste: 'Fourth highest in the dictionary',
    'kald-afvisning': 'Attitude signals in the dictionary',
    modspilssignal: 'Defensive signals in the dictionary',
    fordelingssignal: 'Count signals in the dictionary',
    afkast: 'Discards in the dictionary',
    'lavinthal-signal': 'Lavinthal in the dictionary',
  } as Record<string, string>,
  naeste: 'Next task',

  udspil: {
    navn: 'Find the lead',
    hjaelp:
      "You sit West and choose the opening lead from your hand and the bidding: the suit at levels 1–2 and from level 3 the card by your profile's lead rule. The solution is computed double dummy on 100 deals that fit the bidding, and the best lead gives the most tricks on average.",
    spmFarve: 'Which suit is led?',
    spmKort: 'Which card is led?',
    vist: (min: number, max: number) => `South has shown ${min}–${max} HCP.`,
    duSpillerUd: 'You are on lead.',
    allePasser: 'all pass',
    antalKort: (n: number) => `${n} ${n === 1 ? 'card' : 'cards'}`,
    farveLabel: (farve: number, n: number) => `${['Spades', 'Hearts', 'Diamonds', 'Clubs'][farve]}, ${n} ${n === 1 ? 'card' : 'cards'}`,
    flestStik: (svar: readonly string[]) => `${ogMed('and')(svar)} ${svar.length > 1 ? 'give' : 'gives'} the most tricks`,
    koster: (pris: string) => `costs ${pris} tricks on average`,
    kosterUnder: (pris: string) => `costs less than ${pris} tricks on average`,
    kolonner: ['Lead', 'Tricks', 'Defeats', 'Cost'],
    tabelNavn: 'The leads',
    bedst: 'best',
    ditSvarRaekke: 'your answer',
    procent: (n: number) => `${n}%`,
    tabelNote: (kontrakt: string, n: number) =>
      `Average tricks for the defence and the chance of defeating ${kontrakt} over ${n} deals that fit the bidding (double dummy).`,
    henter: 'Loading the task …',
    hentFejl: 'The task could not be loaded and is skipped.',
  },

  profilOgMetoder: 'Methods · profile',
  profilIntro: 'The answers and explanations follow the methods you choose. You choose a profile and can change single methods below.',
  profilResume: {
    standard: 'fourth highest · high encourages · high-low = even',
    omvendt: 'third and fifth against a suit · low encourages · low-high = even',
    kompendiet: 'ALA against notrump · Roman signals against a suit · odd/even · reverse delayed signal',
  } as Record<string, string>,
  metoderneI: (profil: string) => `Methods in ${profil}`,
  // Kort nok til god luft ved 390 px (Franks rettelse i session 4): "low encourages" skrives "low = encourage" som det
  // danske "lavt = kald", og "against a suit" forkortes "v. suit".
  sansOgFarve: (sans: string, farve: string) => `${sans.replace(/ encourages$/, ' = encourage')}; ${farve} v. suit`,
  egenNote: 'If you change a method, the profile is called "Custom". Exercises the methods do not have are skipped.',
  data: 'Your data',
  dataHjaelp: 'The Defence data are stored only in this browser. An export saves them as a file, and an import replaces them.',
  eksporter: 'Export data',
  importer: 'Import data',
  importFil: 'Choose a file with Defence data',
  eksporteret: 'The data are saved as a file.',
  importeret: 'The data are imported.',
  importFejl: {
    json: 'The file could not be read as data.',
    'not-modspil': 'The file is not Defence data.',
    newer: 'The file is from a newer version of the app.',
    invalid: 'The file has invalid data, so nothing is changed.',
  } as Record<MsImportError, string>,
  importResume: (xp: number, ovelser: number, sessioner: number, streak: number) =>
    `The file has ${xp} XP, ${ovelser} exercises in the deck, ${sessioner} sessions and a streak of ${streak}. Your current Defence data will be replaced.`,
  annuller: 'Cancel',
  erstat: 'Replace my data',
  senesteEksport: (dato: string) => `Last export: ${dato}.`,
  aldrigEksporteret: 'Nothing has been exported yet.',
  datoTekst: (day: string) => {
    const [y, m, d] = dagDele(day);
    return `${d} ${MONTHS_EN[m - 1]} ${y}`;
  },

  hjaelp: {
    skaerm:
      "Defence trains counting and reading the cards as a defender: partner's points, the rule of 11 and 12, the length from the lead and signals by the methods you choose in Settings. In Find the lead you choose the lead from the hand and the bidding. The other exercises have the answer \"Can't tell\" when the cards do not settle it.",
    iDag: "Today's session has four tasks: first at most two exercises for review, then tasks at your level. The session counts in your streak when the status is shown.",
    start: 'The session takes a few minutes. After each answer the solution is shown with the explanation, and Next task moves on.',
    metoder: 'The profile chooses one method in each of the seven categories. Under Settings the profile can be switched and single methods changed.',
    indstillinger: 'Profile and methods, the level and the Defence export and import. Other tracks’ data are not touched.',
    profil: 'Standard, Upside-down and The Compendium are the three ready profiles. The Compendium is the Danish compendium of defensive agreements.',
    niveau: 'The level rises when more than 90% of the last 20 answers at the level are right, and falls when fewer than 80% are. Review does not count.',
    data: 'An export saves the Defence data as a file; an import first shows a summary before your data are replaced.',
    status: 'The result of the session. The streak and XP belong to Defence, separate from the other tracks.',
  },
};

/** Teksterne på det aktuelle sprog. */
export const T: Tekster = new Proxy(DA, {
  get: (_target, key) => (getLang() === 'en' ? EN : DA)[key as keyof Tekster],
});

/** Begge udgaver, til testene af, at de har samme form. */
export const TEKSTER = { da: DA, en: EN } as const;

/** Kortets navn til knapper og skærmlæser på det aktuelle sprog, fx "Spar 8" og "8 of spades". */
export const kortLabelAf = (kort: Card): string => T.kortLabel(Math.floor(kort / 13), (kort % 13) + 2);
