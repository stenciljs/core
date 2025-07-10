import { BUILD, NAMESPACE } from '@app-data';
import { Build, consoleError, getHostRef, nextTick, plt, win, writeTask } from '@platform';
import { CMP_FLAGS, HOST_FLAGS } from '@utils';

import type * as d from '../declarations';
import { emitEvent } from './event-emitter';
import { createTime } from './profile';
import { PLATFORM_FLAGS } from './runtime-constants';
import { attachStyles } from './styles';
import { renderVdom } from './vdom/vdom-render';

export const attachToAncestor = (hostRef: d.HostRef, ancestorComponent?: d.HostElement) => {
  if (BUILD.asyncLoading && ancestorComponent && !hostRef.$onRenderResolve$ && ancestorComponent['s-p']) {
    const index = ancestorComponent['s-p'].push(
      new Promise(
        (r) =>
          (hostRef.$onRenderResolve$ = () => {
            ancestorComponent['s-p'].splice(index - 1, 1);
            r();
          }),
      ),
    );
  }
};

export const scheduleUpdate = (hostRef: d.HostRef, isInitialLoad: boolean) => {
  if (BUILD.taskQueue && BUILD.updatable) {
    hostRef.$flags$ |= HOST_FLAGS.isQueuedForUpdate;
  }
  if (BUILD.asyncLoading && hostRef.$flags$ & HOST_FLAGS.isWaitingForChildren) {
    hostRef.$flags$ |= HOST_FLAGS.needsRerender;
    return;
  }
  attachToAncestor(hostRef, hostRef.$ancestorComponent$);

  // there is no ancestor component or the ancestor component
  // has already fired off its lifecycle update then
  // fire off the initial update
  const dispatch = () => dispatchHooks(hostRef, isInitialLoad);
  return BUILD.taskQueue ? writeTask(dispatch) : dispatch();
};

/**
 * Dispatch initial-render and update lifecycle hooks, enqueuing calls to
 * component lifecycle methods like `componentWillLoad` as well as
 * {@link updateComponent}, which will kick off the virtual DOM re-render.
 *
 * @param hostRef a reference to a host DOM node
 * @param isInitialLoad whether we're on the initial load or not
 * @returns an empty Promise which is used to enqueue a series of operations for
 * the component
 */
const dispatchHooks = (hostRef: d.HostRef, isInitialLoad: boolean): Promise<void> => {
  const elm = hostRef.$hostElement$;
  const endSchedule = createTime('scheduleUpdate', hostRef.$cmpMeta$.$tagName$);
  const instance = BUILD.lazyLoad ? hostRef.$lazyInstance$ : elm;

  /**
   * Given a user imports a component compiled with a `dist-custom-element`
   * output target into a Stencil project compiled with a `dist` output target,
   * then `instance` will be `undefined` as `hostRef` won't have a `lazyInstance`
   * property. In this case, the component will fail to render in one of the
   * subsequent functions.
   *
   * For this scenario to work the user needs to set the `externalRuntime` flag
   * for the `dist-custom-element` component that is being imported into the `dist`
   * Stencil project.
   */
  if (!instance) {
    throw new Error(
      `Can't render component <${elm.tagName.toLowerCase()} /> with invalid Stencil runtime! ` +
        'Make sure this imported component is compiled with a `externalRuntime: true` flag. ' +
        'For more information, please refer to https://stenciljs.com/docs/custom-elements#externalruntime',
    );
  }

  // We're going to use this variable together with `enqueue` to implement a
  // little promise-based queue. We start out with it `undefined`. When we add
  // the first function to the queue we'll set this variable to be that
  // function's return value. When we attempt to add subsequent values to the
  // queue we'll check that value and, if it was a `Promise`, we'll then chain
  // the new function off of that `Promise` using `.then()`. This will give our
  // queue two nice properties:
  //
  // 1. If all functions added to the queue are synchronous they'll be called
  //    synchronously right away.
  // 2. If all functions added to the queue are asynchronous they'll all be
  //    called in order after `dispatchHooks` exits.
  let maybePromise: Promise<void> | undefined;

  if (isInitialLoad) {
    if (BUILD.lazyLoad && BUILD.hostListener) {
      hostRef.$flags$ |= HOST_FLAGS.isListenReady;
      if (hostRef.$queuedListeners$) {
        hostRef.$queuedListeners$.map(([methodName, event]) => safeCall(instance, methodName, event, elm));
        hostRef.$queuedListeners$ = undefined;
      }
    }
    emitLifecycleEvent(elm, 'componentWillLoad');
    // If `componentWillLoad` returns a `Promise` then we want to wait on
    // whatever's going on in that `Promise` before we launch into
    // rendering the component, doing other lifecycle stuff, etc. So
    // in that case we assign the returned promise to the variable we
    // declared above to hold a possible 'queueing' Promise
    maybePromise = safeCall(instance, 'componentWillLoad', undefined, elm);
  } else {
    emitLifecycleEvent(elm, 'componentWillUpdate');

    // Like `componentWillLoad` above, we allow Stencil component
    // authors to return a `Promise` from this lifecycle callback, and
    // we specify that our runtime will wait for that `Promise` to
    // resolve before the component re-renders. So if the method
    // returns a `Promise` we need to keep it around!
    maybePromise = safeCall(instance, 'componentWillUpdate', undefined, elm);
  }

  emitLifecycleEvent(elm, 'componentWillRender');
  maybePromise = enqueue(maybePromise, () => safeCall(instance, 'componentWillRender', undefined, elm));

  endSchedule();

  return enqueue(maybePromise, () => updateComponent(hostRef, instance, isInitialLoad));
};

