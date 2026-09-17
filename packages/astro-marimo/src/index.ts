import type { AstroIntegration } from 'astro';
import { fileURLToPath } from 'node:url';
import { marimoVitePlugin } from './vite-plugin.js';

type InternalHookParams = Parameters<
  NonNullable<AstroIntegration["hooks"]["astro:config:setup"]>
>[0] & {
  addPageExtension(ext: string): void;
};

export interface MarimoIntegrationOptions {
  layout?: string;
  includeCode?: boolean;
  stripStaticBanner?: boolean;
  stripMarimoWatermark?: boolean;
}

export function marimoIntegration(opts: MarimoIntegrationOptions = {}): AstroIntegration {
  return {
    name: 'astro-marimo',
    hooks: {
      'astro:config:setup': async (params) => {
        const { config, updateConfig, addRenderer, addPageExtension } = params as InternalHookParams;

        const projectRoot = fileURLToPath(config.root);
        addPageExtension('.py');
        addRenderer({
          name: 'astro-marimo',
          serverEntrypoint: new URL('../dist/renderer-server.js', import.meta.url),
        });
        updateConfig({
          vite: {
            plugins: [
              marimoVitePlugin({
                root: fileURLToPath(config.srcDir),
                options: opts
              })
            ]
          }
        });
      },
    },
  };
}
