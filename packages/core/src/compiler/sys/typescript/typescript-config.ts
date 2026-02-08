import {
  buildError,
  buildWarn,
  catchError,
  isString,
  join,
  loadTypeScriptDiagnostic,
  normalizePath,
  relative,
} from '@utils';
import { isAbsolute } from 'path';
import ts from 'typescript';

import type * as d from '../../../declarations';

export const validateTsConfig = async (config: d.ValidatedConfig, sys: d.CompilerSystem, init: d.LoadConfigInit) => {
  const tsconfig = {
    path: '',
    compilerOptions: {} as ts.CompilerOptions,
    watchOptions: {} as ts.WatchOptions,
    files: [] as string[],
    include: [] as string[],
    exclude: [] as string[],
    extends: '',
    diagnostics: [] as d.Diagnostic[],
  };

  try {
    const readTsConfig = await getTsConfigPath(config, sys, init);
    if (!readTsConfig) {
      const diagnostic = buildError(tsconfig.diagnostics);
      diagnostic.header = `Missing tsconfig.json`;
      diagnostic.messageText = `Unable to load TypeScript config file. Please create a "tsconfig.json" file within the "${config.rootDir}" directory.`;
    } else {
      tsconfig.path = readTsConfig.path;
      const host: ts.ParseConfigFileHost = {
        ...ts.sys,
        readFile: (p) => {
          if (p === tsconfig.path) {
            return readTsConfig.content;
          }
          return sys.readFileSync(p);
        },
        readDirectory: (p) => sys.readDirSync(p),
        fileExists: (p) => sys.accessSync(p),
        onUnRecoverableConfigFileDiagnostic: (e: any) => console.error(e),
      };

      const results = ts.getParsedCommandLineOfConfigFile(tsconfig.path, {}, host);

      if (results === undefined) {
        throw 'Encountered an error reading tsconfig!';
      }

      if (results.errors && results.errors.length > 0) {
        results.errors.forEach((configErr) => {
          const tsDiagnostic = loadTypeScriptDiagnostic(configErr);
          if (tsDiagnostic.code === '18003') {
            // "No inputs were found in config file"
            // fine to just "warn" rather than "error" even before starting
            tsDiagnostic.level = 'warn';
          }
          tsDiagnostic.absFilePath = tsconfig.path;
          tsconfig.diagnostics.push(tsDiagnostic);
        });
      } else {
        if (results.raw) {
          const srcDir = relative(config.rootDir, config.srcDir);
          if (!hasSrcDirectoryInclude(results.raw.include, srcDir)) {
            const warn = buildWarn(tsconfig.diagnostics);
            warn.header = `tsconfig.json "include" required`;
            warn.messageText = `In order for TypeScript to improve watch performance, it's recommended the "tsconfig.json" file should have the "include" property, with at least the app's "${srcDir}" directory listed. For example: "include": ["${srcDir}"]`;
          }

          if (hasStencilConfigInclude(results.raw.include)) {
            const warn = buildWarn(tsconfig.diagnostics);
            warn.header = `tsconfig.json should not reference stencil.config.ts`;
            warn.messageText = `stencil.config.ts is not part of the output build, it should not be included.`;
          }

          if (Array.isArray(results.raw.files)) {
            tsconfig.files = results.raw.files.slice();
          }
          if (Array.isArray(results.raw.include)) {
            tsconfig.include = results.raw.include.slice();
          }
          if (Array.isArray(results.raw.exclude)) {
            tsconfig.exclude = results.raw.exclude.slice();
          }
          if (isString(results.raw.extends)) {
            tsconfig.extends = results.raw.extends;
          }
        }

        if (results.watchOptions) {
          tsconfig.watchOptions = results.watchOptions;
        }

        if (results.options) {
          tsconfig.compilerOptions = results.options;

          const target = tsconfig.compilerOptions.target ?? ts.ScriptTarget.ES5;
          if (
            [ts.ScriptTarget.ES3, ts.ScriptTarget.ES5, ts.ScriptTarget.ES2015, ts.ScriptTarget.ES2016].includes(target)
          ) {
            const warn = buildWarn(tsconfig.diagnostics);
            warn.messageText = `To improve bundling, it is always recommended to set the tsconfig.json “target” setting to "es2017". Note that the compiler will automatically handle transpilation for ES5-only browsers.`;
          }

          if (tsconfig.compilerOptions.module !== ts.ModuleKind.ESNext && !config._isTesting) {
            const warn = buildWarn(tsconfig.diagnostics);
            warn.messageText = `To improve bundling, it is always recommended to set the tsconfig.json “module” setting to “esnext”. Note that the compiler will automatically handle bundling both modern and legacy builds.`;
          }

          tsconfig.compilerOptions.sourceMap = config.sourceMap;
          tsconfig.compilerOptions.inlineSources = config.sourceMap;
        }
      }
    }
  } catch (e: any) {
    catchError(tsconfig.diagnostics, e);
  }

  return tsconfig;
};

export const getTsConfigPath = async (
  config: d.ValidatedConfig,
  sys: d.CompilerSystem,
  init: d.LoadConfigInit,
): Promise<{
  path: string;
  content: string;
} | null> => {
  const tsconfig = {
    path: '',
    content: '',
  };

  if (isString(config.tsconfig)) {
    if (!isAbsolute(config.tsconfig)) {
      tsconfig.path = join(config.rootDir, config.tsconfig);
    } else {
      tsconfig.path = config.tsconfig;
    }
  } else {
    tsconfig.path = join(config.rootDir, 'tsconfig.json');
  }

  tsconfig.content = await sys.readFile(tsconfig.path);
  if (!isString(tsconfig.content)) {
    if (!init.initTsConfig) {
      // not set to automatically generate a default tsconfig
      return null;
    }

    // create a default tsconfig
    tsconfig.path = join(config.rootDir, 'tsconfig.json');
    tsconfig.content = createDefaultTsConfig(config);
    await sys.writeFile(tsconfig.path, tsconfig.content);
  }

  tsconfig.path = normalizePath(tsconfig.path);

  return tsconfig;
};

const createDefaultTsConfig = (config: d.ValidatedConfig) =>
  JSON.stringify(
    {
      compilerOptions: {
        allowSyntheticDefaultImports: true,
        experimentalDecorators: true,
        lib: ['dom', 'es2015'],
        moduleResolution: 'node',
        module: 'esnext',
        target: 'es2017',
        jsx: 'react',
        jsxFactory: 'h',
        jsxFragmentFactory: 'Fragment',
        sourceMap: config.sourceMap,
        inlineSources: config.sourceMap,
      },
      include: [relative(config.rootDir, config.srcDir)],
    },
    null,
    2,
  );

/**
 * Determines if the included `src` argument belongs in `includeProp`.
 *
 * This function normalizes the paths found in both arguments, to catch cases where it's called with:
 * ```ts
 * hasSrcDirectoryInclude(['src'], './src'); // should return `true`
 * ```
 *
 * @param includeProp the paths in `include` that should be tested
 * @param src the path to find in `includeProp`
 * @returns true if the provided `src` directory is found, `false` otherwise
 */
export const hasSrcDirectoryInclude = (includeProp: string[], src: string): boolean =>
  Array.isArray(includeProp) &&
  includeProp.some((included) => normalizePath(included, false) === normalizePath(src, false));

const hasStencilConfigInclude = (includeProp: string[]) =>
  Array.isArray(includeProp) && includeProp.includes('stencil.config.ts');
