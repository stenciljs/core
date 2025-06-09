import { DIST_CUSTOM_ELEMENTS } from '@utils';
import ts from 'typescript';

import type * as d from '../../../declarations';
import { addModuleMetadataProxies } from '../add-component-meta-proxy';
import { addImports } from '../add-imports';
import { addLegacyApis } from '../core-runtime-apis';
import { defineCustomElement } from '../define-custom-element';
import { updateStyleImports } from '../style-imports';
import { getComponentMeta, getModuleFromSourceFile } from '../transform-utils';
import { updateNativeComponentClass } from './native-component';

/**
 * A function that returns a transformation factory. The returned factory
 * performs a series of transformations on Stencil components, in order to
 * generate 'native' web components, which is to say standalone custom elements
 * that are defined by classes extending `HTMLElement` with a
 * `connectedCallback` method and so on.
 *
 * Note that this is an 'output target' level transformer, i.e. it is
 * designed to be run on a Stencil component which has already undergone
 * initial transformation (which handles things like converting decorators to
 * static and so on).

 *
 * @param compilerCtx the current compiler context, which acts as the source of truth for the transformations
 * @param transformOpts the transformation configuration to use when performing the transformations
 * @returns a transformer factory, to be run by the TypeScript compiler
 */
export const nativeComponentTransform = (
  compilerCtx: d.CompilerCtx,
  transformOpts: d.TransformOptions,
): ts.TransformerFactory<ts.SourceFile> => {
  return (transformCtx: ts.TransformationContext) => {
    return (tsSourceFile: ts.SourceFile) => {
      const moduleFile = getModuleFromSourceFile(compilerCtx, tsSourceFile);

      /**
       * Helper function that recursively walks the concrete syntax tree. Upon finding a class declaration that Stencil
       * recognizes as a component, update the component class
       * @param node the current node in the tree being inspected
       * @returns the updated component class, or the unchanged node
       */
      const visitNode = (node: ts.Node): ts.Node => {
        if (ts.isClassDeclaration(node)) {
          const cmp = getComponentMeta(compilerCtx, tsSourceFile, node);
          if (cmp != null) {
            return updateNativeComponentClass(transformOpts, node, moduleFile, cmp);
          }
        }

        return ts.visitEachChild(node, visitNode, transformCtx);
      };

      tsSourceFile = ts.visitEachChild(tsSourceFile, visitNode, transformCtx);

      if (moduleFile.cmps.length > 0) {
        if (transformOpts.componentExport === 'customelement') {
          // define custom element, will have no export
          tsSourceFile = defineCustomElement(tsSourceFile, moduleFile, transformOpts);
        } else if (transformOpts.proxy === 'defineproperty') {
          // exporting as a module, but also add the component proxy fn
          tsSourceFile = addModuleMetadataProxies(tsSourceFile, moduleFile);
        }

        tsSourceFile = updateStyleImports(transformOpts, tsSourceFile, moduleFile);
      }

      if (moduleFile.isLegacy) {
        addLegacyApis(moduleFile);
      }

      const imports = [
        ...(moduleFile?.coreRuntimeApis ?? []),
        ...(moduleFile?.outputTargetCoreRuntimeApis[DIST_CUSTOM_ELEMENTS] ?? []),
      ];

      tsSourceFile = addImports(transformOpts, tsSourceFile, imports, transformOpts.coreImportPath);

      return tsSourceFile;
    };
  };
};
