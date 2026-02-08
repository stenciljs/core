import { isFunction } from '@utils';
import ts from 'typescript';

import type { Compiler, Config, Diagnostic, ValidatedConfig } from '../declarations';
import { CompilerContext } from './build/compiler-ctx';
import { createFullBuild } from './build/full-build';
import { createWatchBuild } from './build/watch-build';
import { Cache } from './cache';
import { getConfig } from './sys/config';
import { createInMemoryFs } from './sys/in-memory-fs';
import { resolveModuleIdAsync } from './sys/resolve/resolve-module-async';
import { patchTypescript } from './sys/typescript/typescript-sys';
import { createSysWorker } from './sys/worker/sys-worker';

/**
 * Generate a Stencil compiler instance
 * @param userConfig a user-provided Stencil configuration to apply to the compiler instance
 * @returns a new instance of a Stencil compiler
 * @public
 */
export const createCompiler = async (userConfig: Config): Promise<Compiler> => {
  // actual compiler code
  const config: ValidatedConfig = getConfig(userConfig);
  const diagnostics: Diagnostic[] = [];
  const sys = config.sys;
  const compilerCtx = new CompilerContext();

  if (isFunction(config.sys.setupCompiler)) {
    config.sys.setupCompiler({ ts });
  }

  compilerCtx.fs = createInMemoryFs(sys);
  compilerCtx.cache = new Cache(config, createInMemoryFs(sys));
  await compilerCtx.cache.initCacheDir();

  sys.resolveModuleId = (opts) => resolveModuleIdAsync(sys, compilerCtx.fs, opts);
  compilerCtx.worker = createSysWorker(config);

  if (sys.events) {
    // Pipe events from sys.events to compilerCtx
    sys.events.on(compilerCtx.events.emit);
  }
  patchTypescript(config, compilerCtx.fs);

  const build = () => createFullBuild(config, compilerCtx);

  const createWatcher = () => createWatchBuild(config, compilerCtx);

  const destroy = async () => {
    compilerCtx.reset();
    compilerCtx.events.unsubscribeAll();
    await sys.destroy();
  };

  const compiler: Compiler = {
    build,
    createWatcher,
    destroy,
    sys,
  };

  config.logger.printDiagnostics(diagnostics);

  return compiler;
};
