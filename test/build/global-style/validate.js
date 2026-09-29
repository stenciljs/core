import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';

/**
 * Builds the fixture once per scenario (`stencil.config.ts` is "explicit", every other scenario
 * is `stencil.config.<scenario>.ts`) and checks where the stencil-* virtual imports' CSS lands:
 * explicitly placed, auto-placed (0 / 1 / several global-style outputs) and through Sass, Less
 * and PostCSS.
 */

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, 'dist');
// the CLI script itself, run with this Node - `.bin/stencil` is a `.cmd` shim on Windows, which
// spawnSync can't execute without a shell
const stencilCli = path.resolve(
  __dirname,
  'node_modules',
  '@stencil',
  'core',
  'bin',
  'stencil.mjs',
);

// How each virtual import's CSS appears in minified output
const HYDRATE = /cmp-a,cmp-b\{visibility:hidden\}/g;
const GLOBALS = /cmp-b\{display:inline-block\}/g;
const CSS_ONLY = /css-badge\[variant=['"]?danger['"]?\]/g;
const VIRTUAL_IMPORT = /stencil-(?:hydrate|component-globals|css-components)/;
// bootstrap-loader's runtime FOUC injection - absent once `@import "stencil-hydrate"` is detected
const RUNTIME_HYDRATE = 'visibility:inherit';

const count = (css, re) => (css.match(re) ?? []).length;
const readAsset = (fileName) => fs.readFile(path.join(distDir, 'assets', fileName), 'utf-8');
const exists = (filePath) =>
  fs.access(filePath).then(
    () => true,
    () => false,
  );

/**
 * Recursively collect files under `dir` matching `filter`.
 * @param {string} dir directory to search
 * @param {(fileName: string) => boolean} filter predicate applied to each file name
 * @returns {Promise<string[]>} absolute paths of matching files
 */
async function collectFiles(dir, filter) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return collectFiles(fullPath, filter);
      return filter(entry.name) ? [fullPath] : [];
    }),
  );
  return files.flat();
}

const readLoaderJs = async () => {
  const files = await collectFiles(path.join(distDir, 'loader-bundle'), (f) => f.endsWith('.js'));
  return (await Promise.all(files.map((f) => fs.readFile(f, 'utf-8')))).join('\n');
};

/**
 * Each part lands exactly once across the given stylesheets, and no virtual import is left over.
 * @param {Record<string, string>} sheets file name → CSS
 * @param {{ hydrate: boolean }} expected whether hydrate CSS should be among them
 */
const assertPlacedOnce = (sheets, { hydrate }) => {
  const all = Object.values(sheets).join('\n');
  assert.strictEqual(count(all, HYDRATE), hydrate ? 1 : 0, 'hydrate CSS count');
  assert.strictEqual(count(all, GLOBALS), 1, 'component global styles count');
  assert.strictEqual(count(all, CSS_ONLY), 1, 'CSS-only component styles count');
  for (const [fileName, css] of Object.entries(sheets)) {
    assert(!VIRTUAL_IMPORT.test(css), `${fileName}: stencil-* virtual import left unresolved`);
  }
};

const assertOrder = (css, ...patterns) => {
  const positions = patterns.map((re) => css.search(new RegExp(re.source)));
  positions.forEach((p, i) => assert(p >= 0, `missing ${patterns[i]}`));
  assert.deepStrictEqual(
    [...positions].sort((a, b) => a - b),
    positions,
    `expected order ${patterns.join(' → ')}`,
  );
};

const assertFailsWith = ({ status, output }, ...fragments) => {
  assert.notStrictEqual(status, 0, 'build should fail');
  const flat = output.replace(/\s+/g, ' ');
  for (const fragment of fragments) {
    assert(flat.includes(fragment), `build output should include: ${fragment}\n${output}`);
  }
};

