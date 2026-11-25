"""Generatoren til Find udspillet (SPEC-modspil-v2.md, trin 1, Generatoren).

    python tools/udspil/generer.py --situation S2-stayman    én situation; fortsætter, hvor den slap
    python tools/udspil/generer.py --alle                    alle otte efter hinanden
    python tools/udspil/generer.py --situation S1-1nt-3nt --antal 1 --ud C:\\temp\\proeve
                                                             prøvekørsel: én opgave og eksemplerne i en anden mappe

For hver situation giver mulberry32(situationens seed) en række seeds; en opgave er det første deal(seed), hvor alle fire
hænder opfylder kravene, og Vests hånd er opgaven. For hver opgave giver mulberry32(opgavens seed) en række seeds; for hvert
blandes de 39 kort, Vest ikke har, og gives til N, Ø og S, og fordelingen bruges, når de tre hænder opfylder kravene. DDS
regner modspillets stik for hvert af Vests 13 kort i hver fordeling. Eksemplerne (fast hånd) regnes på samme måde med
eksemplets seed.

Rådata: tools/udspil/raa/<id>.json. Appens data: src/modspil/content/udspil/<id>.json. Begge skrives efter hver opgave.
"""
import argparse
import datetime
import json
import sys
import time
from importlib.metadata import version
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from dds import fra_pbn, modspillets_stik  # noqa: E402
from dealer import deal_hvis, fordeling_hvis  # noqa: E402
from krav import alle_opfyldt, opfyldt  # noqa: E402
from rng import Mulberry32  # noqa: E402

GENERATOR_VERSION = 1
HER = Path(__file__).resolve().parent
ROD = HER.parents[1]
SITUATIONER = ROD / "src" / "modspil" / "content" / "udspil" / "situationer.json"


def laes_situationer() -> dict:
    with open(SITUATIONER, encoding="utf-8") as f:
        return json.load(f)


def kontraktens_maal(kontrakt: str) -> tuple:
    """Benævnelsen og modspillets stik for at sætte kontrakten, fx "3NT" → ("NT", 4)."""
    niveau = int(kontrakt[0])
    return kontrakt[1:], 8 - niveau


def tjek(sit: dict, pladser: str) -> dict:
    """Kravene som funktioner pr. plads, til deal_hvis og fordeling_hvis."""
    return {p: (lambda h, k=sit["krav"][p]: opfyldt(h, k)) for p in pladser}


def find_opgaver(sit: dict):
    """Opgavernes seeds i rækkefølge (uendelig generator) med antal forsøg siden forrige opgave."""
    rng = Mulberry32(sit["seed"])
    forsoeg = 0
    while True:
        seed = rng.uint32()
        forsoeg += 1
        h = deal_hvis(seed, tjek(sit, "NESW"))
        if h is not None:
            yield seed, sorted(h["W"]), forsoeg
            forsoeg = 0


def find_fordelinger(sit: dict, vest: list, seed: int, antal: int) -> tuple:
    """De første `antal` fordelinger, der passer med kravene til N, Ø og S, og antal forsøg i alt."""
    rng = Mulberry32(seed)
    kontrol = tjek(sit, "NES")
    seeds, haender, forsoeg = [], [], 0
    while len(seeds) < antal:
        s = rng.uint32()
        forsoeg += 1
        f = fordeling_hvis(vest, s, kontrol)
        if f is not None:
            seeds.append(s)
            haender.append(f)
    return seeds, haender, forsoeg


def regn_opgave(sit: dict, seed: int, vest: list, antal: int) -> dict:
    benaevnelse, _ = kontraktens_maal(sit["kontrakt"])
    seeds, haender, forsoeg = find_fordelinger(sit, vest, seed, antal)
    return {"seed": seed, "vest": vest, "forsoeg": forsoeg, "fordelinger": seeds, "stik": modspillets_stik(haender, benaevnelse)}


def middel_hundrededele(stik_kolonne: list) -> int:
    """Middelstikket i hundrededele, rundet halvt op med heltal: round(100 × sum / n)."""
    n = len(stik_kolonne)
    return (200 * sum(stik_kolonne) + n) // (2 * n)


def opsummering(opgave: dict, maal: int) -> dict:
    kolonner = list(zip(*opgave["stik"]))
    return {
        "seed": opgave["seed"],
        "vest": opgave["vest"],
        "middel": [middel_hundrededele(list(k)) / 100 for k in kolonner],
        "saet": [sum(1 for x in k if x >= maal) for k in kolonner],
    }


def skriv(sti: Path, data: dict) -> None:
    sti.parent.mkdir(parents=True, exist_ok=True)
    tmp = sti.with_suffix(".tmp")
    with open(tmp, "w", encoding="utf-8", newline="\n") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")
    tmp.replace(sti)


