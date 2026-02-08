import * as d from '@stencil/core/declarations';

/**
 * Generates a stub {@link d.TypesImportData}.
 *
 * @param overrides a partial implementation of `TypesImportData`. Any provided fields will override the defaults
 * provided by this function.
 * @returns the stubbed `TypesImportData`
 */
export const stubTypesImportData = (overrides: Partial<d.TypesImportData> = {}): d.TypesImportData => {
  /**
   * By design, we do not provide any default values. the keys used in this data structure will be highly dependent on
   * the tests being written, and providing default values may lead to unexpected behavior when enumerating the returned
   * stub
   */
  const defaults: d.TypesImportData = {};

  return { ...defaults, ...overrides };
};
