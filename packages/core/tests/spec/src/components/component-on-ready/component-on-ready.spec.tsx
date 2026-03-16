import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

describe('component-on-ready', () => {
  it('should resolve componentOnReady promise when component is ready', async () => {
    const { root } = await render<HTMLComponentOnReadyElement>(<component-on-ready prop-val={88} />);
    await waitForExist('component-on-ready.hydrated');

    const isReady = root.shadowRoot!.querySelector('#isReady');
    expect(isReady!.textContent!.trim()).toBe('componentOnReady: true');
  });

  it('should initialize props and state correctly', async () => {
    const { root } = await render<HTMLComponentOnReadyElement>(<component-on-ready prop-val={88} />);
    await waitForExist('component-on-ready.hydrated');

    const propVal = root.shadowRoot!.querySelector('#propVal');
    expect(propVal!.textContent!.trim()).toBe('propVal: 88');

    const stateVal = root.shadowRoot!.querySelector('#stateVal');
    expect(stateVal!.textContent!.trim()).toBe('stateVal: mph');

    const listenVal = root.shadowRoot!.querySelector('#listenVal');
    expect(listenVal!.textContent!.trim()).toBe('listenVal: 0');
  });

  it('should handle click events via @Listen and emit events via @Method', async () => {
    const { root, waitForChanges } = await render<HTMLComponentOnReadyElement>(<component-on-ready prop-val={88} />);
    await waitForExist('component-on-ready.hydrated');

    const button = root.shadowRoot!.querySelector('button')!;

    // Click the button - this triggers @Listen('click') AND calls someMethod() which emits someEvent
    button.click();
    await waitForChanges();

    // @Listen increments listenVal
    expect(root.shadowRoot!.querySelector('#listenVal')!.textContent!.trim()).toBe('listenVal: 1');
    // someEvent listener increments propVal
    expect(root.shadowRoot!.querySelector('#propVal')!.textContent!.trim()).toBe('propVal: 89');

    // Click again
    button.click();
    await waitForChanges();

    expect(root.shadowRoot!.querySelector('#listenVal')!.textContent!.trim()).toBe('listenVal: 2');
    expect(root.shadowRoot!.querySelector('#propVal')!.textContent!.trim()).toBe('propVal: 90');
  });

  it('should apply shadow DOM styles correctly', async () => {
    const { root } = await render<HTMLComponentOnReadyElement>(<component-on-ready />);
    await waitForExist('component-on-ready.hydrated');

    const hostStyles = window.getComputedStyle(root);
    expect(hostStyles.borderBottomColor).toBe('rgb(0, 0, 255)');

    const span = root.shadowRoot!.querySelector('span')!;
    const spanStyles = window.getComputedStyle(span);
    expect(spanStyles.color).toBe('rgb(128, 0, 128)');
  });
});
