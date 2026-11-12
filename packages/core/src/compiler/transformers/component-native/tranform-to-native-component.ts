import ts from 'typescript';
import type * as d from '@stencil/core';

import { STANDALONE } from '../../../utils';
import { addModuleMetadataProxies } from '../add-component-meta-proxy';
import { addImports } from '../add-imports';
import { addLegacyApis } from '../core-runtime-apis';
import { defineCustomElement } from '../define-custom-element';
import { updateStyleImports } from '../style-imports';
import { getComponentMeta, getModuleFromSourceFile, isStaticGetter } from '../transform-utils';
import {
  updateNativeBaseClass,
  updateNativeComponentClass,
  updateNativeSuperClass,
} from './native-component';

const STENCIL_META_GETTER_NAMES = [
  'properties',
  'states',
  'events',
  'listeners',
  'watchers',
  'methods',
] as const;

/*
 * Returns true when a class has Stencil static meta getters but no `@Component` metadata.
 * @param node the class to inspect
 * @returns true if the class is a Stencil base class, false otherwise
 */
const isStencilBaseClass = (node: ts.ClassDeclaration): boolean =>
  node.members.some(
    (m) =>
      isStaticGetter(m) &&
      ts.isGetAccessorDeclaration(m) &&
      ts.isIdentifier(m.name) &&
      (STENCIL_META_GETTER_NAMES as readonly string[]).includes(m.name.text),
  );

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
 * @param buildCtx the current build context
 * @returns a transformer factory, to be run by the TypeScript compiler
 */
export const nativeComponentTransform = (
  compilerCtx: d.CompilerCtx,
  transformOpts: d.TransformOptions,
  buildCtx: d.BuildCtx,
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
            return updateNativeComponentClass(transformOpts, node, moduleFile, cmp, buildCtx);
          } else if (compilerCtx.moduleMap.get(tsSourceFile.fileName)?.isExtended) {
            return updateNativeSuperClass(node, moduleFile, transformOpts);
          } else if (
            moduleFile &&
            (isStencilBaseClass(node) || transformOpts.transformAsBaseClass)
          ) {
            // Inject `extends HTMLElement` and preserve the export so components can
            // import as a base class. Triggered either by detecting Stencil
            // static meta-getters on the class, or by the explicit `transformAsBaseClass`
            // flag (used by bundler plugins (via `transpile()`) for plain base classes with no decorators).
            return updateNativeBaseClass(node, moduleFile);
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
        ...(moduleFile?.outputTargetCoreRuntimeApis[STANDALONE] ?? []),
      ];

      tsSourceFile = addImports(transformOpts, tsSourceFile, imports, transformOpts.coreImportPath);

      return tsSourceFile;
    };
  };
};
