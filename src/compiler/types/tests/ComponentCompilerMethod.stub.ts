import * as d from '@stencil/core/declarations';

/**
 * Generates a stub {@link d.ComponentCompilerMethod}. This function uses sensible defaults for the initial stub. However,
 * any field in the object may be overridden via the `overrides` argument.
 * @param overrides a partial implementation of `ComponentCompilerMethod`. Any provided fields will override the
 * defaults provided by this function.
 * @returns the stubbed `ComponentCompilerMethod`
 */
export const stubComponentCompilerMethod = (
  overrides: Partial<d.ComponentCompilerMethod> = {},
): d.ComponentCompilerMethod => {
  const defaults: d.ComponentCompilerMethod = {
    name: 'myMethod',
    internal: false,
    complexType: {
      parameters: [{ name: 'name', type: 'Foo', docs: '' }],
      references: { Foo: { location: 'import', path: './resources', id: 'placeholder' } },
      return: 'Promise<void>',
      signature: '(name: Foo) => Promise<void>',
    },
    docs: undefined,
  };

  return { ...defaults, ...overrides };
};
