// Copies the preview's runtime-dependency bundles into dist/vendor/ as fixed filenames, so
// <stencil-playground-preview> can point an iframe import map at stable, absolute URLs. Copied
// verbatim (not re-bundled) so app-data/app-globals/signals-core stay the exact same file
// no matter where they're used

import { copyFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = join(import.meta.dirname, '../dist/vendor');

const files = {
  'runtime-client-standalone.js': '@stencil/core/runtime/client/standalone',
  'app-data.js': '@stencil/core/app-data',
  'app-globals.js': '@stencil/core/app-globals',
  'signals.js': '@stencil/core/signals',
  'signals-core.js': '@preact/signals-core',
};

await mkdir(outDir, { recursive: true });
for (const [name, specifier] of Object.entries(files)) {
  const src = fileURLToPath(import.meta.resolve(specifier));
  await copyFile(src, join(outDir, name));
}
