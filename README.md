

# Astro-Marimo

This is a work-in-progress [Astro](https://astro.build/) integration to support [Marimo](https://marimo.io/) Python notebooks.

See [example/](./example/), which exports notebooks as static HTML iframes during Astro's build step.

---

Design goals:
- [x] notebooks can render within an Astro layout as static HTML files, including their outputs.
- [ ] notebooks can run within an Astro layout with live Python
- [ ] embed a rendered or running notebook inside another Astro page as components?
- [ ] reference specific marimo cells as embeddable islands?


Basic interface:
- Marimo notebook `.py` files go directly in the `/pages/` of the Astro project
- `pyproject.toml` goes straight in the root
- plug-and-play; notebooks render at routes on the server, optionally wrapped in a global or notebook-specific Astro Layout.


Matrix of features:

| Features | Static HTML | HTML Islands | Python-WASM | Python-WASM Islands |
| -------- | -------- | -------- | -------- | -------- |
| Embed in Astro Layout | ✔️ | | |
| Import local libraries | ✔️ | |  |
| As a component | | | |
| Specific cells as components | | | |
| Per-notebook live-reload | | | |
| Per-notebook venvs? | | | | |
| Bundle python deps | N/A |  N/A | | |
| Define astro frontmatter in notebook | ✔️ | | | |
| Per-notebook layout | ✔️ | | | |
| Inline deps | | | | |
| Strip code, watermark, banner | ✔️ | | | |
| Override Marimo CSS sanely | | | | |


TODOs:
- don't rerun the whole hook all python files when any change; instead use a vite plugin?
- support per-notebook venvs https://docs.marimo.io/guides/editor_features/home/#using-custom-virtual-environments
  - `/// script`-declared dependencies...
- [x] Remove the Marimo "run or edit" header and watermark?
- [x] Remove "show code" / toggle including code at all
- Figure out how to make frontmatter parseable within Astro... `import.meta.glob`?
- add .url to generated frontmatter

Notes:
- had to add a PYTHONPATH to `pyproject.toml` to find `lib` in pyproject.
- `\\\ astro` script metadata


Questions:
- what if anything will marimo-mdx have to do with this?
- how to support setting the Python env, or specifying Python deps within a notebook?
- Should we [pre-render HTML exports](https://docs.marimo.io/guides/exporting/static_html/#pre-render-html-exports) rather than the default, which imports Marimo libraries within the static page?
- Think about sandboxing the marimo exports
- .astro-marimo fake pages are... weird. `inject-routes` requires an actual page?


----

The present version of this project is a PoC, and simply runs once over all notebooks
at `npm run build` time. This has at least three major inadequacies:
- no way to hot-reload individual notebooks
- no way `import.meta.glob()` notebooks with their parsed frontmatter, e.g. to generate a list of links to notebook files, like the `mdx` plugin does
- we create awkward temporary files in a `.astro-marimo` directory and in `public/_notebooks`

To fix these, the plugin should be implemented as a Vite transform, akin to the `mdx` plugin, which would:
- `transform` our  `.py` Marimo notebooks into JS structured data at import time (fixing `import.meta.glob`)
- register a Vite dev server middleware via `configureServer` to produce rendered HTML notebooks on demand
- inject rendered notebook pages via `generateBundle` during a static build
- pass a virtual path to Astro's `injectRoute` API and generate the required file on-demand, to eliminate the need for an intermediate `.astro` file


----


References:

https://marimo.io/blog/marimo-anywhere

Best reference is probably the [mdx](https://github.com/withastro/astro/tree/main/packages/integrations/mdx/) plugin.

Integrations API reference here: https://docs.astro.build/en/reference/integrations-reference/

Installation notes: https://docs.astro.build/en/guides/integrations-guide/

Possibly of use: https://www.eduardo.wtf/blog/rendering-jupyter-notebooks-in-a-statically-generated-site/

https://docs.marimo.io/guides/exporting/webassembly_html/?
- includes islands export.
