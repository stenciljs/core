import ts from 'typescript';

import type * as d from '../../../declarations';
import { updateLazyComponentConstructor } from '../component-lazy/lazy-constructor';
import { addLazyElementGetter } from '../component-lazy/lazy-element-getter';
import { transformHostData } from '../host-data-transform';
import { removeStaticMetaProperties } from '../remove-static-meta-properties';
import { retrieveModifierLike } from '../transform-utils';
import { addReactivePropHandlers } from '../reactive-handler-meta-transform';
import { addHydrateRuntimeCmpMeta } from './hydrate-runtime-cmp-meta';

export const updateHydrateComponentClass = (
  classNode: ts.ClassDeclaration,
  moduleFile: d.Module,
  cmp: d.ComponentCompilerMeta,
) => {
  return ts.factory.updateClassDeclaration(
    classNode,
    retrieveModifierLike(classNode),
    classNode.name,
    classNode.typeParameters,
    classNode.heritageClauses,
    updateHydrateHostComponentMembers(classNode, moduleFile, cmp),
  );
};

const updateHydrateHostComponentMembers = (
  classNode: ts.ClassDeclaration,
  moduleFile: d.Module,
  cmp: d.ComponentCompilerMeta,
) => {
  const classMembers = removeStaticMetaProperties(classNode);

  updateLazyComponentConstructor(classMembers, classNode, moduleFile, cmp);
  addLazyElementGetter(classMembers, moduleFile, cmp);
  addReactivePropHandlers(classMembers, cmp, 'watchers');
  addReactivePropHandlers(classMembers, cmp, 'serializers');
  addReactivePropHandlers(classMembers, cmp, 'deserializers');
  addHydrateRuntimeCmpMeta(classMembers, cmp);
  transformHostData(classMembers, moduleFile);

  return classMembers;
};
