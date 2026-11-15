import { kontrolSuite } from './kontrol';
import { medMetode, profil, type KategoriId, type Profil } from './model/metoder';

// Ud over accepttest 7: hver metode i filen kontrolleres mindst én gang. De tre profiler bruger hverken Lavinthal,
// 3. og 5. højeste mod sans, højt = kald eller højt-lavt = lige sammen med ALA, eller "som kald eller afvisning" med
// romersk kald, så to egne profiler (som brugeren kan vælge i Indstillinger) tager resten, med 2.000 seeds pr. øvelse.

function egen(fra: Profil, valg: [KategoriId, string][]): Profil {
  return valg.reduce((p, [kategori, id]) => medMetode(p, kategori, id), fra);
}

kontrolSuite(
  'Egen 1 (Lavinthal, 3. og 5. højeste mod sans, ALA med højt = kald og højt-lavt = lige)',
  egen(profil('kompendiet'), [
    ['udspil-sans', 'tredje-femte'],
    ['udspil-farve', 'fjerde-hoejeste'],
    ['kald', 'hoejt-kald'],
    ['laengde', 'hoejt-lavt-lige'],
    ['afkast', 'lavinthal'],
  ]),
  2_000,
);

kontrolSuite(
  'Egen 2 (romersk kald med første afkast som kald eller afvisning, top af sekvens og 4.-højeste mod sans)',
  egen(profil('kompendiet'), [
    ['udspil-sans', 'fjerde-hoejeste'],
    ['honnoerudspil', 'top-af-sekvens'],
    ['afkast', 'som-kald-afvisning'],
  ]),
  2_000,
);
