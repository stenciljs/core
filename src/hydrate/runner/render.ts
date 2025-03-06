import { Readable } from 'node:stream';

import { hydrateFactory } from '@hydrate-factory';
import { modeResolutionChain, setMode } from '@platform';
import { MockWindow, serializeNodeToHtml } from '@stencil/core/mock-doc';
import { hasError } from '@utils';

import { updateCanonicalLink } from '../../compiler/html/canonical-link';
import { relocateMetaCharset } from '../../compiler/html/relocate-meta-charset';
import { removeUnusedStyles } from '../../compiler/html/remove-unused-styles';
import type {
  HydrateDocumentOptions,
  HydrateFactoryOptions,
  HydrateResults,
  SerializeDocumentOptions,
} from '../../declarations';
import { inspectElement } from './inspect-element';
import { patchDomImplementation } from './patch-dom-implementation';
import { generateHydrateResults, normalizeHydrateOptions, renderBuildError, renderCatchError } from './render-utils';
import { initializeWindow } from './window-initialize';

const NOOP = () => {};

export function streamToString(html: string | any, option?: SerializeDocumentOptions) {
  return renderToString(html, option, true);
}

export function renderToString(html: string | any, options?: SerializeDocumentOptions): Promise<HydrateResults>;
export function renderToString(
  html: string | any,
  options: SerializeDocumentOptions | undefined,
  asStream: true,
): Readable;
export function renderToString(
  html: string | any,
  options?: SerializeDocumentOptions,
  asStream?: boolean,
): Promise<HydrateResults> | Readable {
  const opts = normalizeHydrateOptions(options);
  /**
   * Makes the rendered DOM not being rendered to a string.
   */
  opts.serializeToHtml = true;
  /**
   * Set the flag whether or not we like to render into a declarative shadow root.
   */
  opts.fullDocument = typeof opts.fullDocument === 'boolean' ? opts.fullDocument : true;
  /**
   * Defines whether we render the shadow root as a declarative shadow root or as scoped shadow root.
   */
  opts.serializeShadowRoot =
    typeof opts.serializeShadowRoot === 'undefined' ? 'declarative-shadow-dom' : opts.serializeShadowRoot;
  /**
   * Make sure we wait for components to be hydrated.
   */
  opts.constrainTimeouts = false;

  return hydrateDocument(html, opts, asStream);
}

export function hydrateDocument(doc: any | string, options?: HydrateDocumentOptions): Promise<HydrateResults>;
export function hydrateDocument(
  doc: any | string,
  options: HydrateDocumentOptions | undefined,
  asStream?: boolean,
): Readable;
export function hydrateDocument(
  doc: any | string,
  options?: HydrateDocumentOptions,
  asStream?: boolean,
): Promise<HydrateResults> | Readable {
  const opts = normalizeHydrateOptions(options);

  let win: MockWindow | null = null;
  const results = generateHydrateResults(opts);

  if (hasError(results.diagnostics)) {
    return Promise.resolve(results);
  }

  if (typeof doc === 'string') {
    try {
      opts.destroyWindow = true;
      opts.destroyDocument = true;
      win = new MockWindow(doc);

      if (!asStream) {
        return render(win, opts, results).then(() => results);
      }

      return renderStream(win, opts, results);
    } catch (e) {
      if (win && win.close) {
        win.close();
      }
      win = null;
      renderCatchError(results, e);
      return Promise.resolve(results);
    }
  }

  if (isValidDocument(doc)) {
    try {
      opts.destroyDocument = false;
      win = patchDomImplementation(doc, opts);

      if (!asStream) {
        return render(win, opts, results).then(() => results);
      }

      return renderStream(win, opts, results);
    } catch (e) {
      if (win && win.close) {
        win.close();
      }
      win = null;
      renderCatchError(results, e);
      return Promise.resolve(results);
    }
  }

  renderBuildError(results, `Invalid html or document. Must be either a valid "html" string, or DOM "document".`);
  return Promise.resolve(results);
}

async function render(win: MockWindow, opts: HydrateFactoryOptions, results: HydrateResults) {
  if ('process' in globalThis && typeof process.on === 'function' && !(process as any).__stencilErrors) {
    (process as any).__stencilErrors = true;
    process.on('unhandledRejection', (e) => {
      console.log('unhandledRejection', e);
    });
  }

  initializeWindow(win, win.document, opts, results);
  const beforeHydrateFn = typeof opts.beforeHydrate === 'function' ? opts.beforeHydrate : NOOP;
  try {
    await Promise.resolve(beforeHydrateFn(win.document));
    return new Promise<HydrateResults>((resolve) => {
      if (Array.isArray(opts.modes)) {
        /**
         * Reset the mode resolution chain as we expect every `renderToString` call to render
         * the components in new environment/document.
         */
        modeResolutionChain.length = 0;
        opts.modes.forEach((mode) => setMode(mode));
      }
      return hydrateFactory(win, opts, results, afterHydrate, resolve);
    });
  } catch (e) {
    renderCatchError(results, e);
    return finalizeHydrate(win, win.document, opts, results);
  }
}

