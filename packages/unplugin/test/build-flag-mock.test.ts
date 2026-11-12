import { describe, expect, it, vi } from 'vitest';

// Build flags are only folded in production builds, so mocking `Build` keeps working under Vitest
vi.mock('@stencil/core/runtime/client/standalone', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@stencil/core')>();
  return { ...actual, Build: { ...actual.Build, isServer: true, isBrowser: false } };
});

import './fixtures/my-build-flag';

describe('my-build-flag', () => {
  it('renders the server branch when Build is mocked', async () => {
    const el = document.createElement('my-build-flag') as HTMLElement & {
      componentOnReady?: () => Promise<void>;
    };
    document.body.appendChild(el);
    await el.componentOnReady?.();
    expect(el.shadowRoot!.querySelector('span.mode')!.textContent).toBe('server');
    el.remove();
  });
});
