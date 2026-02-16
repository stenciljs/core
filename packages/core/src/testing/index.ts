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
export { newSpecPage } from './spec-page';
export { setupConsoleMocker, shuffleArray } from './testing-utils';
export type { SpecPage, Testing } from '@stencil/core';
export { registerInstance, getHostRef, registerHost, setErrorHandler, writeTask, readTask, Build, Env, setMode, getMode } from './platform';
export { h, Host, createEvent, getElement, Fragment, getAssetPath, setAssetPath, forceUpdate, Mixin, getRenderingRef } from '../runtime';