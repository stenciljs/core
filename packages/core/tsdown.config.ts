import { resolve } from 'node:path'
import { defineConfig } from 'tsdown'

import { createDefines, getBuildVersionInfo } from './build/version-utils.ts'

const __dirname = import.meta.dirname

// Get build-time version info for string replacements
const isProd = process.env.NODE_ENV === 'production'
const versionInfo = getBuildVersionInfo(resolve(__dirname, 'package.json'), isProd)
const defines = createDefines(versionInfo)

console.log(`Building @stencil/core ${versionInfo.version} ${versionInfo.vermoji}`)

/**
 * Virtual module plugin for Stencil internal builds.
 * Maps virtual:app-data, virtual:app-globals, virtual:platform to real files or external packages.
 */
function virtualModules(options: {
  resolve?: Record<string, string>
  external?: Record<string, string>
}) {
  const resolveMap = new Map(Object.entries(options.resolve ?? {}))

  return {
    name: 'stencil-virtual-modules',

    resolveId(id: string) {
      if (resolveMap.has(id)) {
        return resolveMap.get(id)
      }
      return null
    },
  }
}

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
    target: 'node20',
    skipNodeModulesBundle: true,
    dts: true,
    clean: true,
    external: [/^node:/, '@stencil/mock-doc'],
    define: defines,
    plugins: [virtualModules({ resolve: virtualResolve })],
    copy: [
      // Copy curated public types (paths resolve via declarations entry below)
      { from: 'src/index.d.mts', to: 'dist' },
      // Copy stencil-public-docs.d.ts for docs-json output target
      { from: '../../internal/stencil-public-docs.d.ts', to: 'dist/declarations' },
      // Copy ext-modules types for CSS/SVG/etc imports
      { from: 'src/declarations/stencil-ext-modules.d.ts', to: 'dist/declarations' },
    ],
  },

  // Declarations (types only - generates .d.mts for public API imports)
  {
    entry: {
      'declarations/stencil-public-runtime': 'src/declarations/stencil-public-runtime.ts',
      'declarations/stencil-public-compiler': 'src/declarations/stencil-public-compiler.ts',
    },
    outDir: 'dist',
    format: ['esm'],
    platform: 'neutral',
    external: [/^node:/],
    dts: true,
    clean: false,
    skipNodeModulesBundle: true,
  },

  // Server/SSR platform (virtuals externalized for runtime swapping)
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
    external: ['node:*'],
    skipNodeModulesBundle: true,
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

  // Server/SSR runner (user-facing hydrate API: renderToString, hydrateDocument, etc.)
  {
    entry: {
      'runtime/server/runner': 'src/server/runner/index.ts',
    },
    outDir: 'dist',
    format: ['esm'],
    platform: 'node',
    target: 'node20',
    dts: true,
    clean: false,
    external: ['node:*', '@stencil/mock-doc'],
    skipNodeModulesBundle: true,
    plugins: [
      virtualModules({
        external: {
          'virtual:platform': '@stencil/core/runtime/server',
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
    // sourcemap: true,
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
    skipNodeModulesBundle: true,
    external: [/^node:/, 'virtual:app-data', 'virtual:app-globals'],
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
])
