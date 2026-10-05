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
import { READ_MS } from '../../modes/read/task';
import { secondsText } from '../../ui/text';
import { tx } from '../../i18n';
import { Info } from '../../ui/Info';

interface SettingsScreenProps {
  saved: Saved;
  onSave(saved: Saved): void;
  onBack(): void;
}

/** Importens fejlbeskeder fra lagringen på det aktuelle sprog. */
const IMPORT_ERRORS_EN: Record<string, string> = {
  'Filen er ikke gyldig JSON.': 'The file is not valid JSON.',
  'Filen indeholder ikke data fra Fordelingstræneren.': 'The file does not contain data from Fordelingstræneren.',
  'Filen er fra en nyere version af appen.': 'The file is from a newer version of the app.',
};
const importError = (message: string) => tx(message, IMPORT_ERRORS_EN[message] ?? message);

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
      setMessage(importError(result.error));
    }
  }

  function confirmImport() {
    if (!incoming) return;
    onSave(incoming);
    setIncoming(null);
    setMessage(tx('Dine data er importeret.', 'Your data has been imported.'));
  }

  function setFast(skill: Skill, ms: number) {
    const value = Math.min(FAST_MAX_MS, Math.max(FAST_MIN_MS, ms));
    onSave({ ...saved, settings: { ...saved.settings, fastMs: { ...saved.settings.fastMs, [skill]: value } } });
  }

  return (
    <main className="screen">
      <header className="screen-head">
        <button type="button" className="round" aria-label={tx('Tilbage', 'Back')} onClick={onBack}>
          ←
        </button>
        <h1>{tx('Indstillinger', 'Settings')}</h1>
      </header>

      <section className="card">
        <div className="with-info">
          <h2>{tx('Sikkerhedskopi', 'Backup')}</h2>
          <Info topic={tx('Sikkerhedskopi', 'Backup')}>
            {tx(
              'Eksportér gemmer alle fordelingssporets data i en fil (farvebehandling har sin egen eksport under Træning → Dine data). Importér viser først, hvad filen indeholder, og erstatter først dine data, når du bekræfter.',
              'Export saves all the distribution track’s data in a file (suit combinations has its own export under Training → Your data). Import first shows what the file contains and only replaces your data when you confirm.',
            )}
          </Info>
        </div>
        <p className="muted small">
          {tx(
            'Dine data ligger kun i denne browser på denne enhed. Eksportér dem jævnligt, og importér filen, hvis du skifter enhed eller browser.',
            'Your data is stored only in this browser on this device. Export it regularly, and import the file if you change device or browser.',
          )}
        </p>
        <button type="button" className="btn" onClick={exportData}>
          {tx('Eksportér data', 'Export data')}
        </button>
        <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
          {tx('Importér data', 'Import data')}
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
        <div className="with-info">
          <h2>{tx('Hurtige svar', 'Fast answers')}</h2>
          <Info topic={tx('Hurtige svar', 'Fast answers')}>
            {tx(
              'Tærsklen er den tid, et svar højst må tage for at tælle som hurtigt. Kun hurtige rigtige svar rykker emnet op i Leitner-systemet; langsomme rigtige svar bliver stående. Tryk − og + for at justere.',
              'The threshold is the longest time an answer may take to count as fast. Only fast right answers move the item up in the Leitner system; slow right answers stay where they are. Tap − and + to adjust.',
            )}
          </Info>
        </div>
        <p className="muted small">{tx('Et rigtigt svar under tærsklen rykker emnet op i næste kasse.', 'A right answer below the threshold moves the item up to the next box.')}</p>
        <Stepper
          label={tx('Højere/lavere', 'Higher/lower')}
          value={saved.settings.fastMs.compare}
          onChange={(ms) => setFast('compare', ms)}
        />
        <Stepper
          label={tx('Fuldfør mønsteret', 'Complete the pattern')}
          value={saved.settings.fastMs.complete}
          onChange={(ms) => setFast('complete', ms)}
        />
        <Stepper
          label={tx('Lynaflæsning', 'Lightning reading')}
          value={saved.settings.fastMs.read}
          onChange={(ms) => setFast('read', ms)}
        />
      </section>

      <section className="card">
        <div className="with-info">
          <h2>{tx('Lynaflæsning', 'Lightning reading')}</h2>
          <Info topic={tx('Lynaflæsning', 'Lightning reading')}>
            {tx(
              '"Til jeg trykker Klar": hånden står, til du er klar, og svartiden måles derfra. "Kort tid": hånden vises kun et øjeblik, og tiden tilpasser sig dig. "Sorteret efter farve" er en hjælp i starten.',
              '"Until I tap Ready": the hand stays until you are ready, and the answer time is measured from then. "Short time": the hand is shown only for a moment, and the time adapts to you. "Sorted by suit" is a help at the start.',
            )}
          </Info>
        </div>
        <p className="muted small">
          {tx(
            'Svartiden måles fra, hånden er skjult. Med kort visningstid bliver tiden 10 % kortere efter et rigtigt svar og 15 % længere efter en fejl (0,8–5 s).',
            'The answer time is measured from when the hand is hidden. With a short display time, the time gets 10 % shorter after a right answer and 15 % longer after a mistake (0.8–5 s).',
          )}
        </p>
        <Choice
          label={tx('Hånden vises', 'The hand is shown')}
          options={[
            ['tap', tx('Til jeg trykker Klar', 'Until I tap Ready')],
            ['timed', tx(`Kort tid (nu ${secondsText(saved.readMs ?? READ_MS.start)})`, `Short time (now ${secondsText(saved.readMs ?? READ_MS.start)})`)],
          ]}
          value={saved.settings.readShow ?? 'tap'}
          onChange={(readShow) => onSave({ ...saved, settings: { ...saved.settings, readShow } })}
        />
        <Choice
          label={tx('Kortene', 'The cards')}
          options={[
            ['unsorted', tx('Usorteret', 'Unsorted')],
            ['sorted', tx('Sorteret efter farve', 'Sorted by suit')],
          ]}
          value={saved.settings.readSorted ? 'sorted' : 'unsorted'}
          onChange={(v) => onSave({ ...saved, settings: { ...saved.settings, readSorted: v === 'sorted' } })}
        />
      </section>
    </main>
  );
}

