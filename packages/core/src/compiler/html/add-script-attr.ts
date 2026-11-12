import type * as d from '@stencil/core';

import { join } from '../../utils';
import { getAbsoluteBuildDir } from './html-utils';

export const addScriptDataAttribute = (
  config: d.ValidatedConfig,
  doc: Document,
  outputTarget: d.OutputTargetWww,
) => {
  const resourcesUrl = getAbsoluteBuildDir(outputTarget);
  // `.esm.js` is the backwards-compat shim re-exporting the `.js` entry
  const expectedSrcs = [`${config.fsNamespace}.js`, `${config.fsNamespace}.esm.js`].map((f) =>
    join(resourcesUrl, f),
  );

  doc.querySelectorAll('script').forEach((script) => {
    if (expectedSrcs.includes(script.getAttribute('src'))) {
      script.setAttribute('data-stencil', '');
    }
  });
};
