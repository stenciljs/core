#!/usr/bin/env node
/**
 * Build Benchmark
 *
 * Measures compile time for the integration test project.
 * Uses build/integration as the benchmark fixture.
 */

import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const integrationDir = join(__dirname, '../../build/e2e');
const verbose = process.argv.includes('--verbose');

console.log('Build Benchmark');
console.log('================');
console.log(`Fixture: build/e2e`);
console.log('');

// Clean previous build
console.log('Cleaning previous build...');
execSync('rm -rf www dist hydrate', { cwd: integrationDir, stdio: verbose ? 'inherit' : 'pipe' });

// Run benchmark
console.log('Running build...');
const startTime = performance.now();

try {
  execSync('npx stencil build', {
    cwd: integrationDir,
    stdio: verbose ? 'inherit' : 'pipe',
    env: { ...process.env, CI: 'true' }
  });
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}

const endTime = performance.now();
const duration = ((endTime - startTime) / 1000).toFixed(2);

console.log('');
console.log('Results');
console.log('-------');
console.log(`Build time: ${duration}s`);
console.log('');

// Output in a format that can be parsed by CI
console.log(`BENCHMARK_RESULT: build_time=${duration}s`);
