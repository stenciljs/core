import type * as d from '@stencil/core/declarations';

import { DEV_SERVER_URL } from '../dev-server-constants';
import {
  getBrowserUrl,
  getDevServerClientUrl,
  getSsrStaticDataPath,
  isExtensionLessPath,
  isSsrStaticDataPath,
} from '../dev-server-utils';

describe('dev-server, util', () => {
  it('should get url with custom base url and pathname', () => {
    const protocol = 'http:';
    const address = '0.0.0.0';
    const port = 44;
    const baseUrl = '/my-base-url/';
    const pathname = '/my-custom-path-name';
    const url = getBrowserUrl(protocol, address, port, baseUrl, pathname);
    expect(url).toBe('http://localhost:44/my-base-url/my-custom-path-name');
  });

  it('should get url with custom pathname', () => {
    const protocol = 'http';
    const address = '0.0.0.0';
    const port = 44;
    const baseUrl = '/';
    const pathname = '/my-custom-path-name';
    const url = getBrowserUrl(protocol, address, port, baseUrl, pathname);
    expect(url).toBe('http://localhost:44/my-custom-path-name');
  });

  it('should get path with 80 port', () => {
    const protocol = 'http';
    const address = '0.0.0.0';
    const port = 80;
    const baseUrl = '/';
    const pathname = '/';
    const url = getBrowserUrl(protocol, address, port, baseUrl, pathname);
    expect(url).toBe('http://localhost/');
  });

  it('should get path with no port', () => {
    const protocol = 'http';
    const address = '0.0.0.0';
    const port: any = undefined;
    const baseUrl = '/';
    const pathname = '/';
    const url = getBrowserUrl(protocol, address, port, baseUrl, pathname);
    expect(url).toBe('http://localhost/');
  });

  it('should get path with https', () => {
    const protocol = 'https';
    const address = '0.0.0.0';
    const port = 3333;
    const baseUrl = '/';
    const pathname = '/';
    const url = getBrowserUrl(protocol, address, port, baseUrl, pathname);
    expect(url).toBe('https://localhost:3333/');
  });

  it('should get path with custom address', () => {
    const protocol = 'http';
    const address = 'staging.stenciljs.com';
    const port = 3333;
    const baseUrl = '/';
    const pathname = '/';
    const url = getBrowserUrl(protocol, address, port, baseUrl, pathname);
    expect(url).toBe('http://staging.stenciljs.com:3333/');
  });
});

