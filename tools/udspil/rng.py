"""Port af appens src/engine/rng.ts (mulberry32, int og shuffle), bit for bit (SPEC-modspil-v2.md, Generatoren punkt 2).

    python tools/udspil/rng.py --fast    skriver de faste tal, som TS-testen sammenligner med (rng-fast.json)
"""
import json
import sys

M32 = 0xFFFFFFFF


def _imul(a: int, b: int) -> int:
    """Math.imul: de laveste 32 bit af produktet (som uint32; bittene er de samme som JS's int32)."""
    return (a * b) & M32


class Mulberry32:
    """mulberry32 med 32-bit tilstand, så samme seed altid giver samme talrække."""

    def __init__(self, seed: int):
        self.state = seed & M32

    def uint32(self) -> int:
        self.state = (self.state + 0x6D2B79F5) & M32
        s = self.state
        t = _imul(s ^ (s >> 15), s | 1)
        t = (t ^ ((t + _imul(t ^ (t >> 7), t | 61)) & M32)) & M32
        return (t ^ (t >> 14)) & M32

    def next(self) -> float:
        return self.uint32() / 2**32

    def int(self, n: int) -> int:
        """Et heltal i [0, n), præcis ligefordelt: værdier over det største multiplum af n afvises."""
        limit = 2**32 - (2**32 % n)
        x = self.uint32()
        while x >= limit:
            x = self.uint32()
        return x % n


def shuffle(items: list, rng: Mulberry32) -> list:
    """Fisher–Yates på stedet, som shuffle i rng.ts."""
    for i in range(len(items) - 1, 0, -1):
        j = rng.int(i + 1)
        items[i], items[j] = items[j], items[i]
    return items


FASTE_SEEDS = [0, 1, 42, 2**32 - 1]


def faste_tal() -> dict:
    """De første 20 uint32, 20 × int(13), 20 × int(52) og en blandet kortstok for hvert af de faste seeds."""
    ud = {}
    for seed in FASTE_SEEDS:
        r = Mulberry32(seed)
        uint32 = [r.uint32() for _ in range(20)]
        r = Mulberry32(seed)
        int13 = [r.int(13) for _ in range(20)]
        r = Mulberry32(seed)
        int52 = [r.int(52) for _ in range(20)]
        kortstok = shuffle(list(range(52)), Mulberry32(seed))
        ud[str(seed)] = {"uint32": uint32, "int13": int13, "int52": int52, "kortstok": kortstok}
    return ud


if __name__ == "__main__":
    if "--fast" in sys.argv:
        json.dump(faste_tal(), sys.stdout, separators=(",", ":"))
        sys.stdout.write("\n")
    else:
        print(__doc__)
