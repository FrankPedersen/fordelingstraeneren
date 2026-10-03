import { useMemo, useState } from 'react';
import bankText from '../content/suit-combinations.json?raw';
import solutionsText from '../content/solutions.json?raw';
import { loadBank } from '../analysis';
import { Analysevindue } from './Analysevindue';
import { TEXT } from './texts';
import './tokens.css';
import './farvebehandling.css';

type Tab = 'training' | 'practice' | 'analysis';

interface FarvebehandlingScreenProps {
  onBack(): void;
}

/** Farvebehandlingens skal: tilbage til forsiden og fanerne Træning, Selvvalgt og Analyse. */
export default function FarvebehandlingScreen({ onBack }: FarvebehandlingScreenProps) {
  const [tab, setTab] = useState<Tab>('analysis');
  const bank = useMemo(() => loadBank(bankText, solutionsText), []);
  return (
    <main className="fb-screen">
      <header className="fb-header">
        <button type="button" className="round" aria-label={TEXT.back} onClick={onBack}>
          ←
        </button>
        <h1>{TEXT.title}</h1>
        <nav className="fb-tabs" aria-label={TEXT.title}>
          {(['training', 'practice', 'analysis'] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={`fb-tab${tab === t ? ' fb-tab-current' : ''}`}
              aria-current={tab === t ? 'page' : undefined}
              onClick={() => setTab(t)}
            >
              {TEXT.tabs[t]}
            </button>
          ))}
        </nav>
      </header>
      {tab === 'analysis' ? <Analysevindue bank={bank} /> : <p className="card">{TEXT.comingSoon(TEXT.tabs[tab])}</p>}
    </main>
  );
}
