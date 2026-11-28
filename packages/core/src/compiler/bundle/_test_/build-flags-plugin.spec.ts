import { rolldown, type Plugin } from 'rolldown';
import { describe, expect, it } from 'vitest';

import { Build as ClientBuild } from '../../../client/client-build';
import { Build as ServerBuild } from '../../../server/platform';
import { buildFlagsPlugin, foldBuildFlags, getFoldableBuildFlags } from '../build-flags-plugin';
import type { BundleOptions } from '../bundle-interface';

const CLIENT = { isBrowser: true, isServer: false };

describe('foldBuildFlags', () => {
  it('folds reads of an imported Build, keeping the original length', () => {
    const code = `import { Build } from '@stencil/core';\nif (Build.isServer) a();\nif (Build['isBrowser']) b();`;
    const out = foldBuildFlags(code, 'cmp.tsx', CLIENT)!;
    expect(out).toContain(`if (${'false'.padEnd('Build.isServer'.length)}) a();`);
    expect(out).toContain(`if (${'true'.padEnd("Build['isBrowser']".length)}) b();`);
    expect(out).toHaveLength(code.length);
  });

  it('follows an aliased import and runtime import paths', () => {
    const code = `import { Build as B } from '@stencil/core/runtime/client/lazy';\nif (B.isServer) a();`;
    expect(foldBuildFlags(code, 'cmp.js', CLIENT)).toContain('if (false     ) a();');
  });

  it('keeps line breaks inside a multi-line access', () => {
    const code = `import { Build } from '@stencil/core';\nif (Build\n  .isServer) a();`;
    const out = foldBuildFlags(code, 'cmp.ts', CLIENT)!;
    expect(out.split('\n')).toHaveLength(3);
    expect(out).toHaveLength(code.length);
    expect(out).toMatch(/if \(false\n\s+\) a\(\);/);
  });

  it('leaves flags without a provided value alone', () => {
    const code = `import { Build } from '@stencil/core';\nif (Build.isDev) a();`;
    expect(foldBuildFlags(code, 'cmp.ts', CLIENT)).toBeNull();
  });

  it('ignores Build from other modules and type-only imports', () => {
    expect(
      foldBuildFlags(`import { Build } from './build';\nBuild.isServer;`, 'a.ts', CLIENT),
    ).toBeNull();
    expect(
      foldBuildFlags(
        `import { Build } from '@stencil/core/testing';\nBuild.isServer;`,
        'a.ts',
        CLIENT,
      ),
    ).toBeNull();
    expect(
      foldBuildFlags(
        `import type { Build } from '@stencil/core';\nBuild.isServer;`,
        'a.ts',
        CLIENT,
      ),
    ).toBeNull();
  });

  it('skips a shadowed binding', () => {
    const code = `import { Build } from '@stencil/core';\nfunction f(Build) { return Build.isServer; }\nBuild.isServer;`;
    expect(foldBuildFlags(code, 'a.ts', CLIENT)).toBeNull();
  });

  it('skips a binding that is written to', () => {
    const code = `import { Build } from '@stencil/core';\nBuild.isServer = true;\nif (Build.isServer) a();`;
    expect(foldBuildFlags(code, 'a.ts', CLIENT)).toBeNull();
  });

  it('does not treat `obj.Build.isServer` as a read', () => {
    const code = `import { Build } from '@stencil/core';\nobj.Build.isServer;`;
    expect(foldBuildFlags(code, 'a.ts', CLIENT)).toBeNull();
  });
});

describe('buildFlagsPlugin', () => {
  const runtime: Plugin = {
    name: 'test-runtime',
    resolveId(id) {
      if (id === '/entry.js') return id;
      if (id === '@stencil/core') return '\0core';
      if (id === 'heavy') return '\0heavy';
      return null;
    },
    load(id) {
      if (id === '\0core') {
        return `export const Build = { isDev: false, isBrowser: true, isServer: false, isTesting: false };`;
      }
      if (id === '\0heavy') return `export const heavy = () => 'HEAVY_PAYLOAD';`;
      if (id === '/entry.js') {
        return [
          `import { Build } from '@stencil/core';`,
          `import { heavy } from 'heavy';`,
          `export const render = () => {`,
          `  if (Build.isServer) { console.log(heavy()); import('dyn'); }`,
          `  if (Build.isDev) console.log('DEV_ONLY');`,
          `  return 'ok';`,
          `};`,
        ].join('\n');
      }
      if (id === '\0dyn') return `export default 'DYN_PAYLOAD';`;
      return null;
    },
  };
  const dynResolve: Plugin = {
    name: 'dyn',
    resolveId: (id) => (id === 'dyn' ? '\0dyn' : null),
  };

  const bundle = async (opts: Partial<BundleOptions>) => {
    const build = await rolldown({
      input: '/entry.js',
      plugins: [
        runtime,
        dynResolve,
        buildFlagsPlugin({ id: 'test', inputs: {}, platform: 'client', ...opts }),
      ],
    });
    const { output } = await build.generate({ format: 'esm' });
    return output.map((o) => (o.type === 'chunk' ? o.code : '')).join('\n');
  };

  it('drops server-only code and its imports from a client bundle', async () => {
    const code = await bundle({ platform: 'client' });
    expect(code).not.toContain('HEAVY_PAYLOAD');
    expect(code).not.toContain('DYN_PAYLOAD');
  });

  it('keeps server-only code in an ssr bundle', async () => {
    const code = await bundle({ platform: 'ssr' });
    expect(code).toContain('HEAVY_PAYLOAD');
    expect(code).toContain('DYN_PAYLOAD');
  });

  it('folds isDev from the conditionals when the runtime is bundled', async () => {
    const code = await bundle({ platform: 'client', conditionals: { isDev: false } });
    expect(code).not.toContain('DEV_ONLY');
  });

  it('leaves isDev as a runtime read with an external runtime', async () => {
    const code = await bundle({
      platform: 'client',
      externalRuntime: true,
      conditionals: { isDev: false },
    });
    expect(code).toContain('DEV_ONLY');
  });
});

describe('getFoldableBuildFlags', () => {
  it("matches the ssr runtime's Build", () => {
    expect(getFoldableBuildFlags({ id: 'x', inputs: {}, platform: 'ssr' })).toEqual(ServerBuild);
  });

  it("matches the client runtime's Build", () => {
    const flags = getFoldableBuildFlags({
      id: 'x',
      inputs: {},
      platform: 'client',
      conditionals: { isDev: ClientBuild.isDev, isTesting: ClientBuild.isTesting },
    });
    expect(flags).toEqual(ClientBuild);
  });
});
