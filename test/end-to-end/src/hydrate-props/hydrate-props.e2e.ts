// @ts-ignore may not be existing when project hasn't been built
type HydrateModule = typeof import('../../hydrate');
let renderToString: HydrateModule['renderToString'];

describe('different types of decorated properties and states render on both server and client', () => {
  beforeAll(async () => {
    // @ts-ignore may not be existing when project hasn't been built
    const mod = await import('../../hydrate');
    renderToString = mod.renderToString;
  });

  it('renders default values', async () => {
    const { html } = await renderToString(
      `
      <my-cmp foo-prop="foo1" bar-prop="bar1"></my-cmp>
      <my-cmp fooProp="foo2" barProp="bar2"></my-cmp>
    `,
      {
        fullDocument: false,
      },
    );
    // html template renders kebab case props
    expect(html).toContain('<!--t.1.1.1.0-->foo1 - bar1<');
    // html template doesn't support camelcase
    expect(html).toContain('<!--t.4.1.1.0--> - bar<');
    // jsx template renders kebab case
    expect(html).toContain('<!--t.2.1.1.0-->foo3 - bar3<');
    expect(html).toContain('<!--t.5.1.1.0-->foo3 - bar3<');
    // jsx template renders camel case
    expect(html).toContain('<!--t.3.1.1.0-->foo4 - bar4<');
    expect(html).toContain('<!--t.6.1.1.0-->foo4 - bar4<');
  });
});
