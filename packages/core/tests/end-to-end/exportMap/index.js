/**
 * NOTE: v5 is pure ESM - CJS require() may not work.
 * This test validates that dynamic import() works from CJS context.
 */
const assert = require('node:assert');

async function testExports() {
  const { version } = await import('@stencil/core/compiler');
  const { run } = await import('@stencil/cli');
  const { h } = await import('@stencil/core');
  const { MockDocument } = await import('@stencil/core/mock-doc');
  const appData = await import('@stencil/core/runtime/app-data');
  const { createNodeLogger } = await import('@stencil/core/sys/node');
  const { newSpecPage } = await import('@stencil/core/testing');

  assert(typeof version === 'string');
  assert(typeof run, 'function');
  assert(typeof h === 'function');
  assert(typeof MockDocument === 'function');
  assert(typeof appData.BUILD !== 'undefined');
  assert(typeof createNodeLogger === 'function');
  assert(typeof newSpecPage === 'function');

  console.log(`🎉 All ESM imports successfully resolved from CJS context!`);
  console.log('✅ passed!\n');
}

testExports().catch((err) => {
  console.error('❌ Export map test failed:', err);
  process.exit(1);
});
