#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const distDir = path.join(__dirname, 'dist', 'bundlesize');
const maxBundleSize = 8 * 1024; // 9KB in bytes

console.log('\nChecking bundle size...');

// Find the index-HASH.js file
const files = fs.readdirSync(distDir);
const indexFile = files.find((file) => file.startsWith('index-') && file.endsWith('.js'));

if (!indexFile) {
  console.error('❌ ERROR: Could not find index-HASH.js file in dist/bundlesize/');
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

console.log(`\n✅ PASS: Bundle size is under ${maxSizeKB} KB`);
process.exit(0);
