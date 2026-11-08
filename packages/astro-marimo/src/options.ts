export interface MarimoIntegrationOptions {
  layout?: string;
  /** Include Python source code in the export. Default: false */
  includeCode: boolean;
  /** CSS added to notebook pages after Marimo's own styles. Unlike layout CSS, it also reaches inside Marimo's widgets, so put `.marimo` theme overrides here. */
  css?: string;
  /** 'static' = pre-rendered HTML; 'wasm' = live Pyodide-powered. Default: 'static' */
  mode: 'static' | 'wasm';
  /** Fail when a cell raises during export. Errors are logged either way. Default: true for `astro build`, false in dev */
  strict?: boolean;
}

/** Options as written by users: everything optional. */
export type MarimoUserOptions = Partial<MarimoIntegrationOptions>;

export const defaults: MarimoIntegrationOptions = {
  includeCode: false,
  mode: 'static',
};

/** Apply `override` on top of `base` (more specific config wins). */
export function mergeOptions(base: MarimoIntegrationOptions, override: MarimoUserOptions): MarimoIntegrationOptions {
  return { ...base, ...override };
}
