import { render, h } from '@stencil/vitest';
import { describe, it, expect } from 'vitest';

import type { DynamicImport } from './dynamic-imports.js';

describe('dynamic-imports', () => {
  it('should load content from dynamic import', async () => {
    const { root, waitForChanges } = await render(<dynamic-import />);

    expect(root.querySelector('div')).toHaveTextContent('1 hello1 world1');

    const dynamicImport = root as unknown as HTMLElement & DynamicImport;
    await dynamicImport.update();
    await waitForChanges();

    expect(root.querySelector('div')).toHaveTextContent('2 hello2 world2');
  });
});
