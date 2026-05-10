#!/usr/bin/env node

// Checks a basic non-shadow component to ensure the bundle size is under 11KB (non-gzipped)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const distDir = path.join(__dirname, 'dist', 'loader-bundle', 'bundlesize-non-shadow');
const maxBundleSize = 21 * 1024; // 21KB in bytes

console.log('\nChecking bundle size (non-shadow)...');

const files = fs.readdirSync(distDir);
const indexFile = files.find(
  (file) => (file.startsWith('index-') || file.startsWith('client-')) && file.endsWith('.js'),
);

if (!indexFile) {
  console.error(
    '❌ ERROR: Could not find index-HASH.js file in dist/loader-bundle/bundlesize-non-shadow/',
  );
  process.exit(1);
}

const bundlePath = path.join(distDir, indexFile);
const stats = fs.statSync(bundlePath);
const bundleSize = stats.size;
const bundleSizeKB = (bundleSize / 1024).toFixed(2);
const maxSizeKB = (maxBundleSize / 1024).toFixed(2);

console.log(`Bundle: ${indexFile}`);
console.log(`Size: ${bundleSize} bytes (${bundleSizeKB} KB)`);
console.log(`Max allowed: ${maxSizeKB} KB`);

if (bundleSize >= maxBundleSize) {
  console.error(`\n❌ FAIL: Bundle size ${bundleSizeKB} KB exceeds maximum ${maxSizeKB} KB`);
  console.error('This indicates a regression - the runtime bundle has gotten larger.');
  process.exit(1);
}

if (maxBundleSize - bundleSize > 1) {
  console.log(
    `\n✅ PASS: Bundle size is under ${maxSizeKB} KB and has shrunk 🎉! Consider updating the maxBundleSize.`,
  );
} else {
  console.log(`\n✅ PASS: Bundle size is under ${maxSizeKB} KB`);
}
process.exit(0);
