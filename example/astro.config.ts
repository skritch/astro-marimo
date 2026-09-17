import { defineConfig } from 'astro/config';
import type { AstroIntegration } from 'astro';
import { execSync } from 'node:child_process';
import jsYaml from 'js-yaml';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

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

interface MarimoOptions {
  layout?: string;
}

function marimoIntegration({ layout }: MarimoOptions = {}): AstroIntegration {
  return {
    name: 'astro-marimo',
    hooks: {
      'astro:config:setup': async ({ injectRoute, addWatchFile, command, logger }) => {
        if (command === 'preview' || command === 'sync') return;

        // what is this dir for, do we really need it? can we do it in memory? clean up after?
        const pagesDir = path.join(projectRoot, '.astro-marimo/pages');
        const notebooksPublicDir = path.join(projectRoot, 'public/_notebooks');
        fs.mkdirSync(pagesDir, { recursive: true });
        fs.mkdirSync(notebooksPublicDir, { recursive: true });

        const hasPyproject = fs.existsSync(path.join(projectRoot, 'pyproject.toml'));
        const uvCmd = hasPyproject ? 'uv run' : 'uv run --with marimo';

        // can we skip syncing if pyproject hasn't changed?
        if (hasPyproject) {
          logger.info('astro-marimo: running uv sync');
          execSync('uv sync', { cwd: projectRoot, stdio: 'inherit' });
        }

        const pagesRoot = path.join(projectRoot, 'src/pages');
        const notebooks = findPyFiles(pagesRoot);

        for (const notebook of notebooks) {
          const rel = path.relative(pagesRoot, notebook);
          // file-system safe slug for temp files, route preserves directory structure
          const slug = rel.replace(/\\/g, '/').replace(/\.py$/, '');
          const fileSlug = slug.replace(/\//g, '--');

          logger.info(`astro-marimo: exporting ${rel}`);

          const env = { ...process.env, PYTHONPATH: projectRoot };
          const frontmatter = extractFrontmatter(notebook);

          const html = execSync(`${uvCmd} marimo export html "${notebook}"`, {
            cwd: projectRoot,
            maxBuffer: 50 * 1024 * 1024,
            env,
          }).toString('utf-8');

          // Write the full standalone HTML to public/ so it's served as a static file.
          // The Astro page iframes it, keeping Marimo's full-page CSS isolated.
          const htmlPublicFile = path.join(notebooksPublicDir, `${fileSlug}.html`);
          fs.writeFileSync(htmlPublicFile, html);

          const iframeSrc = `/_notebooks/${fileSlug}.html`;
          const defaultLayout = layout ?? path.join(projectRoot, 'src/layouts/NotebookLayout.astro');
          const frontmatterLayout = typeof frontmatter.layout === 'string'
            ? path.resolve(path.dirname(notebook), frontmatter.layout)
            : null;
          const layoutPath = frontmatterLayout ?? defaultLayout;
          const pageFile = path.join(pagesDir, `${fileSlug}.astro`);
          const relLayout = path.relative(pagesDir, layoutPath);
          const relLayoutImport = relLayout.startsWith('.') ? relLayout : `./${relLayout}`;
          const title = typeof frontmatter.title === 'string' ? frontmatter.title : slug;

          fs.writeFileSync(pageFile, `\
---
import Layout from ${JSON.stringify(relLayoutImport)};
const frontmatter = ${JSON.stringify(frontmatter)};
---
<Layout title=${JSON.stringify(title)} {...frontmatter}>
  <iframe src=${JSON.stringify(iframeSrc)} />
</Layout>
`);

          injectRoute({ pattern: `/${slug}`, entrypoint: pageFile });

          // TODO: don't rerun all notebooks when any one changes.
          if (command === 'dev') addWatchFile(notebook);

          logger.info(`astro-marimo: registered /${slug}`);
        }
      },
    },
  };
}

export default defineConfig({
  integrations: [marimoIntegration()],
});

