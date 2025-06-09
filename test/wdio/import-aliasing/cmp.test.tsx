import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

/**
 * Test cases for using import aliases for Stencil decorators. Only
 * tests a subset of all Stencil decorators.
 */
describe('import aliasing', function () {
  beforeEach(() => {
    render({
      template: () => (
        <form>
          <import-aliasing user="John" name="test-input"></import-aliasing>
        </form>
      ),
    });
  });

  it('should render correctly with aliased imports', async () => {
    const host = document.querySelector('import-aliasing');
    const children = $$('import-aliasing > *');
    await expect(children[0]).toHaveText('My name is John');
    await expect(children[1]).toHaveText('Name changed 0 time(s)');
    await expect(children[2]).toHaveText('Method called 0 time(s)');
    await expect(children[3]).toHaveText('Event triggered 0 time(s)');

    host.setAttribute('user', 'Peter');
    await $('import-aliasing').waitForStable();

    await expect(children[0]).toHaveText('My name is Peter');
    await expect(children[1]).toHaveText('Name changed 1 time(s)');
    await expect(children[2]).toHaveText('Method called 0 time(s)');
    await expect(children[3]).toHaveText('Event triggered 0 time(s)');

    const el = await host.myMethod();
    expect(el).toBe(host);
    await expect(children[0]).toHaveText('My name is Peter');
    await expect(children[1]).toHaveText('Name changed 1 time(s)');
    await expect(children[2]).toHaveText('Method called 1 time(s)');
    await expect(children[3]).toHaveText('Event triggered 1 time(s)');
  });

  it('should link up to the surrounding form', async () => {
    await $('form').waitForExist();
    await browser.waitUntil(
      () => {
        const formEl = document.querySelector('form');
        expect(new FormData(formEl).get('test-input')).toBe('my default value');
        return true;
      },
      { timeoutMsg: 'link to surrounding form not established' },
    );
  });
});
