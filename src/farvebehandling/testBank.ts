import { loadBank } from './analysis';

/** Hele banken til testene: appens filer (én pr. side) læst med det samme. Appen selv henter dem dovent. */
const files = import.meta.glob<string>('./content/app/side-*.json', { query: '?raw', import: 'default', eager: true });

export const TEST_BANK = loadBank(Object.values(files));

export const bankItem = (id: string) => {
  const item = TEST_BANK.find((b) => b.combination.id === id);
  if (!item) throw new Error(`${id} findes ikke i banken`);
  return item;
};