/**
 * This function uses a Promise to implement a simple first-in, first-out queue
 * of functions to be called.
 *
 * The queue is ordered on the basis of the first argument. If it's
 * `undefined`, then nothing is on the queue yet, so the provided function can
 * be called synchronously (although note that this function may return a
 * `Promise`). The idea is that then the return value of that enqueueing
 * operation is kept around, so that if it was a `Promise` then subsequent
 * functions can be enqueued by calling this function again with that `Promise`
 * as the first argument.
 *
 * @param maybePromise either a `Promise` which should resolve before the next function is called or an 'empty' sentinel
 * @param fn a function to enqueue
 * @returns either a `Promise` or the return value of the provided function
 */
const enqueue = (maybePromise: Promise<void> | undefined, fn: () => Promise<void>): Promise<void> | undefined =>
  isPromisey(maybePromise)
    ? maybePromise.then(fn).catch((err) => {
        console.error(err);
        fn();
      })
    : fn();

/**
 * Check that a value is a `Promise`. To check, we first see if the value is an
 * instance of the `Promise` global. In a few circumstances, in particular if
 * the global has been overwritten, this is could be misleading, so we also do
 * a little 'duck typing' check to see if the `.then` property of the value is
 * defined and a function.
 *
 * @param maybePromise it might be a promise!
 * @returns whether it is or not
 */
const isPromisey = (maybePromise: Promise<void> | unknown): maybePromise is Promise<void> =>
  maybePromise instanceof Promise ||
  (maybePromise && (maybePromise as any).then && typeof (maybePromise as Promise<void>).then === 'function');

/**
 * Update a component given reference to its host elements and so on.
 *
 * @param hostRef an object containing references to the element's host node,
 * VDom nodes, and other metadata
 * @param instance a reference to the underlying host element where it will be
 * rendered
 * @param isInitialLoad whether or not this function is being called as part of
 * the first render cycle
 */
const updateComponent = async (
  hostRef: d.HostRef,
  instance: d.HostElement | d.ComponentInterface,
  isInitialLoad: boolean,
) => {
  const elm = hostRef.$hostElement$ as d.RenderNode;
  const endUpdate = createTime('update', hostRef.$cmpMeta$.$tagName$);
  const rc = elm['s-rc'];
  if (BUILD.style && isInitialLoad) {
    // DOM WRITE!
    attachStyles(hostRef);
  }

  const endRender = createTime('render', hostRef.$cmpMeta$.$tagName$);
  if (BUILD.isDev) {
    hostRef.$flags$ |= HOST_FLAGS.devOnRender;
  }

  if (BUILD.hydrateServerSide) {
    await callRender(hostRef, instance, elm, isInitialLoad);
  } else {
    callRender(hostRef, instance, elm, isInitialLoad);
  }

  if (BUILD.isDev) {
    hostRef.$renderCount$ = hostRef.$renderCount$ === undefined ? 1 : hostRef.$renderCount$ + 1;
    hostRef.$flags$ &= ~HOST_FLAGS.devOnRender;
  }

  if (BUILD.hydrateServerSide) {
    try {
      // manually connected child components during server-side hydrate
      serverSideConnected(elm);

      if (isInitialLoad) {
        // using only during server-side hydrate
        if (hostRef.$cmpMeta$.$flags$ & CMP_FLAGS.shadowDomEncapsulation) {
          elm['s-en'] = '';
        } else if (hostRef.$cmpMeta$.$flags$ & CMP_FLAGS.scopedCssEncapsulation) {
          elm['s-en'] = 'c';
        }
      }
    } catch (e) {
      consoleError(e, elm);
    }
  }

  if (BUILD.asyncLoading && rc) {
    // ok, so turns out there are some child host elements
    // waiting on this parent element to load
    // let's fire off all update callbacks waiting
    rc.map((cb) => cb());
    elm['s-rc'] = undefined;
  }

  endRender();
  endUpdate();

  if (BUILD.asyncLoading) {
    const childrenPromises = elm['s-p'] ?? [];
    const postUpdate = () => postUpdateComponent(hostRef);
    if (childrenPromises.length === 0) {
      postUpdate();
    } else {
      Promise.all(childrenPromises).then(postUpdate);
      hostRef.$flags$ |= HOST_FLAGS.isWaitingForChildren;
      childrenPromises.length = 0;
    }
  } else {
    postUpdateComponent(hostRef);
  }
};

