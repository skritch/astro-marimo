export interface MarimoIntegrationOptions {
  layout?: string;
  /** Include Python source code in the export. Default: false */
  includeCode: boolean;
  /** Execute notebook cells during export. Default: false */
  execute: boolean;
  /** Hide Marimo's "static notebook" banner. Default: true */
  stripStaticBanner: boolean;
  /** Hide Marimo watermark. Default: true */
  stripMarimoWatermark: boolean;
  /** CSS injected into the notebook's <head> after Marimo's own styles. */
  css?: string;
  /** 'static' = pre-rendered HTML; 'wasm' = live Pyodide-powered. Default: 'static' */
  mode: 'static' | 'wasm';
  /** For wasm mode: 'run' (read-only) or 'edit' (full editor UI). Default: 'run' */
  wasmMode: 'run' | 'edit';
}

export const defaults: MarimoIntegrationOptions = {
  includeCode: false,
  execute: false,
  stripStaticBanner: true,
  stripMarimoWatermark: true,
  mode: 'static',
  wasmMode: 'run',
};
