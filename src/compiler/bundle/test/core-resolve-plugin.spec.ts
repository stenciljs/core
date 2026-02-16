import { mockCompilerCtx, mockValidatedConfig } from '@stencil/core/testing';

import { createSystem } from '../../../compiler/sys/stencil-sys';
import type * as d from '../../../declarations';
import { coreResolvePlugin, getHydratedFlagHead, getStencilInternalModule } from '../core-resolve-plugin';
import { APP_DATA_CONDITIONAL, STENCIL_JSX_RUNTIME_ID } from '../entry-alias-ids';

describe('core resolve plugin', () => {
  const config: d.ValidatedConfig = mockValidatedConfig({
    rootDir: '/',
    sys: createSystem(),
  });

  it('http localhost with port url path', () => {
    const compilerExe = 'http://localhost:3333/@stencil/core/compiler/stencil.js?v=1.2.3';
    const internalModule = 'hydrate/index.js';
    const m = getStencilInternalModule(config, compilerExe, internalModule);
    expect(m).toBe('/node_modules/@stencil/core/internal/hydrate/index.js');
  });

  it('node path', () => {
    const compilerExe = '/Users/me/node_modules/stencil/compiler/stencil.js';
    const internalModule = 'client/index.js';
    const m = getStencilInternalModule(config, compilerExe, internalModule);
    expect(m).toBe('/Users/me/node_modules/stencil/internal/client/index.js');
  });

  it('should not set initialValue', () => {
    const o = getHydratedFlagHead({
      name: 'yup',
      selector: 'class',
      property: 'display',
      initialValue: null,
      hydratedValue: 'block',
    });
    expect(o).toBe(`.yup{display:block}`);
  });

  it('should not set hydratedValue', () => {
    const o = getHydratedFlagHead({
      name: 'yup',
      selector: 'class',
      property: 'display',
      initialValue: 'none',
      hydratedValue: null,
    });
    expect(o).toBe(`{display:none}`);
  });

  it('should set class selector', () => {
    const o = getHydratedFlagHead({
      name: 'yup',
      selector: 'class',
      property: 'display',
      initialValue: 'none',
      hydratedValue: 'block',
    });
    expect(o).toBe(`{display:none}.yup{display:block}`);
  });

  it('should set attribute selector', () => {
    const o = getHydratedFlagHead({
      name: 'yup',
      selector: 'attribute',
      property: 'display',
      initialValue: 'none',
      hydratedValue: 'block',
    });
    expect(o).toBe(`{display:none}[yup]{display:block}`);
  });

  describe('jsx-runtime resolution', () => {
    it('should resolve jsx-runtime to same path as @stencil/core for lazy builds', () => {
      const compilerCtx = mockCompilerCtx(config);
      const plugin = coreResolvePlugin(config, compilerCtx, 'client', false, true);
      const resolved = (plugin.resolveId as Function)(STENCIL_JSX_RUNTIME_ID);
      expect(resolved).toContain('internal/client/index.js');
      expect(resolved).toContain(APP_DATA_CONDITIONAL);
    });
  });
});
