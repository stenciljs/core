import { dashToPascalCase } from '@utils';

import type * as d from '../../declarations';

/**
 * Generates the custom event interface for each component that combines the `CustomEvent` interface with
 * the HTMLElement target. This is used to allow implementers to use strict typings on event handlers.
 *
 * The generated interface accepts a generic for the event detail type. This allows implementers to use
 * custom typings for individual events without Stencil needing to generate an interface for each event.
 *
 * For a component class with type parameters, a second generic types the event target, so a listener on
 * `HTMLMyTableElement<User>` sees `HTMLMyTableElement<User>` as target instead of the default element type.
 *
 * @param cmp The component compiler metadata
 * @returns The generated interface type definition.
 */
export const generateEventDetailTypes = (cmp: d.ComponentCompilerMeta): d.TypesModule => {
  const tagName = cmp.tagName.toLowerCase();
  const tagNameAsPascal = dashToPascalCase(tagName);
  const htmlElementName = `HTML${tagNameAsPascal}Element`;

  const isDep = cmp.isCollectionDependency;

  const cmpEventInterface = `${tagNameAsPascal}CustomEvent`;
  const typeParameterCount = cmp.typeParameters?.length ?? 0;
  const cmpInterface =
    typeParameterCount > 0
      ? [
          `export interface ${cmpEventInterface}<T, E extends ${htmlElementName}<${Array(typeParameterCount).fill('any').join(', ')}> = ${htmlElementName}> extends CustomEvent<T> {`,
          `    detail: T;`,
          `    target: E;`,
          `}`,
        ]
      : [
          `export interface ${cmpEventInterface}<T> extends CustomEvent<T> {`,
          `    detail: T;`,
          `    target: ${htmlElementName};`,
          `}`,
        ];
  return {
    isDep,
    tagName,
    tagNameAsPascal,
    htmlElementName,
    component: cmpInterface.join('\n'),
    jsx: cmpInterface.join('\n'),
    element: cmpInterface.join('\n'),
    explicitAttributes: null,
    explicitProperties: null,
    requiredProps: null,
  };
};