let renderingRef: any = null;

/**
 * Handle making the call to the VDom renderer with the proper context given
 * various build variables
 *
 * @param hostRef an object containing references to the element's host node,
 * VDom nodes, and other metadata
 * @param instance a reference to the underlying host element where it will be
 * rendered
 * @param elm the Host element for the component
 * @param isInitialLoad whether or not this function is being called as part of
 * @returns an empty promise
 */
const callRender = (hostRef: d.HostRef, instance: any, elm: HTMLElement, isInitialLoad: boolean) => {
  // in order for bundlers to correctly tree-shake the BUILD object
  // we need to ensure BUILD is not deoptimized within a try/catch
  // https://rollupjs.org/guide/en/#treeshake tryCatchDeoptimization
  const allRenderFn = BUILD.allRenderFn ? true : false;
  const lazyLoad = BUILD.lazyLoad ? true : false;
  const taskQueue = BUILD.taskQueue ? true : false;
  const updatable = BUILD.updatable ? true : false;

  try {
    renderingRef = instance;
    /**
     * minification optimization: `allRenderFn` is `true` if all components have a `render`
     * method, so we can call the method immediately. If not, check before calling it.
     */
    instance = allRenderFn ? instance.render() : instance.render && instance.render();

    if (updatable && taskQueue) {
      hostRef.$flags$ &= ~HOST_FLAGS.isQueuedForUpdate;
    }

    if (updatable || lazyLoad) {
      hostRef.$flags$ |= HOST_FLAGS.hasRendered;
    }
    if (BUILD.hasRenderFn || BUILD.reflect) {
      if (BUILD.vdomRender || BUILD.reflect) {
        // looks like we've got child nodes to render into this host element
        // or we need to update the css class/attrs on the host element
        // DOM WRITE!
        if (BUILD.hydrateServerSide) {
          return Promise.resolve(instance).then((value) => renderVdom(hostRef, value, isInitialLoad));
        } else {
          renderVdom(hostRef, instance, isInitialLoad);
        }
      } else {
        const shadowRoot = elm.shadowRoot;
        if (hostRef.$cmpMeta$.$flags$ & CMP_FLAGS.shadowDomEncapsulation) {
          shadowRoot.textContent = instance;
        } else {
          elm.textContent = instance;
        }
      }
    }
  } catch (e) {
    consoleError(e, hostRef.$hostElement$);
  }
  renderingRef = null;
  return null;
};

export const getRenderingRef = () => renderingRef;

export const postUpdateComponent = (hostRef: d.HostRef) => {
  const tagName = hostRef.$cmpMeta$.$tagName$;
  const elm = hostRef.$hostElement$;
  const endPostUpdate = createTime('postUpdate', tagName);
  const instance = BUILD.lazyLoad ? hostRef.$lazyInstance$ : (elm as any);
  const ancestorComponent = hostRef.$ancestorComponent$;

  if (BUILD.isDev) {
    hostRef.$flags$ |= HOST_FLAGS.devOnRender;
  }
  safeCall(instance, 'componentDidRender', undefined, elm);
  if (BUILD.isDev) {
    hostRef.$flags$ &= ~HOST_FLAGS.devOnRender;
  }
  emitLifecycleEvent(elm, 'componentDidRender');

  if (!(hostRef.$flags$ & HOST_FLAGS.hasLoadedComponent)) {
    hostRef.$flags$ |= HOST_FLAGS.hasLoadedComponent;

    if (BUILD.asyncLoading && BUILD.cssAnnotations) {
      // DOM WRITE!
      addHydratedFlag(elm);
    }

    if (BUILD.isDev) {
      hostRef.$flags$ |= HOST_FLAGS.devOnDidLoad;
    }
    safeCall(instance, 'componentDidLoad', undefined, elm);
    if (BUILD.isDev) {
      hostRef.$flags$ &= ~HOST_FLAGS.devOnDidLoad;
    }

    emitLifecycleEvent(elm, 'componentDidLoad');
    endPostUpdate();

    if (BUILD.asyncLoading) {
      hostRef.$onReadyResolve$(elm);
      if (!ancestorComponent) {
        appDidLoad(tagName);
      }
    }
  } else {
    // we've already loaded this component
    // fire off the user's componentDidUpdate method (if one was provided)
    // componentDidUpdate runs AFTER render() has been called
    // and all child components have finished updating
    if (BUILD.isDev) {
      hostRef.$flags$ |= HOST_FLAGS.devOnRender;
    }
    safeCall(instance, 'componentDidUpdate', undefined, elm);
    if (BUILD.isDev) {
      hostRef.$flags$ &= ~HOST_FLAGS.devOnRender;
    }
    emitLifecycleEvent(elm, 'componentDidUpdate');
    endPostUpdate();
  }

  if (BUILD.method && BUILD.lazyLoad) {
    hostRef.$onInstanceResolve$(elm);
  }
  // load events fire from bottom to top
  // the deepest elements load first then bubbles up
  if (BUILD.asyncLoading) {
    if (hostRef.$onRenderResolve$) {
      hostRef.$onRenderResolve$();
      hostRef.$onRenderResolve$ = undefined;
    }
    if (hostRef.$flags$ & HOST_FLAGS.needsRerender) {
      nextTick(() => scheduleUpdate(hostRef, false));
    }
    hostRef.$flags$ &= ~(HOST_FLAGS.isWaitingForChildren | HOST_FLAGS.needsRerender);
  }
  // ( •_•)
  // ( •_•)>⌐■-■
  // (⌐■_■)
};

