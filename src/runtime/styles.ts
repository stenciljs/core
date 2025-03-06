import { BUILD } from '@app-data';
import { plt, styles, supportsConstructableStylesheets, supportsShadow, win } from '@platform';
import { CMP_FLAGS, queryNonceMetaTagContent } from '@utils';

import type * as d from '../declarations';
import { createTime } from './profile';
import { HYDRATED_STYLE_ID, NODE_TYPE, SLOT_FB_CSS } from './runtime-constants';

export const rootAppliedStyles: d.RootAppliedStyleMap = /*@__PURE__*/ new WeakMap();

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
  let style = styles.get(scopeId);
  if (supportsConstructableStylesheets && allowCS) {
    style = (style || new CSSStyleSheet()) as CSSStyleSheet;
    if (typeof style === 'string') {
      style = cssText;
    } else {
      style.replaceSync(cssText);
    }
  } else {
    style = cssText;
  }
  styles.set(scopeId, style);
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
export const addStyle = (styleContainerNode: any, cmpMeta: d.ComponentRuntimeMeta, mode?: string) => {
  const scopeId = getScopeId(cmpMeta, mode);
  const style = styles.get(scopeId);

  if (!BUILD.attachStyles || !win.document) {
    return scopeId;
  }
  // if an element is NOT connected then getRootNode() will return the wrong root node
  // so the fallback is to always use the document for the root node in those cases
  styleContainerNode = styleContainerNode.nodeType === NODE_TYPE.DocumentFragment ? styleContainerNode : win.document;

  if (style) {
    if (typeof style === 'string') {
      styleContainerNode = styleContainerNode.head || (styleContainerNode as HTMLElement);
      let appliedStyles = rootAppliedStyles.get(styleContainerNode);
      let styleElm;
      if (!appliedStyles) {
        rootAppliedStyles.set(styleContainerNode, (appliedStyles = new Set()));
      }
      if (!appliedStyles.has(scopeId)) {
        if (
          BUILD.hydrateClientSide &&
          styleContainerNode.host &&
          (styleElm = styleContainerNode.querySelector(`[${HYDRATED_STYLE_ID}="${scopeId}"]`))
        ) {
          // This is only happening on native shadow-dom, do not needs CSS var shim
          styleElm.innerHTML = style;
        } else {
          styleElm =
            document.querySelector(`[${HYDRATED_STYLE_ID}="${scopeId}"]`) || win.document.createElement('style');
          styleElm.innerHTML = style;

          // Apply CSP nonce to the style tag if it exists
          const nonce = plt.$nonce$ ?? queryNonceMetaTagContent(win.document);
          if (nonce != null) {
            styleElm.setAttribute('nonce', nonce);
          }

          if (
            (BUILD.hydrateServerSide || BUILD.hotModuleReplacement) &&
            (cmpMeta.$flags$ & CMP_FLAGS.scopedCssEncapsulation || cmpMeta.$flags$ & CMP_FLAGS.shadowNeedsScopedCss)
          ) {
            styleElm.setAttribute(HYDRATED_STYLE_ID, scopeId);
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
                /**
                 * If a scoped component is used within a shadow root then turn the styles into a
                 * constructable stylesheet and add it to the shadow root's adopted stylesheets.
                 *
                 * Note: order of how styles are adopted is important. The new stylesheet should be
                 * adopted before the existing styles.
                 */
                const stylesheet = new CSSStyleSheet();
                stylesheet.replaceSync(style);
                styleContainerNode.adoptedStyleSheets = [stylesheet, ...styleContainerNode.adoptedStyleSheets];
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
                 */
                const existingStyleContainer = styleContainerNode.querySelector('style');
                if (existingStyleContainer) {
                  existingStyleContainer.innerHTML = style + existingStyleContainer.innerHTML;
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
            styleContainerNode.insertBefore(styleElm, null);
          }
        }

        // Add styles for `slot-fb` elements if we're using slots outside the Shadow DOM
        if (cmpMeta.$flags$ & CMP_FLAGS.hasSlotRelocation) {
          styleElm.innerHTML += SLOT_FB_CSS;
        }

        if (appliedStyles) {
          appliedStyles.add(scopeId);
        }
      }
    } else if (BUILD.constructableCSS && !styleContainerNode.adoptedStyleSheets.includes(style)) {
      styleContainerNode.adoptedStyleSheets = [...styleContainerNode.adoptedStyleSheets, style];
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
  const scopeId = addStyle(
    BUILD.shadowDom && supportsShadow && elm.shadowRoot ? elm.shadowRoot : (elm.getRootNode() as ShadowRoot),
    cmpMeta,
    hostRef.$modeName$,
  );

  if (
    (BUILD.shadowDom || BUILD.scoped) &&
    BUILD.cssAnnotations &&
    ((flags & CMP_FLAGS.needsScopedEncapsulation && flags & CMP_FLAGS.scopedCssEncapsulation) ||
      flags & CMP_FLAGS.shadowNeedsScopedCss)
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
  'sc-' + (BUILD.mode && mode && cmp.$flags$ & CMP_FLAGS.hasMode ? cmp.$tagName$ + '-' + mode : cmp.$tagName$);

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
export const convertScopedToShadow = (css: string) => css.replace(/\/\*!@([^\/]+)\*\/[^\{]+\{/g, '$1{');

/**
 * Hydrate styles after SSR for components *not* using DSD. Convert 'scoped' styles to 'shadow'
 * and add them to a constructable stylesheet.
 */
export const hydrateScopedToShadow = () => {
  if (!win.document) {
    return;
  }

  const styles = win.document.querySelectorAll(`[${HYDRATED_STYLE_ID}]`);
  let i = 0;
  for (; i < styles.length; i++) {
    registerStyle(styles[i].getAttribute(HYDRATED_STYLE_ID), convertScopedToShadow(styles[i].innerHTML), true);
  }
};

declare global {
  export interface CSSStyleSheet {
    replaceSync(cssText: string): void;
    replace(cssText: string): Promise<CSSStyleSheet>;
  }
}
