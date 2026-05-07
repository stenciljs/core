import { BUILD } from 'virtual:app-data';
import {
  plt,
  styles,
  supportsConstructableStylesheets,
  supportsMutableAdoptedStyleSheets,
  win,
  writeTask,
} from 'virtual:platform';
import type * as d from '@stencil/core';

import { CMP_FLAGS } from '../utils/constants';
import { queryNonceMetaTagContent } from '../utils/query-nonce-meta-tag-content';
import { getShadowRoot } from './element';
import { createTime } from './profile';
import { HYDRATED_STYLE_ID, NODE_TYPE, SLOT_FB_CSS } from './runtime-constants';

export const rootAppliedStyles: d.RootAppliedStyleMap = /*@__PURE__*/ new WeakMap();

/**
 * Get or initialize the set of applied style scope IDs for a container element.
 *
 * @param container the container element to track styles for
 * @returns the set of applied scope IDs
 */
const getAppliedStyles = (container: Element): Set<string> => {
  let applied = rootAppliedStyles.get(container);
  if (!applied) {
    applied = new Set();
    rootAppliedStyles.set(container, applied);
  }
  return applied;
};

/**
 * Safely adopt a stylesheet into a container's adoptedStyleSheets.
 * Handles both mutable and immutable adoptedStyleSheets arrays.
 *
 * @param container the shadow root or document to adopt styles into
 * @param sheet the CSSStyleSheet to adopt
 * @param prepend if true, add to beginning; if false, add to end
 */
const adoptStylesheet = (
  container: ShadowRoot | Document,
  sheet: CSSStyleSheet,
  prepend: boolean = false,
) => {
  if (supportsMutableAdoptedStyleSheets) {
    if (prepend) {
      container.adoptedStyleSheets.unshift(sheet);
    } else {
      container.adoptedStyleSheets.push(sheet);
    }
  } else {
    if (prepend) {
      container.adoptedStyleSheets = [sheet, ...container.adoptedStyleSheets];
    } else {
      container.adoptedStyleSheets = [...container.adoptedStyleSheets, sheet];
    }
  }
};

/**
 * Create a CSSStyleSheet for the correct window context.
 * Constructable stylesheets can't be shared between windows,
 * so we need to create one for the current window.
 *
 * @param container the container node (used to determine the window context)
 * @param cssText the CSS text to populate the stylesheet with
 * @returns a new CSSStyleSheet for the correct window
 */
const createStylesheetForWindow = (container: Node, cssText: string): CSSStyleSheet => {
  const currentWindow = ((container as Document).defaultView ??
    (container as Element).ownerDocument?.defaultView ??
    win) as Window & typeof globalThis;
  const sheet = new currentWindow.CSSStyleSheet();
  sheet.replaceSync(cssText);
  return sheet;
};

/**
 * Get the style for a component, appending slot fallback CSS if needed.
 * Returns a new value without mutating the cached style.
 *
 * @param style - the style string or CSSStyleSheet to process
 * @returns the style (string or CSSStyleSheet) with slot CSS appended if needed, or undefined
 */
const getStyleWithSlotCss = (
  style: string | CSSStyleSheet | undefined,
): string | CSSStyleSheet | undefined => {
  // Component needs slot fallback CSS
  if (!style) {
    return SLOT_FB_CSS;
  }
  if (typeof style === 'string') {
    return style + SLOT_FB_CSS;
  }

  return style;
};

/**
 * Register the styles for a component by creating a stylesheet and then
 * registering it under the component's scope ID in a `WeakMap` for later use.
 *
 * If constructable stylesheet are not supported or `allowCS` is set to
 * `false` then the styles will be registered as a string instead.
 *
 * @param scopeId the scope ID for the component of interest
 * @param cssText styles for the component of interest
 * @param allowCS whether or not to use a constructable stylesheet
 */
export const registerStyle = (scopeId: string, cssText: string, allowCS: boolean) => {
  if (supportsConstructableStylesheets && allowCS) {
    const sheet = (styles.get(scopeId) as CSSStyleSheet) ?? new CSSStyleSheet();
    sheet.replaceSync(cssText);
    styles.set(scopeId, sheet);
  } else {
    styles.set(scopeId, cssText);
  }
};

