import * as d from '@stencil/core/declarations';

/**
 * Generates a stub {@link d.ComponentCompilerTypeReference}. This function uses sensible defaults for the initial stub.
 * However, any field in the object may be overridden via the `overrides` argument.
 * @param overrides a partial implementation of `ComponentCompilerTypeReference`. Any provided fields will override the
 * defaults provided by this function.
 * @returns the stubbed `ComponentCompilerTypeReference`
 */
export const stubComponentCompilerTypeReference = (
  overrides: Partial<d.ComponentCompilerTypeReference> = {},
): d.ComponentCompilerTypeReference => {
  const defaults: d.ComponentCompilerTypeReference = {
    location: 'global',
    id: 'placeholder',
  };

  return { ...defaults, ...overrides };
};
