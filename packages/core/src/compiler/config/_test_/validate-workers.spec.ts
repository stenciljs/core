import type * as d from '@stencil/core';
import { mockLoadConfigInit, mockLogger } from '../../../testing';
import path from 'path';
import { beforeEach, describe, expect, it } from 'vitest';

import { validateConfig } from '../validate-config';

describe('validate-workers', () => {
  let userConfig: d.Config;
  const logger = mockLogger();

  beforeEach(() => {
    userConfig = {
      sys: {
        path: path,
      } as any,
      logger: logger,
      rootDir: '/',
      namespace: 'Testing',
    };
  });

  it('set maxConcurrentWorkers, but dont let it go under 0', () => {
    userConfig.maxConcurrentWorkers = -1;
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    expect(config.maxConcurrentWorkers).toBe(0);
  });

  it('limits maxConcurrentWorkers in CI mode', () => {
    userConfig.ci = true;
    userConfig.maxConcurrentWorkers = 8;
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    expect(config.maxConcurrentWorkers).toBe(4);
  });

  it('set maxConcurrentWorkers', () => {
    userConfig.maxConcurrentWorkers = 4;
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    expect(config.maxConcurrentWorkers).toBe(4);
  });
});
