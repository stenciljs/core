import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { originalPositionFor, TraceMap } from '@jridgewell/trace-mapping';

/**
 * Builds the fixture in prod and dev mode and checks every emitted `.js` file's source map:
 * - exactly one `sourceMappingURL` comment, pointing at a map that exists
 * - the map's `file` names the `.js` file
 * - every entry in `sources` resolves (from the map's own location) to a file on disk, or is
 *   one of Stencil's virtual modules (their text is in `sourcesContent`)
 * - each `marker-*` string maps back to the file (and, outside the collection, the line) it was
 *   written on
 * Re-export shims and the collection's generated `app-data.js` are expected to have no map.
 */

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const stencilCli = path.resolve(
  __dirname,
  'node_modules',
  '@stencil',
  'core',
  'bin',
  'stencil.mjs',
);

const OUTPUT_DIRS = ['dist/loader-bundle', 'dist/standalone', 'dist/collection', 'www/build'];

const MARKERS = {
  'marker-cmp-a': 'src/components/cmp-a/cmp-a.tsx',
  'marker-cmp-b': 'src/components/cmp-b/cmp-b.tsx',
  'marker-cmp-c': 'src/components/cmp-c/cmp-c.tsx',
  'marker-format': 'src/utils/format.ts',
};

// generated modules with no file on disk
const VIRTUAL_SOURCES = new Set([
  '@stencil/core/app-data',
  '@stencil/core/app-globals',
  '@user-index-entrypoint',
  '@lazy-browser-entrypoint',
  '@lazy-external-entrypoint',
]);

// standalone chunks with no code from a source file (`cmp-b.js` re-exports the shared `cmp-b2.js`,
// `index.js` the runtime); Rolldown may give them no map, so a map isn't required
const GENERATED = new Set([
  'dist/standalone/index.js',
  'dist/standalone/loader.js',
  'dist/standalone/cmp-b.js',
]);

const SOURCE_MAPPING_URL = /^\/\/# sourceMappingURL=(\S+)\s*$/gm;
// files that only re-export another module, e.g. `export * from './esm/index.js';`
const SHIM = /^(?:\s*(?:import '[^']+';|export \* from '[^']+';))+\s*$/;

const collectFiles = (dir, filter) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectFiles(fullPath, filter);
    return filter(entry.name) ? [fullPath] : [];
  });

const rel = (p) => path.relative(__dirname, p);

/**
 * @param {string} source the original source text
 * @param {string} marker the marker string
 * @returns {number} the 1-based line the marker is written on
 */
const markerLine = (source, marker) => source.slice(0, source.indexOf(marker)).split('\n').length;

/**
 * @param {string} jsFile the emitted file to check
 * @returns {string[]} the problems found
 */
const checkFile = (jsFile) => {
  const code = fs.readFileSync(jsFile, 'utf-8');
  const comments = [...code.matchAll(SOURCE_MAPPING_URL)].map((m) => m[1]);
  const isCollection = rel(jsFile).startsWith(`dist${path.sep}collection`);

  if (SHIM.test(code) || (isCollection && path.basename(jsFile) === 'app-data.js')) {
    return comments.length ? ['unexpected sourceMappingURL comment'] : [];
  }
  if (comments.length === 0) {
    return GENERATED.has(rel(jsFile).split(path.sep).join('/'))
      ? []
      : ['no sourceMappingURL comment'];
  }

  const problems = [];
  if (comments.length > 1) {
    problems.push(`${comments.length} sourceMappingURL comments: ${comments.join(', ')}`);
  }

  const mapFile = path.resolve(path.dirname(jsFile), comments[comments.length - 1]);
  if (!fs.existsSync(mapFile)) return [...problems, `map not found: ${rel(mapFile)}`];

  const map = JSON.parse(fs.readFileSync(mapFile, 'utf-8'));
  if (map.file !== path.basename(jsFile)) problems.push(`map "file" is ${map.file}`);

  const mapDir = path.resolve(path.dirname(mapFile), map.sourceRoot ?? '');
  for (const source of map.sources) {
    if (!VIRTUAL_SOURCES.has(source) && !fs.existsSync(path.resolve(mapDir, source))) {
      problems.push(`unresolved source: ${source}`);
    }
  }

  const tracer = new TraceMap(map, mapFile);
  const lines = code.split('\n');
  for (const [marker, srcFile] of Object.entries(MARKERS)) {
    const lineIndex = lines.findIndex((l) => l.includes(marker));
    if (lineIndex === -1) continue;
    // the string / template literal token starts at its opening quote
    const column = lines[lineIndex].indexOf(marker) - 1;
    const pos = originalPositionFor(tracer, { line: lineIndex + 1, column });
    const expectedFile = path.resolve(__dirname, srcFile);
    const expectedLine = markerLine(fs.readFileSync(expectedFile, 'utf-8'), marker);
    const actualFile = pos.source && path.resolve(mapDir, pos.source);
    // the collection's maps come from TypeScript's emit, which maps JSX children to the
    // enclosing statement, so only the file is checked there
    const lineMatches = isCollection || pos.line === expectedLine;
    if (actualFile !== expectedFile || !lineMatches) {
      problems.push(
        `${marker} maps to ${actualFile ? rel(actualFile) : 'nothing'}:${pos.line ?? '?'} (expected ${srcFile}:${expectedLine})`,
      );
    }
  }
  return problems;
};

const build = (dev) => {
  fs.rmSync(path.join(__dirname, 'dist'), { recursive: true, force: true });
  fs.rmSync(path.join(__dirname, 'www'), { recursive: true, force: true });
  const args = [stencilCli, 'build', ...(dev ? ['--dev'] : [])];
  const result = spawnSync(process.execPath, args, { cwd: __dirname, encoding: 'utf-8' });
  if (result.status !== 0) {
    console.error(result.stdout, result.stderr);
    throw new Error(`stencil build ${dev ? '--dev ' : ''}failed`);
  }
};

let failures = 0;
for (const dev of [false, true]) {
  build(dev);
  console.log(`\n=== ${dev ? 'dev' : 'prod'} build ===`);
  for (const dir of OUTPUT_DIRS) {
    const absDir = path.join(__dirname, dir);
    const jsFiles = fs.existsSync(absDir) ? collectFiles(absDir, (n) => n.endsWith('.js')) : [];
    if (!jsFiles.length) {
      console.log(`✗ ${dir}: no .js output`);
      failures++;
      continue;
    }
    for (const jsFile of jsFiles) {
      const problems = checkFile(jsFile);
      failures += problems.length;
      console.log(`${problems.length ? '✗' : '✓'} ${rel(jsFile)}`);
      problems.forEach((p) => console.log(`    ${p}`));
    }
  }
}

if (failures) {
  console.error(`\n${failures} source map problem(s)`);
  process.exit(1);
}
console.log('\n✅ source maps valid');
