import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'docs-readme-testbed',
  outputTargets: [
    {
      type: 'docs-readme',
    },
    {
      type: 'dist',
    },
    {
      type: 'docs-readme',
      dir: 'custom-readme-output',
    },
    {
      type: 'docs-readme',
      dir: 'custom-readme-output-overwrite',
      overwriteExisting: true,
    },
    {
      type: 'docs-readme',
      dir: 'custom-readme-output-overwrite-if-missing-missing',
      overwriteExisting: 'if-missing',
    },
    {
      type: 'docs-readme',
      dir: 'custom-readme-output-overwrite-if-missing-not-missing',
      overwriteExisting: 'if-missing',
    },
    {
      type: 'docs-readme',
      dir: 'custom-readme-output-overwrite-never',
      overwriteExisting: false,
    },
  ],
};
