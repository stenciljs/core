import { createRequire } from 'node:module';
import type { Config } from '@stencil/core';

const require = createRequire(import.meta.url);

export const config: Config = {
  namespace: 'stencil-playground',
  srcDir: 'src',
  sourceMap: true,
  outputTargets: [{ type: 'loader-bundle' }],
  plugins: [
    {
      name: 'monaco-preserve-side-effects',
      // Prod builds mark every module side-effect-free by default so unused code shakes out -
      // but monaco-editor registers its core services and built-in editor UI purely as
      // `import 'some/module.js';` side effects, which then get stripped and the editor fails
      // to construct at runtime. Marking monaco-editor's own modules side-effect-preserving
      // fixes that without disabling treeshaking package-wide.
      async resolveId(source: string, importer: string | undefined) {
        // Most of monaco-editor's internal imports are relative, so the specifier text alone
        // won't say "monaco-editor" - but once inside its directory tree, every relative import
        // chases forward from an importer path that does. Checked synchronously before paying
        // for a resolve, since this hook runs for every import in the build.
        const looksLikeMonaco =
          source.includes('monaco-editor') || importer?.includes('/monaco-editor/');
        if (!looksLikeMonaco) return null;
        const resolved = await this.resolve(source, importer, { skipSelf: true });
        return resolved ? { ...resolved, moduleSideEffects: true } : null;
      },
    },
  ],
  // typescript, postcss, and @rollup/pluginutils all stay external in
  // @stencil/core/compiler/browser and reference these Node builtins
  nodeResolve: {
    alias: {
      path: require.resolve('./build/path-polyfill-shim.js'),
      'node:path': require.resolve('./build/path-polyfill-shim.js'),
      os: require.resolve('os-browserify/browser'),
      // Aliased directly to the real package (not a wrapper)
      process: require.resolve('process/browser'),
      // Statically referenced but never actually called in the browser
      fs: require.resolve('./build/empty-shim.js'),
      crypto: require.resolve('./build/empty-shim.js'),
      url: require.resolve('./build/empty-shim.js'),
    },
  },
};
