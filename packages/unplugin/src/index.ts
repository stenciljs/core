export { unpluginStencil, getStencilCEM, STENCIL_DOCS_ID } from './plugin.js';
export type { StencilPluginOptions } from './options.js';

import type { UnpluginInstance } from 'unplugin';

import { unpluginStencil } from './plugin.js';
import type { StencilPluginOptions } from './options.js';

// Annotated so the published types reference `unplugin`'s exports; inferred, they inline
// bundler type names (e.g. `WebpackPluginInstance`) with no import.
type StencilUnplugin = UnpluginInstance<StencilPluginOptions | undefined, boolean>;

export const stencilVite: StencilUnplugin['vite'] = unpluginStencil.vite;
export const stencilRollup: StencilUnplugin['rollup'] = unpluginStencil.rollup;
export const stencilWebpack: StencilUnplugin['webpack'] = unpluginStencil.webpack;
export const stencilEsbuild: StencilUnplugin['esbuild'] = unpluginStencil.esbuild;
export const stencilRspack: StencilUnplugin['rspack'] = unpluginStencil.rspack;

/**
 * Vite plugin that transpiles components for use with `newSpecPage()` from
 * `@stencil/core/testing`, instead of the self-registering custom-element
 * output the other exports produce. Use in `vitest.config.ts`.
 *
 * Also redirects any bare `@stencil/core` import to `@stencil/core/testing`
 * for the whole test file, so mistakenly importing e.g. `setMode` from
 * `@stencil/core` doesn't silently resolve to a disconnected platform instance.
 * @param options - plugin options; `mode` is fixed to `'spec-page'` and cannot be overridden
 * @returns a Vite plugin
 */
export const stencilSpecPage = (options: Omit<StencilPluginOptions, 'mode'> = {}) =>
  unpluginStencil.vite({ ...options, mode: 'spec-page' });
