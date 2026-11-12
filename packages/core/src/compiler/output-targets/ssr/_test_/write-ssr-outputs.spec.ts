import { describe, expect, it } from '@stencil/vitest';

import { stripSideEffectImports } from '../write-ssr-outputs';

describe('stripSideEffectImports', () => {
  it('removes bare imports and keeps everything else', () => {
    const dts = [
      'import "@stencil/core/app-data";',
      "import 'rolldown'",
      'import "typescript";',
      'import type { Foo } from "foo";',
      'declare function renderToString(html: string): Promise<unknown>;',
      'export { renderToString };',
      '',
    ].join('\n');
    expect(stripSideEffectImports(dts)).toBe(
      [
        'import type { Foo } from "foo";',
        'declare function renderToString(html: string): Promise<unknown>;',
        'export { renderToString };',
        '',
      ].join('\n'),
    );
  });
});
