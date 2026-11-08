import { execSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

/** Whether a .py file is a marimo notebook (as opposed to any other Python module). */
export function isMarimoNotebook(code: string): boolean {
  return code.includes('app = marimo.App');
}

/** process.env with node_modules/.bin removed from PATH, so we invoke the system uv. */
// node_modules/.bin prepends to PATH in npm/Astro environments, which can shadow
// system tools like uv with older bundled versions (e.g. @manzt/uv from mdx-marimo).
function cleanEnv() {
  const PATH = (process.env.PATH ?? '')
    .split(delimiter)
    .filter(p => !p.includes('node_modules/.bin'))
    .join(delimiter);
  return { ...process.env, PATH };
}

// ---------------------------------------------------------------------------
// Islands export (embed: 'islands')
// ---------------------------------------------------------------------------

const islandsScript = fileURLToPath(new URL('../python/islands_export.py', import.meta.url));

export interface ExportIslandsOptions {
  includeCode: boolean;
  mode: 'static' | 'wasm';
}

export interface IslandsExport {
  /** Script and stylesheet tags for the islands runtime. */
  head: string;
  /** The rendered <marimo-island> elements. */
  body: string;
}

/**
 * Run a notebook and render its cells as marimo islands, via python/islands_export.py.
 *
 * `head` holds the islands runtime's <script> and <link> tags. 
 * `body` is one HTML string:
 *   <div style="margin: auto; max-width: …">            (max-width from the notebook's `width`)
 *     <marimo-island data-app-id="main" data-cell-id="…" data-reactive="…">…</marimo-island>
 *     …one island per cell, in notebook order…
 *     <script type="application/vnd.marimo.islands+json">…</script>   (wasm mode only)
 *   </div>
 */
export function exportIslands(notebook: string, projectRoot: string, opts: ExportIslandsOptions): IslandsExport {
  console.log(`Exporting ${notebook} (${opts.mode}, islands)...`)

  // The notebook runs natively at build time, so it needs its inline script deps too.
  // uv errors on --with-requirements when the file has no `# /// script` block.
  const withDeps = /^# \/\/\/ script\s*$/m.test(readFileSync(notebook, 'utf-8'))
    ? `--with-requirements "${notebook}" `
    : '';
  const out = execSync(
    `uv run ${withDeps}python "${islandsScript}" "${notebook}"${opts.includeCode ? ' --include-code' : ''}${opts.mode === 'static' ? ' --static' : ''}`,
    { cwd: projectRoot, maxBuffer: 50 * 1024 * 1024, env: cleanEnv() }
  ).toString('utf-8');
  return JSON.parse(out) as IslandsExport;
}

// ---------------------------------------------------------------------------
// Iframed HTML export (embed: 'iframe')
// ---------------------------------------------------------------------------

export interface ExportHtmlOptions {
  includeCode: boolean;
  mode: 'static' | 'wasm';
  wasmMode: 'run' | 'edit';
  wasmExecute: boolean;
}

/** Export a notebook as a full standalone HTML document with `marimo export html[-wasm]`. */
export function exportHtml(notebook: string, projectRoot: string, opts: ExportHtmlOptions): string {
  console.log(`Exporting ${notebook} (${opts.mode})...`)

  if (opts.mode === 'wasm') {
    const tmpDir = mkdtempSync(join(tmpdir(), 'astro-marimo-'));
    const outFile = join(tmpDir, 'index.html');
    try {
      execSync(
        `uv run marimo export html-wasm --mode ${opts.wasmMode} --single-file ${opts.includeCode ? '--show-code' : '--no-show-code'} ${opts.wasmExecute ? '--execute' : '--no-execute'} -o "${outFile}" "${notebook}"`,
        { cwd: projectRoot, env: cleanEnv() }
      );
      return readFileSync(outFile, 'utf-8');
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  }

  return execSync(
    `uv run marimo export html ${opts.includeCode ? '--include-code' : '--no-include-code'} "${notebook}"`,
    { cwd: projectRoot, maxBuffer: 50 * 1024 * 1024, env: cleanEnv() }
  ).toString('utf-8');
}

/** Hide marimo app chrome (banner, actions menu, minimap, optionally watermark) in an exported document. */
export function stripElements(html: string, stripMarimoWatermark: boolean): string {
  // .z-10000 is Astro's minimap widget. It mis-positions relative to the iframe,
  // and cannot be easily fixed, so we just remove it.
  const selectors: string[] = [
    '.z-10000',
    '[data-testid="notebook-actions-dropdown"]',
    '[data-testid="static-notebook-banner"]'
  ];
  if (stripMarimoWatermark) selectors.push('[data-testid="watermark"]');
  const style = `<style>${selectors.join(', ')} { display: none !important; }</style>`;
  return html.replace('</head>', `${style}</head>`);
}

/** Append user CSS to an exported document's <head>. */
export function injectCss(html: string, css: string): string {
  return html.replace('</head>', `<style>${css}</style></head>`);
}
