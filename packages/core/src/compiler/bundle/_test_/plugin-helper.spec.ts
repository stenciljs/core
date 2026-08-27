import { describe, expect, it } from 'vitest';

import { mockValidatedConfig } from '../../../testing';
import { mockBuildCtx } from '../../../testing/compiler';
import { pluginHelper } from '../plugin-helper';

function getResolveIdHandler(
  config: ReturnType<typeof mockValidatedConfig>,
  buildCtx: ReturnType<typeof mockBuildCtx>,
) {
  const plugin = pluginHelper(config, buildCtx, 'client');
  const resolveId = plugin.resolveId as { handler: (importee: string, importer?: string) => null };
  return resolveId.handler;
}

describe('pluginHelper', () => {
  it('errors on an unaliased Node built-in import', () => {
    const config = mockValidatedConfig();
    const buildCtx = mockBuildCtx(config);
    const handler = getResolveIdHandler(config, buildCtx);

    handler('fs', '/src/index.ts');

    expect(buildCtx.diagnostics).toHaveLength(1);
    expect(buildCtx.diagnostics[0].messageText).toContain('@rolldown/plugin-node-polyfills');
  });

  it('does not error when nodeResolve.alias substitutes the built-in', () => {
    const config = mockValidatedConfig({ nodeResolve: { alias: { fs: 'browserify-fs' } } });
    const buildCtx = mockBuildCtx(config);
    const handler = getResolveIdHandler(config, buildCtx);

    handler('fs', '/src/index.ts');

    expect(buildCtx.diagnostics).toHaveLength(0);
  });

  it('does not error when nodeResolve.alias uses an exact-match ($) key', () => {
    const config = mockValidatedConfig({ nodeResolve: { alias: { fs$: 'browserify-fs' } } });
    const buildCtx = mockBuildCtx(config);
    const handler = getResolveIdHandler(config, buildCtx);

    handler('fs', '/src/index.ts');

    expect(buildCtx.diagnostics).toHaveLength(0);
  });

  it('still errors when the alias explicitly disables substitution (false)', () => {
    const config = mockValidatedConfig({ nodeResolve: { alias: { fs: false } } });
    const buildCtx = mockBuildCtx(config);
    const handler = getResolveIdHandler(config, buildCtx);

    handler('fs', '/src/index.ts');

    expect(buildCtx.diagnostics).toHaveLength(1);
  });
});
