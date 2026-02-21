const assert = require('node:assert');

const { version } = require('@stencil/core/compiler');
const { run } = require('@stencil/core/cli');
const { h } = require('@stencil/core');
const { MockDocument } = require('@stencil/core/mock-doc');
const appData = require('@stencil/core/internal/app-data');
const { createNodeLogger } = require('@stencil/core/sys/node');
const { createTesting } = require('@stencil/core/testing');
const preset = require('@stencil/core/testing/jest-preset');
const { ScreenshotLocalConnector } = require('@stencil/core/screenshot');

assert(typeof version === 'string');
assert(typeof run, 'function');
assert(typeof h === 'function');
assert(typeof MockDocument === 'function');
assert(Object.keys(appData).length === 3);
assert(typeof createNodeLogger === 'function');
assert(typeof createTesting === 'function');
assert(preset.moduleFileExtensions);
assert(ScreenshotLocalConnector);

console.log(`🎉 All CJS imports successfully resolved!`);
console.log('✅ passed!\n');
