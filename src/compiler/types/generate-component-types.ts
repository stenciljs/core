import { addDocBlock, dashToPascalCase, sortBy } from '@utils';

import type * as d from '../../declarations';
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

  const componentAttributes = attributesToMultiLineString(
    [...propAttributes, ...methodAttributes],
    false,
    areTypesInternal,
  );
  const isDep = cmp.isCollectionDependency;
  const jsxAttributes = attributesToMultiLineString([...propAttributes, ...eventAttributes], true, areTypesInternal);

  const element = [
    ...htmlElementEventMap,
    addDocBlock(
      `    interface ${htmlElementName} extends Components.${tagNameAsPascal}, HTMLStencilElement {`,
      cmp.docs,
      4,
    ),
    ...htmlElementEventListenerProperties,
    `    }`,
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