/**
 * Wrapper around `render` method to enable streaming by returning a Readable instead of a promise.
 * @param win MockDoc window object
 * @param opts serialization options
 * @param results render result object
 * @returns a Readable that can be passed into a response
 */
function renderStream(win: MockWindow, opts: HydrateFactoryOptions, results: HydrateResults) {
  async function* processRender() {
    const renderResult = await render(win, opts, results);
    yield renderResult.html;
  }

  return Readable.from(processRender());
}

async function afterHydrate(
  win: MockWindow,
  opts: HydrateFactoryOptions,
  results: HydrateResults,
  resolve: (results: HydrateResults) => void,
) {
  const afterHydrateFn = typeof opts.afterHydrate === 'function' ? opts.afterHydrate : NOOP;
  try {
    await Promise.resolve(afterHydrateFn(win.document));
    return resolve(finalizeHydrate(win, win.document, opts, results));
  } catch (e) {
    renderCatchError(results, e);
    return resolve(finalizeHydrate(win, win.document, opts, results));
  }
}

function finalizeHydrate(win: MockWindow, doc: Document, opts: HydrateFactoryOptions, results: HydrateResults) {
  try {
    inspectElement(results, doc.documentElement, 0);

    if (opts.removeUnusedStyles !== false) {
      try {
        removeUnusedStyles(doc, results.diagnostics);
      } catch (e) {
        renderCatchError(results, e);
      }
    }

    if (typeof opts.title === 'string') {
      try {
        doc.title = opts.title;
      } catch (e) {
        renderCatchError(results, e);
      }
    }

    results.title = doc.title;

    if (opts.removeScripts) {
      removeScripts(doc.documentElement);
    }

    try {
      updateCanonicalLink(doc, opts.canonicalUrl);
    } catch (e) {
      renderCatchError(results, e);
    }

    try {
      relocateMetaCharset(doc);
    } catch (e) {}

    if (!hasError(results.diagnostics)) {
      results.httpStatus = 200;
    }

    try {
      const metaStatus = doc.head.querySelector('meta[http-equiv="status"]');
      if (metaStatus != null) {
        const metaStatusContent = metaStatus.getAttribute('content');
        if (metaStatusContent && metaStatusContent.length > 0) {
          results.httpStatus = parseInt(metaStatusContent, 10);
        }
      }
    } catch (e) {}

    if (opts.clientHydrateAnnotations) {
      doc.documentElement.classList.add('hydrated');
    }

    if (opts.serializeToHtml) {
      results.html = serializeDocumentToString(doc, opts);
    }
  } catch (e) {
    renderCatchError(results, e);
  }

  destroyWindow(win, doc, opts, results);
  return results;
}

function destroyWindow(win: MockWindow, doc: Document, opts: HydrateFactoryOptions, results: HydrateResults) {
  if (!opts.destroyWindow) {
    return;
  }

  try {
    if (!opts.destroyDocument) {
      (win as any).document = null;
      (doc as any).defaultView = null;
    }

    if (win.close) {
      win.close();
    }
  } catch (e) {
    renderCatchError(results, e);
  }
}

export function serializeDocumentToString(doc: Document, opts: HydrateFactoryOptions) {
  return serializeNodeToHtml(doc, {
    approximateLineWidth: opts.approximateLineWidth,
    outerHtml: false,
    prettyHtml: opts.prettyHtml,
    removeAttributeQuotes: opts.removeAttributeQuotes,
    removeBooleanAttributeQuotes: opts.removeBooleanAttributeQuotes,
    removeEmptyAttributes: opts.removeEmptyAttributes,
    removeHtmlComments: opts.removeHtmlComments,
    serializeShadowRoot: opts.serializeShadowRoot,
    fullDocument: opts.fullDocument,
  });
}

function isValidDocument(doc: Document) {
  return (
    doc != null &&
    doc.nodeType === 9 &&
    doc.documentElement != null &&
    doc.documentElement.nodeType === 1 &&
    doc.body != null &&
    doc.body.nodeType === 1
  );
}

function removeScripts(elm: HTMLElement) {
  const children = elm.children;
  for (let i = children.length - 1; i >= 0; i--) {
    const child = children[i];
    removeScripts(child as any);

    if (child.nodeName === 'SCRIPT' || (child.nodeName === 'LINK' && child.getAttribute('rel') === 'modulepreload')) {
      child.remove();
    }
  }
}
