import { transpileSync } from '@stencil/core/compiler';

interface VitePlugin {
  name: string;
  enforce?: 'pre' | 'post';
  transform?: (code: string, id: string) => { code: string; map?: any } | null;
}

/**
 * A Vite plugin that transforms Stencil components for use in Vitest.
 * This replaces the Jest preprocessor functionality.
 */
export function stencilVitestPlugin(): VitePlugin {
  return {
    name: 'stencil-vitest-transform',
    enforce: 'pre',

    transform(code, id) {
      // Only transform .tsx files that contain Stencil decorators
      if (!id.endsWith('.tsx')) {
        return null;
      }

      // Quick check for Stencil component patterns
      const hasStencilDecorator =
        code.includes('@Component') ||
        code.includes('@Prop') ||
        code.includes('@State') ||
        code.includes('@Event') ||
        code.includes('@Method') ||
        code.includes('@Watch') ||
        code.includes('@Listen');

      if (!hasStencilDecorator) {
        return null;
      }

      const result = transpileSync(code, {
        file: id,
        componentExport: null,
        componentMetadata: 'compilerstatic',
        coreImportPath: '@stencil/core/testing',
        currentDirectory: process.cwd(),
        module: 'esm',
        proxy: null,
        sourceMap: 'inline',
        style: null,
        styleImportData: 'queryparams',
        target: 'es2022',
      });

      console.log(result)

      const hasErrors = result.diagnostics?.some((d) => d.level === 'error');
      if (hasErrors) {
        const messages = result.diagnostics
          .filter((d) => d.level === 'error')
          .map((d) => d.messageText)
          .join('\n');
        throw new Error(`Stencil transform error in ${id}:\n${messages}`);
      }

      return {
        code: result.code,
        map: result.map,
      };
    },
  };
}
