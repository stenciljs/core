import { newE2EPage } from '@stencil/core/testing';

describe('@Method', () => {
  it('should pass method args', async () => {
    const page = await newE2EPage({
      html: `
      <method-cmp></method-cmp>
    `,
    });

    const elm = await page.find('method-cmp');

    const methodRtnValue = await elm.callMethod('someMethodWithArgs', 'mph', 88);

    expect(methodRtnValue).toBe(`88 mph`);
  });

  it('should set property thats used in a method', async () => {
    const page = await newE2EPage({
      html: `
      <method-cmp></method-cmp>
    `,
    });

    const elm = await page.find('method-cmp');

    elm.setProperty('someProp', 88);

    const methodRtnValue = await elm.callMethod('someMethod');

    expect(methodRtnValue).toBe(88);
  });
});
