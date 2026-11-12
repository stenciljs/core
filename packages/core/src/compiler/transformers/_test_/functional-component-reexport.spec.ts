import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import type * as d from '@stencil/core';

import { mockValidatedConfig } from '../../../testing';
import { mockBuildCtx, mockCompilerCtx } from '../../../testing/compiler';
import { getComponentsFromModules } from '../../../utils';
import { updateComponentBuildConditionals } from '../../app-core/app-data';
import { performAutomaticKeyInsertion } from '../automatic-key-insertion';
import { convertDecoratorsToStatic } from '../decorators-to-static/convert-decorators';
import { updateModule } from '../static-to-meta/parse-static';

/**
 * Compiles an in-memory multi-file project through the same transform + `updateModule` path
 * as `runTsProgram`, then merges build conditionals.
 */
const compileProject = (files: Record<string, string>) => {
  const config = mockValidatedConfig();
  const compilerCtx = mockCompilerCtx(config);
  const buildCtx = mockBuildCtx(config, compilerCtx);

  const options: ts.CompilerOptions = {
    experimentalDecorators: true,
    jsx: ts.JsxEmit.ReactJSX,
    jsxImportSource: '@stencil/core',
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2022,
    noLib: true,
    types: [],
  };

  const sourceFiles = new Map(
    Object.entries(files).map(([fileName, text]) => [
      fileName,
      ts.createSourceFile(fileName, text, options.target!, true),
    ]),
  );
  const dirs = new Set([...sourceFiles.keys()].flatMap((f) => parentDirs(f)));

  const host: ts.CompilerHost = {
    getSourceFile: (fileName) => sourceFiles.get(fileName),
    writeFile: (emitFilePath, data, _w, _e, tsSourceFiles) => {
      if (emitFilePath.endsWith('.js')) {
        updateModule(
          config,
          compilerCtx,
          buildCtx,
          tsSourceFiles![0],
          data,
          emitFilePath,
          typeChecker,
          null,
        );
      }
    },
    getDefaultLibFileName: () => 'lib.d.ts',
    useCaseSensitiveFileNames: () => true,
    getCanonicalFileName: (fileName) => fileName,
    getCurrentDirectory: () => '/',
    getNewLine: () => '\n',
    fileExists: (fileName) => sourceFiles.has(fileName),
    readFile: (fileName) => files[fileName],
    directoryExists: (dir) => dirs.has(dir),
    getDirectories: () => [],
  };

  const program = ts.createProgram([...sourceFiles.keys()], options, host);
  const typeChecker = program.getTypeChecker();
  program.emit(undefined, undefined, undefined, false, {
    before: [
      convertDecoratorsToStatic(config, buildCtx.diagnostics, typeChecker, program),
      performAutomaticKeyInsertion,
    ],
  });

  const cmps = getComponentsFromModules(Array.from(compilerCtx.moduleMap.values()));
  updateComponentBuildConditionals(compilerCtx.moduleMap, cmps);
  return { cmp: cmps.find((c) => c.tagName === 'cmp-a')!, compilerCtx };
};

const parentDirs = (filePath: string) => {
  const parts = filePath.split('/').slice(0, -1);
  return parts.map((_, i) => parts.slice(0, i + 1).join('/') || '/');
};

const FANCY = `
  export const Fancy = () => (
    <div class={{ on: true }} style={{ color: 'red' }} onClick={() => {}} />
  );
`;

const componentImporting = (specifier: string) => `
  import { Component } from '@stencil/core';
  import { Fancy } from '${specifier}';

  @Component({ tag: 'cmp-a' })
  export class CmpA {
    render() {
      return <Fancy />;
    }
  }
`;

const expectFancyFlags = (cmp: d.ComponentCompilerMeta) => {
  expect(cmp.hasVdomFunctional).toBe(true);
  expect(cmp.hasVdomClass).toBe(true);
  expect(cmp.hasVdomStyle).toBe(true);
  expect(cmp.hasVdomListener).toBe(true);
};

describe('functional component build conditionals across modules', () => {
  it('direct import', () => {
    const { cmp } = compileProject({
      '/src/fancy.tsx': FANCY,
      '/src/cmp-a.tsx': componentImporting('./fancy'),
    });
    expectFancyFlags(cmp);
  });

  it('barrel with `export *`', () => {
    const { cmp } = compileProject({
      '/src/fancy.tsx': FANCY,
      '/src/barrel.ts': `export * from './fancy';`,
      '/src/cmp-a.tsx': componentImporting('./barrel'),
    });
    expectFancyFlags(cmp);
  });

  it('barrel with named `export { } from`', () => {
    const { cmp } = compileProject({
      '/src/fancy.tsx': FANCY,
      '/src/barrel.ts': `export { Fancy } from './fancy';`,
      '/src/cmp-a.tsx': componentImporting('./barrel'),
    });
    expectFancyFlags(cmp);
  });

  it('barrel that imports then re-exports', () => {
    const { cmp } = compileProject({
      '/src/fancy.tsx': FANCY,
      '/src/barrel.ts': `import { Fancy } from './fancy';\nexport { Fancy };`,
      '/src/cmp-a.tsx': componentImporting('./barrel'),
    });
    expectFancyFlags(cmp);
  });

  it('directory barrel (`index.ts`)', () => {
    const { cmp } = compileProject({
      '/src/fancy/fancy.tsx': FANCY,
      '/src/fancy/index.ts': `export * from './fancy';`,
      '/src/cmp-a.tsx': componentImporting('./fancy'),
    });
    expectFancyFlags(cmp);
  });

  it('records re-exports as local imports', () => {
    const { compilerCtx } = compileProject({
      '/src/fancy.tsx': FANCY,
      '/src/barrel.ts': `export * from './fancy';`,
      '/src/cmp-a.tsx': componentImporting('./barrel'),
    });
    expect(compilerCtx.moduleMap.get('/src/barrel.ts')?.localImports).toEqual(['/src/fancy']);
  });
});
