import { describe, expect, it } from '@stencil/vitest';
import type * as d from '@stencil/core';

import { mockComponentMeta, mockValidatedConfig } from '../../../../testing';
import { mockBuildCtx, mockCompilerCtx } from '../../../../testing/compiler';
import { validateSsrReservedAttributes } from '../validate-reserved-attributes';

const prop = (name: string, attribute?: string) =>
  ({ name, attribute, internal: false }) as d.ComponentCompilerProperty;

const run = (properties: d.ComponentCompilerProperty[]) => {
  const config = mockValidatedConfig();
  const buildCtx = mockBuildCtx(config, mockCompilerCtx(config));
  buildCtx.components = [
    mockComponentMeta({ tagName: 'my-cmp', sourceFilePath: '/src/my-cmp.tsx', properties }),
  ];
  validateSsrReservedAttributes(config, buildCtx);
  return buildCtx.diagnostics;
};

describe('validateSsrReservedAttributes', () => {
  it('reports props whose attribute Stencil writes during SSR', () => {
    const diagnostics = run([prop('sId', 's-id'), prop('sSn', 's-sn'), prop('heading', 'heading')]);
    expect(diagnostics.map((d) => d.messageText)).toEqual([
      expect.stringContaining('The "sId" prop of <my-cmp> uses the attribute "s-id"'),
      expect.stringContaining('The "sSn" prop of <my-cmp> uses the attribute "s-sn"'),
    ]);
    expect(diagnostics[0].level).toBe('error');
    expect(diagnostics[0].absFilePath).toBe('/src/my-cmp.tsx');
  });

  it('checks the dash-cased name of a complex prop, which has no attribute', () => {
    expect(run([prop('cId')])).toHaveLength(1);
  });

  it('is fine with an attribute renamed away from a reserved one', () => {
    expect(run([prop('sId', 'server-id')])).toEqual([]);
  });
});
