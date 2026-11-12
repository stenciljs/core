import './hydrated.css';
import { setRegistry, setNonce, defineCustomElements } from './dist/lazy/loader';
import { scerRegistry } from './src/scer/test-registry';

setNonce('test-csp-nonce');
setRegistry(scerRegistry);
await defineCustomElements();

export {};
