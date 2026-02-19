/**
 * Hot Module Replacement (HMR) utilities for dev server client.
 */

import { NODE_TYPE_DOCUMENT_FRAGMENT, NODE_TYPE_ELEMENT } from './constants.js'
import type { HmrResults, HmrStyleUpdate, HostElement, HotModuleReplacement } from './types.js'

// =============================================================================
// URL/Querystring Utilities
// =============================================================================

export const getHmrHref = (versionId: string, fileName: string, testUrl: string): string => {
  if (typeof testUrl === 'string' && testUrl.trim() !== '') {
    if (getUrlFileName(fileName) === getUrlFileName(testUrl)) {
      return setHmrQueryString(testUrl, versionId)
    }
  }
  return testUrl
}

const getUrlFileName = (url: string): string => {
  const splt = url.split('/')
  return splt[splt.length - 1].split('&')[0].split('?')[0]
}

const parseQuerystring = (oldQs: string): Record<string, string> => {
  const newQs: Record<string, string> = {}
  if (typeof oldQs === 'string') {
    oldQs.split('&').forEach((kv) => {
      const splt = kv.split('=')
      newQs[splt[0]] = splt[1] ? splt[1] : ''
    })
  }
  return newQs
}

const stringifyQuerystring = (qs: Record<string, string>): string =>
  Object.keys(qs)
    .map((key) => key + '=' + qs[key])
    .join('&')

export const setQueryString = (url: string, qsKey: string, qsValue: string): string => {
  const urlSplt = url.split('?')
  const urlPath = urlSplt[0]
  const qs = parseQuerystring(urlSplt[1])
  qs[qsKey] = qsValue
  return urlPath + '?' + stringifyQuerystring(qs)
}

const setHmrQueryString = (url: string, versionId: string): string =>
  setQueryString(url, 's-hmr', versionId)

