

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
| Per-notebook live-reload | ✔️ | | |
| Per-notebook venvs? | | | | |
| Bundle python deps | N/A |  N/A | | |
| Define astro frontmatter in notebook | ✔️ | | | |
| Per-notebook layout | ✔️ | | | |
| Inline deps | | | | |
| Strip code, watermark, banner | ✔️ | | | |
| Override Marimo CSS sanely | | | | |


TODOs:
- support per-notebook venvs https://docs.marimo.io/guides/editor_features/home/#using-custom-virtual-environments
  - and `/// script`-declared dependencies?
- Figure out how to make frontmatter parseable within Astro... `import.meta.glob`?
- add .url to generated frontmatter



Questions:
- how to support setting the Python env, or specifying Python deps within a notebook?
- Should we [pre-render HTML exports](https://docs.marimo.io/guides/exporting/static_html/#pre-render-html-exports) rather than the default, which imports Marimo libraries within the static page?
- Think about sandboxing the marimo exports



----


References:

https://docs.marimo.io/guides/exporting/webassembly_html/?
- includes islands export.


Integrations reference:
-  https://docs.astro.build/en/reference/integrations-reference/
- https://docs.astro.build/en/guides/integrations-guide/

Plugin references:
- https://github.com/shishkin/astro-asciidoc/blob/renovate/major-astro/packages/astro-asciidoc/src/index.ts
- https://github.com/withastro/astro/tree/main/packages/integrations/mdx/
- Vite in particule: https://github.com/withastro/astro/blob/main/packages/integrations/mdx/src/vite-plugin-mdx.ts