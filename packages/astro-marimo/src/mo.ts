import { execSync } from 'node:child_process';
export function exportNotebook(uvCmd: string, notebook: string, projectRoot: string, includeCode: boolean): string {
  console.log(`Exporting ${notebook}...`)
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