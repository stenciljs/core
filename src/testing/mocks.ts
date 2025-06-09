import { createWorkerContext } from '@stencil/core/compiler';
import type * as d from '@stencil/core/internal';
import { MockWindow } from '@stencil/core/mock-doc';
import { noop } from '@utils';
import path from 'path';

import { createConfigFlags } from '../cli/config-flags';
import { BuildContext } from '../compiler/build/build-ctx';
import { Cache as CompilerCache } from '../compiler/cache';
import { buildEvents } from '../compiler/events';
import { createInMemoryFs } from '../compiler/sys/in-memory-fs';
import { TestingLogger } from './testing-logger';
import { createTestingSystem, TestingSystem } from './testing-sys';

/**
 * Creates a mock instance of an internal, validated Stencil configuration object
 * the caller
 * @param overrides a partial implementation of `ValidatedConfig`. Any provided fields will override the defaults
 * provided by this function.
 * @returns the mock Stencil configuration
 */
export function mockValidatedConfig(overrides: Partial<d.ValidatedConfig> = {}): d.ValidatedConfig {
  const baseConfig = mockConfig(overrides);
  const rootDir = path.resolve('/');

  return {
    ...baseConfig,
    buildEs5: false,
    cacheDir: '.stencil',
    devMode: true,
    devServer: {},
    extras: {},
    flags: createConfigFlags(),
    fsNamespace: 'testing',
    hashFileNames: false,
    hashedFileNameLength: 8,
    hydratedFlag: null,
    logLevel: 'info',
    logger: mockLogger(),
    minifyCss: false,
    minifyJs: false,
    namespace: 'Testing',
    outputTargets: baseConfig.outputTargets ?? [],
    packageJsonFilePath: path.join(rootDir, 'package.json'),
    rootDir,
    srcDir: '/src',
    srcIndexHtml: 'src/index.html',
    sys: createTestingSystem(),
    testing: {},
    transformAliasedImportPaths: true,
    rollupConfig: {
      inputOptions: {},
      outputOptions: {},
    },
    validatePrimaryPackageOutputTarget: false,
    ...overrides,
  };
}

/**
 * Creates a mock instance of a Stencil configuration entity. The mocked configuration has no guarantees around the
 * types/validity of its data.
 * @param overrides a partial implementation of `UnvalidatedConfig`. Any provided fields will override the defaults
 * provided by this function.
 * @returns the mock Stencil configuration
 */
export function mockConfig(overrides: Partial<d.UnvalidatedConfig> = {}): d.UnvalidatedConfig {
  const rootDir = path.resolve('/');

  let { sys } = overrides;
  if (!sys) {
    sys = createTestingSystem();
  }
  sys.getCurrentDirectory = () => rootDir;

  return {
    _isTesting: true,
    buildAppCore: false,
    buildDist: true,
    buildEs5: false,
    bundles: null,
    devMode: true,
    enableCache: false,
    extras: {},
    flags: createConfigFlags(),
    globalScript: null,
    hashFileNames: false,
    logger: new TestingLogger(),
    maxConcurrentWorkers: 0,
    minifyCss: false,
    minifyJs: false,
    namespace: 'Testing',
    nodeResolve: {
      // TODO(STENCIL-1107): Remove this field - it's currently overriding Stencil's default options to pass into
      // the `@rollup/plugin-node-resolve` plugin.
      customResolveOptions: {},
    },
    outputTargets: null,
    rollupPlugins: {
      before: [],
      after: [],
    },
    rootDir,
    sourceMap: true,
    sys,
    testing: null,
    validateTypes: false,
    ...overrides,
  };
}

/**
 * Creates a configuration object used to bootstrap a Stencil task invocation
 *
 * Several fields are intentionally undefined for this entity. While it would be trivial to stub them out, this mock
 * generation function operates under the assumption that entities like loggers and compiler system abstractions will
 * be shared by multiple entities in a test suite, who should provide those entities to this function
 *
 * @param overrides the properties on the default entity to manually override
 * @returns the default configuration initialization object, with any overrides applied
 */
export const mockLoadConfigInit = (overrides?: Partial<d.LoadConfigInit>): d.LoadConfigInit => {
  const defaults: d.LoadConfigInit = {
    config: {},
    configPath: undefined,
    initTsConfig: true,
    logger: undefined,
    sys: undefined,
  };

  return { ...defaults, ...overrides };
};

