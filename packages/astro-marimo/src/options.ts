export interface MarimoIntegrationOptions {
  layout?: string;
  /** Include Python source code in the export. Default: false */
  includeCode: boolean;
  /** CSS added after Marimo's own styles. */
  css?: string;
  /** 'static' = pre-rendered HTML; 'wasm' = live Pyodide-powered. Default: 'static' */
  mode: 'static' | 'wasm';
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
