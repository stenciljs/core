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

// The virtual import is fully resolved — not present in output
assert(
  !css.includes('stencil-globals'),
  'stencil-globals virtual import should be resolved, not present in output',
);

console.log('✅ All assertions passed');
