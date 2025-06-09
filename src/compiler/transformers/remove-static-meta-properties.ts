import { readOnlyArrayHasStringMember } from '@utils';
import ts from 'typescript';

import { StencilStaticGetter } from './decorators-to-static/decorators-constants';
import { retrieveTsModifiers } from './transform-utils';

/**
 * Creates a new collection of class members that belong to the provided class node and that do not exist in
 * {@link STATIC_GETTERS_TO_REMOVE}
 * @param classNode the class node in the syntax tree to inspect
 * @returns a new collection of class members belonging to the provided class node, less those found in
 * {@link STATIC_GETTERS_TO_REMOVE}
 */
export const removeStaticMetaProperties = (classNode: ts.ClassDeclaration): ts.ClassElement[] => {
  if (classNode.members == null) {
    return [];
  }
  return classNode.members.filter((classMember) => {
    if (retrieveTsModifiers(classMember)?.some((m) => m.kind === ts.SyntaxKind.StaticKeyword)) {
      const memberName = (classMember.name as any).escapedText;

      if (readOnlyArrayHasStringMember(STATIC_GETTERS_TO_REMOVE, memberName)) {
        return false;
      }
    }
    return true;
  });
};

/**
 * A list of the static getters to remove here, which is a subset of the total
 * set of static getters used by Stencil during the compilation process.
 */
const STATIC_GETTERS_TO_REMOVE = [
  // we want to remove `attachInternalsMemberName`, which is an 'internal' static
  // property used to pass a string value along from the 'decorators-to-static'
  // step through to the `ComponentCompilerMeta` phase, but we want to keep the
  // `formAssociated` prop that we also set at the same time.
  'attachInternalsMemberName',
  'elementRef',
  'encapsulation',
  'events',
  'is',
  'listeners',
  'methods',
  'originalStyleUrls',
  'properties',
  'states',
  'style',
  'styleMode',
  'styleUrl',
  'styleUrls',
  'styles',
  'watchers',
] as const satisfies readonly StencilStaticGetter[];
