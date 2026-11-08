import type { Plugin } from 'vite';
import jsYaml from 'js-yaml';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { exportIslands, exportHtml, isMarimoNotebook, stripElements, injectCss } from './mo.js';
import { type MarimoIntegrationOptions, type MarimoUserOptions, mergeOptions } from './options.js';
import { outerScript } from './iframe-scripts.js';

type Frontmatter = Record<string, unknown>;

export interface MarimoVitePluginOptions {
  projectRoot: string;
  options: MarimoIntegrationOptions
}

/** Vite plugin that turns marimo notebook .py files into page components for the astro-marimo renderer. */
export function marimoVitePlugin({ projectRoot, options }: MarimoVitePluginOptions): Plugin {
  const exportCache = new Map<string, string>();

  return {
    name: 'vite-plugin-marimo',

    config() {
      return {
        server: {
          watch: {
            ignored: [
              '**/.venv/**',
              '**/venv/**',
              '**/__pycache__/**',
              '**/*.pyc',
              '**/*.pyo',
            ],
          },
        },
      };
    },

    handleHotUpdate({ file }) {
      exportCache.delete(file);
    },

    transform(code: string, id: string) {
      const [filePath, queryString] = id.split('?');

      if (!filePath.endsWith('.py')) return;
      if (!isMarimoNotebook(code)) return;

      const query = new URLSearchParams(queryString);
      const frontmatter = extractFrontmatter(code);

      const mergedOptions = mergeOptions(options, frontmatter as MarimoUserOptions);

      const pagesDir = path.join(projectRoot, 'src', 'pages');
      const url = '/' + path.relative(pagesDir, filePath).replace(/\\/g, '/').replace(/\.py$/, '');
      const slug = path.basename(filePath, '.py').toLowerCase().replace(/[_\s]+/g, '-');

      if (query.has('frontmatterOnly')) {
        return { code: metadataExports(slug, url, frontmatter), map: null };
      }

      let layoutPath: string | undefined;
      if (typeof frontmatter.layout === 'string') {
        layoutPath = path.resolve(path.dirname(filePath), frontmatter.layout);
      } else if (mergedOptions.layout) {
        layoutPath = path.resolve(projectRoot, mergedOptions.layout);
      }

      const html = exportCache.get(filePath) ?? (() => {
        const html = mergedOptions.embed === 'islands'
          ? renderIslands(filePath, projectRoot, mergedOptions, layoutPath, String(frontmatter.title ?? slug))
          : renderIframe(filePath, projectRoot, mergedOptions, layoutPath, slug);
        exportCache.set(filePath, html);
        return html;
      })();

      return { code: notebookToModule(html, layoutPath, slug, url, frontmatter), map: null };
    },
  };
}

// ---------------------------------------------------------------------------
// Module generation
// ---------------------------------------------------------------------------

/** Parse the `# /// astro` YAML block at the top of a notebook. */
function extractFrontmatter(code: string): Frontmatter {
  const m = code.match(/^# \/\/\/ astro\s*\n([\s\S]*?)^# \/\/\//m);
  if (!m) return {};
  const yaml = m[1].replace(/^# ?/gm, '');
  return (jsYaml.load(yaml) as Frontmatter) ?? {};
}

/** JS Exports for a notebook when transformed by Vite into a js-module. */
function metadataExports(slug: string, url: string, frontmatter: Frontmatter): string {
  return `export const slug = ${JSON.stringify(slug)};
export const url = ${JSON.stringify(url)};
export const frontmatter = ${JSON.stringify(frontmatter)};`;
}

/** Converts a .py notebook to a js module: a MarimoNotebook component with HTML and optionally a layout. */
function notebookToModule(html: string, layoutPath: string | undefined, slug: string, url: string, frontmatter: Frontmatter): string {
  return `${layoutPath ? `import Layout from ${JSON.stringify(layoutPath)};` : ''}
${metadataExports(slug, url, frontmatter)}
export async function MarimoNotebook() {}
MarimoNotebook.__html = ${JSON.stringify(html)};
${layoutPath ? `MarimoNotebook.__layout = Layout;
MarimoNotebook.__frontmatter = ${JSON.stringify(frontmatter)};` : ''}
export default MarimoNotebook;`;
}

// ---------------------------------------------------------------------------
// Islands (embed: 'islands')
// ---------------------------------------------------------------------------

const islandsCss = readFileSync(fileURLToPath(new URL('../styles/islands.css', import.meta.url)), 'utf-8');

/** Page HTML for islands: a fragment for a layout to wrap, or a minimal document if there is no layout. */
function renderIslands(filePath: string, projectRoot: string, opts: MarimoIntegrationOptions, layoutPath: string | undefined, title: string): string {
  const { head, body } = exportIslands(filePath, projectRoot, {
    includeCode: opts.includeCode,
    mode: opts.mode,
  });
  // A "marimo*" title makes the runtime copy this sheet into widget shadow roots (e.g. static markdown).
  // It must equal the islands <link>'s title: browsers treat a sheet with any other title as an
  // alternate stylesheet and disable it.
  const style = `<style title="marimo-islands">${islandsCss}${opts.css ?? ''}</style>`;
  // Runtime tags go inline with the islands so layouts need no <head> slot.
  return layoutPath
    ? `${head}\n${style}\n${body}`
    : `<!doctype html><html lang="en"><head><meta charset="UTF-8" /><title>${title}</title>${head}${style}</head><body>${body}</body></html>`;
}

// ---------------------------------------------------------------------------
// Iframe (embed: 'iframe')
// ---------------------------------------------------------------------------

/** Page HTML for iframe embedding: an auto-resizing iframe for a layout to wrap, or the bare export if there is no layout. */
function renderIframe(filePath: string, projectRoot: string, opts: MarimoIntegrationOptions, layoutPath: string | undefined, slug: string): string {
  let html = exportHtml(filePath, projectRoot, {
    includeCode: opts.includeCode,
    wasmExecute: opts.iframe.wasmExecute,
    mode: opts.mode,
    wasmMode: opts.iframe.wasmMode,
  });
  html = stripElements(html, opts.iframe.stripMarimoWatermark);
  if (opts.css) html = injectCss(html, opts.css);
  if (!layoutPath) return html;

  const iframeId = `marimo-${slug}`;
  const srcdoc = html.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return [
    `<iframe id="${iframeId}" srcdoc="${srcdoc}" style="width:100%;border:none;display:block;"></iframe>`,
    `<script>${outerScript(iframeId)}</script>`,
  ].join('\n');
}
