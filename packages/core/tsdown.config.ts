import { resolve } from 'node:path'
import { defineConfig } from 'tsdown'

const __dirname = import.meta.dirname

/**
 * Virtual module plugin for Stencil internal builds.
 * Maps virtual:app-data, virtual:app-globals, virtual:platform to real files or external packages.
 */
function virtualModules(options: {
  resolve?: Record<string, string>
  external?: Record<string, string>
}) {
  const resolveMap = new Map(Object.entries(options.resolve ?? {}))
  const externalMap = new Map(Object.entries(options.external ?? {}))

  return {
    name: 'stencil-virtual-modules',

    resolveId(id: string) {
      if (externalMap.has(id)) {
        return { id: externalMap.get(id)!, external: true }
      }
      if (resolveMap.has(id)) {
        return resolveMap.get(id)
      }
      return null
    },
  }
}

// Externalize all bare imports (not relative/absolute paths) = all node_modules
// Exclude virtual: modules so the plugin can handle them
// const nodeExternals: string[] = []
// /^(?!virtual:)[^./]/ 

// Browser targets
const browserTargets = ['es2022']

// Common virtual module resolve mappings
const virtualResolve = {
  'virtual:app-data': resolve(__dirname, 'src/app-data/index.ts'),
  'virtual:app-globals': resolve(__dirname, 'src/app-globals/index.ts'),
  'virtual:platform': resolve(__dirname, 'src/client/index.ts'),
}

export default defineConfig([
  // ============================================
  // Node builds (compiler, utils, testing, sys)
  // ============================================
  {
    entry: {
      index: 'src/compiler/index.ts',
      'compiler/utils/index': 'src/utils/compiler-exports.ts',
      'testing/index': 'src/testing/index.ts',
      'sys/node/index': 'src/sys/node/index.ts',
    },
    outDir: 'dist',
    format: ['esm'],
    platform: 'node',
    target: 'node20',
    dts: true,
    clean: true,
    // sourcemap: true,
    external: [/^node:/],
    plugins: [virtualModules({ resolve: virtualResolve })],
  },

  // Server/SSR (virtuals externalized for runtime swapping)
  {
    entry: {
      'runtime/server/index': 'src/server/platform/index.ts',
    },
    outDir: 'dist',
    format: ['esm'],
    platform: 'node',
    target: 'node20',
    dts: true,
    clean: false,
    // sourcemap: true,
    external: ['node:*'],
    plugins: [
      virtualModules({
        external: {
          'virtual:app-data': '@stencil/core/runtime/app-data',
          'virtual:app-globals': '@stencil/core/runtime/app-globals',
          'virtual:platform': '@stencil/core/runtime/client',
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
    },
    outDir: 'dist',
    format: ['esm'],
    platform: 'browser',
    target: browserTargets,
    dts: true,
    clean: false,
    sourcemap: true,
    external: [/^node:/],
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
    // sourcemap: true,
    external: [/^node:/],
    plugins: [
      virtualModules({
        resolve: {
          'virtual:platform': resolve(__dirname, 'src/client/index.ts'),
        },
        external: {
          'virtual:app-data': '@stencil/core/runtime/app-data',
          'virtual:app-globals': '@stencil/core/runtime/app-globals',
        },
      }),
    ],
  },
])
