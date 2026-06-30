import { describe, expect, it } from 'vitest';

import './fixtures/my-greeting';
import './fixtures/my-styled';
import './fixtures/my-scss';
import './fixtures/my-less';
import './fixtures/my-derived';
import './fixtures/my-deep-derived';
import './fixtures/my-mixin-cmp';
import './fixtures/my-cross-mixin-cmp';
import './fixtures/my-lightdom-patches';

async function ready(el: HTMLElement) {
  const stencilEl = el as HTMLElement & { componentOnReady?: () => Promise<void> };
  if (typeof stencilEl.componentOnReady === 'function') {
    await stencilEl.componentOnReady();
  }
}

describe('my-greeting', () => {
  it('renders with the default prop', async () => {
    const el = document.createElement('my-greeting');
    document.body.appendChild(el);
    await ready(el);
    expect(el.shadowRoot!.querySelector('.greeting')!.textContent).toBe('Hello, World!');
    el.remove();
  });

  it('reflects a prop set before connection', async () => {
    const el = document.createElement('my-greeting') as HTMLElement & { name?: string };
    el.name = 'Stencil';
    document.body.appendChild(el);
    await ready(el);
    expect(el.shadowRoot!.querySelector('.greeting')!.textContent).toBe('Hello, Stencil!');
    el.remove();
  });

  it('re-renders when a prop changes after connection', async () => {
    const el = document.createElement('my-greeting') as HTMLElement & { name?: string };
    document.body.appendChild(el);
    await ready(el);
    el.name = 'Updated';
    await new Promise((r) => setTimeout(r, 100));
    expect(el.shadowRoot!.querySelector('.greeting')!.textContent).toBe('Hello, Updated!');
    el.remove();
  });
});

describe('my-styled', () => {
  it('applies component CSS — computed background is coral', async () => {
    const el = document.createElement('my-styled');
    document.body.appendChild(el);
    await ready(el);
    expect(getComputedStyle(el.querySelector('.box')!).backgroundColor).toBe('rgb(255, 127, 80)');
    el.remove();
  });
});

describe('my-scss', () => {
  it('compiles SCSS — computed background is rebeccapurple', async () => {
    const el = document.createElement('my-scss');
    document.body.appendChild(el);
    await ready(el);
    expect(getComputedStyle(el.shadowRoot!.querySelector('.box')!).backgroundColor).toBe(
      'rgb(102, 51, 153)',
    );
    el.remove();
  });
});

describe('my-less', () => {
  it('compiles LESS — computed background is steelblue', async () => {
    const el = document.createElement('my-less');
    document.body.appendChild(el);
    await ready(el);
    expect(getComputedStyle(el.shadowRoot!.querySelector('.box')!).backgroundColor).toBe(
      'rgb(70, 130, 180)',
    );
    el.remove();
  });
});

describe('my-deep-derived', () => {
  it('renders middleProp and deepProp from a 3-level cross-file chain', async () => {
    const el = document.createElement('my-deep-derived');
    document.body.appendChild(el);
    await ready(el);
    expect(el.shadowRoot!.querySelector('div')!.textContent).toBe('from middle / from deep');
    el.remove();
  });

  it('re-renders when middleProp (inherited) changes', async () => {
    const el = document.createElement('my-deep-derived') as HTMLElement & { middleProp?: string };
    document.body.appendChild(el);
    await ready(el);
    el.middleProp = 'override';
    await new Promise((r) => setTimeout(r, 100));
    expect(el.shadowRoot!.querySelector('div')!.textContent).toBe('override / from deep');
    el.remove();
  });
});

describe('my-mixin-cmp', () => {
  it('inline mixin method is callable and renders correctly', async () => {
    const el = document.createElement('my-mixin-cmp');
    document.body.appendChild(el);
    await ready(el);
    expect(el.shadowRoot!.querySelector('.msg')!.textContent).toBe('Hello, World!');
    el.remove();
  });

  it('own @Prop re-renders via the mixin component', async () => {
    const el = document.createElement('my-mixin-cmp') as HTMLElement & { name?: string };
    document.body.appendChild(el);
    await ready(el);
    el.name = 'Stencil';
    await new Promise((r) => setTimeout(r, 100));
    expect(el.shadowRoot!.querySelector('.msg')!.textContent).toBe('Hello, Stencil!');
    el.remove();
  });
});

describe('my-cross-mixin-cmp', () => {
  it('cross-file mixin field is accessible and renders correctly', async () => {
    const el = document.createElement('my-cross-mixin-cmp');
    document.body.appendChild(el);
    await ready(el);
    expect(el.shadowRoot!.querySelector('.msg')!.textContent).toBe('World!');
    el.remove();
  });

  it('own @Prop re-renders via the cross-file mixin component', async () => {
    const el = document.createElement('my-cross-mixin-cmp') as HTMLElement & { name?: string };
    document.body.appendChild(el);
    await ready(el);
    el.name = 'Stencil';
    await new Promise((r) => setTimeout(r, 100));
    expect(el.shadowRoot!.querySelector('.msg')!.textContent).toBe('Stencil!');
    el.remove();
  });
});

describe('my-derived', () => {
  it('renders both inherited baseProp and own ownProp with defaults', async () => {
    const el = document.createElement('my-derived');
    document.body.appendChild(el);
    await ready(el);
    expect(el.shadowRoot!.querySelector('div')!.textContent).toBe('from base / from derived');
    el.remove();
  });

  it('re-renders when ownProp changes', async () => {
    const el = document.createElement('my-derived') as HTMLElement & { ownProp?: string };
    document.body.appendChild(el);
    await ready(el);
    el.ownProp = 'override';
    await new Promise((r) => setTimeout(r, 100));
    expect(el.shadowRoot!.querySelector('div')!.textContent).toBe('from base / override');
    el.remove();
  });
});

describe('my-lightdom-patches', () => {
  it('renders light DOM content *not* with patched behavior (auto-detected via stencil.config)', async () => {
    const el = document.createElement('my-lightdom-patches');
    el.innerHTML = '<div class="lightdom">Light DOM content</div>';
    document.body.appendChild(el);
    await ready(el);
    expect(el.textContent).toBe('Light DOM Patches TestLight DOM content');
    el.remove();
  });
});
