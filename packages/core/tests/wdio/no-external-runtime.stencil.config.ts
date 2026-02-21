import type { Config } from '../../internal/index.js';

export const config: Config = {
  namespace: 'TestNoExternalRuntimeApp',
  tsconfig: 'tsconfig-no-external-runtime.json',
  outputTargets: [
    {
      type: 'dist-custom-elements',
      dir: 'test-components-no-external-runtime',
      externalRuntime: false,
      includeGlobalScripts: false,
    },
  ],
  srcDir: 'no-external-runtime',
};
