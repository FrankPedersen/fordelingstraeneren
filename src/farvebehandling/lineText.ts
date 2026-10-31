import { getLang } from '../i18n';

/**
 * Løserens linjer står på dansk i data (faste sætningsskabeloner fra solver/describe.ts og solver/lines.ts). På
 * engelsk oversættes de her, skabelon for skabelon, så data og løseren er uændrede.
 */

const CARD = "esset|kongen|damen|knægten|\\d{1,2}'eren";
const HAND = 'bordet|hånden';

const CARD_EN: Record<string, string> = { esset: 'the ace', kongen: 'the king', damen: 'the queen', knægten: 'the jack' };
const card = (name: string) => {
  const lower = name.toLowerCase();
  return CARD_EN[lower] ?? `the ${lower.replace("'eren", '')}`;
};
const hand = (name: string) => (name.toLowerCase() === 'bordet' ? 'dummy' : 'hand');
const capital = (s: string) => `${s[0].toUpperCase()}${s.slice(1)}`;
const seat = (name: string) => (name === 'Vest' ? 'West' : 'East');

/** Kortets engelske navn ud fra rangen: "the ace", "the 10". */
export function englishCardName(rank: number): string {
  return ({ 14: 'the ace', 13: 'the king', 12: 'the queen', 11: 'the jack' } as Record<number, string>)[rank] ?? `the ${rank}`;
}

/** Et trin fra løserens danske skabeloner på engelsk. */
export function englishStep(text: string): string {
  // Et udspil, der bruger en indgang (SPEC-forbindelser.md): "Hånden nås med en sideindgang, og der spilles …".
  const entry = /^(Bordet|Hånden) nås med en sideindgang, og (?:der spilles (.+)|(.+) slås\.)$/.exec(text);
  if (entry) {
    const [, from, rest, cashed] = entry;
    const to = hand(from);
    const reached = `${to[0].toUpperCase()}${to.slice(1)} is reached with a side entry`;
    if (cashed) return `${reached}, and ${card(cashed)} is cashed.`;
    // Hånden sættes ind efter kortet igen, så de faste skabeloner oversætter trinet, og tages så ud igen.
    const base = rest.startsWith('lille fra begge hænder') ? rest : rest.replace(new RegExp(`^(lille|${CARD})`), `$1 fra ${from.toLowerCase()}`);
    const english = englishStep(base[0].toUpperCase() + base.slice(1)).replace(` from ${to}`, '');
    const led = english
      .replace(/^Low from both hands/, 'low is played from both hands')
      .replace(/^Low\b/, 'low is led')
      .replace(/^The (\w+)/, (_, c: string) => `the ${c} is led`);
    return `${reached}, and ${led}`;
  }
  const cash = /^(.+) slås\.$/.exec(text);
  if (cash) {
    const names = cash[1].split(/, | og /).map(card);
    const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0];
    return `${list[0].toUpperCase()}${list.slice(1)} ${names.length > 1 ? 'are' : 'is'} cashed.`;
  }
  return text
    .replace(new RegExp(`^lille fra (${HAND}) og lille fra (${HAND})`, 'i'), (_, a: string, b: string) => `Low from ${hand(a)} and low from ${hand(b)}`)
    .replace(/^lille fra begge hænder/i, 'Low from both hands')
    .replace(new RegExp(`^lille fra (${HAND}) til (${CARD})`, 'i'), (_, h: string, c: string) => `Low from ${hand(h)} to ${card(c)}`)
    .replace(new RegExp(`^lille fra (${HAND}) mod (${CARD}) \\(kipning\\)`, 'i'), (_, h: string, c: string) => `Low from ${hand(h)} towards ${card(c)} (finesse)`)
    .replace(new RegExp(`^lille fra (${HAND})`, 'i'), (_, h: string) => `Low from ${hand(h)}`)
    .replace(new RegExp(`^(${CARD}) fra (${HAND})`, 'i'), (_, c: string, h: string) => `${capital(card(c))} from ${hand(h)}`)
    .replace(/; lægger (Vest|Øst) en honnør, lægges der lille/g, (_, s: string) => `; if ${seat(s)} plays an honour, low is played`)
    .replace(new RegExp(`; lægger (Vest|Øst) en honnør, tages den med (${CARD})`, 'g'), (_, s: string, c: string) => `; if ${seat(s)} plays an honour, it is won with ${card(c)}`)
    .replace(/; dækker (Vest|Øst), lægges der lille/g, (_, s: string) => `; if ${seat(s)} covers, low is played`)
    .replace(new RegExp(`; dækker (Vest|Øst), tages stikket med (${CARD})`, 'g'), (_, s: string, c: string) => `; if ${seat(s)} covers, the trick is won with ${card(c)}`)
    .replace(/, ellers løber den/g, ', otherwise it runs')
    .replace(/; den løber/g, '; it runs')
    .replace(new RegExp(`, ellers lægges (${CARD})`, 'g'), (_, c: string) => `, otherwise ${card(c)} is played`)
    .replace(new RegExp(`; (${CARD}) lægges`, 'g'), (_, c: string) => `; ${card(c)} is played`);
}

/** Et trin på det aktuelle sprog. */
export const stepText = (text: string): string => (getLang() === 'en' ? englishStep(text) : text);

/** Honnørerne i data og i løserens beskeder står med danske bogstaver; på engelsk A, K, Q og J. */
const LETTER_EN: Record<string, string> = { E: 'A', D: 'Q', B: 'J' };
export const cardLetter = (symbol: string): string => (getLang() === 'en' ? (LETTER_EN[symbol] ?? symbol) : symbol);

/** Løserens fejlbeskeder om en egen linje (solver/lines.ts) på det aktuelle sprog. */
export function lineErrorText(text: string): string {
  if (getLang() !== 'en') return text;
  const play = new RegExp(`^Trin (\\d+): (.+) kan ikke spilles fra (${HAND})( som 3\\. hånd)?\\.$`).exec(text);
  if (play) {
    const what = play[2] === 'et lille kort' ? 'a low card' : play[2] === 'det højeste kort' ? 'the highest card' : (LETTER_EN[play[2]] ?? play[2]);
    return `Step ${play[1]}: ${what} cannot be played from ${hand(play[3])}${play[4] ? ' as 3rd hand' : ''}.`;
  }
  const entry = new RegExp(`^Trin (\\d+): der er ingen indgang til (${HAND}), så der kan ikke spilles ud derfra\\.$`).exec(text);
  if (entry) return `Step ${entry[1]}: there is no entry to ${hand(entry[2])}, so you cannot lead from there.`;
  const next = /^Trin (\d+): en gren peger på det næste trin \((\d+)\)\.$/.exec(text);
  if (next) return `Step ${next[1]}: a branch points to the next step (${next[2]}).`;
  const missing = /^Trin (\d+): grenen peger på trin (\d+), som ikke findes\.$/.exec(text);
  if (missing) return `Step ${missing[1]}: the branch points to step ${missing[2]}, which does not exist.`;
  return text;
}
