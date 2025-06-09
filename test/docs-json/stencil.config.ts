import { Config } from '@stencil/core';
export const config: Config = {
  namespace: 'json-docs-testbed',
  outputTargets: [
    {
      // needed to generate additional doc-metadata for styles, as the `ext-transform-plugin` does not run solely when
      // 'docs-json' is run
      type: 'dist-custom-elements',
    },
    {
      type: 'docs-json',
      file: 'docs.json',
      supplementalPublicTypes: 'src/components/interfaces.ts',
    },
  ],
};
