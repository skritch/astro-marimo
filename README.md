

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

Notes:
- had to add a PYTHONPATH to `pyproject.toml` to find `lib` in pyproject.
- `\\\ astro` script metadata


Questions:
- what if anything will marimo-mdx have to do with this?
- should we support setting the Python env as an option?
- anything special for JS support?
- Should we [pre-render HTML exports](https://docs.marimo.io/guides/exporting/static_html/#pre-render-html-exports) rather than the default, which imports Marimo libraries within the static page?
- Think about sandboxing the marimo exports
- .astro-marimo fake pages are... weird. `inject-routes` requires an actual page?


----


References:

https://marimo.io/blog/marimo-anywhere

Best reference is probably the [mdx](https://github.com/withastro/astro/tree/main/packages/integrations/mdx/) plugin.

Integrations API reference here: https://docs.astro.build/en/reference/integrations-reference/

Installation notes: https://docs.astro.build/en/guides/integrations-guide/

Possibly of use: https://www.eduardo.wtf/blog/rendering-jupyter-notebooks-in-a-statically-generated-site/

https://docs.marimo.io/guides/exporting/webassembly_html/?
- includes islands export.
