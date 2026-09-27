

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
  /** Hide Marimo's "static notebook" banner. Default: true */
  stripStaticBanner: boolean;
  /** Hide Marimo watermark. Default: true */
  stripMarimoWatermark: boolean;
  /** CSS injected into the notebook's <head> after Marimo's own styles. */
  css?: string;
  /** 'static' = pre-rendered HTML; 'wasm' = live Pyodide-powered. Default: 'static' */
  mode: 'static' | 'wasm';
  /** For wasm mode: 'run' (read-only) or 'edit' (full editor UI). Default: 'run' */
  wasmMode: 'run' | 'edit';
  /** Pre-execute notebook cells during export. Requires uv 0.7.21 or greater. Default: true */
  wasmExecute: boolean;
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
| Per-notebook live-reload | ✔️ | ✔️ | |
| Per-notebook venvs / deps | | | | |
| Bundle python deps | N/A |  N/A | | |
| Define astro frontmatter in notebook | ✔️ | ✔️ | | |
| Per-notebook layout | ✔️ | ✔️ | | |
| Strip code, watermark, banner | ✔️ | ✔️ | | |
| Override Marimo CSS sanely | | | | |
| Support content collections | | | | |


TODOs:
- support per-notebook venvs https://docs.marimo.io/guides/editor_features/home/#using-custom-virtual-environments
- allow `pyproject.toml` to be omitted
- iframes feel pretty bad. Consider using MarimoIslandGenerator and building the HTML ourselves.

