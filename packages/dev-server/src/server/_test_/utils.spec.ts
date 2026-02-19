import { describe, expect, it } from 'vitest'

import type { DevServerConfig, HttpRequest } from '../types.js'
import {
  DEV_SERVER_URL,
  getBrowserUrl,
  getDevServerClientUrl,
  getSsrStaticDataPath,
  isCssFile,
  isExtensionLessPath,
  isHtmlFile,
  isSsrStaticDataPath,
} from '../utils.js'

describe('isHtmlFile', () => {
  it.each(['.html', 'foo.html', 'foo/bar.html'])('returns true for .html files (%s)', (filename) => {
    expect(isHtmlFile(filename)).toBe(true)
  })

  it.each(['.htm', 'foo.htm', 'foo/bar.htm'])('returns true for .htm files (%s)', (filename) => {
    expect(isHtmlFile(filename)).toBe(true)
  })

  it.each(['.ht', 'foo.htmx', 'foo/bar.xaml'])('returns false for other types of files (%s)', (filename) => {
    expect(isHtmlFile(filename)).toBe(false)
  })

  it.each(['.hTMl', 'foo.HTML', 'foo/bar.htmL'])('is case insensitive for filename (%s)', (filename) => {
    expect(isHtmlFile(filename)).toBe(true)
  })
})

describe('isCssFile', () => {
  it.each(['.css', 'foo.css', 'foo/bar.css'])('returns true for .css files (%s)', (filename) => {
    expect(isCssFile(filename)).toBe(true)
  })

  it.each(['.txt', 'foo.sass', 'foo/bar.htm'])('returns false for other types of files (%s)', (filename) => {
    expect(isCssFile(filename)).toBe(false)
  })

  it.each(['.cSs', 'foo.cSS', 'foo/bar.CSS'])('is case insensitive for filename (%s)', (filename) => {
    expect(isCssFile(filename)).toBe(true)
  })
})

describe('getBrowserUrl', () => {
  it('should get url with custom base url and pathname', () => {
    const url = getBrowserUrl('http:', '0.0.0.0', 44, '/my-base-url/', '/my-custom-path-name')
    expect(url).toBe('http://localhost:44/my-base-url/my-custom-path-name')
  })

  it('should get url with custom pathname', () => {
    const url = getBrowserUrl('http', '0.0.0.0', 44, '/', '/my-custom-path-name')
    expect(url).toBe('http://localhost:44/my-custom-path-name')
  })

  it('should get path with 80 port', () => {
    const url = getBrowserUrl('http', '0.0.0.0', 80, '/', '/')
    expect(url).toBe('http://localhost/')
  })

  it('should get path with no port', () => {
    const url = getBrowserUrl('http', '0.0.0.0', undefined as any, '/', '/')
    expect(url).toBe('http://localhost/')
  })

  it('should get path with https', () => {
    const url = getBrowserUrl('https', '0.0.0.0', 3333, '/', '/')
    expect(url).toBe('https://localhost:3333/')
  })

  it('should get path with custom address', () => {
    const url = getBrowserUrl('http', 'staging.stenciljs.com', 3333, '/', '/')
    expect(url).toBe('http://staging.stenciljs.com:3333/')
  })
})

