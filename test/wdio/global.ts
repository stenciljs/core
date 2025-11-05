// this imports the build from the `./test-sibling` project. The ability to use
// a Stencil component defined in that 'sibling' project is tested in the
// `stencil-sibling` test suite
import 'test-sibling';
import { setMode } from '@stencil/core';

// @ts-ignore - this should produce a warning but not cause the build to fail
import { setAssetPath } from '@stencil/core/internal/client/index';

// this doesn't do anything - just stops rollup removing the import
setAssetPath('/base/path');

export let thing: HTMLElement = globalThis.document ? document.createElement('div') : null;

const globalScript = () => {
  setMode((elm) => {
    // this should be valid as HTMLElement and HTMLStencilElement should be compatible
    thing = elm as HTMLAttributeBasicElement;
    return (elm as any).colormode || elm.getAttribute('colormode');
  });
};

export default globalScript;
