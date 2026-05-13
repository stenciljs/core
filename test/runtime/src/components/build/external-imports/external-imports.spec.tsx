import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

describe('external-imports', () => {
  it('render all components without errors', async () => {
    await render(
      <>
        <external-import-a></external-import-a>
        <external-import-b></external-import-b>
        <external-import-c></external-import-c>
      </>,
    );

    await waitForExist('external-import-c.hydrated');
    expect(document.querySelector('external-import-a')).toHaveTextContent('Marty McFly');
    expect(document.querySelector('external-import-b')).toHaveTextContent('Marty McFly');
    expect(document.querySelector('external-import-c')).toHaveTextContent('Marty McFly');
  });
});
