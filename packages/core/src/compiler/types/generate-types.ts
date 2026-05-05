import type * as d from '@stencil/core';

import {
  isDtsFile,
  isOutputTargetLoaderBundle,
  isOutputTargetStandalone,
  join,
  relative,
} from '../../utils';
import { generateStandaloneTypes } from '../output-targets/standalone/standalone-types';
import { generateAppTypes } from './generate-app-types';
import { copyStencilCoreDts, updateStencilTypesImports } from './stencil-types';

/**
 * For a single output target, generate types, then copy the Stencil core type declaration file
 * @param config the Stencil configuration associated with the project being compiled
 * @param compilerCtx the current compiler context
 * @param buildCtx the context associated with the current build
 * @param outputTarget the output target to generate types for
 */
export const generateTypes = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  outputTarget: d.OutputTargetTypes,
): Promise<void> => {
  if (!buildCtx.hasError) {
    await generateTypesOutput(config, compilerCtx, buildCtx, outputTarget);
    await copyStencilCoreDts(config, compilerCtx);
  }
};

/**
 * Generate type definition files and write them to a dist directory
 * @param config the Stencil configuration associated with the project being compiled
 * @param compilerCtx the current compiler context
 * @param buildCtx the context associated with the current build
 * @param outputTarget the output target to generate types for
 */
const generateTypesOutput = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  outputTarget: d.OutputTargetTypes,
): Promise<void> => {
  // get all type declaration files in a project's src/ directory
  const srcDirItems = await compilerCtx.fs.readdir(config.srcDir, { recursive: false });
  const srcDtsFiles = srcDirItems.filter((srcItem) => srcItem.isFile && isDtsFile(srcItem.absPath));

  // Copy .d.ts files from src to dist
  // In addition, all references to @stencil/core are replaced
  const copiedDTSFilePaths = await Promise.all(
    srcDtsFiles.map(async (srcDtsFile) => {
      const relPath = relative(config.srcDir, srcDtsFile.absPath);
      const distPath = join(outputTarget.dir!, relPath);

      const originalDtsContent = await compilerCtx.fs.readFile(srcDtsFile.absPath);
      const distDtsContent = updateStencilTypesImports(
        outputTarget.dir!,
        distPath,
        originalDtsContent,
      );

      await compilerCtx.fs.writeFile(distPath, distDtsContent);
      return distPath;
    }),
  );
  const distDtsFilePath = copiedDTSFilePaths.slice(-1)[0];

  const distPath = outputTarget.dir!;
  await generateAppTypes(config, compilerCtx, buildCtx, distPath);
  const typesDir = outputTarget.dir!;

  if (distDtsFilePath) {
    await generateStandaloneTypes(config, compilerCtx, buildCtx, typesDir);
  }

  // Generate loader.d.ts if loader-bundle output target exists
  const hasLoaderBundle = config.outputTargets.some(isOutputTargetLoaderBundle);
  if (hasLoaderBundle) {
    await generateLoaderTypes(compilerCtx, typesDir);
  }

  // Generate standalone.d.ts if standalone output target exists
  const hasStandalone = config.outputTargets.some(isOutputTargetStandalone);
  if (hasStandalone) {
    await generateStandaloneApiTypes(compilerCtx, typesDir);
  }
};

/**
 * Generate loader.d.ts file for the loader entry point.
 * This provides types for defineCustomElements, setNonce, and CustomElementsDefineOptions.
 *
 * @param compilerCtx the current compiler context
 * @param typesDir the directory to write the loader.d.ts file to
 */
const generateLoaderTypes = async (compilerCtx: d.CompilerCtx, typesDir: string): Promise<void> => {
  const loaderDtsContent = `export * from './components';
export interface CustomElementsDefineOptions {
  exclude?: string[];
  syncQueue?: boolean;
  jmp?: (c: Function) => any;
  raf?: (c: FrameRequestCallback) => number;
  ael?: (el: EventTarget, eventName: string, listener: EventListenerOrEventListenerObject, options: boolean | AddEventListenerOptions) => void;
  rel?: (el: EventTarget, eventName: string, listener: EventListenerOrEventListenerObject, options: boolean | AddEventListenerOptions) => void;
}
export declare function defineCustomElements(win?: Window, opts?: CustomElementsDefineOptions): Promise<void>;

/**
 * Used to specify a nonce value that corresponds with an application's CSP.
 * When set, the nonce will be added to all dynamically created script and style tags at runtime.
 * Alternatively, the nonce value can be set on a meta tag in the DOM head
 * (<meta name="csp-nonce" content="{ nonce value here }" />) which
 * will result in the same behavior.
 */
export declare function setNonce(nonce: string): void;
`;

  const loaderDtsPath = join(typesDir, 'loader.d.ts');
  await compilerCtx.fs.writeFile(loaderDtsPath, loaderDtsContent);
};

/**
 * Generate standalone.d.ts file for the standalone output target.
 * This provides types for setNonce and setPlatformOptions.
 *
 * @param compilerCtx the current compiler context
 * @param typesDir the directory to write the standalone.d.ts file to
 */
const generateStandaloneApiTypes = async (
  compilerCtx: d.CompilerCtx,
  typesDir: string,
): Promise<void> => {
  const standaloneDtsContent = `/**
 * Used to specify a nonce value that corresponds with an application's CSP.
 * When set, the nonce will be added to all dynamically created script and style tags at runtime.
 * Alternatively, the nonce value can be set on a meta tag in the DOM head
 * (<meta name="csp-nonce" content="{ nonce value here }" />) which
 * will result in the same behavior.
 */
export declare const setNonce: (nonce: string) => void;

export interface SetPlatformOptions {
  raf?: (c: FrameRequestCallback) => number;
  ael?: (el: EventTarget, eventName: string, listener: EventListenerOrEventListenerObject, options: boolean | AddEventListenerOptions) => void;
  rel?: (el: EventTarget, eventName: string, listener: EventListenerOrEventListenerObject, options: boolean | AddEventListenerOptions) => void;
}
export declare const setPlatformOptions: (opts: SetPlatformOptions) => void;
`;

  const standaloneDtsPath = join(typesDir, 'standalone.d.ts');
  await compilerCtx.fs.writeFile(standaloneDtsPath, standaloneDtsContent);
};
