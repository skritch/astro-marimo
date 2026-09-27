import type { AstroIntegration } from 'astro';
import { fileURLToPath } from 'node:url';
import { marimoVitePlugin } from './vite-plugin.js';
import { type MarimoIntegrationOptions, defaults } from './options.js';

export type { MarimoIntegrationOptions };

type InternalHookParams = Parameters<
  NonNullable<AstroIntegration["hooks"]["astro:config:setup"]>
>[0] & {
  addPageExtension(ext: string): void;
};

export function marimoIntegration(opts: Partial<MarimoIntegrationOptions> = {}): AstroIntegration {
  return {
    name: 'astro-marimo',
    hooks: {
      'astro:config:setup': async (params) => {
        const { config, updateConfig, addRenderer, addPageExtension } = params as InternalHookParams;

        const projectRoot = fileURLToPath(config.root);
        addPageExtension('.py');
        addRenderer({
          name: 'astro-marimo',
          serverEntrypoint: new URL('../dist/ssr.js', import.meta.url),
        });
        updateConfig({
          vite: {
            plugins: [
              marimoVitePlugin({
                projectRoot,
                options: { ...defaults, ...opts }
              })
            ]
          }
        });
      },
    },
  };
}
