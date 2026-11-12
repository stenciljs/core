import { less } from '@stencil-community/less';
import { Config } from '@stencil/core';

// Scenario "less-bare": a bare stencil-* import in Less - fails to compile, with a hint
export const config: Config = {
  namespace: 'globalstyle',
  plugins: [less()],
  outputTargets: [
    { type: 'global-style', input: './styles/less-bare/global.less', fileName: 'global.css' },
    { type: 'loader-bundle' },
  ],
};
