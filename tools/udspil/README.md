# Generatoren til Find udspillet

SPEC-modspil-v2.md, trin 1. Alle kommandoer køres fra repoets rod (`C:\Users\frank\Kontraktbridge\Fordelingstræneren`) i PowerShell.

## Første gang: Python og endplay

`endplay` 0.5.12 har færdige hjul til Python 3.9–3.13, men ikke til 3.14. Python 3.13 installeres fra python.org (eller `winget install Python.Python.3.13`), og venv'et laves med den:

```powershell
py -3.13 -m venv tools\udspil\.venv
tools\udspil\.venv\Scripts\python -m pip install -r tools\udspil\requirements.txt
tools\udspil\.venv\Scripts\python -c "import endplay; print(endplay.__version__)"
```

Den sidste linje skal skrive `0.5.12`.

## Kørslen

Én situation ad gangen (Franks svar 8). Kørslen skriver fremdriften og den forventede tid tilbage, og den kan afbrydes med Ctrl+C og startes igen: den fortsætter, hvor den slap.

```powershell
tools\udspil\.venv\Scripts\python tools\udspil\generer.py --situation S1-1nt-3nt
tools\udspil\.venv\Scripts\python tools\udspil\generer.py --situation S2-stayman
tools\udspil\.venv\Scripts\python tools\udspil\generer.py --situation S3-transfer
tools\udspil\.venv\Scripts\python tools\udspil\generer.py --situation S4-kun-en-farve
tools\udspil\.venv\Scripts\python tools\udspil\generer.py --situation S5-sidefarve
tools\udspil\.venv\Scripts\python tools\udspil\generer.py --situation S6-trumf
tools\udspil\.venv\Scripts\python tools\udspil\generer.py --situation S7-makker-aabnet
tools\udspil\.venv\Scripts\python tools\udspil\generer.py --situation S8-delkontrakt
```

`--alle` kører alle otte efter hinanden. Bagefter kontrollen (DDS mod DDS-tabellen og stabiliteten):

```powershell
tools\udspil\.venv\Scripts\python tools\udspil\kontrol.py --alt
```

## Filerne

- `rng.py`, `dealer.py`: porte af appens `src/engine/rng.ts` og `deal` i `src/domain/dealer.ts`. `rng-fast.json` er de faste tal til TS-testen (`python tools/udspil/rng.py --fast`).
- `system.py`, `krav.py`: kravene til hænderne fra `src/modspil/content/udspil/situationer.json`.
- `dds.py`: DDS via `endplay`.
- `generer.py`: opgaverne, fordelingerne og stikkene. Skriver `raa/<id>.json` og appens data `src/modspil/content/udspil/<id>.json`.
- `kontrol.py`: DDS-tjekket og stabiliteten (`raa/stabilitet/<id>.json`).
