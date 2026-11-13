import ts from 'typescript';

import type * as d from '../../../declarations';
import { convertValueToLiteral, createStaticGetter, getAttributeTypeInfo } from '../transform-utils';

/**
 * Store the type parameters of a component class (e.g. `T` in `class MyTable<T> {}`)
 * in a static getter, so they can be used to generate generic types in `components.d.ts`.
 *
 * @param typeChecker a TypeScript type checker instance
 * @param program a {@link ts.Program} object
 * @param sourceFile the source file containing the class node
 * @param classNode the component class declaration
 * @param newMembers an out param to hold newly generated class members
 */
export const typeParametersToStatic = (
  typeChecker: ts.TypeChecker,
  program: ts.Program,
  sourceFile: ts.SourceFile,
  classNode: ts.ClassDeclaration,
  newMembers: ts.ClassElement[],
): void => {
  if (!classNode.typeParameters?.length) {
    return;
  }

  const typeParameters = classNode.typeParameters.map((typeParameter): d.ComponentCompilerTypeParameter => {
    const meta: d.ComponentCompilerTypeParameter = {
      name: typeParameter.name.text,
      references: getAttributeTypeInfo(typeParameter, sourceFile, typeChecker, program),
    };
    if (typeParameter.constraint) {
      meta.constraint = typeParameter.constraint.getText(sourceFile);
    }
    if (typeParameter.default) {
      meta.default = typeParameter.default.getText(sourceFile);
    }
    return meta;
  });

  newMembers.push(createStaticGetter('typeParameters', convertValueToLiteral(typeParameters)));
};
