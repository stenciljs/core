import assert from 'node:assert';

import { run } from '@stencil/cli';
import { h } from '@stencil/core';
import { version } from '@stencil/core/compiler';
import { MockDocument } from '@stencil/core/mock-doc';
import { BUILD } from '@stencil/core/runtime/app-data';
import { createNodeLogger } from '@stencil/core/sys/node';
import { newSpecPage } from '@stencil/core/testing';

assert(typeof version === 'string');
version.slice();

assert(typeof h === 'function');
assert(typeof run, 'function');
run.call;

assert(typeof MockDocument === 'function');
assert(typeof BUILD !== 'undefined');
assert(typeof createNodeLogger === 'function');
assert(typeof newSpecPage === 'function');

console.log(`🎉 All ESM imports successfully resolved!`);
console.log('✅ passed!\n');
