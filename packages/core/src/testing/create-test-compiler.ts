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
  /**
   * Pre-validated compiler setup from {@link prepareTestCompiler}. When
   * provided, the expensive `loadConfig` step is skipped and a fresh compiler
   * is created directly from the cached validated config.
   */
  setup?: PreparedTestCompiler;
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
 * A pre-validated compiler configuration that can be reused across multiple
 * `createTestCompiler` calls within the same test suite to avoid repeating
 * the expensive `loadConfig` step.
 *
 * Obtain via {@link prepareTestCompiler} in a `beforeAll` block, then pass as
 * `options.setup` to {@link createTestCompiler} in each `beforeEach`.
 */
export interface PreparedTestCompiler {
  /** @internal */
  _validatedConfig: d.ValidatedConfig;
  /** @internal */
  _tsconfigPath: string;
}

/**
 * Builds a patched sys that falls through to real disk for TypeScript lib files.
 *
 * @returns A compiler system instance with patched readFileSync, readFile, accessSync, and statSync methods
 */
const createPatchedSys = (): d.CompilerSystem => {
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

  return sys;
};

/**
 * Runs the expensive one-time setup for a test compiler suite: patching the
 * sys, reading and validating the tsconfig. Use this in a `beforeAll` block
 * when a describe block contains multiple tests that each need a fresh
 * compiler, to avoid repeating `loadConfig` on every test.
 *
 * @param options - Configuration options for preparing the test compiler
 * @returns A {@link PreparedTestCompiler} that can be passed to {@link createTestCompiler}
 *
 * @example
 * ```ts
 * let setup: PreparedTestCompiler;
 * beforeAll(async () => { setup = await prepareTestCompiler(); });
 * beforeEach(async () => {
 *   const { compiler } = await createTestCompiler({ setup });
 * });
 * ```
 */
export const prepareTestCompiler = async (
  options: Omit<CreateTestCompilerOptions, 'setup'> = {},
): Promise<PreparedTestCompiler> => {
  const sys = createPatchedSys();
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

  const { config: validatedConfig } = await loadConfig({
    sys,
    config: userConfig,
    initTsConfig: false,
  });

  return { _validatedConfig: validatedConfig, _tsconfigPath: tsconfigPath };
};

/**
 * Creates a test compiler instance with a hybrid filesystem (reads from disk, writes to memory).
 * This utility handles the common setup pattern for compiler tests.
 *
 * When multiple tests in the same suite need independent compiler instances,
 * pass a {@link PreparedTestCompiler} from {@link prepareTestCompiler} as
 * `options.setup` to skip the expensive `loadConfig` step on each test.
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
  let validatedConfig: d.ValidatedConfig;
  let tsconfigPath: string;

  if (options.setup) {
    // Reuse the pre-validated config, but give this compiler a fresh sys so
    // its in-memory filesystem is isolated from other tests in the suite.
    const freshSys = createPatchedSys();
    validatedConfig = { ...options.setup._validatedConfig, sys: freshSys };
    tsconfigPath = options.setup._tsconfigPath;
  } else {
    const sys = createPatchedSys();
    tsconfigPath = options.tsconfig ?? TESTING_TSCONFIG;

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

    const { config } = await loadConfig({ sys, config: userConfig, initTsConfig: false });
    validatedConfig = config;
  }

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
    sys: validatedConfig.sys,
  };
};
