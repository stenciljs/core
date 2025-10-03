import { createJsVarName, isString, loadTypeScriptDiagnostics, normalizePath } from '@utils';
import MagicString from 'magic-string';
import { basename } from 'path';
import type { LoadResult, Plugin, ResolveIdResult, TransformResult } from 'rollup';
import ts from 'typescript';

import type * as d from '../../declarations';
import { removeCollectionImports } from '../transformers/remove-collection-imports';
import { APP_DATA_CONDITIONAL, STENCIL_APP_DATA_ID, STENCIL_APP_GLOBALS_ID } from './entry-alias-ids';

/**
 * A Rollup plugin which bundles application data.
 *
 * @param config the Stencil configuration for a particular project
 * @param compilerCtx the current compiler context
 * @param buildCtx the current build context
 * @param buildConditionals the set build conditionals for the build
 * @param platform the platform that is being built
 * @returns a Rollup plugin which carries out the necessary work
 */
export const appDataPlugin = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  buildConditionals: d.BuildConditionals,
  platform: 'client' | 'hydrate' | 'worker',
): Plugin => {
  if (!platform) {
    return {
      name: 'appDataPlugin',
    };
  }
  const globalScripts = getGlobalScriptData(config, compilerCtx);

  return {
    name: 'appDataPlugin',

    resolveId(id: string, importer: string | undefined): ResolveIdResult {
      if (id === STENCIL_APP_DATA_ID || id === STENCIL_APP_GLOBALS_ID) {
        if (platform === 'worker') {
          this.error('@stencil/core packages cannot be imported from a worker.');
        }

        if (platform === 'hydrate' || STENCIL_APP_GLOBALS_ID) {
          // hydrate will always bundle app-data and runtime
          // and the load() fn will build a custom globals import
          return id;
        } else if (platform === 'client' && importer && importer.endsWith(APP_DATA_CONDITIONAL)) {
          // since the importer ends with ?app-data=conditional we know that
          // we need to build custom app-data based off of component metadata
          // return the same "id" so that the "load()" method knows to
          // build custom app-data
          return id;
        }
        // for a client build that does not have ?app-data=conditional at the end then we
        // do not want to create custom app-data, but should use the default
      }
      return null;
    },

    async load(id: string): Promise<LoadResult> {
      if (id === STENCIL_APP_GLOBALS_ID) {
        const s = new MagicString(``);
        appendGlobalScripts(globalScripts, s);
        await appendGlobalStyles(buildCtx, s);
        return s.toString();
      }
      if (id === STENCIL_APP_DATA_ID) {
        // build custom app-data based off of component metadata
        const s = new MagicString(``);
        appendNamespace(config, s);
        appendBuildConditionals(config, buildConditionals, s);
        appendEnv(config, s);
        return s.toString();
      }
      if (id !== config.globalScript) {
        return null;
      }

      const module = compilerCtx.moduleMap.get(config.globalScript);
      if (!module) {
        return null;
      } else if (!module.sourceMapFileText) {
        return {
          code: module.staticSourceFileText,
          map: null,
        };
      }

      const sourceMap: d.SourceMap = JSON.parse(module.sourceMapFileText);
      sourceMap.sources = sourceMap.sources.map((src) => basename(src));
      return { code: module.staticSourceFileText, map: sourceMap };
    },

    transform(code: string, id: string): TransformResult {
      id = normalizePath(id);
      if (globalScripts.some((s) => s.path === id)) {
        const program = this.parse(code, {});
        const needsDefault = !(program as any).body.some((s: any) => s.type === 'ExportDefaultDeclaration');
        const defaultExport = needsDefault ? '\nexport const globalFn = () => {};\nexport default globalFn;' : '';
        code = code + defaultExport;

        const compilerOptions: ts.CompilerOptions = { ...config.tsCompilerOptions };
        compilerOptions.module = ts.ModuleKind.ESNext;

        const results = ts.transpileModule(code, {
          compilerOptions,
          fileName: id,
          transformers: {
            after: [removeCollectionImports(compilerCtx)],
          },
        });
        buildCtx.diagnostics.push(...loadTypeScriptDiagnostics(results.diagnostics));

        if (config.sourceMap) {
          // generate the sourcemap for global script
          const codeMs = new MagicString(code);
          const codeMap = codeMs.generateMap({
            source: id,
            // this is the name of the sourcemap, not to be confused with the `file` field in a generated sourcemap
            file: id + '.map',
            includeContent: true,
            hires: true,
          });

          return {
            code: results.outputText,
            map: {
              ...codeMap,
              // MagicString changed their types in this PR: https://github.com/Rich-Harris/magic-string/pull/235
              // so that their `sourcesContent` is of type `(string | null)[]`. But, it will only return `[null]` if
              // `includeContent` is set to `false`. Since we explicitly set `includeContent: true`, we can override
              // the type to satisfy Rollup's type expectation
              sourcesContent: codeMap.sourcesContent as string[],
            },
          };
        }

        return { code: results.outputText };
      }
      return null;
    },
  };
};

