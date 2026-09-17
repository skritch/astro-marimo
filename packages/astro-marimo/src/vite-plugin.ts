import type { Plugin, ViteDevServer } from 'vite';
import jsYaml from 'js-yaml';
import path from 'node:path';
import { exportNotebook, stripElements } from './py.js';
import { MarimoIntegrationOptions } from './index.js';

type Frontmatter = Record<string, unknown>;

function extractFrontmatter(code: string): Frontmatter {
  const m = code.match(/^# \/\/\/ astro\s*\n([\s\S]*?)^# \/\/\//m);
  if (!m) return {};
  const yaml = m[1].replace(/^# ?/gm, '');
  return (jsYaml.load(yaml) as Frontmatter) ?? {};
}

export interface MarimoVitePluginOptions {
  root: string;
  options: MarimoIntegrationOptions
}

export function marimoVitePlugin({ root, options }: MarimoVitePluginOptions): Plugin {

  return {
    name: 'vite-plugin-marimo',


    transform(code: string, id: string) {
      if (!id.endsWith('.py')) return;

      const notebookPath = path.relative(path.join(root, "pages"), id);
      const slug = notebookPath.replace(/\\/g, '/').replace(/\.py$/, '');
      const fileSlug = slug.replace(/\//g, '--');

      const frontmatter = extractFrontmatter(code);

      let layoutPath
      if (typeof frontmatter.layout === 'string') {
        layoutPath = path.resolve(path.dirname(id), frontmatter.layout)
      } else if (options.layout && path.isAbsolute(options.layout)) {
        layoutPath = path.join(root, options.layout)
      } else {
        layoutPath = undefined
      }
      const includeCode = (typeof frontmatter.includeCode == 'boolean' ? frontmatter.includeCode as boolean : options.includeCode) || false

      const notebookHtml = stripElements(
        exportNotebook("uv run", id, root, includeCode),
        options.stripStaticBanner || true,
        options.stripMarimoWatermark || true,
      );

      // temp ignore layouts
      // if (!layoutPath) {
      return {
        code: `export const frontmatter = ${JSON.stringify(frontmatter)};
export async function MarimoNotebook() {}
MarimoNotebook.__html = ${JSON.stringify(notebookHtml)};
export default MarimoNotebook;`,
        map: null,
      };
      // }

      //       const relLayout = path.relative(path.dirname(id), layoutPath);
      //       const layoutImport = relLayout.startsWith('.') ? relLayout : `./${relLayout}`;

      //       return {
      //         code: `import { Fragment, jsx as h } from "astro/jsx-runtime";
      // import Layout from ${JSON.stringify(layoutImport)};
      // export const frontmatter = ${JSON.stringify(frontmatter)};
      // export async function Content() {
      //   const content = h(Fragment, { "set:html": ${JSON.stringify(iframeHtml)} });
      //   return h(Layout, { ...frontmatter, children: content });
      // }
      // export default Content;`,
      //         meta: { vite: { lang: 'ts' } },
      //         map: null,
      //       };
    },
  };
}
