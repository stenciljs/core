import './hydrated.css';
import * as ce from './dist/custom-elements/index.js';

ce.setNonce('test-csp-nonce');

// Load bundled custom elements via autoloader
await import('./dist/custom-elements/loader.js');

export {};
