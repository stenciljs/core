import { globalScripts } from '@app-globals';
import { addHostEventListeners, getHostRef, loadModule, plt, registerHost } from '@platform';
import { connectedCallback, insertVdomAnnotations } from '@runtime';
import { CMP_FLAGS } from '@utils';

import type * as d from '../../declarations';
import { proxyHostElement } from './proxy-host-element';

export function hydrateApp(
  win: Window & typeof globalThis,
  opts: d.HydrateFactoryOptions,
  results: d.HydrateResults,
  afterHydrate: (
    win: Window,
    opts: d.HydrateFactoryOptions,
    results: d.HydrateResults,
    resolve: (results: d.HydrateResults) => void,
  ) => void,
  resolve: (results: d.HydrateResults) => void,
) {
  const connectedElements = new Set<any>();
  const createdElements = new Set<HTMLElement>();
  const waitingElements = new Set<HTMLElement>();
  const orgDocumentCreateElement = win.document.createElement;
  const orgDocumentCreateElementNS = win.document.createElementNS;
  const resolved = Promise.resolve();

  let tmrId: any;
  let ranCompleted = false;

  function hydratedComplete() {
    globalThis.clearTimeout(tmrId);
    createdElements.clear();
    connectedElements.clear();

    if (!ranCompleted) {
      ranCompleted = true;
      try {
        if (opts.clientHydrateAnnotations) {
          insertVdomAnnotations(win.document, opts.staticComponents);
        }

        win.dispatchEvent(new win.Event('DOMContentLoaded'));

        win.document.createElement = orgDocumentCreateElement;
        win.document.createElementNS = orgDocumentCreateElementNS;
      } catch (e) {
        renderCatchError(opts, results, e);
      }
    }

    afterHydrate(win, opts, results, resolve);
  }

  function hydratedError(err: any) {
    renderCatchError(opts, results, err);
    hydratedComplete();
  }

  function timeoutExceeded() {
    hydratedError(`Hydrate exceeded timeout${waitingOnElementsMsg(waitingElements)}`);
  }

  try {
    function patchedConnectedCallback(this: d.HostElement) {
      return connectElement(this);
    }

    function patchElement(elm: d.HostElement) {
      if (isValidComponent(elm, opts)) {
        // this element is a valid component

        const hostRef = getHostRef(elm);
        if (!hostRef) {
          // we haven't registered this component's host element yet

          // get the component's constructor
          const Cstr = loadModule(
            {
              $tagName$: elm.nodeName.toLowerCase(),
              $flags$: null,
            },
            null,
          ) as d.ComponentConstructor;

          if (Cstr != null && Cstr.cmpMeta != null) {
            // we found valid component metadata

            if (
              opts.serializeShadowRoot !== false &&
              !!(Cstr.cmpMeta.$flags$ & CMP_FLAGS.shadowDomEncapsulation) &&
              tagRequiresScoped(elm.tagName, opts.serializeShadowRoot)
            ) {
              // this component requires scoped css encapsulation during SSR
              const cmpMeta = Cstr.cmpMeta;
              cmpMeta.$flags$ |= CMP_FLAGS.shadowNeedsScopedCss;

              // 'cmpMeta' is a getter only, so needs redefining
              Object.defineProperty(Cstr as any, 'cmpMeta', {
                get: function (this: any) {
                  return cmpMeta;
                },
              });
            }

            createdElements.add(elm);
            elm.connectedCallback = patchedConnectedCallback;

            // register the host element
            registerHost(elm, Cstr.cmpMeta);

            // proxy the host element with the component's metadata
            proxyHostElement(elm, Cstr);
          }
        }
      }
    }

    function patchChild(elm: any) {
      if (elm != null && elm.nodeType === 1) {
        patchElement(elm);
        const children = elm.children;
        for (let i = 0, ii = children.length; i < ii; i++) {
          patchChild(children[i]);
        }
      }
    }

    function connectElement(elm: HTMLElement) {
      createdElements.delete(elm);

      if (isValidComponent(elm, opts) && results.hydratedCount < opts.maxHydrateCount) {
        // this is a valid component to hydrate
        // and we haven't hit our max hydrated count yet

        if (!connectedElements.has(elm) && shouldHydrate(elm)) {
          // we haven't connected this component yet
          // and all of its ancestor elements are valid too

          // add it to our Set so we know it's already being connected
          connectedElements.add(elm);
          return hydrateComponent.call(elm, win, results, elm.nodeName, elm, waitingElements);
        }
      }

      return resolved;
    }

    function waitLoop(): Promise<void> {
      const toConnect = Array.from(createdElements).filter((elm) => elm.parentElement);
      if (toConnect.length > 0) {
        return Promise.all(toConnect.map(connectElement)).then(waitLoop);
      }
      return resolved;
    }

    win.document.createElement = function patchedCreateElement(tagName: string) {
      const elm = orgDocumentCreateElement.call(win.document, tagName);
      patchElement(elm);
      return elm;
    };

    win.document.createElementNS = function patchedCreateElement(namespaceURI: string, tagName: string) {
      const elm = orgDocumentCreateElementNS.call(win.document, namespaceURI, tagName);
      patchElement(elm as d.HostElement);
      return elm;
    } as (typeof window)['document']['createElementNS'];

    // ensure we use NodeJS's native setTimeout, not the mocked hydrate app scoped one
    tmrId = globalThis.setTimeout(timeoutExceeded, opts.timeout);

    plt.$resourcesUrl$ = new URL(opts.resourcesUrl || './', win.document.baseURI).href;

    globalScripts();

    patchChild(win.document.body);

    waitLoop().then(hydratedComplete).catch(hydratedError);
  } catch (e) {
    hydratedError(e);
  }
}

