import type { CompilerSystem } from '../declarations';

export const loadCoreCompiler = async (sys: CompilerSystem): Promise<CoreCompiler> => {
  return await sys.dynamicImport!(sys.getCompilerExecutingPath());
};

export type CoreCompiler = typeof import('@stencil/core/compiler');
