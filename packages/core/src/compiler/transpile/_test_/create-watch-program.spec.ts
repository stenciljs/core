import { describe, expect, it, afterEach, beforeEach, vi } from 'vitest';
import { ValidatedConfig } from '@stencil/core';
import { mockValidatedConfig } from '../../../testing/mocks';
import { createTsWatchProgram } from '../create-watch-program';

const { tsSpy } = vi.hoisted(() => {
  return {
    tsSpy: vi.fn().mockReturnValue({} as any),
  };
});

vi.mock('typescript', async (importOriginal) => {
  const actual = await importOriginal<typeof import('typescript')>();
  return {
    ...actual,
    default: {
      ...(actual as any).default,
      createWatchCompilerHost: tsSpy,
      createWatchProgram: vi.fn().mockReturnValue({} as any),
    },
  };
});

describe('createWatchProgram', () => {
  let config: ValidatedConfig;

  beforeEach(() => {
    config = mockValidatedConfig();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('includes watchOptions in the watch program creation', async () => {
    config.tsWatchOptions = {
      fallbackPolling: 3,
      excludeFiles: ['src/components/my-component/my-component.tsx'],
      excludeDirectories: ['src/components/my-other-component'],
    };
    config.tsconfig = '';

    await createTsWatchProgram(config, () => new Promise(() => {}));

    expect(tsSpy.mock.calls[0][6]).toEqual({
      excludeFiles: ['src/components/my-component/my-component.tsx'],
      excludeDirectories: ['src/components/my-other-component'],
    });
  });

  it('omits watchOptions when not provided', async () => {
    config.tsWatchOptions = undefined;
    config.tsconfig = '';

    await createTsWatchProgram(config, () => new Promise(() => {}));

    expect(tsSpy.mock.calls[0][6]).toEqual(undefined);
  });
});
