import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

console.log('Running global-style validate script');

const cssPath = path.resolve(__dirname, 'dist', 'assets', 'global.css');
const css = await fs.readFile(cssPath, 'utf-8');

// Base styles from global.css are preserved
assert(css.includes('--color-primary'), 'Missing base CSS custom property from global.css');
assert(css.includes('margin'), 'Missing body rule from global.css');

// cmp-a globalStyleUrl contents are injected
assert(css.includes('cmp-a'), 'Missing cmp-a styles from globalStyleUrl');
assert(
  css.includes('display:block') || css.includes('display: block'),
  'Missing cmp-a display rule',
);

// cmp-b inline globalStyle contents are injected
assert(css.includes('cmp-b'), 'Missing cmp-b styles from inline globalStyle');
assert(
  css.includes('display:inline-block') || css.includes('display: inline-block'),
  'Missing cmp-b display rule',
);

// Both virtual imports are fully resolved - not present in output
assert(
  !css.includes('stencil-globals'),
  'stencil-globals virtual import should be resolved, not present in output',
);
assert(
  !css.includes('stencil-hydrate'),
  'stencil-hydrate virtual import should be resolved, not present in output',
);

// FOUC prevention CSS is injected by @import "stencil-hydrate"
// Component tags are sorted alphabetically and followed by the .hydrated rule
assert(css.includes('cmp-a') && css.includes('cmp-b'), 'Missing component tags in FOUC CSS');
assert(
  css.includes('visibility:hidden') || css.includes('visibility: hidden'),
  'Missing visibility:hidden rule from stencil-hydrate',
);
assert(
  css.includes('.hydrated') || css.includes('[hydrated]'),
  'Missing hydrated selector rule from stencil-hydrate',
);

// @import "stencil-hydrate" layer(init) wraps the generated FOUC CSS in a named layer
assert(
  /@layer init\s*{/.test(css),
  'stencil-hydrate output should be wrapped in "@layer init" per the layer() modifier',
);

// @import "stencil-globals" supports(display: grid) wraps the collected styles in @supports
assert(
  /@supports\s*\(display:\s*grid\)\s*{/.test(css),
  'stencil-globals output should be wrapped in "@supports (display: grid)" per the supports() modifier',
);

// css-badge.css (a CSS-only component, no .tsx/JS backing) is injected by
// @import "stencil-css-components"
assert(css.includes('css-badge'), 'Missing css-badge styles from a CSS-only component');
assert(
  !css.includes('stencil-css-components'),
  'stencil-css-components virtual import should be resolved, not present in output',
);

// CSS-only components must NOT appear in the FOUC/hydrate CSS selector list - there's no
// upgrade lifecycle for a tag that's never registered via customElements.define(), so
// there's nothing to hide/reveal.
const foucSelectorMatch = css.replace(/\s/g, '').match(/([a-z0-9,-]+)\{visibility:hidden\}/);
assert(foucSelectorMatch, 'Could not find the FOUC visibility:hidden selector list');
const foucTags = foucSelectorMatch[1].split(',');
assert(
  foucTags.includes('cmp-a') && foucTags.includes('cmp-b'),
  'Missing component tags in FOUC selector list',
);
assert(
  !foucTags.includes('css-badge'),
  'css-badge (a CSS-only component) should not appear in the FOUC/hydrate visibility rule',
);

// A CSS-only component's tag must never be registered as a real custom element - check
// every emitted JS bundle for a customElements.define() call naming it.
const jsFiles = await collectFiles(
  path.resolve(__dirname, 'dist'),
  (f) => f.endsWith('.js') || f.endsWith('.mjs'),
);
for (const file of jsFiles) {
  const contents = await fs.readFile(file, 'utf-8');
  assert(
    !contents.includes(`'css-badge'`) && !contents.includes(`"css-badge"`),
    `css-badge (a CSS-only component) must never be referenced in emitted JS, found in ${file}`,
  );
}

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

// stencil-hydrate.css must NOT be generated when @import "stencil-hydrate" is present
// in a global-style input - the standalone output target should detect this and skip it.
const hydrateCssPath = path.resolve(__dirname, 'dist', 'assets', 'stencil-hydrate.css');
let hydrateFileExists = true;
try {
  await fs.access(hydrateCssPath);
} catch {
  hydrateFileExists = false;
}
assert(
  !hydrateFileExists,
  'stencil-hydrate.css should NOT be generated when @import "stencil-hydrate" is already in a global-style input',
);

console.log('✅ All assertions passed');
