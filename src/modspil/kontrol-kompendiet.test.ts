import { kontrolSuite } from './kontrol';
import { profil } from './model/metoder';

// Accepttest 7 i SPEC-modspil.md for profilen Kompendiet: 10.000 seeds pr. øvelse (alle syv), facit ens med brute force.
kontrolSuite('Kompendiet', profil('kompendiet'), 10_000);
