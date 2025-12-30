import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, expect } from '@wdio/globals';

describe('attribute-boolean', () => {
  before(async () => {
    render({
      template: () => <attribute-boolean-root></attribute-boolean-root>,
    });
  });

  it('button click rerenders', async () => {
    await $('attribute-boolean-root.hydrated').waitForExist();
    const root: any = document.body.querySelector('attribute-boolean-root')!;
    await expect($(root)).toHaveAttribute('aria-hidden', 'false');
    await expect(root).toHaveAttribute('aria-hidden', 'false');
    await expect(root).toHaveAttribute('fixedtrue', 'true');
    await expect(root).toHaveAttribute('fixedfalse', 'false');
    await expect(root).not.toHaveAttribute('readonly');
    await expect(root).not.toHaveAttribute('tappable');
    await expect(root).not.toHaveAttribute('str');
    await expect(root).not.toHaveAttribute('no-appear');
    await expect(root).not.toHaveAttribute('no-appear-two');

    const child = root.querySelector('attribute-boolean')!;
    await expect(child).toHaveAttribute('aria-hidden', 'false');
    await expect(child).toHaveAttribute('str-state', 'false');
    await expect(child).not.toHaveAttribute('bool-state');
    await expect(child).not.toHaveAttribute('noreflect');
    await expect(child).not.toHaveAttribute('tappable');

    const button = await $('button');
    await button.click();

    await expect($(root)).toHaveAttribute('aria-hidden', 'true');
    await expect(root).toHaveAttribute('fixedtrue', 'true');
    await expect(root).toHaveAttribute('fixedfalse', 'false');
    await expect(root).toHaveAttribute('readonly');
    await expect(root).toHaveAttribute('tappable', '');
    await expect(root).toHaveAttribute('str', 'hello');
    await expect(root).not.toHaveAttribute('no-appear');
    await expect(root).not.toHaveAttribute('no-appear-two');

    await expect(child).toHaveAttribute('aria-hidden', 'true');
    await expect(child).toHaveAttribute('str-state', 'true');
    await expect(child).toHaveAttribute('bool-state', '');
    await expect(child).not.toHaveAttribute('noreflect');
    await expect(child).toHaveAttribute('tappable', '');
  });
});
