import ts from 'typescript';

import type * as d from '../../../declarations';
import { addStaticStylePropertyToClass } from '../add-static-style';
import { transformHostData } from '../host-data-transform';
import { removeStaticMetaProperties } from '../remove-static-meta-properties';
import { updateComponentClass } from '../update-component-class';
import { addWatchers } from '../watcher-meta-transform';
import { updateLazyComponentConstructor } from './lazy-constructor';
import { addLazyElementGetter } from './lazy-element-getter';

/**
 * Update the class declaration node for a Stencil component in order to make
 * it suitable for 'taking over' a bootstrapped lazy build. This involves making
 * edits to the constructor, handling initialization code for various class
 * members, and so on.
 *
 * @param transformOpts transform options
 * @param styleStatements an out param for style-related statements
 * @param classNode the class declaration node
 * @param moduleFile information on the class' home module
 * @param cmp metadata collected during the compilation process
 * @returns the updated class
 */
export const updateLazyComponentClass = (
  transformOpts: d.TransformOptions,
  styleStatements: ts.Statement[],
  classNode: ts.ClassDeclaration,
  moduleFile: d.Module,
  cmp: d.ComponentCompilerMeta,
): ts.VariableStatement | ts.ClassDeclaration => {
  const members = updateLazyComponentMembers(transformOpts, styleStatements, classNode, moduleFile, cmp);
  return updateComponentClass(transformOpts, classNode, classNode.heritageClauses, members);
};

/**
 * Handling updating the component's members for lazy-build duty.
 *
 * @param transformOpts transform options
 * @param styleStatements an out param for style-related statements
 * @param classNode the class declaration node
 * @param moduleFile information on the class' home module
 * @param cmp metadata collected during the compilation process
 * @returns the updated class members
 */
const updateLazyComponentMembers = (
  transformOpts: d.TransformOptions,
  styleStatements: ts.Statement[],
  classNode: ts.ClassDeclaration,
  moduleFile: d.Module,
  cmp: d.ComponentCompilerMeta,
): ts.ClassElement[] => {
  const classMembers = removeStaticMetaProperties(classNode);

  updateLazyComponentConstructor(classMembers, classNode, moduleFile, cmp);
  addLazyElementGetter(classMembers, moduleFile, cmp);
  addWatchers(classMembers, cmp);
  transformHostData(classMembers, moduleFile);

  if (transformOpts.style === 'static') {
    addStaticStylePropertyToClass(styleStatements, cmp);
  }

  return classMembers;
};
