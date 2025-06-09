import { JestFacade } from '../jest-facade';
import { createJestPuppeteerEnvironment } from './jest-environment';
import { jestPreprocessor } from './jest-preprocessor';
import { preset } from './jest-preset';
import { createTestRunner } from './jest-runner';
import { runJest } from './jest-runner';
import { runJestScreenshot } from './jest-screenshot';
import { jestSetupTestFramework } from './jest-setup-test-framework';

/**
 * `JestFacade` implementation for communicating between this directory's version of Jest and Stencil
 */
export class Jest27Stencil implements JestFacade {
  getJestCliRunner() {
    return runJest;
  }

  getRunJestScreenshot() {
    return runJestScreenshot;
  }

  getDefaultJestRunner() {
    return 'jest-jasmine2';
  }

  getCreateJestPuppeteerEnvironment() {
    return createJestPuppeteerEnvironment;
  }

  getJestPreprocessor() {
    return jestPreprocessor;
  }

  getCreateJestTestRunner() {
    return createTestRunner;
  }

  getJestSetupTestFramework() {
    return jestSetupTestFramework;
  }

  getJestPreset() {
    return preset;
  }
}
