import type { Saved } from '../engine/storage';

/** Standardbillederne udspringer af formen, så billedet bærer strukturen (SPEC.md, Skyline-billeder). */
export const STANDARD_IMAGES: Record<string, { name: string; shape: string }> = {
  '4-4-3-2': { name: 'Trappen', shape: 'repos øverst, to trin ned' },
  '5-3-3-2': { name: 'Kirken', shape: 'tårn, skib og våbenhus' },
  '5-4-3-1': { name: 'Orgelpiberne', shape: 'fire forskellige længder, derfor 24 placeringer' },
  '5-4-2-2': { name: 'Lænestolen', shape: 'høj ryg, lavt sæde' },
  '4-3-3-3': { name: 'Rækkehusene', shape: 'fire næsten ens huse' },
  '6-3-2-2': { name: 'Fabrikken', shape: 'høj skorsten, en hal og to skure' },
  '6-4-2-1': { name: 'Skihopbakken', shape: 'stejl og jævnt faldende' },
  '6-3-3-1': { name: 'Domkirken', shape: 'kirkens storebror: højere tårn, mindre våbenhus' },
  '5-5-2-1': { name: 'Kamelen', shape: 'to lige høje pukler, hoved og hale' },
  '4-4-4-1': { name: 'Den vaklende stol', shape: 'tre lige ben og ét kort' },
  '7-3-2-1': { name: 'Raketten', shape: '7 – og så 3-2-1 – affyring!' },
  '6-4-3-0': { name: 'Kældertrappen', shape: 'tre trin ned, der ender i mørket (renonce)' },
  '5-4-4-0': { name: 'Taburetten', shape: 'tre ben, det fjerde mangler' },
};

export interface PatternImage {
  name: string;
  /** Hvordan billedet bærer formen; kun for standardbilleder. */
  shape?: string;
  /** Brugerens eget billede. */
  own: boolean;
}

/** Brugerens eget billede, ellers standardbilledet. Mønstre uden for de 13 har intet standardbillede. */
export function imageOf(saved: Pick<Saved, 'images'>, patternId: string): PatternImage | null {
  const own = saved.images[patternId]?.trim();
  if (own) return { name: own, own: true };
  const standard = STANDARD_IMAGES[patternId];
  return standard ? { ...standard, own: false } : null;
}
