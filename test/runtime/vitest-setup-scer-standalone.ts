/// <reference types="@stencil/core" />
import './hydrated.css';
import { setNonce, setRegistry } from './dist/custom-elements/';
import { scerRegistry } from './src/scer/test-registry';

setNonce('test-csp-nonce');
setRegistry(scerRegistry);

// Load bundled custom elements via autoloader
await import('./dist/custom-elements/loader.js');

export {};