function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: [T, string][];
  value: T;
  onChange(value: T): void;
}) {
  return (
    <div className="field" role="group" aria-label={label}>
      <span>{label}</span>
      <div className="actions">
        {options.map(([key, text]) => (
          <button
            key={key}
            type="button"
            className={`btn small-btn choice-btn${value === key ? ' selected' : ''}`}
            aria-pressed={value === key}
            onClick={() => onChange(key)}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

function Stepper({ label, value, onChange }: { label: string; value: number; onChange(ms: number): void }) {
  return (
    <div className="stepper">
      <span>{label}</span>
      <button
        type="button"
        className="round"
        aria-label={tx(`Kortere tærskel for ${label}`, `Shorter threshold for ${label}`)}
        disabled={value <= FAST_MIN_MS}
        onClick={() => onChange(value - FAST_STEP_MS)}
      >
        −
      </button>
      <output>{secondsText(value)}</output>
      <button
        type="button"
        className="round"
        aria-label={tx(`Længere tærskel for ${label}`, `Longer threshold for ${label}`)}
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
    ['Streak', (s) => `${s.streak} (${tx('bedste', 'best')} ${s.best})`],
    [tx('Emner', 'Items'), (s) => String(s.items)],
    [tx('Sessioner', 'Sessions'), (s) => String(s.sessions)],
    [tx('Seneste dag', 'Last day'), (s) => s.lastDay || '–'],
  ];
  return (
    <section className="card" aria-labelledby="import-title">
      <h2 id="import-title">{tx('Importér filen?', 'Import the file?')}</h2>
      <p className="muted small">{tx('Filen erstatter alle dine nuværende data.', 'The file replaces all your current data.')}</p>
      <table className="summary">
        <thead>
          <tr>
            <th />
            <th scope="col">{tx('Nu', 'Now')}</th>
            <th scope="col">{tx('Filen', 'The file')}</th>
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
        {tx('Overskriv mine data', 'Overwrite my data')}
      </button>
      <button type="button" className="btn" onClick={onCancel}>
        {tx('Annullér', 'Cancel')}
      </button>
    </section>
  );
}
