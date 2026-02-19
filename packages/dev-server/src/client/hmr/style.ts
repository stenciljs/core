import { HmrStyleUpdate } from "../types"
import { getHmrHref, hasShadowRoot, isElement, isLinkStylesheet, isTemplate, setHmrAttr } from "./utils"

// Attribute used to identify style elements for HMR (matches HYDRATED_STYLE_ID in core)
const STYLE_ID_ATTR = 'sty-id'

// =============================================================================
// HMR External Styles
// =============================================================================

export const hmrExternalStyles = (elm: Element, versionId: string, cssFileNames: string[]): string[] => {
  if (isLinkStylesheet(elm)) {
    cssFileNames.forEach((cssFileName) => {
      hmrStylesheetLink(elm as HTMLLinkElement, versionId, cssFileName)
    })
  }

  if (isTemplate(elm)) {
    hmrExternalStyles((elm as HTMLTemplateElement).content as unknown as Element, versionId, cssFileNames)
  }

  if (hasShadowRoot(elm)) {
    hmrExternalStyles(elm.shadowRoot as unknown as Element, versionId, cssFileNames)
  }

  if (elm.children) {
    for (let i = 0; i < elm.children.length; i++) {
      hmrExternalStyles(elm.children[i], versionId, cssFileNames)
    }
  }

  return cssFileNames.sort()
}

const hmrStylesheetLink = (styleSheetElm: HTMLLinkElement, versionId: string, cssFileName: string): void => {
  const orgHref = styleSheetElm.getAttribute('href')
  const newHref = getHmrHref(versionId, cssFileName, styleSheetElm.href)
  if (newHref !== orgHref) {
    styleSheetElm.setAttribute('href', newHref)
    setHmrAttr(styleSheetElm, versionId)
  }
}

// =============================================================================
// HMR Inline Styles
// =============================================================================

/**
 * Track which style updates actually found and updated existing style elements.
 * Used to determine if we need to create new style elements for first-time CSS.
 */
interface StyleUpdateTracker {
  styleUpdate: HmrStyleUpdate
  updated: boolean
}

export const hmrInlineStyles = (elm: Element, versionId: string, stylesUpdatedData: HmrStyleUpdate[]): string[] => {
  // Track which style updates actually found matching elements
  const trackers: StyleUpdateTracker[] = stylesUpdatedData.map((styleUpdate) => ({
    styleUpdate,
    updated: false,
  }))

  // First pass: update or remove existing style elements
  hmrInlineStylesTraverse(elm, versionId, trackers)

  // Second pass: create style elements for styles that had no matches (CSS added for first time)
  for (const tracker of trackers) {
    if (!tracker.updated && tracker.styleUpdate.styleText) {
      // This style update didn't find any existing elements - CSS was added for first time
      createStyleElementsForComponent(elm, versionId, tracker.styleUpdate)
    }
  }

  return stylesUpdatedData
    .map((s) => s.styleTag)
    .reduce<string[]>((arr, v) => {
      if (arr.indexOf(v) === -1) {
        arr.push(v)
      }
      return arr
    }, [])
    .sort()
}

/**
 * Traverse the DOM looking for style elements to update or remove.
 */
const hmrInlineStylesTraverse = (elm: Element, versionId: string, trackers: StyleUpdateTracker[]): void => {
  if (isElement(elm) && elm.nodeName.toLowerCase() === 'style') {
    trackers.forEach((tracker) => {
      if (hmrStyleElement(elm, versionId, tracker.styleUpdate)) {
        tracker.updated = true
      }
    })
  }

  if (isTemplate(elm)) {
    hmrInlineStylesTraverse((elm as HTMLTemplateElement).content as unknown as Element, versionId, trackers)
  }

  if (hasShadowRoot(elm)) {
    hmrInlineStylesTraverse(elm.shadowRoot as unknown as Element, versionId, trackers)
  }

  if (elm.children) {
    for (let i = 0; i < elm.children.length; i++) {
      hmrInlineStylesTraverse(elm.children[i], versionId, trackers)
    }
  }
}

/**
 * Update or remove a style element based on the HMR update.
 * Returns true if this element matched and was processed.
 */
const hmrStyleElement = (elm: Element, versionId: string, stylesUpdated: HmrStyleUpdate): boolean => {
  const styleId = elm.getAttribute(STYLE_ID_ATTR)
  if (styleId === stylesUpdated.styleId) {
    if (stylesUpdated.styleText) {
      // Update existing style element
      elm.innerHTML = stylesUpdated.styleText.replace(/\\n/g, '\n')
      elm.setAttribute('data-hmr', versionId)
    } else {
      // CSS was removed entirely - remove the style element
      elm.remove()
    }
    return true
  }
  return false
}

/**
 * Find all component instances with the matching tag name and create style elements.
 * Handles both shadow DOM components (style in shadow root) and scoped components (style in head).
 */
const createStyleElementsForComponent = (rootElm: Element, versionId: string, styleUpdate: HmrStyleUpdate): void => {
  const { styleTag, styleId, styleText } = styleUpdate
  const doc = rootElm.ownerDocument

  // Find all component instances with the matching tag name
  const componentInstances = findComponentInstances(rootElm, styleTag)

  if (componentInstances.length === 0) {
    // No component instances found - might be a global style or component not in DOM yet
    // Create style in document head as fallback
    createStyleElement(doc.head, styleId, styleText, versionId)
    return
  }

  // Track which shadow roots we've already added styles to (avoid duplicates)
  const processedShadowRoots = new Set<ShadowRoot>()
  let addedToHead = false

  for (const instance of componentInstances) {
    if (instance.shadowRoot) {
      // Shadow DOM component - add style to shadow root if not already there
      if (!processedShadowRoots.has(instance.shadowRoot)) {
        processedShadowRoots.add(instance.shadowRoot)
        createStyleElement(instance.shadowRoot, styleId, styleText, versionId)
      }
    } else if (!addedToHead) {
      // Scoped component - add style to document head (only once)
      addedToHead = true
      createStyleElement(doc.head, styleId, styleText, versionId)
    }
  }
}

/**
 * Find all instances of a component by tag name, including in shadow roots.
 */
const findComponentInstances = (elm: Element, tagName: string): Element[] => {
  const instances: Element[] = []
  findComponentInstancesTraverse(elm, tagName.toLowerCase(), instances)
  return instances
}

const findComponentInstancesTraverse = (elm: Element, tagName: string, instances: Element[]): void => {
  if (elm.nodeName.toLowerCase() === tagName) {
    instances.push(elm)
  }

  if (hasShadowRoot(elm)) {
    findComponentInstancesTraverse(elm.shadowRoot as unknown as Element, tagName, instances)
  }

  if (elm.children) {
    for (let i = 0; i < elm.children.length; i++) {
      findComponentInstancesTraverse(elm.children[i], tagName, instances)
    }
  }
}

/**
 * Create a new style element with the given content.
 */
const createStyleElement = (container: Element | ShadowRoot, styleId: string, styleText: string, versionId: string): void => {
  const doc = 'ownerDocument' in container ? container.ownerDocument : (container as ShadowRoot).ownerDocument
  const styleElm = doc.createElement('style')
  styleElm.innerHTML = styleText.replace(/\\n/g, '\n')
  styleElm.setAttribute(STYLE_ID_ATTR, styleId)
  styleElm.setAttribute('data-hmr', versionId)

  // Insert at the beginning of the container (prepend)
  if (container.firstChild) {
    container.insertBefore(styleElm, container.firstChild)
  } else {
    container.appendChild(styleElm)
  }
}