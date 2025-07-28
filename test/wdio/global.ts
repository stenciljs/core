// this imports the build from the `./test-sibling` project. The ability to use
// a Stencil component defined in that 'sibling' project is tested in the
// `stencil-sibling` test suite
import '@test-sibling';
import { setMode } from '@stencil/core';
// @ts-expect-error - tests that rollup warnings don't break the build
import { setAssetPath } from '@stencil/core/internal/client/index';

const globalScript = () => {
  setMode((elm) => {
    return (elm as any).colormode || elm.getAttribute('colormode');
  });
};

// this doesn't do anything - just stops rollup removing the import
setAssetPath('/base/path');

export default globalScript;
