import { useRef, useState } from 'react';
import { dayOf } from '../../engine/dates';
import { formatInt } from '../../engine/format';
import {
  exportFileName,
  parseImport,
  summarize,
  type Saved,
  type Skill,
  type Summary,
} from '../../engine/storage';
import { secondsText } from '../../ui/text';

interface SettingsScreenProps {
  saved: Saved;
  onSave(saved: Saved): void;
  onBack(): void;
}

const FAST_STEP_MS = 500;
const FAST_MIN_MS = 1000;
const FAST_MAX_MS = 30_000;

export function SettingsScreen({ saved, onSave, onBack }: SettingsScreenProps) {
  const [incoming, setIncoming] = useState<Saved | null>(null);
  const [message, setMessage] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  function exportData() {
    const today = dayOf(Date.now(), saved.settings.dayStartsAtHour);
    const blob = new Blob([JSON.stringify(saved, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = exportFileName(today);
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage('');
  }

  async function readFile(file: File | undefined) {
    if (!file) return;
    const result = parseImport(await file.text());
    if (result.ok) {
      setIncoming(result.saved);
      setMessage('');
    } else {
      setIncoming(null);
      setMessage(result.error);
    }
  }

  function confirmImport() {
    if (!incoming) return;
    onSave(incoming);
    setIncoming(null);
    setMessage('Dine data er importeret.');
  }

  function setFast(skill: Skill, ms: number) {
    const value = Math.min(FAST_MAX_MS, Math.max(FAST_MIN_MS, ms));
    onSave({ ...saved, settings: { ...saved.settings, fastMs: { ...saved.settings.fastMs, [skill]: value } } });
  }

  return (
    <main className="screen">
      <header className="screen-head">
        <button type="button" className="round" aria-label="Tilbage" onClick={onBack}>
          ←
        </button>
        <h1>Indstillinger</h1>
      </header>

      <section className="card">
        <h2>Sikkerhedskopi</h2>
        <p className="muted small">
          Dine data ligger kun i denne browser på denne enhed. Eksportér dem jævnligt, og importér filen,
          hvis du skifter enhed eller browser.
        </p>
        <button type="button" className="btn" onClick={exportData}>
          Eksportér data
        </button>
        <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
          Importér data
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            void readFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        {message && (
          <p role="status" className="note">
            {message}
          </p>
        )}
      </section>

      {incoming && (
        <ImportSummary
          current={summarize(saved)}
          incoming={summarize(incoming)}
          onConfirm={confirmImport}
          onCancel={() => setIncoming(null)}
        />
      )}

      <section className="card">
        <h2>Hurtige svar</h2>
        <p className="muted small">Et rigtigt svar under tærsklen rykker emnet op i næste kasse.</p>
        <Stepper
          label="Højere/lavere"
          value={saved.settings.fastMs.compare}
          onChange={(ms) => setFast('compare', ms)}
        />
        <Stepper
          label="Fuldfør mønsteret"
          value={saved.settings.fastMs.complete}
          onChange={(ms) => setFast('complete', ms)}
        />
      </section>
    </main>
  );
}

function Stepper({ label, value, onChange }: { label: string; value: number; onChange(ms: number): void }) {
  return (
    <div className="stepper">
      <span>{label}</span>
      <button
        type="button"
        className="round"
        aria-label={`Kortere tærskel for ${label}`}
        disabled={value <= FAST_MIN_MS}
        onClick={() => onChange(value - FAST_STEP_MS)}
      >
        −
      </button>
      <output>{secondsText(value)}</output>
      <button
        type="button"
        className="round"
        aria-label={`Længere tærskel for ${label}`}
        disabled={value >= FAST_MAX_MS}
        onClick={() => onChange(value + FAST_STEP_MS)}
      >
        +
      </button>
    </div>
  );
}

interface ImportSummaryProps {
  current: Summary;
  incoming: Summary;
  onConfirm(): void;
  onCancel(): void;
}

function ImportSummary({ current, incoming, onConfirm, onCancel }: ImportSummaryProps) {
  const rows: [string, (s: Summary) => string][] = [
    ['XP', (s) => formatInt(s.xp)],
    ['Streak', (s) => `${s.streak} (bedste ${s.best})`],
    ['Emner', (s) => String(s.items)],
    ['Sessioner', (s) => String(s.sessions)],
    ['Seneste dag', (s) => s.lastDay || '–'],
  ];
  return (
    <section className="card" aria-labelledby="import-title">
      <h2 id="import-title">Importér filen?</h2>
      <p className="muted small">Filen erstatter alle dine nuværende data.</p>
      <table className="summary">
        <thead>
          <tr>
            <th />
            <th scope="col">Nu</th>
            <th scope="col">Filen</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              <td>{value(current)}</td>
              <td>{value(incoming)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="btn primary" onClick={onConfirm}>
        Overskriv mine data
      </button>
      <button type="button" className="btn" onClick={onCancel}>
        Annullér
      </button>
    </section>
  );
}