/**
 * Attach the styles for a given component to the DOM
 *
 * If the element uses shadow or is already attached to the DOM then we can
 * create a stylesheet inside of its associated document fragment, otherwise
 * we'll stick the stylesheet into the document head.
 *
 * @param styleContainerNode the node within which a style element for the
 * component of interest should be added
 * @param cmpMeta runtime metadata for the component of interest
 * @param mode an optional current mode
 * @returns the scope ID for the component of interest
 */
export const addStyle = (
  styleContainerNode: any,
  cmpMeta: d.ComponentRuntimeMeta,
  mode?: string,
) => {
  const scopeId = getScopeId(cmpMeta, mode);

  if (!BUILD.attachStyles || !win.document) {
    return scopeId;
  }

  let style = styles.get(scopeId);

  if (cmpMeta.$flags$ & CMP_FLAGS.hasSlotRelocation) {
    style = getStyleWithSlotCss(style);
  }

  // Determine the style container:
  // - Keep shadow roots (DocumentFragment) as-is
  // - For closed shadow DOM during SSR, the host element is passed directly - keep it
  // - Otherwise, fallback to the document (for when element is not connected)
  const isClosedShadowSSR =
    BUILD.hydrateServerSide &&
    BUILD.shadowModeClosed &&
    cmpMeta.$flags$ & CMP_FLAGS.shadowNeedsScopedCss &&
    cmpMeta.$flags$ & CMP_FLAGS.shadowModeClosed;

  if (styleContainerNode.nodeType !== NODE_TYPE.DocumentFragment && !isClosedShadowSSR) {
    styleContainerNode = win.document;
  }

  if (style) {
    if (typeof style === 'string') {
      styleContainerNode = styleContainerNode.head || (styleContainerNode as HTMLElement);
      const appliedStyles = getAppliedStyles(styleContainerNode);
      let styleElm: HTMLStyleElement;

      // Check if style element already exists (for HMR updates)
      // For shadow DOM components, directly update their dedicated style element
      // For scoped components, check if they have their own HMR-created style element
      const existingStyleElm: HTMLStyleElement =
        (BUILD.hydrateClientSide || BUILD.hotModuleReplacement) &&
        styleContainerNode.querySelector(`[${HYDRATED_STYLE_ID}="${scopeId}"]`);

      if (existingStyleElm) {
        // Update existing style element (for hydration or HMR)
        existingStyleElm.textContent = style;
      } else if (!appliedStyles.has(scopeId)) {
        styleElm = win.document.createElement('style');
        styleElm.textContent = style;

        // Apply CSP nonce to the style tag if it exists
        const nonce = plt.$nonce$ ?? queryNonceMetaTagContent(win.document);
        if (nonce != null) {
          styleElm.setAttribute('nonce', nonce);
        }

        if (
          (BUILD.hydrateServerSide &&
            (cmpMeta.$flags$ & CMP_FLAGS.scopedCssEncapsulation ||
              cmpMeta.$flags$ & CMP_FLAGS.shadowNeedsScopedCss ||
              cmpMeta.$flags$ & CMP_FLAGS.shadowDomEncapsulation)) ||
          BUILD.hotModuleReplacement
        ) {
          styleElm.setAttribute(HYDRATED_STYLE_ID, scopeId);
        }

        // Mark elements where slot-fb CSS was appended so the HMR updater
        // knows to re-append it when the style text is replaced
        if (BUILD.hotModuleReplacement && cmpMeta.$flags$ & CMP_FLAGS.hasSlotRelocation) {
          styleElm.setAttribute('data-slot-fb', '');
        }

        /**
         * attach styles at the end of the head tag if we render scoped components
         */
        if (!(cmpMeta.$flags$ & CMP_FLAGS.shadowDomEncapsulation)) {
          if (styleContainerNode.nodeName === 'HEAD') {
            /**
             * if the page contains preconnect links, we want to insert the styles
             * after the last preconnect link to ensure the styles are preloaded
             */
            const preconnectLinks = styleContainerNode.querySelectorAll('link[rel=preconnect]');
            const referenceNode =
              preconnectLinks.length > 0
                ? preconnectLinks[preconnectLinks.length - 1].nextSibling
                : styleContainerNode.querySelector('style');
            (styleContainerNode as HTMLElement).insertBefore(
              styleElm,
              referenceNode?.parentNode === styleContainerNode ? referenceNode : null,
            );
          } else if ('host' in styleContainerNode) {
            if (supportsConstructableStylesheets) {
              // Scoped component in shadow root: create stylesheet and prepend to adoptedStyleSheets
              const stylesheet = createStylesheetForWindow(styleContainerNode, style);
              adoptStylesheet(styleContainerNode, stylesheet, true);
            } else {
              /**
               * If a scoped component is used within a shadow root and constructable stylesheets are
               * not supported, we want to insert the styles at the beginning of the shadow root node.
               *
               * However, if there is already a style node in the shadow root, we just append
               * the styles to the existing node.
               *
               * Note: order of how styles are applied is important. The new style node
               * should be inserted before the existing style node.
               *
               * During HMR, create separate style elements for scoped components so they can be
               * updated independently without affecting other components' styles.
               */
              const existingStyleContainer: HTMLStyleElement =
                styleContainerNode.querySelector('style');
              if (existingStyleContainer && !BUILD.hotModuleReplacement) {
                existingStyleContainer.textContent = style + existingStyleContainer.textContent;
              } else {
                (styleContainerNode as HTMLElement).prepend(styleElm);
              }
            }
          } else {
            styleContainerNode.append(styleElm);
          }
        }

        /**
         * attach styles at the beginning of a shadow root node if we render shadow components
         */
        if (cmpMeta.$flags$ & CMP_FLAGS.shadowDomEncapsulation) {
          // For closed shadow DOM SSR (styles inlined into host element), prepend to be first child
          // For regular shadow DOM, append to the shadow root
          if (isClosedShadowSSR) {
            (styleContainerNode as HTMLElement).prepend(styleElm);
          } else {
            styleContainerNode.insertBefore(styleElm, null);
          }
        }

        if (appliedStyles) {
          appliedStyles.add(scopeId);
        }
      }
    } else if (BUILD.constructableCSS) {
      const appliedStyles = getAppliedStyles(styleContainerNode);
      if (!appliedStyles.has(scopeId)) {
        // Ensure stylesheet is for the correct window context
        const currentWindow = (styleContainerNode.defaultView ??
          styleContainerNode.ownerDocument.defaultView) as Window & typeof globalThis;
        let stylesheet: CSSStyleSheet;
        if (style.constructor === currentWindow.CSSStyleSheet) {
          stylesheet = style;
        } else {
          // Copy rules to a new stylesheet for this window
          stylesheet = new currentWindow.CSSStyleSheet();
          for (let i = 0; i < style.cssRules.length; i++) {
            stylesheet.insertRule(style.cssRules[i].cssText, i);
          }
        }
        adoptStylesheet(styleContainerNode, stylesheet);
        appliedStyles.add(scopeId);

        // Remove SSR style element from shadow root now that adoptedStyleSheets is in use
        // Only remove from shadow roots, not from document head (for scoped components)
        if (BUILD.hydrateClientSide && 'host' in styleContainerNode) {
          const ssrStyleElm = styleContainerNode.querySelector(
            `[${HYDRATED_STYLE_ID}="${scopeId}"]`,
          );
          if (ssrStyleElm) {
            writeTask(() => ssrStyleElm.remove());
          }
        }
      }
    }
  }

  return scopeId;
};

