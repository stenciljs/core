import { getTextDocs } from '@utils';

import type * as d from '../../declarations';
import { updateTypeIdentifierNames } from './stencil-types';

/**
 * Generates the individual event types for all @Method() decorated events in a component
 * @param cmpMeta component runtime metadata for a single component
 * @param typeImportData locally/imported/globally used type names, which may be used to prevent naming collisions
 * @returns the generated type metadata
 */
export const generateMethodTypes = (
  cmpMeta: d.ComponentCompilerMeta,
  typeImportData: d.TypesImportData,
): d.TypeInfo => {
  return cmpMeta.methods.map((cmpMethod) => ({
    name: cmpMethod.name,
    type: getType(cmpMethod, typeImportData, cmpMeta.sourceFilePath),
    optional: false,
    required: false,
    internal: cmpMethod.internal,
    jsdoc: getTextDocs(cmpMethod.docs),
  }));
};

/**
 * Determine the correct type name for all type(s) used by a class member annotated with `@Method()`
 * @param cmpMethod the compiler metadata for a single `@Method()`
 * @param typeImportData locally/imported/globally used type names, which may be used to prevent naming collisions
 * @param componentSourcePath the path to the component on disk
 * @returns the type associated with a `@Method()`
 */
function getType(
  cmpMethod: d.ComponentCompilerMethod,
  typeImportData: d.TypesImportData,
  componentSourcePath: string,
): string {
  return updateTypeIdentifierNames(
    cmpMethod.complexType.references,
    typeImportData,
    componentSourcePath,
    cmpMethod.complexType.signature,
  );
}
