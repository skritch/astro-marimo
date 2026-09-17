import { defineConfig } from 'astro/config';
import { marimoIntegration } from 'astro-marimo';

export default defineConfig({
  integrations: [marimoIntegration({
    layout: 'src/layouts/NotebookLayout.astro'
  })],
});
