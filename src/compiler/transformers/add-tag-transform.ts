import ts from 'typescript';
// import { getComponentMeta, getModuleFromSourceFile, updateMixin } from './transform-utils';

import type * as d from '../../declarations';

export const addTagTransformer = (
  _compilerCtx: d.CompilerCtx,
  _transformOpts: d.TransformOptions,
): ts.TransformerFactory<ts.SourceFile> => {
  return (_transformCtx) => {
    return (tsSourceFile) => {
      // const styleStatements: ts.Statement[] = [];
      // const moduleFile = getModuleFromSourceFile(compilerCtx, tsSourceFile);

      // const visitNode = (node: ts.Node): any => {
      //   if (ts.isClassDeclaration(node)) {
      //     // const cmp = getComponentMeta(compilerCtx, tsSourceFile, node);
      //     // const module = compilerCtx.moduleMap.get(tsSourceFile.fileName);

          
      //   }
      //   return ts.visitEachChild(node, visitNode, transformCtx);
      // };

      // tsSourceFile = ts.visitEachChild(tsSourceFile, visitNode, transformCtx);

      // if (moduleFile.cmps.length > 0) {
      //   tsSourceFile = updateStyleImports(transformOpts, tsSourceFile, moduleFile);
      // }

      // if (moduleFile.isLegacy) {
      //   addLegacyApis(moduleFile);
      // }
      // tsSourceFile = addImports(transformOpts, tsSourceFile, moduleFile.coreRuntimeApis, transformOpts.coreImportPath);

      // if (styleStatements.length > 0) {
      //   tsSourceFile = ts.factory.updateSourceFile(tsSourceFile, [...tsSourceFile.statements, ...styleStatements]);
      // }

      // const printer: ts.Printer = ts.createPrinter();
      // let sourceFile = ts.createSourceFile(
      //   'dummy.ts',
      //   '',
      //   ts.ScriptTarget.ESNext,
      //   false,
      //   ts.ScriptKind.TS
      // );
      // sourceFile = ts.factory.updateSourceFile(sourceFile, ts.factory.createNodeArray([nice]));
      // console.log(printer.printFile(tsSourceFile));

      return tsSourceFile;
    };
  };
};
