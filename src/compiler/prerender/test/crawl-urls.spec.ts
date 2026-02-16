import type * as d from '../../../declarations';
import { crawlAnchorsForNextUrls } from '../crawl-urls';

describe('crawlAnchorsForNextUrls', () => {
  let prerenderConfig: d.PrerenderConfig;
  let diagnostics: d.Diagnostic[];
  let baseUrl: URL;
  let currentUrl: URL;
  let parsedAnchors: d.HydrateAnchorElement[];

  beforeEach(() => {
    prerenderConfig = {};
    diagnostics = [];
    baseUrl = new URL('http://stenciljs.com/');
    currentUrl = new URL('http://stenciljs.com/docs');
  });

  it('user filterUrl()', () => {
    parsedAnchors = [{ href: '/docs' }, { href: '/docs/v3' }, { href: '/docs/v3/components' }];
    prerenderConfig.filterUrl = function (url) {
      if (url.pathname.startsWith('/docs/v3')) {
        return false;
      }
      return true;
    };

    const hrefs = crawlAnchorsForNextUrls(prerenderConfig, diagnostics, baseUrl, currentUrl, parsedAnchors);
    expect(diagnostics).toHaveLength(0);

    expect(hrefs).toHaveLength(1);
    expect(hrefs[0]).toBe('http://stenciljs.com/docs');
  });

  it('user normalizeUrl()', () => {
    parsedAnchors = [{ href: '/doczz' }, { href: '/docs' }];
    prerenderConfig.normalizeUrl = function (href, base) {
      const url = new URL(href, base);

      if (url.pathname === '/doczz') {
        url.pathname = '/docs';
      }

      return url;
    };

    const hrefs = crawlAnchorsForNextUrls(prerenderConfig, diagnostics, baseUrl, currentUrl, parsedAnchors);
    expect(diagnostics).toHaveLength(0);

    expect(hrefs).toHaveLength(1);
    expect(hrefs[0]).toBe('http://stenciljs.com/docs');
  });

  it('user filterAnchor()', () => {
    parsedAnchors = [
      { href: '/docs' },
      { href: '/docs/about-us', 'data-prerender': 'yes-plz' },
      { href: '/docs/app', 'data-prerender': 'no-prerender' },
    ];
    prerenderConfig.filterAnchor = function (anchor) {
      if (anchor['data-prerender'] === 'no-prerender') {
        return false;
      }
      return true;
    };

    const hrefs = crawlAnchorsForNextUrls(prerenderConfig, diagnostics, baseUrl, currentUrl, parsedAnchors);
    expect(diagnostics).toHaveLength(0);

    expect(hrefs).toHaveLength(2);
    expect(hrefs[0]).toBe('http://stenciljs.com/docs');
    expect(hrefs[1]).toBe('http://stenciljs.com/docs/about-us');
  });

  it('normalize with encoded characters', () => {
    parsedAnchors = [{ href: '/about%20us' }, { href: '/about us' }];

    const hrefs = crawlAnchorsForNextUrls(prerenderConfig, diagnostics, baseUrl, currentUrl, parsedAnchors);
    expect(diagnostics).toHaveLength(0);

    expect(hrefs).toHaveLength(1);
    expect(hrefs[0]).toBe('http://stenciljs.com/about%20us');
  });

  it('normalize with trailing slash', () => {
    prerenderConfig.trailingSlash = true;
    parsedAnchors = [
      { href: '/' },
      { href: '/about-us' },
      { href: '/about-us/' },
      { href: '/docs' },
      { href: '/docs/' },
      { href: '/docs/index.html' },
    ];

    const hrefs = crawlAnchorsForNextUrls(prerenderConfig, diagnostics, baseUrl, currentUrl, parsedAnchors);
    expect(diagnostics).toHaveLength(0);

    expect(hrefs).toHaveLength(3);
    expect(hrefs[0]).toBe('http://stenciljs.com/');
    expect(hrefs[1]).toBe('http://stenciljs.com/about-us/');
    expect(hrefs[2]).toBe('http://stenciljs.com/docs/');
  });

  it('normalize without trailing slash', () => {
    parsedAnchors = [
      { href: '/' },
      { href: '/about-us' },
      { href: '/about-us/' },
      { href: '/docs' },
      { href: '/docs/' },
      { href: '/docs/index.html' },
    ];

    const hrefs = crawlAnchorsForNextUrls(prerenderConfig, diagnostics, baseUrl, currentUrl, parsedAnchors);
    expect(diagnostics).toHaveLength(0);

    expect(hrefs).toHaveLength(3);
    expect(hrefs[0]).toBe('http://stenciljs.com/');
    expect(hrefs[1]).toBe('http://stenciljs.com/about-us');
    expect(hrefs[2]).toBe('http://stenciljs.com/docs');
  });

  it('skip directories below base path', () => {
    baseUrl = new URL('http://stenciljs.com/docs');
    parsedAnchors = [
      { href: '/' },
      { href: '/about-us' },
      { href: '/contact-us' },
      { href: '/docs' },
      { href: '/docs/components' },
    ];

    const hrefs = crawlAnchorsForNextUrls(prerenderConfig, diagnostics, baseUrl, currentUrl, parsedAnchors);
    expect(diagnostics).toHaveLength(0);

    expect(hrefs).toHaveLength(2);
    expect(hrefs[0]).toBe('http://stenciljs.com/docs');
    expect(hrefs[1]).toBe('http://stenciljs.com/docs/components');
  });

  it('skip different domains', () => {
    parsedAnchors = [
      { href: '/' },
      { href: '/docs' },
      { href: 'https://stenciljs.com/' },
      { href: 'https://ionicframework.com/' },
      { href: 'https://ionicframework.com/docs' },
      { href: 'https://ionicons.com/' },
    ];

    const hrefs = crawlAnchorsForNextUrls(prerenderConfig, diagnostics, baseUrl, currentUrl, parsedAnchors);
    expect(diagnostics).toHaveLength(0);

    expect(hrefs).toHaveLength(2);
    expect(hrefs[0]).toBe('http://stenciljs.com/');
    expect(hrefs[1]).toBe('http://stenciljs.com/docs');
  });

  it('skip targets that arent _self', () => {
    parsedAnchors = [
      { href: '/docs', target: '_self' },
      { href: '/whatever', target: '_blank' },
      { href: '/about-us', target: 'custom-target' },
    ];

    const hrefs = crawlAnchorsForNextUrls(prerenderConfig, diagnostics, baseUrl, currentUrl, parsedAnchors);
    expect(diagnostics).toHaveLength(0);

    expect(hrefs).toHaveLength(1);
    expect(hrefs[0]).toBe('http://stenciljs.com/docs');
  });

  it('trim up hrefs', () => {
    parsedAnchors = [{ href: '/     ' }, { href: '  /' }, { href: '  /  ' }];

    const hrefs = crawlAnchorsForNextUrls(prerenderConfig, diagnostics, baseUrl, currentUrl, parsedAnchors);
    expect(diagnostics).toHaveLength(0);

    expect(hrefs).toHaveLength(1);
    expect(hrefs[0]).toBe('http://stenciljs.com/');
  });

  it('disregard querystring', () => {
    parsedAnchors = [{ href: '/?' }, { href: '/?some=querystring' }, { href: '/?some=querystring2' }];

    const hrefs = crawlAnchorsForNextUrls(prerenderConfig, diagnostics, baseUrl, currentUrl, parsedAnchors);
    expect(diagnostics).toHaveLength(0);

    expect(hrefs).toHaveLength(1);
    expect(hrefs[0]).toBe('http://stenciljs.com/');
  });

  it('disregard hash', () => {
    parsedAnchors = [{ href: '/#' }, { href: '/#some-hash' }, { href: '/#some-hash2' }];

    const hrefs = crawlAnchorsForNextUrls(prerenderConfig, diagnostics, baseUrl, currentUrl, parsedAnchors);
    expect(diagnostics).toHaveLength(0);

    expect(hrefs).toHaveLength(1);
    expect(hrefs[0]).toBe('http://stenciljs.com/');
  });

  it('normalize https protocol', () => {
    currentUrl = new URL('https://stenciljs.com/docs');
    parsedAnchors = [{ href: 'http://stenciljs.com/' }, { href: 'https://stenciljs.com/' }];

    const hrefs = crawlAnchorsForNextUrls(prerenderConfig, diagnostics, baseUrl, currentUrl, parsedAnchors);
    expect(diagnostics).toHaveLength(0);

    expect(hrefs).toHaveLength(1);
    expect(hrefs[0]).toBe('https://stenciljs.com/');
  });

  it('normalize protocol', () => {
    currentUrl = new URL('http://stenciljs.com/docs');
    parsedAnchors = [{ href: 'http://stenciljs.com/' }, { href: 'https://stenciljs.com/' }];

    const hrefs = crawlAnchorsForNextUrls(prerenderConfig, diagnostics, baseUrl, currentUrl, parsedAnchors);
    expect(diagnostics).toHaveLength(0);

    expect(hrefs).toHaveLength(1);
    expect(hrefs[0]).toBe('http://stenciljs.com/');
  });

  it('normalize /docs/index.htm', () => {
    parsedAnchors = [{ href: '/docs/index.htm' }, { href: './docs/index.htm' }];

    const hrefs = crawlAnchorsForNextUrls(prerenderConfig, diagnostics, baseUrl, currentUrl, parsedAnchors);
    expect(diagnostics).toHaveLength(0);

    expect(hrefs).toHaveLength(1);
    expect(hrefs[0]).toBe('http://stenciljs.com/docs');
  });

  it('normalize index.html', () => {
    parsedAnchors = [{ href: '/index.html' }, { href: './index.html' }];

    const hrefs = crawlAnchorsForNextUrls(prerenderConfig, diagnostics, baseUrl, currentUrl, parsedAnchors);
    expect(diagnostics).toHaveLength(0);

    expect(hrefs).toHaveLength(1);
    expect(hrefs[0]).toBe('http://stenciljs.com/');
  });

  it('parse absolute paths', () => {
    parsedAnchors = [{ href: 'http://stenciljs.com/' }, { href: 'http://stenciljs.com/docs' }];

    const hrefs = crawlAnchorsForNextUrls(prerenderConfig, diagnostics, baseUrl, currentUrl, parsedAnchors);
    expect(diagnostics).toHaveLength(0);

    expect(hrefs).toHaveLength(2);
    expect(hrefs[0]).toBe('http://stenciljs.com/');
    expect(hrefs[1]).toBe('http://stenciljs.com/docs');
  });

  it('parse relative paths', () => {
    parsedAnchors = [
      { href: '/' },
      { href: './' },
      { href: './docs/../docs/../' },
      { href: '/docs' },
      { href: '/docs/../' },
      { href: '/docs/..' },
    ];

    const hrefs = crawlAnchorsForNextUrls(prerenderConfig, diagnostics, baseUrl, currentUrl, parsedAnchors);
    expect(diagnostics).toHaveLength(0);

    expect(hrefs).toHaveLength(2);
    expect(hrefs[0]).toBe('http://stenciljs.com/');
    expect(hrefs[1]).toBe('http://stenciljs.com/docs');
  });

  it('do nothing for invalid hrefs', () => {
    parsedAnchors = [
      { href: '' },
      { href: '     ' },
      { href: '#' },
      { href: '#some-hash' },
      { href: '?' },
      { href: '?some=querystring' },
    ];

    const hrefs = crawlAnchorsForNextUrls(prerenderConfig, diagnostics, baseUrl, currentUrl, parsedAnchors);
    expect(diagnostics).toHaveLength(0);

    expect(hrefs).toHaveLength(0);
  });

  it('do nothing for empty array', () => {
    parsedAnchors = [];

    const hrefs = crawlAnchorsForNextUrls(prerenderConfig, diagnostics, baseUrl, currentUrl, parsedAnchors);
    expect(diagnostics).toHaveLength(0);

    expect(hrefs).toHaveLength(0);
  });

  it('do nothing for invalid parsedAnchors', () => {
    parsedAnchors = null;

    const hrefs = crawlAnchorsForNextUrls(prerenderConfig, diagnostics, baseUrl, currentUrl, parsedAnchors);
    expect(diagnostics).toHaveLength(0);

    expect(hrefs).toHaveLength(0);
  });
});
