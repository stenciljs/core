import { MockHeaders, MockRequestInfo, MockResponse } from '@stencil/core/mock-doc';

const mockedResponses = new Map<string, MockedResponseData>();

export function setupMockFetch(global: any) {
  const win = global.window;
  if (!('fetch' in win)) {
    win.fetch = function (input: MockRequestInfo) {
      return globalMockFetch(input);
    };
  }
  if (!('fetch' in global)) {
    global.fetch = function (input: MockRequestInfo) {
      return globalMockFetch(input);
    };
  }
}

async function globalMockFetch(requestInput: MockRequestInfo) {
  let requestUrl: string;
  if (requestInput == null) {
    throw new Error(`missing url input for mock fetch()`);
  } else if (typeof requestInput === 'string') {
    requestUrl = requestInput;
  } else if (typeof requestInput.url === 'string') {
    requestUrl = requestInput.url;
  } else {
    throw new Error(`invalid url for mock fetch()`);
  }

  requestUrl = new URL(requestUrl, location.href).href;

  let mockedData = mockedResponses.get(requestUrl);
  if (mockedData == null) {
    const defaultUrl = new URL(FETCH_DEFAULT_PATH, location.href);
    mockedData = mockedResponses.get(defaultUrl.href);
  }

  if (mockedData == null) {
    return new MockResponse404();
  }

  const mockedResponse = mockedData.response.clone();

  if (typeof mockedResponse.status !== 'number') {
    mockedResponse.status = 200;
  }

  if (typeof mockedResponse.statusText !== 'string') {
    if (mockedResponse.status >= 500) {
      mockedResponse.statusText = 'Internal Server Error';
    } else if (mockedResponse.status === 404) {
      mockedResponse.statusText = 'Not Found';
    } else if (mockedResponse.status >= 400) {
      mockedResponse.statusText = 'Bad Request';
    } else if (mockedResponse.status === 302) {
      mockedResponse.statusText = 'Found';
    } else if (mockedResponse.status === 301) {
      mockedResponse.statusText = 'Moved Permanently';
    } else if (mockedResponse.status >= 300) {
      mockedResponse.statusText = 'Redirection';
    } else {
      mockedResponse.statusText = 'OK';
    }
  }

  mockedResponse.ok = mockedResponse.status >= 200 && mockedResponse.status <= 299;

  if (typeof mockedResponse.type !== 'string') {
    mockedResponse.type = 'basic';
  }

  return mockedResponse;
}

function setMockedResponse(response: MockResponse, input: MockRequestInfo, reject: boolean) {
  if (!response) {
    throw new Error('MockResponse required');
  }
  if (typeof response.url !== 'string' || response.url === '') {
    if (typeof input === 'string') {
      response.url = input;
    } else if (input && typeof input.url === 'string') {
      response.url = input.url;
    } else {
      response.url = FETCH_DEFAULT_PATH;
    }
  }

  const u = new URL(response.url, location.href);
  response.url = u.href;

  const mockedResponseData: MockedResponseData = {
    response,
    reject,
  };

  mockedResponses.set(response.url, mockedResponseData);
}

export function mockFetchReset() {
  mockedResponses.clear();
}

export const mockFetch = {
  json(data: any, url: string) {
    const rsp = new MockResponse(JSON.stringify(data, null, 2), {
      headers: new MockHeaders({
        'Content-Type': 'application/json',
      }),
    });
    setMockedResponse(rsp, url, false);
  },

  text(data: string, url: string) {
    const rsp = new MockResponse(data, {
      headers: new MockHeaders({
        'Content-Type': 'text/plain',
      }),
    });
    setMockedResponse(rsp, url, false);
  },

  response(rsp: MockResponse, url: string) {
    setMockedResponse(rsp, url, false);
  },

  reject(rsp: MockResponse, url: string) {
    setMockedResponse(rsp, url, true);
  },

  reset: mockFetchReset,
};

class MockResponse404 extends MockResponse {
  override ok = false;
  override status = 404;
  override statusText = 'Not Found';
  constructor() {
    super('', {
      headers: new MockHeaders({
        'Content-Type': 'text/plain',
      }),
    });
  }
  override async json() {
    return { status: 404, statusText: 'Not Found' };
  }
  override async text() {
    return 'Not Found';
  }
}

interface MockedResponseData {
  response: MockResponse;
  reject: boolean;
}

const FETCH_DEFAULT_PATH = '/mock-fetch-data';

export {
  MockHeaders,
  MockRequest,
  MockRequestInfo,
  MockRequestInit,
  MockResponse,
  MockResponseInit,
} from '@stencil/core/mock-doc';
