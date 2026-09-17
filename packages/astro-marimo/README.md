

# Astro-Marimo


This is a work-in-progress [Astro](https://astro.build/) integration to support [Marimo](https://marimo.io/) Python notebooks.




Basic usage:

In your `astro.config.ts`,
```
import { defineConfig } from 'astro/config';
import { marimoIntegration } from 'astro-marimo';

export default defineConfig({
  integrations: [marimoIntegration({
    layout: 'src/layouts/NotebookLayout.astro'
  })],
});
```


Make sure you have `uv` installed. Create a `pyproject.toml` in the root directory of your project, with `marimo` as a dependency.

Then you can place Marimo `.py` notebooks anywhere in the `/pages/` directory of your Astro project. Notebooks will be exported as HTML pages within your static site.

See the example in the Github repo for more usage details.
