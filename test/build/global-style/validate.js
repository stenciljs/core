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

// Both virtual imports are fully resolved — not present in output
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

// stencil-hydrate.css must NOT be generated when @import "stencil-hydrate" is present
// in a global-style input — the standalone output target should detect this and skip it.
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
