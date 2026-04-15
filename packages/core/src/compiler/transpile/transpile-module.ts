import ts from 'typescript';
import type * as d from '@stencil/core';

import { createNodeLogger } from '../../sys/node';
import { isNumber, isString, join, loadTypeScriptDiagnostics, normalizePath } from '../../utils';
import { BuildContext } from '../build/build-ctx';
import { CompilerContext, getModuleLegacy } from '../build/compiler-ctx';
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

  if (
    (sourceFilePath.endsWith('.tsx') || sourceFilePath.endsWith('.jsx')) &&
    tsCompilerOptions.jsx == null
  ) {
    // ensure we're setup for JSX in typescript
    tsCompilerOptions.jsx = ts.JsxEmit.React;
  }

  // Only set jsxFactory and jsxFragmentFactory for classic React mode
  // For ReactJSX and ReactJSXDev modes (automatic runtime), these should not be set
  const isAutomaticRuntime =
    tsCompilerOptions.jsx === ts.JsxEmit.ReactJSX ||
    tsCompilerOptions.jsx === ts.JsxEmit.ReactJSXDev;

  if (
    tsCompilerOptions.jsx != null &&
    !isAutomaticRuntime &&
    !isString(tsCompilerOptions.jsxFactory)
  ) {
    tsCompilerOptions.jsxFactory = 'h';
  }

  if (
    tsCompilerOptions.jsx != null &&
    !isAutomaticRuntime &&
    !isString(tsCompilerOptions.jsxFragmentFactory)
  ) {
    tsCompilerOptions.jsxFragmentFactory = 'Fragment';
  }

  if (tsCompilerOptions.paths && !isString(tsCompilerOptions.baseUrl)) {
    tsCompilerOptions.baseUrl = '.';
  }

  const sourceFile = ts.createSourceFile(sourceFilePath, input, tsCompilerOptions.target);

  // Build the extra-source-files map for inheritance-chain resolution.
  // When a component extends a class from another module, the stateless
  // transpile() context has no module map and no file system to fall back on.
  // Callers can supply the source text of ancestor modules via
  // `TranspileOptions.extraFiles` so that buildExtendsTree() can resolve them.
  const extraSourceFiles = new Map<string, ts.SourceFile>();
  if (transformOpts.extraFiles) {
    const currentDir = normalizePath(transformOpts.currentDirectory || process.cwd());
    for (const [filePath, text] of Object.entries(transformOpts.extraFiles)) {
      const resolvedPath = normalizePath(
        filePath.startsWith('/') ? filePath : join(currentDir, filePath),
      );
      extraSourceFiles.set(
        resolvedPath,
        ts.createSourceFile(resolvedPath, text, tsCompilerOptions.target),
      );
    }
    // noResolve only prevents TypeScript from *discovering* new files through
    // imports; files we supply explicitly to createProgram are always in scope.
    // Lifting the flag here lets the type-checker cross-reference symbols
    // across all provided files so the happy path in buildExtendsTree works.
    tsCompilerOptions.noResolve = false;
  }

  // Create a compilerHost object to allow the compiler to read and write files
  const compilerHost: ts.CompilerHost = {
    getSourceFile: (fileName) => {
      const normalized = normalizePath(fileName);
      if (normalized === normalizePath(sourceFilePath)) return sourceFile;
      return extraSourceFiles.get(normalized);
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
    fileExists: (fileName) => {
      const normalized = normalizePath(fileName);
      return normalized === normalizePath(sourceFilePath) || extraSourceFiles.has(normalized);
    },
    readFile: () => '',
    directoryExists: () => true,
    getDirectories: () => [],
  };

  const program = ts.createProgram(
    [sourceFilePath, ...extraSourceFiles.keys()],
    tsCompilerOptions,
    compilerHost,
  );
  const typeChecker = program.getTypeChecker();

  // Pre-populate the module map with stubs for every extra source file.
  // buildExtendsTree() looks up compilerCtx.moduleMap to retrieve parent
  // class declarations; without these stubs it silently skips all parents
  // because the map is always empty in a stateless transpile() context.
  //
  // Crucially, we must also run convertDecoratorsToStatic on the extra files
  // before storing them as `staticSourceFile`.  buildExtendsTree reads
  // `staticSourceFile.members.filter(isStaticGetter)` to discover inherited
  // members; if we store the raw decorator-syntax source it will find nothing.
  // We use ts.transform() with a dedicated mini-program here so we can obtain
  // the transformed AST directly, without needing to go through program.emit().
  if (extraSourceFiles.size > 0) {
    // Build a self-contained mini program for the extra files only.
    // convertDecoratorsToStatic() requires a TypeChecker and Program to run;
    // we use noResolve:true so the mini program stays isolated and does not
    // attempt to load @stencil/core or any other dependency from disk.
    const miniCompilerHost: ts.CompilerHost = {
      getSourceFile: (fileName) => extraSourceFiles.get(normalizePath(fileName)),
      writeFile: () => {},
      getDefaultLibFileName: () => 'lib.d.ts',
      useCaseSensitiveFileNames: () => false,
      getCanonicalFileName: (f) => f,
      getCurrentDirectory: () => transformOpts.currentDirectory || process.cwd(),
      getNewLine: () => ts.sys.newLine || '\n',
      fileExists: (f) => extraSourceFiles.has(normalizePath(f)),
      readFile: () => '',
      directoryExists: () => true,
      getDirectories: () => [],
    };
    const miniProgram = ts.createProgram(
      [...extraSourceFiles.keys()],
      { ...tsCompilerOptions, noResolve: true },
      miniCompilerHost,
    );
    const miniTypeChecker = miniProgram.getTypeChecker();
    const decoratorConverter = convertDecoratorsToStatic(
      config,
      buildCtx.diagnostics,
      miniTypeChecker,
      miniProgram,
    );

    for (const [resolvedPath, rawSource] of extraSourceFiles) {
      const transformResult = ts.transform(rawSource, [decoratorConverter], tsCompilerOptions);
      const processedSource = transformResult.transformed[0];
      transformResult.dispose();

      const moduleFile = getModuleLegacy(compilerCtx, resolvedPath);
      moduleFile.staticSourceFile = processedSource;
      moduleFile.staticSourceFileText = processedSource.getFullText?.() ?? rawSource.text;
    }
  }

  const transformers = {
    before: [
      convertDecoratorsToStatic(config, buildCtx.diagnostics, typeChecker, program, transformOpts),
      performAutomaticKeyInsertion,
      updateStencilCoreImports(transformOpts.coreImportPath),
    ],
    after: [convertStaticToMeta(config, compilerCtx, buildCtx, typeChecker, null, transformOpts)],
    afterDeclarations: [] as (
      | ts.CustomTransformerFactory
      | ts.TransformerFactory<ts.SourceFile | ts.Bundle>
    )[],
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

  if (
    transformOpts.componentExport === 'customelement' ||
    transformOpts.componentExport === 'module'
  ) {
    transformers.after.push(nativeComponentTransform(compilerCtx, transformOpts, buildCtx));
  } else {
    transformers.after.push(lazyComponentTransform(compilerCtx, transformOpts, buildCtx));
  }

  // When extra files are in play, emit only the main source file: the rest of
  // the program is still used by the type-checker for cross-file symbol
  // resolution, but we don't want the extra files' emitted JS to overwrite
  // results.code.
  const emitTarget = extraSourceFiles.size > 0 ? program.getSourceFile(sourceFilePath) : undefined;
  program.emit(emitTarget, undefined, undefined, false, transformers);

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