async function hydrateComponent(
  this: HTMLElement,
  win: Window & typeof globalThis,
  results: d.HydrateResults,
  tagName: string,
  elm: d.HostElement,
  waitingElements: Set<HTMLElement>,
) {
  tagName = tagName.toLowerCase();
  const Cstr = loadModule(
    {
      $tagName$: tagName,
      $flags$: null,
    },
    null,
  ) as d.ComponentConstructor;

  if (Cstr != null) {
    const cmpMeta = Cstr.cmpMeta;

    if (cmpMeta != null) {
      waitingElements.add(elm);
      const hostRef = getHostRef(this);
      addHostEventListeners(this, hostRef, cmpMeta.$listeners$, false);

      try {
        connectedCallback(elm);
        await elm.componentOnReady();

        results.hydratedCount++;

        const ref = getHostRef(elm);
        const modeName = !ref.$modeName$ ? '$' : ref.$modeName$;
        if (!results.components.some((c) => c.tag === tagName && c.mode === modeName)) {
          results.components.push({
            tag: tagName,
            mode: modeName,
            count: 0,
            depth: -1,
          });
        }
      } catch (e) {
        win.console.error(e);
      }
      waitingElements.delete(elm);
    }
  }
}

function isValidComponent(elm: Element, opts: d.HydrateFactoryOptions) {
  if (elm != null && elm.nodeType === 1) {
    // playing it safe and not using elm.tagName or elm.localName on purpose
    const tagName = elm.nodeName;
    if (typeof tagName === 'string' && tagName.includes('-')) {
      if (opts.excludeComponents.includes(tagName.toLowerCase())) {
        // this tagName we DO NOT want to hydrate
        return false;
      }
      // all good, this is a valid component
      return true;
    }
  }
  return false;
}

function shouldHydrate(elm: Element): boolean {
  if (elm.nodeType === 9) {
    return true;
  }
  if (NO_HYDRATE_TAGS.has(elm.nodeName)) {
    return false;
  }
  if (elm.hasAttribute('no-prerender')) {
    return false;
  }
  const parentNode = elm.parentNode;
  if (parentNode == null) {
    return true;
  }

  return shouldHydrate(parentNode as Element);
}

const NO_HYDRATE_TAGS = new Set([
  'CODE',
  'HEAD',
  'IFRAME',
  'INPUT',
  'OBJECT',
  'OUTPUT',
  'NOSCRIPT',
  'PRE',
  'SCRIPT',
  'SELECT',
  'STYLE',
  'TEMPLATE',
  'TEXTAREA',
]);

function renderCatchError(opts: d.HydrateFactoryOptions, results: d.HydrateResults, err: any) {
  const diagnostic: d.Diagnostic = {
    level: 'error',
    type: 'build',
    header: 'Hydrate Error',
    messageText: '',
    relFilePath: undefined,
    absFilePath: undefined,
    lines: [],
  };

  if (opts.url) {
    try {
      const u = new URL(opts.url);
      if (u.pathname !== '/') {
        diagnostic.header += ': ' + u.pathname;
      }
    } catch (e) {}
  }

  if (err != null) {
    if (err.stack != null) {
      diagnostic.messageText = err.stack.toString();
    } else if (err.message != null) {
      diagnostic.messageText = err.message.toString();
    } else {
      diagnostic.messageText = err.toString();
    }
  }

  results.diagnostics.push(diagnostic);
}

function printTag(elm: HTMLElement) {
  let tag = `<${elm.nodeName.toLowerCase()}`;
  if (Array.isArray(elm.attributes)) {
    for (let i = 0; i < elm.attributes.length; i++) {
      const attr = elm.attributes[i];
      tag += ` ${attr.name}`;
      if (attr.value !== '') {
        tag += `="${attr.value}"`;
      }
    }
  }
  tag += `>`;
  return tag;
}

function waitingOnElementMsg(waitingElement: HTMLElement) {
  let msg = '';
  if (waitingElement) {
    const lines = [];

    msg = ' - waiting on:';
    let elm = waitingElement;
    while (elm && elm.nodeType !== 9 && elm.nodeName !== 'BODY') {
      lines.unshift(printTag(elm));
      elm = elm.parentElement;
    }

    let indent = '';
    for (const ln of lines) {
      indent += '  ';
      msg += `\n${indent}${ln}`;
    }
  }
  return msg;
}

function waitingOnElementsMsg(waitingElements: Set<HTMLElement>) {
  return Array.from(waitingElements).map(waitingOnElementMsg);
}

/**
 * Determines if the tag requires a declarative shadow dom
 * or a scoped / light dom during SSR.
 *
 * @param tagName - component tag name
 * @param opts - serializeShadowRoot options
 * @returns `true` when the tag requires a scoped / light dom during SSR
 */
export function tagRequiresScoped(tagName: string, opts: d.HydrateFactoryOptions['serializeShadowRoot']) {
  if (typeof opts === 'string') {
    return opts === 'scoped';
  }

  if (typeof opts === 'boolean') {
    return opts === true ? false : true;
  }

  if (typeof opts === 'object') {
    tagName = tagName.toLowerCase();

    if (Array.isArray(opts['declarative-shadow-dom']) && opts['declarative-shadow-dom'].includes(tagName)) {
      // if the tag is in the dsd array, return dsd
      return false;
    } else if (
      (!Array.isArray(opts.scoped) || !opts.scoped.includes(tagName)) &&
      opts.default === 'declarative-shadow-dom'
    ) {
      // if the tag is not in the scoped array and the default is dsd, return dsd
      return false;
    } else {
      // otherwise, return scoped
      return true;
    }
  }

  return false;
}
