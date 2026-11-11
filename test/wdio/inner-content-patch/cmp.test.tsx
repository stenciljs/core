import { browser, expect } from '@wdio/globals';

describe('innerHTML / innerText patch', () => {
  const setUp = (property: 'innerHTML' | 'innerText', beforeFirstRender: boolean) =>
    browser.execute(
      async (property, beforeFirstRender) => {
        await customElements.whenDefined('inner-content-patch-scoped');
        const elm = document.createElement('inner-content-patch-scoped') as any;
        elm.innerHTML = '<i>original</i>';
        document.body.appendChild(elm);
        if (!beforeFirstRender) await elm.componentOnReady();

        elm[property] = 'Hello <b>bold</b> world';
        await elm.componentOnReady();
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
      },
      property,
      beforeFirstRender,
    );

  it('renders innerHTML set before the first render in the default slot', async () => {
    const result = await setUp('innerHTML', true);
    expect(result).toEqual({ count: '1', slotted: 'Hello <b>bold</b> world', text: '1Hello bold world' });
  });

  it('replaces only the slotted content when innerHTML is set after the first render', async () => {
    const result = await setUp('innerHTML', false);
    expect(result).toEqual({ count: '1', slotted: 'Hello <b>bold</b> world', text: '1Hello bold world' });
  });

  it('inserts innerText as text, not markup', async () => {
    const result = await setUp('innerText', false);
    expect(result).toEqual({
      count: '1',
      slotted: 'Hello &lt;b&gt;bold&lt;/b&gt; world',
      text: '1Hello <b>bold</b> world',
    });
  });
});
