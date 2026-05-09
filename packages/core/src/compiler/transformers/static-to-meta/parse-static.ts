import { basename, dirname } from 'path';
import ts from 'typescript';
import type * as d from '@stencil/core';

import { join, normalizePath } from '../../../utils';
import { createModule, getModule } from '../../transpile/transpiled-module';
import { getComponentTagName, isStaticGetter } from '../transform-utils';
import { parseCallExpression } from './call-expression';
import { parseStaticComponentMeta } from './component';
import { parseModuleImport } from './import';
import { parseStringLiteral } from './string-literal';

/**
 * Stencil static getter names that indicate a class has Stencil metadata
 * and can be extended by other components (mixin/abstract class pattern).
 */
const STENCIL_MIXIN_STATIC_MEMBERS = [
  'properties',
  'states',
  'methods',
  'events',
  'listeners',
  'watchers',
];

/**
 * Gets the name of a class member as a string, safely handling cases where
 * getText() might not work (e.g., synthetic nodes without source file context).
 *
 * @param member - the class element to get the name from
 * @returns the member name as a string, or undefined if not found
 */
const getMemberName = (member: ts.ClassElement): string | undefined => {
  if (!member.name) return undefined;
  if (ts.isIdentifier(member.name)) {
    return member.name.text ?? member.name.escapedText?.toString();
  }
  if (ts.isStringLiteral(member.name)) {
    return member.name.text;
  }
  return undefined;
};

/**
 * Checks if a class declaration is an exportable mixin - i.e., it has Stencil
 * static getters (properties, states, etc.) but is NOT a component (no tag name).
 * These are abstract/partial classes meant to be extended by actual components.
 *
 * @param classNode - the class declaration to check
 * @returns true if the class is an exportable mixin
 */
const isExportableMixinClass = (classNode: ts.ClassDeclaration): boolean => {
  const staticGetters = classNode.members.filter(isStaticGetter);
  if (staticGetters.length === 0) return false;

  // If it has a tag name, it's a component, not a mixin
  const tagName = getComponentTagName(staticGetters);
  if (tagName) return false;

  // Check if it has any Stencil mixin static members
  return staticGetters.some((getter) => {
    const name = getMemberName(getter);
    return name && STENCIL_MIXIN_STATIC_MEMBERS.includes(name);
  });
};

/**
 * Update or create a module entry for a TypeScript source file.
 *
 * @param config - the validated Stencil configuration
 * @param compilerCtx - the current compiler context
 * @param buildCtx - the current build context
 * @param tsSourceFile - the TypeScript source file
 * @param sourceFileText - the text content of the source file
 * @param emitFilePath - the path where the file will be emitted
 * @param typeChecker - the TypeScript type checker
 * @param collection - collection metadata, if this is a collection dependency
 * @returns the updated or created module
 */
export const updateModule = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  tsSourceFile: ts.SourceFile,
  sourceFileText: string,
  emitFilePath: string,
  typeChecker: ts.TypeChecker,
  collection: d.CollectionCompilerMeta,
): d.Module => {
  const sourceFilePath = normalizePath(tsSourceFile.fileName);
  const prevModuleFile = getModule(compilerCtx, sourceFilePath);

  if (prevModuleFile && prevModuleFile.staticSourceFileText === sourceFileText) {
    return prevModuleFile;
  }

  const srcDirPath = dirname(sourceFilePath);
  const emitFileName = basename(emitFilePath);
  emitFilePath = normalizePath(join(srcDirPath, emitFileName));

  const moduleFile = createModule(tsSourceFile, sourceFileText, emitFilePath);

  if (emitFilePath.endsWith('.js.map')) {
    moduleFile.sourceMapPath = emitFilePath;
    moduleFile.sourceMapFileText = sourceFileText;
  } else if (prevModuleFile && prevModuleFile.sourceMapPath) {
    moduleFile.sourceMapPath = prevModuleFile.sourceMapPath;
    moduleFile.sourceMapFileText = prevModuleFile.sourceMapFileText;
  }
  const moduleFileKey = normalizePath(moduleFile.sourceFilePath);
  compilerCtx.moduleMap.set(moduleFileKey, moduleFile);
  compilerCtx.changedModules.add(moduleFile.sourceFilePath);

  const visitNode = (node: ts.Node) => {
    if (ts.isClassDeclaration(node)) {
      // First try to parse as a component
      parseStaticComponentMeta(compilerCtx, typeChecker, node, moduleFile, buildCtx, undefined);

      // Also check if this is an exportable mixin class (has Stencil static members but no tag)
      if (isExportableMixinClass(node)) {
        moduleFile.hasExportableMixins = true;
      }
      return;
    } else if (ts.isImportDeclaration(node)) {
      parseModuleImport(config, compilerCtx, buildCtx, moduleFile, srcDirPath, node, true);
      return;
    } else if (ts.isCallExpression(node)) {
      parseCallExpression(moduleFile, node, typeChecker);
    } else if (ts.isStringLiteral(node)) {
      parseStringLiteral(moduleFile, node);
    } else if (ts.isVariableStatement(node)) {
      // Look for mixin patterns like `const MyMixin = (Base) => class MyMixin extends Base { ... }`
      node.declarationList.declarations.forEach((declaration) => {
        if (declaration.initializer) {
          if (
            ts.isArrowFunction(declaration.initializer) ||
            ts.isFunctionExpression(declaration.initializer)
          ) {
            const funcBody = declaration.initializer.body;
            // Handle functions with block body: (Base) => { class MyMixin ... }
            if (ts.isBlock(funcBody)) {
              funcBody.statements.forEach((statement) => {
                // Look for class declarations in the function body (mixin factory pattern)
                if (ts.isClassDeclaration(statement)) {
                  if (isExportableMixinClass(statement)) {
                    moduleFile.hasExportableMixins = true;
                  }
                  statement.members.forEach((member) => {
                    if (ts.isPropertyDeclaration(member) && member.initializer) {
                      // Traverse into the property initializer (e.g., arrow function)
                      ts.forEachChild(member.initializer, visitNode);
                    }
                  });
                }
              });
            }
          }
        }
      });
    }
    node.forEachChild(visitNode);
  };

  if (collection != null) {
    moduleFile.isCollectionDependency = true;
    moduleFile.collectionName = collection.collectionName;
    collection.moduleFiles.push(moduleFile);
  }
  visitNode(tsSourceFile);

  // Create a JS-mode source file for class-extension processing (mixin metadata from external collections).
  // ScriptKind.JS is intentional: const enum values are already inlined in the source text, so
  // reparsing as TypeScript would encounter unresolvable const enum declarations.
  if (moduleFile.cmps.length > 0 || moduleFile.hasExportableMixins) {
    moduleFile.staticSourceFile = ts.createSourceFile(
      sourceFilePath,
      sourceFileText,
      tsSourceFile.languageVersion,
      true,
      ts.ScriptKind.JS,
    );
  }
  return moduleFile;
};
