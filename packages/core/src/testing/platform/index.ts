import { modeResolutionChain } from './testing-constants';
export { Build } from './testing-build';
export { modeResolutionChain, styles } from './testing-constants';
export { getHostRef, registerHost, registerInstance } from './testing-host-ref';
export { consoleDevError, consoleDevInfo, consoleDevWarn, consoleError, setErrorHandler } from './testing-log';
export {
  isMemberInElement,
  plt,
  registerComponents,
  registerModule,
  resetPlatform,
  setPlatformHelpers,
  setSupportsShadowDom,
  startAutoApplyChanges,
  stopAutoApplyChanges,
  supportsConstructableStylesheets,
  supportsListenerOptions,
  supportsMutableAdoptedStyleSheets,
  supportsShadow,
} from './testing-platform';
export { flushAll, flushLoadModule, flushQueue, loadModule, nextTick, readTask, writeTask } from './testing-task-queue';
export { win } from './testing-window';
export { Env } from 'virtual:app-data';
export * from '../../runtime';

// Testing-specific setMode that clears previous handlers first
// This shadows the runtime's setMode so each test gets a clean slate
export const setMode = (handler: (elm: any) => string | undefined | null) => {
  modeResolutionChain.length = 0;
  modeResolutionChain.push(handler);
};

export const setScopedSSR = (scoped?: boolean) => {
  scopedSSR = scoped;
};
export const needsScopedSSR = () => scopedSSR;

let scopedSSR = false;
