import type { PreserveEntrySignaturesOption } from 'rollup';
import type { SourceFile, TransformerFactory } from 'typescript';

import type { BuildConditionals } from '../../declarations';

/**
 * Options for bundled output passed on Rollup
 *
 * This covers the ID for the bundle, the platform it runs on, input modules,
 * and more
 */
export interface BundleOptions {
  id: string;
  conditionals?: BuildConditionals;
  /**
   * When `true`, all `@stencil/core/*` packages will be treated as external
   * and omitted from the generated bundle.
   */
  externalRuntime?: boolean;
  platform: 'client' | 'hydrate' | 'worker';
  /**
   * A collection of TypeScript transformation factories to apply during the "before" stage of the TypeScript
   * compilation pipeline (before built-in .js transformations)
   */
  customBeforeTransformers?: TransformerFactory<SourceFile>[];
  /**
   * This is equivalent to the Rollup `input` configuration option. It's
   * an object mapping names to entry points which tells Rollup to bundle
   * each thing up as a separate output chunk.
   *
   * @see {@link https://rollupjs.org/guide/en/#input}
   */
  inputs: { [entryKey: string]: string };
  /**
   * A map of strings which are passed to the Stencil-specific loader plugin
   * which we use to resolve the imports of Stencil project files when building
   * with Rollup.
   *
   * @see {@link loader-plugin:loaderPlugin}
   */
  loader?: { [id: string]: string };
  /**
   * Duplicate of Rollup's `inlineDynamicImports` output option.
   *
   * Creates dynamic imports (i.e. `import()` calls) as a part of the same
   * chunk being bundled. Rather than being created as separate chunks.
   *
   * @see {@link https://rollupjs.org/guide/en/#outputinlinedynamicimports}
   */
  inlineDynamicImports?: boolean;
  inlineWorkers?: boolean;
  /**
   * Duplicate of Rollup's `preserveEntrySignatures` option.
   *
   * "Controls if Rollup tries to ensure that entry chunks have the same
   * exports as the underlying entry module."
   *
   * @see {@link https://rollupjs.org/guide/en/#preserveentrysignatures}
   */
  preserveEntrySignatures?: PreserveEntrySignaturesOption;
}
