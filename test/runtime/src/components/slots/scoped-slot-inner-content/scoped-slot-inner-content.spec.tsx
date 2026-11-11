import { describe, it, expect } from '@stencil/vitest';

type InnerContentElement = HTMLElement & {
  count: number;
  componentOnReady?(): Promise<unknown>;
};

const ready = async (el: InnerContentElement) => {
  if (el.componentOnReady) return el.componentOnReady();
  await customElements.whenDefined(el.localName);
  await new Promise((r) => setTimeout(r, 50));
};

const setUp = async (property: 'innerHTML' | 'innerText', beforeFirstRender: boolean) => {
  const elm = document.createElement('scoped-slot-inner-content') as InnerContentElement;
  elm.innerHTML = '<i>original</i>';
  document.body.appendChild(elm);
  if (!beforeFirstRender) await ready(elm);

  elm[property] = 'Hello <b>bold</b> world';
  await ready(elm);
  elm.count = 1;
  await new Promise((r) => requestAnimationFrame(() => setTimeout(r)));

  const wrap = elm.querySelector('.wrap');
  const result = {
    count: wrap?.querySelector('.count')?.textContent,
    slotted: wrap?.innerHTML.replace(/<span[^>]*>.*?<\/span>/, '').replace(/<!--.*?-->/g, ''),
    text: elm.innerText,
  };
  elm.remove();
  return result;
};

describe('scoped-slot-inner-content', () => {
  it('renders innerHTML set before the first render in the default slot', async () => {
    expect(await setUp('innerHTML', true)).toEqual({
      count: '1',
      slotted: 'Hello <b>bold</b> world',
      text: '1Hello bold world',
    });
  });

  it('replaces only the slotted content when innerHTML is set after the first render', async () => {
    expect(await setUp('innerHTML', false)).toEqual({
      count: '1',
      slotted: 'Hello <b>bold</b> world',
      text: '1Hello bold world',
    });
  });

  it('inserts innerText as text, not markup', async () => {
    expect(await setUp('innerText', false)).toEqual({
      count: '1',
      slotted: 'Hello &lt;b&gt;bold&lt;/b&gt; world',
      text: '1Hello <b>bold</b> world',
    });
  });
});
