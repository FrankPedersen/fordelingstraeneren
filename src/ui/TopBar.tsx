/**
 * Topbjælken (SPEC-forside-spor.md, Topbjælken): den smalle sorte bjælke helt øverst på forsiden og sporenes skærme,
 * som på alle sider på www.kontraktbridge.dk. Ikke i en session og ikke i dialoger. Ingen menu og ingen sprogknap;
 * sprogknappen står i appens hoved. Farverne er ens i lys og mørk tilstand (`footer-bg`, `footer-text`, `footer-accent`).
 */
export function TopBar() {
  return (
    <header className="topbar">
      <a className="topbar-brand" href="https://www.kontraktbridge.dk/">
        <span className="kb-logo" aria-hidden="true">
          7NT
        </span>
        <span className="topbar-name">Kontraktbridge</span>
      </a>
      <span className="topbar-app">Fordelingstræneren</span>
    </header>
  );
}
