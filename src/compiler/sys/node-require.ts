import { catchError, loadTypeScriptDiagnostic } from '@utils';
import ts from 'typescript';

import type { Diagnostic } from '../../declarations';

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

    // let's override node's require for a second
    // don't worry, we'll revert this when we're done
    require.extensions['.ts'] = (module: NodeJS.Module, fileName: string) => {
      let sourceText = fs.readFileSync(fileName, 'utf8');

      if (fileName.endsWith('.ts')) {
        // looks like we've got a typed config file
        // let's transpile it to .js quick
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
      } else {
        // quick hack to turn a modern es module
        // into and old school commonjs module
        sourceText = sourceText.replace(/export\s+\w+\s+(\w+)/gm, 'exports.$1');
      }

      try {
        // we need to coerce because of the requirements for the arguments to
        // this function. It's safe enough since it's already wrapped in a
        // `try { } catch`.
        (module as NodeModuleWithCompile)._compile(sourceText, fileName);
      } catch (e: any) {
        catchError(results.diagnostics, e);
      }
    };

    // let's do this!
    results.module = require(results.id);

    // all set, let's go ahead and reset the require back to the default
    require.extensions['.ts'] = undefined;
  } catch (e: any) {
    catchError(results.diagnostics, e);
  }

  return results;
};

interface NodeModuleWithCompile extends NodeModule {
  _compile(code: string, filename: string): any;
}