describe('getDevServerClientUrl', () => {
  it('should get path for dev server w/ host w/ port w/ protocol', () => {
    const devServerConfig: DevServerConfig = {
      protocol: 'http',
      address: '0.0.0.0',
      port: 3333,
      basePath: '/my-base-url/',
    }
    const url = getDevServerClientUrl(devServerConfig, 'staging.stenciljs:5555.com', 'https')
    expect(url).toBe(`https://staging.stenciljs:5555.com/my-base-url${DEV_SERVER_URL}`)
  })

  it('should get path for dev server w/ host w/ port no protocol', () => {
    const devServerConfig: DevServerConfig = {
      protocol: 'http',
      address: '0.0.0.0',
      port: 3333,
      basePath: '/my-base-url/',
    }
    const url = getDevServerClientUrl(devServerConfig, 'staging.stenciljs:5555.com', undefined)
    expect(url).toBe(`http://staging.stenciljs:5555.com/my-base-url${DEV_SERVER_URL}`)
  })

  it('should get path for dev server w/ host no port', () => {
    const devServerConfig: DevServerConfig = {
      protocol: 'http',
      address: '0.0.0.0',
      port: 3333,
      basePath: '/my-base-url/',
    }
    const url = getDevServerClientUrl(devServerConfig, 'staging.stenciljs.com', undefined)
    expect(url).toBe(`http://staging.stenciljs.com/my-base-url${DEV_SERVER_URL}`)
  })

  it('should get path for dev server w/ base url and port, no host', () => {
    const devServerConfig: DevServerConfig = {
      protocol: 'http',
      address: '0.0.0.0',
      port: 3333,
      basePath: '/my-base-url/',
    }
    const url = getDevServerClientUrl(devServerConfig, undefined, undefined)
    expect(url).toBe(`http://localhost:3333/my-base-url${DEV_SERVER_URL}`)
  })

  it('should get path for dev server w/ base url and w/out port', () => {
    const devServerConfig: DevServerConfig = {
      protocol: 'http',
      address: '0.0.0.0',
      basePath: '/my-base-url/',
    }
    const url = getDevServerClientUrl(devServerConfig, undefined, undefined)
    expect(url).toBe(`http://localhost/my-base-url${DEV_SERVER_URL}`)
  })

  it('should get path for dev server w/ custom address, base url and port', () => {
    const devServerConfig: DevServerConfig = {
      protocol: 'http',
      address: '1.2.3.4',
      port: 3333,
      basePath: '/my-base-url/',
    }
    const url = getDevServerClientUrl(devServerConfig, undefined, undefined)
    expect(url).toBe(`http://1.2.3.4:3333/my-base-url${DEV_SERVER_URL}`)
  })
})

describe('isExtensionLessPath', () => {
  it('returns true for paths without extensions', () => {
    expect(isExtensionLessPath('http://stenciljs.com/')).toBe(true)
    expect(isExtensionLessPath('http://stenciljs.com/blog')).toBe(true)
    expect(isExtensionLessPath('http://stenciljs.com/blog/')).toBe(true)
  })

  it('returns false for paths with extensions', () => {
    expect(isExtensionLessPath('http://stenciljs.com/.')).toBe(false)
    expect(isExtensionLessPath('http://stenciljs.com/data.json')).toBe(false)
    expect(isExtensionLessPath('http://stenciljs.com/index.html')).toBe(false)
    expect(isExtensionLessPath('http://stenciljs.com/blog.html')).toBe(false)
  })
})

describe('isSsrStaticDataPath', () => {
  it('returns false for non-SSR paths', () => {
    expect(isSsrStaticDataPath('http://stenciljs.com/')).toBe(false)
    expect(isSsrStaticDataPath('http://stenciljs.com/index.html')).toBe(false)
  })

  it('returns true for SSR static data paths', () => {
    expect(isSsrStaticDataPath('http://stenciljs.com/page.state.json')).toBe(true)
  })
})

describe('getSsrStaticDataPath', () => {
  it('handles root path', () => {
    const req: HttpRequest = {
      url: new URL('http://stenciljs.com/page.static.json'),
      method: 'GET',
      acceptHeader: '',
      searchParams: null,
    }
    const r = getSsrStaticDataPath(req)
    expect(r.fileName).toBe('page.static.json')
    expect(r.hasQueryString).toBe(false)
    expect(r.ssrPath).toBe('http://stenciljs.com/')
  })

  it('handles path with query string and no trailing slash referer', () => {
    const req: HttpRequest = {
      url: new URL('http://stenciljs.com/blog/page.static.json?v=1234'),
      method: 'GET',
      acceptHeader: '',
      searchParams: null,
      headers: {
        Referer: 'http://stenciljs.com/page',
      },
    }
    const r = getSsrStaticDataPath(req)
    expect(r.fileName).toBe('page.static.json')
    expect(r.hasQueryString).toBe(true)
    expect(r.ssrPath).toBe('http://stenciljs.com/blog')
  })

  it('handles path with trailing slash referer', () => {
    const req: HttpRequest = {
      url: new URL('http://stenciljs.com/blog/page.static.json?v=1234'),
      method: 'GET',
      acceptHeader: '',
      searchParams: null,
      headers: {
        Referer: 'http://stenciljs.com/page/',
      },
    }
    const r = getSsrStaticDataPath(req)
    expect(r.fileName).toBe('page.static.json')
    expect(r.hasQueryString).toBe(true)
    expect(r.ssrPath).toBe('http://stenciljs.com/blog/')
  })
})
