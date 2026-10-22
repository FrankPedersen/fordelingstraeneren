import { tx } from '../i18n';

/**
 * Sidefoden (SPEC-forside-spor.md, Sidefoden): den samme sorte sidefod som på www.kontraktbridge.dk, nederst på forsiden
 * og sporenes skærme, ikke i en session og ikke i dialoger. Om mig, Trænere med de samme links som på
 * www.kontraktbridge.dk, Opslag med Bridgeordbog (SPEC-sprog-og-ordbog.md) og Kontakt med linket til
 * kontaktformularen på Om mig (SPEC-kontaktformular.md, del 3). De fire spor og modulet Analyse (SPEC-analyse-modul.md) åbnes i appen med deres
 * adresse (`#fordeling`, `#analyse` osv.), så de også virker offline; links ud af appen åbnes i samme vindue og virker
 * kun online.
 */
export function Footer() {
  const tracks = [
    { href: '#fordeling', title: tx('Fordeling', 'Distribution') },
    { href: '#pointregnskab', title: tx('Pointregnskab', 'Point count') },
    { href: '#farvebehandling', title: tx('Farvebehandling', 'Suit combinations') },
    { href: '#haandevaluering', title: tx('Håndevaluering', 'Hand evaluation') },
    { href: '#analyse', title: tx('Analyse', 'Analysis') },
  ];
  return (
    <footer className="site-footer">
      <div className="site-footer-about">
        <a className="site-footer-name" href="https://www.kontraktbridge.dk/">
          <span className="kb-logo" aria-hidden="true">
            7NT
          </span>
          Kontraktbridge
        </a>
        <h2>{tx('Om mig', 'About me')}</h2>
        <p>
          {tx(
            'Jeg er bridgeentusiast med forkærlighed for spillets kognitive udfordringer og det gode fællesskab omkring bordet. Jeg elsker at skabe og forbedre ting – og med AI som ny medspiller har jeg bygget et digitalt bridge-univers, der kombinerer logik, læring og spilleglæde.',
            'I am a bridge enthusiast with a soft spot for the cognitive challenges of the game and the good company around the table. I love creating and improving things – and with AI as a new partner, I have built a digital bridge universe that brings together logic, learning and the joy of playing.',
          )}
        </p>
      </div>
      <nav className="site-footer-col" aria-labelledby="site-footer-trainers">
        <h2 id="site-footer-trainers">{tx('Trænere', 'Trainers')}</h2>
        <a href="/konventionstraener/">{tx('Konventionstræner', 'Convention trainer')}</a>
        {tracks.map((t) => (
          <a key={t.href} href={t.href}>
            {t.title}
          </a>
        ))}
      </nav>
      <nav className="site-footer-col" aria-labelledby="site-footer-reference">
        <h2 id="site-footer-reference">{tx('Opslag', 'Reference')}</h2>
        <a href="/ordbog/">{tx('Bridgeordbog', 'Bridge dictionary')}</a>
      </nav>
      <div className="site-footer-col">
        <h2>{tx('Kontakt', 'Contact')}</h2>
        <p>{tx('Har du fundet en fejl, eller har du en idé til en ny træner? Skriv til mig.', 'Have you found a mistake, or do you have an idea for a new trainer? Write to me.')}</p>
        <a className="site-footer-mail" href="/om-mig/#kontakt">
          {tx('Skriv til mig', 'Write to me')}
        </a>
      </div>
      <p className="site-footer-legal">© 2026 Frank Pedersen</p>
    </footer>
  );
}
