import rollupPluginUtils from '@rollup/pluginutils';
import type {
  TransformCssToEsmInput,
  TransformOptions,
  TranspileOptions,
  TranspileResults,
  ValidatedConfig,
} from '@stencil/core/internal';
import { catchError, getInlineSourceMappingUrlLinker, isString } from '@utils';

import { getTranspileConfig, getTranspileCssConfig, getTranspileResults } from './config/transpile-options';
import { validateConfig } from './config/validate-config';
import { transformCssToEsm, transformCssToEsmSync } from './style/css-to-esm';
import { patchTypescript } from './sys/typescript/typescript-sys';
import { getPublicCompilerMeta } from './transformers/add-component-meta-static';
import { transpileModule } from './transpile/transpile-module';

/**
 * The `transpile()` function inputs source code as a string, with various options
 * within the second argument. The function is stateless and returns a `Promise` of the
 * results, including diagnostics and the transpiled code. The `transpile()` function
 * does not handle any bundling, minifying, or precompiling any CSS preprocessing like
 * Sass or Less. The `transpileSync()` equivalent is available so the same function
 * it can be called synchronously. However, TypeScript must be already loaded within
 * the global for it to work, where as the async `transpile()` function will load
 * TypeScript automatically.
 *
 * Since TypeScript is used, the source code will transpile from TypeScript to JavaScript,
 * and does not require Babel presets. Additionally, the results includes an `imports`
 * array of all the import paths found in the source file. The transpile options can be
 * used to set the `module` format, such as `cjs`, and JavaScript `target` version, such
 * as `es2017`.
 *
 * @param code the code to transpile
 * @param opts options for the transpilation process
 * @returns a Promise wrapping the results of the transpilation
 */
export const transpile = async (code: string, opts: TranspileOptions = {}): Promise<TranspileResults> => {
  const { importData, results } = getTranspileResults(code, opts);

  try {
    if (shouldTranspileModule(results.inputFileExtension)) {
      const { config, compileOpts, transformOpts } = getTranspileConfig(opts);
      const validatedConfig = validateConfig(config, {}).config;
      patchTypescript(validatedConfig, null);
      transpileCode(validatedConfig, compileOpts, transformOpts, results);
    } else if (results.inputFileExtension === 'd.ts') {
      results.code = '';
    } else if (results.inputFileExtension === 'css') {
      const transformInput = getTranspileCssConfig(opts, importData, results);
      await transpileCss(transformInput, results);
    } else if (results.inputFileExtension === 'json') {
      transpileJson(results);
    }
  } catch (e: any) {
    catchError(results.diagnostics, e);
  }

  return results;
};

/**
 * Synchronous equivalent of the `transpile()` function. When used in a browser
 * environment, TypeScript must already be available globally, where as the async
 * `transpile()` function will load TypeScript automatically.
 *
 * @param code the code to transpile
 * @param opts options for the transpilation process
 * @returns the results of the transpilation
 */
export const transpileSync = (code: string, opts: TranspileOptions = {}): TranspileResults => {
  const { importData, results } = getTranspileResults(code, opts);

  try {
    if (shouldTranspileModule(results.inputFileExtension)) {
      const { config, compileOpts, transformOpts } = getTranspileConfig(opts);
      const validatedConfig = validateConfig(config, {}).config;
      patchTypescript(validatedConfig, null);
      transpileCode(validatedConfig, compileOpts, transformOpts, results);
    } else if (results.inputFileExtension === 'd.ts') {
      results.code = '';
    } else if (results.inputFileExtension === 'css') {
      const transformInput = getTranspileCssConfig(opts, importData, results);
      transpileCssSync(transformInput, results);
    } else if (results.inputFileExtension === 'json') {
      transpileJson(results);
    }
  } catch (e: any) {
    catchError(results.diagnostics, e);
  }

  return results;
};

const transpileCode = (
  config: ValidatedConfig,
  transpileOpts: TranspileOptions,
  transformOpts: TransformOptions,
  results: TranspileResults,
) => {
  const transpileResults = transpileModule(config, results.code, transformOpts);

  results.diagnostics.push(...transpileResults.diagnostics);

  if (typeof transpileResults.code === 'string') {
    results.code = transpileResults.code;
    results.map = transpileResults.map;

    if (transpileOpts.sourceMap === 'inline') {
      try {
        const mapObject = JSON.parse(transpileResults.map);
        mapObject.file = transpileOpts.file;
        mapObject.sources = [transpileOpts.file];
        delete mapObject.sourceRoot;

        const sourceMapComment = results.code.lastIndexOf('//#');
        results.code =
          results.code.slice(0, sourceMapComment) + getInlineSourceMappingUrlLinker(JSON.stringify(mapObject));
      } catch (e) {
        console.error(e);
      }
    }
  }

  if (isString(transpileResults.sourceFilePath)) {
    results.inputFilePath = transpileResults.sourceFilePath;
  }

  const moduleFile = transpileResults.moduleFile;
  if (moduleFile) {
    results.outputFilePath = moduleFile.jsFilePath;

    moduleFile.cmps.forEach((cmp) => {
      results.data.push(getPublicCompilerMeta(cmp));
    });

    moduleFile.originalImports.forEach((originalImport) => {
      results.imports.push({
        path: originalImport,
      });
    });
  }
};

const transpileCss = async (transformInput: TransformCssToEsmInput, results: TranspileResults) => {
  const cssResults = await transformCssToEsm(transformInput);
  results.code = cssResults.output;
  results.map = cssResults.map;
  results.imports = cssResults.imports.map((p) => ({ path: p.importPath }));
  results.diagnostics.push(...cssResults.diagnostics);
};

const transpileCssSync = (transformInput: TransformCssToEsmInput, results: TranspileResults) => {
  const cssResults = transformCssToEsmSync(transformInput);
  results.code = cssResults.output;
  results.map = cssResults.map;
  results.imports = cssResults.imports.map((p) => ({ path: p.importPath }));
  results.diagnostics.push(...cssResults.diagnostics);
};

const transpileJson = (results: TranspileResults) => {
  results.code = rollupPluginUtils.dataToEsm(JSON.parse(results.code), {
    preferConst: true,
    compact: false,
    indent: '  ',
  });
  results.map = { mappings: '' };
};

// NOTE: if you change this, also change jest configuration files in `src/testing/jest/jest*`.
// Search for 'mod_extensions_jest' to find comments like this.
const shouldTranspileModule = (ext: string) => ['tsx', 'ts', 'mjs', 'jsx', 'js'].includes(ext);
