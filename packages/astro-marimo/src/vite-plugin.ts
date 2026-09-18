import type { Plugin } from 'vite';
import jsYaml from 'js-yaml';
import path from 'node:path';
import { exportNotebook, stripElements } from './mo.js';
import { MarimoIntegrationOptions } from './index.js';

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

  return {
    name: 'vite-plugin-marimo',


    transform(code: string, id: string) {
      const [filePath, queryString] = id.split('?');
      if (!filePath.endsWith('.py')) return;

      const query = new URLSearchParams(queryString);
      const frontmatter = extractFrontmatter(code);

      const pagesDir = path.join(projectRoot, 'src', 'pages');
      const url = '/' + path.relative(pagesDir, filePath).replace(/\\/g, '/').replace(/\.py$/, '');
      const slug = path.basename(filePath, '.py').toLowerCase().replace(/[_\s]+/g, '-');

      if (query.has('pythonMetaOnly')) {
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
      } else if (options.layout) {
        layoutPath = path.resolve(projectRoot, options.layout);
      }

      const includeCode = (typeof frontmatter.includeCode === 'boolean' ? frontmatter.includeCode : options.includeCode) || false;

      const notebookHtml = stripElements(
        exportNotebook('uv run', filePath, projectRoot, includeCode),
        options.stripStaticBanner ?? true,
        options.stripMarimoWatermark ?? true,
      );


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
        // When using a layout, iFrame the notebook HTML so it doesn't fill the page.
        // In the future we might like to write notebook HTML at a separate route
        // and just src= it, perhaps if we switch to inlining Marimo's own JS.
        const srcdoc = notebookHtml.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
        const iframeHtml = `<iframe srcdoc="${srcdoc}" style="width:100%;height:100%;border:none;display:block;"></iframe>`;
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

