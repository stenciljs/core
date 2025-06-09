import type * as d from '@stencil/core/declarations';
import { mockBuildCtx, mockCompilerCtx, mockValidatedConfig } from '@stencil/core/testing';
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
  config?: d.ValidatedConfig | null,
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

  config = config || mockValidatedConfig();
  compilerCtx = compilerCtx || mockCompilerCtx(config);

  const sourceFile = ts.createSourceFile(inputFileName, input, options.target);

  let outputText: string;
  let declarationOutputText: string;

  const emitCallback: ts.WriteFileCallback = (emitFilePath, data, _w, _e, tsSourceFiles) => {
    if (emitFilePath.endsWith('.js')) {
      outputText = prettifyTSOutput(data);
      updateModule(config, compilerCtx, buildCtx, tsSourceFiles[0], data, emitFilePath, tsTypeChecker, null);
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

  const buildCtx = mockBuildCtx(config, compilerCtx);

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
      convertDecoratorsToStatic(config, buildCtx.diagnostics, tsTypeChecker, tsProgram),
      performAutomaticKeyInsertion,
      ...beforeTransformers,
    ],
    after: [
      convertStaticToMeta(config, compilerCtx, buildCtx, tsTypeChecker, null, transformOpts),
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

  return {
    buildCtx,
    cmp,
    cmps,
    compilerCtx,
    componentClassName,
    declarationOutputText,
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
    property,
    state,
    states,
    tagName,
    virtualProperties,
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
