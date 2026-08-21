import { canReuseWindow, getReusableWindow } from '../reusable-window';

describe('reusable hydrate window', () => {
  it('resets window and document state between renders', () => {
    const firstWindow = getReusableWindow('<div></div>', 'scoped');
    const location = firstWindow.location;
    const navigator = firstWindow.navigator;

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
    const hydrateApp = ((firstWindow as any).__stencilHydrateApp = jest.fn());

    const secondWindow = getReusableWindow('<span></span>', 'scoped');

    expect(secondWindow).toBe(firstWindow);
    expect((secondWindow as any).__stencilHydrateApp).toBe(hydrateApp);
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
    expect(secondWindow.document.documentElement.getAttribute('lang')).toBeNull();
    expect(secondWindow.document.documentElement.getAttribute('data-stencil-build')).toBeNull();
    expect(secondWindow.document.documentElement.getAttribute('class')).toBeNull();
    expect(secondWindow.document.body.innerHTML).toBe('<span></span>');
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

    expect((secondWindow as any).__listeners).toBeNull();
    expect((secondWindow.document as any).__listeners).toBeNull();
    expect(secondWindow.__timeouts.size).toBe(0);
    expect(secondWindow.__allowInterval).toBe(true);
    expect(secondWindow.__maxTimeout).toBe(60_000);
  });

  it('does not retain windows for per-component shadow root options', () => {
    const options = { scoped: ['state-reset-test'], default: 'declarative-shadow-dom' as const };

    expect(canReuseWindow(options)).toBe(false);
    expect(canReuseWindow('per-request-mode')).toBe(false);
  });
});
