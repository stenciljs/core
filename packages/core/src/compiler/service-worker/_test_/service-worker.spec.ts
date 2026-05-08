import path from 'path';
import { createTestCompiler } from '@stencil/core/testing';
import { expect, describe, it } from '@stencil/vitest';
import type * as d from '@stencil/core';

describe('service worker', () => {
  const root = path.resolve('/');

  it('dev service worker', async () => {
    const { compiler } = await createTestCompiler({
      config: {
        // @ts-expect-error - need to test dev mode service worker behavior
        devMode: true,
        outputTargets: [
          {
            type: 'www',
            serviceWorker: {
              swSrc: path.join('src', 'sw.js'),
              globPatterns: ['**/*.{html,js,css,json,ico,png}'],
            },
          } as d.OutputTargetWww,
        ],
      },
    });
    await compiler.fs.writeFile(path.join(root, 'www', 'script.js'), `/**/`);
    await compiler.fs.writeFile(path.join(root, 'src', 'index.html'), `<cmp-a></cmp-a>`);
    await compiler.fs.writeFile(
      path.join(root, 'src', 'components', 'cmp-a', 'cmp-a.tsx'),
      `
      @Component({ tag: 'cmp-a' }) export class CmpA { render() { return <p>cmp-a</p>; } }
    `,
    );
    await compiler.fs.commit();

    const r = await compiler.build();
    expect(r.diagnostics).toEqual([]);

    const indexHtml = await compiler.fs.readFile(path.join(root, 'www', 'index.html'));
    expect(indexHtml).toContain(`registration.unregister()`);
  });
});
