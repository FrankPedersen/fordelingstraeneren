import { kontrolSuite } from './kontrol';
import { profil } from './model/metoder';

// Accepttest 7 i SPEC-modspil.md for profilen Omvendt: 10.000 seeds pr. øvelse, facit ens med brute force.
// Forsinket kald findes ikke med "intet" og springes over.
kontrolSuite('Omvendt', profil('omvendt'), 10_000);
