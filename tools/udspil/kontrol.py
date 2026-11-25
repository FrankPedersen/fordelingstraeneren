"""Kontrollen af datasættet (SPEC-modspil-v2.md, trin 1, Kontrollen). Køres efter generatoren.

    python tools/udspil/kontrol.py --dds           DDS mod DDS-tabellen i 10 % af fordelingerne (hver tiende)
    python tools/udspil/kontrol.py --stabilitet    5 opgaver pr. situation regnet igen med 100 nye fordelinger
    python tools/udspil/kontrol.py --alt           begge
    python tools/udspil/kontrol.py --varianter     DDS-tjekket på varianternes rådata (SPEC-udspilsraad.md);
                                                   --variant S4-singleton tjekker kun den ene

DDS-tjekket: stikket for Vests bedste kort skal være 13 minus Syds stik i kontraktens benævnelse fra calc_dd_table, som er
en anden indgang i DDS end solve_board. Stabiliteten skriver tools/udspil/raa/stabilitet/<id>.json (samme form som
rådataene); TS-testen src/modspil/udspil/stabilitet.test.ts sammenligner med de første regninger.
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import generer as g  # noqa: E402
from dds import syds_stik  # noqa: E402
from dealer import fordeling  # noqa: E402

import json  # noqa: E402

STABILE_OPGAVER = 5
#: Det andet seed til stabiliteten: opgavens seed XOR denne konstant.
ANDET_SEED = 0x9E3779B9
RAA = g.HER / "raa"


def laes_raa(sit: dict) -> dict:
    sti = RAA / f"{sit['id']}.json"
    if not sti.exists():
        sys.exit(f"{sti} findes ikke; kør generatoren først.")
    with open(sti, encoding="utf-8") as f:
        return json.load(f)


def dds_tjek(sit: dict) -> int:
    return dds_tjek_raa(sit["id"], laes_raa(sit), sit["kontrakt"])


def dds_tjek_raa(navn: str, raa: dict, kontrakt: str) -> int:
    """Hver tiende fordeling (10 %) i opgaverne og eksemplerne tjekkes mod DDS-tabellen; giver antal afvigelser."""
    benaevnelse, _ = g.kontraktens_maal(kontrakt)
    fejl = tjekket = 0
    for o in raa["opgaver"] + raa["eksempler"]:
        for i in range(0, len(o["fordelinger"]), 10):
            h = fordeling(o["vest"], o["fordelinger"][i])
            forventet = 13 - syds_stik(h, benaevnelse)
            tjekket += 1
            if max(o["stik"][i]) != forventet:
                fejl += 1
                print(f"  {navn} opgave {o['seed']} fordeling {o['fordelinger'][i]}: {max(o['stik'][i])} ≠ {forventet}")
    print(f"{navn}: {tjekket} fordelinger tjekket mod DDS-tabellen, {fejl} afvigelser", flush=True)
    return fejl


def dds_tjek_variant(variant: dict, situationer: list) -> int:
    """DDS-tjekket på variantens rådata (raa/varianter/<id>.json, SPEC-udspilsraad.md)."""
    sti = RAA / "varianter" / f"{variant['id']}.json"
    if not sti.exists():
        sys.exit(f"{sti} findes ikke; kør generatoren først (generer.py --variant {variant['id']}).")
    with open(sti, encoding="utf-8") as f:
        raa = json.load(f)
    return dds_tjek_raa(variant["id"], raa, g.variantens_situation(variant, situationer)["kontrakt"])


def stabilitet(sit: dict) -> None:
    raa = laes_raa(sit)
    ud = RAA / "stabilitet" / f"{sit['id']}.json"
    data = {**g.hoved(sit, raa["fordelinger"]), "andetSeed": ANDET_SEED, "opgaver": []}
    if ud.exists():
        with open(ud, encoding="utf-8") as f:
            data = json.load(f)
    for o in raa["opgaver"][:STABILE_OPGAVER]:
        if any(x["seed"] == o["seed"] for x in data["opgaver"]):
            continue
        ny = g.regn_opgave(sit, o["seed"] ^ ANDET_SEED, o["vest"], raa["fordelinger"])
        ny["seed"] = o["seed"]
        ny["fordelingsseed"] = o["seed"] ^ ANDET_SEED
        data["opgaver"].append(ny)
        g.skriv(ud, data)
        print(f"{sit['id']}: stabilitet {len(data['opgaver'])}/{STABILE_OPGAVER}", flush=True)


def main() -> None:
    p = argparse.ArgumentParser(description="Kontrollen af datasættet til Find udspillet")
    p.add_argument("--dds", action="store_true")
    p.add_argument("--stabilitet", action="store_true")
    p.add_argument("--alt", action="store_true")
    p.add_argument("--varianter", action="store_true", help="DDS-tjekket på alle varianter (SPEC-udspilsraad.md)")
    p.add_argument("--variant", help="DDS-tjekket på denne variant")
    p.add_argument("--situation", help="kun denne situation")
    p.add_argument("--raa", type=Path, help="anden mappe med rådata (prøvekørsel)")
    a = p.parse_args()
    global RAA
    if a.raa:
        RAA = a.raa
    if not (a.dds or a.stabilitet or a.alt or a.varianter or a.variant):
        p.error("vælg --dds, --stabilitet, --alt, --varianter eller --variant")
    if a.varianter or a.variant:
        alle = g.laes_varianter()["varianter"]
        varianter = [v for v in alle if a.varianter or v["id"] == a.variant]
        if not varianter:
            sys.exit(f"Ukendt variant: {a.variant}. Kendte: {', '.join(v['id'] for v in alle)}")
        situationer = g.laes_situationer()["situationer"]
        fejl = sum(dds_tjek_variant(v, situationer) for v in varianter)
        sys.exit(1 if fejl else 0)
    situationer = [s for s in g.laes_situationer()["situationer"] if not a.situation or s["id"] == a.situation]
    fejl = 0
    if a.dds or a.alt:
        fejl = sum(dds_tjek(s) for s in situationer)
    if a.stabilitet or a.alt:
        for s in situationer:
            stabilitet(s)
    sys.exit(1 if fejl else 0)


if __name__ == "__main__":
    main()
