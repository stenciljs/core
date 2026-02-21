import { newE2EPage } from '@stencil/core/testing';

describe('load when html does not contain components', () => {
  it('test', async () => {
    await newE2EPage({ html: `<div>88 mph</div>` });
    expect(1).toBe(1);
  });
});
