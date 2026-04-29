import { MockWindow } from '@stencil/mock-doc';
import type * as d from '@stencil/core';

export function hydrateFactory<DocOptions extends d.SerializeDocumentOptions>(
  win: MockWindow,
  opts: d.HydrateDocumentOptions,
  results: d.HydrateResults,
  afterHydrate: (
    win: MockWindow,
    opts: DocOptions,
    results: d.HydrateResults,
    resolve: (results: d.HydrateResults) => void,
  ) => void,
  resolve: (results: d.HydrateResults) => void,
) {
  // These statements prevent the parameters from being tree-shaken
  // The actual implementation is injected during the build process
  void win;
  void opts;
  void results;
  void afterHydrate;
  void resolve;
}

/**
 * These are stub exports that will be replaced during compilation with the actual
 * tag transform functions from the factory bundle.
 */
export const setTagTransformer: d.TagTransformer = null as any;
export const transformTag: <T extends string>(tag: T) => T = null as any;
