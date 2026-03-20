import { setMode } from '@stencil/core';
import { setupApp } from './index';

// this imports the build from the `../sibling` project. The ability to use
// a Stencil component defined in that 'sibling' project is tested in the
// `stencil-sibling` test suite
import 'sibling-spec';

declare global {
  interface Window {
    __globalScriptTimestamp?: number;
  }
}

const globalScript = () => {
  // Track when global script runs for testing
  window.__globalScriptTimestamp = Date.now();
  setupApp();

  // Set up mode resolution for style-mode tests
  // Mode is determined by: element's mode prop/attr > document mode attr > default 'buford'
  setMode((elm: any) => elm.mode || elm.getAttribute('mode') || document.documentElement.getAttribute('mode') || 'buford');
};

// A simple type sanity check that Stencil elements are compatible with HTMLElements. 
// Export so it doesn't get tree-shaken away.
export let thing: null | HTMLElement = globalThis.document ? document.createElement('div') : null;

export default globalScript;
