import { setupApp } from './index';

// this imports the build from the `./test-sibling` project. The ability to use
// a Stencil component defined in that 'sibling' project is tested in the
// `stencil-sibling` test suite
// import 'test-sibling';

const globalScript = () => {
  setupApp();
};

// A simple type sanity check that Stencil elements are compatible with HTMLElements. 
// Export so it doesn't get tree-shaken away.
export let thing: null | HTMLElement = globalThis.document ? document.createElement('div') : null;

export default globalScript;
