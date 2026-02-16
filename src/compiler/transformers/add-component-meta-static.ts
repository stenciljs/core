import ts from 'typescript';

import type * as d from '../../declarations';
import { convertValueToLiteral, createStaticGetter, retrieveModifierLike } from './transform-utils';

/**
 * Update an instance of TypeScript's Intermediate Representation (IR) for a
 * class declaration ({@link ts.ClassDeclaration}) with a static getter for the
 * compiler metadata that we produce as part of the compilation process.
 *
 * @param cmpNode an instance of the TypeScript IR for a class declaration (i.e.
 * a stencil component) to be updated
 * @param cmpMeta the component metadata corresponding to that component
 * @returns the updated typescript class declaration
 */
export const addComponentMetaStatic = (
  cmpNode: ts.ClassDeclaration,
  cmpMeta: d.ComponentCompilerMeta,
): ts.ClassDeclaration => {
  const publicCompilerMeta = getPublicCompilerMeta(cmpMeta);

  const cmpMetaStaticProp = createStaticGetter('COMPILER_META', convertValueToLiteral(publicCompilerMeta));
  const classMembers = [...cmpNode.members, cmpMetaStaticProp];

  return ts.factory.updateClassDeclaration(
    cmpNode,
    retrieveModifierLike(cmpNode),
    cmpNode.name,
    cmpNode.typeParameters,
    cmpNode.heritageClauses,
    classMembers,
  );
};

export const getPublicCompilerMeta = (cmpMeta: d.ComponentCompilerMeta) => {
  const publicCompilerMeta = Object.assign({}, cmpMeta);

  // no need to copy all compiler meta data
  delete publicCompilerMeta.assetsDirs;
  delete publicCompilerMeta.dependencies;
  delete publicCompilerMeta.excludeFromCollection;
  delete publicCompilerMeta.isCollectionDependency;
  delete publicCompilerMeta.docs;
  delete publicCompilerMeta.jsFilePath;
  delete publicCompilerMeta.potentialCmpRefs;
  delete publicCompilerMeta.styleDocs;
  delete publicCompilerMeta.sourceFilePath;

  return publicCompilerMeta;
};
