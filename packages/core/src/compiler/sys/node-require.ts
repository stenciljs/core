import ts from 'typescript';
import type { Diagnostic } from '@stencil/core';

import { catchError, loadTypeScriptDiagnostic } from '../../utils';

/**
 * Transform ES module syntax to CommonJS for config files.
 * Handles common patterns like `export default { ... }` and named exports.
 *
 * @param sourceText - the source text to transform
 * @returns the transformed CommonJS source text
 */
const transformEsmToCjs = (sourceText: string): string => {
  // Handle `export default { ... }` or `export default expression`
  sourceText = sourceText.replace(/export\s+default\s+/g, 'module.exports = ');

  // Handle named exports: `export const foo = ...` -> `exports.foo = ...`
  // and `export function foo` -> `exports.foo = function foo`
  sourceText = sourceText.replace(/export\s+(const|let|var)\s+(\w+)\s*=/g, 'exports.$2 =');
  sourceText = sourceText.replace(/export\s+(function|class)\s+(\w+)/g, 'exports.$2 = $1 $2');

  return sourceText;
};

/**
 * Load a module using Node.js require with TypeScript and ESM transpilation support.
 *
 * @param id - the module path to require
 * @returns an object containing the loaded module, resolved ID, and any diagnostics
 */
export const nodeRequire = (id: string) => {
  const results = {
    module: undefined as any,
    id,
    diagnostics: [] as Diagnostic[],
  };

  try {
    const fs: typeof import('fs') = require('fs');
    const path: typeof import('path') = require('path');

    results.id = path.resolve(id);

    // ensure we cleared out node's internal require() cache for this file
    delete require.cache[results.id];

    // Save original extension handlers to restore later
    const originalTsHandler = require.extensions['.ts'];
    const originalJsHandler = require.extensions['.js'];

    // Handler for .ts files - transpile TypeScript to CommonJS
    require.extensions['.ts'] = (module: NodeJS.Module, fileName: string) => {
      let sourceText = fs.readFileSync(fileName, 'utf8');

      // Transpile TypeScript to CommonJS JavaScript
      const tsResults = ts.transpileModule(sourceText, {
        fileName,
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          moduleResolution: ts.ModuleResolutionKind.NodeJs,
          esModuleInterop: true,
          target: ts.ScriptTarget.ES2017,
          allowJs: true,
        },
      });
      sourceText = tsResults.outputText;

      results.diagnostics.push(...tsResults.diagnostics.map(loadTypeScriptDiagnostic));

      try {
        (module as NodeModuleWithCompile)._compile(sourceText, fileName);
      } catch (e: any) {
        catchError(results.diagnostics, e);
      }
    };

    // Handler for .js files - transform ES module syntax to CommonJS
    require.extensions['.js'] = (module: NodeJS.Module, fileName: string) => {
      let sourceText = fs.readFileSync(fileName, 'utf8');

      // Transform ES module syntax to CommonJS
      sourceText = transformEsmToCjs(sourceText);

      try {
        (module as NodeModuleWithCompile)._compile(sourceText, fileName);
      } catch (e: any) {
        catchError(results.diagnostics, e);
      }
    };

    // let's do this!
    results.module = require(results.id);

    // Restore original extension handlers
    if (originalTsHandler) {
      require.extensions['.ts'] = originalTsHandler;
    } else {
      delete require.extensions['.ts'];
    }
    if (originalJsHandler) {
      require.extensions['.js'] = originalJsHandler;
    } else {
      delete require.extensions['.js'];
    }
  } catch (e: any) {
    catchError(results.diagnostics, e);
  }

  return results;
};

interface NodeModuleWithCompile extends NodeModule {
  _compile(code: string, filename: string): any;
}
