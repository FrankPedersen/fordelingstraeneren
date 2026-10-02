import { useCallback, useState } from 'react';
import { loadSaved, saveSaved, type Saved } from '../engine/storage';

/** Tilstanden fra localStorage; hver ændring gemmes med det samme. */
export function useSaved(): [Saved, (next: Saved) => void] {
  const [saved, setSaved] = useState(() => loadSaved(window.localStorage));
  const update = useCallback((next: Saved) => {
    saveSaved(window.localStorage, next);
    setSaved(next);
  }, []);
  return [saved, update];
}