export const getGlobalScriptData = (config: d.ValidatedConfig, compilerCtx: d.CompilerCtx) => {
  const globalScripts: GlobalScript[] = [];

  if (isString(config.globalScript)) {
    const mod = compilerCtx.moduleMap.get(config.globalScript);
    const globalScript = compilerCtx.version === 2 ? config.globalScript : mod && mod.jsFilePath;

    if (globalScript) {
      globalScripts.push({
        defaultName: createJsVarName(config.namespace + 'GlobalScript'),
        path: normalizePath(globalScript),
      });
    }
  }

  compilerCtx.collections.forEach((collection) => {
    if (collection.global != null && isString(collection.global.sourceFilePath)) {
      let defaultName = createJsVarName(collection.collectionName + 'GlobalScript');
      if (globalScripts.some((s) => s.defaultName === defaultName)) {
        defaultName += globalScripts.length;
      }
      globalScripts.push({
        defaultName,
        path: normalizePath(collection.global.sourceFilePath),
      });
    }
  });

  return globalScripts;
};

const appendGlobalScripts = (globalScripts: GlobalScript[], s: MagicString) => {
  if (globalScripts.length === 1) {
    s.prepend(`import appGlobalScript from '${globalScripts[0].path}';\n`);
    s.append(`export const globalScripts = appGlobalScript;\n`);
  } else if (globalScripts.length > 1) {
    globalScripts.forEach((globalScript) => {
      s.prepend(`import ${globalScript.defaultName} from '${globalScript.path}';\n`);
    });

    s.append(`export const globalScripts = () => {\n`);
    s.append(`  return Promise.all([\n`);
    globalScripts.forEach((globalScript) => {
      s.append(`    ${globalScript.defaultName}(),\n`);
    });
    s.append(`  ]);\n`);
    s.append(`};\n`);
  } else {
    s.append(`export const globalScripts = () => {};\n`);
  }
};

/**
 * Appends the global styles to the MagicString.
 *
 * @param buildCtx the build context
 * @param s the MagicString to append the global styles onto
 */
const appendGlobalStyles = async (buildCtx: d.BuildCtx, s: MagicString) => {
  const globalStyles =
    buildCtx.config.globalStyle && buildCtx.config.extras.addGlobalStyleToComponents !== false
      ? await buildCtx.stylesPromise
      : '';
  s.append(`export const globalStyles = ${JSON.stringify(globalStyles)};\n`);
};

/**
 * Generates the `BUILD` constant that is used at compile-time in a Stencil project
 *
 * **This function mutates the provided {@link MagicString} argument**
 *
 * @param config the configuration associated with the Stencil project
 * @param buildConditionals the build conditionals to serialize into a JS object
 * @param s a `MagicString` to append the generated constant onto
 */
export const appendBuildConditionals = (
  config: d.ValidatedConfig,
  buildConditionals: d.BuildConditionals,
  s: MagicString,
): void => {
  const buildData = Object.keys(buildConditionals)
    .sort()
    .map((key) => key + ': ' + JSON.stringify((buildConditionals as any)[key]))
    .join(', ');

  s.append(`export const BUILD = /* ${config.fsNamespace} */ { ${buildData} };\n`);
};

const appendEnv = (config: d.ValidatedConfig, s: MagicString) => {
  s.append(`export const Env = /* ${config.fsNamespace} */ ${JSON.stringify(config.env)};\n`);
};

const appendNamespace = (config: d.ValidatedConfig, s: MagicString) => {
  s.append(`export const NAMESPACE = '${config.fsNamespace}';\n`);
};

interface GlobalScript {
  defaultName: string;
  path: string;
}
