import { setupDomTests } from '../jest-dom-utils';

describe('vite-bundle', () => {
  const { setupDom, tearDownDom } = setupDomTests(document);
  let app: HTMLElement;

  beforeEach(async () => {
    app = await setupDom('/test/bundler/vite-bundle-test/dist/index.html');
  });
  afterEach(tearDownDom);

  it('should load content from dynamic import', () => {
    const cmpShadowRoot = app.querySelector('my-component')?.shadowRoot;
    expect(cmpShadowRoot).toBeTruthy();
    expect(cmpShadowRoot!.textContent?.trim()).toBe("Hello, World! I'm Stencil 'Don't call me a framework' JS");
  });
});
