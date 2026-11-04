import { BUILD } from '@app-data';
import {
  plt,
  styles,
  supportsConstructableStylesheets,
  supportsMutableAdoptedStyleSheets,
  supportsShadow,
  win,
  writeTask,
} from '@platform';

import type * as d from '../declarations';
import { CMP_FLAGS } from '../utils/constants';
import { queryNonceMetaTagContent } from '../utils/query-nonce-meta-tag-content';
import { createTime } from './profile';
import { HYDRATED_STYLE_ID, NODE_TYPE, SLOT_FB_CSS } from './runtime-constants';

export const rootAppliedStyles: d.RootAppliedStyleMap = /*@__PURE__*/ new WeakMap();
const rootAppliedStyleSheets = /*@__PURE__*/ new WeakMap<object, Map<string, CSSStyleSheet[]>>();

type StyleText = string | StyleText[];

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
 * @param sourceMap optional CSS source map URLs matching the style text entries
 */
export const registerStyle = (
  scopeId: string,
  cssText: StyleText,
  allowCS: boolean,
  sourceMap?: d.StyleSourceMapValue,
) => {
  let style = styles.get(scopeId);
  const cssTexts = flattenStyleText(cssText);
  const sourceMaps = Array.isArray(cssText) ? flattenStyleSourceMaps(sourceMap) : [sourceMap];
  const styleTexts = cssTexts.map((text, index) => appendStyleSourceMap(text, sourceMaps[index]));
  if (supportsConstructableStylesheets && allowCS) {
    if (styleTexts.length === 1) {
      const existingStyleSheet = Array.isArray(style)
        ? style.find((entry): entry is CSSStyleSheet => typeof entry !== 'string')
        : style && typeof style !== 'string'
          ? style
          : undefined;
      style = existingStyleSheet || new CSSStyleSheet();
      if (typeof style === 'string') {
        style = styleTexts[0];
      } else {
        style.replaceSync(styleTexts[0]);
      }
    } else {
      const existingStyleSheets = Array.isArray(style)
        ? style.filter((entry): entry is CSSStyleSheet => typeof entry !== 'string')
        : style && typeof style !== 'string'
          ? [style]
          : [];
      style = styleTexts.map((text, index) => {
        const stylesheet = existingStyleSheets[index] || new CSSStyleSheet();
        stylesheet.replaceSync(text);
        return stylesheet;
      });
    }
  } else {
    style = styleTexts.length === 1 ? styleTexts[0] : styleTexts;
  }
  styles.set(scopeId, style);
};

const flattenStyleText = (cssText: StyleText): string[] => {
  // Keep this recursive to support the optional ES5 runtime without requiring Array.prototype.flat.
  if (Array.isArray(cssText)) {
    return cssText.reduce<string[]>((styles, text) => styles.concat(flattenStyleText(text)), []);
  }
  return [cssText];
};

const flattenStyleSourceMaps = (sourceMap: unknown): d.StyleSourceMap[] => {
  if (Array.isArray(sourceMap)) {
    return sourceMap.reduce<d.StyleSourceMap[]>(
      (sourceMaps, map) => sourceMaps.concat(flattenStyleSourceMaps(map)),
      [],
    );
  }
  return sourceMap ? [sourceMap as d.StyleSourceMap] : [];
};

