import { defineConfig } from 'astro/config';
import { marimoIntegration } from 'astro-marimo';

export default defineConfig({
  server: { port: 4770 },
  integrations: [marimoIntegration({
    layout: 'src/layouts/NotebookLayout.astro',
  })],
});
