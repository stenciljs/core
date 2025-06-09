import { DIST_CUSTOM_ELEMENTS } from '@utils';
import ts from 'typescript';

import type * as d from '../../../declarations';
import { addOutputTargetCoreRuntimeApi, HTML_ELEMENT, RUNTIME_APIS } from '../core-runtime-apis';
import { transformHostData } from '../host-data-transform';
import { removeStaticMetaProperties } from '../remove-static-meta-properties';
import { updateComponentClass } from '../update-component-class';
import { addWatchers } from '../watcher-meta-transform';
import { addNativeConnectedCallback } from './native-connected-callback';
import { updateNativeConstructor } from './native-constructor';
import { addNativeElementGetter } from './native-element-getter';
import { addNativeComponentMeta } from './native-meta';
import { addNativeStaticStyle } from './native-static-style';

/**
 * Update a {@link ts.ClassDeclaration} which corresponds to a Stencil
 * component to ensure that it will work as a standalone custom element in the
 * browser (a 'native' web component).
 *
 * This involves ensuring that the class extends `HTMLElement`, ensuring that
 * it has a constructor, adding a `connectedCallback` method, and a few things
 * that are Stencil-specific implementation details.
 *
 * @param transformOpts options governing how Stencil components should be
 * transformed
 * @param classNode the class to transform
 * @param moduleFile information about the class' home module
 * @param cmp metadata about the stencil component of interest
 * @returns an updated class
 */
export const updateNativeComponentClass = (
  transformOpts: d.TransformOptions,
  classNode: ts.ClassDeclaration,
  moduleFile: d.Module,
  cmp: d.ComponentCompilerMeta,
): ts.ClassDeclaration | ts.VariableStatement => {
  const withHeritageClauses = updateNativeHostComponentHeritageClauses(classNode, moduleFile);
  const members = updateNativeHostComponentMembers(transformOpts, withHeritageClauses, moduleFile, cmp);
  return updateComponentClass(transformOpts, withHeritageClauses, withHeritageClauses.heritageClauses, members);
};

/**
 * Update or generate a heritage clause (e.g. `extends [IDENTIFIER]`) for a
 * Stencil component to extend `HTMLElement`
 *
 * @param classNode the syntax tree of the Stencil component class to update
 * @param moduleFile the Stencil Module associated with the provided class node
 * @returns an updated class declaration with the generated heritage clause
 */
const updateNativeHostComponentHeritageClauses = (
  classNode: ts.ClassDeclaration,
  moduleFile: d.Module,
): ts.ClassDeclaration => {
  if (classNode.heritageClauses != null && classNode.heritageClauses.length > 0) {
    // the syntax tree has a heritage clause already, don't generate a new one
    return classNode;
  }

  if (moduleFile.cmps.length >= 1) {
    // we'll need to import `HTMLElement` in order to extend it
    addOutputTargetCoreRuntimeApi(moduleFile, DIST_CUSTOM_ELEMENTS, RUNTIME_APIS.HTMLElement);
  }

  const heritageClause = ts.factory.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [
    ts.factory.createExpressionWithTypeArguments(ts.factory.createIdentifier(HTML_ELEMENT), []),
  ]);

  return ts.factory.updateClassDeclaration(
    classNode,
    classNode.modifiers,
    classNode.name,
    classNode.typeParameters,
    [heritageClause],
    classNode.members,
  );
};

/**
 * Perform various modifications to the class members of a Stencil component
 * which are necessary for it to be a 'native' web component.
 *
 * This includes adding or updating the constructor, adding a
 * `connectedCallback` method, implementing the `@Element` decorator, and
 * adding static values for watchers.
 *
 * @param transformOpts options governing how Stencil components should be
 * transformed
 * @param classNode the class to transform
 * @param moduleFile information about the class' home module
 * @param cmp metadata about the stencil component of interest
 * @returns an updated list of class elements
 */
const updateNativeHostComponentMembers = (
  transformOpts: d.TransformOptions,
  classNode: ts.ClassDeclaration,
  moduleFile: d.Module,
  cmp: d.ComponentCompilerMeta,
): ts.ClassElement[] => {
  const classMembers = removeStaticMetaProperties(classNode);

  updateNativeConstructor(classMembers, moduleFile, cmp, classNode);
  addNativeConnectedCallback(classMembers, cmp);
  addNativeElementGetter(classMembers, cmp);
  addWatchers(classMembers, cmp);

  if (cmp.isPlain) {
    addNativeComponentMeta(classMembers, cmp);
  }

  if (transformOpts.style === 'static') {
    addNativeStaticStyle(classMembers, cmp);
  }

  transformHostData(classMembers, moduleFile);

  return classMembers;
};
