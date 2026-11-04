import { tx } from '../i18n';

/**
 * Sidefoden (SPEC-sidefod.md): ens med forsidens kompakte sidefod på www.kontraktbridge.dk, efter målene under Afklaret
 * i SPEC-ny-forside.md. Logo og "Om mig og kontakt", kolonnerne Trænere og Opslag og ©-linjen; Om mig og Kontakt står på
 * om-mig-siden. Den står nederst på forsiden og sporenes skærme, ikke i en session og ikke i dialoger. De fire spor og
 * modulet Analyse (SPEC-analyse-modul.md) åbnes i appen med adresse (`#fordeling`, `#analyse` osv.), så de også virker
 * offline; links ud af appen åbnes i samme vindue og virker kun online.
 */
export function Footer() {
  const trainers = [
    { href: '/konventionstraener/', title: tx('Konventionstræner', 'Convention trainer') },
    { href: '#fordeling', title: tx('Fordeling', 'Distribution') },
    { href: '#pointregnskab', title: tx('Pointregnskab', 'Point count') },
    { href: '#farvebehandling', title: tx('Farvebehandling', 'Suit combinations') },
    { href: '#haandevaluering', title: tx('Håndevaluering', 'Hand evaluation') },
  ];
  const reference = [
    { href: '#analyse', title: tx('Analyse', 'Analysis') },
    { href: '/ordbog/', title: tx('Bridgeordbog', 'Bridge dictionary') },
    { href: '/scoring/', title: tx('Scoring i bridge', 'Scoring in bridge') },
  ];
  const column = (id: string, heading: string, links: { href: string; title: string }[]) => (
    <nav className="site-footer-col" aria-labelledby={id}>
      <h2 id={id}>{heading}</h2>
      <ul>
        {links.map((l) => (
          <li key={l.href}>
            <a href={l.href}>{l.title}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
  return (
    <footer className="site-footer">
      <div className="site-footer-top">
        <div className="site-footer-about">
          <a className="site-footer-name" href="https://www.kontraktbridge.dk/">
            <span className="kb-logo" aria-hidden="true">
              7NT
            </span>
            Kontraktbridge
          </a>
          <p>{tx('Gratis bridgetræning i browseren. Lavet af Frank Pedersen.', 'Free bridge training in the browser. Made by Frank Pedersen.')}</p>
          <a className="site-footer-cta" href="/om-mig/">
            {tx('Om mig og kontakt', 'About me and contact')} <span className="site-footer-arrow" aria-hidden="true">→</span>
          </a>
        </div>
        <div className="site-footer-cols">
          {column('site-footer-trainers', tx('Trænere', 'Trainers'), trainers)}
          {column('site-footer-reference', tx('Opslag', 'Reference'), reference)}
        </div>
      </div>
      <p className="site-footer-legal">
        © 2026 Frank Pedersen
        <span className="site-footer-legal-extra"> · {tx('Gratis bridgetræning i browseren', 'Free bridge training in the browser')}</span>
      </p>
    </footer>
  );
}
