import { canReuseWindow, getReusableWindow } from '../reusable-window';

describe('reusable hydrate window', () => {
  it('resets window and document state between renders', () => {
    const requestState = Symbol('requestState');
    const firstWindow = getReusableWindow('<div></div>', 'scoped');
    const location = firstWindow.location;
    const navigator = firstWindow.navigator;
    const screenOrientation = firstWindow.screen.orientation;
    const eventCounts = firstWindow.performance.eventCounts;
    const documentConstructor = firstWindow.Document;
    const defaultFetch = firstWindow.fetch;

    firstWindow.location.href = 'https://first.example/';
    firstWindow.navigator.userAgent = 'first-agent';
    (firstWindow.navigator as any).customState = 'first';
    firstWindow.localStorage.setItem('state', 'first');
    firstWindow.sessionStorage.setItem('state', 'first');
    firstWindow.document.cookie = 'session=first';
    (firstWindow.document as any).referrer = 'https://referrer.example/';
    firstWindow.document.documentElement.setAttribute('dir', 'rtl');
    firstWindow.document.documentElement.setAttribute('lang', 'ar');
    firstWindow.document.documentElement.setAttribute('data-stencil-build', 'first');
    firstWindow.document.documentElement.classList.add('hydrated');
    (firstWindow as any).requestState = 'first';
    (firstWindow.document as any).requestState = 'first';
    (firstWindow.document as any)[requestState] = 'first';
    firstWindow.innerWidth = 320;
    (firstWindow.performance as any).timeOrigin = 0;
    (firstWindow.performance.eventCounts as Map<string, number>).set('first', 1);
    (firstWindow.performance as any).requestState = 'first';
    Object.defineProperty(firstWindow.console, 'log', {
      configurable: true,
      enumerable: false,
      value: jest.fn(),
    });
    (firstWindow as any).fetch = jest.fn();

    const secondWindow = getReusableWindow(
      '<html lang="fr" data-request="second"><head><link rel="stylesheet" href="/style.css"></head><body><span></span></body></html>',
      'scoped',
    );

    expect(secondWindow).toBe(firstWindow);
    expect(secondWindow.location).toBe(location);
    expect(secondWindow.location.href).toBe('');
    expect(secondWindow.navigator).toBe(navigator);
    expect(secondWindow.navigator.userAgent).toBe('MockNavigator');
    expect((secondWindow.navigator as any).customState).toBeUndefined();
    expect(secondWindow.localStorage.getItem('state')).toBeNull();
    expect(secondWindow.sessionStorage.getItem('state')).toBeNull();
    expect(secondWindow.document.cookie).toBe('');
    expect(secondWindow.document.referrer).toBe('');
    expect(secondWindow.document.documentElement.getAttribute('dir')).toBeNull();
    expect(secondWindow.document.documentElement.getAttribute('lang')).toBe('fr');
    expect(secondWindow.document.documentElement.getAttribute('data-stencil-build')).toBeNull();
    expect(secondWindow.document.documentElement.getAttribute('class')).toBeNull();
    expect(secondWindow.document.documentElement.getAttribute('data-request')).toBe('second');
    expect(secondWindow.document.head.innerHTML).toBe('<link rel="stylesheet" href="/style.css">');
    expect(secondWindow.document.body.innerHTML).toBe('<span></span>');
    expect(secondWindow.document.documentElement.ownerDocument).toBe(secondWindow.document);
    expect(secondWindow.document.head.ownerDocument).toBe(secondWindow.document);
    expect(secondWindow.document.body.ownerDocument).toBe(secondWindow.document);
    expect(secondWindow.document.querySelector('span').ownerDocument).toBe(secondWindow.document);
    expect((secondWindow as any).requestState).toBeUndefined();
    expect((secondWindow.document as any).requestState).toBeUndefined();
    expect((secondWindow.document as any)[requestState]).toBeUndefined();
    expect(secondWindow.innerWidth).toBe(1366);
    expect(secondWindow.screen.orientation).toBe(screenOrientation);
    expect(secondWindow.performance.timeOrigin).not.toBe(0);
    expect(secondWindow.performance.eventCounts).toBe(eventCounts);
    expect((secondWindow.performance.eventCounts as Map<string, number>).size).toBe(0);
    expect((secondWindow.performance as any).requestState).toBeUndefined();
    expect(secondWindow.console.log).not.toHaveProperty('_isMockFunction');
    expect(secondWindow.fetch).toBe(defaultFetch);
    expect(secondWindow.customElements).toBeUndefined();
    expect(secondWindow.Document).not.toBe(documentConstructor);
  });

  it('clears listeners and timers between renders', () => {
    const firstWindow = getReusableWindow('<div></div>', false);
    const listener = jest.fn();
    firstWindow.addEventListener('render', listener);
    firstWindow.document.addEventListener('render', listener);
    firstWindow.setTimeout(listener, 60_000);
    firstWindow.__allowInterval = false;
    firstWindow.__maxTimeout = 0;

    const secondWindow = getReusableWindow('<span></span>', false);

    expect((secondWindow as any).__listeners).toBeUndefined();
    expect((secondWindow.document as any).__listeners).toBeUndefined();
    expect(secondWindow.__timeouts).toBeUndefined();
    expect(secondWindow.__allowInterval).toBe(true);
    expect(secondWindow.__maxTimeout).toBe(60_000);
    expect(secondWindow.__setTimeout).toBeDefined();
    expect(secondWindow.__clearTimeout).toBeDefined();
  });

  it('evicts a reusable window when resetting it fails', () => {
    const firstWindow = getReusableWindow('<div></div>', 'declarative-shadow-dom');
    Object.defineProperty(firstWindow.location, 'poisoned', {
      configurable: false,
      enumerable: true,
      value: true,
    });

    expect(() => getReusableWindow('<span></span>', 'declarative-shadow-dom')).toThrow();

    const replacementWindow = getReusableWindow('<span></span>', 'declarative-shadow-dom');
    expect(replacementWindow).not.toBe(firstWindow);
    expect(replacementWindow.document.body.innerHTML).toBe('<span></span>');
  });

  it('does not retain windows for per-component shadow root options', () => {
    const options = { scoped: ['state-reset-test'], default: 'declarative-shadow-dom' as const };

    expect(canReuseWindow(options)).toBe(false);
    expect(canReuseWindow('per-request-mode')).toBe(false);
  });
});
