export const HYDRATE_APP_CLOSURE_START = `/*hydrateAppClosure start*/`;

export const MODE_RESOLVER_DECLARATION = `modeResolver = [];`;

/**
 * This is the entry point for the ssr factory.
 *
 * __Note:__ the `modeResolver` will be uncommented in the
 * `src/compiler/output-targets/dist-hydrate-script/write-hydrate-outputs.ts` file. This enables us to use
 * one mode resolver across hydrate and core runtime.
 */
export const SSR_FACTORY_INTRO = /* js */ `
//! let ${MODE_RESOLVER_DECLARATION}

// Capture native at module scope (before globalThis can be shadowed inside the factory).

// Used for the hydrate timeout timer to avoid being affected by constrainTimeouts.
var $nativeSetTimeout = (typeof globalThis !== 'undefined' ? globalThis : global).setTimeout;
var $nativeClearTimeout = (typeof globalThis !== 'undefined' ? globalThis : global).clearTimeout;
// Holds the \`ssrProp()\` registry, which template code writes to outside the factory.
var $stencilNativeGlobal = typeof globalThis !== 'undefined' ? globalThis : global;
// Used to abort in-flight fetch() calls and to call any user defined AbortControllers when ssr times out.
var $stencilNativeAbortController = AbortController;

// Evaluated SSR platforms, per window and per serializeShadowRoot mode. Evaluating the platform
// (runtime, vdom and every component class) is the main fixed cost of a render, so a window that's
// rendered into again (see the \`reuseWindow\` option) reuses it. A new window gets a new platform.
var $stencilSsrApps = new WeakMap();

export function ssrFactory($stencilWindow, $stencilHydrateOpts, $stencilHydrateResults, $stencilAfterHydrate, $stencilHydrateResolve) {
  // Rendering shadow components as scoped permanently changes their metadata inside the platform,
  // so a platform is only shared by renders whose serializeShadowRoot marks the same components as
  // scoped: keyed by the canonical key the renderer computes for it.
  var $stencilShadowModeKey = $stencilHydrateOpts.serializeShadowRootKey;
  var $stencilApp;
  if (typeof $stencilShadowModeKey !== 'string') {
    $stencilApp = $stencilCreateSsrApp($stencilWindow);
  } else {
    var $stencilWindowApps = $stencilSsrApps.get($stencilWindow);
    if (!$stencilWindowApps) {
      $stencilWindowApps = new Map();
      $stencilSsrApps.set($stencilWindow, $stencilWindowApps);
    }
    $stencilApp = $stencilWindowApps.get($stencilShadowModeKey);
    if (!$stencilApp) {
      $stencilApp = $stencilCreateSsrApp($stencilWindow);
      $stencilWindowApps.set($stencilShadowModeKey, $stencilApp);
    }
  }
  $stencilApp($stencilHydrateOpts, $stencilHydrateResults, $stencilAfterHydrate, $stencilHydrateResolve);
}

/**
 * Evaluates the SSR platform for a window, and returns a function that renders with it.
 * Renders using the same platform must run one at a time.
 */
function $stencilCreateSsrApp($stencilWindow) {
  var globalThis = $stencilWindow;
  var self = $stencilWindow;
  var top = $stencilWindow;
  var parent = $stencilWindow;

  var addEventListener = $stencilWindow.addEventListener.bind($stencilWindow);
  var alert = $stencilWindow.alert.bind($stencilWindow);
  var blur = $stencilWindow.blur.bind($stencilWindow);
  var cancelAnimationFrame = $stencilWindow.cancelAnimationFrame.bind($stencilWindow);
  var cancelIdleCallback = $stencilWindow.cancelIdleCallback.bind($stencilWindow);
  var clearInterval = $stencilWindow.clearInterval.bind($stencilWindow);
  var clearTimeout = $stencilWindow.clearTimeout.bind($stencilWindow);
  var close = () => {};
  var confirm = $stencilWindow.confirm.bind($stencilWindow);
  var dispatchEvent = $stencilWindow.dispatchEvent.bind($stencilWindow);
  var focus = $stencilWindow.focus.bind($stencilWindow);
  var getComputedStyle = $stencilWindow.getComputedStyle.bind($stencilWindow);
  var matchMedia = $stencilWindow.matchMedia.bind($stencilWindow);
  var open = $stencilWindow.open.bind($stencilWindow);
  var prompt = $stencilWindow.prompt.bind($stencilWindow);
  var removeEventListener = $stencilWindow.removeEventListener.bind($stencilWindow);
  var requestAnimationFrame = $stencilWindow.requestAnimationFrame.bind($stencilWindow);
  var requestIdleCallback = $stencilWindow.requestIdleCallback.bind($stencilWindow);
  var setInterval = $stencilWindow.setInterval.bind($stencilWindow);
  var setTimeout = $stencilWindow.setTimeout.bind($stencilWindow);

  var CharacterData = $stencilWindow.CharacterData;
  var CSS = $stencilWindow.CSS;
  var CustomEvent = $stencilWindow.CustomEvent;
  var CSSStyleSheet = $stencilWindow.CSSStyleSheet;
  var Document = $stencilWindow.Document;
  var ShadowRoot = $stencilWindow.ShadowRoot;
  var DocumentFragment = $stencilWindow.DocumentFragment;
  var DocumentType = $stencilWindow.DocumentType;
  var DOMTokenList = $stencilWindow.DOMTokenList;
  var Element = $stencilWindow.Element;
  var Event = $stencilWindow.Event;
  var HTMLAnchorElement = $stencilWindow.HTMLAnchorElement;
  var HTMLBaseElement = $stencilWindow.HTMLBaseElement;
  var HTMLButtonElement = $stencilWindow.HTMLButtonElement;
  var HTMLCanvasElement = $stencilWindow.HTMLCanvasElement;
  var HTMLElement = $stencilWindow.HTMLElement;
  var HTMLFormElement = $stencilWindow.HTMLFormElement;
  var HTMLImageElement = $stencilWindow.HTMLImageElement;
  var HTMLInputElement = $stencilWindow.HTMLInputElement;
  var HTMLLinkElement = $stencilWindow.HTMLLinkElement;
  var HTMLMetaElement = $stencilWindow.HTMLMetaElement;
  var HTMLScriptElement = $stencilWindow.HTMLScriptElement;
  var HTMLStyleElement = $stencilWindow.HTMLStyleElement;
  var HTMLTemplateElement = $stencilWindow.HTMLTemplateElement;
  var HTMLTitleElement = $stencilWindow.HTMLTitleElement;
  var IntersectionObserver = $stencilWindow.IntersectionObserver;
  var ResizeObserver = $stencilWindow.ResizeObserver;
  var KeyboardEvent = $stencilWindow.KeyboardEvent;
  var MouseEvent = $stencilWindow.MouseEvent;
  var Node = $stencilWindow.Node;
  var NodeList = $stencilWindow.NodeList;
  var URL = $stencilWindow.URL;

  var console = $stencilWindow.console;
  var customElements = $stencilWindow.customElements;
  var history = $stencilWindow.history;
  var localStorage = $stencilWindow.localStorage;
  var location = $stencilWindow.location;
  var navigator = $stencilWindow.navigator;
  var performance = $stencilWindow.performance;
  var sessionStorage = $stencilWindow.sessionStorage;

  var devicePixelRatio = $stencilWindow.devicePixelRatio;
  var innerHeight = $stencilWindow.innerHeight;
  var innerWidth = $stencilWindow.innerWidth;
  var origin = $stencilWindow.origin;
  var pageXOffset = $stencilWindow.pageXOffset;
  var pageYOffset = $stencilWindow.pageYOffset;
  var screen = $stencilWindow.screen;
  var screenLeft = $stencilWindow.screenLeft;
  var screenTop = $stencilWindow.screenTop;
  var screenX = $stencilWindow.screenX;
  var screenY = $stencilWindow.screenY;
  var scrollX = $stencilWindow.scrollX;
  var scrollY = $stencilWindow.scrollY;
  var exports = {};

  var fetch, FetchError, Headers, Request, Response;

  // Aborted when the render times out or errors, so in-flight fetch() calls
  // made by component code stop holding the render's window/results alive
  // instead of running to completion against a torn-down window. See #6864.
  // A new one is created for every render (see the function returned below),
  // so one render's timeout never cancels the next render's work.
  var $stencilAbortController;

  // Any AbortController a component creates itself is transparently wired to
  // cascade-abort when the render times out too, so component code using the
  // standard AbortController convention for its own cancellable work (axios,
  // aws-sdk v3, the mongodb driver, etc.) gets cancelled automatically. 
  var AbortController = function () {
    var controller = new $stencilNativeAbortController();
    $stencilAbortController.signal.addEventListener(
      'abort',
      function () {
        controller.abort();
      },
      { once: true },
    );
    return controller;
  };

  function $stencilFetchSignal(callerSignal) {
    if (!callerSignal) {
      return $stencilAbortController.signal;
    }
    if (callerSignal.aborted || $stencilAbortController.signal.aborted) {
      return callerSignal.aborted ? callerSignal : $stencilAbortController.signal;
    }
    var merged = new $stencilNativeAbortController();
    var onAbort = function () { merged.abort(); };
    callerSignal.addEventListener('abort', onAbort, { once: true });
    $stencilAbortController.signal.addEventListener('abort', onAbort, { once: true });
    return merged.signal;
  }

  if (typeof $stencilWindow.fetch === 'function') {
    var $stencilRawFetch = $stencilWindow.fetch;
    fetch = $stencilWindow.fetch = function(input, init) {
      return $stencilRawFetch(input, Object.assign({}, init, { signal: $stencilFetchSignal(init && init.signal) }));
    };
  } else {
    fetch = $stencilWindow.fetch = function() { throw new Error('fetch() is not implemented'); };
  }

  if (typeof $stencilWindow.FetchError === 'function') {
    FetchError = $stencilWindow.FetchError;
  } else {
    FetchError = $stencilWindow.FetchError = class FetchError { constructor() { throw new Error('FetchError is not implemented'); } };
  }

  if (typeof $stencilWindow.Headers === 'function') {
    Headers = $stencilWindow.Headers;
  } else {
    Headers = $stencilWindow.Headers = class Headers { constructor() { throw new Error('Headers is not implemented'); } };
  }

  if (typeof $stencilWindow.Request === 'function') {
    Request = $stencilWindow.Request;
  } else {
    Request = $stencilWindow.Request = class Request { constructor() { throw new Error('Request is not implemented'); } };
  }

  if (typeof $stencilWindow.Response === 'function') {
    Response = $stencilWindow.Response;
  } else {
    Response = $stencilWindow.Response = class Response { constructor() { throw new Error('Response is not implemented'); } };
  }

  function hydrateAppClosure($stencilWindow) {
    const window = $stencilWindow;
    const document = $stencilWindow.document;
    ${HYDRATE_APP_CLOSURE_START}
`;

export const SSR_FACTORY_OUTRO = /* js */ `
    /*hydrateAppClosure end*/
    return function ($stencilHydrateOpts, $stencilHydrateResults, $stencilAfterHydrate, $stencilHydrateResolve) {
      $stencilAbortController = new $stencilNativeAbortController();
      // a reused window is reset between renders, which removes these; put them back
      $stencilWindow.fetch = fetch;
      $stencilWindow.FetchError = FetchError;
      $stencilWindow.Headers = Headers;
      $stencilWindow.Request = Request;
      $stencilWindow.Response = Response;
      ssrApp(window, $stencilHydrateOpts, $stencilHydrateResults, $stencilAfterHydrate, $stencilHydrateResolve, $stencilAbortController);
    };
  }

  return hydrateAppClosure($stencilWindow);
}
`;
