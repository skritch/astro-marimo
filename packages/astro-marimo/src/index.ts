import type { AstroIntegration } from 'astro';
import { execSync } from 'node:child_process';
import jsYaml from 'js-yaml';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function findPyFiles(dir: string, results: string[] = []): string[] {
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

type Frontmatter = Record<string, unknown>;

function extractFrontmatter(notebook: string): Frontmatter {
  const content = fs.readFileSync(notebook, 'utf-8');
  const m = content.match(/^# \/\/\/ astro\s*\n([\s\S]*?)^# \/\/\//m);
  if (!m) return {};
  const yaml = m[1].replace(/^# ?/gm, '');
  return (jsYaml.load(yaml) as Frontmatter) ?? {};
}

function exportNotebook(uvCmd: string, notebook: string, projectRoot: string, includeCode: boolean): string {
  const codeFlag = includeCode ? '--include-code' : '--no-include-code';
  return execSync(`${uvCmd} marimo export html ${codeFlag} "${notebook}"`, {
    cwd: projectRoot,
    maxBuffer: 50 * 1024 * 1024,
    env: { ...process.env, PYTHONPATH: projectRoot },
  }).toString('utf-8');
}

function stripElements(html: string, stripStaticBanner: boolean, stripMarimoWatermark: boolean): string {
  const selectors: string[] = [];
  if (stripStaticBanner) selectors.push('[data-testid="static-notebook-banner"]');
  if (stripMarimoWatermark) selectors.push('[data-testid="watermark"]');
  if (selectors.length === 0) return html;
  const style = `<style>${selectors.join(', ')} { display: none !important; }</style>`;
  return html.replace('</head>', `${style}</head>`);
}

function buildPageContent(
  fileSlug: string,
  pagesDir: string,
  frontmatter: Frontmatter,
  slug: string,
  notebook: string,
  layoutOption: string | null,
  projectRoot: string,
): string {

  const iframeSrc = `/_notebooks/${fileSlug}.html`;
  const title = typeof frontmatter.title === 'string' ? frontmatter.title : slug;
  const frontmatterLayout = typeof frontmatter.layout === 'string'
    ? path.resolve(path.dirname(notebook), frontmatter.layout)
    : null;
  const resolvedLayout = layoutOption
    ? path.isAbsolute(layoutOption) ? layoutOption : path.join(projectRoot, layoutOption)
    : null;
  const layoutPath = frontmatterLayout ?? resolvedLayout ?? null;

  if (!layoutPath) {
    return `---\n---\n<iframe src=${JSON.stringify(iframeSrc)} />`;
  }
  const relLayout = path.relative(pagesDir, layoutPath);
  const relLayoutImport = relLayout.startsWith('.') ? relLayout : `./${relLayout}`;
  return `\
---
import Layout from ${JSON.stringify(relLayoutImport)};
const frontmatter = ${JSON.stringify(frontmatter)};
---
<Layout title=${JSON.stringify(title)} {...frontmatter}>
  <iframe src=${JSON.stringify(iframeSrc)} />
</Layout>`;
}

export interface MarimoOptions {
  layout?: string;
  includeCode?: boolean;
  stripStaticBanner?: boolean;
  stripMarimoWatermark?: boolean;
}

export function marimoIntegration({
  layout,
  includeCode: includeCodeDefault = false,
  stripStaticBanner = true,
  stripMarimoWatermark = true,
}: MarimoOptions = {}): AstroIntegration {
  return {
    name: 'astro-marimo',
    hooks: {
      'astro:config:setup': async ({ injectRoute, addWatchFile, command, logger, config }) => {
        if (command === 'preview' || command === 'sync') return;

        const projectRoot = fileURLToPath(config.root);
        const pagesDir = path.join(projectRoot, '.astro-marimo/pages');
        const notebooksPublicDir = path.join(projectRoot, 'public/_notebooks');
        fs.mkdirSync(pagesDir, { recursive: true });
        fs.mkdirSync(notebooksPublicDir, { recursive: true });

        const hasPyproject = fs.existsSync(path.join(projectRoot, 'pyproject.toml'));
        const uvCmd = hasPyproject ? 'uv run' : 'uv run --with marimo';

        if (hasPyproject) {
          logger.info('astro-marimo: running uv sync');
          execSync('uv sync', { cwd: projectRoot, stdio: 'inherit' });
        }

        const pagesRoot = path.join(fileURLToPath(config.srcDir), 'pages');
        const notebooks = findPyFiles(pagesRoot);

        for (const notebook of notebooks) {
          const rel = path.relative(pagesRoot, notebook);
          // file-system safe slug for temp files, route preserves directory structure
          const slug = rel.replace(/\\/g, '/').replace(/\.py$/, '');
          const fileSlug = slug.replace(/\//g, '--');

          logger.info(`astro-marimo: exporting ${rel}`);

          const frontmatter = extractFrontmatter(notebook);
          const includeCode = typeof frontmatter.includeCode === 'boolean' ? frontmatter.includeCode : includeCodeDefault;

          const html = stripElements(
            exportNotebook(uvCmd, notebook, projectRoot, includeCode),
            stripStaticBanner,
            stripMarimoWatermark,
          );

          // Write the full standalone HTML to public/ so it's served as a static file.
          // The Astro page iframes it, keeping Marimo's full-page CSS isolated.
          fs.writeFileSync(path.join(notebooksPublicDir, `${fileSlug}.html`), html);

          const pageFile = path.join(pagesDir, `${fileSlug}.astro`);
          const pageContent = buildPageContent(
            fileSlug, pagesDir, frontmatter, slug, notebook, layout ?? null, projectRoot)
          fs.writeFileSync(pageFile, pageContent);

          injectRoute({ pattern: `/${slug}`, entrypoint: pageFile });

          if (command === 'dev') addWatchFile(notebook);

          logger.info(`astro-marimo: registered /${slug}`);
        }
      },
    },
  };
}
