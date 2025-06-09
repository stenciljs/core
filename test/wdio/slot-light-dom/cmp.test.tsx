import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('slot-light-dom', () => {
  beforeEach(async () => {
    render({
      template: () => <slot-light-dom-root></slot-light-dom-root>,
    });
  });
  it('renders light dom in correct slots', async () => {
    await $('.results1 article').waitForExist();
    let results = document.querySelector('.results1 article');
    expect(results.textContent).toBe('a');

    results = document.querySelector('.results2 article');
    expect(results.textContent).toBe('b');

    results = document.querySelector('.results3 article nav');
    expect(results.textContent).toBe('c');

    results = document.querySelector('.results4 article nav');
    expect(results.textContent).toBe('d');

    results = document.querySelector('.results4 article');
    expect(results.textContent).toBe('de');

    results = document.querySelector('.results5 article');
    expect(results.textContent).toBe('fg');

    results = document.querySelector('.results5 article nav');
    expect(results.textContent).toBe('g');

    results = document.querySelector('.results6 article');
    expect(results.textContent).toBe('hij');

    results = document.querySelector('.results6 article nav');
    expect(results.textContent).toBe('i');

    results = document.querySelector('.results7 article');
    expect(results.textContent).toBe('klm');

    let navs = document.querySelectorAll('.results7 article nav');
    expect(navs[0].textContent).toBe('k');
    expect(navs[1].textContent).toBe('l');
    expect(navs[2].textContent).toBe('m');

    const button = $('button');
    await button.click();
    await $('.results1 article').waitForExist();

    results = document.querySelector('.results1 article');
    expect(results.textContent).toBe('A');

    results = document.querySelector('.results2 article');
    expect(results.textContent).toBe('B');

    results = document.querySelector('.results3 article nav');
    expect(results.textContent).toBe('C');

    results = document.querySelector('.results4 article nav');
    expect(results.textContent).toBe('D');

    results = document.querySelector('.results4 article');
    expect(results.textContent).toBe('DE');

    results = document.querySelector('.results5 article');
    expect(results.textContent).toBe('FG');

    results = document.querySelector('.results5 article nav');
    expect(results.textContent).toBe('G');

    results = document.querySelector('.results6 article');
    expect(results.textContent).toBe('HIJ');

    results = document.querySelector('.results6 article nav');
    expect(results.textContent).toBe('I');

    results = document.querySelector('.results7 article');
    expect(results.textContent).toBe('KLM');

    navs = document.querySelectorAll('.results7 article nav');
    expect(navs[0].textContent).toBe('K');
    expect(navs[1].textContent).toBe('L');
    expect(navs[2].textContent).toBe('M');

    const hiddenCmp = document.querySelector('[hidden]');
    expect(hiddenCmp).toBe(null);
  });
});
