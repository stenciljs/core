import { Component, Element } from '@stencil/core';

describe('component class only', () => {
  it('raw class without newSpecPage', async () => {
    @Component({
      tag: 'cmp-a',
    })
    class CmpA {
      sumb(a: number, b: number) {
        return a + b;
      }
    }

    const instance = new CmpA();
    expect(instance.sumb(67, 21)).toEqual(88);
  });

  it('mock element', async () => {
    @Component({
      tag: 'cmp-a',
    })
    class CmpA {
      @Element() elm: HTMLElement;
    }

    const instance = new CmpA();
    expect(instance.elm.tagName).toEqual('CMP-A');
  });
});
