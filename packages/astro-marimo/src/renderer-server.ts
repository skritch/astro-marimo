import type { NamedSSRLoadedRendererValue } from 'astro';
import { Fragment, jsx } from 'astro/jsx-runtime';
import { chunkToString, renderStreaming } from 'astro/runtime/server/index.js';

export async function check(Component: any): Promise<boolean> {
  return typeof Component === 'function' && Component.name === 'MarimoNotebook';
}

export async function renderToStaticMarkup(
  this: any,
  Component: any,
): Promise<{ html: string }> {
  if (!Component.__layout) {
    console.log("rendering without layout")
    return { html: Component.__html };
  }

  const { result } = this;
  const content = jsx(Fragment, { 'set:html': Component.__html });
  const vnode = jsx(Component.__layout, { ...Component.__frontmatter, children: content });

  let html = '';
  const destination = {
    write(chunk: any) {
      if (chunk instanceof Response) return;
      html += chunkToString(result, chunk);
    },
  };
  await renderStreaming(vnode, result, destination);
  return { html };
}

const renderer: NamedSSRLoadedRendererValue = {
  name: 'astro-marimo',
  check,
  renderToStaticMarkup,
};

export default renderer;
