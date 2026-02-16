import { MockHeaders } from '../headers';
import { MockRequest, MockResponse } from '../request-response';

describe('MockRequest', () => {
  it('no input defaults', () => {
    const request = new MockRequest();
    expect(request.bodyUsed).toBe(false);
    expect(request.cache).toBe('default');
    expect(request.credentials).toBe('same-origin');
    expect(request.headers).toBeDefined();
    expect(request.integrity).toBe('');
    expect(request.keepalive).toBe(false);
    expect(request.method).toBe('GET');
    expect(request.mode).toBe('cors');
    expect(request.redirect).toBe('follow');
    expect(request.referrer).toBe('about:client');
    expect(request.referrerPolicy).toBe('');
    expect(request.url).toBe('http://testing.stenciljs.com/');
  });

  it('string url', () => {
    const request = new MockRequest('/my-url');
    expect(request.bodyUsed).toBe(false);
    expect(request.cache).toBe('default');
    expect(request.credentials).toBe('same-origin');
    expect(request.headers).toBeDefined();
    expect(request.integrity).toBe('');
    expect(request.keepalive).toBe(false);
    expect(request.method).toBe('GET');
    expect(request.mode).toBe('cors');
    expect(request.redirect).toBe('follow');
    expect(request.referrer).toBe('about:client');
    expect(request.referrerPolicy).toBe('');
    expect(request.url).toBe('http://testing.stenciljs.com/my-url');
  });

  it('request input', () => {
    const headers = new MockHeaders();
    headers.set('x-header', 'value');
    const request = new MockRequest({
      cache: 'no-cache',
      method: 'post',
      url: '/request-url',
      headers,
    });
    expect(request.bodyUsed).toBe(false);
    expect(request.cache).toBe('no-cache');
    expect(request.credentials).toBe('same-origin');
    expect(request.headers).toBeDefined();
    expect(request.integrity).toBe('');
    expect(request.keepalive).toBe(false);
    expect(request.method).toBe('POST');
    expect(request.mode).toBe('cors');
    expect(request.redirect).toBe('follow');
    expect(request.referrer).toBe('about:client');
    expect(request.referrerPolicy).toBe('');
    expect(request.url).toBe('http://testing.stenciljs.com/request-url');
    expect(request.headers.get('x-header')).toBe('value');

    const requestCloned = request.clone();
    expect(request.url).toBe('http://testing.stenciljs.com/request-url');
    expect(requestCloned.cache).toBe('no-cache');
    expect(requestCloned.headers).not.toBe(request.headers);
    expect(requestCloned.headers.get('x-header')).toBe('value');
  });

  it('request input and init headers w/ Headers', () => {
    const headers = new MockHeaders();
    headers.set('x-header', 'value');
    const request = new MockRequest('/url', {
      headers,
      method: 'POST',
      cache: 'no-cache',
    });
    expect(request.cache).toBe('no-cache');
    expect(request.method).toBe('POST');
    expect(request.headers).not.toBe(headers);
    expect(request.headers.get('x-header')).toBe('value');
  });

  it('request input and init headers w/ object', () => {
    const headers = {
      'x-header': 'value',
    };
    const request = new MockRequest('/url', {
      headers,
    });
    expect(request.headers.get('x-header')).toBe('value');
  });
});

describe('MockResponse', () => {
  it('default', () => {
    const response = new MockResponse();
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(response.statusText).toBe('');
    expect(response.type).toBe('default');
    expect(response.url).toBe('');
    expect(response.headers).toBeDefined();
  });

  it('init', () => {
    const response = new MockResponse('body', {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      type: 'basic',
      headers: {
        'X-HeadeR': 88,
      },
    });
    expect(response.ok).toBe(false);
    expect(response.status).toBe(404);
    expect(response.statusText).toBe('Not Found');
    expect(response.type).toBe('basic');
    expect(response.headers.get('x-header')).toBe('88');

    const cloned = response.clone();
    expect(cloned.ok).toBe(false);
    expect(cloned.status).toBe(404);
    expect(cloned.statusText).toBe('Not Found');
    expect(cloned.type).toBe('basic');
    expect(cloned.headers.get('x-header')).toBe('88');
    expect(cloned.headers).not.toBe(response.headers);
  });

  it('text body', async () => {
    const response = new MockResponse('text');
    expect(await response.text()).toBe('text');
  });

  it('json body', async () => {
    const response = new MockResponse(JSON.stringify({ data: 88 }));
    expect((await response.json()).data).toBe(88);
  });
});
