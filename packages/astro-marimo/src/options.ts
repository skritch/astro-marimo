/** Options that only apply when `embed: 'iframe'`. */
export interface IframeOptions {
  /** Hide Marimo watermark. Default: true */
  stripMarimoWatermark: boolean;
  /** For wasm mode: 'run' (read-only) or 'edit' (full editor UI). Default: 'run' */
  wasmMode: 'run' | 'edit';
  /** Pre-execute notebook cells during export. Requires uv 0.7.21 or greater. Default: true */
  wasmExecute: boolean;
}

export interface MarimoIntegrationOptions {
  layout?: string;
  /** Include Python source code in the export. Default: false */
  includeCode: boolean;
  /** CSS added after Marimo's own styles. */
  css?: string;
  /** 'static' = pre-rendered HTML; 'wasm' = live Pyodide-powered. Default: 'static' */
  mode: 'static' | 'wasm';
  /** 'islands' = cells rendered into the page as marimo islands; 'iframe' = full export in an iframe. Default: 'islands' */
  embed: 'islands' | 'iframe';
  iframe: IframeOptions;
}

/** Options as written by users: everything optional, including within `iframe`. */
export type MarimoUserOptions = Partial<Omit<MarimoIntegrationOptions, 'iframe'>> & {
  iframe?: Partial<IframeOptions>;
};

export const defaults: MarimoIntegrationOptions = {
  includeCode: false,
  mode: 'static',
  embed: 'islands',
  iframe: {
    stripMarimoWatermark: true,
    wasmMode: 'run',
    wasmExecute: true,
  },
};

/** Shallow merge, except `iframe`, which is merged one level deeper. */
export function mergeOptions(base: MarimoIntegrationOptions, override: MarimoUserOptions): MarimoIntegrationOptions {
  return { ...base, ...override, iframe: { ...base.iframe, ...override.iframe } };
}
