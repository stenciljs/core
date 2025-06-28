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
 *
 * Lazy getter due to "ReferenceError: Cannot access 'globalStyles'
 * before initialization" if setup is run at root level
 *
 * internal state:
 * - undefined: not yet computed
 * - null: computed and cached, but stylesheet not needed/supported
 * - CSSStyleSheet: computed and cached
 *
 * @returns CSSStyleSheet | null
 */
const getLazyGlobalStyleSheet = (() => {
  let value: CSSStyleSheet | null | undefined;

  return () => {
    if (value === undefined) value = createStyleSheetIfNeededAndSupported(globalStyles) ?? null;

    return value;
  };
})();

export function createShadowRoot(this: HTMLElement, cmpMeta: d.ComponentRuntimeMeta) {
  const shadowRoot = BUILD.shadowDelegatesFocus
    ? this.attachShadow({
        mode: 'open',
        delegatesFocus: !!(cmpMeta.$flags$ & CMP_FLAGS.shadowDelegatesFocus),
      })
    : this.attachShadow({ mode: 'open' });

  const globalStyleSheet = getLazyGlobalStyleSheet();
  if (globalStyleSheet) shadowRoot.adoptedStyleSheets.push(globalStyleSheet);
}
