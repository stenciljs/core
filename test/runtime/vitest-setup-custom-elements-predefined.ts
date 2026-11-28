/// <reference types="@stencil/core" />
import './hydrated.css';
import { defineCustomElements, setNonce } from './dist/custom-elements-bundle/index.js';

setNonce('test-csp-nonce');

// Define every component up front (as framework wrappers do), before any test inserts its tree
defineCustomElements();

export {};
