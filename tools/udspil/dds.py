"""Dobbeltdummy med Bo Haglunds DDS via endplay (SPEC-modspil-v2.md, Generatoren punkt 5)."""
from endplay.dds import calc_dd_table, solve_all_boards
from endplay.types import Deal, Denom, Player

RANKS = "23456789TJQKA"
DENOM = {"NT": Denom.nt, "S": Denom.spades, "H": Denom.hearts, "D": Denom.diamonds, "C": Denom.clubs}


def pbn_haand(haand) -> str:
    """En hånd som PBN (♠.♥.♦.♣ med faldende valører)."""
    farver = [[], [], [], []]
    for c in sorted(haand, reverse=True):
        farver[c // 13].append(RANKS[c % 13])
    return ".".join("".join(f) for f in farver)


def fra_pbn(tekst: str) -> list:
    """Kortene 0–51 fra en PBN-hånd som "KQT9.QT98.973.75"."""
    farver = tekst.split(".")
    if len(farver) != 4:
        raise ValueError(f"Ikke en PBN-hånd: {tekst}")
    kort = [s * 13 + RANKS.index(r) for s, f in enumerate(farver) for r in f]
    if len(kort) != 13 or len(set(kort)) != 13:
        raise ValueError(f"Hånden har ikke 13 forskellige kort: {tekst}")
    return sorted(kort)


def _deal(haender: dict, benaevnelse: str) -> Deal:
    d = Deal.from_pbn("N:" + " ".join(pbn_haand(haender[p]) for p in ("N", "E", "S", "W")))
    d.first = Player.west
    d.trump = DENOM[benaevnelse]
    return d


def _kort(card) -> int:
    return int(card.suit) * 13 + card.rank.value.bit_length() - 3


def modspillets_stik(fordelinger: list, benaevnelse: str) -> list:
    """For hver fordeling modspillets stik for hvert af Vests kort (i stigende kortorden), med Vest i udspil."""
    vest = sorted(fordelinger[0]["W"])
    ud = []
    for loest in solve_all_boards([_deal(h, benaevnelse) for h in fordelinger]):
        stik = {_kort(card): n for card, n in loest}
        if sorted(stik) != vest:
            raise RuntimeError("DDS gav ikke stik for præcis Vests 13 kort")
        ud.append([stik[c] for c in vest])
    return ud


def syds_stik(haender: dict, benaevnelse: str) -> int:
    """Syds stik som spilfører i benævnelsen fra DDS-tabellen (en anden indgang i DDS end solve_board)."""
    tabel = calc_dd_table(_deal(haender, benaevnelse))
    return tabel[DENOM[benaevnelse], Player.south]