export const appendStyleSourceMap = (styleText: string, sourceMap?: d.StyleSourceMapValue) => {
  if (!sourceMap) {
    return styleText;
  }
  const withoutSourceMap = styleText.replace(/\s*\/\*[#@]\s*sourceMappingURL=[^*]*\*\/\s*$/i, '');
  const sourceMaps = flattenStyleSourceMaps(sourceMap);
  const indexMap = createStyleSourceMapIndex(sourceMaps);
  if (indexMap) {
    return `${withoutSourceMap}\n/*# sourceMappingURL=${indexMap} */`;
  }
  return `${withoutSourceMap}${sourceMaps
    .map((map) => `\n/*# sourceMappingURL=${typeof map === 'string' ? map : map.map} */`)
    .join('')}`;
};

const createStyleSourceMapIndex = (sourceMaps: d.StyleSourceMap[]) => {
  if (sourceMaps.length < 2 || sourceMaps.some((sourceMap) => typeof sourceMap === 'string')) {
    return null;
  }

  const sections = [];
  let column = 0;
  for (const sourceMap of sourceMaps) {
    const map = decodeInlineSourceMap((sourceMap as d.StyleSourceMapSegment).map);
    if (!map) {
      return null;
    }
    sections.push({ offset: { line: 0, column }, map });
    column += (sourceMap as d.StyleSourceMapSegment).length;
  }

  return `data:application/json,${encodeURIComponent(JSON.stringify({ version: 3, sections }))}`;
};

const decodeInlineSourceMap = (sourceMap: string) => {
  const match = sourceMap.match(/^data:application\/json[^,]*,(.*)$/i);
  if (!match) {
    return null;
  }
  try {
    const encoded = match[1];
    const header = match[0].slice(0, match[0].indexOf(','));
    return JSON.parse(/;base64/i.test(header) ? atob(encoded) : decodeURIComponent(encoded));
  } catch (e) {
    return null;
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
    if (typeof style === 'string' || (Array.isArray(style) && typeof style[0] === 'string')) {
      styleContainerNode = styleContainerNode.head || (styleContainerNode as HTMLElement);
      let appliedStyles = rootAppliedStyles.get(styleContainerNode);
      if (!appliedStyles) {
        rootAppliedStyles.set(styleContainerNode, (appliedStyles = new Set()));
      }

      const styleTexts = (Array.isArray(style) ? style : [style]) as string[];
      const isStyleApplied = appliedStyles.has(scopeId);
      const shadowStyleReference =
        'host' in styleContainerNode && !supportsConstructableStylesheets
          ? styleContainerNode.querySelector('style')
          : null;
      const headReferenceNode =
        styleContainerNode.nodeName === 'HEAD'
          ? (() => {
              const preconnectLinks = styleContainerNode.querySelectorAll('link[rel=preconnect]');
              return preconnectLinks.length > 0
                ? preconnectLinks[preconnectLinks.length - 1].nextSibling
                : styleContainerNode.querySelector('style');
            })()
          : null;
      for (let styleIndex = 0; styleIndex < styleTexts.length; styleIndex++) {
        const styleText = styleTexts[styleIndex];
        // Check if style element already exists (for HMR updates)
        // For shadow DOM components, directly update their dedicated style element
        // For scoped components, check if they have their own HMR-created style element
        const existingStyleElm: HTMLStyleElement =
          (BUILD.hydrateClientSide || BUILD.hotModuleReplacement) &&
          styleContainerNode.querySelectorAll(`[${HYDRATED_STYLE_ID}="${scopeId}"]`).item(styleIndex);

        let styleElm: HTMLStyleElement;
        if (existingStyleElm) {
          // Update existing style element (for hydration or HMR)
          existingStyleElm.textContent = styleText;
          continue;
        } else if (isStyleApplied && !BUILD.hotModuleReplacement) {
          continue;
        } else {
          styleElm = win.document.createElement('style');
          styleElm.textContent = styleText;
        }

        // Apply CSP nonce to the style tag if it exists
        const nonce = plt.$nonce$ ?? queryNonceMetaTagContent(win.document);
        if (nonce != null) {
          styleElm.setAttribute('nonce', nonce);
        }

        if (
          (BUILD.hydrateServerSide || BUILD.hotModuleReplacement) &&
          (cmpMeta.$flags$ & CMP_FLAGS.scopedCssEncapsulation ||
            cmpMeta.$flags$ & CMP_FLAGS.shadowNeedsScopedCss ||
            cmpMeta.$flags$ & CMP_FLAGS.shadowDomEncapsulation)
        ) {
          styleElm.setAttribute(HYDRATED_STYLE_ID, scopeId);
        }
        styleElm.setAttribute('data-style-index', `${styleIndex}`);

        /**
         * attach styles at the end of the head tag if we render scoped components
         */
        if (!(cmpMeta.$flags$ & CMP_FLAGS.shadowDomEncapsulation)) {
          if (styleContainerNode.nodeName === 'HEAD') {
            /**
             * if the page contains preconnect links, we want to insert the styles
             * after the last preconnect link to ensure the styles are preloaded
             */
            (styleContainerNode as HTMLElement).insertBefore(
              styleElm,
              headReferenceNode?.parentNode === styleContainerNode ? headReferenceNode : null,
            );
          } else if ('host' in styleContainerNode) {
            if (supportsConstructableStylesheets) {
              /**
               * If a scoped component is used within a shadow root then turn the styles into a
               * constructable stylesheet and add it to the shadow root's adopted stylesheets.
               *
               * Note: order of how styles are adopted is important. The new stylesheet should be
               * adopted before the existing styles.
               *
               * Note: constructable stylesheets can't be shared between windows,
               * we need to create a new one for the current window if necessary
               */
              const currentWindow = styleContainerNode.defaultView ?? styleContainerNode.ownerDocument.defaultView;
              const stylesheet = new currentWindow.CSSStyleSheet();
              stylesheet.replaceSync(styleText);

              /**
               * > If the array needs to be modified, use in-place mutations like push().
               * https://developer.mozilla.org/en-US/docs/Web/API/Document/adoptedStyleSheets
               */
              if (supportsMutableAdoptedStyleSheets) {
                styleContainerNode.adoptedStyleSheets.unshift(stylesheet);
              } else {
                styleContainerNode.adoptedStyleSheets = [stylesheet, ...styleContainerNode.adoptedStyleSheets];
              }
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
              if (shadowStyleReference && !BUILD.hotModuleReplacement && styleTexts.length === 1) {
                shadowStyleReference.textContent = styleText + shadowStyleReference.textContent;
              } else if (shadowStyleReference) {
                styleContainerNode.insertBefore(styleElm, shadowStyleReference);
              } else if (styleTexts.length === 1) {
                (styleContainerNode as HTMLElement).prepend(styleElm);
              } else {
                styleContainerNode.append(styleElm);
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

        // Add styles for `slot-fb` elements if we're using slots outside the Shadow DOM
        if (cmpMeta.$flags$ & CMP_FLAGS.hasSlotRelocation) {
          styleElm.textContent += SLOT_FB_CSS;
        }
      }
      if (!isStyleApplied) {
        appliedStyles.add(scopeId);
      }
    } else if (BUILD.constructableCSS) {
      let appliedStyles = rootAppliedStyles.get(styleContainerNode);
      if (!appliedStyles) {
        rootAppliedStyles.set(styleContainerNode, (appliedStyles = new Set()));
      }
      let appliedStyleSheets = rootAppliedStyleSheets.get(styleContainerNode);
      if (!appliedStyleSheets) {
        rootAppliedStyleSheets.set(styleContainerNode, (appliedStyleSheets = new Map()));
      }
      const previousStyleSheets = appliedStyleSheets.get(scopeId);
      if (!appliedStyles.has(scopeId) || (BUILD.hotModuleReplacement && previousStyleSheets)) {
        /**
         * Constructable stylesheets can't be shared between windows,
         * we need to create a new one for the current window if necessary
         */
        const currentWindow = styleContainerNode.defaultView ?? styleContainerNode.ownerDocument.defaultView;
        const styleSheets = (Array.isArray(style) ? style : [style]) as CSSStyleSheet[];
        const currentStyleSheets = styleSheets.map((sourceStyleSheet) => {
          let currentStyleSheet: CSSStyleSheet;
          if (sourceStyleSheet.constructor === currentWindow.CSSStyleSheet) {
            currentStyleSheet = sourceStyleSheet;
          } else {
            currentStyleSheet = new currentWindow.CSSStyleSheet();
            for (let i = 0; i < sourceStyleSheet.cssRules.length; i++) {
              currentStyleSheet.insertRule(sourceStyleSheet.cssRules[i].cssText, i);
            }
          }
          return currentStyleSheet;
        });

        const adoptedStyleSheets = previousStyleSheets
          ? styleContainerNode.adoptedStyleSheets.filter(
              (stylesheet: CSSStyleSheet) => !previousStyleSheets.includes(stylesheet),
            )
          : styleContainerNode.adoptedStyleSheets;
        const nextAdoptedStyleSheets = [...adoptedStyleSheets, ...currentStyleSheets];
        /**
         * > If the array needs to be modified, use in-place mutations like push().
         * https://developer.mozilla.org/en-US/docs/Web/API/Document/adoptedStyleSheets
         */
        if (previousStyleSheets || !supportsMutableAdoptedStyleSheets) {
          styleContainerNode.adoptedStyleSheets = nextAdoptedStyleSheets;
        } else {
          if (supportsMutableAdoptedStyleSheets) {
            styleContainerNode.adoptedStyleSheets.push(...currentStyleSheets);
          }
        }
        appliedStyleSheets.set(scopeId, currentStyleSheets);

        appliedStyles.add(scopeId);

        // Remove SSR style element from shadow root now that adoptedStyleSheets is in use
        // Only remove from shadow roots, not from document head (for scoped components)
        if (BUILD.hydrateClientSide && 'host' in styleContainerNode) {
          const ssrStyleElms = styleContainerNode.querySelectorAll(`[${HYDRATED_STYLE_ID}="${scopeId}"]`);
          if (ssrStyleElms.length > 0) {
            writeTask(() => ssrStyleElms.forEach((ssrStyleElm: Element) => ssrStyleElm.remove()));
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
  const scopeId = addStyle(
    BUILD.shadowDom && supportsShadow && elm.shadowRoot ? elm.shadowRoot : (elm.getRootNode() as ShadowRoot),
    cmpMeta,
    hostRef.$modeName$,
  );

  if ((BUILD.shadowDom || BUILD.scoped) && BUILD.cssAnnotations && flags & CMP_FLAGS.needsScopedEncapsulation) {
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
  const stylesByScope = new Map<string, string[]>();
  for (let i = 0; i < styles.length; i++) {
    const scopeId = styles[i].getAttribute(HYDRATED_STYLE_ID);
    if (scopeId) {
      const scopeStyles = stylesByScope.get(scopeId) || [];
      scopeStyles.push(convertScopedToShadow(styles[i].innerHTML));
      stylesByScope.set(scopeId, scopeStyles);
    }
  }
  stylesByScope.forEach((scopeStyles, scopeId) => {
    registerStyle(scopeId, scopeStyles, true);
  });
};

declare global {
  export interface CSSStyleSheet {
    replaceSync(cssText: string): void;
    replace(cssText: string): Promise<CSSStyleSheet>;
  }
}
