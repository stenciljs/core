export {
  mockBuildCtx,
  mockCompilerCtx,
  mockCompilerSystem,
  mockComponentMeta,
  mockConfig,
  mockDocument,
  mockLoadConfigInit,
  mockLogger,
  mockModule,
  mockValidatedConfig,
  mockWindow,
} from './mocks';
export { setupConsoleMocker, shuffleArray, withSilentWarn } from './testing-utils';
export { TestingLogger } from './testing-logger';
export { createTestingSystem, type TestingSystem } from './testing-sys';
export { newSpecPage } from './spec-page';
export type { SpecPage, NewSpecPageOptions } from '@stencil/core';
