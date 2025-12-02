// this imports the build from the `./test-sibling` project. The ability to use
// a Stencil component defined in that 'sibling' project is tested in the
// `stencil-sibling` test suite
import 'test-sibling';
import { setMode, setTagTransformer } from '@stencil/core';
import tagTransformer from './tag-transform/tag-transformer.js';

// @ts-ignore - this should produce a warning but not cause the build to fail
import { setAssetPath } from '@stencil/core/internal/client/index';

// this doesn't do anything - just stops rollup removing the import
setAssetPath('/base/path');

// this is for `dist-custom-elements` output target tests - needs to be set early,
// but doesn't get called at all in `dist` :/
setTagTransformer(tagTransformer);

const globalScript = () => {
  // this is primarily for `dist` output target tests
  // gets called too late for `dist-custom-elements` style map registration
  setTagTransformer(tagTransformer);

  setMode((elm) => {
    // this should be valid as HTMLElement and HTMLStencilElement should be compatible
    thing = elm as HTMLAttributeBasicElement;
    return (elm as any).colormode || elm.getAttribute('colormode');
  });
};

export let thing: HTMLElement = globalThis.document ? document.createElement('div') : null;
export default globalScript;
