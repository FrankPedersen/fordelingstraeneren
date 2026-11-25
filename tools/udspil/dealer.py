"""Port af deal(seed) i src/domain/dealer.ts og fordelingerne til Find udspillet (SPEC-modspil-v2.md, Generatoren 2–4).

Et kort er et tal 0–51 som i src/domain/cards.ts: farven er kort // 13 i ordenen ♠♥♦♣, valøren kort % 13 (0 = 2, 12 = es).
"""
from rng import Mulberry32, shuffle

PLADSER = ("N", "E", "S", "W")


def deal(seed: int) -> dict:
    """Alle 52 kort blandes med Fisher–Yates, og 13 gives til hver i rækkefølgen N, Ø, S, V."""
    kort = shuffle(list(range(52)), Mulberry32(seed))
    return {"N": kort[0:13], "E": kort[13:26], "S": kort[26:39], "W": kort[39:52]}


def fordeling(vest: list, seed: int) -> dict:
    """De 39 kort, Vest ikke har, i stigende orden blandes med shuffle og gives til N, Ø og S (13 hver)."""
    vests = set(vest)
    resten = shuffle([c for c in range(52) if c not in vests], Mulberry32(seed))
    return {"N": resten[0:13], "E": resten[13:26], "S": resten[26:39], "W": sorted(vest)}


def _blandet_bagfra(kort: list, seed: int, tjek: list):
    """Fisher–Yates som shuffle, men afbrudt, så snart en hånd, der er færdigblandet, ikke består sit tjek.

    shuffle blander bagfra, så pladserne fra enden bliver endelige først: efter 13 trin er de sidste 13 kort færdige.
    `tjek` er en liste af (start, funktion) for hånden kort[start:start + 13], i den rækkefølge de bliver færdige. Resultatet
    er præcis det samme som shuffle (eller None, når et tjek fejler), fordi et forkastet seed alligevel ikke bruges.
    """
    rng = Mulberry32(seed)
    i = len(kort) - 1
    for start, ok in tjek:
        while i >= start and i > 0:
            j = rng.int(i + 1)
            kort[i], kort[j] = kort[j], kort[i]
            i -= 1
        if not ok(kort[start:start + 13]):
            return None
    return kort


def deal_hvis(seed: int, tjek: dict):
    """deal(seed), når hænderne består tjekkene (pladsen → funktion på hånden), ellers None."""
    k = _blandet_bagfra(list(range(52)), seed, [(39, tjek["W"]), (26, tjek["S"]), (13, tjek["E"]), (0, tjek["N"])])
    return None if k is None else {"N": k[0:13], "E": k[13:26], "S": k[26:39], "W": k[39:52]}


def fordeling_hvis(vest: list, seed: int, tjek: dict):
    """fordeling(vest, seed), når N, Ø og S består tjekkene, ellers None."""
    vests = set(vest)
    k = _blandet_bagfra([c for c in range(52) if c not in vests], seed, [(26, tjek["S"]), (13, tjek["E"]), (0, tjek["N"])])
    return None if k is None else {"N": k[0:13], "E": k[13:26], "S": k[26:39], "W": sorted(vest)}
