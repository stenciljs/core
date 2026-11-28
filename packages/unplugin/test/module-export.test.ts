import { describe, expect, it } from 'vitest';

import { MyModuleCmp } from './fixtures/module-export/my-module-cmp';

describe("componentExport: 'module'", () => {
  it('does not register the tag on import', () => {
    expect(customElements.get('my-module-cmp')).toBeUndefined();
  });

  it('renders once the consumer defines it', async () => {
    customElements.define('my-module-cmp', MyModuleCmp as unknown as CustomElementConstructor);
    const el = document.createElement('my-module-cmp') as HTMLElement & {
      name?: string;
      componentOnReady: () => Promise<void>;
    };
    el.name = 'Stencil';
    document.body.appendChild(el);
    await el.componentOnReady();
    expect(el.shadowRoot!.querySelector('.greeting')!.textContent).toBe('Hello, Stencil!');
    el.remove();
  });
});