export function mockCompilerCtx(config?: d.ValidatedConfig) {
  const innerConfig = config || mockValidatedConfig();
  const compilerCtx: d.CompilerCtx = {
    version: 1,
    activeBuildId: 0,
    activeDirsAdded: [],
    activeDirsDeleted: [],
    activeFilesAdded: [],
    activeFilesDeleted: [],
    activeFilesUpdated: [],
    addWatchDir: noop,
    addWatchFile: noop,
    cachedGlobalStyle: null,
    changedFiles: new Set(),
    changedModules: new Set(),
    collections: [],
    compilerOptions: null,
    cache: null,
    cssModuleImports: new Map(),
    events: buildEvents(),
    fs: null,
    hasSuccessfulBuild: false,
    isActivelyBuilding: false,
    lastBuildResults: null,
    moduleMap: new Map(),
    nodeMap: new WeakMap(),
    reset: noop,
    resolvedCollections: new Set(),
    rollupCache: new Map(),
    rollupCacheHydrate: null,
    rollupCacheLazy: null,
    rollupCacheNative: null,
    styleModeNames: new Set(),
    worker: createWorkerContext(innerConfig.sys),
  };

  Object.defineProperty(compilerCtx, 'fs', {
    get() {
      if (this._fs == null) {
        this._fs = createInMemoryFs(innerConfig.sys);
      }
      return this._fs;
    },
  });

  Object.defineProperty(compilerCtx, 'cache', {
    get() {
      if (this._cache == null) {
        this._cache = mockCache(innerConfig, compilerCtx);
      }
      return this._cache;
    },
  });

  return compilerCtx;
}

export function mockBuildCtx(config?: d.ValidatedConfig, compilerCtx?: d.CompilerCtx): d.BuildCtx {
  const validatedConfig = config || mockValidatedConfig();
  const validatedCompilerCtx = compilerCtx || mockCompilerCtx(validatedConfig);

  const buildCtx = new BuildContext(validatedConfig, validatedCompilerCtx);
  return buildCtx as d.BuildCtx;
}

function mockCache(config: d.ValidatedConfig, compilerCtx: d.CompilerCtx) {
  config.enableCache = true;
  const cache = new CompilerCache(config, compilerCtx.fs);
  cache.initCacheDir();
  return cache as d.Cache;
}

export function mockLogger() {
  return new TestingLogger();
}

/**
 * Create a {@link d.CompilerSystem} entity for testing the compiler.
 *
 * This function acts as a thin wrapper around a {@link TestingSystem} entity creation. It exists to provide a logical
 * place in the codebase where we might expect Stencil engineers to reach for when attempting to mock a
 * {@link d.CompilerSystem} base type. Should there prove to be usage of both this function and the one it wraps,
 * reconsider if this wrapper is necessary.
 *
 * @returns a System instance for testing purposes.
 */
export function mockCompilerSystem(): TestingSystem {
  return createTestingSystem();
}

export function mockDocument(html: string | null = null) {
  const win = new MockWindow(html);
  return win.document as Document;
}

export function mockWindow(html?: string) {
  const win = new MockWindow(html);
  return win as any as Window;
}

/**
 * This gives you a mock Module, an interface which is the internal compiler
 * representation of a module. It includes a bunch of information necessary for
 * compilation, this mock basically sets sane defaults for all those values.
 *
 * @param mod is an override module that you can supply to set particular values
 * @returns a module object ready to use in tests!
 */
export const mockModule = (mod: Partial<d.Module> = {}): d.Module => ({
  cmps: [],
  coreRuntimeApis: [],
  outputTargetCoreRuntimeApis: {},
  collectionName: '',
  dtsFilePath: '',
  excludeFromCollection: false,
  externalImports: [],
  htmlAttrNames: [],
  htmlTagNames: [],
  htmlParts: [],
  isCollectionDependency: false,
  isLegacy: false,
  jsFilePath: '',
  localImports: [],
  originalImports: [],
  originalCollectionComponentPath: '',
  potentialCmpRefs: [],
  sourceFilePath: '',
  staticSourceFile: '',
  staticSourceFileText: '',
  sourceMapPath: '',
  sourceMapFileText: '',

  // build features
  hasVdomAttribute: false,
  hasVdomClass: false,
  hasVdomFunctional: false,
  hasVdomKey: false,
  hasVdomListener: false,
  hasVdomPropOrAttr: false,
  hasVdomRef: false,
  hasVdomRender: false,
  hasVdomStyle: false,
  hasVdomText: false,
  hasVdomXlink: false,
  ...mod,
});
