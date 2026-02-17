import { beforeEach } from 'vitest';
import { setupGlobal } from './src';

// Set up mock-doc globals so that Event, CustomEvent, etc. use MockEvent, MockCustomEvent
setupGlobal(globalThis || global || {});
window.location.href = `http://testing.stenciljs.com/`;

// Reset document body between tests
beforeEach(() => {
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});