import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const docsJsonOutputFilePath = path.join('.', 'docs.json');
const docsDtsOutputFilePath = path.join('.', 'docs.d.ts');

const docsJsonContents = JSON.parse(fs.readFileSync(docsJsonOutputFilePath));

// these two fields will vary given the machine and so on that the application
// is built on, so we need to just delete them
delete docsJsonContents['timestamp'];
delete docsJsonContents['compiler'];

// then rewrite the file, indenting the JSON for easy reading.
fs.writeFileSync(docsJsonOutputFilePath, JSON.stringify(docsJsonContents, null, 2) + '\n');

// Regression test: Ensure docs.d.ts is self-contained and doesn't import from hashed chunks
// This was a bug introduced when switching from rollup to rolldown where the declaration
// file would import from hashed chunk files with mangled export names like:
// import { $n as JsonDocsValue, ... } from "../stencil-public-compiler-sgW8XnY-.js";
const docsDtsContents = fs.readFileSync(docsDtsOutputFilePath, 'utf-8');

// Check for imports from hashed chunk files (pattern: filename with hash followed by .js)
// Example bad import: from "../stencil-public-compiler-sgW8XnY-.js"
const hashedImportPattern = /^import\s+.*from\s+["'][^"']*-[A-Za-z0-9_-]{6,}[-.].*["']/m;
if (hashedImportPattern.test(docsDtsContents)) {
  console.error('ERROR: docs.d.ts contains imports from hashed chunk files!');
  console.error('This indicates a regression in declaration file generation.');
  console.error('The file should be self-contained without external imports.');
  process.exit(1);
}

// Check for mangled export names in import statements (e.g., `$n as JsonDocsValue`)
// Only check actual import lines, not JSDoc comments
const lines = docsDtsContents.split('\n');
for (const line of lines) {
  // Skip if not an import statement
  if (!line.trim().startsWith('import')) continue;

  // Check for short mangled names like $n, Bn, etc. being aliased
  const mangledPattern = /\{\s*[A-Z]?[$a-z]\w?\s+as\s+\w+/;
  if (mangledPattern.test(line)) {
    console.error('❌ ERROR: docs.d.ts contains mangled export names in imports!');
    console.error(`Line: ${line}`);
    console.error('This indicates a regression in declaration file generation.');
    process.exit(1);
  }
}

// Verify that key types are defined (not just referenced)
const requiredTypes = [
  'interface JsonDocs',
  'interface JsonDocsComponent',
  'interface JsonDocsProp',
  'interface JsonDocsEvent',
];
for (const typeDef of requiredTypes) {
  if (!docsDtsContents.includes(typeDef)) {
    console.error(`❌ ERROR: docs.d.ts is missing required type definition: ${typeDef}`);
    process.exit(1);
  }
}

console.log('✅ docs.d.ts validation passed: file is self-contained with proper type definitions');

// A `docs-custom-elements-manifest` output without a `file` is written to dist/
const defaultManifestPath = path.join('.', 'dist', 'custom-elements.json');
if (!fs.existsSync(defaultManifestPath)) {
  console.error(`❌ ERROR: ${defaultManifestPath} was not generated`);
  process.exit(1);
}

// package.json "customElements" points at the first configured manifest
const { customElements } = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
if (customElements !== 'custom-elements-manifest.json') {
  console.error(`❌ ERROR: package.json "customElements" is "${customElements}"`);
  process.exit(1);
}

// every configured manifest gets the same content
if (fs.readFileSync(defaultManifestPath, 'utf-8') !== fs.readFileSync(customElements, 'utf-8')) {
  console.error(`❌ ERROR: ${defaultManifestPath} differs from ${customElements}`);
  process.exit(1);
}

// the generated export map makes the manifest and package.json resolvable by specifier
// (resolved through the package's own name, which only works via `exports`)
const { name } = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
const resolvesTo = { 'custom-elements.json': customElements, 'package.json': 'package.json' };
for (const [subpath, expected] of Object.entries(resolvesTo)) {
  const resolved = fileURLToPath(import.meta.resolve(`${name}/${subpath}`));
  if (resolved !== path.resolve(expected)) {
    console.error(`❌ ERROR: "${name}/${subpath}" resolved to ${resolved}, expected ${expected}`);
    process.exit(1);
  }
}

console.log('✅ custom elements manifest validation passed');
