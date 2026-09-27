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
