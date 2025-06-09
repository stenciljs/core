import ts from 'typescript';

import { ValidatedConfig } from '../../../declarations';
import { mockValidatedConfig } from '../../../testing/mocks';
import { createTsWatchProgram } from '../create-watch-program';

describe('createWatchProgram', () => {
  let config: ValidatedConfig;

  beforeEach(() => {
    config = mockValidatedConfig();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('includes watchOptions in the watch program creation', async () => {
    config.tsWatchOptions = {
      fallbackPolling: 3,
      excludeFiles: ['src/components/my-component/my-component.tsx'],
      excludeDirectories: ['src/components/my-other-component'],
    } as ts.WatchOptions;
    config.tsconfig = '';
    const tsSpy = jest.spyOn(ts, 'createWatchCompilerHost').mockReturnValue({} as any);
    jest.spyOn(ts, 'createWatchProgram').mockReturnValue({} as any);

    await createTsWatchProgram(config, () => new Promise(() => {}));

    expect(tsSpy.mock.calls[0][6]).toEqual({
      excludeFiles: ['src/components/my-component/my-component.tsx'],
      excludeDirectories: ['src/components/my-other-component'],
    });
  });

  it('omits watchOptions when not provided', async () => {
    config.tsWatchOptions = undefined;
    config.tsconfig = '';
    const tsSpy = jest.spyOn(ts, 'createWatchCompilerHost').mockReturnValue({} as any);
    jest.spyOn(ts, 'createWatchProgram').mockReturnValue({} as any);

    await createTsWatchProgram(config, () => new Promise(() => {}));

    expect(tsSpy.mock.calls[0][6]).toEqual(undefined);
  });
});
