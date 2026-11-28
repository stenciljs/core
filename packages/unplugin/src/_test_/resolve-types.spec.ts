import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import type { JsonDocsComponent } from '@stencil/core/compiler';

// The project's TypeScript may be 7+, whose root export has no compiler API
vi.mock('typescript', () => {
  throw new Error('@stencil/unplugin must not import the project typescript');
});
// @stencil/core resolves its own TypeScript, whatever the project installs
vi.mock('@stencil/core/compiler', async () => ({
  ts: (await vi.importActual<{ default: typeof import('typescript') }>('typescript')).default,
}));

const componentPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../test/fixtures/docs-shared/base-input.ts',
);

describe('resolveImportedTypes', () => {
  it('expands an imported type without importing the project typescript', async () => {
    const { resolveImportedTypes } = await import('../resolve-types.js');
    const component = {
      props: [
        {
          type: 'Validator',
          complexType: {
            original: 'Validator',
            resolved: 'Validator',
            references: { Validator: { location: 'import', path: './input-types.js', id: '' } },
          },
        },
      ],
      events: [],
    } as unknown as JsonDocsComponent;

    resolveImportedTypes(component, componentPath);

    expect(component.props[0].type).toBe('("required" | "optional")');
  });
});
