import { BUILD } from '@app-data';
import { globalStyles } from '@app-globals';
import { CMP_FLAGS } from '@utils';

import type * as d from '../declarations';
import { createStyleSheetIfNeededAndSupported } from './style';

/**
 * Create a single, shared global stylesheet for all shadow roots.
 *
 * This singleton avoids the performance and memory hit of
 * creating a new CSSStyleSheet every time a shadow root is created.
 */
export const globalStyleSheet = createStyleSheetIfNeededAndSupported(globalStyles);

export function createShadowRoot(this: HTMLElement, cmpMeta: d.ComponentRuntimeMeta) {
  const shadowRoot = BUILD.shadowDelegatesFocus
    ? this.attachShadow({
        mode: 'open',
        delegatesFocus: !!(cmpMeta.$flags$ & CMP_FLAGS.shadowDelegatesFocus),
      })
    : this.attachShadow({ mode: 'open' });

  if (globalStyleSheet) shadowRoot.adoptedStyleSheets.push(globalStyleSheet);
}
