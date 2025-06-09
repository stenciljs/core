import { dirname } from 'path';
import ts from 'typescript';

import type * as d from '../../../declarations';
import { getModuleLegacy, resetModuleLegacy } from '../../build/compiler-ctx';
import { parseCallExpression } from './call-expression';
import { parseStaticComponentMeta } from './component';
import { parseModuleImport } from './import';
import { parseStringLiteral } from './string-literal';

export const convertStaticToMeta = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  typeChecker: ts.TypeChecker,
  collection: d.CollectionCompilerMeta | null,
  transformOpts: d.TransformOptions,
): ts.TransformerFactory<ts.SourceFile> => {
  return (transformCtx) => {
    let dirPath: string;
    let moduleFile: d.Module;

    const visitNode = (node: ts.Node): ts.VisitResult<ts.Node> => {
      if (ts.isClassDeclaration(node)) {
        return parseStaticComponentMeta(compilerCtx, typeChecker, node, moduleFile, transformOpts);
      } else if (ts.isImportDeclaration(node)) {
        parseModuleImport(config, compilerCtx, buildCtx, moduleFile, dirPath, node, !transformOpts.isolatedModules);
      } else if (ts.isCallExpression(node)) {
        parseCallExpression(moduleFile, node);
      } else if (ts.isStringLiteral(node)) {
        parseStringLiteral(moduleFile, node);
      }
      return ts.visitEachChild(node, visitNode, transformCtx);
    };

    return (tsSourceFile) => {
      dirPath = dirname(tsSourceFile.fileName);
      moduleFile = getModuleLegacy(compilerCtx, tsSourceFile.fileName);
      resetModuleLegacy(moduleFile);

      if (collection != null) {
        moduleFile.isCollectionDependency = true;
        moduleFile.collectionName = collection.collectionName;
        collection.moduleFiles.push(moduleFile);
      } else {
        moduleFile.isCollectionDependency = false;
        moduleFile.collectionName = null;
      }

      return visitNode(tsSourceFile) as ts.SourceFile;
    };
  };
};
