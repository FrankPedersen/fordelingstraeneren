import { Klubaften } from '../../ui/Klubaften';

export function KlubaftenScreen({ onBack }: { onBack(): void }) {
  return (
    <main className="screen">
      <header className="screen-head">
        <button type="button" className="round" aria-label="Tilbage" onClick={onBack}>
          ←
        </button>
        <h1>Klubaften</h1>
      </header>
      <p>
        En klubaften er 25 spil × 4 hænder = 100 hænder. Sådan fordeler mønstrene sig i gennemsnit: hver
        mini-skyline er én hånd, sorteret efter rang og farvet efter den længste farve.
      </p>
      <Klubaften />
    </main>
  );
}
