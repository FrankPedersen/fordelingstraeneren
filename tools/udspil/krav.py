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

Varianternes ekstra krav til Vest (SPEC-udspilsraad.md, Varianterne; tools/udspil/varianter.json):
  farveMed              en liste af {"blandt": [...], "laengde": [lo, hi], "honnoerer": [lo, hi]}; hvert element skal
                        opfyldes af mindst én farve blandt `blandt` (elementerne må opfyldes af forskellige farver).
                        Honnører er E, K, D og B.
  tableFeeling          {"blandt": [...], "min": 3}: en farve blandt `blandt` med mindst `min` kort, hvor profilen
                        Standard giver "table feeling" mod sans (se table_feeling)
"""
from system import FARVE, choose_call, deres_farve, hp, jaevn, laengder, stop

#: Valørindekset for B (kort % 13: 0 = 2, 9 = B, 10 = D, 11 = K, 12 = E); honnørerne er B og højere.
BONDE = 9


def farvens_kort(haand, farve: int) -> list:
    """Valørindeksene (0–12) i farven, faldende."""
    return sorted((c % 13 for c in haand if c // 13 == farve), reverse=True)


def honnoerer(kort) -> int:
    """Antal honnører (E, K, D, B) blandt valørindeksene."""
    return sum(1 for r in kort if r >= BONDE)


def table_feeling(kort) -> bool:
    """To honnører i træk øverst (E K, K D eller D B), men ikke tre i træk eller en brudt sekvens (E K B, K D 10, D B 9).

    Med mindst tre kort giver profilen Standard da toppen eller det lave kort mod sans. `kort` er valørindeksene faldende.
    """
    if len(kort) < 3:
        return False
    top, anden, tredje = kort[0], kort[1], kort[2]
    return anden >= BONDE and top == anden + 1 and tredje not in (top - 2, top - 3)


def _farve_med(haand, element: dict) -> bool:
    lo, hi = element["laengde"]
    hlo, hhi = element["honnoerer"]
    for s in element["blandt"]:
        kort = farvens_kort(haand, FARVE[s])
        if lo <= len(kort) <= hi and hlo <= honnoerer(kort) <= hhi:
            return True
    return False


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
        elif noegle == "farveMed":
            if not all(_farve_med(haand, e) for e in v):
                return False
        elif noegle == "tableFeeling":
            if not any(len(k) >= v["min"] and table_feeling(k) for k in (farvens_kort(haand, FARVE[s]) for s in v["blandt"])):
                return False
        else:
            raise ValueError(f"Ukendt krav: {noegle}")
    return True


def alle_opfyldt(haender: dict, krav: dict, pladser=("N", "E", "S", "W")) -> bool:
    return all(opfyldt(haender[p], krav[p]) for p in pladser)
