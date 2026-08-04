import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

describe('import-aliasing', () => {
  it('should render correctly with aliased imports', async () => {
    const { root, waitForChanges } = await render(
      <form>
        <import-aliasing user='John' name='test-input'></import-aliasing>
      </form>,
    );
    await waitForExist('import-aliasing.hydrated');

    const host = root.querySelector('import-aliasing')!;
    const children = host.querySelectorAll(':scope > *');

    expect(children[0]).toHaveTextContent('My name is John');
    expect(children[1]).toHaveTextContent('Name changed 0 time(s)');
    expect(children[2]).toHaveTextContent('Method called 0 time(s)');
    expect(children[3]).toHaveTextContent('Event triggered 0 time(s)');

    host.setAttribute('user', 'Peter');
    await waitForChanges();

    expect(children[0]).toHaveTextContent('My name is Peter');
    expect(children[1]).toHaveTextContent('Name changed 1 time(s)');
    expect(children[2]).toHaveTextContent('Method called 0 time(s)');
    expect(children[3]).toHaveTextContent('Event triggered 0 time(s)');

    const el = await (host as any).myMethod();
    await waitForChanges();

    expect(el).toBe(host);
    expect(children[0]).toHaveTextContent('My name is Peter');
    expect(children[1]).toHaveTextContent('Name changed 1 time(s)');
    expect(children[2]).toHaveTextContent('Method called 1 time(s)');
    expect(children[3]).toHaveTextContent('Event triggered 1 time(s)');
  });

  it('should link up to the surrounding form', async () => {
    const { root } = await render(
      <form>
        <import-aliasing user='John' name='test-input'></import-aliasing>
      </form>,
    );
    await waitForExist('import-aliasing.hydrated');
    const formEl = root as HTMLFormElement;
    expect(new FormData(formEl).get('test-input')).toBe('my default value');
  });
});
