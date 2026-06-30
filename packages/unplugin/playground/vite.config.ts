import { defineConfig } from 'vite';

import { stencilVite } from '../dist/index.mjs';

export default defineConfig({
  plugins: [stencilVite()],
});