/**
 * Add styles for a given component to the DOM, optionally handling 'scoped'
 * encapsulation by adding an appropriate class name to the host element.
 *
 * @param hostRef the host reference for the component of interest
 */
export const attachStyles = (hostRef: d.HostRef) => {
  const cmpMeta = hostRef.$cmpMeta$;
  const elm = hostRef.$hostElement$;
  const flags = cmpMeta.$flags$;
  const endAttachStyles = createTime('attachStyles', cmpMeta.$tagName$);

  // Determine the style container:
  // - For shadow DOM components with a shadow root, use the shadow root
  // - For closed shadow DOM during SSR (shadowNeedsScopedCss + shadowModeClosed), use the host element
  //   so styles are inlined with the component for proper serialization
  // - For regular scoped components, use the document root
  let styleContainerNode: ShadowRoot | HTMLElement;
  const shadowRoot = BUILD.shadowDom ? getShadowRoot(elm) : null;

  if (shadowRoot) {
    styleContainerNode = shadowRoot;
  } else if (
    BUILD.hydrateServerSide &&
    BUILD.shadowModeClosed &&
    flags & CMP_FLAGS.shadowNeedsScopedCss &&
    flags & CMP_FLAGS.shadowModeClosed
  ) {
    // Closed shadow DOM with scoped CSS during SSR: inline styles into the host element
    styleContainerNode = elm;
  } else {
    styleContainerNode = elm.getRootNode() as ShadowRoot;
  }

  const scopeId = addStyle(styleContainerNode, cmpMeta, hostRef.$modeName$);

  if (
    (BUILD.shadowDom || BUILD.scoped) &&
    BUILD.cssAnnotations &&
    flags & CMP_FLAGS.needsScopedEncapsulation
  ) {
    // only required when we're NOT using native shadow dom (slot)
    // or this browser doesn't support native shadow dom
    // and this host element was NOT created with SSR
    // let's pick out the inner content for slot projection
    // create a node to represent where the original
    // content was first placed, which is useful later on
    // DOM WRITE!!
    elm['s-sc'] = scopeId;
    elm.classList.add(scopeId + '-h');
  }
  endAttachStyles();
};

