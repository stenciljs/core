/**
 * @stencil/dev-server Client
 *
 * Browser-side HMR (Hot Module Replacement) client for Stencil dev server.
 * Handles WebSocket communication, component updates, style updates, and image updates.
 *
 * This module runs in the browser and is injected into pages during development.
 */

// =============================================================================
// Types
// =============================================================================

interface DevClientWindow extends Window {
  's-dev-server'?: boolean
  's-initial-load'?: boolean
  's-build-id'?: number
  devServerConfig?: DevClientConfig
  WebSocket: typeof WebSocket
}

interface DevClientConfig {
  basePath: string
  editors: DevServerEditor[]
  reloadStrategy: 'hmr' | 'pageReload' | null
  socketUrl?: string
}

interface DevServerEditor {
  id: string
  name?: string
}

interface DevServerMessage {
  buildResults?: CompilerBuildResults
  buildLog?: BuildLog
  isActivelyBuilding?: boolean
  requestBuildResults?: boolean
}

interface BuildLog {
  buildId: number
  messages: string[]
  progress: number
}

interface CompilerBuildResults {
  buildId: number
  hasError: boolean
  diagnostics: Diagnostic[]
  hmr?: HotModuleReplacement
  hydrateAppFilePath?: string
  hasSuccessfulBuild?: boolean
}

interface Diagnostic {
  level: 'error' | 'warn' | 'info' | 'log' | 'debug'
  type: string
  messageText: string
  header?: string
  relFilePath?: string
  lineNumber?: number
  columnNumber?: number
  lines: unknown[]
}

interface HotModuleReplacement {
  versionId: string
  componentsUpdated?: string[]
  inlineStylesUpdated?: HmrStyleUpdate[]
  externalStylesUpdated?: string[]
  imagesUpdated?: string[]
  reloadStrategy?: 'hmr' | 'pageReload'
  indexHtmlUpdated?: boolean
  serviceWorkerUpdated?: boolean
  scriptsAdded?: string[]
  scriptsDeleted?: string[]
  excludeHmr?: string[]
}

interface HmrStyleUpdate {
  styleId: string
  styleTag: string
  styleText: string
}

interface HostElement extends Element {
  's-hmr'?: (versionId: string) => void
}

interface OpenInEditorData {
  file?: string
  line?: number
  column?: number
  editor?: string
}

// =============================================================================
// Constants
// =============================================================================

const DEV_SERVER_URL = '/~dev-server'
const DEV_SERVER_INIT_URL = `${DEV_SERVER_URL}-init`
const OPEN_IN_EDITOR_URL = `${DEV_SERVER_URL}-open-in-editor`

const BUILD_LOG = 'devserver:buildlog'
const BUILD_RESULTS = 'devserver:buildresults'
const BUILD_STATUS = 'devserver:buildstatus'

const NODE_TYPE_ELEMENT = 1
const NODE_TYPE_DOCUMENT_FRAGMENT = 11

// =============================================================================
// Event System
// =============================================================================

const emitBuildLog = (win: Window, buildLog: BuildLog): void => {
  win.dispatchEvent(new CustomEvent(BUILD_LOG, { detail: buildLog }))
}

const emitBuildResults = (win: Window, buildResults: CompilerBuildResults): void => {
  win.dispatchEvent(new CustomEvent(BUILD_RESULTS, { detail: buildResults }))
}

const emitBuildStatus = (win: Window, buildStatus: string): void => {
  win.dispatchEvent(new CustomEvent(BUILD_STATUS, { detail: buildStatus }))
}

const onBuildLog = (win: Window, cb: (buildLog: BuildLog) => void): void => {
  win.addEventListener(BUILD_LOG, ((ev: CustomEvent<BuildLog>) => {
    cb(ev.detail)
  }) as EventListener)
}

const onBuildResults = (win: Window, cb: (buildResults: CompilerBuildResults) => void): void => {
  win.addEventListener(BUILD_RESULTS, ((ev: CustomEvent<CompilerBuildResults>) => {
    cb(ev.detail)
  }) as EventListener)
}

