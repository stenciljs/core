/*!
 * This file contains Jest API usages for situations where it is difficult to determine which API should be used.
 *
 * An example of this is determining the version of Jest, which is retrieved via the `getVersion` API.
 * It's difficult at compile & runtime to determine:
 * 1. If such an API exists
 * 2. If it's typings are the same across all versions of Jest
 * 3. If there are variants of this API, which one to use and when
 *
 * Short of probing the directory where a user keeps their modules (e.g. `node_modules/`), we need to make a "best
 * guess" at things. This file is meant to only contain functions for these types of scenarios. It is expected that this
 * file be added to sparingly.
 */

import type { TransformedSource } from '@jest/transform';
import type { Config } from '@jest/types';
import * as d from '@stencil/core/internal';
import { getVersion } from 'jest';

/**
 * For Stencil's purposes, an instance of a Jest/Puppeteer environment only needs to have a handful of functions.
 * This does not mean that Jest does not require additional functions on an environment. However, those requirements may
 * change from version-to-version of Jest. Stencil overrides the functions below, and with our current design of
 * integrating with Jest, require them to be overridden.
 */
export type JestPuppeteerEnvironment = {
  setup(): Promise<void>;
  teardown(): Promise<void>;
  getVmContext(): any | null;
};

/**
 * Helper type for describing a function that returns a {@link JestPuppeteerEnvironment}.
 */
export type JestPuppeteerEnvironmentConstructor = new (...args: any[]) => JestPuppeteerEnvironment;

export type JestPreprocessor = {
  process(sourceText: string, sourcePath: string, ...args: any[]): string | TransformedSource;
  getCacheKey(sourceText: string, sourcePath: string, ...args: any[]): string;
};

/**
 * For Stencil's purposes, an instance of a Jest `TestRunner` only needs to have an async `runTests` function.
 * This does not mean that Jest does not require additional functions. However, those requirements may change from
 * version-to-version of Jest. Stencil overrides the `runTests` function, and with our current design of integrating
 * with Jest, require it to be overridden (for test filtering and supporting screenshot testing.
 */
export type JestTestRunner = {
  runTests(...args: any[]): Promise<any>;
};
/**
 * Helper type for describing a function that returns a {@link JestTestRunner}.
 */
export type JestTestRunnerConstructor = new (...args: any[]) => JestTestRunner;

/**
 * This type serves as an alias for a function that invokes the Jest CLI.
 *
 * This alias serves two purposes:
 * 1. It allows Stencil to have a single source of truth for the return type(s) on {@link JestFacade} (and its
 *    implementations)
 * 2. It prevents TypeScript from expanding Stencil type declarations in the generated `.d.ts` file. This is necessary
 *    as TypeScript will make assumptions about where it can dynamically resolve Stencil typings from, which are not
 *    always necessarily true when `tsconfig#paths` are used.
 */
export type JestCliRunner = (config: d.ValidatedConfig, e2eEnv: d.E2EProcessEnv) => Promise<boolean>;

/**
 * This type serves as an alias for a function that invokes Stencil's Screenshot runner.
 *
 * This alias serves two purposes:
 * 1. It allows Stencil to have a single source of truth for the return type(s) on {@link JestFacade} (and its
 *    implementations)
 * 2. It prevents TypeScript from expanding Stencil type declarations in the generated `.d.ts` file. This is necessary
 *    as TypeScript will make assumptions about where it can dynamically resolve Stencil typings from, which are not
 *   always necessarily true when `tsconfig#paths` are used.
 */
export type JestScreenshotRunner = (config: d.ValidatedConfig, e2eEnv: d.E2EProcessEnv) => Promise<boolean>;

/**
 * This type serves as an alias for the type representing the initial configuration for Jest.
 * This alias serves two purposes:
 * 1. It allows Stencil to have a single source of truth for the return type(s) on {@link JestFacade} (and its
 *    implementations)
 * 2. It prevents TypeScript from expanding Jest typings in the generated `.d.ts` file. This is necessary as TypeScript
 *    will make assumptions about where it can dynamically resolve Jest typings from, which do not necessarily hold
 *    true for every type of Stencil project directory structure.
 */
export type JestPresetConfig = Config.InitialOptions;

/**
 * Get the current major version of Jest that Stencil reconciles
 *
 * @returns the major version of Jest.
 */
export const getJestMajorVersion = (): string => {
  return getVersion();
};
