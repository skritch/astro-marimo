import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';


export function findPyFiles(dir: string, results: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && !['__pycache__', '.venv', 'node_modules'].includes(entry.name)) {
      findPyFiles(full, results);
    } else if (entry.isFile() && entry.name.endsWith('.py')) {
      results.push(full);
    }
  }
  return results;
}

export function exportNotebook(uvCmd: string, notebook: string, projectRoot: string, includeCode: boolean): string {
  const codeFlag = includeCode ? '--include-code' : '--no-include-code';
  return execSync(`${uvCmd} marimo export html ${codeFlag} "${notebook}"`, {
    cwd: projectRoot,
    maxBuffer: 50 * 1024 * 1024,
    env: process.env,
  }).toString('utf-8');
}

export function stripElements(html: string, stripStaticBanner: boolean, stripMarimoWatermark: boolean): string {
  const selectors: string[] = [];
  if (stripStaticBanner) selectors.push('[data-testid="static-notebook-banner"]');
  if (stripMarimoWatermark) selectors.push('[data-testid="watermark"]');
  if (selectors.length === 0) return html;
  const style = `<style>${selectors.join(', ')} { display: none !important; }</style>`;
  return html.replace('</head>', `${style}</head>`);
}