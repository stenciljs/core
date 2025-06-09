// this imports the build from the `./test-sibling` project. The ability to use
// a Stencil component defined in that 'sibling' project is tested in the
// `stencil-sibling` test suite
import '@test-sibling';
import { setMode } from '@stencil/core';

const globalScript = () => {
  setMode((elm) => {
    return (elm as any).colormode || elm.getAttribute('colormode');
  });
};

export default globalScript;
