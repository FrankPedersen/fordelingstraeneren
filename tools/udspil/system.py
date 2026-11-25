"""Port af chooseCall og hasStopper fra src/system/interpreter.ts, der læser den samme systemfil (dk-2over1.json).

Kun til generatoren: TS-testene kontrollerer hænderne med interpreter.ts selv, så de to er uafhængige.
"""
import json
from pathlib import Path

ROD = Path(__file__).resolve().parents[2]
FARVE = {"S": 0, "H": 1, "D": 2, "C": 3}
JAEVNE = {(4, 3, 3, 3), (4, 4, 3, 2), (5, 3, 3, 2)}

with open(ROD / "src" / "system" / "dk-2over1.json", encoding="utf-8") as f:
    REGLER = json.load(f)["rules"]


def laengder(haand) -> list:
    ud = [0, 0, 0, 0]
    for c in haand:
        ud[c // 13] += 1
    return ud


def hp(haand) -> int:
    """Honnørpoint: es 4, konge 3, dame 2, bonde 1."""
    return sum(max(0, c % 13 - 8) for c in haand)


def jaevn(l) -> bool:
    return tuple(sorted(l, reverse=True)) in JAEVNE


def opfylder(krav: dict, l) -> bool:
    """satisfies i interpreter.ts."""
    (noegle, v), = krav.items()
    if noegle == "allOf":
        return all(opfylder(k, l) for k in v)
    if noegle == "anyOf":
        return any(opfylder(k, l) for k in v)
    if noegle == "min":
        return all(l[FARVE[s]] >= n for s, n in v.items())
    if noegle == "max":
        return all(l[FARVE[s]] <= n for s, n in v.items())
    if noegle == "exact":
        return all(l[FARVE[s]] == n for s, n in v.items())
    if noegle == "geq":
        return l[FARVE[v[0]]] >= l[FARVE[v[1]]]
    if noegle == "longest":
        return l[FARVE[v]] == max(l)
    if noegle == "balanced":
        return jaevn(l)
    raise ValueError(f"Ukendt krav: {krav}")


def stop(haand, farve: int) -> bool:
    """hasStopper: es, konge med mindst ét kort ved siden, dame tredje eller bonde fjerde."""
    r = [c % 13 for c in haand if c // 13 == farve]
    n = len(r)
    return 12 in r or (11 in r and n >= 2) or (10 in r and n >= 3) or (9 in r and n >= 4)


_KANDIDATER = {}
for _r in sorted(REGLER, key=lambda r: r["priority"]):
    _KANDIDATER.setdefault(_r["context"], []).append(_r)


def _i_interval(h, point) -> bool:
    intervaller = h if isinstance(h[0], list) else [h]
    return any(lo <= point <= hi for lo, hi in intervaller)


def deres_farve(sammenhaeng: str):
    """Åbnerens farve i en indmeldingssituation, fx "over-1H" → "H"."""
    if len(sammenhaeng) == 7 and sammenhaeng.startswith("over-1") and sammenhaeng[6] in FARVE:
        return sammenhaeng[6]
    return None


def choose_call(sammenhaeng: str, haand, deres=None):
    """Den første regel i prioritetsrækkefølge, som hånden opfylder, ellers None (pas)."""
    l = laengder(haand)
    point = hp(haand)
    for r in _KANDIDATER.get(sammenhaeng, ()):
        if _i_interval(r["hcp"], point) and opfylder(r["shows"], l) and (
            not r.get("stopper") or (deres is not None and stop(haand, FARVE[deres]))
        ):
            return r["call"]
    return None
