import {
  getHmrHref,
  hasShadowRoot,
  isElement,
  isLinkStylesheet,
  isTemplate,
  setHmrAttr,
  setHmrQueryString,
  setQueryString,
  updateCssUrlValue,
} from './hmr-util';

export const hmrImages = (win: Window, doc: Document, versionId: string, imageFileNames: string[]) => {
  if (win.location.protocol !== 'file:' && doc.styleSheets) {
    hmrStyleSheetsImages(doc, versionId, imageFileNames);
  }

  hmrImagesElements(win, doc.documentElement, versionId, imageFileNames);

  return imageFileNames.sort();
};

const hmrStyleSheetsImages = (doc: Document, versionId: string, imageFileNames: string[]) => {
  const cssImageProps = Object.keys(doc.documentElement.style).filter((cssProp) => {
    return cssProp.endsWith('Image');
  });

  for (let i = 0; i < doc.styleSheets.length; i++) {
    hmrStyleSheetImages(cssImageProps, doc.styleSheets[i] as CSSStyleSheet, versionId, imageFileNames);
  }
};

const hmrStyleSheetImages = (
  cssImageProps: string[],
  styleSheet: CSSStyleSheet,
  versionId: string,
  imageFileNames: string[],
) => {
  try {
    const cssRules = styleSheet.cssRules;
    for (let i = 0; i < cssRules.length; i++) {
      const cssRule = cssRules[i];

      switch (cssRule.type) {
        case CSSRule.IMPORT_RULE:
          hmrStyleSheetImages(cssImageProps, (cssRule as CSSImportRule).styleSheet, versionId, imageFileNames);
          break;

        case CSSRule.STYLE_RULE:
          hmrStyleSheetRuleImages(cssImageProps, cssRule as CSSStyleRule, versionId, imageFileNames);
          break;

        case CSSRule.MEDIA_RULE:
          hmrStyleSheetImages(cssImageProps, cssRule as any, versionId, imageFileNames);
          break;
      }
    }
  } catch (e) {
    console.error('hmrStyleSheetImages: ' + e);
  }
};

const hmrStyleSheetRuleImages = (
  cssImageProps: string[],
  cssRule: CSSStyleRule,
  versionId: string,
  imageFileNames: string[],
) => {
  cssImageProps.forEach((cssImageProp) => {
    imageFileNames.forEach((imageFileName) => {
      const oldCssText = (cssRule as any).style[cssImageProp];
      const newCssText = updateCssUrlValue(versionId, imageFileName, oldCssText);

      if (oldCssText !== newCssText) {
        (cssRule as any).style[cssImageProp] = newCssText;
      }
    });
  });
};

const hmrImagesElements = (win: Window, elm: Element, versionId: string, imageFileNames: string[]) => {
  const tagName = elm.nodeName.toLowerCase();
  if (tagName === 'img') {
    hmrImgElement(elm as HTMLImageElement, versionId, imageFileNames);
  }

  if (isElement(elm)) {
    const styleAttr = elm.getAttribute('style');
    if (styleAttr) {
      hmrUpdateStyleAttr(elm, versionId, imageFileNames, styleAttr);
    }
  }

  if (tagName === 'style') {
    hmrUpdateStyleElementUrl(elm as HTMLStyleElement, versionId, imageFileNames);
  }

  if (win.location.protocol !== 'file:' && isLinkStylesheet(elm)) {
    hmrUpdateLinkElementUrl(elm as HTMLLinkElement, versionId, imageFileNames);
  }

  if (isTemplate(elm)) {
    hmrImagesElements(win, (elm as HTMLTemplateElement).content as any, versionId, imageFileNames);
  }

  if (hasShadowRoot(elm)) {
    hmrImagesElements(win, elm.shadowRoot as any, versionId, imageFileNames);
  }

  if (elm.children) {
    for (let i = 0; i < elm.children.length; i++) {
      hmrImagesElements(win, elm.children[i], versionId, imageFileNames);
    }
  }
};

const hmrImgElement = (imgElm: HTMLImageElement, versionId: string, imageFileNames: string[]) => {
  imageFileNames.forEach((imageFileName) => {
    const orgSrc = imgElm.getAttribute('src');
    const newSrc = getHmrHref(versionId, imageFileName, orgSrc);
    if (newSrc !== orgSrc) {
      imgElm.setAttribute('src', newSrc);
      setHmrAttr(imgElm, versionId);
    }
  });
};

const hmrUpdateStyleAttr = (elm: Element, versionId: string, imageFileNames: string[], oldStyleAttr: string) => {
  imageFileNames.forEach((imageFileName) => {
    const newStyleAttr = updateCssUrlValue(versionId, imageFileName, oldStyleAttr);

    if (newStyleAttr !== oldStyleAttr) {
      elm.setAttribute('style', newStyleAttr);
      setHmrAttr(elm, versionId);
    }
  });
};

const hmrUpdateStyleElementUrl = (styleElm: HTMLStyleElement, versionId: string, imageFileNames: string[]) => {
  imageFileNames.forEach((imageFileName) => {
    const oldCssText = styleElm.innerHTML;
    const newCssText = updateCssUrlValue(versionId, imageFileName, oldCssText);
    if (newCssText !== oldCssText) {
      styleElm.innerHTML = newCssText;
      setHmrAttr(styleElm, versionId);
    }
  });
};

const hmrUpdateLinkElementUrl = (linkElm: HTMLLinkElement, versionId: string, imageFileNames: string[]) => {
  linkElm.href = setQueryString(linkElm.href, 's-hmr-urls', imageFileNames.sort().join(','));
  linkElm.href = setHmrQueryString(linkElm.href, versionId);
  // TODO(STENCIL-958): determine if we need to set this attribute
  linkElm.setAttribute('data-hmr', versionId);
};
