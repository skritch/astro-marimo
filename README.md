

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
  /** CSS added to notebook pages after Marimo's own styles. Unlike layout CSS, it also reaches inside Marimo's widgets. See "Styling". */
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

## Styling

Notebooks render directly into your page as [marimo islands](https://docs.marimo.io/guides/exporting/#embed-marimo-outputs-in-html-using-islands), with no iframe. That means:

- **Marimo's CSS stays inside the notebook.** Every Marimo rule is scoped under `.marimo`, so it doesn't affect the rest of your page.
- **Your site's CSS reaches into the notebook.** Element rules like `h1 {}`, `ul {}` or `img {}` in your site stylesheet also apply to notebook content. To keep a rule out of notebooks, scope it, e.g. `article img:not(.marimo *)`.

### Theming

Marimo is themed with CSS variables. Fonts can be set anywhere, e.g. on `:root`. Colours are defined on `.marimo` itself, so override them there:

```css
:root {
  --marimo-text-font: "Helvetica Neue", Helvetica, Arial, sans-serif;   /* default: PT Sans */
  --marimo-heading-font: "Helvetica Neue", Helvetica, Arial, sans-serif; /* default: Lora */
  --marimo-monospace-font: Menlo, monospace;                             /* default: Fira Mono */
}
.marimo {
  --background: #fdfdfd;   /* cell background; match your page to avoid white panels */
  --foreground: #222;      /* text */
  --link: #a00;
  --border: #ddd;
}
```

Put this in the `css` option:

```js
marimoIntegration({
  css: `.marimo { --background: #fdfdfd; }`,
})
```

The `css` option is the one place guaranteed to reach *inside* Marimo's widgets. Some widgets (static markdown, tables, text inputs) render in their own shadow roots, and Marimo copies only its own stylesheets in there, which includes the `css` option. Layout CSS works for the font variables, which are inherited, but **not** for `.marimo` colour overrides: those widgets would keep white backgrounds. Astro's default scoped `<style>` doesn't match notebook content at all; use `<style is:global>` for anything else in a layout.

### Width and spacing

- **Width** comes from the notebook: `marimo.App(width="compact" | "medium" | "full")` caps the content at 740px, 1110px or no limit, centred.
- **Page padding** is up to your layout. Marimo's own page uses roughly `padding-inline: 4–6rem` on wide screens; see the [example layout](./example/src/layouts/NotebookLayout.astro).
- **Font size** follows your page's root size. Marimo's own app shrinks everything to 90%, so notebooks look slightly larger in your site than in Marimo.

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
| Override Marimo CSS sanely | ✔️ | ✔️ | | |
| Support content collections | | | | |


TODOs:
- support per-notebook venvs https://docs.marimo.io/guides/editor_features/home/#using-custom-virtual-environments
- figure out if `pyproject.toml` can be omitted. 
- Figure out how to use pyproject-global dependencies inside WASM notebooks. (The sandboxed env seems to ignore them.)
- can't run wasm notebooks offline. Consider bundling Python environment.
- support various marimo configs, like outputs above/below code
- since we have standalone islands now, make it possible to use islands as components in other astro pages
  - perhaps support an mdx-maroimo type flow