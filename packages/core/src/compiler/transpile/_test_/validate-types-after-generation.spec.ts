import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mockValidatedConfig } from '../../../testing';
import { mockBuildCtx, mockCompilerCtx } from '../../../testing/compiler';
import { generateAppTypes } from '../../types/generate-app-types';
import { validateTypesAfterGeneration } from '../run-program';

vi.mock('../../types/generate-app-types', () => ({ generateAppTypes: vi.fn() }));

/**
 * An existing components.d.ts predates any component added since it was written, so the first
 * build's type check reports e.g. `Cannot find name 'HTMLMyCmpElement'` - errors the next build
 * (against the regenerated file) wouldn't have.
 */
describe('validateTypesAfterGeneration - stale components.d.ts', () => {
  let tmpDir: string;

  const setup = (source: string) => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stencil-validate-types-test-'));
    const srcDir = path.join(tmpDir, 'src');
    fs.mkdirSync(srcDir);
    const filePath = path.join(srcDir, 'index.ts');
    fs.writeFileSync(filePath, source);
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    };
    const builder = ts.createEmitAndSemanticDiagnosticsBuilderProgram(
      [filePath],
      options,
      ts.createIncrementalCompilerHost(options),
    );
    const config = mockValidatedConfig({ rootDir: tmpDir, srcDir, validateTypes: true });
    const compilerCtx = mockCompilerCtx(config);
    compilerCtx.fs.access = async () => true; // components.d.ts already exists
    const buildCtx = mockBuildCtx(config, compilerCtx);
    buildCtx.isRebuild = false;
    return { config, compilerCtx, buildCtx, builder };
  };

  beforeEach(() => vi.mocked(generateAppTypes).mockReset());
  afterEach(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

  it('asks for a fresh program instead of reporting errors when components.d.ts was out of date', async () => {
    const { config, compilerCtx, buildCtx, builder } = setup(
      'const el: HTMLMyCmpElement = null;\n',
    );
    vi.mocked(generateAppTypes).mockResolvedValue(true);

    const result = await validateTypesAfterGeneration(config, compilerCtx, buildCtx, builder, []);

    expect(result.needsRebuild).toBe(true);
    expect(buildCtx.diagnostics.filter((d) => d.level === 'error')).toHaveLength(0);
  });

  it('reports the errors when components.d.ts was already up to date', async () => {
    const { config, compilerCtx, buildCtx, builder } = setup(
      'export const x: number = "not a number";\n',
    );
    vi.mocked(generateAppTypes).mockResolvedValue(false);

    const result = await validateTypesAfterGeneration(config, compilerCtx, buildCtx, builder, []);

    expect(result.needsRebuild).toBe(false);
    expect(buildCtx.diagnostics.filter((d) => d.level === 'error')).toHaveLength(1);
  });

  it('carries on without a fresh program when there are no errors', async () => {
    const { config, compilerCtx, buildCtx, builder } = setup('export const x = 1;\n');
    vi.mocked(generateAppTypes).mockResolvedValue(true);

    const result = await validateTypesAfterGeneration(config, compilerCtx, buildCtx, builder, []);

    expect(result).toEqual({ hasTypesChanged: true, needsRebuild: false });
  });
});
