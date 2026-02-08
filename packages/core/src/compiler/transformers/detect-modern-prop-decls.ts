import ts from 'typescript';

import type * as d from '../../declarations';
import { getStaticValue } from './transform-utils';

/**
 * With a ts config of `target: 'es2022', useDefineForClassFields: true`
 * compiled Stencil components went from:
 *
 * ```ts
 * class MyComponent {
 *   constructor(hostRef) {
 *     this.prop1 = 'value1';
 *   }
 * }
 * ```
 * To:
 * ```ts
 * class MyComponent {
 *  prop1 = 'value1';
 *  // ^^ These new property declarations cause issues with
 *  // Stencil runtime `@State` / `@Prop` handling
 * }
 * ```
 * This detects the presence of these prop declarations,
 * switches on a flag so  we can handle them at runtime.
 *
 * @param classNode the parental class node
 * @param cmp metadata about the stencil component of interest
 * @returns true if the class has modern property declarations, false otherwise
 */
export const detectModernPropDeclarations = (classNode: ts.ClassDeclaration, sourceFile?: ts.SourceFile) => {
  const parsedProps: { [key: string]: d.ComponentCompilerProperty } = getStaticValue(classNode.members, 'properties');
  const parsedStates: { [key: string]: d.ComponentCompilerProperty } = getStaticValue(classNode.members, 'states');

  if (!parsedProps && !parsedStates) {
    return false;
  }

  const members = [...Object.entries(parsedProps || {}), ...Object.entries(parsedStates || {})];
  let hasModernPropertyDecls = false;

  for (const [propName, meta] of members) {
    // comb through the class' body members to find a corresponding, 'modern' prop initializer
    const dynamicPropName = meta.ogPropName || '';

    // looking for `[example]` or `example` class property declarations
    const prop = classNode.members.find((m) => {
      return (
        ts.isPropertyDeclaration(m) &&
        ((ts.isComputedPropertyName(m.name) && m.name.expression.getText(sourceFile) === dynamicPropName) ||
          m.name.getText(sourceFile) === propName)
      );
    }) as any as ts.PropertyDeclaration;

    if (!prop) continue;

    hasModernPropertyDecls = true;
    break;
  }

  return hasModernPropertyDecls;
};
