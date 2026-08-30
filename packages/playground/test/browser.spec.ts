import { describe, expect, it } from 'vitest';

import { defineCustomElements } from '../dist/loader-bundle/loader/index.js';
await defineCustomElements();

describe('stencil-playground', () => {
  it('compiles user-typed source and renders it in the sandboxed preview iframe', async () => {
    const el = document.createElement('stencil-playground');
    document.body.appendChild(el);

    const result = await new Promise<{ ok: boolean; message?: string }>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('timed out waiting for previewResult')),
        20000,
      );
      el.addEventListener('previewResult', ((ev: CustomEvent) => {
        clearTimeout(timer);
        resolve(ev.detail);
      }) as EventListener);
    });

    expect(result).toEqual({ ok: true, message: undefined });

    el.remove();
  }, 30000);
});