/**
 * Get the scope ID for a given component
 *
 * @param cmp runtime metadata for the component of interest
 * @param mode the current mode (optional)
 * @returns a scope ID for the component of interest
 */
export const getScopeId = (cmp: d.ComponentRuntimeMeta, mode?: string) =>
  'sc-' +
  (BUILD.mode && mode && cmp.$flags$ & CMP_FLAGS.hasMode
    ? cmp.$tagName$ + '-' + mode
    : cmp.$tagName$);

/**
 * Convert a 'scoped' CSS string to one appropriate for use in the shadow DOM.
 *
 * Given a 'scoped' CSS string that looks like this:
 *
 * ```
 * /*!@div*\/div.class-name { display: flex };
 * ```
 *
 * Convert it to a 'shadow' appropriate string, like so:
 *
 * ```
 *  /*!@div*\/div.class-name { display: flex }
 *      ─┬─                  ────────┬────────
 *       │                           │
 *       │         ┌─────────────────┘
 *       ▼         ▼
 *      div{ display: flex }
 * ```
 *
 * Note that forward-slashes in the above are escaped so they don't end the
 * comment.
 *
 * @param css a CSS string to convert
 * @returns the converted string
 */
const convertScopedToShadow = (css: string) => css.replace(/\/\*!@([^/]+)\*\/[^{]+\{/g, '$1{');

/**
 * Hydrate styles after SSR for components *not* using DSD. Convert 'scoped' styles to 'shadow'
 * and add them to a constructable stylesheet.
 *
 * @returns void
 */
export const hydrateScopedToShadow = () => {
  if (!win.document) {
    return;
  }

  const styleElements = win.document.querySelectorAll(`[${HYDRATED_STYLE_ID}]`);
  let i = 0;
  for (; i < styleElements.length; i++) {
    registerStyle(
      styleElements[i].getAttribute(HYDRATED_STYLE_ID),
      convertScopedToShadow(styleElements[i].innerHTML),
      true,
    );
  }
};

declare global {
  export interface CSSStyleSheet {
    replaceSync(cssText: string): void;
    replace(cssText: string): Promise<CSSStyleSheet>;
  }
}
