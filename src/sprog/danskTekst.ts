import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseAst } from 'vite';

/**
 * Al dansk synlig tekst i appen (SPEC-sprog-og-ordbog.md, Den varige kontrol), til fagordstesten og `scripts/sprogtjek.ts`.
 * Kun til tests og scripts; appen henter ikke modulet.
 *
 * - Kildekoden i `src/` (ikke tests) læses med Vites parser. Engelsk springes over: det engelske argument til tx(…),
 *   EN-objekterne i tekstfilerne (`const EN`, `MONTHS_EN` …) og felterne `en`/`…En`. Typer og import-stier tæller ikke.
 * - Data, som appen henter: bankens filer, teknikkerne, P-modellen, pas-reglerne, systemfilen og guiden til Analyse.
 * - `docs/MODEL.md`, som følger husets ord (Franks valg).
 */

/** Repoets rod. Regnes fra filens sti, fordi new URL('../../', …) under jsdom løser mod http://localhost. */
export const ROOT = `${resolve(dirname(fileURLToPath(import.meta.url)), '../..')}/`;

/** Filer med engelsk eller med husets "Ikke"-ord som data: oversættelsen af løserens linjer og sprogkontrollen selv. */
const SKIP = [/^src\/farvebehandling\/lineText\.ts$/, /^src\/sprog\//, /^src\/farvebehandling\/testBank\.ts$/];
const DATA = [
  /^src\/farvebehandling\/content\/app\/side-\d+\.json$/,
  /^src\/farvebehandling\/content\/techniques\.json$/,
  /^src\/haandevaluering\/content\/p-model\.json$/,
  /^src\/pointregnskab\/content\/pas-regler\.json$/,
  /^src\/system\/dk-2over1\.json$/,
];
const MARKDOWN = [/^src\/farvebehandling\/content\/guide-analyse\.md$/, /^docs\/MODEL\.md$/];

const ENGLISH_KEY = /^en$|^[a-z]+En$/;
const ENGLISH_VAR = /^EN$|_EN$|^[a-z]+En$/;
const TYPE_KEYS = new Set(['typeAnnotation', 'returnType', 'typeParameters', 'typeArguments', 'superTypeArguments']);
const TYPE_NODES = new Set(['TSInterfaceDeclaration', 'TSTypeAliasDeclaration', 'TSDeclareFunction', 'TSModuleDeclaration', 'TSImportType']);
const VISIBLE_ATTRS = new Set(['aria-label', 'aria-description', 'title', 'alt', 'placeholder']);
const CODE_ATTRS = new Set(['className', 'id', 'key', 'role', 'type', 'href', 'htmlFor', 'name', 'style', 'inputMode', 'autoComplete', 'lang', 'rel', 'target', 'src']);

/** true for `… === 'en'`, false for `… !== 'en'`, ellers null. */
function englishTest(test: Node): boolean | null {
  if (test.type !== 'BinaryExpression') return null;
  const sides = [test.left, test.right] as Node[];
  if (!sides.some((s) => s.type === 'Literal' && s.value === 'en')) return null;
  return test.operator === '===' || test.operator === '==' ? true : test.operator === '!==' || test.operator === '!=' ? false : null;
}

export interface DanishText {
  file: string;
  strings: string[];
}

type Node = { type?: string; [key: string]: unknown };
const isNode = (x: unknown): x is Node => typeof x === 'object' && x !== null;
const keyName = (key: unknown) => (isNode(key) ? ((key.name ?? key.value) as string | undefined) : undefined);

/** Strengene i kildekoden, uden engelsk, typer og import-stier. */
export function danishStrings(source: string, tsx = true): string[] {
  const out: string[] = [];
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!isNode(node)) return;
    switch (node.type) {
      case 'ImportDeclaration':
      case 'ExportAllDeclaration':
        return;
      case 'ImportExpression':
        return;
      case 'Literal':
        if (typeof node.value === 'string' && !node.regex) out.push(node.value);
        return;
      case 'TemplateLiteral':
        out.push((node.quasis as Node[]).map((q) => (q.value as { cooked: string }).cooked).join(' '));
        (node.expressions as Node[]).forEach(walk);
        return;
      case 'JSXText':
        if ((node.value as string).trim()) out.push(node.value as string);
        return;
      case 'CallExpression': {
        const callee = node.callee as Node;
        if (callee.type === 'Identifier' && callee.name === 'tx') return walk((node.arguments as Node[])[0]);
        break;
      }
      case 'Property':
        if (!node.computed && ENGLISH_KEY.test(keyName(node.key) ?? '')) return;
        return walk(node.value);
      case 'VariableDeclarator':
        if (ENGLISH_VAR.test(keyName(node.id) ?? '')) return;
        return walk(node.init);
      case 'ExportNamedDeclaration':
        return walk(node.declaration);
      case 'JSXAttribute': {
        // className, id, href, role, type og andre attributter er kode; kun de synlige er tekst.
        const name = keyName(node.name) ?? '';
        const value = node.value as Node | null;
        if (CODE_ATTRS.has(name) || name.startsWith('data-')) return;
        if (value?.type === 'Literal' && !VISIBLE_ATTRS.has(name)) return;
        return walk(value);
      }
      case 'ConditionalExpression':
      case 'IfStatement': {
        // getLang() === 'en' ? 'English' : 'dansk' og if (getLang() === 'en') return 'English'; – kun den danske gren.
        const english = englishTest(node.test as Node);
        if (english === null) break;
        return walk(english ? node.alternate : node.consequent);
      }
    }
    if (node.type && TYPE_NODES.has(node.type)) return;
    for (const [key, value] of Object.entries(node)) {
      if (key !== 'type' && !TYPE_KEYS.has(key)) walk(value);
    }
  };
  walk(parseAst(source, { lang: tsx ? 'tsx' : 'ts' }));
  return out;
}

/** Strengene i data, uden de engelske felter. */
export function danishJson(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(danishJson);
  if (isNode(value)) return Object.entries(value).flatMap(([k, v]) => (ENGLISH_KEY.test(k) ? [] : danishJson(v)));
  return typeof value === 'string' ? [value] : [];
}

function files(): string[] {
  return execFileSync('git', ['ls-files', '-z', 'src', 'docs'], { cwd: ROOT, encoding: 'utf8' }).split('\0').filter(Boolean);
}

/** Al dansk synlig tekst i appen, fil for fil. */
export function danishTexts(): DanishText[] {
  const out: DanishText[] = [];
  for (const file of files()) {
    if (SKIP.some((r) => r.test(file))) continue;
    const read = () => readFileSync(ROOT + file, 'utf8');
    if (/\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file)) out.push({ file, strings: danishStrings(read(), file.endsWith('.tsx')) });
    else if (DATA.some((r) => r.test(file))) out.push({ file, strings: danishJson(JSON.parse(read())) });
    else if (MARKDOWN.some((r) => r.test(file))) out.push({ file, strings: [read()] });
  }
  return out;
}
