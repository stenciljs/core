import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('slot replace wrapper', () => {
  beforeEach(async () => {
    render({
      template: () => <slot-replace-wrapper-root></slot-replace-wrapper-root>,
    });

    await $('slot-replace-wrapper-root').waitForExist();
    // Tests are flakey without this
    await $('.results1 a').waitForExist();
  });

  it('renders A', async () => {
    const result = document.querySelector('.results1 a');
    expect(result.textContent.trim()).toBe('A');
    expect(result.children[0].textContent.trim()).toBe('A');

    await expect($('[hidden]')).not.toBeExisting();
  });

  it('renders B', async () => {
    const result = document.querySelector('.results2 a');
    expect(result.textContent.trim()).toBe('B');
    expect(result.children[0].children[0].textContent.trim()).toBe('B');

    await expect($('[hidden]')).not.toBeExisting();
  });

  it('renders C', async () => {
    const result = document.querySelector('.results3 a');
    expect(result.textContent.trim()).toBe('C');
    expect(result.children[0].children[0].children[0].textContent.trim()).toBe('C');

    await expect($('[hidden]')).not.toBeExisting();
  });

  it('renders ABC from ABC', async () => {
    const result = document.querySelector('.results4 a');
    expect(result.textContent.trim()).toBe('ABC');
    expect(result.children[0].textContent.trim()).toBe('A');
    expect(result.children[1].children[0].textContent.trim()).toBe('B');
    expect(result.children[1].children[1].children[0].textContent.trim()).toBe('C');

    await expect($('[hidden]')).not.toBeExisting();
  });

  it('renders ABC from BCA', async () => {
    const result = document.querySelector('.results5 a');
    expect(result.textContent.trim()).toBe('ABC');
    expect(result.children[0].textContent.trim()).toBe('A');
    expect(result.children[1].children[0].textContent.trim()).toBe('B');
    expect(result.children[1].children[1].children[0].textContent.trim()).toBe('C');

    await expect($('[hidden]')).not.toBeExisting();
  });

  it('renders ABC from CAB', async () => {
    const result = document.querySelector('.results6 a');
    expect(result.textContent.trim()).toBe('ABC');
    expect(result.children[0].textContent.trim()).toBe('A');
    expect(result.children[1].children[0].textContent.trim()).toBe('B');
    expect(result.children[1].children[1].children[0].textContent.trim()).toBe('C');

    await expect($('[hidden]')).not.toBeExisting();
  });

  it('renders A1A2B1B2C1C2 from A1A2B1B2C1C2', async () => {
    const result = document.querySelector('.results7 a');
    expect(result.textContent.trim()).toBe('A1A2B1B2C1C2');

    await expect($('[hidden]')).not.toBeExisting();
  });

  it('renders A1A2B1B2C1C2 from B1C1A1B2C2A2', async () => {
    const result = document.querySelector('.results8 a');
    expect(result.textContent.trim()).toBe('A1A2B1B2C1C2');

    await expect($('[hidden]')).not.toBeExisting();
  });
});
