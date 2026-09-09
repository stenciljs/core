import type { ConfigCompat, StencilConfig, TranspileOptions } from '@stencil/core/compiler';

type TranspileCompatKeys = 'lightDomPatches' | 'lifecycleDOMEvents' | 'initializeNextTick';

/**
 * The subset of `stencil.config.ts` fields that affect transpilation.
 * Derived from {@link StencilConfig} and {@link ConfigCompat} — no parallel docs to maintain.
 *
 * Auto-populated from the project's `stencil.config.ts`; values set here override the auto-detected ones.
 */
export type StencilConfigSubset = Pick<StencilConfig, 'signalBacking'> & {
  compat?: Pick<ConfigCompat, TranspileCompatKeys>;
};

export interface StencilPluginOptions {
  /**
   * Additional options forwarded to `transpileSync` for every `.tsx`/`.ts` file.
   * `file`, `resolveImport`, `styleImportData`, `componentExport`, `componentMetadata`,
   * and `coreImportPath` are managed by the plugin and should not be set here.
   */
  transpileOptions?: Omit<
    TranspileOptions,
    | 'file'
    | 'resolveImport'
    | 'styleImportData'
    | 'componentExport'
    | 'componentMetadata'
    | 'coreImportPath'
  >;

  /**
   * `'build'` (default) transpiles components into self-registering custom
   * elements for a real bundler/DOM - the output used by `stencilVite`,
   * `stencilRollup`, etc.
   *
   * `'spec-page'` transpiles components for use with `newSpecPage()` from
   * `@stencil/core/testing`: no self-registration, static `COMPILER_META`
   * for the mock-doc registry instead. Also redirects any bare `@stencil/core`
   * import to `@stencil/core/testing`, so a test file that (mistakenly) imports
   * e.g. `setMode` from `@stencil/core` still shares the one platform instance
   * instead of silently getting a disconnected copy. Use `stencilSpecPage`
   * rather than setting this directly.
   */
  mode?: 'build' | 'spec-page';

  /**
   * Glob patterns (relative to the project root) for files to include.
   * Defaults to `['**\/*.tsx']`.
   */
  include?: string[];

  /**
   * Glob patterns to exclude. Defaults to `['node_modules/**']`.
   */
  exclude?: string[];

  /**
   * Enable HMR client code injection. Automatically `true` in Vite dev mode
   * (`command === 'serve'`). For webpack/rspack, set this explicitly when
   * running with `webpack-dev-server` or `@rspack/dev-server`.
   */
  dev?: boolean;

  /**
   * When `true`, the plugin scans all component source files at build start and
   * accumulates per-component `JsonDocsComponent` metadata. The aggregate is
   * exposed via the `@stencil/unplugin/docs` virtual module and the
   * `getStencilDocs()` helper.
   *
   * Off by default — opt in only when you need docs output (e.g. in a Storybook
   * preset) to avoid paying the startup scan cost for non-docs builds.
   */
  docs?: boolean;

  /**
   * Stencil config flags that affect transpilation. The plugin automatically
   * detects and reads `stencil.config.ts` from the project root — set this only
   * to override specific values from the auto-detected config.
   *
   * Precedence (highest wins):
   *   `transpileOptions.buildOverrides` > `stencilConfig` > auto-detected config
   */
  stencilConfig?: StencilConfigSubset;
}
