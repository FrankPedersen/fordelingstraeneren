import { useRef, useState } from 'react';
import { dayOf } from '../../engine/dates';
import { formatDecimal } from '../../engine/format';
import { Info } from '../../ui/Info';
import { parsePrImport, prExportFileName, type PrSaved } from '../storage';
import { TEXT } from './texts';

/** Gemmer en kopi af dataene som fil og giver dagen tilbage, så den kan gemmes som `lastExport`. */
export function downloadPrExport(saved: PrSaved, now = Date.now()): string {
  const today = dayOf(now, saved.settings.dayStartsAtHour);
  const blob = new Blob([JSON.stringify(saved, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = prExportFileName(today);
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return today;
}

interface IndstillingerProps {
  saved: PrSaved;
  update(next: PrSaved): void;
  onBack(): void;
}

/** Indstillinger: niveauet, visningstiden og Pointregnskabs egen eksport og import. Andre spors data røres ikke. */
export function Indstillinger({ saved, update, onBack }: IndstillingerProps) {
  const [incoming, setIncoming] = useState<PrSaved | null>(null);
  const [message, setMessage] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  function exportData() {
    update({ ...saved, lastExport: downloadPrExport(saved) });
    setMessage(TEXT.exported);
  }

  async function readFile(file: File | undefined) {
    if (!file) return;
    const result = parsePrImport(await file.text());
    if (result.ok) {
      setIncoming(result.saved);
      setMessage('');
    } else {
      setIncoming(null);
      setMessage(TEXT.importErrors[result.error]);
    }
  }

  return (
    <>
      <header className="screen-head">
        <button type="button" className="round" aria-label={TEXT.backToHome} onClick={onBack}>
          ←
        </button>
        <h2>{TEXT.settings}</h2>
        <Info topic={TEXT.settings}>{TEXT.help.settings}</Info>
      </header>
      <section className="card">
        <div className="with-info">
          <h3>{TEXT.levelNow(saved.level, TEXT.levelNames[saved.level])}</h3>
          <Info topic={TEXT.levelInfo}>{TEXT.help.level}</Info>
        </div>
        <p className="pr-note">{TEXT.runningInfo(formatDecimal(saved.runningMs / 1000, 1))}</p>
      </section>
      <section className="card" aria-labelledby="pr-data">
        <div className="with-info">
          <h3 id="pr-data">{TEXT.data}</h3>
          <Info topic={TEXT.data}>{TEXT.help.data}</Info>
        </div>
        <p className="pr-note">{TEXT.dataHelp}</p>
        <button type="button" className="btn" onClick={exportData}>
          {TEXT.exportData}
        </button>
        <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
          {TEXT.importData}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          aria-label={TEXT.importFile}
          hidden
          onChange={(e) => {
            void readFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        {message && (
          <p role="status" className="pr-note">
            {message}
          </p>
        )}
        <p className="pr-note">{saved.lastExport ? TEXT.lastExport(TEXT.dateText(saved.lastExport)) : TEXT.neverExported}</p>
      </section>
      {incoming && (
        <section className="card" aria-label={TEXT.importData}>
          <p>{TEXT.importSummary(incoming.xp, Object.keys(incoming.items).length, incoming.sessions.length, incoming.streak.current)}</p>
          <div className="pr-actions">
            <button type="button" className="btn small-btn" onClick={() => setIncoming(null)}>
              {TEXT.cancel}
            </button>
            <button
              type="button"
              className="btn small-btn primary"
              onClick={() => {
                update(incoming);
                setIncoming(null);
                setMessage(TEXT.imported);
              }}
            >
              {TEXT.replace}
            </button>
          </div>
        </section>
      )}
    </>
  );
}
