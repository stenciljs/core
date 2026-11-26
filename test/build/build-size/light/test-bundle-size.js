#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const distDir = path.join(__dirname, 'dist', 'loader-bundle', 'bundlesize-non-shadow');
const maxGzipSize = 8 * 1024 + 768; // 8.75KB;

console.log('\nChecking bundle size (non-shadow)...');

const files = fs.readdirSync(distDir);
const indexFile = files.find(
  (file) => (file.startsWith('runtime-') || file.startsWith('client-')) && file.endsWith('.js'),
);

if (!indexFile) {
  console.error(
    '❌ ERROR: Could not find runtime-HASH.js file in dist/loader-bundle/bundlesize-non-shadow/',
  );
  process.exit(1);
}

const bundle = fs.readFileSync(path.join(distDir, indexFile));
const gzipSize = gzipSync(bundle).length;
const kb = (bytes) => `${(bytes / 1024).toFixed(2)} KB`;

console.log(`Bundle: ${indexFile}`);
console.log(`Size: ${kb(gzipSize)} gzipped (${gzipSize} bytes; ${kb(bundle.length)} minified)`);
console.log(`Max allowed: ${kb(maxGzipSize)} gzipped`);

if (gzipSize > maxGzipSize) {
  console.error(
    `\n❌ FAIL: Bundle size ${kb(gzipSize)} exceeds maximum ${kb(maxGzipSize)} (gzipped)`,
  );
  console.error('This indicates a regression - the runtime bundle has gotten larger.');
  process.exit(1);
}

if (maxGzipSize - gzipSize > 512) {
  console.log(
    `\n✅ PASS: Bundle size is under ${kb(maxGzipSize)} and has shrunk 🎉! Consider updating maxGzipSize.`,
  );
} else {
  console.log(`\n✅ PASS: Bundle size is under ${kb(maxGzipSize)}`);
}
process.exit(0);
