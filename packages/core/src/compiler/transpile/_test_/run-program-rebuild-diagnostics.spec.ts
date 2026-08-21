import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { mockValidatedConfig } from '@stencil/core/testing';
import { mockBuildCtx, mockCompilerCtx } from '@stencil/core/testing/compiler';
import ts from 'typescript';
import { afterEach, describe, expect, it } from 'vitest';

import { runTsProgram } from '../run-program';

/**
 * Regression test for a bug where TypeScript errors introduced in a watch-mode rebuild were
 * silently dropped. `tsBuilder.emit()` and `getSemanticDiagnosticsOfNextAffectedFile()` both
 * drain the same "affected files" queue on the builder program - calling emit first (as
 * `runTsProgram` used to) left nothing for the diagnostics walk to find.
 */
describe('runTsProgram - rebuild diagnostics', () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('reports a type error introduced on a rebuild after a clean initial build', async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stencil-run-program-test-'));
    const srcDir = path.join(tmpDir, 'src');
    fs.mkdirSync(srcDir);
    const filePath = path.join(srcDir, 'index.ts');
    fs.writeFileSync(filePath, 'export const x: string = "hello";\n');

    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    };
    const host = ts.createIncrementalCompilerHost(options);

    const config = mockValidatedConfig({ rootDir: tmpDir, srcDir, validateTypes: true });
    const compilerCtx = mockCompilerCtx(config);

    // Initial build: isRebuild is false, walks all source files.
    const builder1 = ts.createEmitAndSemanticDiagnosticsBuilderProgram([filePath], options, host);
    const buildCtx1 = mockBuildCtx(config, compilerCtx);
    buildCtx1.isRebuild = false;
    await runTsProgram(config, compilerCtx, buildCtx1, builder1);
    expect(buildCtx1.diagnostics.filter((d) => d.level === 'error')).toHaveLength(0);

    // Introduce a real type error and rebuild, mirroring IncrementalCompiler.rebuild().
    fs.writeFileSync(filePath, 'export const x: string = 5;\n');
    const builder2 = ts.createEmitAndSemanticDiagnosticsBuilderProgram(
      [filePath],
      options,
      host,
      builder1,
    );
    const buildCtx2 = mockBuildCtx(config, compilerCtx);
    buildCtx2.isRebuild = true;
    buildCtx2.hasScriptChanges = true;
    await runTsProgram(config, compilerCtx, buildCtx2, builder2);

    const errors = buildCtx2.diagnostics.filter((d) => d.level === 'error');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].messageText).toContain('not assignable');
  });
});
