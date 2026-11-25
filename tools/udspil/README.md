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

## Varianterne (SPEC-udspilsraad.md)

Kompendiets udspilsråd testes også på ekstra hænder, hvor Vests hånd har en bestemt form: en singleton (S4, S5 og S8), en doubleton uden honnør (S4 og S8) eller "table feeling" mod sans (S1 og S2). Varianterne står i `varianter.json`: situationen, det ekstra krav til Vest (`farveMed` eller `tableFeeling`, se `krav.py`) og variantens eget seed. Opgaverne og fordelingerne laves som situationernes; alle situationens krav gælder stadig. Kørslen skriver kun rådata i `raa/varianter/<variant>.json` og ingen appdata, og den kan afbrydes og startes igen som `--situation`.

Én variant ad gangen eller alle syv efter hinanden, og bagefter DDS-tjekket:

```powershell
tools\udspil\.venv\Scripts\python tools\udspil\generer.py --variant S4-singleton
tools\udspil\.venv\Scripts\python tools\udspil\generer.py --varianter
tools\udspil\.venv\Scripts\python tools\udspil\kontrol.py --varianter
```

En prøvekørsel med 2 hænder i en anden mappe: `generer.py --variant S4-singleton --antal 2 --ud C:\temp\proeve`.

## Filerne

- `rng.py`, `dealer.py`: porte af appens `src/engine/rng.ts` og `deal` i `src/domain/dealer.ts`. `rng-fast.json` er de faste tal til TS-testen (`python tools/udspil/rng.py --fast`).
- `system.py`, `krav.py`: kravene til hænderne fra `src/modspil/content/udspil/situationer.json`.
- `dds.py`: DDS via `endplay`.
- `generer.py`: opgaverne, fordelingerne og stikkene. Skriver `raa/<id>.json` og appens data `src/modspil/content/udspil/<id>.json`; med `--variant` og `--varianter` kun `raa/varianter/<variant>.json`.
- `kontrol.py`: DDS-tjekket og stabiliteten (`raa/stabilitet/<id>.json`); `--varianter` tjekker varianternes rådata.
- `varianter.json`: varianterne til SPEC-udspilsraad.md.
