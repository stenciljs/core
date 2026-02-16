import { setupGlobal } from '@stencil/mock-doc';

// When running in vitest with a custom environment (like 'stencil'), the environment
// sets up the window before any test code imports. Try and use use that 

const isVitestEnvironment = typeof process !== 'undefined' && process.env?.VITEST;
const existingWindow = typeof globalThis !== 'undefined' && globalThis.window;

export const win = (isVitestEnvironment && existingWindow) 
  ? existingWindow 
  : setupGlobal(global) as Window;
