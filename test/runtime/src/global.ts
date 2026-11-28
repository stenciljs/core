import { setupApp } from './index';

declare global {
  interface Window {
    __globalScriptTimestamp?: number;
  }
}

const globalScript = () => {
  // Track when global script runs for testing
  window.__globalScriptTimestamp = Date.now();
  setupApp();
};

// A simple type sanity check that Stencil elements are compatible with HTMLElements.
// Export so it doesn't get tree-shaken away.
export let thing: null | HTMLElement = globalThis.document ? document.createElement('div') : null;

export default globalScript;
