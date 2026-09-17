


How might this work?


Design goals:
1. required: notebook *outputs* are rendered within an Astro layout.
2. desired: we can use the whole WASM-Python runs-in-your-browser thing.
3. desired: both?
4. desired: the ability to embed a rendered or running notebook inside another Astro page, as a component or something
5. in any case we need support for a pyproject.yaml and local Python libraries, perhaps in a lib folder
  - in case 1, libs and imports are required at build time
  - in case 2, they need to be made available to the Python process in the browser, and are not installed live in the browser.
6. another idea: reference specific marimo cells as embeddable islands


Basic interface:
- Marimo notebook `.py` files go directly in the `/pages/` of the Astro project
- pyproject.toml goes straight in the root
- plug-and-play; notebooks render at routes on the server, optionally wrapped in a global or notebook-specific Astro Layout.


Matrix of features feasibility:

| Features | Static HTML | HTML Islands | Python-WASM | Python-WASM Islands |
| -------- | -------- | -------- | -------- | -------- |
| Embed in Astro Layout | ✔️ | | |
| Import local libraries | ✔️ | |  |
| Use as a component? | | | |
| Use specific cells as components | | | |
| Live-reload per-notebook | | | |
| Bundle deps | N/A |  N/A | | |
| Per-notebook venvs | |  | | |
| Include astro frontmatter | | | | |
| Use notebook title/metadata/? in layout | | | | |
| JS or TS | | | | |


TODO:
- don't rerun the whole hook all python files when any change; instead use a vite plugin?
- support per-notebook venvs https://docs.marimo.io/guides/editor_features/home/#using-custom-virtual-environments
- .astro-mariom fake pages are... weird. `inject-routes` requires an actual page?
- Remove the Marimo "run or edit" header?
- Remove "show code"

Notes:
- had to add a PYTHONPATH to `pyproject.toml` to find `lib` in pyproject.


Questions:
- what if anything will marimo-mdx have to do with this?


----


References:

https://marimo.io/blog/marimo-anywhere

Best reference is probably the [mdx](https://github.com/withastro/astro/tree/main/packages/integrations/mdx/) plugin.

Integrations API reference here: https://docs.astro.build/en/reference/integrations-reference/

Installation notes: https://docs.astro.build/en/guides/integrations-guide/

Possibly of use: https://www.eduardo.wtf/blog/rendering-jupyter-notebooks-in-a-statically-generated-site/

https://docs.marimo.io/guides/exporting/webassembly_html/?
- includes islands export.
