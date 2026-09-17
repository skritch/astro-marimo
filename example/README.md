

# Astro-marimo Example Project

This directory contains an Astro project which will export a test notebook [src/pages/test_notebook.py](./src/pages/test_notebook.py) as a static HTML page at build time.

To run this example, use:
```
npm run build
npm run preview
```

or 
```
npm run dev
```


Elements of the integration:

1. `marimoIntegration` is imported and added to Astro within [astro.config.ts](./astro.config.ts)
2. A `uv` environment is defined via [pyproject.toml](./pyproject.toml), with `marimo` as a dependency
3. (Optional) A custom layout is defined in [src/layouts/NotebookLayout.astro](./src/layouts/NotebookLayout.astro), and is configured as the default layout within `astro.config.ts`. 
4. (Optional) The example notebook [src/pages/test_notebook.py](./src/pages/test_notebook.py) defines Astro-style frontmatter as [PEP 723](https://peps.python.org/pep-0723/#why-not-infer-the-requirements-from-import-statements)-compliant script metadata, like  `/// astro` 
5. (Optional) Local python dependencies are in the [/lib](./lib/) directory, and are importable from a notebook because `pyproject.toml` sets `PYTHONPATH` to `.`.


