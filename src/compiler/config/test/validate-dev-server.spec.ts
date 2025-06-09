import { mockLoadConfigInit } from '@stencil/core/testing';
import path from 'path';

import { ConfigFlags, createConfigFlags } from '../../../cli/config-flags';
import type * as d from '../../../declarations';
import { normalizePath } from '../../../utils';
import { validateConfig } from '../validate-config';

describe('validateDevServer', () => {
  const root = path.resolve('/');
  let inputConfig: d.UnvalidatedConfig;
  let inputDevServerConfig: d.DevServerConfig;
  let flags: ConfigFlags;

  beforeEach(() => {
    inputDevServerConfig = {};
    flags = createConfigFlags({ serve: true });
    inputConfig = {
      sys: {} as any,
      rootDir: normalizePath(path.join(root, 'some', 'path')),
      devServer: inputDevServerConfig,
      flags,
      namespace: 'Testing',
    };
  });

  it('should default address', () => {
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.address).toBe('0.0.0.0');
  });

  it.each(['https://localhost', 'http://localhost', 'https://localhost/', 'http://localhost/', 'localhost/'])(
    'should remove extraneous stuff from address %p',
    (address) => {
      inputConfig.devServer = { ...inputDevServerConfig, address };
      const { config } = validateConfig(inputConfig, mockLoadConfigInit());
      expect(config.devServer.address).toBe('localhost');
    },
  );

  it('should set address', () => {
    inputConfig.devServer = { ...inputDevServerConfig, address: '123.123.123.123' };
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.address).toBe('123.123.123.123');
  });

  it('should set address from flags', () => {
    inputConfig.flags = { ...flags, address: '123.123.123.123' };
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.address).toBe('123.123.123.123');
  });

  it('should get custom baseUrl', () => {
    inputConfig.outputTargets = [
      {
        type: 'www',
        baseUrl: '/my-base-url',
      } as d.OutputTargetWww,
    ];
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.basePath).toBe('/my-base-url/');
  });

  it('should get custom baseUrl with domain', () => {
    inputConfig.outputTargets = [
      {
        type: 'www',
        baseUrl: 'http://stenciljs.com/my-base-url',
      } as d.OutputTargetWww,
    ];
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.basePath).toBe('/my-base-url/');
  });

  it('should default basePath', () => {
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.basePath).toBe('/');
  });

  it('should default root', () => {
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.root).toBe(normalizePath(path.join(root, 'some', 'path', 'www')));
  });

  it('should set relative root', () => {
    inputConfig.devServer = { ...inputDevServerConfig, root: 'my-rel-root' };
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.root).toBe(normalizePath(path.join(root, 'some', 'path', 'my-rel-root')));
  });

  it('should set absolute root', () => {
    inputConfig.devServer = {
      ...inputDevServerConfig,
      root: normalizePath(path.join(root, 'some', 'path', 'my-abs-root')),
    };
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.root).toBe(normalizePath(path.join(root, 'some', 'path', 'my-abs-root')));
  });

  it('should default gzip', () => {
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.gzip).toBe(true);
  });

  it('should set gzip', () => {
    inputConfig.devServer = { ...inputDevServerConfig, gzip: false };
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.gzip).toBe(false);
  });

  it.each(['localhost', '192.12.12.10', '127.0.0.1'])('should default port with address %p', () => {
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.port).toBe(3333);
  });

  it.each(['https://subdomain.stenciljs.com:3000', 'localhost:3000/', 'localhost:3000'])(
    'should override port in address with port property',
    (address) => {
      inputConfig.devServer = { ...inputDevServerConfig, address, port: 1234 };
      const { config } = validateConfig(inputConfig, mockLoadConfigInit());
      expect(config.devServer.port).toBe(1234);
    },
  );

  it('should not set default port if null', () => {
    // we intentionally set the value to `null` for the purposes of this test, hence the type assertion
    inputConfig.devServer = { ...inputDevServerConfig, port: null as unknown as number };
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.port).toBe(null);
  });

  it('sets the port to 3333 if the port is undefined', () => {
    inputConfig.devServer = { ...inputDevServerConfig, port: undefined };
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.port).toBe(3333);
  });

  it.each(['localhost:20/', 'localhost:20'])('should set port from address %p if no port prop', (address) => {
    inputConfig.devServer = { ...inputDevServerConfig, address };
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.port).toBe(20);
    expect(config.devServer.address).toBe('localhost');
  });

  it('should set address, port null, protocol', () => {
    inputConfig.devServer = { ...inputDevServerConfig, address: 'https://subdomain.stenciljs.com/' };
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.port).toBe(undefined);
    expect(config.devServer.address).toBe('subdomain.stenciljs.com');
    expect(config.devServer.protocol).toBe('https');
  });

  it('should set port', () => {
    inputConfig.devServer = { ...inputDevServerConfig, port: 4444 };
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.port).toBe(4444);
  });

  it('should set port from flags', () => {
    inputConfig.flags = { ...flags, port: 4444 };
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.port).toBe(4444);
  });

  it('should default historyApiFallback', () => {
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.historyApiFallback).toBeDefined();
    expect(config.devServer.historyApiFallback!.index).toBe('index.html');
  });

  it.each([1, []])('should default historyApiFallback when an invalid value (%s) is provided', (badValue) => {
    // this test explicitly checks for a bad value in the stencil.config file, hence the type assertion
    inputConfig.devServer = { ...inputDevServerConfig, historyApiFallback: badValue as any };
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.historyApiFallback).toBeDefined();
    expect(config.devServer.historyApiFallback!.index).toBe('index.html');
  });

  it('should set historyApiFallback', () => {
    inputConfig.devServer = { ...inputDevServerConfig, historyApiFallback: {} };
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.historyApiFallback).toBeDefined();
    expect(config.devServer.historyApiFallback!.index).toBe('index.html');
  });

  it('should sets the historyApiFallback when undefined is provided', () => {
    inputConfig.devServer = { ...inputDevServerConfig, historyApiFallback: undefined };
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.historyApiFallback).toBeDefined();
    expect(config.devServer.historyApiFallback!.disableDotRule).toBe(false);
    expect(config.devServer.historyApiFallback!.index).toBe('index.html');
  });

  it('should disable historyApiFallback', () => {
    // we intentionally set the value to `null` for the purposes of this test, hence the type assertion
    inputConfig.devServer = { ...inputDevServerConfig, historyApiFallback: null as unknown as d.HistoryApiFallback };
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.historyApiFallback).toBe(null);
  });

  it('should default reloadStrategy hmr', () => {
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.reloadStrategy).toBe('hmr');
  });

  it('should set reloadStrategy pageReload', () => {
    inputConfig.devServer = { ...inputDevServerConfig, reloadStrategy: 'pageReload' };
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.reloadStrategy).toBe('pageReload');
  });

  it('should default openBrowser', () => {
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.openBrowser).toBe(true);
  });

  it('should set openBrowser', () => {
    inputConfig.devServer = { ...inputDevServerConfig, openBrowser: false };
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.openBrowser).toBe(false);
  });

  it('should set openBrowser from flag', () => {
    // the flags field should have been set up in the `beforeEach` block for this test, hence the bang operator
    inputConfig.flags!.open = false;
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.openBrowser).toBe(false);
  });

  it('should default http protocol', () => {
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.protocol).toBe('http');
  });

  it('should set https protocol if credentials are set', () => {
    inputConfig.devServer = { ...inputDevServerConfig, https: { key: 'fake-key', cert: 'fake-cert' } };
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.protocol).toBe('https');
  });

  it('should set ssr true', () => {
    inputConfig.devServer = { ssr: true };
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.ssr).toBe(true);
  });

  it('should set ssr false', () => {
    inputConfig.devServer = { ssr: false };
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.ssr).toBe(false);
  });

  it('should set ssr from flag', () => {
    inputConfig.flags = { ...flags, ssr: true };
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.ssr).toBe(true);
  });

  it('should set ssr false by default', () => {
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.ssr).toBe(false);
  });

  it('should set default srcIndexHtml from config', () => {
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.srcIndexHtml).toBe(normalizePath(path.join(root, 'some', 'path', 'src', 'index.html')));
  });

  it('should set srcIndexHtml from config', () => {
    const wwwOutputTarget: d.OutputTargetWww = {
      type: 'www',
      prerenderConfig: normalizePath(path.join(root, 'some', 'path', 'prerender.config.ts')),
    };
    inputConfig.outputTargets = [wwwOutputTarget];
    inputConfig.flags = { ...flags, ssr: true };
    const { config } = validateConfig(inputConfig, mockLoadConfigInit());
    expect(config.devServer.prerenderConfig).toBe(wwwOutputTarget.prerenderConfig);
  });

  describe('pingRoute', () => {
    it('should default to /ping', () => {
      // Ensure the pingRoute is not set in the inputConfig so we know we're testing the
      // default value added during validation
      delete inputConfig.devServer.pingRoute;
      const { config } = validateConfig(inputConfig, mockLoadConfigInit());
      expect(config.devServer.pingRoute).toBe('/ping');
    });

    it('should set user defined pingRoute', () => {
      inputConfig.devServer = { ...inputDevServerConfig, pingRoute: '/my-ping' };
      const { config } = validateConfig(inputConfig, mockLoadConfigInit());
      expect(config.devServer.pingRoute).toBe('/my-ping');
    });

    it('should prefix pingRoute with a "/"', () => {
      inputConfig.devServer = { ...inputDevServerConfig, pingRoute: 'my-ping' };
      const { config } = validateConfig(inputConfig, mockLoadConfigInit());
      expect(config.devServer.pingRoute).toBe('/my-ping');
    });

    it('should clear ping route if set to null', () => {
      inputConfig.devServer = { ...inputDevServerConfig, pingRoute: null };
      const { config } = validateConfig(inputConfig, mockLoadConfigInit());
      expect(config.devServer.pingRoute).toBe(null);
    });
  });
});
