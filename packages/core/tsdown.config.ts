import { resolve } from 'node:path';
import { defineConfig } from 'tsdown';

import { createDefines, getBuildVersionInfo } from './build/version-utils.ts';

const __dirname = import.meta.dirname;

// Get build-time version info for string replacements
const isProd = process.env.NODE_ENV === 'production';
const versionInfo = getBuildVersionInfo(resolve(__dirname, 'package.json'), isProd);
const defines = createDefines(versionInfo);

console.log(`Building @stencil/core ${versionInfo.version} ${versionInfo.vermoji}`);

/**
 * Virtual module plugin for Stencil internal builds.
 * Maps virtual:app-data, virtual:app-globals, virtual:platform to real files or external packages.
 *
 * @param options - plugin options containing resolve and external mappings
 * @returns a tsdown plugin object
 */
function virtualModules(options: {
  resolve?: Record<string, string>;
  external?: Record<string, string>;
}) {
  const resolveMap = new Map(Object.entries(options.resolve ?? {}));

  return {
    name: 'stencil-virtual-modules',

    resolveId(id: string) {
      if (resolveMap.has(id)) {
        return resolveMap.get(id);
      }
      return null;
    },
  };
}

const browserTargets = ['es2022'];
const nodeTarget = 'node22';

// Common virtual module resolve mappings
const virtualResolve = {
  'virtual:app-data': resolve(__dirname, 'src/app-data/index.ts'),
  'virtual:app-globals': resolve(__dirname, 'src/app-globals/index.ts'),
  'virtual:platform': resolve(__dirname, 'src/client/index.ts'),
};

export default defineConfig([
  // ============================================
  // Node builds (compiler, utils, testing, sys)
  // ============================================
  {
    entry: {
      index: 'src/index.ts',
      'compiler/index': 'src/compiler/index.ts',
      'compiler/utils/index': 'src/utils/compiler-exports.ts',
      'testing/index': 'src/testing/index.ts',
      'sys/node/index': 'src/sys/node/index.ts',
      'sys/node/worker': 'src/sys/node/worker.ts',
      'mock-doc': 'src/mock-doc.ts',
    },
    outDir: 'dist',
    format: ['esm'],
    platform: 'node',
    target: nodeTarget,
    dts: true,
    clean: true,
    deps: {
      neverBundle: [/^node:/, '@stencil/mock-doc'],
      skipNodeModulesBundle: true,
    },
    define: defines,
    plugins: [virtualModules({ resolve: virtualResolve })],
    copy: [
      // Copy curated public types (paths resolve via declarations entry below)
      { from: 'src/index.d.mts', to: 'dist' },
    ],
  },

  // Declarations (types only - generates .d.ts for public API imports)
  {
    entry: {
      'declarations/stencil-public-runtime': 'src/declarations/stencil-public-runtime.ts',
      'declarations/stencil-public-compiler': 'src/declarations/stencil-public-compiler.ts',
    },
    outDir: 'dist',
    format: ['esm'],
    platform: 'neutral',
    deps: {
      neverBundle: [/^node:/],
      skipNodeModulesBundle: true,
    },
    dts: true,
    clean: false,
    copy: [
      // Copy ext-modules types for CSS/SVG/etc imports
      { from: 'src/declarations/stencil-ext-modules.d.ts', to: 'dist/declarations' },
    ],
  },

  // Declarations for JSON docs. To be self contained, `codeSplitting: false,` only works on a single entry
  {
    entry: {
      'declarations/stencil-public-docs': 'src/declarations/stencil-public-docs.ts',
    },
    outDir: 'dist',
    format: ['esm'],
    platform: 'neutral',
    deps: {
      neverBundle: [/^node:/],
      skipNodeModulesBundle: true,
    },
    dts: true,
    clean: false,
    // Disable code splitting to avoid hashed chunk imports in declarations
    outputOptions: {
      codeSplitting: false,
    },
  },

  // Server/SSR platform (virtuals externalized for runtime swapping)
  {
    entry: {
      'runtime/server/index': 'src/server/platform/index.ts',
    },
    outDir: 'dist',
    format: ['esm'],
    platform: 'node',
    target: nodeTarget,
    dts: true,
    clean: false,
    deps: {
      neverBundle: [/^node:/, 'virtual:app-data', 'virtual:app-globals'],
      skipNodeModulesBundle: true,
    },
    outputOptions: {
      paths: {
        'virtual:app-data': '@stencil/core/runtime/app-data',
        'virtual:app-globals': '@stencil/core/runtime/app-globals',
      },
    },
    plugins: [
      virtualModules({
        resolve: {
          'virtual:platform': resolve(__dirname, 'src/server/platform/index.ts'),
        },
      }),
    ],
  },

  // Server/SSR runner (user-facing hydrate API: renderToString, ssrDocument, etc.)
  {
    entry: {
      'runtime/server/runner': 'src/server/runner/index.ts',
    },
    outDir: 'dist',
    format: ['esm'],
    platform: 'node',
    target: nodeTarget,
    dts: true,
    clean: false,
    deps: {
      onlyBundle: ['parse5', 'entities'],
      alwaysBundle: ['@stencil/mock-doc', 'parse5', '@stencil/core/runtime/server'],
      neverBundle: ['@stencil/core/runtime/server/ssr-factory', 'virtual:app-data'],
    },
    outputOptions: {
      paths: {
        'virtual:app-data': '@stencil/core/runtime/app-data',
      },
    },
    plugins: [
      virtualModules({
        resolve: {
          'virtual:platform': resolve(__dirname, 'src/server/platform/index.ts'),
        },
      }),
    ],
  },

  // ============================================
  // Browser builds
  // ============================================

  // Runtime core + app-data + app-globals (bundled together)
  {
    entry: {
      'runtime/index': 'src/runtime/index.ts',
      'runtime/app-data/index': 'src/app-data/index.ts',
      'runtime/app-globals/index': 'src/app-globals/index.ts',
      'jsx-runtime': 'src/runtime/vdom/jsx-runtime.ts',
    },
    outDir: 'dist',
    format: ['esm'],
    platform: 'browser',
    target: browserTargets,
    dts: true,
    clean: false,
    // sourcemap: true,
    deps: {
      neverBundle: [/^node:/],
    },
    plugins: [virtualModules({ resolve: virtualResolve })],
  },

  // Client runtime (app-data/globals externalized for runtime swapping)
  {
    entry: {
      'runtime/client/index': 'src/client/index.ts',
    },
    outDir: 'dist',
    format: ['esm'],
    platform: 'browser',
    target: browserTargets,
    dts: true,
    clean: false,
    deps: {
      neverBundle: [/^node:/, 'virtual:app-data', 'virtual:app-globals'],
      skipNodeModulesBundle: true,
    },
    outputOptions: {
      paths: {
        'virtual:app-data': '@stencil/core/runtime/app-data',
        'virtual:app-globals': '@stencil/core/runtime/app-globals',
      },
    },
    plugins: [
      virtualModules({
        resolve: {
          'virtual:platform': resolve(__dirname, 'src/client/index.ts'),
        },
      }),
    ],
  },
]);
