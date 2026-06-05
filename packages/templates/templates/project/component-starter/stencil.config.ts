import type { Config } from '@stencil/core';

export const config: Config = {
  namespace: '{{NAMESPACE}}',
  outputTargets: [
    { type: 'loader-bundle' },
    { type: 'types' },
  ],
};
