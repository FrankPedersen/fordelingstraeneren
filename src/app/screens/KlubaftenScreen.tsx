import { Klubaften } from '../../ui/Klubaften';
import { tx } from '../../i18n';
import { Info } from '../../ui/Info';

export function KlubaftenScreen({ onBack }: { onBack(): void }) {
  return (
    <main className="screen text-screen">
      <header className="screen-head">
        <button type="button" className="round" aria-label={tx('Tilbage', 'Back')} onClick={onBack}>
          ←
        </button>
        <h1>{tx('Klubaften', 'Club evening')}</h1>
        <Info topic={tx('Klubaften', 'Club evening')}>
          {tx(
            'Et tryk på et mønster under gitteret fremhæver dets hænder; et nyt tryk viser alle igen. Farven viser den længste farve: blå 4, grøn 5, rav 6 og violet 7+.',
            'Tapping a pattern below the grid highlights its hands; tapping again shows them all. The colour shows the longest suit: blue 4, green 5, amber 6 and violet 7+.',
          )}
        </Info>
      </header>
      <p>
        {tx(
          'En klubaften er 25 spil × 4 hænder = 100 hænder. Sådan fordeler mønstrene sig i gennemsnit: hver mini-skyline er én hånd, sorteret efter rang og farvet efter den længste farve.',
          'A club evening is 25 boards × 4 hands = 100 hands. This is how the patterns are distributed on average: each mini skyline is one hand, sorted by rank and coloured by the longest suit.',
        )}
      </p>
      <Klubaften />
    </main>
  );
}
