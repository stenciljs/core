/*!
 * This file acts as the connector/bridge between Stencil and Jest.
 *
 * It defines/caches a `JestFacade` implementation to dispatch Jest-related configuration calls to the correct section
 * of the Stencil codebase.
 *
 * It contains the APIs that are designed to be used by the Jest pre-configurations supplied by Stencil.
 */

import semverMajor from 'semver/functions/major';

import { Jest27Stencil } from './jest-27-and-under/jest-facade';
import { Jest28Stencil } from './jest-28/jest-facade';
import { Jest29Stencil } from './jest-29/jest-facade';
import { getJestMajorVersion, JestCliRunner, JestPresetConfig, JestScreenshotRunner } from './jest-apis';
import { JestFacade } from './jest-facade';

/**
 * Store a reference to the Jest version-specific facade implementation used to get pieces of testing infrastructure
 */
let JEST_STENCIL_FACADE: JestFacade | null = null;

/**
 * Retrieve the numeric representation of the major version of Jest being used.
 *
 * If a user has Jest v27.1.0 installed, `27` will be returned.
 *
 * @returns the major version of Jest detected
 */
export const getVersion = (): number => {
  return semverMajor(getJestMajorVersion());
};

/**
 * Retrieve the cached local variable containing a Jest facade implementation, based on the version of Jest detected.
 * If no Jest facade implementation is cached, set it.
 *
 * @returns the cached Jest facade implementation.
 */
const getJestFacade = (): JestFacade => {
  if (!JEST_STENCIL_FACADE) {
    const version = getVersion();
    if (version <= 27) {
      JEST_STENCIL_FACADE = new Jest27Stencil();
    } else if (version === 28) {
      JEST_STENCIL_FACADE = new Jest28Stencil() as JestFacade;
    } else if (version === 29) {
      JEST_STENCIL_FACADE = new Jest29Stencil() as JestFacade;
    } else {
      // in Stencil 4.X, defaulting to jest 27 infrastructure is the default behavior.
      JEST_STENCIL_FACADE = new Jest27Stencil();
    }
  }

  if (!JEST_STENCIL_FACADE) {
    throw new Error('Stencil could not determine the Jest version being used.');
  }

  return JEST_STENCIL_FACADE;
};

/**
 * Retrieve the default Jest runner name prescribed by Stencil
 *
 * @returns the stringified name of the test runner, based on the currently detected version of Stencil
 */
export const getDefaultJestRunner = (): string => {
  return getJestFacade().getDefaultJestRunner();
};

/**
 * Retrieve the Stencil-Jest test runner based on the version of Jest that's installed.
 *
 * @returns a test runner for Stencil tests, based on the version of Jest that's detected
 */
export const getRunner = (): JestCliRunner => {
  return getJestFacade().getJestCliRunner();
};

/**
 * Retrieve the Stencil-Jest screenshot facade implementation based on the version of Jest that's installed.
 *
 * @returns a screenshot facade implementation for Stencil tests, based on the version of Jest that's detected
 */
export const getScreenshot = (): JestScreenshotRunner => {
  return getJestFacade().getRunJestScreenshot();
};

/**
 * Retrieve the Jest-Puppeteer Environment, based on the version of Jest that is installed
 *
 * @returns a function capable of creating a Jest-Puppeteer environment
 */
export const getCreateJestPuppeteerEnvironment = () => {
  return getJestFacade().getCreateJestPuppeteerEnvironment();
};

/**
 * Retrieve the Jest preprocessor, based on the version of Jest that is installed
 *
 * @returns a Jest preprocessor to transform code at test time
 */
export const getJestPreprocessor = () => {
  return getJestFacade().getJestPreprocessor();
};

/**
 * Retrieve the Jest-Runner, based on the version of Jest that is installed
 *
 * @returns a function capable of creating a Jest test runner
 */
export const getCreateJestTestRunner = () => {
  return getJestFacade().getCreateJestTestRunner();
};

/**
 * Retrieve the Jest-setup function, based on the version of Jest that is installed
 *
 * @returns a function capable of setting up Jest
 */
export const getJestSetupTestFramework = () => {
  return getJestFacade().getJestSetupTestFramework();
};

/**
 * Retrieve Stencil's Jest presets for the detected version of Jest
 *
 * @returns an object representing a Jest preset
 */
export const getJestPreset = (): JestPresetConfig => {
  return getJestFacade().getJestPreset();
};
