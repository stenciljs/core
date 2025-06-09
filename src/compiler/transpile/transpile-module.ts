import { createNodeLogger } from '@sys-api-node';
import { isNumber, isString, loadTypeScriptDiagnostics, normalizePath } from '@utils';
import ts from 'typescript';

import type * as d from '../../declarations';
import { BuildContext } from '../build/build-ctx';
import { CompilerContext } from '../build/compiler-ctx';
import { performAutomaticKeyInsertion } from '../transformers/automatic-key-insertion';
import { lazyComponentTransform } from '../transformers/component-lazy/transform-lazy-component';
import { nativeComponentTransform } from '../transformers/component-native/tranform-to-native-component';
import { convertDecoratorsToStatic } from '../transformers/decorators-to-static/convert-decorators';
import {
  rewriteAliasedDTSImportPaths,
  rewriteAliasedSourceFileImportPaths,
} from '../transformers/rewrite-aliased-paths';
import { convertStaticToMeta } from '../transformers/static-to-meta/visitor';
import { updateStencilCoreImports } from '../transformers/update-stencil-core-import';

/**
 * Stand-alone compiling of a single string
 *
 * @param config the Stencil configuration to use in the compilation process
 * @param input the string to compile
 * @param transformOpts a configuration object for how the string is compiled
 * @returns the results of compiling the provided input string
 */
export const transpileModule = (
  config: d.ValidatedConfig,
  input: string,
  transformOpts: d.TransformOptions,
): d.TranspileModuleResults => {
  if (!config.logger) {
    config = {
      ...config,
      logger: createNodeLogger(),
    };
  }
  const compilerCtx = new CompilerContext();
  const buildCtx = new BuildContext(config, compilerCtx);
  const tsCompilerOptions: ts.CompilerOptions = {
    ...config.tsCompilerOptions,
  };

  let sourceFilePath = transformOpts.file;
  if (isString(sourceFilePath)) {
    sourceFilePath = normalizePath(sourceFilePath);
  } else {
    sourceFilePath = tsCompilerOptions.jsx ? `module.tsx` : `module.ts`;
  }

  const results: d.TranspileModuleResults = {
    sourceFilePath: sourceFilePath,
    code: null,
    map: null,
    diagnostics: [],
    moduleFile: null,
  };

  if (transformOpts.module === 'cjs') {
    tsCompilerOptions.module = ts.ModuleKind.CommonJS;
  } else {
    tsCompilerOptions.module = ts.ModuleKind.ESNext;
  }

  tsCompilerOptions.target = getScriptTargetKind(transformOpts);

  if ((sourceFilePath.endsWith('.tsx') || sourceFilePath.endsWith('.jsx')) && tsCompilerOptions.jsx == null) {
    // ensure we're setup for JSX in typescript
    tsCompilerOptions.jsx = ts.JsxEmit.React;
  }

  if (tsCompilerOptions.jsx != null && !isString(tsCompilerOptions.jsxFactory)) {
    tsCompilerOptions.jsxFactory = 'h';
  }

  if (tsCompilerOptions.jsx != null && !isString(tsCompilerOptions.jsxFragmentFactory)) {
    tsCompilerOptions.jsxFragmentFactory = 'Fragment';
  }

  if (tsCompilerOptions.paths && !isString(tsCompilerOptions.baseUrl)) {
    tsCompilerOptions.baseUrl = '.';
  }

  const sourceFile = ts.createSourceFile(sourceFilePath, input, tsCompilerOptions.target);

  // Create a compilerHost object to allow the compiler to read and write files
  const compilerHost: ts.CompilerHost = {
    getSourceFile: (fileName) => {
      return normalizePath(fileName) === normalizePath(sourceFilePath) ? sourceFile : undefined;
    },
    writeFile: (name, text) => {
      if (name.endsWith('.js.map') || name.endsWith('.mjs.map')) {
        results.map = text;
      } else if (name.endsWith('.js') || name.endsWith('.mjs')) {
        // if the source file is an ES module w/ `.mjs` extension then
        // TypeScript will output a `.mjs` file
        results.code = text;
      }
    },
    getDefaultLibFileName: () => `lib.d.ts`,
    useCaseSensitiveFileNames: () => false,
    getCanonicalFileName: (fileName) => fileName,
    getCurrentDirectory: () => transformOpts.currentDirectory || process.cwd(),
    getNewLine: () => ts.sys.newLine || '\n',
    fileExists: (fileName) => normalizePath(fileName) === normalizePath(sourceFilePath),
    readFile: () => '',
    directoryExists: () => true,
    getDirectories: () => [],
  };

  const program = ts.createProgram([sourceFilePath], tsCompilerOptions, compilerHost);
  const typeChecker = program.getTypeChecker();

  const transformers = {
    before: [
      convertDecoratorsToStatic(config, buildCtx.diagnostics, typeChecker, program),
      performAutomaticKeyInsertion,
      updateStencilCoreImports(transformOpts.coreImportPath),
    ],
    after: [convertStaticToMeta(config, compilerCtx, buildCtx, typeChecker, null, transformOpts)],
    afterDeclarations: [] as (ts.CustomTransformerFactory | ts.TransformerFactory<ts.SourceFile | ts.Bundle>)[],
  } satisfies ts.CustomTransformers;

  if (config.transformAliasedImportPaths) {
    transformers.before.push(rewriteAliasedSourceFileImportPaths);
    // TypeScript handles the generation of JS and `.d.ts` files through
    // different pipelines. One (possibly surprising) consequence of this is
    // that if you modify a source file using a transforming it will not
    // automatically result in changes to the corresponding `.d.ts` file.
    // Instead, if you want to, for instance, rewrite some import specifiers in
    // both the source file _and_ its typedef you'll need to run a transformer
    // for both of them.
    //
    // See here: https://github.com/itsdouges/typescript-transformer-handbook#transforms
    // and here: https://github.com/microsoft/TypeScript/pull/23946
    //
    // This quirk is not terribly well documented unfortunately.
    transformers.afterDeclarations.push(rewriteAliasedDTSImportPaths);
  }

  if (transformOpts.componentExport === 'customelement' || transformOpts.componentExport === 'module') {
    transformers.after.push(nativeComponentTransform(compilerCtx, transformOpts));
  } else {
    transformers.after.push(lazyComponentTransform(compilerCtx, transformOpts));
  }

  program.emit(undefined, undefined, undefined, false, transformers);

  const tsDiagnostics = [...program.getSyntacticDiagnostics()] as ts.Diagnostic[];

  if (config.validateTypes) {
    tsDiagnostics.push(...program.getOptionsDiagnostics());
  }

  buildCtx.diagnostics.push(...loadTypeScriptDiagnostics(tsDiagnostics));

  results.diagnostics.push(...buildCtx.diagnostics);

  results.moduleFile = compilerCtx.moduleMap.get(results.sourceFilePath)!;

  return results;
};

const getScriptTargetKind = (transformOpts: d.TransformOptions) => {
  const target = transformOpts.target && transformOpts.target.toUpperCase();
  if (isNumber((ts.ScriptTarget as any)[target as string])) {
    return (ts.ScriptTarget as any)[target as string];
  }
  // ESNext and Latest are the same
  return ts.ScriptTarget.Latest;
};
