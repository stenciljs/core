import { getHmrHref, hasShadowRoot, isLinkStylesheet, isTemplate, setHmrAttr } from './hmr-util';

export const hmrExternalStyles = (elm: Element, versionId: string, cssFileNames: string[]) => {
  if (isLinkStylesheet(elm)) {
    cssFileNames.forEach((cssFileName) => {
      hmrStylesheetLink(elm as HTMLLinkElement, versionId, cssFileName);
    });
  }

  if (isTemplate(elm)) {
    hmrExternalStyles((elm as HTMLTemplateElement).content as any, versionId, cssFileNames);
  }

  if (hasShadowRoot(elm)) {
    hmrExternalStyles(elm.shadowRoot as any, versionId, cssFileNames);
  }

  if (elm.children) {
    for (let i = 0; i < elm.children.length; i++) {
      hmrExternalStyles(elm.children[i], versionId, cssFileNames);
    }
  }

  return cssFileNames.sort();
};

const hmrStylesheetLink = (styleSheetElm: HTMLLinkElement, versionId: string, cssFileName: string) => {
  const orgHref = styleSheetElm.getAttribute('href');
  const newHref = getHmrHref(versionId, cssFileName, styleSheetElm.href);
  if (newHref !== orgHref) {
    styleSheetElm.setAttribute('href', newHref);
    setHmrAttr(styleSheetElm, versionId);
  }
};
