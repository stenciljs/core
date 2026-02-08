import { isDtsFile, isJsFile, isJsxFile, isString, isTsFile, isTsxFile, join, normalizePath, resolve } from '@utils';
import { basename, dirname } from 'path';
import ts from 'typescript';

import type * as d from '../../../declarations';
import { patchTsSystemFileSystem } from './typescript-sys';

export const tsResolveModuleName = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  moduleName: string,
  containingFile: string,
) => {
  const resolveModuleName: typeof ts.resolveModuleName = (ts as any).__resolveModuleName || ts.resolveModuleName;

  if (moduleName && resolveModuleName && config.tsCompilerOptions) {
    const host: ts.ModuleResolutionHost = patchTsSystemFileSystem(config, config.sys, compilerCtx.fs, ts.sys);

    const compilerOptions: ts.CompilerOptions = { ...config.tsCompilerOptions };
    compilerOptions.resolveJsonModule = true;
    return resolveModuleName(moduleName, containingFile, compilerOptions, host);
  }

  return null;
};

export const tsGetSourceFile = (config: d.ValidatedConfig, module: ts.ResolvedModuleWithFailedLookupLocations) => {
  if (!module || !module.resolvedModule) {
    return null;
  }
  const compilerOptions: ts.CompilerOptions = { ...config.tsCompilerOptions };
  const host = ts.createCompilerHost(compilerOptions);
  const program = ts.createProgram([module.resolvedModule.resolvedFileName], compilerOptions, host);
  return program.getSourceFile(module.resolvedModule.resolvedFileName);
};

export const tsResolveModuleNamePackageJsonPath = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  moduleName: string,
  containingFile: string,
) => {
  try {
    const resolvedModule = tsResolveModuleName(config, compilerCtx, moduleName, containingFile);
    if (resolvedModule && resolvedModule.resolvedModule && resolvedModule.resolvedModule.resolvedFileName) {
      const rootDir = resolve('/');
      let resolvedFileName = resolvedModule.resolvedModule.resolvedFileName;

      for (let i = 0; i < 30; i++) {
        if (rootDir === resolvedFileName) {
          return null;
        }
        resolvedFileName = dirname(resolvedFileName);
        const pkgJsonPath = join(resolvedFileName, 'package.json');
        const exists = config.sys.accessSync(pkgJsonPath);
        if (exists) {
          return normalizePath(pkgJsonPath);
        }
      }
    }
  } catch (e) {
    config.logger.error(e);
  }
  return null;
};

export const ensureExtension = (fileName: string, containingFile: string) => {
  if (!basename(fileName).includes('.') && isString(containingFile)) {
    containingFile = containingFile.toLowerCase();
    if (isJsFile(containingFile)) {
      fileName += '.js';
    } else if (isDtsFile(containingFile)) {
      fileName += '.d.ts';
    } else if (isTsxFile(containingFile)) {
      fileName += '.tsx';
    } else if (isTsFile(containingFile)) {
      fileName += '.ts';
    } else if (isJsxFile(containingFile)) {
      fileName += '.jsx';
    }
  }

  return fileName;
};
