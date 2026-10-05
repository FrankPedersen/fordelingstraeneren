import { tx } from '../../i18n';
import { callText, ruleText } from '../../system/interpreter';
import { Info } from '../../ui/Info';
import { SuitText } from '../../ui/SuitText';
import { isDefender, OPENING_PASS, type Auction, type AuctionCall } from '../model/bidding';
import { allowedOf, type Defender } from '../model/points';
import { rangeText } from './format';
import { TEXT } from './texts';

/** Meldingen kort, fx "1NT (15–17)", "pas (0–11)" eller "pas (ingen grænse)". */
function callShort(call: AuctionCall): string {
  const limit = call.limit!;
  switch (limit.kind) {
    case 'call':
      return TEXT.callRange(callText(call.call), rangeText(allowedOf(limit.rule.hcp)));
    case 'opening-pass':
      return TEXT.callRange(TEXT.pass, rangeText(OPENING_PASS));
    case 'responder-pass':
      return TEXT.callRange(TEXT.pass, rangeText(allowedOf(limit.rule.hcp)));
    case 'free-pass':
      return TEXT.freePass;
  }
}

/** Hvad meldingen viser, fra systemfilen og pas-reglerne. */
function callLong(call: AuctionCall): string {
  const limit = call.limit!;
  switch (limit.kind) {
    case 'call':
      return ruleText(limit.rule);
    case 'opening-pass':
      return TEXT.openingPassText;
    case 'responder-pass':
      return tx(limit.rule.text, limit.rule.textEn);
    case 'free-pass':
      return TEXT.freePassText;
  }
}

/** Meldelinjen: kontrakten og Øst–Vests meldinger med hp-intervallerne. Nord–Syds meldinger vises ikke. */
export function Meldelinje({ auction }: { auction: Auction }) {
  const calls = (seat: Defender) => auction.calls.filter((c) => c.seat === seat && isDefender(c.seat));
  const line = (['W', 'E'] as const)
    .map((seat) => `${TEXT.seat[seat]}: ${calls(seat).map(callShort).join(', ') || TEXT.noCall}`)
    .join(' · ');
  return (
    <section className="pr-auction" aria-label={TEXT.auction}>
      <p className="pr-contract">
        <SuitText text={TEXT.contract(callText(auction.contract))} />
      </p>
      <div className="with-info">
        <p className="pr-auction-line">
          <SuitText text={line} />
        </p>
        <Info topic={TEXT.auction}>{TEXT.help.auction}</Info>
      </div>
      <ul className="pr-auction-notes">
        {(['W', 'E'] as const).map((seat) =>
          calls(seat).length ? (
            calls(seat).map((call, i) => (
              <li key={`${seat}${i}`}>
                <SuitText text={`${TEXT.seat[seat]}, ${callShort(call)}: ${callLong(call)}`} />
              </li>
            ))
          ) : (
            <li key={seat}>{TEXT.noCallText(TEXT.seat[seat])}</li>
          ),
        )}
      </ul>
    </section>
  );
}
