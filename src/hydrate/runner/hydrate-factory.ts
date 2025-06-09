import { MockWindow } from '@stencil/core/mock-doc';

import type * as d from '../../declarations';

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
  win;
  opts;
  results;
  afterHydrate;
  resolve;
}
