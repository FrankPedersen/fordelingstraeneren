import { kontrolSuite } from './kontrol';
import { profil } from './model/metoder';

// Accepttest 7 i SPEC-modspil.md for profilen Standard: 10.000 seeds pr. øvelse, facit ens med brute force.
// Forsinket kald findes ikke med "intet" og springes over. Profilerne har hver sin fil, så de kører samtidig.
kontrolSuite('Standard', profil('standard'), 10_000);
