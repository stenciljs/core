import { hmrComponents } from './component';
import { hmrImages } from './image';
import { setHmrAttr } from './utils';
import { hmrInlineStyles, hmrExternalStyles } from './style';

import type { HmrResults, HotModuleReplacement } from '../types';

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
    const versionId = hmr.versionId!
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