export const forceUpdate = (ref: any) => {
  if (BUILD.updatable && (Build.isBrowser || Build.isTesting)) {
    const hostRef = getHostRef(ref);
    const isConnected = hostRef.$hostElement$.isConnected;
    if (
      isConnected &&
      (hostRef.$flags$ & (HOST_FLAGS.hasRendered | HOST_FLAGS.isQueuedForUpdate)) === HOST_FLAGS.hasRendered
    ) {
      scheduleUpdate(hostRef, false);
    }
    // Returns "true" when the forced update was successfully scheduled
    return isConnected;
  }
  return false;
};

export const appDidLoad = (who: string) => {
  if (BUILD.asyncQueue) {
    plt.$flags$ |= PLATFORM_FLAGS.appLoaded;
  }
  nextTick(() => emitEvent(win, 'appload', { detail: { namespace: NAMESPACE } }));

  if (BUILD.profile && performance.measure) {
    performance.measure(`[Stencil] ${NAMESPACE} initial load (by ${who})`, 'st:app:start');
  }
};

/**
 * Allows to safely call a method, e.g. `componentDidLoad`, on an instance,
 * e.g. custom element node. If a build figures out that e.g. no component
 * has a `componentDidLoad` method, the instance method gets removed from the
 * output bundle and this function returns `undefined`.
 * @param instance any object that may or may not contain methods
 * @param method method name
 * @param arg single arbitrary argument
 * @param elm the element which made the call
 * @returns result of method call if it exists, otherwise `undefined`
 */
export const safeCall = (instance: any, method: string, arg?: any, elm?: HTMLElement) => {
  if (instance && instance[method]) {
    try {
      return instance[method](arg);
    } catch (e) {
      consoleError(e, elm);
    }
  }
  return undefined;
};

/**
 * For debugging purposes as `BUILD.lifecycleDOMEvents` is `false` by default and will
 * get removed by the compiler. Used for timing events to see how long they take.
 * @param elm the target of the Event
 * @param lifecycleName name of the event
 */
const emitLifecycleEvent = (elm: EventTarget, lifecycleName: string) => {
  if (BUILD.lifecycleDOMEvents) {
    emitEvent(elm, 'stencil_' + lifecycleName, {
      bubbles: true,
      composed: true,
      detail: {
        namespace: NAMESPACE,
      },
    });
  }
};

/**
 * Set the hydrated flag on a DOM element
 *
 * @param elm a reference to a DOM element
 * @returns undefined
 */
const addHydratedFlag = (elm: Element) =>
  BUILD.hydratedClass
    ? elm.classList.add(BUILD.hydratedSelectorName ?? 'hydrated')
    : BUILD.hydratedAttribute
      ? elm.setAttribute(BUILD.hydratedSelectorName ?? 'hydrated', '')
      : undefined;

const serverSideConnected = (elm: any) => {
  const children = elm.children;
  if (children != null) {
    for (let i = 0, ii = children.length; i < ii; i++) {
      const childElm = children[i] as any;
      if (typeof childElm.connectedCallback === 'function') {
        childElm.connectedCallback();
      }
      serverSideConnected(childElm);
    }
  }
};
