import { Component, ComponentInterface, h, Prop, setErrorHandler } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

describe('component error handling', () => {
  it('calls a handler with an error and element during every lifecycle hook and render', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA implements ComponentInterface {
      @Prop() reRender = false;

      componentWillLoad() {
        throw new Error('componentWillLoad');
      }

      componentDidLoad() {
        throw new Error('componentDidLoad');
      }

      componentWillRender() {
        throw new Error('componentWillRender');
      }

      componentDidRender() {
        throw new Error('componentDidRender');
      }

      componentWillUpdate() {
        throw new Error('componentWillUpdate');
      }

      componentDidUpdate() {
        throw new Error('componentDidUpdate');
      }

      render() {
        if (!this.reRender) return <div></div>;
        else throw new Error('render');
      }
    }

    const customErrorHandler = (e: Error, el: HTMLElement) => {
      if (!el) return;
      el.dispatchEvent(
        new CustomEvent('componentError', {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: e,
        }),
      );
    };
    setErrorHandler(customErrorHandler);

    const { doc, waitForChanges } = await newSpecPage({
      components: [CmpA],
      html: ``,
    });

    const handler = jest.fn();
    doc.addEventListener('componentError', handler);
    const cmpA = document.createElement('cmp-a') as any;
    doc.body.appendChild(cmpA);
    try {
      await waitForChanges();
    } catch (e) {}

    cmpA.reRender = true;
    try {
      await waitForChanges();
    } catch (e) {}

    return Promise.resolve().then(() => {
      expect(handler).toHaveBeenCalledTimes(9);
      expect(handler.mock.calls[0][0].bubbles).toBe(true);
      expect(handler.mock.calls[0][0].cancelable).toBe(true);
      expect(handler.mock.calls[0][0].detail).toStrictEqual(Error('componentWillLoad'));
      expect(handler.mock.calls[1][0].detail).toStrictEqual(Error('componentWillRender'));
      expect(handler.mock.calls[2][0].detail).toStrictEqual(Error('componentDidRender'));
      expect(handler.mock.calls[3][0].detail).toStrictEqual(Error('componentDidLoad'));
      expect(handler.mock.calls[4][0].detail).toStrictEqual(Error('componentWillUpdate'));
      expect(handler.mock.calls[5][0].detail).toStrictEqual(Error('componentWillRender'));
      expect(handler.mock.calls[6][0].detail).toStrictEqual(Error('render'));
      expect(handler.mock.calls[7][0].detail).toStrictEqual(Error('componentDidRender'));
      expect(handler.mock.calls[8][0].detail).toStrictEqual(Error('componentDidUpdate'));
    });
  });
});
