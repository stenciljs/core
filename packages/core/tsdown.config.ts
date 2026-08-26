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
function virtualModules(options: { resolve?: Record<string, string>; external?: string[] }) {
  const resolveMap = new Map(Object.entries(options.resolve ?? {}));
  const externalSet = new Set(options.external ?? []);

  return {
    name: 'stencil-virtual-modules',

    resolveId: {
      filter: { id: /^virtual:/ },
      handler(id: string) {
        if (externalSet.has(id)) return { id, external: true as const };
        return resolveMap.get(id) ?? null;
      },
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
      'jsx-runtime': 'src/jsx-runtime.ts',
      'compiler/index': 'src/compiler/index.ts',
      'compiler/utils/index': 'src/utils/compiler-exports.ts',
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
      neverBundle: true,
      // src imports its own public types via '@stencil/core'; keep those inlined, not externalized
      alwaysBundle: ['@stencil/core'],
    },
    define: defines,
    plugins: [virtualModules({ resolve: virtualResolve })],
    copy: [
      // Copy curated public types (paths resolve via declarations entry below)
      { from: 'src/index.d.mts', to: 'dist' },
      { from: 'src/jsx-runtime.d.mts', to: 'dist' },
    ],
  },

  // Testing (@stencil/core/testing - newSpecPage, mocks, etc.)
  // Separate build step: needs its own virtual:app-data/virtual:platform
  // mappings (testing BUILD conditionals + mock-doc platform), which would
  // otherwise be shared/clobbered by the main Node build above.
  {
    entry: {
      'testing/index': 'src/testing/index.ts',
    },
    outDir: 'dist',
    format: ['esm'],
    platform: 'node',
    target: nodeTarget,
    dts: true,
    clean: false,
    deps: {
      neverBundle: true,
      alwaysBundle: ['@stencil/core'],
    },
    define: defines,
    plugins: [
      virtualModules({
        resolve: {
          'virtual:app-data': resolve(__dirname, 'src/testing/app-data.ts'),
          'virtual:app-globals': resolve(__dirname, 'src/app-globals/index.ts'),
          'virtual:platform': resolve(__dirname, 'src/testing/platform/index.ts'),
        },
      }),
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
      neverBundle: true,
      alwaysBundle: ['@stencil/core'],
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
      neverBundle: true,
      alwaysBundle: ['@stencil/core'],
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
      neverBundle: true,
      alwaysBundle: ['@stencil/core'],
    },
    outputOptions: {
      paths: {
        'virtual:app-data': '@stencil/core/app-data',
        'virtual:app-globals': '@stencil/core/app-globals',
      },
    },
    plugins: [
      virtualModules({
        resolve: {
          'virtual:platform': resolve(__dirname, 'src/server/platform/index.ts'),
        },
        external: ['virtual:app-data', 'virtual:app-globals'],
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
        'virtual:app-data': '@stencil/core/app-data',
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
      'app-data/index': 'src/app-data/index.ts',
      'app-globals/index': 'src/app-globals/index.ts',
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

  // Browser build of the compiler's single-file transpiler (transpile/transpileSync,
  // createSystem, scopeCss). Built as its own entry, separate from the Node
  // compiler build above, so it never shares a chunk with `src/sys/node/` - the
  // CLI/dev-server/file-watcher machinery that entry pulls in has no browser
  // equivalent and isn't reachable from this entry's import graph anyway.
  //
  // `alias` swaps four specifiers for browser-safe stand-ins, all under
  // `src/compiler/sys/browser-stubs/` - no other source file changes. Each is
  // only reachable from a rarely-hit path for a browser caller (real on-disk
  // module resolution, CSS autoprefixing against *other* browsers), so the
  // stub versions either throw a clear error or gracefully no-op rather than
  // reimplementing the real behavior:
  //  - `../../sys/node` → the real one needs `@parcel/watcher`/`chalk`/worker
  //    threads; only used as a default when a caller doesn't supply their own
  //    `sys`/`logger`, which a browser caller always should.
  //  - `resolve` → real on-disk npm resolution; only reachable via
  //    `sys.resolveModuleId`, which `transpile()`/`transpileSync()` never call.
  //  - `lightningcss`/`browserslist` → native CSS engine for vendor-prefixing
  //    against *other* browsers, meaningless when the browser rendering the
  //    preview is the only target.
  {
    entry: {
      'compiler/browser': 'src/compiler/browser.ts',
    },
    outDir: 'dist',
    format: ['esm'],
    platform: 'browser',
    target: browserTargets,
    dts: true,
    clean: false,
    deps: {
      neverBundle: true,
      // `neverBundle: true` externalizes any npm-package-shaped specifier before
      // resolution runs, which would skip `alias` below entirely for these three -
      // force them through normal resolution so `alias` gets a chance to redirect
      // them to the browser stubs.
      alwaysBundle: ['@stencil/core', 'resolve', 'lightningcss', 'browserslist'],
    },
    define: defines,
    alias: {
      '../../sys/node': resolve(__dirname, 'src/compiler/sys/browser-stubs/sys-node.ts'),
      '../environment': resolve(__dirname, 'src/compiler/sys/browser-stubs/environment.ts'),
      resolve: resolve(__dirname, 'src/compiler/sys/browser-stubs/resolve.ts'),
      lightningcss: resolve(__dirname, 'src/compiler/sys/browser-stubs/lightningcss.ts'),
      browserslist: resolve(__dirname, 'src/compiler/sys/browser-stubs/browserslist.ts'),
    },
  },

  // @stencil/core/signals - public signals primitives + @Effect decorator
  {
    entry: {
      'signals/index': 'src/signals/index.ts',
    },
    outDir: 'dist',
    format: ['esm'],
    platform: 'neutral',
    target: browserTargets,
    dts: true,
    clean: false,
    deps: {
      // Bundle @preact/signals-core so consumers need no extra install
      neverBundle: [/^node:/],
    },
  },

  // Standalone client runtime (app-data/globals externalized for runtime swapping)
  {
    entry: {
      'runtime/client/runtime': 'src/client/index.ts',
    },
    outDir: 'dist',
    format: ['esm'],
    platform: 'browser',
    target: browserTargets,
    dts: true,
    clean: false,
    deps: {
      neverBundle: true,
      alwaysBundle: ['@stencil/core'],
    },
    outputOptions: {
      paths: {
        'virtual:app-data': '@stencil/core/app-data',
        'virtual:app-globals': '@stencil/core/app-globals',
      },
    },
    plugins: [
      virtualModules({
        resolve: {
          'virtual:platform': resolve(__dirname, 'src/client/index.ts'),
        },
        external: ['virtual:app-data', 'virtual:app-globals'],
      }),
    ],
  },

  // Lazy client runtime (app-data kept external but lazyLoad: true baked in via lazy.ts wrapper)
  {
    entry: {
      'runtime/client/lazy': 'src/client/index.ts',
    },
    outDir: 'dist',
    format: ['esm'],
    platform: 'browser',
    target: browserTargets,
    dts: false, // types identical to standalone
    clean: false,
    deps: {
      neverBundle: true,
    },
    outputOptions: {
      paths: {
        'virtual:app-globals': '@stencil/core/app-globals',
        'virtual:app-data-external': '@stencil/core/app-data',
      },
    },
    plugins: [
      virtualModules({
        resolve: {
          'virtual:platform': resolve(__dirname, 'src/client/index.ts'),
          // virtual:app-data → lazy.ts, which wraps virtual:app-data-external with lazyLoad: true
          'virtual:app-data': resolve(__dirname, 'src/app-data/lazy.ts'),
        },
        // virtual:app-data-external is the real app-data, kept external so consumers can alias it
        external: ['virtual:app-globals', 'virtual:app-data-external'],
      }),
    ],
  },
]);
