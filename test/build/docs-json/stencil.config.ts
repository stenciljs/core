import { Config } from '@stencil/core';
export const config: Config = {
  namespace: 'json-docs-testbed',
  generateExportMaps: true,
  outputTargets: [
    { type: 'standalone' },
    {
      type: 'docs-json',
      file: 'docs.json',
      supplementalPublicTypes: 'src/components/interfaces.ts',
    },
    {
      type: 'docs-custom-elements-manifest',
      file: 'custom-elements-manifest.json',
    },
    {
      type: 'docs-custom-elements-manifest',
    },
  ],
};
