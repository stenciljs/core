import { normalizePath } from '@utils';
import ts from 'typescript';

import type * as d from '../../declarations';

/**
 * Helper function for retrieving a Stencil {@link d.Module} from the provided compiler context
 * @param compilerCtx the compiler context to retrieve the `Module` from
 * @param filePath the path of the file corresponding to the `Module` to lookup
 * @returns the `Module`, or `undefined` if one cannot be found
 */
export const getModule = (compilerCtx: d.CompilerCtx, filePath: string): d.Module | undefined =>
  compilerCtx.moduleMap.get(normalizePath(filePath));

/**
 * Creates a {@link d.Module} entity with reasonable defaults
 * @param staticSourceFile the TypeScript representation of the source file. This may not be the original
 * representation of the file, but instead a new `SourceFile` created using the TypeScript API
 * @param staticSourceFileText the text from the `SourceFile`. This text may originate from the original representation
 * of the file.
 * @param emitFilepath the path of the JavaScript file that should be emitted after transpilation
 * @returns the created `Module`
 */
export const createModule = (
  staticSourceFile: ts.SourceFile, // this may NOT be the original
  staticSourceFileText: string,
  emitFilepath: string,
): d.Module => ({
  sourceFilePath: normalizePath(staticSourceFile.fileName),
  jsFilePath: emitFilepath,
  staticSourceFile,
  staticSourceFileText,
  cmps: [],
  coreRuntimeApis: [],
  outputTargetCoreRuntimeApis: {},
  collectionName: null,
  dtsFilePath: null,
  excludeFromCollection: false,
  externalImports: [],
  hasVdomAttribute: false,
  hasVdomClass: false,
  hasVdomFunctional: false,
  hasVdomKey: false,
  hasVdomListener: false,
  hasVdomPropOrAttr: false,
  hasVdomRef: false,
  hasVdomRender: false,
  hasVdomStyle: false,
  hasVdomText: false,
  hasVdomXlink: false,
  htmlAttrNames: [],
  htmlParts: [],
  htmlTagNames: [],
  isCollectionDependency: false,
  isLegacy: false,
  localImports: [],
  originalCollectionComponentPath: null,
  originalImports: [],
  potentialCmpRefs: [],
  sourceMapPath: null,
  sourceMapFileText: null,
});
