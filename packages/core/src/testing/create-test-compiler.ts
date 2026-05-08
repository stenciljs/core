import fs from 'node:fs';
import path from 'path';
import type * as d from '@stencil/core';

import { createCompiler } from '../compiler/compiler';
import { loadConfig } from '../compiler/config/load-config';
import { mockCompilerSystem } from './mocks';

const TESTING_TSCONFIG = path.resolve(__dirname, 'fixtures/tsconfig.testing.json');

/**
 * Options for creating a test compiler
 */
export interface CreateTestCompilerOptions {
  /**
   * Additional configuration overrides for the test compiler
   */
  config?: Partial<d.Config>;
  /**
   * Path to a tsconfig.json file. Defaults to {@link TESTING_TSCONFIG}.
   * To add custom options, create a file that `extends` the base fixture:
   * `{ "extends": "./path/to/tsconfig.testing.json", "compilerOptions": { ... } }`
   */
  tsconfig?: string;
}

/**
 * Result of creating a test compiler
 */
export interface TestCompilerResult {
  /**
   * The compiler instance ready for testing
   */
  compiler: d.Compiler;
  /**
   * The validated configuration used to create the compiler
   */
  config: d.ValidatedConfig;
  /**
   * The compiler system instance
   */
  sys: d.CompilerSystem;
}

/**
 * Creates a test compiler instance with a hybrid filesystem (reads from disk, writes to memory).
 * This utility handles the common setup pattern for compiler tests.
 *
 * @param options - Configuration options for the test compiler
 * @returns An object with the compiler, validated config, and system instance
 *
 * @example
 * ```ts
 * const { compiler, config } = await createTestCompiler({
 *   config: { minifyCss: true }
 * });
 * await compiler.fs.writeFile('/src/index.html', '<cmp-a></cmp-a>');
 * const result = await compiler.build();
 * ```
 */
export const createTestCompiler = async (
  options: CreateTestCompilerOptions = {},
): Promise<TestCompilerResult> => {
  const sys = mockCompilerSystem();

  // The in-memory sys has no disk access, but TypeScript needs to read its own
  // lib files (lib.es2022.d.ts etc.) from disk. Wrap reads to fall through to
  // real node:fs for anything not already in memory.
  const originalReadFileSync = sys.readFileSync.bind(sys);
  sys.readFileSync = (p: string) => {
    const mem = originalReadFileSync(p);
    if (mem !== undefined) return mem;
    try {
      return fs.readFileSync(p, 'utf-8');
    } catch {
      return undefined;
    }
  };

  const originalReadFile = sys.readFile.bind(sys);
  sys.readFile = async (p: string) => {
    const mem = await originalReadFile(p);
    if (mem !== undefined) return mem;
    try {
      return fs.readFileSync(p, 'utf-8');
    } catch {
      return undefined;
    }
  };

  const originalAccessSync = sys.accessSync.bind(sys);
  sys.accessSync = (p: string) => {
    if (originalAccessSync(p)) return true;
    try {
      fs.accessSync(p);
      return true;
    } catch {
      return false;
    }
  };

  const originalStatSync = sys.statSync.bind(sys);
  sys.statSync = (p: string) => {
    const mem = originalStatSync(p);
    if (!mem.error) return mem;
    try {
      const s = fs.statSync(p);
      return {
        isDirectory: s.isDirectory(),
        isFile: s.isFile(),
        isSymbolicLink: s.isSymbolicLink(),
        size: s.size,
        error: null,
      };
    } catch {
      return mem;
    }
  };

  // Point getCompilerExecutingPath at the real built compiler so that
  // coreResolvePlugin can compute an absolute path to dist/runtime/.
  sys.getCompilerExecutingPath = () => path.resolve(__dirname, '../../dist/compiler/index.mjs');

  // The tsconfig lives on real disk (either the committed fixture or a caller-
  // supplied path), so rolldown can read it directly without any FS shim.
  const tsconfigPath = options.tsconfig ?? TESTING_TSCONFIG;

  const userConfig: d.Config = {
    // @ts-expect-error - devMode is not publicly exposed, just chill
    devMode: true,
    sourceMap: false,
    enableCache: false,
    minifyJs: false,
    minifyCss: false,
    namespace: 'Testing',
    tsconfig: tsconfigPath,
    ...options.config,
  };

  // Use loadConfig (not getConfig) so validateTsConfig runs and populates
  // tsCompilerOptions — without that, getTsOptionsToExtend falls back to NodeJs.
  const { config: validatedConfig } = await loadConfig({
    sys,
    config: userConfig,
    initTsConfig: false,
  });

  const compiler = await createCompiler(validatedConfig);

  // Overlay the fixture tsconfig in inMemoryFs with `include` pointing at srcDir.
  // TypeScript reads via the patched inMemoryFs and discovers virtual source files;
  // rolldown reads the real fixture from disk and is unaffected.
  const tsconfigObj = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
  await compiler.fs.writeFile(
    tsconfigPath,
    JSON.stringify({ ...tsconfigObj, include: [validatedConfig.srcDir] }),
  );

  // Pre-create components.d.ts so the first build skips the two-pass bootstrap
  // (components.d.ts absent → generate → needsRebuild). generateAppTypes will
  // overwrite this stub with correct content during the normal build flow.
  await compiler.fs.writeFile(path.join(validatedConfig.srcDir, 'components.d.ts'), '');

  return {
    compiler,
    config: validatedConfig,
    sys,
  };
};
