import type { OutputBundle, OutputChunk } from 'rollup';

import type * as d from '../../../../declarations';
import { lazyBundleIdPlugin } from '../lazy-bundleid-plugin';

describe('lazyBundleIdPlugin', () => {
  const chunk = (fileName: string, opts: Partial<OutputChunk>): OutputChunk =>
    ({
      type: 'chunk',
      fileName,
      name: fileName.replace(/\.js$/, ''),
      isEntry: false,
      imports: [],
      dynamicImports: [],
      code: '',
      map: null,
      ...opts,
    }) as OutputChunk;

  const runPlugin = async (files: OutputChunk[]) => {
    const buildCtx = { entryModules: [{ entryKey: 'cmp-a' }] } as d.BuildCtx;
    const config = { sourceMap: false } as d.ValidatedConfig;
    const plugin = lazyBundleIdPlugin(buildCtx, config, false, '');
    const bundle: OutputBundle = Object.fromEntries(files.map((f) => [f.fileName, f]));
    await (plugin.generateBundle as any).call({}, {}, bundle);
    return bundle;
  };

  it('rewrites references to a renamed entry in every chunk that imports it', async () => {
    const entry = chunk('cmp-a.js', { name: 'cmp-a', isEntry: true, code: 'export const A = 1;' });
    const shared = chunk('p-shared.js', {
      imports: ['cmp-a.js'],
      code: `import './cmp-a.js';\nexport const B = 2;`,
    });
    const dynamicOnly = chunk('p-dynamic.js', {
      dynamicImports: ['cmp-a.js'],
      code: `export const load = () => import('./cmp-a.js');`,
    });
    const otherEntry = chunk('index.js', {
      name: 'index',
      isEntry: true,
      imports: ['cmp-a.js'],
      code: `export * from './cmp-a.js';`,
    });

    await runPlugin([entry, shared, dynamicOnly, otherEntry]);

    expect(entry.fileName).toBe('cmp-a.entry.js');
    expect(shared.code).toBe(`import './cmp-a.entry.js';\nexport const B = 2;`);
    expect(shared.imports).toEqual(['cmp-a.entry.js']);
    expect(dynamicOnly.code).toBe(`export const load = () => import('./cmp-a.entry.js');`);
    expect(dynamicOnly.dynamicImports).toEqual(['cmp-a.entry.js']);
    expect(otherEntry.fileName).toBe('index.js');
    expect(otherEntry.code).toBe(`export * from './cmp-a.entry.js';`);
    expect(otherEntry.imports).toEqual(['cmp-a.entry.js']);
  });
});
