import type * as d from '@stencil/core/declarations';
import { mockBuildCtx, mockCompilerCtx, mockModule, mockValidatedConfig } from '@stencil/core/testing';
import ts from 'typescript';

import { performAutomaticKeyInsertion } from '../automatic-key-insertion';
import { convertDecoratorsToStatic } from '../decorators-to-static/convert-decorators';
import { updateModule } from '../static-to-meta/parse-static';
import { convertStaticToMeta } from '../static-to-meta/visitor';
import { getScriptTarget } from '../transform-utils';

/**
 * Testing utility for transpiling provided string containing valid Stencil code
 *
 * @param input the code to transpile
 * @param config a Stencil configuration to apply during the transpilation
 * @param compilerCtx a compiler context to use in the transpilation process
 * @param beforeTransformers TypeScript transformers that should be applied before the code is emitted
 * @param afterTransformers TypeScript transformers that should be applied after the code is emitted
 * @param afterDeclarations TypeScript transformers that should be applied
 * after declarations are generated
 * @param tsConfig optional typescript compiler options to use
 * @param inputFileName a dummy filename to use for the module (defaults to `module.tsx`)
 * @returns the result of the transpilation step
 */
export function transpileModule(
  input: string,
  config?: Partial<d.ValidatedConfig> | null,
  compilerCtx?: d.CompilerCtx | null,
  beforeTransformers: ts.TransformerFactory<ts.SourceFile>[] = [],
  afterTransformers: ts.TransformerFactory<ts.SourceFile>[] = [],
  afterDeclarations: ts.TransformerFactory<ts.SourceFile | ts.Bundle>[] = [],
  tsConfig: ts.CompilerOptions = {},
  inputFileName = 'module.tsx',
) {
  const options: ts.CompilerOptions = {
    ...ts.getDefaultCompilerOptions(),
    allowNonTsExtensions: true,
    composite: undefined,
    declaration: undefined,
    declarationDir: undefined,
    experimentalDecorators: true,
    isolatedModules: true,
    jsx: ts.JsxEmit.React,
    jsxFactory: 'h',
    jsxFragmentFactory: 'Fragment',
    lib: undefined,
    module: ts.ModuleKind.ESNext,
    noEmit: undefined,
    noEmitHelpers: true,
    noEmitOnError: undefined,
    noLib: true,
    noResolve: true,
    out: undefined,
    outFile: undefined,
    paths: undefined,
    removeComments: false,
    rootDirs: undefined,
    suppressOutputPathCheck: true,
    target: getScriptTarget(),
    types: undefined,
    // add in possible default config overrides
    ...tsConfig,
  };

  const initConfig = mockValidatedConfig();
  const mergedConfig: d.ValidatedConfig = { ...initConfig, ...config };
  compilerCtx = compilerCtx || mockCompilerCtx(mergedConfig);

  const sourceFile = ts.createSourceFile(inputFileName, input, options.target);

  let outputText: string;
  let declarationOutputText: string;

  const emitCallback: ts.WriteFileCallback = (emitFilePath, data, _w, _e, tsSourceFiles) => {
    if (emitFilePath.endsWith('.js')) {
      outputText = prettifyTSOutput(data);
      updateModule(mergedConfig, compilerCtx, buildCtx, tsSourceFiles[0], data, emitFilePath, tsTypeChecker, null);
    }
    if (emitFilePath.endsWith('.d.ts')) {
      declarationOutputText = prettifyTSOutput(data);
    }
  };

  const compilerHost: ts.CompilerHost = {
    getSourceFile: (fileName) => (fileName === inputFileName ? sourceFile : undefined),
    writeFile: emitCallback,
    getDefaultLibFileName: () => 'lib.d.ts',
    useCaseSensitiveFileNames: () => false,
    getCanonicalFileName: (fileName) => fileName,
    getCurrentDirectory: () => '',
    getNewLine: () => '',
    fileExists: (fileName) => fileName === inputFileName,
    readFile: () => '',
    directoryExists: () => true,
    getDirectories: () => [],
  };

  const tsProgram = ts.createProgram([inputFileName], options, compilerHost);
  const tsTypeChecker = tsProgram.getTypeChecker();

  const buildCtx = mockBuildCtx(mergedConfig, compilerCtx);

  const transformOpts: d.TransformOptions = {
    coreImportPath: '@stencil/core',
    componentExport: 'lazy',
    componentMetadata: null,
    currentDirectory: '/',
    proxy: null,
    style: 'static',
    styleImportData: 'queryparams',
  };

  tsProgram.emit(undefined, undefined, undefined, undefined, {
    before: [
      convertDecoratorsToStatic(mergedConfig, buildCtx.diagnostics, tsTypeChecker, tsProgram),
      performAutomaticKeyInsertion,
      ...beforeTransformers,
    ],
    after: [
      (context) => {
        let newSource: ts.SourceFile;
        const visitNode = (node: ts.Node): ts.Node => {
          // just a patch for testing - source file resolution gets
          // lost in the after transform phase
          node.getSourceFile = () => newSource;
          return ts.visitEachChild(node, visitNode, context);
        };
        return (sourceFile: ts.SourceFile): ts.SourceFile => {
          newSource = sourceFile;
          return visitNode(sourceFile) as ts.SourceFile;
        };
      },
      convertStaticToMeta(mergedConfig, compilerCtx, buildCtx, tsTypeChecker, null, transformOpts),
      ...afterTransformers,
    ],
    afterDeclarations,
  });

  const moduleFile: d.Module = compilerCtx.moduleMap.values().next().value;
  const cmps = moduleFile ? moduleFile.cmps : null;
  const cmp = Array.isArray(cmps) && cmps.length > 0 ? cmps[0] : null;
  const tagName = cmp ? cmp.tagName : null;
  const componentClassName = cmp ? cmp.componentClassName : null;
  const properties = cmp ? cmp.properties : null;
  const virtualProperties = cmp ? cmp.virtualProperties : null;
  const property = properties ? properties[0] : null;
  const states = cmp ? cmp.states : null;
  const state = states ? states[0] : null;
  const listeners = cmp ? cmp.listeners : null;
  const listener = listeners ? listeners[0] : null;
  const events = cmp ? cmp.events : null;
  const event = events ? events[0] : null;
  const methods = cmp ? cmp.methods : null;
  const method = methods ? methods[0] : null;
  const elementRef = cmp ? cmp.elementRef : null;
  const watchers = cmp ? cmp.watchers : null;
  const isMixin = cmp ? moduleFile.isMixin : false;
  const isExtended = cmp ? moduleFile.isExtended : false;
  const serializers = cmp ? cmp.serializers : null;
  const deserializers = cmp ? cmp.deserializers : null;

  if (buildCtx.hasError || buildCtx.hasWarning) {
    throw new Error(buildCtx.diagnostics[0].messageText as string);
  }

  return {
    buildCtx,
    cmp,
    cmps,
    compilerCtx,
    componentClassName,
    declarationOutputText,
    deserializers,
    diagnostics: buildCtx.diagnostics,
    elementRef,
    event,
    events,
    listener,
    listeners,
    method,
    methods,
    moduleFile,
    outputText,
    properties,
    watchers,
    property,
    serializers,
    state,
    states,
    tagName,
    virtualProperties,
    isMixin,
    isExtended,
  };
}