const onBuildStatus = (win: Window, cb: (buildStatus: string) => void): void => {
  win.addEventListener(BUILD_STATUS, ((ev: CustomEvent<string>) => {
    cb(ev.detail)
  }) as EventListener)
}

// =============================================================================
// Logger
// =============================================================================

const YELLOW = '#f39c12'
const RED = '#c0392b'
const BLUE = '#3498db'
const GRAY = '#717171'

const log = (color: string, prefix: string, msg: string): void => {
  console.log(
    '%c' + prefix,
    `background: ${color}; color: white; padding: 2px 3px; border-radius: 2px; font-size: 0.8em;`,
    msg
  )
}

const logBuild = (msg: string): void => log(BLUE, 'Build', msg)
const logReload = (msg: string): void => logWarn('Reload', msg)
const logWarn = (prefix: string, msg: string): void => log(YELLOW, prefix, msg)
const logDisabled = (prefix: string, msg: string): void => log(GRAY, prefix, msg)

const logDiagnostic = (diag: Diagnostic): void => {
  let color = RED
  let prefix = 'Error'

  if (diag.level === 'warn') {
    color = YELLOW
    prefix = 'Warning'
  }

  if (diag.header) {
    prefix = diag.header
  }

  let msg = ''

  if (diag.relFilePath) {
    msg += diag.relFilePath

    if (typeof diag.lineNumber === 'number' && diag.lineNumber > 0) {
      msg += ', line ' + diag.lineNumber

      if (typeof diag.columnNumber === 'number' && diag.columnNumber > 0) {
        msg += ', column ' + diag.columnNumber
      }
    }
    msg += '\n'
  }

  msg += diag.messageText

  log(color, prefix, msg)
}

// =============================================================================
// HMR Utilities
// =============================================================================

