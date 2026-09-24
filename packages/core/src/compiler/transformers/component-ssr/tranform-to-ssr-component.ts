import ts from 'typescript';
import type * as d from '@stencil/core';

import { addImports } from '../add-imports';
import { addLegacyApis } from '../core-runtime-apis';
import { updateStyleImports } from '../style-imports';
import { getComponentMeta, getModuleFromSourceFile, updateMixin } from '../transform-utils';
import { updateSsrComponentClass } from './ssr-component';

/**
 * A TypeScript transformation that converts component classes into a format that is compatible with the SSR runtime.
 * This includes removing static properties that are only used for the client-side runtime,
 * adding SSR-specific component metadata, updating the constructor and reactive property handlers.
 *
 * @param compilerCtx the compiler context
 * @param transformOpts the transformation options
 * @param buildCtx the current build context
 * @returns a TypeScript transformer factory
 */
export const ssrComponentTransform = (
  compilerCtx: d.CompilerCtx,
  transformOpts: d.TransformOptions,
  buildCtx: d.BuildCtx,
): ts.TransformerFactory<ts.SourceFile> => {
  return (transformCtx) => {
    return (tsSourceFile) => {
      const moduleFile = getModuleFromSourceFile(compilerCtx, tsSourceFile);

      const visitNode = (node: ts.Node): any => {
        if (ts.isClassDeclaration(node)) {
          const cmp = getComponentMeta(compilerCtx, tsSourceFile, node);
          if (cmp != null) {
            return updateSsrComponentClass(node, moduleFile, cmp, buildCtx);
          } else if (compilerCtx.moduleMap.get(tsSourceFile.fileName)?.isMixin) {
            return updateMixin(node, moduleFile, cmp, transformOpts);
          }
        }

        return ts.visitEachChild(node, visitNode, transformCtx);
      };

      tsSourceFile = ts.visitEachChild(tsSourceFile, visitNode, transformCtx);

      if (moduleFile.cmps.length > 0) {
        tsSourceFile = updateStyleImports(transformOpts, tsSourceFile, moduleFile);
      }
      if (moduleFile.isLegacy) {
        addLegacyApis(moduleFile);
      }
      tsSourceFile = addImports(
        transformOpts,
        tsSourceFile,
        moduleFile.coreRuntimeApis,
        transformOpts.coreImportPath,
      );

      return tsSourceFile;
    };
  };
};
