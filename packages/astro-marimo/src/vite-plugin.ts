import type { Plugin } from 'vite';
import jsYaml from 'js-yaml';
import path from 'node:path';
import { exportNotebook, isMarimoNotebook, stripElements, injectCss } from './mo.js';
import { type MarimoIntegrationOptions } from './options.js';
import { outerScript } from './iframe-scripts.js';

type Frontmatter = Record<string, unknown>;

function extractFrontmatter(code: string): Frontmatter {
  const m = code.match(/^# \/\/\/ astro\s*\n([\s\S]*?)^# \/\/\//m);
  if (!m) return {};
  const yaml = m[1].replace(/^# ?/gm, '');
  return (jsYaml.load(yaml) as Frontmatter) ?? {};
}

export interface MarimoVitePluginOptions {
  projectRoot: string;
  options: MarimoIntegrationOptions
}


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

      const mergedOptions: MarimoIntegrationOptions = { ...options, ...frontmatter } as MarimoIntegrationOptions;

      const pagesDir = path.join(projectRoot, 'src', 'pages');
      const url = '/' + path.relative(pagesDir, filePath).replace(/\\/g, '/').replace(/\.py$/, '');
      const slug = path.basename(filePath, '.py').toLowerCase().replace(/[_\s]+/g, '-');

      if (query.has('frontmatterOnly')) {
        return {
          code: `export const slug = ${JSON.stringify(slug)};
export const url = ${JSON.stringify(url)};
export const frontmatter = ${JSON.stringify(frontmatter)};`,
          map: null,
        };
      }

      let layoutPath: string | undefined;
      if (typeof frontmatter.layout === 'string') {
        layoutPath = path.resolve(path.dirname(filePath), frontmatter.layout);
      } else if (mergedOptions.layout) {
        layoutPath = path.resolve(projectRoot, mergedOptions.layout);
      }


      const notebookHtml = exportCache.get(filePath) ?? (() => {
        let html = exportNotebook('uv run', filePath, projectRoot, {
          includeCode: mergedOptions.includeCode,
          execute: mergedOptions.execute,
          mode: mergedOptions.mode,
          wasmMode: mergedOptions.wasmMode,
        });
        html = stripElements(html, mergedOptions.stripStaticBanner, mergedOptions.stripMarimoWatermark);
        if (mergedOptions.css) html = injectCss(html, mergedOptions.css);
        exportCache.set(filePath, html);
        return html;
      })();


      const sharedExports = `
export const slug = ${JSON.stringify(slug)};
export const url = ${JSON.stringify(url)};
export const frontmatter = ${JSON.stringify(frontmatter)};
`;

      if (!layoutPath) {
        return {
          code: `${sharedExports}
export async function MarimoNotebook() {}
MarimoNotebook.__html = ${JSON.stringify(notebookHtml)};
export default MarimoNotebook;`,
          map: null,
        };
      } else {
        const iframeId = `marimo-${slug}`;
        const srcdoc = notebookHtml.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
        const iframeHtml = [
          `<iframe id="${iframeId}" srcdoc="${srcdoc}" style="width:100%;border:none;display:block;"></iframe>`,
          `<script>${outerScript(iframeId)}</script>`,
        ].join('\n');
        return {
          code: `import Layout from ${JSON.stringify(layoutPath)};
${sharedExports}
export async function MarimoNotebook() {}
MarimoNotebook.__html = ${JSON.stringify(iframeHtml)};
MarimoNotebook.__layout = Layout;
MarimoNotebook.__frontmatter = ${JSON.stringify(frontmatter)};
export default MarimoNotebook;`,
          map: null,
        };
      }
    },
  };
}

