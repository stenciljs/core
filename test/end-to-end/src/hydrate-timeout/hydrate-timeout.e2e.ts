export {};

// @ts-ignore may not be existing when project hasn't been built
type HydrateModule = typeof import('../../hydrate');
let renderToString: HydrateModule['renderToString'];

describe('hydrate timeout aborts in-flight component work', () => {
  let originalFetch: any;
  let fetchCalls: { input: any; init: any }[];

  beforeAll(async () => {
    // @ts-ignore may not be existing when project hasn't been built
    const mod = await import('../../hydrate');
    renderToString = mod.renderToString;
  });

  beforeEach(() => {
    fetchCalls = [];
    originalFetch = (global as any).fetch;
    // A fetch that never settles on its own - standing in for a slow
    // upstream API a component might be calling during SSR. It only settles
    // if the caller's AbortSignal fires, so a passing test proves the render
    // actually cancelled it rather than merely failing to wait for it.
    (global as any).fetch = (input: any, init: any) => {
      fetchCalls.push({ input, init });
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const err: any = new Error('The operation was aborted');
          err.name = 'AbortError';
          reject(err);
        });
      });
    };
  });

  afterEach(() => {
    (global as any).fetch = originalFetch;
  });

  it('resolves at the timeout and cancels the pending fetch instead of waiting for it', async () => {
    const start = Date.now();
    const result = await renderToString(`<slow-fetch-cmp url="https://example.test/slow"></slow-fetch-cmp>`, {
      timeout: 50,
      fullDocument: false,
    });
    const elapsed = Date.now() - start;

    // Generous upper bound: this checks we did NOT wait anywhere close to a
    // second full timeout window not a tight timing budget.
    expect(elapsed).toBeLessThan(1000);
    expect(result.diagnostics.some((d: any) => d.messageText.includes('Hydrate exceeded timeout'))).toBe(true);

    expect(fetchCalls.length).toBe(1);
    expect(fetchCalls[0].init?.signal?.aborted).toBe(true);
  });

  it("cascades to a component's own AbortController for non-fetch cancellable work", async () => {
    delete (global as any).__ownControllerOutcome;

    const result = await renderToString(`<own-controller-cmp></own-controller-cmp>`, {
      timeout: 50,
      fullDocument: false,
    });

    expect(result.diagnostics.some((d: any) => d.messageText.includes('Hydrate exceeded timeout'))).toBe(true);
    expect((global as any).__ownControllerOutcome).toEqual({ ok: false, name: 'AbortError' });
  });
});
