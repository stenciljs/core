import type * as d from '@stencil/core';

import { join } from '../../utils';

export const getClientPolyfill = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  polyfillFile: string,
) => {
  const polyfillFilePath = join(
    config.sys.getCompilerExecutingPath(),
    '..',
    '..',
    'internal',
    'client',
    'polyfills',
    polyfillFile,
  );
  return compilerCtx.fs.readFile(polyfillFilePath);
};
