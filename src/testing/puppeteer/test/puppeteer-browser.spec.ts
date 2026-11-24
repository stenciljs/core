import type { ValidatedConfig } from '@stencil/core/internal';

import { startPuppeteerBrowser } from '../puppeteer-browser';

describe('startPuppeteerBrowser', () => {
  const createConfig = (testing: Record<string, unknown>) => {
    const launch = jest.fn().mockResolvedValue({ wsEndpoint: () => 'ws://localhost:1234' });
    const connect = jest.fn().mockResolvedValue({ wsEndpoint: () => 'ws://localhost:1234' });
    const puppeteer = { launch, connect, executablePath: jest.fn().mockReturnValue('/path/to/chrome') };

    const config = {
      flags: { e2e: true },
      rootDir: '/',
      logger: { debug: jest.fn() },
      sys: {
        lazyRequire: {
          getModulePath: jest.fn().mockReturnValue('/node_modules/puppeteer'),
          require: jest.fn().mockReturnValue(puppeteer),
        },
        platformPath: { join: (...parts: string[]) => parts.join('/') },
        readFileSync: jest.fn().mockReturnValue(JSON.stringify({ version: '24.1.0' })),
      },
      testing,
    } as unknown as ValidatedConfig;

    return { config, launch, connect };
  };

  it('passes `browserLaunchTimeout` to puppeteer as the launch `timeout`', async () => {
    const { config, launch } = createConfig({ browserLaunchTimeout: 120_000 });

    await startPuppeteerBrowser(config);

    expect(launch).toHaveBeenCalledTimes(1);
    expect(launch.mock.calls[0][0].timeout).toBe(120_000);
  });

  it('allows disabling the launch timeout with `0`', async () => {
    const { config, launch } = createConfig({ browserLaunchTimeout: 0 });

    await startPuppeteerBrowser(config);

    expect(launch.mock.calls[0][0].timeout).toBe(0);
  });

  it('leaves the puppeteer default timeout alone when `browserLaunchTimeout` is not set', async () => {
    const { config, launch } = createConfig({});

    await startPuppeteerBrowser(config);

    expect(launch.mock.calls[0][0].timeout).toBeUndefined();
  });

  it('does not launch a browser when connecting to a remote endpoint', async () => {
    const { config, launch, connect } = createConfig({
      browserLaunchTimeout: 120_000,
      browserWSEndpoint: 'ws://remote:9222',
    });

    await startPuppeteerBrowser(config);

    expect(launch).not.toHaveBeenCalled();
    expect(connect).toHaveBeenCalledTimes(1);
  });
});
