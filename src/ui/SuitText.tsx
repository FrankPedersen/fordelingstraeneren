/** Tekst med farvesymboler, hvor ♥ og ♦ står med rødt som på kortene. */
export function SuitText({ text }: { text: string }) {
  return (
    <>
      {text.split(/([♥♦])/).map((part, i) =>
        part === '♥' || part === '♦' ? (
          <span key={i} className="suit-red">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}
