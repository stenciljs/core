// Copies .d.ts files needed for Monaco's extraLibs into src/generated/ as plain text (`.txt`,
// not `.d.ts` - Stencil's build treats that extension as declaration-only and strips its output
// to an empty string) so monaco-setup.ts can import them with `?format=text`. Runs before
// `stencil build` (unlike copy-vendor.js, which runs after).

import { access, copyFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// `@stencil/core` declares `./package.json` in its `exports` map; not every package does (e.g.
// @preact/signals-core), so this walks up from the resolved main entry instead of assuming it.
const packageRoot = async (specifier) => {
  let dir = dirname(fileURLToPath(import.meta.resolve(specifier)));
  while (true) {
    try {
      await access(join(dir, 'package.json'));
      return dir;
    } catch {
      dir = dirname(dir);
    }
  }
};

const outDir = join(import.meta.dirname, '../src/generated');
const stencilCoreDir = await packageRoot('@stencil/core');
const signalsCoreDir = await packageRoot('@preact/signals-core');

await mkdir(outDir, { recursive: true });
await Promise.all([
  copyFile(
    join(stencilCoreDir, 'dist/declarations/stencil-public-runtime.d.ts'),
    join(outDir, 'stencil-core-runtime.txt'),
  ),
  copyFile(
    join(stencilCoreDir, 'dist/declarations/stencil-public-compiler.d.ts'),
    join(outDir, 'stencil-core-compiler.txt'),
  ),
  copyFile(
    join(stencilCoreDir, 'dist/jsx-runtime.d.mts'),
    join(outDir, 'stencil-core-jsx-runtime.txt'),
  ),
  copyFile(
    join(stencilCoreDir, 'dist/signals/index.d.ts'),
    join(outDir, 'stencil-core-signals.txt'),
  ),
  copyFile(join(signalsCoreDir, 'dist/signals-core.d.ts'), join(outDir, 'preact-signals-core.txt')),
]);
