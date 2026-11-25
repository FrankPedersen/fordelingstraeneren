import type { FindUdspilOpgave, UdspilSvar } from '../model/findUdspil';

/*
 * Øvelse 8, "Find udspillet", på skærmen (SPEC-modspil-v2.md, trin 3). Tomt modul fra session 3a: accepttestene i
 * src/modspil/udspil-skaerme/ beskriver skærmen, og session 3b bygger den. Grænsefladen står i
 * src/modspil/udspil-skaerme/hjaelp.tsx.
 */

export interface FindUdspilProps {
  opgave: FindUdspilOpgave;
  nummer: number;
  antal: number;
  /** Med svaret viser skærmen også facit (samme HTML ved alle bredder). */
  svar?: UdspilSvar;
  onSvar(svar: UdspilSvar): void;
  onNaeste(): void;
  onIndstillinger(): void;
  /** XP for svaret og rigtige i træk; vises i facit, når sessionen giver dem. */
  xp?: number;
  iTraek?: number;
}

export function FindUdspil(props: FindUdspilProps): never {
  void props;
  throw new Error('ikke bygget');
}
