import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'agent-skill-testbed',
  outputTargets: [
    {
      type: 'standalone',
    },
    {
      type: 'docs-agent-skill',
      dir: 'skill',
    },
  ],
};