const getHmrHref = (versionId: string, fileName: string, testUrl: string): string => {
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

const setQueryString = (url: string, qsKey: string, qsValue: string): string => {
  const urlSplt = url.split('?')
  const urlPath = urlSplt[0]
  const qs = parseQuerystring(urlSplt[1])
  qs[qsKey] = qsValue
  return urlPath + '?' + stringifyQuerystring(qs)
}

const setHmrQueryString = (url: string, versionId: string): string =>
  setQueryString(url, 's-hmr', versionId)

const updateCssUrlValue = (versionId: string, fileName: string, oldCss: string): string => {
  const reg = /url\((['"]?)(.*)\1\)/gi
  let result
  let newCss = oldCss

  while ((result = reg.exec(oldCss)) !== null) {
    const url = result[2]
    newCss = newCss.replace(url, getHmrHref(versionId, fileName, url))
  }

  return newCss
}

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
// HMR Window
// =============================================================================

interface HmrWindowData {
  window: Window
  hmr: HotModuleReplacement
}

interface HmrResults {
  updatedComponents: string[]
  updatedExternalStyles: string[]
  updatedInlineStyles: string[]
  updatedImages: string[]
  versionId: string
}

const hmrWindow = (data: HmrWindowData): HmrResults => {
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

// =============================================================================
// Build Status (Favicon)
// =============================================================================

const ICON_DEFAULT =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAMAAABlApw1AAAAnFBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4jUzeAAAAM3RSTlMAsGDs4wML8QEbBvr2FMhAM7+ILCUPnNzXrX04otO6j3RiT0ggzLSTcmtWUUWoZlknghZc2mZzAAACrklEQVR42u3dWXLiUAyFYWEwg40x8wxhSIAwJtH+99ZVeeinfriXVpWk5Hyr+C2VrgkAAAAAAAAAAAw5sZQ7aUhYypw07FjKC2ko2yxk2SQFgwYLOWSkYFhlIZ06KWhNWMhqRApGKxYyaZGCeoeFVIekIDuwkEaXFDSXLKRdkoYjS9mRhjlLSUjDO0s5kYYzS+mThn3OQsYqAbQQC7hZSgoGYgHUy0jBa42FvKkEUDERC6CCFIzeWEjtlRRkPbGAG5CCtCIWQAtS0ByzkHxPGvos5UEaNizlnTRsWconhbM4wTpSFHMTrFtKCroNFrLGBOsJLbGAWxWkoFiJBRAmWE/I1r4nWOmNheTeJ1gX0vDJUrYUweAEa04aHs5XePvc9wpPboJ1SCmOsRVkr04aromUEQEAgB9lxaZ++ATFpNDv6Y8qm1QdBk9QTAr9ni6mbFK7DJ6g2LQLXoHZlFCQdMY2nYJXYDb1g1dgNo2boSswm2Zp6ArMptCFyIVtCl2IlDmbNC0QcPEQcD8l4HLvAXdxHnBb5wG3QcDFQ8D9mIDrIeCiIeDiA25oNeA+EHDREHDxAbdmmxBwT0HARQbciW0KDbiEbQoNuB3bFBxwbTYJAfcUBFxkwFG/YlNJAADgxzCRcqUY9m7KGgNSUEx9H3XXO76Puv/OY5wedX/flHk+6j46v2maO79purPvm6Yz+75puua+b5q6Dd/PEsrNMyZfFM5gAMW+ymPtWciYV3ksBpBOwKUH3wHXXLKUM2l4cR5wG+cBlzgPuJ3zgJNb6FRwlP4Ln1X8wrOKeFbxP6Qz3wEn+KzilWLYe5UnMuDwY5BvD+cBt899B9zC+49Bqr4DrlXzHXDF1HfA1Tu+Ay5b+w649OY74OjoO+Bo7jzg7s4DDgAAAAAAAAAA/u0POrfnVIaqz/QAAAAASUVORK5CYII='
const ICON_PENDING =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAMAAABlApw1AAAAjVBMVEUAAAD8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjLn7xn3AAAALnRSTlMAsFBgAaDxfPpAdTMcD/fs47kDBhVXJQpvLNbInIiBRvSqIb+TZ2OOONxdzUxpgKSpAAAAA69JREFUeNrt3FtvskAQxvERFQXFioqnCkqth572+3+8947dN00TliF5ZpP53ZOAveg/OzCklFJKKaWUUkoppQTZm77cCGFo+jIhhG/TlwchJAvTk/GIAA6x6Um+JoDti+nJ644A5h+mJ8eMALKj6cnHnAB2r80NLJ4jf3Vz+cuWANZ5cwPTM/l7by6PZwQwGptGQf4q++dLCOHdNIbkb2IvjwjAvYEf8pe6j4/wYxopr/9SQih4BXa3l5eEcJ7a++c9/gkSQE8bcCWvXwcrAjjYADrxHv8KCbi3JasgD5fm8i9IAG1swMXzDv0X2wDaEED21dzA5UDeVoPm8uUbAayvvAI42YA7EIDzA5pv8lc6/UoAoxMv4CZuvyKUpnHn9VNBAG6B7XkBtCeEO6/AbvbyihAiXsB92svfCcA9wap4j19DAmgWs37AZCrnBKvu8vgX9AmWE3BZh/6L7QkWJIA2RxtwHQpml9sAQp9gXWbkbxz4CdYDfIK1qk1j3IV9fPgJFlNECJXhYfSfsBHkhBCKwEd452nYI7wncwQJP8GKTU+uO0I4D/uSkVJKqXAkA5nK9icoIi3nrU9QRHrZtj5BESmetT5BEantPCh7NTJFrUdgMg1bj8BkSv1HYJ8RmjMQKf1HYDdC+/R/IyQFzbD4AxH+CIyPPxCJoEdQ/IFIMgXNEPkDkd8jMLQs5wRcTXA1J+By/BGO+0ovYwQGU3kPRLJfIzCkCSfgpgmhpc5AxD/gIkLb8wKO0DTgoNyaGQQecNfQAy7TgGtHA04DLtyA24UecHngAVdrwIkJuAitU8DJ1Dbghkam9gEnU+uAWxiRjhsdoXagI1TPgKNyIBO+ZpRSSrW3HfblTAA9/juPDwTAfiMK9VG3PY/hwX7Ubc9j+AoCWNWGp+NSH4HflE2IgXUEGPI3TTfmN4ndv2kSsRUJvpUn4W1FShbYb5rc84ySAtzKs3W3IgW4lWfO24q0zsFbebIjaysSjbtt5RHzUf0DHHCrAW8gVYEDzl0LGYW4lefB24uYQgOOfwN7dMANeW/k3DkBJ2CrUNE54GRsFYIHnPNR+iPEgHPWKo5DDDhnrWKeBRhwzlrFeNtlq5CgtYqzAAPODaBzgAH331rFAAOOqsDXKjL3IqboN7ILJ4BCDDh3r3SIAfd0AijEgHP3So/8wQNuvjRBbxVij5A6Bpy8EZJnwIkbIfkFnLwRkm/ASRshXbwDTtYICRRwt7BHqEoppZRSSimllFLqD/8AOXJZHefotiIAAAAASUVORK5CYII='
const ICON_ERROR =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAMAAABlApw1AAAAkFBMVEUAAAD5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0HYvLBZAAAAL3RSTlMAsGDjA/rsC/ElHRUBBssz9pFCvoh0UEcsD9ec3K19OLiiaNLEYlmoVeiCbmE+GuMl4I8AAAKQSURBVHja7d1njupQDIZhAimEUIZQQu9taN7/7q50pfl/TmTJtvQ9q3hzLDsEAAAAAAAAAACGzFjKiTS0WcqONMxZypg0fH5YyLFPChZdFnIYkILil4VcclLw3bCQ85IULM8sZPMlBfmFhfwWpGBwYCHdESnoH1nIz4c0jFnKnDTsWEqbNJxYyow03FjKlDTUKQtZqwTQXizgtgkpWGQsZKIScL0OCxmqBFC5EQugkhQshyyk0yMFgwkLyRakIGmJBdCeFPTXLCStScOUpdwogsEXrBdpuLKUJ4XDC9afKmUh94QUjLy/YGViAZRTOIMBtypJQXn2HUC5WMBleMFqILmzkLSicBZfsB6k4clSrqTh5XyEd3MeQHXqe4Qn94LVSiicwRHkJScNdVvKkgAAwI+qZdM0/AXFpE4v+AXFpKwIfkExKfR7ulyxSWkV/IJi0zx4BGbTm4IkW7ZpFjwCs2kaPAKzad0PHYHZtE1CR2A2TQahIzCbhnnwCMykVYmAi4aAQ8BZ4T3grgi4BhBwCDgbEHCNIOAQcCYg4BpCwCHgLEDAaYgPuDfbhIBrBAGHgDMhNOBo2rKpIgAA8KNoS6kplq2dsu6CFJQr30vd+dD3Uvf/nTLHS93J3flZwrHznaad852mE/veaXqw752mKvW90zTq+j5LWGS+r/J8xQKoU1AUa2chm1zlsXQWUifgkoPvgOsffQccjZ0H3Mx5wL2dB9zcecB9sJTePOBM3cU+46wiziq6C7hk6zvg3J9VfDK7vir0ch5wN+cBV6e+A27v/ccgme+AkxshTXKKYW6EFH0X29gIKTLgzI2QYgPO2ggpLuDsvaDEBZy9EVJcwBkcIT0IAAAAAAAAAADs+AdjeyF69/r87QAAAABJRU5ErkJggg=='
const ICON_DISABLED =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAMAAABlApw1AAAAeFBMVEUAAAC4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7/uGGySAAAAJ3RSTlMAsGAE7OMcAQvxJRX69kHWyL8zq5GIdEcsD5zcfVg4uKLNa1JPZoK/xdPIAAACiklEQVR42u3dW5KqUAyF4QgCCggqIt7t9pb5z/Ccvjz2w95UqpJ0r28Uf2WTQAAAAAAAAAAAYMiWpTxJQ8JSTqThwVI2pKFZsJC3ghTs5izkmpKCcspCljNSkB9ZSLsnBfuWhRxzUjBbspBpSQrSKwuZr0lB8cZCFg1p2LCUB2k4sZSENNxYypY0nFlKTxqGmoUcClJwEQu4SUoKdmIBtEpJQZ6xkHeVAKqOYgFUkYL9OwvJclKQrsQCbkcK0olYAF1IQXFgIfVAGnqWcqZwFidYN4phb4L1onCYYMlPsLqUFKwxwRozwTIYcG1FCqrWdwBhgqU7wUo7FlJ7n2DdScPL+RPezfkT3tl5AA217yc89xMssYBbzUjDkEjZEwAA+NFMbOrDJygmZXnwBMWkaRk8QTFpvg6eoJi0aIInKDY9gp/AbEqCJyg2bYOfwGzqKUzPNh2K0Ccwm0IfRBK2KfSLkDvbFPog0tRsUlsh4EZAwP2SgKu9B9wdATcOAg4BZwACbgQEHALOCATcCAg4BJwVCLhREHB/LOAebFNwwC3YJATcKAi4yICjfmJTQwAA4EeZSBkojrWdsvmO4hjbKYtd6ra2Uxa71G1tp0xnqbvo+IPfpe4Nf3K703Ridr3T9OQPfnea7szseaepqX3vNH3NM/xe5fmeZ7i9yiMXQFlJEeydhYy4ymMygCICzmQAxQactbOQMQFnMoBiAs7iVaHIgDN3VSgq4AxeFYoOOGNXhbCUPkaJs4o4q/iXzyp2vgPO/VnFl/OAu/F/jq8KnZ0H3FD7DriL9x+DTH0HXJ75Driq9R1ws6XvgEuvvgOu6HwHHG18BxydnAfc03nAAQAAAAAAAADAz/4BoL2Us9XM2zMAAAAASUVORK5CYII='
const ICON_TYPE = 'image/x-icon'

const initBuildStatus = (data: { window: Window }): void => {
  const win = data.window
  const doc = win.document
  const iconElms = getFavIcons(doc)

  iconElms.forEach((iconElm) => {
    if (iconElm.href) {
      iconElm.dataset.href = iconElm.href
      iconElm.dataset.type = iconElm.type
    }
  })

  onBuildStatus(win, (buildStatus) => {
    updateBuildStatus(doc, buildStatus)
  })
}

const updateBuildStatus = (doc: Document, status: string): void => {
  const iconElms = getFavIcons(doc)
  iconElms.forEach((iconElm) => {
    updateFavIcon(iconElm, status)
  })
}

const updateFavIcon = (linkElm: HTMLLinkElement, status: string): void => {
  if (status === 'pending') {
    linkElm.href = ICON_PENDING
    linkElm.type = ICON_TYPE
    linkElm.setAttribute('data-status', status)
  } else if (status === 'error') {
    linkElm.href = ICON_ERROR
    linkElm.type = ICON_TYPE
    linkElm.setAttribute('data-status', status)
  } else if (status === 'disabled') {
    linkElm.href = ICON_DISABLED
    linkElm.type = ICON_TYPE
    linkElm.setAttribute('data-status', status)
  } else {
    linkElm.removeAttribute('data-status')
    if (linkElm.dataset.href) {
      linkElm.href = linkElm.dataset.href
      linkElm.type = linkElm.dataset.type || ICON_TYPE
    } else {
      linkElm.href = ICON_DEFAULT
      linkElm.type = ICON_TYPE
    }
  }
}

const getFavIcons = (doc: Document): HTMLLinkElement[] => {
  const iconElms: HTMLLinkElement[] = []
  const linkElms = doc.querySelectorAll('link')

  for (let i = 0; i < linkElms.length; i++) {
    if (
      linkElms[i].href &&
      linkElms[i].rel &&
      (linkElms[i].rel.indexOf('shortcut') > -1 || linkElms[i].rel.indexOf('icon') > -1)
    ) {
      iconElms.push(linkElms[i])
    }
  }

  if (iconElms.length === 0) {
    const linkElm = doc.createElement('link')
    linkElm.rel = 'shortcut icon'
    doc.head.appendChild(linkElm)
    iconElms.push(linkElm)
  }

  return iconElms
}

// =============================================================================
// Build Progress
// =============================================================================

const initBuildProgress = (data: { window: Window }): void => {
  const win = data.window

  onBuildLog(win, (buildLog) => {
    if (buildLog.progress < 1) {
      // Could add progress bar UI here
    }
  })
}

// =============================================================================
// Error Modal (simplified)
// =============================================================================

interface AppErrorResult {
  diagnostics: Diagnostic[]
  status: string
}

const appError = (data: {
  window: Window
  buildResults: CompilerBuildResults
  openInEditor: ((data: OpenInEditorData) => void) | null
}): AppErrorResult => {
  const diagnostics = data.buildResults.diagnostics || []
  return {
    diagnostics,
    status: diagnostics.some((d) => d.level === 'error') ? 'error' : 'default',
  }
}

const clearAppErrorModal = (_data: { window: Window }): void => {
  // Clear error modal if present
}

// =============================================================================
// App Update Handler
// =============================================================================

const initAppUpdate = (win: DevClientWindow, config: DevClientConfig): void => {
  onBuildResults(win, (buildResults) => {
    appUpdate(win, config, buildResults)
  })
}

const appUpdate = (
  win: DevClientWindow,
  config: DevClientConfig,
  buildResults: CompilerBuildResults
): void => {
  try {
    if (buildResults.buildId === win['s-build-id']) {
      return
    }
    win['s-build-id'] = buildResults.buildId

    clearAppErrorModal({ window: win })

    if (buildResults.hasError) {
      const editorId = Array.isArray(config.editors) && config.editors.length > 0 ? config.editors[0].id : null
      const errorResults = appError({
        window: win,
        buildResults,
        openInEditor: editorId
          ? (data) => {
              const qs: OpenInEditorData = {
                file: data.file,
                line: data.line,
                column: data.column,
                editor: editorId,
              }
              const url = `${OPEN_IN_EDITOR_URL}?${Object.keys(qs)
                .map((k) => `${k}=${(qs as Record<string, unknown>)[k]}`)
                .join('&')}`
              win.fetch(url)
            }
          : null,
      })

      errorResults.diagnostics.forEach(logDiagnostic)
      emitBuildStatus(win, errorResults.status)
      return
    }

    if (win['s-initial-load']) {
      appReset(win, config, () => {
        logReload('Initial load')
        win.location.reload()
      })
      return
    }

    if (buildResults.hmr) {
      appHmr(win, buildResults.hmr)
    }
  } catch (e) {
    console.error(e)
  }
}

const appHmr = (win: Window, hmr: HotModuleReplacement): void => {
  let shouldWindowReload = false

  if (hmr.reloadStrategy === 'pageReload') {
    shouldWindowReload = true
  }

  if (hmr.indexHtmlUpdated) {
    logReload('Updated index.html')
    shouldWindowReload = true
  }

  if (hmr.serviceWorkerUpdated) {
    logReload('Updated Service Worker: sw.js')
    shouldWindowReload = true
  }

  if (hmr.scriptsAdded && hmr.scriptsAdded.length > 0) {
    logReload(`Added scripts: ${hmr.scriptsAdded.join(', ')}`)
    shouldWindowReload = true
  }

  if (hmr.scriptsDeleted && hmr.scriptsDeleted.length > 0) {
    logReload(`Deleted scripts: ${hmr.scriptsDeleted.join(', ')}`)
    shouldWindowReload = true
  }

  if (hmr.excludeHmr && hmr.excludeHmr.length > 0) {
    logReload(`Excluded From Hmr: ${hmr.excludeHmr.join(', ')}`)
    shouldWindowReload = true
  }

  if (shouldWindowReload) {
    win.location.reload()
    return
  }

  const results = hmrWindow({ window: win, hmr })

  if (results.updatedComponents.length > 0) {
    logBuild(
      `Updated component${results.updatedComponents.length > 1 ? 's' : ''}: ${results.updatedComponents.join(', ')}`
    )
  }

  if (results.updatedInlineStyles.length > 0) {
    logBuild(`Updated styles: ${results.updatedInlineStyles.join(', ')}`)
  }

  if (results.updatedExternalStyles.length > 0) {
    logBuild(`Updated stylesheets: ${results.updatedExternalStyles.join(', ')}`)
  }

  if (results.updatedImages.length > 0) {
    logBuild(`Updated images: ${results.updatedImages.join(', ')}`)
  }
}

const appReset = (win: DevClientWindow, config: DevClientConfig, cb: () => void): void => {
  win.history.replaceState({}, 'App', config.basePath)

  if (!win.navigator.serviceWorker?.getRegistration) {
    cb()
  } else {
    win.navigator.serviceWorker
      .getRegistration()
      .then((swRegistration) => {
        if (swRegistration) {
          swRegistration.unregister().then((hasUnregistered) => {
            if (hasUnregistered) {
              logBuild('unregistered service worker')
            }
            cb()
          })
        } else {
          cb()
        }
      })
      .catch((err) => {
        logWarn('Service Worker', err)
        cb()
      })
  }
}

// =============================================================================
// WebSocket Client
// =============================================================================

const RECONNECT_ATTEMPTS = 1000
const RECONNECT_RETRY_MS = 2500
const NORMAL_CLOSURE_CODE = 1000
const REQUEST_BUILD_RESULTS_INTERVAL_MS = 500

const initClientWebSocket = (win: DevClientWindow, config: DevClientConfig): void => {
  let clientWs: WebSocket | null = null
  let reconnectTmrId: ReturnType<typeof setTimeout> | null = null
  let reconnectAttempts = 0
  let requestBuildResultsTmrId: ReturnType<typeof setInterval> | null = null
  let hasGottenBuildResults = false
  let buildResultsRequests = 0

  function onOpen(this: WebSocket): void {
    if (reconnectAttempts > 0) {
      emitBuildStatus(win, 'pending')
    }

    if (!hasGottenBuildResults) {
      requestBuildResultsTmrId = setInterval(() => {
        buildResultsRequests++
        if (!hasGottenBuildResults && this.readyState === WebSocket.OPEN && buildResultsRequests < 500) {
          const msg: DevServerMessage = { requestBuildResults: true }
          this.send(JSON.stringify(msg))
        } else if (requestBuildResultsTmrId) {
          clearInterval(requestBuildResultsTmrId)
        }
      }, REQUEST_BUILD_RESULTS_INTERVAL_MS)
    }

    if (reconnectTmrId) {
      clearTimeout(reconnectTmrId)
    }
  }

  function onError(): void {
    queueReconnect()
  }

  function onClose(event: CloseEvent): void {
    emitBuildStatus(win, 'disabled')

    if (event.code > NORMAL_CLOSURE_CODE) {
      logWarn('Dev Server', `web socket closed: ${event.code} ${event.reason}`)
    } else {
      logDisabled('Dev Server', 'Disconnected, attempting to reconnect...')
    }

    queueReconnect()
  }

  function onMessage(event: MessageEvent): void {
    const msg: DevServerMessage = JSON.parse(event.data)

    if (reconnectAttempts > 0) {
      if (msg.isActivelyBuilding) {
        return
      }

      if (msg.buildResults) {
        logReload('Reconnected to dev server')
        hasGottenBuildResults = true
        buildResultsRequests = 0
        if (requestBuildResultsTmrId) {
          clearInterval(requestBuildResultsTmrId)
        }

        if (win['s-build-id'] !== msg.buildResults.buildId) {
          win.location.reload()
        }
        win['s-build-id'] = msg.buildResults.buildId
        return
      }
    }

    if (msg.buildLog) {
      if (msg.buildLog.progress < 1) {
        emitBuildStatus(win, 'pending')
      }
      emitBuildLog(win, msg.buildLog)
      return
    }

    if (msg.buildResults) {
      hasGottenBuildResults = true
      buildResultsRequests = 0
      if (requestBuildResultsTmrId) {
        clearInterval(requestBuildResultsTmrId)
      }
      emitBuildStatus(win, 'default')
      emitBuildResults(win, msg.buildResults)
    }
  }

  function connect(): void {
    if (reconnectTmrId) {
      clearTimeout(reconnectTmrId)
    }

    clientWs = new win.WebSocket(config.socketUrl!, ['xmpp'])

    clientWs.addEventListener('open', onOpen)
    clientWs.addEventListener('error', onError)
    clientWs.addEventListener('close', onClose)
    clientWs.addEventListener('message', onMessage)
  }

  function queueReconnect(): void {
    hasGottenBuildResults = false

    if (clientWs) {
      if (clientWs.readyState === WebSocket.OPEN || clientWs.readyState === WebSocket.CONNECTING) {
        clientWs.close(NORMAL_CLOSURE_CODE)
      }

      clientWs.removeEventListener('open', onOpen)
      clientWs.removeEventListener('error', onError)
      clientWs.removeEventListener('close', onClose)
      clientWs.removeEventListener('message', onMessage)
      clientWs = null
    }

    if (reconnectTmrId) {
      clearTimeout(reconnectTmrId)
    }

    if (reconnectAttempts >= RECONNECT_ATTEMPTS) {
      logWarn('Dev Server', 'Canceling reconnect attempts')
    } else {
      reconnectAttempts++
      reconnectTmrId = setTimeout(connect, RECONNECT_RETRY_MS)
      emitBuildStatus(win, 'disabled')
    }
  }

  connect()
}

// =============================================================================
// Initialize Dev Client
// =============================================================================

const initDevClient = (win: DevClientWindow, config: DevClientConfig): void => {
  try {
    if (win['s-dev-server']) {
      return
    }
    win['s-dev-server'] = true

    initBuildStatus({ window: win })
    initBuildProgress({ window: win })
    initAppUpdate(win, config)

    if (isInitialDevServerLoad(win, config)) {
      win['s-initial-load'] = true
      appReset(win, config, () => {
        initClientWebSocket(win, config)
      })
    } else {
      initClientWebSocket(win, config)
    }
  } catch (e) {
    console.error(e)
  }
}

const isInitialDevServerLoad = (win: DevClientWindow, config: DevClientConfig): boolean => {
  let pathname = win.location.pathname
  pathname = '/' + pathname.substring(config.basePath.length)
  return pathname === DEV_SERVER_INIT_URL
}

// =============================================================================
// Exports
// =============================================================================

export {
  initDevClient,
  hmrWindow,
  appError,
  clearAppErrorModal,
  emitBuildLog,
  emitBuildResults,
  emitBuildStatus,
  onBuildLog,
  onBuildResults,
  onBuildStatus,
  logBuild,
  logDiagnostic,
  logDisabled,
  logReload,
  logWarn,
  initBuildProgress,
  initBuildStatus,
}

// Auto-initialize if running in browser context with config
declare const appWindow: DevClientWindow | undefined
declare const config: DevClientConfig | undefined

if (typeof appWindow !== 'undefined' && typeof config !== 'undefined') {
  const defaultConfig: DevClientConfig = {
    basePath: appWindow.location.pathname,
    editors: [],
    reloadStrategy: 'hmr',
    socketUrl: `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.hostname}${
      location.port !== '' ? ':' + location.port : ''
    }/`,
  }

  initDevClient(appWindow, { ...defaultConfig, ...appWindow.devServerConfig, ...config })
}
