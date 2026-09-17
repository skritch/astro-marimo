import type { NamedSSRLoadedRendererValue } from 'astro';

export async function check(Component: any): Promise<boolean> {
  return typeof Component === 'function' && Component.name === 'MarimoNotebook';
}

export async function renderToStaticMarkup(
  this: any,
  Component: any,
): Promise<{ html: string }> {
  return { html: Component.__html };
}

const renderer: NamedSSRLoadedRendererValue = {
  name: 'astro-marimo',
  check,
  renderToStaticMarkup,
};

export default renderer;
