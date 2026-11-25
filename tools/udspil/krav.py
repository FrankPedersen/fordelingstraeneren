"""Kravene til hænderne i situationer.json (SPEC-modspil-v2.md, Kravene til hænderne).

Et krav er et objekt, hvor alle felter skal være opfyldt:
  hp [lo, hi]           honnørpoint i intervallet
  min / max / praecis   farvelængder, fx {"H": 5}
  jaevn                 4-3-3-3, 4-4-3-2 eller 5-3-3-2
  system                chooseCall("opening") giver meldingen, fx "1NT"
  stop                  hold i farven (hasStopper)
  pas                   modspillerens pas i sammenhængen, fx "over-1NT": ikke 8+ hp med en 5+-farve, ikke 16+ hp,
                        og chooseCall giver pas i sammenhængen
  enAf                  mindst ét af kravene i listen er opfyldt
"""
from system import FARVE, choose_call, deres_farve, hp, jaevn, laengder, stop


def opfyldt(haand, krav: dict) -> bool:
    l = laengder(haand)
    for noegle, v in krav.items():
        if noegle == "hp":
            if not v[0] <= hp(haand) <= v[1]:
                return False
        elif noegle == "min":
            if any(l[FARVE[s]] < n for s, n in v.items()):
                return False
        elif noegle == "max":
            if any(l[FARVE[s]] > n for s, n in v.items()):
                return False
        elif noegle == "praecis":
            if any(l[FARVE[s]] != n for s, n in v.items()):
                return False
        elif noegle == "jaevn":
            if not jaevn(l):
                return False
        elif noegle == "system":
            if choose_call("opening", haand) != v:
                return False
        elif noegle == "stop":
            if not stop(haand, FARVE[v]):
                return False
        elif noegle == "pas":
            point = hp(haand)
            if point >= 16 or (point >= 8 and max(l) >= 5):
                return False
            if choose_call(v, haand, deres_farve(v)) is not None:
                return False
        elif noegle == "enAf":
            if not any(opfyldt(haand, k) for k in v):
                return False
        else:
            raise ValueError(f"Ukendt krav: {noegle}")
    return True


def alle_opfyldt(haender: dict, krav: dict, pladser=("N", "E", "S", "W")) -> bool:
    return all(opfyldt(haender[p], krav[p]) for p in pladser)
