import { createTestCompiler } from '@stencil/core/testing/compiler';
import { expect, describe, it } from '@stencil/vitest';
import type * as d from '@stencil/core';

import { join } from '../../../utils';

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
              swSrc: join('src', 'sw.js'),
              globPatterns: ['**/*.{html,js,css,json,ico,png}'],
            },
          } as d.OutputTargetWww,
        ],
      },
    });
    // `createTestCompiler`'s default rootDir comes from the in-memory sys ('/'), which
    // may not match `path.resolve('/')` on Windows (drive-lettered) - read it back from
    // the actual validated config instead of assuming it up front. Use Stencil's own
    // `join` (always forward-slash) rather than native `path.join`, to match exactly
    // what the compiler itself uses internally when writing output.
    const root = config.rootDir;
    await compiler.fs.writeFile(join(root, 'www', 'script.js'), `/**/`);
    await compiler.fs.writeFile(join(root, 'src', 'index.html'), `<cmp-a></cmp-a>`);
    await compiler.fs.writeFile(
      join(root, 'src', 'components', 'cmp-a', 'cmp-a.tsx'),
      `
      @Component({ tag: 'cmp-a' }) export class CmpA { render() { return <p>cmp-a</p>; } }
    `,
    );
    await compiler.fs.commit();

    const r = await compiler.build();
    expect(r.diagnostics).toEqual([]);

    const indexHtml = await compiler.fs.readFile(join(root, 'www', 'index.html'));
    expect(indexHtml).toContain(`registration.unregister()`);
  });
});
