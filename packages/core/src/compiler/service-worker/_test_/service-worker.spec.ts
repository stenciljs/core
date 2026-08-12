import path from 'path';
import { createTestCompiler } from '@stencil/core/testing';
import { expect, describe, it } from '@stencil/vitest';
import type * as d from '@stencil/core';

describe('service worker', () => {
  it('dev service worker', async () => {
    const { compiler, config } = await createTestCompiler({
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
    // `createTestCompiler`'s default rootDir comes from the in-memory sys ('/'), which
    // may not match `path.resolve('/')` on Windows (drive-lettered) - read it back from
    // the actual validated config instead of assuming it up front.
    const root = config.rootDir;
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
