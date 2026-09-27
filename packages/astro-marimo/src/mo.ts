import { execSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';

export interface ExportOptions {
  includeCode: boolean;
  mode: 'static' | 'wasm';
  wasmMode: 'run' | 'edit';
  wasmExecute: boolean;
}

// node_modules/.bin prepends to PATH in npm/Astro environments, which can shadow
// system tools like uv with older bundled versions (e.g. @manzt/uv from mdx-marimo).
function cleanEnv() {
  const PATH = (process.env.PATH ?? '')
    .split(delimiter)
    .filter(p => !p.includes('node_modules/.bin'))
    .join(delimiter);
  return { ...process.env, PATH };
}

export function exportNotebook(notebook: string, projectRoot: string, opts: ExportOptions): string {
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

export function isMarimoNotebook(code: string): boolean {
  return code.includes('app = marimo.App');
}

export function stripElements(html: string, stripStaticBanner: boolean, stripMarimoWatermark: boolean): string {
  // .z-10000 is Astro's minimap widget. It mis-positions relative to the iframe,
  // and cannot be easily fixed, so we just remove it.
  const selectors: string[] = ['.z-10000'];
  if (stripStaticBanner) selectors.push('[data-testid="static-notebook-banner"]');
  if (stripMarimoWatermark) selectors.push('[data-testid="watermark"]');
  const style = `<style>${selectors.join(', ')} { display: none !important; }</style>`;
  return html.replace('</head>', `${style}</head>`);
}

export function injectCss(html: string, css: string): string {
  return html.replace('</head>', `<style>${css}</style></head>`);
}
