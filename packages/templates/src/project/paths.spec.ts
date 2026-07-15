import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// `getTemplatePath` resolves relative to the compiled dist/ output, so it can't be used from a
// test running against source - resolve straight from this spec file's location instead.
const __dirname = dirname(fileURLToPath(import.meta.url));

describe('component-starter tsconfig.json', () => {
  it('sets skipLibCheck so scaffolded dev builds do not fully type-check lib.dom.d.ts etc.', () => {
    // Regression guard: without this, cold/dev builds fully type-check the DOM/ESNext libs on
    // every rebuild, which took a fresh project's transpile step from ~200ms to 11+ seconds.
    const tsconfigPath = join(
      __dirname,
      '..',
      '..',
      'templates',
      'project',
      'component-starter',
      'tsconfig.json',
    );
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));
    expect(tsconfig.compilerOptions.skipLibCheck).toBe(true);
  });
});
