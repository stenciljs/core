import { getTextDocs } from '../../utils';

import type * as d from '../../declarations';
import { updateTypeIdentifierNames } from './stencil-types';

/**
 * Generates the individual event types for all @Prop() decorated events in a component
 * @param cmpMeta component runtime metadata for a single component
 * @param typeImportData locally/imported/globally used type names, which may be used to prevent naming collisions
 * @returns the generated type metadata
 */
export const generatePropTypes = (cmpMeta: d.ComponentCompilerMeta, typeImportData: d.TypesImportData): d.TypeInfo => {
  return [
    ...cmpMeta.properties.map((cmpProp) => {
      let doc = getTextDocs(cmpProp.docs);
      if (cmpProp.getter && !cmpProp.setter && !doc?.match('@readonly')) {
        cmpProp.docs = cmpProp.docs || { tags: [], text: '' };
        cmpProp.docs.tags = [...(cmpProp.docs.tags || []), { name: 'readonly', text: '' }];
        doc = getTextDocs(cmpProp.docs);
      }
      if (cmpProp.defaultValue !== undefined && !doc?.match('@default')) {
        cmpProp.docs = cmpProp.docs || { tags: [], text: '' };
        cmpProp.docs.tags = [...(cmpProp.docs.tags || []), { name: 'default', text: cmpProp.defaultValue }];
        doc = getTextDocs(cmpProp.docs);
      }
      return {
        name: cmpProp.name,
        type: getType(cmpProp, typeImportData, cmpMeta.sourceFilePath),
        optional: cmpProp.optional,
        required: cmpProp.required,
        internal: cmpProp.internal,
        jsdoc: doc,
      };
    }),
    ...cmpMeta.virtualProperties.map((cmpProp) => ({
      name: cmpProp.name,
      type: cmpProp.type,
      optional: true,
      required: false,
      jsdoc: cmpProp.docs,
      internal: false,
    })),
  ];
};

/**
 * Determine the correct type name for all type(s) used by a class member annotated with `@Prop()`
 * @param cmpProp the compiler metadata for a single `@Prop()`
 * @param typeImportData locally/imported/globally used type names, which may be used to prevent naming collisions
 * @param componentSourcePath the path to the component on disk
 * @returns the type associated with a `@Prop()`
 */
function getType(
  cmpProp: d.ComponentCompilerProperty,
  typeImportData: d.TypesImportData,
  componentSourcePath: string,
): string {
  return updateTypeIdentifierNames(
    cmpProp.complexType.references,
    typeImportData,
    componentSourcePath,
    cmpProp.complexType.original,
  );
}
