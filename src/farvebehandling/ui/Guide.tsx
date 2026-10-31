import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { getLang } from '../../i18n';
import { BoardColumn } from '../../ui/BoardColumn';
import { parseGuide, parseInline, type GuideBlock } from './guideMarkdown';
import { TEXT } from './texts';

/**
 * Guiden til Analyse (SPEC-analyse-modul.md, trin 3) på appens sprog, med Tilbage til analysen. Guiden hentes dovent,
 * første gang den åbnes, og service workeren gemmer den til offline-brug.
 */
const SOURCES = {
  da: () => import('../content/guide-analyse.md?raw'),
  en: () => import('../content/guide-analyse.en.md?raw'),
};

function Inline({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((part, i) =>
        part.kind === 'strong' ? (
          <strong key={i}>{part.text}</strong>
        ) : part.kind === 'code' ? (
          <code key={i}>{part.text}</code>
        ) : part.kind === 'link' ? (
          <a key={i} href={part.href}>
            {part.text}
          </a>
        ) : (
          part.text
        ),
      )}
    </>
  );
}

/** En overskrift i guiden: niveau 1 bliver h2, så skærmens h1 står over guiden. */
function Heading({ level, id, children }: { level: number; id: string; children: ReactNode }) {
  if (level === 1) return <h2 id={id}>{children}</h2>;
  if (level === 2) return <h3 id={id}>{children}</h3>;
  return <h4 id={id}>{children}</h4>;
}

function Block({ block }: { block: GuideBlock }) {
  switch (block.kind) {
    case 'heading':
      return (
        <Heading level={block.level} id={block.id}>
          {block.text}
        </Heading>
      );
    case 'paragraph':
      return (
        <p>
          <Inline text={block.text} />
        </p>
      );
    case 'list': {
      const List = block.ordered ? 'ol' : 'ul';
      return (
        <List>
          {block.items.map((item, i) => (
            <li key={i}>
              <Inline text={item} />
            </li>
          ))}
        </List>
      );
    }
    case 'table':
      return (
        <div className="fb-table-scroll">
          <table>
            <thead>
              <tr>
                {block.head.map((cell, i) => (
                  <th key={i} scope="col">
                    <Inline text={cell} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, i) => (
                    <td key={i}>
                      <Inline text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

export function Guide({ onBack }: { onBack(): void }) {
  const [text, setText] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    let alive = true;
    SOURCES[getLang() === 'en' ? 'en' : 'da']().then(
      (module) => alive && setText(module.default),
      () => alive && setFailed(true),
    );
    return () => {
      alive = false;
    };
  }, []);

  const blocks = useMemo(() => (text ? parseGuide(text) : []), [text]);
  const titleAt = blocks.findIndex((b) => b.kind === 'heading' && b.level === 1);
  const sections = blocks.filter((b): b is Extract<GuideBlock, { kind: 'heading' }> => b.kind === 'heading' && b.level === 2);

  const back = (
    <div className="fb-guide-bar">
      <button type="button" className="btn small-btn" onClick={onBack}>
        {TEXT.guide.back}
      </button>
    </div>
  );

  // Indholdsfortegnelsen ruller til afsnittet uden at ændre adressen, som appen bruger til skærmene (#analyse).
  const toc = (
    <nav className="fb-guide-toc" aria-label={TEXT.guide.contents}>
      <h3>{TEXT.guide.contents}</h3>
      <ul>
        {sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              onClick={(event) => {
                event.preventDefault();
                document.getElementById(s.id)?.scrollIntoView?.({ block: 'start' });
              }}
            >
              {s.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <section className="card fb-guide" aria-label={TEXT.guide.button}>
      {back}
      {!text ? (
        <p role="status" className="fb-note">
          {failed ? TEXT.guide.failed : TEXT.guide.loading}
        </p>
      ) : (
        <>
          {blocks.slice(0, titleAt + 1).map((b, i) => (
            <Block key={i} block={b} />
          ))}
          <BoardColumn>{toc}</BoardColumn>
          {blocks.slice(titleAt + 1).map((b, i) => (
            <Block key={titleAt + 1 + i} block={b} />
          ))}
          {back}
        </>
      )}
    </section>
  );
}
