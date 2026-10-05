import { useSyncExternalStore } from 'react';
import { getLang, subscribeLang, type Lang } from '../i18n';

/** Det aktuelle sprog; komponenten tegnes igen, når det skifter. */
export function useLang(): Lang {
  return useSyncExternalStore(subscribeLang, getLang, getLang);
}