const scenarios = {
  // one global-style output placing every import itself, one of them via a partial
  explicit: async () => {
    const css = await readAsset('global.css');
    assertPlacedOnce({ 'global.css': css }, { hydrate: true });

    assert(css.includes('--color-primary'), 'missing base CSS from global.css');
    assert(/@layer init\s*{/.test(css), 'stencil-hydrate layer(init) modifier not applied');
    assert(
      /@supports\s*\(display:\s*grid\)\s*{/.test(css),
      'stencil-component-globals supports(display: grid) modifier not applied',
    );

    // CSS-only components have no upgrade lifecycle, so nothing to hide/reveal
    const foucTags = css.replace(/\s/g, '').match(/([a-z0-9,-]+)\{visibility:hidden\}/)[1];
    assert(!foucTags.split(',').includes('css-badge'), 'css-badge in the FOUC selector list');

    assert(
      !(await exists(path.join(distDir, 'assets', 'globalstyle.css'))),
      'unexpected globalstyle.css',
    );
    assert(!(await readLoaderJs()).includes(RUNTIME_HYDRATE), 'loader still injects hydrate CSS');

    // a CSS-only component's tag must never be registered as a real custom element
    for (const file of await collectFiles(distDir, (f) => /\.m?js$/.test(f))) {
      const js = await fs.readFile(file, 'utf-8');
      assert(!/['"]css-badge['"]/.test(js), `css-badge referenced in emitted JS: ${file}`);
    }
  },

  // no global-style output: everything goes into {fsNamespace}.css - hydrate included, ahead of
  // its anchor (the component globals), so the loader stops injecting it
  none: async () => {
    const css = await readAsset('globalstyle.css');
    assertPlacedOnce({ 'globalstyle.css': css }, { hydrate: true });
    assertOrder(css, HYDRATE, GLOBALS, CSS_ONLY);
    assert(!css.includes('\n'), 'generated stylesheet should be minified like any global style');
    assert(!(await readLoaderJs()).includes(RUNTIME_HYDRATE), 'loader still injects hydrate CSS');
  },

  // one global-style output with no imports: prepended to it, hydrate ahead of its anchor (the
  // component globals) even without a standalone output - so the loader stops injecting it
  'single-implicit': async () => {
    const css = await readAsset('global.css');
    assertPlacedOnce({ 'global.css': css }, { hydrate: true });
    assertOrder(css, HYDRATE, GLOBALS, CSS_ONLY, /\.user-rule/);
    assert(
      !(await exists(path.join(distDir, 'assets', 'globalstyle.css'))),
      'unexpected globalstyle.css',
    );
    assert(!(await readLoaderJs()).includes(RUNTIME_HYDRATE), 'loader still injects hydrate CSS');
  },

  // two outputs, neither imports stencil-css-components: ambiguous, so the build fails
  'multi-missing': {
    expectFailure: true,
    check: (result) => {
      assertFailsWith(
        result,
        'Global style placement',
        'none contains @import "stencil-css-components"',
      );
      assert(
        !result.output.includes('@import "stencil-component-globals"'),
        'stencil-component-globals is placed in a.css',
      );
    },
  },

  // two outputs sharing the imports, some through a partial
  'multi-split': async () => {
    const sheets = { 'a.css': await readAsset('a.css'), 'b.css': await readAsset('b.css') };
    assertPlacedOnce(sheets, { hydrate: true });
    assert(GLOBALS.test(sheets['a.css']), 'component global styles should be in a.css');
    assert(
      /@layer cmps\s*{\s*css-badge/.test(sheets['b.css']),
      'CSS-only styles should be layered in b.css',
    );
    assert(!(await readLoaderJs()).includes(RUNTIME_HYDRATE), 'loader still injects hydrate CSS');
  },

  // plain-CSS imports in a Sass partial, compressed output (`@import"..."`, no space)
  sass: async () => {
    const css = await readAsset('global.css');
    assertPlacedOnce({ 'global.css': css }, { hydrate: true });
    assert(/@layer cmps\s*{\s*css-badge/.test(css), 'layer(cmps) modifier not applied');
    assert(css.includes('.user-rule'), 'missing Sass-compiled user rule');
    assert(!(await readLoaderJs()).includes(RUNTIME_HYDRATE), 'loader still injects hydrate CSS');
  },

  'sass-bare': {
    expectFailure: true,
    check: (result) =>
      assertFailsWith(
        result,
        '"stencil-component-globals" is a Stencil virtual import',
        '@import url("stencil-component-globals");',
      ),
  },

  // (css) imports in a Less partial
  less: async () => {
    const css = await readAsset('global.css');
    assertPlacedOnce({ 'global.css': css }, { hydrate: true });
    assert(/@layer cmps\s*{\s*css-badge/.test(css), 'layer(cmps) modifier not applied');
    assert(css.includes('.user-rule'), 'missing Less-compiled user rule');
    assert(!(await readLoaderJs()).includes(RUNTIME_HYDRATE), 'loader still injects hydrate CSS');
  },

  'less-bare': {
    expectFailure: true,
    check: (result) =>
      assertFailsWith(
        result,
        '"stencil-css-components" is a Stencil virtual import',
        '@import (css) "stencil-css-components";',
      ),
  },

  // postcss-import filtered to skip the virtual imports; hydrate goes just before its anchor's
  // import (the component globals, in the partial)
  postcss: async () => {
    const css = await readAsset('global.css');
    assertPlacedOnce({ 'global.css': css }, { hydrate: true });
    assertOrder(css, HYDRATE, GLOBALS);
    assert(/@layer cmps\s*{\s*css-badge/.test(css), 'layer(cmps) modifier not applied');
  },

  // postcss-import resolves every @import form, so the hint points at its filter option
  'postcss-bare': {
    expectFailure: true,
    check: (result) =>
      assertFailsWith(
        result,
        '"stencil-component-globals" is a Stencil virtual import',
        'postcssImport({ filter:',
      ),
  },
};

const only = process.argv[2];
let failures = 0;

for (const [name, scenario] of Object.entries(scenarios)) {
  if (only && only !== name) continue;
  const { expectFailure = false, check } =
    typeof scenario === 'function' ? { check: scenario } : scenario;

  await fs.rm(distDir, { recursive: true, force: true });
  const config = name === 'explicit' ? 'stencil.config.ts' : `stencil.config.${name}.ts`;
  const run = spawnSync(process.execPath, [stencilCli, 'build', '--config', config], {
    cwd: __dirname,
    encoding: 'utf-8',
  });
  if (run.error) throw run.error;
  const result = { status: run.status, output: `${run.stdout}${run.stderr}` };

  try {
    if (!expectFailure) assert.strictEqual(result.status, 0, `build failed:\n${result.output}`);
    await check(result);
    console.log(`✅ ${name}`);
  } catch (e) {
    failures++;
    console.error(`❌ ${name}: ${e.message}`);
  }
}

if (failures) {
  console.error(`${failures} scenario(s) failed`);
  process.exit(1);
}
console.log('✅ All assertions passed');
