import ts from 'typescript';
import type * as d from '@stencil/core';

import { updateLazyComponentConstructor } from '../component-lazy/lazy-constructor';
import { addLazyElementGetter } from '../component-lazy/lazy-element-getter';
import { transformHostData } from '../host-data-transform';
import { addReactivePropHandlers } from '../reactive-handler-meta-transform';
import { removeStaticMetaProperties } from '../remove-static-meta-properties';
import { retrieveModifierLike } from '../transform-utils';
import { addHydrateRuntimeCmpMeta } from './ssr-runtime-cmp-meta';

/**
 * Transform a component class into a version that is suitable for use in the SSR runtime. This includes:
 * - Removing static properties that are only used for the client-side runtime
 * - Adding a static `cmpMeta` property with SSR-specific component metadata
 * - Updating the constructor to be lazy (only initialize when needed in the app factory)
 * - Adding a static getter for the lazy element (which is used in the app factory to determine which components are needed)
 * - Adding reactive property handlers for watchers, serializers, and deserializers (which are used in the app factory to set up reactive properties)
 * - Transforming the `hostData` method to be compatible with SSR
 *
 * @param classNode the class declaration to transform
 * @param moduleFile the module file containing the class declaration
 * @param cmp the component metadata for the class declaration
 * @param buildCtx the current build context
 * @returns the updated class declaration
 */
export const updateSsrComponentClass = (
  classNode: ts.ClassDeclaration,
  moduleFile: d.Module,
  cmp: d.ComponentCompilerMeta,
  buildCtx: d.BuildCtx,
) => {
  return ts.factory.updateClassDeclaration(
    classNode,
    retrieveModifierLike(classNode),
    classNode.name,
    classNode.typeParameters,
    classNode.heritageClauses,
    updateSsrHostComponentMembers(classNode, moduleFile, cmp, buildCtx),
  );
};

const updateSsrHostComponentMembers = (
  classNode: ts.ClassDeclaration,
  moduleFile: d.Module,
  cmp: d.ComponentCompilerMeta,
  buildCtx: d.BuildCtx,
) => {
  const classMembers = removeStaticMetaProperties(classNode);

  updateLazyComponentConstructor(classMembers, classNode, moduleFile, cmp);
  addLazyElementGetter(classMembers, moduleFile, cmp);
  addReactivePropHandlers(classMembers, cmp, 'watchers');
  addReactivePropHandlers(classMembers, cmp, 'serializers');
  addReactivePropHandlers(classMembers, cmp, 'deserializers');
  addHydrateRuntimeCmpMeta(classMembers, cmp, buildCtx);
  transformHostData(classMembers, moduleFile);

  return classMembers;
};
