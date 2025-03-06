import { BUILD, NAMESPACE } from '@app-data';
import { consoleDevInfo, H, promiseResolve, win } from '@platform';

import type * as d from '../declarations';

export const patchBrowser = (): Promise<d.CustomElementsDefineOptions> => {
  // NOTE!! This fn cannot use async/await!
  if (BUILD.isDev && !BUILD.isTesting) {
    consoleDevInfo('Running in development mode.');
  }

  if (BUILD.cloneNodeFix) {
    // opted-in to polyfill cloneNode() for slot polyfilled components
    patchCloneNodeFix((H as any).prototype);
  }

  const scriptElm = BUILD.scriptDataOpts
    ? win.document &&
      Array.from(win.document.querySelectorAll('script')).find(
        (s) =>
          new RegExp(`\/${NAMESPACE}(\\.esm)?\\.js($|\\?|#)`).test(s.src) ||
          s.getAttribute('data-stencil-namespace') === NAMESPACE,
      )
    : null;
  const importMeta = import.meta.url;
  const opts = BUILD.scriptDataOpts ? ((scriptElm as any) || {})['data-opts'] || {} : {};

  if (importMeta !== '') {
    opts.resourcesUrl = new URL('.', importMeta).href;
  }

  return promiseResolve(opts);
};

const patchCloneNodeFix = (HTMLElementPrototype: any) => {
  const nativeCloneNodeFn = HTMLElementPrototype.cloneNode;

  HTMLElementPrototype.cloneNode = function (this: Node, deep: boolean) {
    if (this.nodeName === 'TEMPLATE') {
      return nativeCloneNodeFn.call(this, deep);
    }
    const clonedNode = nativeCloneNodeFn.call(this, false);
    const srcChildNodes = this.childNodes;
    if (deep) {
      for (let i = 0; i < srcChildNodes.length; i++) {
        // Node.ATTRIBUTE_NODE === 2, and checking because IE11
        if (srcChildNodes[i].nodeType !== 2) {
          clonedNode.appendChild(srcChildNodes[i].cloneNode(true));
        }
      }
    }
    return clonedNode;
  };
};
