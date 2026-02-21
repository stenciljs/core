/**
 * Some JSDoc here describing something or other
 *
 * It's multi-line, etc.
 */
export interface ImportedInterface<T> {
  test: 'boop';
  another: T;
}

export async function importedInterface<T>(foo: T): Promise<ImportedInterface<T>> {
  return {
    test: 'boop',
    another: foo,
  };
}
