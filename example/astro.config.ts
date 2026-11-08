import { defineConfig } from 'astro/config';
import { marimoIntegration } from 'astro-marimo';

export default defineConfig({
  server: { port: 4770 },
  integrations: [marimoIntegration({
    layout: 'src/layouts/NotebookLayout.astro',
    // Marimo theme overrides go here rather than in the layout: this CSS also reaches
    // inside widgets that render in their own shadow root (tables, inputs, static markdown).
    // Here, the notebook background matches the layout's page background.
    css: `.marimo { --background: #fdf8ee; }`,
  })],
});
