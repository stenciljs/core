import { beforeEach, describe, expect, it } from 'vitest';
import type * as d from '@stencil/core';

import { mockConfig, mockLoadConfigInit } from '../../../testing';
import { buildWarn } from '../../../utils';
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
    expect(diagnostics.length).toBe(1);
    expect(diagnostics[0]).toEqual({
      header: 'Build Warn',
      level: 'warn',
      lines: [],
      messageText: 'test warning',
      type: 'build',
    });
  });
});
