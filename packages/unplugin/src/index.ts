export { unpluginStencil, getStencilCEM, STENCIL_DOCS_ID } from './plugin.js';
export type { StencilPluginOptions } from './options.js';

import { unpluginStencil } from './plugin.js';
import type { StencilPluginOptions } from './options.js';

export const stencilVite = unpluginStencil.vite;
export const stencilRollup = unpluginStencil.rollup;
export const stencilWebpack = unpluginStencil.webpack;
export const stencilEsbuild = unpluginStencil.esbuild;
export const stencilRspack = unpluginStencil.rspack;

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
