import { MockHeaders } from './headers';

export type MockRequestInfo = MockRequest | string;

export interface MockRequestInit {
  body?: any;
  cache?: string;
  credentials?: string;
  headers?: any;
  integrity?: string;
  keepalive?: boolean;
  method?: string;
  mode?: string;
  redirect?: string;
  referrer?: string;
  referrerPolicy?: string;
}

export class MockRequest {
  private _method = 'GET';
  private _url = '/';

  bodyUsed = false;
  cache = 'default';
  credentials = 'same-origin';
  headers: MockHeaders;
  integrity = '';
  keepalive = false;
  mode = 'cors';
  redirect = 'follow';
  referrer = 'about:client';
  referrerPolicy = '';

  constructor(input?: any, init: MockRequestInit = {}) {
    if (typeof input === 'string') {
      this.url = input;
    } else if (input) {
      Object.assign(this, input);
      this.headers = new MockHeaders(input.headers);
    }

    Object.assign(this, init);

    if (init.headers) {
      this.headers = new MockHeaders(init.headers);
    }

    if (!this.headers) {
      this.headers = new MockHeaders();
    }
  }

  get url() {
    if (typeof this._url === 'string') {
      return new URL(this._url, location.href).href;
    }
    return new URL('/', location.href).href;
  }
  set url(value: string) {
    this._url = value;
  }

  get method() {
    if (typeof this._method === 'string') {
      return this._method.toUpperCase();
    }
    return 'GET';
  }
  set method(value: string) {
    this._method = value;
  }

  clone() {
    const clone = { ...this };
    clone.headers = new MockHeaders(this.headers);
    return new MockRequest(clone);
  }
}

// ReSPONSE

export interface MockResponseInit {
  headers?: any;
  ok?: boolean;
  status?: number;
  statusText?: string;
  type?: string;
  url?: string;
}

export class MockResponse {
  private _body: string;
  headers: MockHeaders;
  ok = true;
  status = 200;
  statusText = '';
  type = 'default';
  url = '';

  constructor(body?: string, init: MockResponseInit = {}) {
    this._body = body;
    if (init) {
      Object.assign(this, init);
    }
    this.headers = new MockHeaders(init.headers);
  }

  async json() {
    return JSON.parse(this._body);
  }

  async text() {
    return this._body;
  }

  clone() {
    const initClone = { ...this };
    initClone.headers = new MockHeaders(this.headers);
    return new MockResponse(this._body, initClone);
  }
}
