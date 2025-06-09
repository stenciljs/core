import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('slot-basic', function () {
  beforeEach(() => {
    render({
      template: () => <slot-basic-root></slot-basic-root>,
    });
  });

  it('button click rerenders', async () => {
    const app = document.body;
    async function testValues(inc: number) {
      await $('slot-basic-root').waitForStable();
      let result = app.querySelector('.inc');
      expect(result.textContent).toEqual('Rendered: ' + inc);

      result = app.querySelector('.results1 article');
      expect(result.textContent).toEqual('AB');

      result = app.querySelector('.results2 article');
      expect(result.textContent).toEqual('AB');

      result = app.querySelector('.results2 article span');
      expect(result.textContent).toEqual('B');

      result = app.querySelector('.results3 article');
      expect(result.textContent).toEqual('AB');

      result = app.querySelector('.results3 article div');
      expect(result.textContent).toEqual('B');

      result = app.querySelector('.results4 article footer');
      expect(result.textContent).toEqual('AB');

      result = app.querySelector('.results4 article footer div');
      expect(result.textContent).toEqual('B');

      result = app.querySelector('.results5 article');
      expect(result.textContent).toEqual('AB');

      result = app.querySelector('.results5 article span');
      expect(result.textContent).toEqual('A');

      result = app.querySelector('.results6 article');
      expect(result.textContent).toEqual('AB');

      let results = app.querySelectorAll('.results6 article span');
      expect(results[0].textContent).toEqual('A');
      expect(results[1].textContent).toEqual('B');

      result = app.querySelector('.results7 article');
      expect(result.textContent).toEqual('AB');

      result = app.querySelector('.results7 article span');
      expect(result.textContent).toEqual('A');

      result = app.querySelector('.results7 article div');
      expect(result.textContent).toEqual('B');

      result = app.querySelector('.results8 article');
      expect(result.textContent).toEqual('AB');

      result = app.querySelector('.results8 article div');
      expect(result.textContent).toEqual('A');

      result = app.querySelector('.results9 article');
      expect(result.textContent).toEqual('AB');

      result = app.querySelector('.results9 article div');
      expect(result.textContent).toEqual('A');

      result = app.querySelector('.results9 article span');
      expect(result.textContent).toEqual('B');

      result = app.querySelector('.results10 article');
      expect(result.textContent).toEqual('AB');

      results = app.querySelectorAll('.results10 article div');
      expect(results[0].textContent).toEqual('A');
      expect(results[1].textContent).toEqual('B');

      result = app.querySelector('.results11 article');
      expect(result.textContent).toEqual('ABC');

      results = app.querySelectorAll('.results11 article div');
      expect(results[0].textContent).toEqual('A');
      expect(results[1].textContent).toEqual('B');
      expect(results[2].textContent).toEqual('C');

      result = app.querySelector('.results11 article footer');
      expect(result.textContent).toEqual('B');
    }

    await testValues(1);

    await $('button').click();
    await testValues(2);

    await $('button').click();
    await testValues(3);
  });
});
