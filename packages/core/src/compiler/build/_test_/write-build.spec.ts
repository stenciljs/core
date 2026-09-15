import * as d from '@stencil/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockValidatedConfig } from '../../../testing';
import { mockBuildCtx, mockCompilerCtx } from '../../../testing/compiler';
import { writeBuild } from '../write-build';
import { writeExportMaps } from '../write-export-maps';

vi.mock('../write-export-maps', () => ({
  writeExportMaps: vi.fn(),
}));

describe('writeBuild', () => {
  let config: d.ValidatedConfig;
  let compilerCtx: d.CompilerCtx;
  let buildCtx: d.BuildCtx;

  beforeEach(() => {
    config = mockValidatedConfig();
    config.generateExportMaps = true;
    compilerCtx = mockCompilerCtx(config);
    buildCtx = mockBuildCtx(config, compilerCtx);
    vi.clearAllMocks();
  });

  it('generates export maps for a production build', async () => {
    config.devMode = false;

    await writeBuild(config, compilerCtx, buildCtx);

    expect(writeExportMaps).toHaveBeenCalledTimes(1);
  });

  it('skips export maps for a dev build', async () => {
    config.devMode = true;

    await writeBuild(config, compilerCtx, buildCtx);

    expect(writeExportMaps).not.toHaveBeenCalled();
  });
});
