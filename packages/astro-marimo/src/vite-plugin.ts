import type { Plugin } from 'vite';
import type { AstroIntegrationLogger } from 'astro';
import jsYaml from 'js-yaml';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { type CellError, exportIslands, isMarimoNotebook } from './mo.js';
import { type MarimoIntegrationOptions, type MarimoUserOptions, mergeOptions } from './options.js';

type Frontmatter = Record<string, unknown>;

export interface MarimoVitePluginOptions {
  projectRoot: string;
  options: MarimoIntegrationOptions
  /** Whether this is `astro build`; sets the default for `strict`. */
  isBuild: boolean;
  logger: AstroIntegrationLogger;
}

/** Vite plugin that turns marimo notebook .py files into page components for the astro-marimo renderer. */
export function marimoVitePlugin({ projectRoot, options, isBuild, logger }: MarimoVitePluginOptions): Plugin {
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
        const relPath = path.relative(projectRoot, filePath);
        logger.info(`Exporting ${relPath} (${mergedOptions.mode})`);
        const { html, errors } = renderIslands(filePath, projectRoot, mergedOptions, layoutPath, String(frontmatter.title ?? slug));
        if (errors.length) {
          const report = [
            `${relPath}: ${errors.length} cell${errors.length > 1 ? 's' : ''} raised during export`,
            ...errors.map(e => `  cell ${e.cell} (${e.code}): ${e.error}`),
          ].join('\n');
          if (mergedOptions.strict ?? isBuild) throw new Error(`${report}\nSet \`strict: false\` to publish the notebook with its errors.`);
          logger.warn(report);
        }
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
// Islands
// ---------------------------------------------------------------------------

const islandsCss = readFileSync(fileURLToPath(new URL('../styles/islands.css', import.meta.url)), 'utf-8');

/** Page HTML for islands (a fragment for a layout to wrap, or a minimal document if there is no layout), plus any cell errors. */
function renderIslands(filePath: string, projectRoot: string, opts: MarimoIntegrationOptions, layoutPath: string | undefined, title: string): { html: string; errors: CellError[] } {
  const { head, body, errors } = exportIslands(filePath, projectRoot, {
    includeCode: opts.includeCode,
    mode: opts.mode,
  });
  // A "marimo*" title makes the runtime copy this sheet into widget shadow roots (e.g. static markdown).
  // It must equal the islands <link>'s title: browsers treat a sheet with any other title as an
  // alternate stylesheet and disable it.
  const style = `<style title="marimo-islands">${islandsCss}${opts.css ?? ''}</style>`;
  // Runtime tags go inline with the islands so layouts need no <head> slot.
  const html = layoutPath
    ? `${head}\n${style}\n${body}`
    : `<!doctype html><html lang="en"><head><meta charset="UTF-8" /><title>${title}</title>${head}${style}</head><body>${body}</body></html>`;
  return { html, errors };
}
