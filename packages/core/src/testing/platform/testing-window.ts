import { setupGlobal } from '@stencil/mock-doc';

// When running in vitest with a custom environment (like 'stencil'), the environment
// sets up the window before any test code imports. We should use that existing window
// instead of calling setupGlobal again, which would overwrite Event constructors and
// cause conflicts with vitest/chai plugins.
//
// Check for both:
// 1. An existing window on globalThis
// 2. Vitest-specific markers (vitest injects these during test runs)
// @ts-ignore - process.env may not exist in all contexts
const isVitestEnvironment = typeof process !== 'undefined' && process.env?.VITEST;
// @ts-ignore
const existingWindow = typeof globalThis !== 'undefined' && globalThis.window;

export const win = (isVitestEnvironment && existingWindow) 
  ? existingWindow 
  : setupGlobal(global) as Window;
