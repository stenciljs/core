import type * as d from '@stencil/core/declarations';
import { mockConfig, mockLoadConfigInit } from '@stencil/core/testing';
import { buildWarn } from '@utils';

import { validateConfig } from '../validate-config';

describe('validateCustom', () => {
  let userConfig: d.Config;

  beforeEach(() => {
    userConfig = mockConfig();
  });

  it('should log warning', () => {
    userConfig.outputTargets = [
      {
        type: 'custom',
        name: 'test',
        validate: (_, diagnostics) => {
          const warn = buildWarn(diagnostics);
          warn.messageText = 'test warning';
        },
        generator: async () => {
          return;
        },
      },
    ];
    const { diagnostics } = validateConfig(userConfig, mockLoadConfigInit());
    // TODO(STENCIL-1107): Decrement the right-hand side value from 2 to 1
    expect(diagnostics.length).toBe(2);
    // TODO(STENCIL-1107): Keep this assertion
    expect(diagnostics[0]).toEqual({
      header: 'Build Warn',
      level: 'warn',
      lines: [],
      messageText: 'test warning',
      type: 'build',
    });
    // TODO(STENCIL-1107): Remove this assertion
    expect(diagnostics[1]).toEqual({
      header: 'Build Warn',
      level: 'warn',
      lines: [],
      messageText:
        'nodeResolve.customResolveOptions is a deprecated option in a Stencil Configuration file. If you need this option, please open a new issue in the Stencil repository (https://github.com/stenciljs/core/issues/new/choose)',
      type: 'build',
    });
  });
});
