import { BUILD } from 'virtual:app-data';
import { globalStyles } from 'virtual:app-globals';
import {
  supportsConstructableStylesheets,
  supportsMutableAdoptedStyleSheets,
} from 'virtual:platform';
import type * as d from '@stencil/core';

import { HYDRATED_STYLE_ID } from '../runtime/runtime-constants';
import { CMP_FLAGS } from './constants';
import { createStyleSheetIfNeededAndSupported } from './style';

let globalStyleSheet: CSSStyleSheet | null | undefined;

// Constant scope ID for global styles to enable HMR tracking
const GLOBAL_STYLE_ID = 'sc-global';

export function createShadowRoot(this: HTMLElement, cmpMeta: d.ComponentRuntimeMeta) {
  // Determine shadow root mode - 'closed' if flag is set, otherwise 'open' (default)
  const isClosed = BUILD.shadowModeClosed && !!(cmpMeta.$flags$ & CMP_FLAGS.shadowModeClosed);
  const opts: ShadowRootInit = { mode: isClosed ? 'closed' : 'open' };

  if (BUILD.shadowDelegatesFocus) {
    opts.delegatesFocus = !!(cmpMeta.$flags$ & CMP_FLAGS.shadowDelegatesFocus);
  }

  if (BUILD.shadowSlotAssignmentManual) {
    const isManual = !!(cmpMeta.$flags$ & CMP_FLAGS.shadowSlotAssignmentManual);
    if (isManual) {
      opts.slotAssignment = 'manual';
    }
  }

  const shadowRoot = this.attachShadow(opts);

  // For closed shadow roots, store the reference so Stencil can still access it internally.
  // Note: element.shadowRoot will return null for closed shadow roots.
  if (BUILD.shadowModeClosed && isClosed) {
    (this as any).__shadowRoot = shadowRoot;
  }

  // Initialize if undefined, set to CSSStyleSheet or null
  if (globalStyleSheet === undefined)
    globalStyleSheet = createStyleSheetIfNeededAndSupported(globalStyles) ?? null;

  // Use initialized global stylesheet if available
  if (globalStyleSheet) {
    if (supportsMutableAdoptedStyleSheets) {
      shadowRoot.adoptedStyleSheets.push(globalStyleSheet);
    } else {
      shadowRoot.adoptedStyleSheets = [...shadowRoot.adoptedStyleSheets, globalStyleSheet];
    }
  } else if (globalStyles && !supportsConstructableStylesheets) {
    // Fallback for dev mode: add global styles as <style> tag in each shadow root
    // Each shadow root needs its own copy when using <style> tags
    const styleElm = document.createElement('style');
    styleElm.innerHTML = globalStyles;

    // Add sty-id attribute for HMR tracking
    if (BUILD.hotModuleReplacement) {
      styleElm.setAttribute(HYDRATED_STYLE_ID, GLOBAL_STYLE_ID);
    }

    shadowRoot.prepend(styleElm);
  }
}
