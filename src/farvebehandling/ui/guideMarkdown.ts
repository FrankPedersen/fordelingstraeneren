/**
 * Guiden til Analyse (SPEC-analyse-modul.md, trin 3) står i markdown, eksporteret fra Franks dokument. Visningen klarer
 * det, guiden bruger: overskrifter, afsnit, punkt- og nummerlister, tabeller, fed, kode og links. Intet bibliotek.
 */
export type GuideBlock =
  | { kind: 'heading'; level: number; text: string; id: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'table'; head: string[]; rows: string[][] };

export type InlinePart = { kind: 'text' | 'strong' | 'code'; text: string } | { kind: 'link'; text: string; href: string };

/** Overskriftens id: nummeret ("2.1" → "guide-2-1"), titlen øverst "guide-title". */
export function headingId(level: number, text: string): string {
  const number = /^(\d+(?:\.\d+)*) /.exec(text)?.[1];
  if (number) return `guide-${number.replace(/\./g, '-')}`;
  return level === 1 ? 'guide-title' : `guide-${text.toLowerCase().replace(/[^a-z0-9æøå]+/g, '-')}`;
}

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());

const LIST = /^(?:([-*])|(\d+)\.) (.*)$/;

export function parseGuide(markdown: string): GuideBlock[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: GuideBlock[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    const heading = /^(#{1,6}) (.+)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      blocks.push({ kind: 'heading', level, text: heading[2].trim(), id: headingId(level, heading[2].trim()) });
      i++;
      continue;
    }
    if (line.trimStart().startsWith('|')) {
      const head = cells(line);
      i += 2; // overskriften og skillelinjen | --- |
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trimStart().startsWith('|')) rows.push(cells(lines[i++]));
      blocks.push({ kind: 'table', head, rows });
      continue;
    }
    const item = LIST.exec(line);
    if (item) {
      const ordered = !!item[2];
      const items: string[] = [];
      while (i < lines.length) {
        const m = LIST.exec(lines[i]);
        if (!m || !!m[2] !== ordered) break;
        items.push(m[3].trim());
        i++;
      }
      blocks.push({ kind: 'list', ordered, items });
      continue;
    }
    const paragraph: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^#{1,6} /.test(lines[i]) && !lines[i].trimStart().startsWith('|') && !LIST.test(lines[i])) {
      paragraph.push(lines[i++].trim());
    }
    blocks.push({ kind: 'paragraph', text: paragraph.join(' ') });
  }
  return blocks;
}

/** Fed (**…**), kode (`…`) og links ([tekst](adresse)) i en linje. */
export function parseInline(text: string): InlinePart[] {
  const parts: InlinePart[] = [];
  const pattern = /\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  for (const m of text.matchAll(pattern)) {
    if (m.index! > last) parts.push({ kind: 'text', text: text.slice(last, m.index) });
    if (m[1] !== undefined) parts.push({ kind: 'strong', text: m[1] });
    else if (m[2] !== undefined) parts.push({ kind: 'code', text: m[2] });
    else parts.push({ kind: 'link', text: m[3], href: m[4] });
    last = m.index! + m[0].length;
  }
  if (last < text.length) parts.push({ kind: 'text', text: text.slice(last) });
  return parts;
}