describe('getDevServerClientUrl', () => {
  it('should get path for dev server w/ host w/ port w/ protocol', () => {
    const devServerConfig: d.DevServerConfig = {
      protocol: 'http',
      address: '0.0.0.0',
      port: 3333,
      basePath: '/my-base-url/',
    };
    const proto = 'https';
    const host = 'staging.stenciljs:5555.com';
    const url = getDevServerClientUrl(devServerConfig, host, proto);
    expect(url).toBe(`https://staging.stenciljs:5555.com/my-base-url${DEV_SERVER_URL}`);
  });

  it('should get path for dev server w/ host w/ port no protocol', () => {
    const devServerConfig: d.DevServerConfig = {
      protocol: 'http',
      address: '0.0.0.0',
      port: 3333,
      basePath: '/my-base-url/',
    };
    const proto: string = null;
    const host = 'staging.stenciljs:5555.com';
    const url = getDevServerClientUrl(devServerConfig, host, proto);
    expect(url).toBe(`http://staging.stenciljs:5555.com/my-base-url${DEV_SERVER_URL}`);
  });

  it('should get path for dev server w/ host no port', () => {
    const devServerConfig: d.DevServerConfig = {
      protocol: 'http',
      address: '0.0.0.0',
      port: 3333,
      basePath: '/my-base-url/',
    };
    const proto: string = null;
    const host = 'staging.stenciljs.com';
    const url = getDevServerClientUrl(devServerConfig, host, proto);
    expect(url).toBe(`http://staging.stenciljs.com/my-base-url${DEV_SERVER_URL}`);
  });

  it('should get path for dev server w/ base url and port, no host', () => {
    const devServerConfig: d.DevServerConfig = {
      protocol: 'http',
      address: '0.0.0.0',
      port: 3333,
      basePath: '/my-base-url/',
    };
    const proto: string = null;
    const host: string = null;
    const url = getDevServerClientUrl(devServerConfig, host, proto);
    expect(url).toBe(`http://localhost:3333/my-base-url${DEV_SERVER_URL}`);
  });

  it('should get path for dev server w/ base url and w/out port', () => {
    const devServerConfig: d.DevServerConfig = {
      protocol: 'http',
      address: '0.0.0.0',
      basePath: '/my-base-url/',
    };
    const proto: string = null;
    const host: string = null;
    const url = getDevServerClientUrl(devServerConfig, host, proto);
    expect(url).toBe(`${devServerConfig.protocol}://localhost/my-base-url${DEV_SERVER_URL}`);
  });

  it('should get path for dev server w/ custom address, base url and port', () => {
    const devServerConfig: d.DevServerConfig = {
      protocol: 'http',
      address: '1.2.3.4',
      port: 3333,
      basePath: '/my-base-url/',
    };
    const proto: string = null;
    const host: string = null;
    const url = getDevServerClientUrl(devServerConfig, host, proto);
    expect(url).toBe(`${devServerConfig.protocol}://${devServerConfig.address}:3333/my-base-url${DEV_SERVER_URL}`);
  });

  it('isExtensionLessPath', () => {
    expect(isExtensionLessPath('http://stenciljs.com/')).toBe(true);
    expect(isExtensionLessPath('http://stenciljs.com/blog')).toBe(true);
    expect(isExtensionLessPath('http://stenciljs.com/blog/')).toBe(true);
    expect(isExtensionLessPath('http://stenciljs.com/.')).toBe(false);
    expect(isExtensionLessPath('http://stenciljs.com/data.json')).toBe(false);
    expect(isExtensionLessPath('http://stenciljs.com/index.html')).toBe(false);
    expect(isExtensionLessPath('http://stenciljs.com/blog.html')).toBe(false);
  });

  it('isSsrStaticDataPath', () => {
    expect(isSsrStaticDataPath('http://stenciljs.com/')).toBe(false);
    expect(isSsrStaticDataPath('http://stenciljs.com/index.html')).toBe(false);
    expect(isSsrStaticDataPath('http://stenciljs.com/page.state.json')).toBe(true);
  });

  it('getSsrStaticDataPath, root', () => {
    const req: d.HttpRequest = {
      url: new URL('http://stenciljs.com/page.static.json'),
      method: 'GET',
      acceptHeader: '',
      searchParams: null,
    };
    const r = getSsrStaticDataPath(req);
    expect(r.fileName).toBe('page.static.json');
    expect(r.hasQueryString).toBe(false);
    expect(r.ssrPath).toBe('http://stenciljs.com/');
  });

  it('getSsrStaticDataPath, no trailing slash refer', () => {
    const req: d.HttpRequest = {
      url: new URL('http://stenciljs.com/blog/page.static.json?v=1234'),
      method: 'GET',
      acceptHeader: '',
      searchParams: null,
      headers: {
        Referer: 'http://stenciljs.com/page',
      },
    };
    const r = getSsrStaticDataPath(req);
    expect(r.fileName).toBe('page.static.json');
    expect(r.hasQueryString).toBe(true);
    expect(r.ssrPath).toBe('http://stenciljs.com/blog');
  });

  it('getSsrStaticDataPath, with trailing slash refer', () => {
    const req: d.HttpRequest = {
      url: new URL('http://stenciljs.com/blog/page.static.json?v=1234'),
      method: 'GET',
      acceptHeader: '',
      searchParams: null,
      headers: {
        Referer: 'http://stenciljs.com/page/',
      },
    };
    const r = getSsrStaticDataPath(req);
    expect(r.fileName).toBe('page.static.json');
    expect(r.hasQueryString).toBe(true);
    expect(r.ssrPath).toBe('http://stenciljs.com/blog/');
  });
});
