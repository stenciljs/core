import { BUILD } from '@app-data';
import { globalStyles } from '@app-globals';
import { CMP_FLAGS } from '@utils';

import type * as d from '../declarations';
import { createStyleSheetIfNeededAndSupported } from './style';

let globalStyleSheet: CSSStyleSheet | null | undefined;

export function createShadowRoot(this: HTMLElement, cmpMeta: d.ComponentRuntimeMeta) {
  const shadowRoot = BUILD.shadowDelegatesFocus
    ? this.attachShadow({
        mode: 'open',
        delegatesFocus: !!(cmpMeta.$flags$ & CMP_FLAGS.shadowDelegatesFocus),
      })
    : this.attachShadow({ mode: 'open' });

  // Initialize if undefined, set to CSSStyleSheet or null
  if (globalStyleSheet === undefined) globalStyleSheet = createStyleSheetIfNeededAndSupported(globalStyles) ?? null;

  // Use initialized global stylesheet if available
  if (globalStyleSheet) shadowRoot.adoptedStyleSheets.push(globalStyleSheet);
}
