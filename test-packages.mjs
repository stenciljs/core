/**
 * Quick test to verify the built packages work
 */

import { createRequire } from 'module';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('🧪 Testing built packages...\n');

// Test mock-doc
console.log('📦 Testing @stencil/mock-doc...');
try {
  const mockDoc = await import('./packages/mock-doc/dist/index.js');
  if (typeof mockDoc.MockWindow === 'function') {
    const win = new mockDoc.MockWindow();
    console.log('   ✅ MockWindow constructor works');
    console.log(`   ✅ window.location.href = "${win.location.href}"`);
  } else {
    console.log('   ❌ MockWindow not found');
  }
} catch (error) {
  console.log('   ❌ Import failed:', error.message);
}

// Test core compiler
console.log('\n📦 Testing @stencil/core (compiler)...');
try {
  const core = await import('./packages/core/dist/index.js');
  console.log('   ✅ Core imported successfully');
  console.log(`   ✅ Exports: ${Object.keys(core).slice(0, 5).join(', ')}...`);
  if (typeof core.transpile === 'function') {
    console.log('   ✅ transpile() function available');
  }
} catch (error) {
  console.log('   ❌ Import failed:', error.message);
}

// Test core runtime
console.log('\n📦 Testing @stencil/core/runtime...');
try {
  const runtime = await import('./packages/core/dist/runtime/index.js');
  console.log('   ✅ Runtime imported successfully');
  console.log(`   ✅ Exports: ${Object.keys(runtime).slice(0, 5).join(', ')}...`);
} catch (error) {
  console.log('   ❌ Import failed:', error.message);
}

// Test core client runtime
console.log('\n📦 Testing @stencil/core/runtime/client...');
try {
  const client = await import('./packages/core/dist/runtime/client/index.js');
  console.log('   ✅ Client runtime imported successfully');
  console.log(`   ✅ Exports: ${Object.keys(client).slice(0, 5).join(', ')}...`);
} catch (error) {
  console.log('   ❌ Import failed:', error.message);
}

// Test CLI
console.log('\n📦 Testing @stencil/cli...');
try {
  const cli = await import('./packages/cli/dist/index.js');
  console.log('   ✅ CLI imported successfully');
  console.log(`   ✅ Exports: ${Object.keys(cli).join(', ')}`);
} catch (error) {
  console.log('   ❌ Import failed:', error.message);
}

console.log('\n✨ Package tests complete!');
