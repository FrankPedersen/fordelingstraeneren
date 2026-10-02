import { describe, expect, it } from 'vitest';
import { defaultSaved } from '../engine/storage';
import { PATTERNS, patternById } from '../domain/patterns';
import { STANDARD_IMAGES, imageOf } from './images';
import { isRoomOpen, palaceOf, placeOf, roomOf, sceneTemplate, stationName } from './palace';
import { HINT_COST, supportPlan } from './support';

describe('Skyline-billeder', () => {
  it('har standardbilleder til de 13 mønstre på ruten', () => {
    expect(Object.keys(STANDARD_IMAGES)).toEqual(PATTERNS.slice(0, 13).map((p) => p.id));
    expect(STANDARD_IMAGES['4-4-3-2']).toEqual({ name: 'Trappen', shape: 'repos øverst, to trin ned' });
    expect(STANDARD_IMAGES['5-4-4-0'].name).toBe('Taburetten');
  });

  it('viser brugerens eget billede overalt i stedet for standardbilledet', () => {
    const saved = defaultSaved();
    expect(imageOf(saved, '5-3-3-2')).toEqual({ name: 'Kirken', shape: 'tårn, skib og våbenhus', own: false });
    saved.images['5-3-3-2'] = 'Mormors kommode';
    expect(imageOf(saved, '5-3-3-2')).toEqual({ name: 'Mormors kommode', own: true });
    expect(imageOf(saved, '7-2-2-2')).toBeNull();
    saved.images['7-2-2-2'] = 'Flagstangen';
    expect(imageOf(saved, '7-2-2-2')?.name).toBe('Flagstangen');
  });
});

describe('Huskepalads', () => {
  it('placerer rang 1–5 i rum 1, 6–10 i rum 2, 11–13 i rum 3 og de episke på Loftet', () => {
    expect(PATTERNS.map((p) => roomOf(p))).toEqual([
      ...Array(5).fill(1),
      ...Array(5).fill(2),
      ...Array(3).fill(3),
      ...Array(11).fill(4),
      ...Array(15).fill(null),
    ]);
    expect(placeOf(patternById('4-4-3-2'))).toBe(1);
    expect(placeOf(patternById('5-4-4-0'))).toBe(13);
    expect(placeOf(patternById('8-3-2-0'))).toBe('loft');
    expect(placeOf(patternById('7-6-0-0'))).toBeNull();
  });

  it('har 13 stationer, hvor station n rummer mønstret med rang n', () => {
    const palace = palaceOf(defaultSaved());
    expect(palace.rooms.map((r) => r.name)).toEqual(['Rum 1', 'Rum 2', 'Rum 3', 'Loftet']);
    expect(palace.stations).toHaveLength(13);
    palace.stations.forEach((s, i) => {
      expect(s.patternId).toBe(PATTERNS[i].id);
      expect(s.room).toBe(roomOf(PATTERNS[i]));
    });
  });

  it('bevarer brugerens navne og scener', () => {
    const saved = defaultSaved();
    saved.palace = {
      rooms: [{ name: 'Entréen' }],
      stations: [{ name: 'Hoveddøren', room: 1, patternId: '4-4-3-2', scene: 'Ved hoveddøren: en trappe' }],
    };
    const palace = palaceOf(saved);
    expect(palace.rooms[0].name).toBe('Entréen');
    expect(palace.rooms[3].name).toBe('Loftet');
    expect(palace.stations[0]).toMatchObject({ name: 'Hoveddøren', scene: 'Ved hoveddøren: en trappe' });
    expect(stationName(saved, 1)).toBe('Hoveddøren');
    expect(stationName(saved, 2)).toBe('Station 2');
  });

  it('åbner rum 2 og 3 og Loftet, når den foregående grad er lært', () => {
    expect([1, 2, 3, 4].map((room) => isRoomOpen(room, 1))).toEqual([true, false, false, false]);
    expect([1, 2, 3, 4].map((room) => isRoomOpen(room, 2))).toEqual([true, true, false, false]);
    expect([1, 2, 3, 4].map((room) => isRoomOpen(room, 4))).toEqual([true, true, true, true]);
  });

  it('giver skabelonen "Ved {station}: {billede}"', () => {
    expect(sceneTemplate('hoveddøren', 'Trappen')).toBe('Ved hoveddøren: Trappen');
  });
});

describe('Aftrapning', () => {
  it('følger tabellen over støtteniveauer', () => {
    expect(supportPlan(3)).toEqual({ present: true, hint: 'free', after: 'full' });
    expect(supportPlan(2)).toEqual({ present: false, hint: 'paid', after: 'full' });
    expect(supportPlan(1)).toEqual({ present: false, hint: 'none', after: 'skyline' });
    expect(supportPlan(0)).toEqual({ present: false, hint: 'none', after: 'facit' });
    expect(HINT_COST).toBe(5);
  });
});
