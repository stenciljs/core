// Load lazy-loaded dist components

import { setNonce, defineCustomElements } from './dist/lazy/loader';

setNonce('test-csp-nonce');
await defineCustomElements();

export {};
