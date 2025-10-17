import ts from 'typescript';

import type * as d from '../../../declarations';
import { addImports } from '../add-imports';
import { addCoreRuntimeApi, addLegacyApis, RUNTIME_APIS } from '../core-runtime-apis';
import { updateStyleImports } from '../style-imports';
import { getComponentMeta, getModuleFromSourceFile, updateMixin } from '../transform-utils';
import { updateHydrateComponentClass } from './hydrate-component';

export const hydrateComponentTransform = (
  compilerCtx: d.CompilerCtx,
  transformOpts: d.TransformOptions,
  buildCtx: d.BuildCtx,
): ts.TransformerFactory<ts.SourceFile> => {
  return (transformCtx) => {
    return (tsSourceFile) => {
      const moduleFile = getModuleFromSourceFile(compilerCtx, tsSourceFile);

      if (buildCtx.config.extras.additionalTagTransformers) {
        addCoreRuntimeApi(moduleFile, RUNTIME_APIS.transformTag);
      }

      const visitNode = (node: ts.Node): any => {
        if (ts.isClassDeclaration(node)) {
          const cmp = getComponentMeta(compilerCtx, tsSourceFile, node);
          if (cmp != null) {
            return updateHydrateComponentClass(node, moduleFile, cmp, buildCtx);
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
      tsSourceFile = addImports(transformOpts, tsSourceFile, moduleFile.coreRuntimeApis, transformOpts.coreImportPath);

      return tsSourceFile;
    };
  };
};
