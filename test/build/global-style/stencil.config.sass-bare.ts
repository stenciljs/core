import { Config } from '@stencil/core';
import { sass } from '@stencil/sass';

// Scenario "sass-bare": a bare stencil-* import in Sass - fails to compile, with a hint
export const config: Config = {
  namespace: 'globalstyle',
  plugins: [sass()],
  outputTargets: [
    { type: 'global-style', input: './styles/sass-bare/global.scss', fileName: 'global.css' },
    { type: 'loader-bundle' },
  ],
};
