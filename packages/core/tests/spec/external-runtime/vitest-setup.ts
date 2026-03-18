// Import defineCustomElement from the built output - this tests that
// the external runtime imports are correctly resolved by vite

import { defineCustomElement } from './dist/custom-elements/form-associated-external.js';

defineCustomElement();