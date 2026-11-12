import { MockWindow } from '@stencil/mock-doc';
import type * as d from '@stencil/core';

/**
 * This is a stub function that will be replaced during compilation with the actual
 * SSR factory function from the factory bundle.
 * @param win The window to use for SSR. This should be a patched window created by `patchDomImplementation`.
 * @param opts The options to use for SSR. This is used to configure which components should be hydrated, how long to wait for hydration, etc.
 * @param results The results object to store the hydration results.
 * @param afterSsr The callback to be called after SSR is complete.
 * @param resolve The resolve function to be called when SSR is complete.
 */
export function ssrFactory<DocOptions extends d.SerializeDocumentOptions>(
  win: MockWindow,
  opts: d.SsrDocumentOptions,
  results: d.SsrResults,
  afterSsr: (
    win: MockWindow,
    opts: DocOptions,
    results: d.SsrResults,
    resolve: (results: d.SsrResults) => void,
  ) => void,
  resolve: (results: d.SsrResults) => void,
) {
  // These statements prevent the parameters from being tree-shaken
  // The actual implementation is injected during the build process
  void win;
  void opts;
  void results;
  void afterSsr;
  void resolve;
}

/**
 * These are stub exports that will be replaced during compilation with the actual
 * tag transform functions from the factory bundle.
 */
export const setTagTransformer: d.TagTransformer = null as any;
export const transformTag: <T extends string>(tag: T) => T = null as any;
