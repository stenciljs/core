import * as d from '@stencil/core/declarations';

/**
 * Generates a stub {@link d.ComponentCompilerProperty}. This function uses sensible defaults for the initial stub.
 * However, any field in the object may be overridden via the `overrides` argument.
 * @param overrides a partial implementation of `ComponentCompilerProperty`. Any provided fields will override the
 * defaults provided by this function.
 * @returns the stubbed `ComponentCompilerProperty`
 */
export const stubComponentCompilerProperty = (
  overrides: Partial<d.ComponentCompilerProperty> = {},
): d.ComponentCompilerProperty => {
  const defaults: d.ComponentCompilerProperty = {
    attribute: 'my-cmp',
    complexType: {
      original: 'UserCustomPropType',
      resolved: '123 | 456',
      references: {
        UserImplementedEventType: {
          id: 'placeholder',
          location: 'import',
          path: './resources',
        },
      },
    },
    docs: undefined,
    internal: false,
    mutable: false,
    name: 'propName',
    optional: false,
    reflect: false,
    required: false,
    type: 'number',
    getter: undefined,
    setter: undefined,
  };

  return { ...defaults, ...overrides };
};
