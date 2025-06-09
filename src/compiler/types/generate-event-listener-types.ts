import { dashToPascalCase } from '@utils';

import type * as d from '../../declarations';
import { updateTypeIdentifierNames } from './stencil-types';

/**
 * Generates event listener properties for the component's html element type. This is used to allow implementers
 * to use strict typings when adding and removing event listeners.
 *
 * @param cmp The component compiler metadata
 * @param typeImportData locally/imported/globally used type names, which may be used to prevent naming collisions
 * @returns additional types information to add event listener method overloads for component's html element type
 */
export const generateEventListenerTypes = (
  cmp: d.ComponentCompilerMeta,
  typeImportData: d.TypesImportData,
): { htmlElementEventMap: string[]; htmlElementEventListenerProperties: string[] } => {
  const tagName = cmp.tagName.toLowerCase();
  const tagNameAsPascal = dashToPascalCase(tagName);
  const htmlElementName = `HTML${tagNameAsPascal}Element`;
  const cmpEventInterface = `${tagNameAsPascal}CustomEvent`;
  const htmlElementEventMapName = `${htmlElementName}EventMap`;
  const cmpEvents = cmp.events.filter((cmpEvent) => cmpEvent.complexType.original);
  if (!cmpEvents.length) {
    return { htmlElementEventMap: [], htmlElementEventListenerProperties: [] };
  }
  return {
    htmlElementEventMap: getHtmlElementEventMap(cmpEvents, typeImportData, cmp.sourceFilePath, htmlElementEventMapName),
    htmlElementEventListenerProperties: [
      `        addEventListener<K extends keyof ${htmlElementEventMapName}>(type: K, listener: (this: ${htmlElementName}, ev: ${cmpEventInterface}<${htmlElementEventMapName}[K]>) => any, options?: boolean | AddEventListenerOptions): void;`,
      '        addEventListener<K extends keyof DocumentEventMap>(type: K, listener: (this: Document, ev: DocumentEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;',
      '        addEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;',
      '        addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;',
      `        removeEventListener<K extends keyof ${htmlElementEventMapName}>(type: K, listener: (this: ${htmlElementName}, ev: ${cmpEventInterface}<${htmlElementEventMapName}[K]>) => any, options?: boolean | EventListenerOptions): void;`,
      '        removeEventListener<K extends keyof DocumentEventMap>(type: K, listener: (this: Document, ev: DocumentEventMap[K]) => any, options?: boolean | EventListenerOptions): void;',
      '        removeEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any, options?: boolean | EventListenerOptions): void;',
      '        removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;',
    ],
  };
};

/**
 * Generates map of event names and user implemented event type(s). Used to avoid having to write individual
 * event listener method overloads per event type.
 *
 * @param cmpEvents a collection of the compiler metadata for each individual `@Event()`
 * @param typeImportData locally/imported/globally used type names, which may be used to prevent naming collisions
 * @param sourceFilePath the path to the source file being visited
 * @param htmlElementEventMapName the name of the component event map type
 * @returns map of event names and user implemented event type(s)
 */
const getHtmlElementEventMap = (
  cmpEvents: d.ComponentCompilerEvent[],
  typeImportData: d.TypesImportData,
  sourceFilePath: string,
  htmlElementEventMapName: string,
): string[] => {
  const eventMapProperties = cmpEvents.map((cmpEvent) => {
    const type = getEventGenericType(cmpEvent, typeImportData, sourceFilePath);
    return `        "${cmpEvent.name}": ${type};`;
  });
  return [`    interface ${htmlElementEventMapName} {`, ...eventMapProperties, `    }`];
};

/**
 * Determine the correct type name for all user implemented event type(s) used by a class member annotated with `@Event()`.
 *
 * @param cmpEvent the compiler metadata for a single `@Event()`
 * @param typeImportData locally/imported/globally used type names, which may be used to prevent naming collisions
 * @param componentSourcePath the path to the component on disk
 * @returns the user implemented event type associated with a `@Event()`
 */
const getEventGenericType = (
  cmpEvent: d.ComponentCompilerEvent,
  typeImportData: d.TypesImportData,
  componentSourcePath: string,
): string => {
  return updateTypeIdentifierNames(
    cmpEvent.complexType.references,
    typeImportData,
    componentSourcePath,
    cmpEvent.complexType.original,
  );
};
