// Import defineCustomElement from the built output - this tests that
// the external runtime imports are correctly resolved by vite

import { defineCustomElement as defineFormAssociated } from './dist/custom-elements/form-associated-external.js';
import { defineCustomElement as defineNonShadow } from './dist/custom-elements/non-shadow.js';

defineFormAssociated();
defineNonShadow();
