import assert from 'node:assert';

import { AttributeBasicRoot, defineCustomElement } from './test-components/attribute-basic-root.js';

console.log(`🧪 Validate capability to import Stencil dist-custom-elements output target`);
assert.equal(typeof AttributeBasicRoot, 'function');
assert.equal(typeof defineCustomElement, 'function');
console.log(`✅  Success!`);