export const updateCssUrlValue = (versionId: string, fileName: string, oldCss: string): string => {
  const reg = /url\((['"]?)(.*)\1\)/gi
  let result
  let newCss = oldCss

  while ((result = reg.exec(oldCss)) !== null) {
    const url = result[2]
    newCss = newCss.replace(url, getHmrHref(versionId, fileName, url))
  }

  return newCss
}

// =============================================================================
// Element Utilities
// =============================================================================

const isLinkStylesheet = (elm: Element): boolean =>
  elm.nodeName.toLowerCase() === 'link' &&
  !!(elm as HTMLLinkElement).href &&
  !!(elm as HTMLLinkElement).rel &&
  (elm as HTMLLinkElement).rel.toLowerCase() === 'stylesheet'

const isTemplate = (elm: Element): boolean =>
  elm.nodeName.toLowerCase() === 'template' &&
  !!(elm as HTMLTemplateElement).content &&
  (elm as HTMLTemplateElement).content.nodeType === NODE_TYPE_DOCUMENT_FRAGMENT

const setHmrAttr = (elm: Element, versionId: string): void => {
  elm.setAttribute('data-hmr', versionId)
}

const hasShadowRoot = (elm: Element): boolean =>
  !!elm.shadowRoot &&
  elm.shadowRoot.nodeType === NODE_TYPE_DOCUMENT_FRAGMENT &&
  elm.shadowRoot !== (elm as unknown)

const isElement = (elm: Element): boolean =>
  !!elm && elm.nodeType === NODE_TYPE_ELEMENT && !!elm.getAttribute

// =============================================================================
// HMR Components
// =============================================================================

const hmrComponents = (element: Element, versionId: string, hmrTagNames: string[]): string[] => {
  const updatedTags: string[] = []

  hmrTagNames.forEach((hmrTagName) => {
    hmrComponent(updatedTags, element, versionId, hmrTagName)
  })

  return updatedTags.sort()
}

const hmrComponent = (
  updatedTags: string[],
  element: Element,
  versionId: string,
  cmpTagName: string
): void => {
  if (
    element.nodeName.toLowerCase() === cmpTagName &&
    typeof (element as HostElement)['s-hmr'] === 'function'
  ) {
    ;(element as HostElement)['s-hmr']!(versionId)
    setHmrAttr(element, versionId)

    if (updatedTags.indexOf(cmpTagName) === -1) {
      updatedTags.push(cmpTagName)
    }
  }

  if (hasShadowRoot(element)) {
    hmrComponent(updatedTags, element.shadowRoot as unknown as Element, versionId, cmpTagName)
  }

  if (element.children) {
    for (let i = 0; i < element.children.length; i++) {
      hmrComponent(updatedTags, element.children[i], versionId, cmpTagName)
    }
  }
}

// =============================================================================
// HMR External Styles
// =============================================================================

const hmrExternalStyles = (elm: Element, versionId: string, cssFileNames: string[]): string[] => {
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

const hmrInlineStyles = (elm: Element, versionId: string, stylesUpdatedData: HmrStyleUpdate[]): string[] => {
  if (isElement(elm) && elm.nodeName.toLowerCase() === 'style') {
    stylesUpdatedData.forEach((styleUpdated) => {
      hmrStyleElement(elm, versionId, styleUpdated)
    })
  }

  if (isTemplate(elm)) {
    hmrInlineStyles((elm as HTMLTemplateElement).content as unknown as Element, versionId, stylesUpdatedData)
  }

  if (hasShadowRoot(elm)) {
    hmrInlineStyles(elm.shadowRoot as unknown as Element, versionId, stylesUpdatedData)
  }

  if (elm.children) {
    for (let i = 0; i < elm.children.length; i++) {
      hmrInlineStyles(elm.children[i], versionId, stylesUpdatedData)
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

const hmrStyleElement = (elm: Element, versionId: string, stylesUpdated: HmrStyleUpdate): void => {
  const styleId = elm.getAttribute('sty-id')
  if (styleId === stylesUpdated.styleId && stylesUpdated.styleText) {
    elm.innerHTML = stylesUpdated.styleText.replace(/\\n/g, '\n')
    elm.setAttribute('data-hmr', versionId)
  }
}

// =============================================================================
// HMR Images
// =============================================================================

const hmrImages = (win: Window, doc: Document, versionId: string, imageFileNames: string[]): string[] => {
  if (win.location.protocol !== 'file:' && doc.styleSheets) {
    hmrStyleSheetsImages(doc, versionId, imageFileNames)
  }

  hmrImagesElements(win, doc.documentElement, versionId, imageFileNames)

  return imageFileNames.sort()
}

const hmrStyleSheetsImages = (doc: Document, versionId: string, imageFileNames: string[]): void => {
  const cssImageProps = Object.keys(doc.documentElement.style).filter((cssProp) => {
    return cssProp.endsWith('Image')
  })

  for (let i = 0; i < doc.styleSheets.length; i++) {
    hmrStyleSheetImages(cssImageProps, doc.styleSheets[i] as CSSStyleSheet, versionId, imageFileNames)
  }
}

const hmrStyleSheetImages = (
  cssImageProps: string[],
  styleSheet: CSSStyleSheet,
  versionId: string,
  imageFileNames: string[]
): void => {
  try {
    const cssRules = styleSheet.cssRules
    for (let i = 0; i < cssRules.length; i++) {
      const cssRule = cssRules[i]

      switch (cssRule.type) {
        case CSSRule.IMPORT_RULE:
          hmrStyleSheetImages(cssImageProps, (cssRule as CSSImportRule).styleSheet!, versionId, imageFileNames)
          break
        case CSSRule.STYLE_RULE:
          hmrStyleSheetRuleImages(cssImageProps, cssRule as CSSStyleRule, versionId, imageFileNames)
          break
        case CSSRule.MEDIA_RULE:
          hmrStyleSheetImages(cssImageProps, cssRule as unknown as CSSStyleSheet, versionId, imageFileNames)
          break
      }
    }
  } catch (e) {
    console.error('hmrStyleSheetImages:', e)
  }
}

const hmrStyleSheetRuleImages = (
  cssImageProps: string[],
  cssRule: CSSStyleRule,
  versionId: string,
  imageFileNames: string[]
): void => {
  cssImageProps.forEach((cssImageProp) => {
    imageFileNames.forEach((imageFileName) => {
      const oldCssText = (cssRule.style as unknown as Record<string, string>)[cssImageProp]
      const newCssText = updateCssUrlValue(versionId, imageFileName, oldCssText)

      if (oldCssText !== newCssText) {
        ;(cssRule.style as unknown as Record<string, string>)[cssImageProp] = newCssText
      }
    })
  })
}

const hmrImagesElements = (win: Window, elm: Element, versionId: string, imageFileNames: string[]): void => {
  const tagName = elm.nodeName.toLowerCase()

  if (tagName === 'img') {
    hmrImgElement(elm as HTMLImageElement, versionId, imageFileNames)
  }

  if (isElement(elm)) {
    const styleAttr = elm.getAttribute('style')
    if (styleAttr) {
      hmrUpdateStyleAttr(elm, versionId, imageFileNames, styleAttr)
    }
  }

  if (tagName === 'style') {
    hmrUpdateStyleElementUrl(elm as HTMLStyleElement, versionId, imageFileNames)
  }

  if (win.location.protocol !== 'file:' && isLinkStylesheet(elm)) {
    hmrUpdateLinkElementUrl(elm as HTMLLinkElement, versionId, imageFileNames)
  }

  if (isTemplate(elm)) {
    hmrImagesElements(win, (elm as HTMLTemplateElement).content as unknown as Element, versionId, imageFileNames)
  }

  if (hasShadowRoot(elm)) {
    hmrImagesElements(win, elm.shadowRoot as unknown as Element, versionId, imageFileNames)
  }

  if (elm.children) {
    for (let i = 0; i < elm.children.length; i++) {
      hmrImagesElements(win, elm.children[i], versionId, imageFileNames)
    }
  }
}

const hmrImgElement = (imgElm: HTMLImageElement, versionId: string, imageFileNames: string[]): void => {
  imageFileNames.forEach((imageFileName) => {
    const orgSrc = imgElm.getAttribute('src')
    const newSrc = getHmrHref(versionId, imageFileName, orgSrc || '')
    if (newSrc !== orgSrc) {
      imgElm.setAttribute('src', newSrc)
      setHmrAttr(imgElm, versionId)
    }
  })
}

const hmrUpdateStyleAttr = (elm: Element, versionId: string, imageFileNames: string[], oldStyleAttr: string): void => {
  imageFileNames.forEach((imageFileName) => {
    const newStyleAttr = updateCssUrlValue(versionId, imageFileName, oldStyleAttr)

    if (newStyleAttr !== oldStyleAttr) {
      elm.setAttribute('style', newStyleAttr)
      setHmrAttr(elm, versionId)
    }
  })
}

const hmrUpdateStyleElementUrl = (styleElm: HTMLStyleElement, versionId: string, imageFileNames: string[]): void => {
  imageFileNames.forEach((imageFileName) => {
    const oldCssText = styleElm.innerHTML
    const newCssText = updateCssUrlValue(versionId, imageFileName, oldCssText)
    if (newCssText !== oldCssText) {
      styleElm.innerHTML = newCssText
      setHmrAttr(styleElm, versionId)
    }
  })
}

const hmrUpdateLinkElementUrl = (linkElm: HTMLLinkElement, versionId: string, imageFileNames: string[]): void => {
  linkElm.href = setQueryString(linkElm.href, 's-hmr-urls', imageFileNames.sort().join(','))
  linkElm.href = setHmrQueryString(linkElm.href, versionId)
  linkElm.setAttribute('data-hmr', versionId)
}

// =============================================================================
// HMR Window (main entry point)
// =============================================================================

interface HmrWindowData {
  window: Window
  hmr: HotModuleReplacement
}

export const hmrWindow = (data: HmrWindowData): HmrResults => {
  const results: HmrResults = {
    updatedComponents: [],
    updatedExternalStyles: [],
    updatedInlineStyles: [],
    updatedImages: [],
    versionId: '',
  }

  try {
    if (
      !data ||
      !data.window ||
      !data.window.document.documentElement ||
      !data.hmr ||
      typeof data.hmr.versionId !== 'string'
    ) {
      return results
    }

    const win = data.window
    const doc = win.document
    const hmr = data.hmr
    const documentElement = doc.documentElement
    const versionId = hmr.versionId
    results.versionId = versionId

    if (hmr.componentsUpdated) {
      results.updatedComponents = hmrComponents(documentElement, versionId, hmr.componentsUpdated)
    }

    if (hmr.inlineStylesUpdated) {
      results.updatedInlineStyles = hmrInlineStyles(documentElement, versionId, hmr.inlineStylesUpdated)
    }

    if (hmr.externalStylesUpdated) {
      results.updatedExternalStyles = hmrExternalStyles(documentElement, versionId, hmr.externalStylesUpdated)
    }

    if (hmr.imagesUpdated) {
      results.updatedImages = hmrImages(win, doc, versionId, hmr.imagesUpdated)
    }

    setHmrAttr(documentElement, versionId)
  } catch (e) {
    console.error(e)
  }

  return results
}
