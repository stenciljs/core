import * as d from '@stencil/core/declarations';

/**
 * Generates a stub {@link d.ComponentCompilerEvent}. This function uses sensible defaults for the initial stub. However,
 * any field in the object may be overridden via the `overrides` argument.
 * @param overrides a partial implementation of `ComponentCompilerEvent`. Any provided fields will override the
 * defaults provided by this function.
 * @returns the stubbed `ComponentCompilerEvent`
 */
export const stubComponentCompilerEvent = (
  overrides: Partial<d.ComponentCompilerEvent> = {},
): d.ComponentCompilerEvent => {
  const defaults: d.ComponentCompilerEvent = {
    bubbles: true,
    cancelable: true,
    composed: true,
    internal: false,
    name: 'myEvent',
    method: 'myEvent',
    complexType: {
      original: 'UserImplementedEventType',
      resolved: '"foo" | "bar"',
      references: {
        UserImplementedEventType: {
          id: './resources.ts::UserImplementedEventType',
          location: 'import',
          path: './resources',
        },
      },
    },
    docs: undefined,
  };

  return { ...defaults, ...overrides };
};
