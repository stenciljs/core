import { getTextDocs, toTitleCase } from '@utils';

import type * as d from '../../declarations';
import { updateTypeIdentifierNames } from './stencil-types';

/**
 * Generates the individual event types for all @Event() decorated events in a component
 * @param cmpMeta component runtime metadata for a single component
 * @param typeImportData locally/imported/globally used type names, which may be used to prevent naming collisions
 * @param cmpClassName The pascal cased name of the component class
 * @returns the generated type metadata
 */
export const generateEventTypes = (
  cmpMeta: d.ComponentCompilerMeta,
  typeImportData: d.TypesImportData,
  cmpClassName: string,
): d.TypeInfo => {
  return cmpMeta.events.map((cmpEvent) => {
    const name = `on${toTitleCase(cmpEvent.name)}`;
    const cmpEventDetailInterface = `${cmpClassName}CustomEvent`;
    const type = getEventType(cmpEvent, cmpEventDetailInterface, typeImportData, cmpMeta.sourceFilePath);

    const typeInfo: d.TypeInfo[0] = {
      name,
      type,
      optional: false,
      required: false,
      internal: cmpEvent.internal,
      jsdoc: getTextDocs(cmpEvent.docs),
    };
    return typeInfo;
  });
};

/**
 * Determine the correct type name for all type(s) used by a class member annotated with `@Event()`
 * @param cmpEvent the compiler metadata for a single `@Event()`
 * @param cmpEventDetailInterface the name of the custom event type to use in the generated type
 * @param typeImportData locally/imported/globally used type names, which may be used to prevent naming collisions
 * @param componentSourcePath the path to the component on disk
 * @returns the type associated with a `@Event()`
 */
const getEventType = (
  cmpEvent: d.ComponentCompilerEvent,
  cmpEventDetailInterface: string,
  typeImportData: d.TypesImportData,
  componentSourcePath: string,
): string => {
  if (!cmpEvent.complexType.original) {
    return 'CustomEvent';
  }
  const updatedTypeName = updateTypeIdentifierNames(
    cmpEvent.complexType.references,
    typeImportData,
    componentSourcePath,
    cmpEvent.complexType.original,
  );
  return `(event: ${cmpEventDetailInterface}<${updatedTypeName}>) => void`;
};
