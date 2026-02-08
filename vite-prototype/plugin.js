/**
 * Stencil Vite Plugin Prototype (Level 2)
 *
 * Tests: Can Vite use Stencil's transpile() to compile components?
 *
 * Level 1 (future): Build Stencil itself with Vite (pure ESM)
 * Level 2 (this): Use transpile() in Vite plugin for user projects
 *
 * Note: Current Stencil compiler is CJS, so we use createRequire.
 * Level 1 would make this a clean ESM import.
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { transpile } = require('../compiler/stencil.js');

export function stencilPlugin() {
  return {
    name: 'stencil',
    enforce: 'pre',

    async transform(code, id) {
      if (!id.endsWith('.tsx') || !code.includes('@Component')) {
        return null;
      }

      console.log(`[stencil] Compiling: ${id}`);

      const result = await transpile(code, {
        file: id,
        module: 'esm',
        target: 'es2020',
        componentExport: 'customelement',
        sourceMap: 'inline',
      });

      // Report errors
      const errors = result.diagnostics?.filter(d => d.level === 'error') || [];
      if (errors.length > 0) {
        const msg = errors.map(e => e.messageText).join('\n');
        throw new Error(`Stencil compilation failed:\n${msg}`);
      }

      // Log compiled components
      for (const cmp of result.data || []) {
        console.log(`[stencil] → <${cmp.tag}>`);
      }

      return {
        code: result.code,
        map: result.map,
      };
    },
  };
}