def hoved(sit: dict, antal_fordelinger: int) -> dict:
    return {
        "id": sit["id"],
        "generator": GENERATOR_VERSION,
        "endplay": version("endplay"),
        "dato": datetime.date.today().isoformat(),
        "fordelinger": antal_fordelinger,
        "kontrakt": sit["kontrakt"],
    }


def koer(sit: dict, antal_opgaver: int, antal_fordelinger: int, raa_mappe: Path, app_mappe: Path) -> None:
    raa_sti = raa_mappe / f"{sit['id']}.json"
    _, maal = kontraktens_maal(sit["kontrakt"])
    raa = None
    if raa_sti.exists():
        with open(raa_sti, encoding="utf-8") as f:
            raa = json.load(f)
        if raa["fordelinger"] != antal_fordelinger or raa["generator"] != GENERATOR_VERSION:
            sys.exit(f"{raa_sti} har {raa['fordelinger']} fordelinger og generator {raa['generator']}; slet filen for at starte forfra.")
    if raa is None:
        raa = {**hoved(sit, antal_fordelinger), "opgaver": [], "eksempler": []}

    def gem() -> None:
        raa["dato"] = datetime.date.today().isoformat()
        skriv(raa_sti, raa)
        app = {**hoved(sit, antal_fordelinger), "opgaver": [opsummering(o, maal) for o in raa["opgaver"]],
               "eksempler": [{**opsummering(o, maal), "haand": o["haand"]} for o in raa["eksempler"]]}
        skriv(app_mappe / f"{sit['id']}.json", app)

    start = time.time()
    regnet = 0
    kilde = find_opgaver(sit)
    for i in range(antal_opgaver):
        seed, vest, _ = next(kilde)
        if i < len(raa["opgaver"]):
            if raa["opgaver"][i]["seed"] != seed:
                sys.exit(f"Opgave {i + 1} i {raa_sti} har et andet seed end generatoren; slet filen for at starte forfra.")
            continue
        raa["opgaver"].append(regn_opgave(sit, seed, vest, antal_fordelinger))
        regnet += 1
        gem()
        pr_opgave = (time.time() - start) / regnet
        tilbage = (antal_opgaver - i - 1) * pr_opgave
        print(f"{sit['id']}: opgave {i + 1}/{antal_opgaver}, {pr_opgave:.1f} s pr. opgave, ca. {tilbage / 60:.0f} min tilbage", flush=True)

    for j, eks in enumerate(sit.get("eksempler", [])):
        if j < len(raa["eksempler"]) and raa["eksempler"][j]["haand"] == eks["haand"] and raa["eksempler"][j]["seed"] == eks["seed"]:
            continue
        vest = fra_pbn(eks["haand"])
        if not alle_opfyldt({"W": vest}, sit["krav"], ("W",)):
            sys.exit(f"{sit['id']}: eksemplets hånd {eks['haand']} opfylder ikke kravene til Vest.")
        o = regn_opgave(sit, eks["seed"], vest, antal_fordelinger)
        o["haand"] = eks["haand"]
        raa["eksempler"][j:j + 1] = [o]
        gem()
        print(f"{sit['id']}: eksempel {j + 1} ({eks['haand']}) regnet", flush=True)
    del raa["eksempler"][len(sit.get("eksempler", [])):]
    gem()
    print(f"{sit['id']}: færdig på {(time.time() - start) / 60:.1f} min", flush=True)


def main() -> None:
    p = argparse.ArgumentParser(description="Generatoren til Find udspillet")
    g = p.add_mutually_exclusive_group(required=True)
    g.add_argument("--situation", help="situationens id, fx S2-stayman")
    g.add_argument("--alle", action="store_true", help="alle situationer efter hinanden")
    p.add_argument("--antal", type=int, help="antal opgaver (standard: tallet i situationer.json)")
    p.add_argument("--ud", type=Path, help="anden mappe til rådata og appens data (prøvekørsel)")
    a = p.parse_args()

    fil = laes_situationer()
    situationer = fil["situationer"] if a.alle else [s for s in fil["situationer"] if s["id"] == a.situation]
    if not situationer:
        sys.exit(f"Ukendt situation: {a.situation}. Kendte: {', '.join(s['id'] for s in fil['situationer'])}")
    antal = a.antal or fil["opgaver"]
    raa_mappe = a.ud / "raa" if a.ud else HER / "raa"
    app_mappe = a.ud / "app" if a.ud else SITUATIONER.parent
    for sit in situationer:
        koer(sit, antal, fil["fordelinger"], raa_mappe, app_mappe)


if __name__ == "__main__":
    main()