/**
 * Rewrites any stretches of whitespace in the TypeScript output to take up a
 * single space instead. This makes it a little more readable to write out strings
 * in spec files for comparison.
 *
 * @param tsOutput the string to process
 * @returns that string with any stretches of whitespace shrunk down to one space
 */
const prettifyTSOutput = (tsOutput: string): string => tsOutput.replace(/\s+/gm, ' ');

/**
 * Multi-file variant of {@link transpileModule}. Accepts a map of `{ fileName → source }` pairs
 * so tests can exercise cross-file scenarios (e.g. importing a mixin factory through a barrel
 * index file).
 *
 * The first entry in `files` is treated as the main component file. Auxiliary files are
 * registered in `compilerCtx.moduleMap` before the main file is transpiled so that
 * `buildExtendsTree` can resolve them when walking import statements.
 *
 * @param files ordered record of { fileName: fileContent } — first entry is the main input
 * @param config optional Stencil config overrides
 * @param tsConfig optional TypeScript compiler option overrides
 * @returns the same shape as {@link transpileModule}
 */
export function transpileModules(
  files: Record<string, string>,
  config?: Partial<d.ValidatedConfig> | null,
  tsConfig: ts.CompilerOptions = {},
) {
  const options: ts.CompilerOptions = {
    ...ts.getDefaultCompilerOptions(),
    allowNonTsExtensions: true,
    composite: undefined,
    declaration: undefined,
    declarationDir: undefined,
    experimentalDecorators: true,
    jsx: ts.JsxEmit.React,
    jsxFactory: 'h',
    jsxFragmentFactory: 'Fragment',
    lib: undefined,
    module: ts.ModuleKind.ESNext,
    noEmit: undefined,
    noEmitHelpers: true,
    noEmitOnError: undefined,
    noLib: true,
    out: undefined,
    outFile: undefined,
    paths: undefined,
    removeComments: false,
    rootDirs: undefined,
    suppressOutputPathCheck: true,
    target: getScriptTarget(),
    types: undefined,
    ...tsConfig,
  };

  const initConfig = mockValidatedConfig();
  const mergedConfig: d.ValidatedConfig = { ...initConfig, ...config };
  const compilerCtx: d.CompilerCtx = mockCompilerCtx(mergedConfig);

  // Build TS source files for every entry
  const sourceFiles = new Map<string, ts.SourceFile>(
    Object.entries(files).map(([fileName, src]) => [fileName, ts.createSourceFile(fileName, src, options.target)]),
  );

  // Pre-populate moduleMap with auxiliary files so buildExtendsTree can resolve them
  const [mainFileName] = Object.keys(files);
  for (const [fileName, sourceFile] of sourceFiles) {
    if (fileName === mainFileName) continue;
    const mod = mockModule({ sourceFilePath: fileName, staticSourceFile: sourceFile });
    compilerCtx.moduleMap.set(fileName, mod);
  }

  const mainSourceFile = sourceFiles.get(mainFileName)!;

  let outputText: string;
  let declarationOutputText: string;

  const buildCtx = mockBuildCtx(mergedConfig, compilerCtx);

  const emitCallback: ts.WriteFileCallback = (emitFilePath, data, _w, _e, tsSourceFiles) => {
    if (emitFilePath.endsWith('.js')) {
      outputText = prettifyTSOutput(data);
      updateModule(mergedConfig, compilerCtx, buildCtx, tsSourceFiles[0], data, emitFilePath, tsTypeChecker, null);
    }
    if (emitFilePath.endsWith('.d.ts')) {
      declarationOutputText = prettifyTSOutput(data);
    }
  };

  const compilerHost: ts.CompilerHost = {
    getSourceFile: (fileName) => sourceFiles.get(fileName),
    writeFile: emitCallback,
    getDefaultLibFileName: () => 'lib.d.ts',
    useCaseSensitiveFileNames: () => false,
    getCanonicalFileName: (fileName) => fileName,
    getCurrentDirectory: () => '',
    getNewLine: () => '',
    fileExists: (fileName) => sourceFiles.has(fileName),
    readFile: () => '',
    directoryExists: () => true,
    getDirectories: () => [],
  };

  const tsProgram = ts.createProgram([mainFileName], options, compilerHost);
  const tsTypeChecker = tsProgram.getTypeChecker();

  const transformOpts: d.TransformOptions = {
    coreImportPath: '@stencil/core',
    componentExport: 'lazy',
    componentMetadata: null,
    currentDirectory: '/',
    proxy: null,
    style: 'static',
    styleImportData: 'queryparams',
  };

  tsProgram.emit(mainSourceFile, undefined, undefined, undefined, {
    before: [
      convertDecoratorsToStatic(mergedConfig, buildCtx.diagnostics, tsTypeChecker, tsProgram),
      performAutomaticKeyInsertion,
    ],
    after: [
      (context) => {
        let newSource: ts.SourceFile;
        const visitNode = (node: ts.Node): ts.Node => {
          node.getSourceFile = () => newSource;
          return ts.visitEachChild(node, visitNode, context);
        };
        return (sf: ts.SourceFile): ts.SourceFile => {
          newSource = sf;
          return visitNode(sf) as ts.SourceFile;
        };
      },
      convertStaticToMeta(mergedConfig, compilerCtx, buildCtx, tsTypeChecker, null, transformOpts),
    ],
  });

  const moduleFile: d.Module = compilerCtx.moduleMap.get(mainFileName);
  const cmps = moduleFile ? moduleFile.cmps : null;
  const cmp = Array.isArray(cmps) && cmps.length > 0 ? cmps[0] : null;
  const properties = cmp ? cmp.properties : null;
  const states = cmp ? cmp.states : null;
  const methods = cmp ? cmp.methods : null;
  const isExtended = moduleFile ? moduleFile.isExtended : false;

  if (buildCtx.hasError || buildCtx.hasWarning) {
    throw new Error(buildCtx.diagnostics[0].messageText as string);
  }

  return {
    buildCtx,
    cmp,
    cmps,
    compilerCtx,
    declarationOutputText,
    diagnostics: buildCtx.diagnostics,
    isExtended,
    methods,
    moduleFile,
    outputText,
    properties,
    states,
  };
}

/**
 * Helper function for tests that converts stringified JavaScript to a runtime value.
 * A value from the generated JavaScript is returned based on the provided property name.
 * @param stringifiedJs the stringified JavaScript
 * @param propertyName the property name to pull off the generated JavaScript
 * @returns the value associated with the provided property name. Returns undefined if an error occurs while converting
 * the stringified JS to JavaScript, or if the property does not exist on the generated JavaScript.
 */
export function getStaticGetter(stringifiedJs: string, propertyName: string): string | void {
  const toEvaluate = `return ${stringifiedJs.replace('export', '')}`;
  try {
    const Obj = new Function(toEvaluate);
    return Obj()[propertyName];
  } catch (e) {
    console.error(e);
    console.error(toEvaluate);
  }
}
