export { unpluginStencil, getStencilCEM, STENCIL_DOCS_ID } from './plugin.js';
export type { StencilPluginOptions } from './options.js';

import { unpluginStencil } from './plugin.js';

export const stencilVite = unpluginStencil.vite;
export const stencilRollup = unpluginStencil.rollup;
export const stencilWebpack = unpluginStencil.webpack;
export const stencilEsbuild = unpluginStencil.esbuild;
export const stencilRspack = unpluginStencil.rspack;
