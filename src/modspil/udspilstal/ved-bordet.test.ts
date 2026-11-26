import { describe, expect, it } from 'vitest';
import type { Tekst } from '../model/forklaring';
import { vedBordet, type SituationId } from '../model/findUdspil';
import foer from './foer.json';

/*
 * Accepttest 4 i SPEC-udspilstal.md: "Ved bordet". I S1–S6 og S8 er teksten den ved tagget `v51-foer-udspilstal`
 * (gemt i foer.json i den røde fase) efterfulgt af én sætning med stikkene fra afsnit 7a (specens tabel på dansk og den
 * engelske, Frank godkender under "Tekster til gennemgang"). S7 er uændret. Koden regner sætningen ud fra raadtal.json;
 * testen holder resultatet fast med tallene fra 7a.
 */

const FOER = foer.vedBordet as Record<SituationId, Tekst>;

const S1S2: Tekst = {
  da: 'Med dobbeltdummy giver den korteste major dog 0,10 stik mindre end den længste, mens en kort major og en firefarve i minor med honnør er lige gode.',
  en: 'With double dummy, leading the shorter major actually gives 0.10 fewer tricks than the longer one, while a short major and a four-card minor with an honour are equally good.',
};

const NY: Readonly<Record<SituationId, Tekst | null>> = {
  'S1-1nt-3nt': S1S2,
  'S2-stayman': S1S2,
  'S3-transfer': {
    da: 'Med dobbeltdummy giver ♥ uden dyb sekvens 0,12 stik mindre end ♠, mens ♠ og minorfarverne er lige gode.',
    en: 'With double dummy, leading ♥ without a deep sequence gives 0.12 fewer tricks than ♠, while ♠ and the minors are equally good.',
  },
  'S4-kun-en-farve': {
    // Franks rettelse 26. nov. 2026: "…, mens trumf og ♣ er lige gode" i stedet for "… og er lige så godt som ♣".
    da: 'Med dobbeltdummy giver singletonen 0,13 stik mere end småkort, småkort giver 0,15 stik mere end en farve med en eller to honnører, doubletonen og småkort er lige gode, og trumf giver 0,06 stik mindre end ♠ og ♦, mens trumf og ♣ er lige gode.',
    en: 'With double dummy, leading the singleton gives 0.13 more tricks than small cards, leading small cards gives 0.15 more tricks than a suit with one or two honours, the doubleton and small cards are equally good, and leading a trump gives 0.06 fewer tricks than ♠ and ♦, while a trump and ♣ are equally good.',
  },
  'S5-sidefarve': {
    da: 'Med dobbeltdummy giver singletonen 0,11 stik mere end småkort i en sidefarve.',
    en: 'With double dummy, leading the singleton gives 0.11 more tricks than small cards in a side suit.',
  },
  'S6-trumf': {
    da: 'Med dobbeltdummy giver trumf 0,07 stik mere end ♠ og 0,32 stik mere end ♥, mens trumf og ♦ er lige gode; trumf er den bedste farve i 46 % af hænderne.',
    en: 'With double dummy, leading a trump gives 0.07 more tricks than ♠ and 0.32 more tricks than ♥, while a trump and ♦ are equally good; the trump suit is the best suit in 46% of the hands.',
  },
  'S7-makker-aabnet': null,
  'S8-delkontrakt': {
    da: 'Med dobbeltdummy giver singletonen 0,17 stik mere end småkort, doubletonen og småkort er lige gode, og trumf giver 0,06 stik mindre end hver sidefarve.',
    en: 'With double dummy, leading the singleton gives 0.17 more tricks than small cards, the doubleton and small cards are equally good, and leading a trump gives 0.06 fewer tricks than each side suit.',
  },
};

describe('"Ved bordet" (accepttest 4)', () => {
  it('foer.json har teksten ved tagget for alle otte situationer', () => {
    expect(foer.tag).toBe('v51-foer-udspilstal');
    expect(Object.keys(FOER).sort()).toEqual(Object.keys(NY).sort());
  });

  it.each(Object.entries(NY))('%s', (id, ny) => {
    const gammel = FOER[id as SituationId];
    const nu = vedBordet(id as SituationId);
    if (ny === null) expect(nu).toEqual(gammel);
    else expect(nu).toEqual({ da: `${gammel.da} ${ny.da}`, en: `${gammel.en} ${ny.en}` });
  });
});
