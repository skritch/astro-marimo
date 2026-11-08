

# Astro-Marimo

This is a work-in-progress [Astro](https://astro.build/) integration to support [Marimo](https://marimo.io/) Python notebooks.

This plugin works by converting notebook `.py` files from within Astro's own page directory into static HTML (with or without WASM-powered Python) during Astro's build step.  
A `pyproject.yaml` file should be provided in the Astro project root, with `marimo` installed.

An [example/](./example/) project is provided.

## Usage

Usage is as follows:

```

import { defineConfig } from 'astro/config';
import { marimoIntegration } from 'astro-marimo';

export default defineConfig({
  server: { port: 4770 },
  integrations: [marimoIntegration({
    layout: 'src/layouts/NotebookLayout.astro',
    mode: 'wasm'
  })],
});

```


The following options are supported:

```
export interface MarimoIntegrationOptions {
  layout?: string;
  /** Include Python source code in the export. Default: false */
  includeCode: boolean;
  /** CSS added after Marimo's own styles. */
  css?: string;
  /** 'static' = pre-rendered HTML; 'wasm' = live Pyodide-powered. Default: 'static' */
  mode: 'static' | 'wasm';
  /** Fail when a cell raises during export. Errors are logged either way. Default: true for `astro build`, false in dev */
  strict?: boolean;
}
```

Notebooks may also specify these options, along with Astro-style frontmatter, in Python script metadata:

```
# /// astro
# title: Fibonacci Sequence
# description: Visualising the Fibonacci sequence with pure Python.
# mode: wasm
# ///
```



---

## Roadmap


- [x] notebooks embed in an Astro layout as static HTML files with pre-rendered cell outputs.
- [x] notebooks can run within an Astro layout with live interactive Python
- [ ] embed a notebook inside another Astro page as a component


Matrix of features:

| Features | Static HTML | Python WASM | Static Components | WASM Components |
| -------- | -------- | -------- | -------- | -------- |
| Embed in Astro Layout | ✔️ | ✔️ | |
| Import local libraries | ✔️ | ✔️ | |
| Specific cells as components | | | |
| Live-reload | ✔️ | ✔️ | |
| Pyproject-global deps | ✔️ | | | |
| Per-notebook deps | | ✔️ | | |
| Bundle python deps | N/A |  | N/A  | |
| Define astro frontmatter in notebook | ✔️ | ✔️ | | |
| Per-notebook layout | ✔️ | ✔️ | | |
| Hide code | ✔️ | ✔️ | | |
| Override Marimo CSS sanely | | | | |
| Support content collections | | | | |


TODOs:
- support per-notebook venvs https://docs.marimo.io/guides/editor_features/home/#using-custom-virtual-environments
- figure out if `pyproject.toml` can be omitted. 
- Figure out how to use pyproject-global dependencies inside WASM notebooks. (The sandboxed env seems to ignore them.)
- document basic CSS to fix background color, font, and and width
- can't run wasm notebooks offline. Consider bundling Python environment.
- support various marimo configs, like outputs above/below code
- since we have standalone islands now, make it possible to use islands as components in other astro pages
  - perhaps support an mdx-maroimo type flow