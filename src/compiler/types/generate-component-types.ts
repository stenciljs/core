import { addDocBlock, dashToPascalCase, sortBy } from '@utils';

import type * as d from '../../declarations';
import { HTML_ELEMENT_METHODS } from './constants';
import { generateEventListenerTypes } from './generate-event-listener-types';
import { generateEventTypes } from './generate-event-types';
import { generateMethodTypes } from './generate-method-types';
import { generatePropTypes } from './generate-prop-types';

/**
 * Generate a string based on the types that are defined within a component
 * @param cmp the metadata for the component that a type definition string is generated for
 * @param typeImportData locally/imported/globally used type names, which may be used to prevent naming collisions
 * @param areTypesInternal `true` if types being generated are for a project's internal purposes, `false` otherwise
 * @returns the generated types string alongside additional metadata
 */
export const generateComponentTypes = (
  cmp: d.ComponentCompilerMeta,
  typeImportData: d.TypesImportData,
  areTypesInternal: boolean,
): d.TypesModule => {
  const tagName = cmp.tagName.toLowerCase();
  const tagNameAsPascal = dashToPascalCase(tagName);
  const htmlElementName = `HTML${tagNameAsPascal}Element`;

  const propAttributes = generatePropTypes(cmp, typeImportData);
  const methodAttributes = generateMethodTypes(cmp, typeImportData);
  const eventAttributes = generateEventTypes(cmp, typeImportData, tagNameAsPascal);
  const { htmlElementEventMap, htmlElementEventListenerProperties } = generateEventListenerTypes(cmp, typeImportData);

  // Check for method conflicts with HTMLElement
  const conflictingMethods = methodAttributes.filter((method) => HTML_ELEMENT_METHODS.has(method.name));
  const hasMethodConflicts = conflictingMethods.length > 0;

  const componentAttributes = attributesToMultiLineString(
    [...propAttributes, ...methodAttributes],
    false,
    areTypesInternal,
  );
  const isDep = cmp.isCollectionDependency;
  const jsxAttributes = attributesToMultiLineString([...propAttributes, ...eventAttributes], true, areTypesInternal);

  // Generate the element interface with method conflict resolution
  const elementInterface = hasMethodConflicts
    ? generateElementInterfaceWithConflictResolution(
        htmlElementName,
        tagNameAsPascal,
        conflictingMethods,
        htmlElementEventListenerProperties,
        cmp.docs,
      )
    : generateStandardElementInterface(htmlElementName, tagNameAsPascal, htmlElementEventListenerProperties, cmp.docs);

  const element = [
    ...htmlElementEventMap,
    ...elementInterface,
    `    var ${htmlElementName}: {`,
    `        prototype: ${htmlElementName};`,
    `        new (): ${htmlElementName};`,
    `    };`,
  ];
  return {
    isDep,
    tagName,
    tagNameAsPascal,
    htmlElementName,
    component: addDocBlock(`    interface ${tagNameAsPascal} {\n${componentAttributes}    }`, cmp.docs, 4),
    jsx: `    interface ${tagNameAsPascal} {\n${jsxAttributes}    }`,
    element: element.join(`\n`),
  };
};

/**
 * Generate element interface when there are no method conflicts
 * @param htmlElementName the name of the HTML element interface
 * @param tagNameAsPascal the component tag name in PascalCase
 * @param htmlElementEventListenerProperties event listener properties for the element
 * @param docs JSDoc documentation for the component
 * @returns array of interface definition lines
 */
function generateStandardElementInterface(
  htmlElementName: string,
  tagNameAsPascal: string,
  htmlElementEventListenerProperties: string[],
  docs: d.CompilerJsDoc | undefined,
): string[] {
  return [
    addDocBlock(
      `    interface ${htmlElementName} extends Components.${tagNameAsPascal}, HTMLStencilElement {`,
      docs,
      4,
    ),
    ...htmlElementEventListenerProperties,
    `    }`,
  ];
}

/**
 * Generate element interface with method conflict resolution using intersection types
 * @param htmlElementName the name of the HTML element interface
 * @param tagNameAsPascal the component tag name in PascalCase
 * @param conflictingMethods array of method metadata that conflicts with HTMLElement methods
 * @param htmlElementEventListenerProperties event listener properties for the element
 * @param docs JSDoc documentation for the component
 * @returns array of interface definition lines
 */
function generateElementInterfaceWithConflictResolution(
  htmlElementName: string,
  tagNameAsPascal: string,
  conflictingMethods: d.TypeInfo,
  htmlElementEventListenerProperties: string[],
  docs: d.CompilerJsDoc | undefined,
): string[] {
  const methodOverrides = conflictingMethods
    .map((method) => {
      const optional = method.optional ? '?' : '';
      let docBlock = '';
      if (method.jsdoc) {
        docBlock =
          [`        /**`, ...method.jsdoc.split('\n').map((line) => '          * ' + line), `         */`].join('\n') +
          '\n';
      }
      return `${docBlock}        "${method.name}"${optional}: ${method.type};`;
    })
    .join('\n');

  return [
    addDocBlock(
      `    interface ${htmlElementName} extends Omit<Components.${tagNameAsPascal}, ${conflictingMethods.map((m) => `"${m.name}"`).join(' | ')}>, HTMLStencilElement {`,
      docs,
      4,
    ),
    methodOverrides,
    ...htmlElementEventListenerProperties,
    `    }`,
  ];
}

const attributesToMultiLineString = (attributes: d.TypeInfo, jsxAttributes: boolean, internal: boolean) => {
  const attributesStr = sortBy(attributes, (a) => a.name)
    .filter((type) => {
      if (jsxAttributes && !internal && type.internal) {
        return false;
      }
      return true;
    })
    .reduce((fullList, type) => {
      if (type.jsdoc) {
        fullList.push(`        /**`);
        fullList.push(...type.jsdoc.split('\n').map((line) => '          * ' + line));
        fullList.push(`         */`);
      }
      const optional = jsxAttributes ? !type.required : type.optional;
      fullList.push(`        "${type.name}"${optional ? '?' : ''}: ${type.type};`);
      return fullList;
    }, [] as string[])
    .join(`\n`);

  return attributesStr !== '' ? `${attributesStr}\n` : '';
};
