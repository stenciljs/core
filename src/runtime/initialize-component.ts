import { BUILD } from '@app-data';
import { consoleError, loadModule, styles } from '@platform';
import { CMP_FLAGS, HOST_FLAGS } from '@utils';

import type * as d from '../declarations';
import { scopeCss } from '../utils/shadow-css';
import { computeMode } from './mode';
import { createTime, uniqueTime } from './profile';
import { proxyComponent } from './proxy-component';
import { PROXY_FLAGS } from './runtime-constants';
import { getScopeId, registerStyle } from './styles';
import { safeCall, scheduleUpdate } from './update-component';

/**
 * Initialize a Stencil component given a reference to its host element, its
 * runtime bookkeeping data structure, runtime metadata about the component,
 * and (optionally) an HMR version ID.
 *
 * @param elm a host element
 * @param hostRef the element's runtime bookkeeping object
 * @param cmpMeta runtime metadata for the Stencil component
 * @param hmrVersionId an (optional) HMR version ID
 */
export const initializeComponent = async (
  elm: d.HostElement,
  hostRef: d.HostRef,
  cmpMeta: d.ComponentRuntimeMeta,
  hmrVersionId?: string,
) => {
  let Cstr: d.ComponentConstructor | undefined;
  // initializeComponent
  if ((hostRef.$flags$ & HOST_FLAGS.hasInitializedComponent) === 0) {
    // Let the runtime know that the component has been initialized
    hostRef.$flags$ |= HOST_FLAGS.hasInitializedComponent;

    const bundleId = cmpMeta.$lazyBundleId$;
    if (BUILD.lazyLoad && bundleId) {
      // lazy loaded components
      // request the component's implementation to be
      // wired up with the host element
      const CstrImport = loadModule(cmpMeta, hostRef, hmrVersionId);
      if (CstrImport && 'then' in CstrImport) {
        // Await creates a micro-task avoid if possible
        const endLoad = uniqueTime(
          `st:load:${cmpMeta.$tagName$}:${hostRef.$modeName$}`,
          `[Stencil] Load module for <${cmpMeta.$tagName$}>`,
        );
        Cstr = await CstrImport;
        endLoad();
      } else {
        Cstr = CstrImport as d.ComponentConstructor | undefined;
      }
      if (!Cstr) {
        throw new Error(`Constructor for "${cmpMeta.$tagName$}#${hostRef.$modeName$}" was not found`);
      }
      if (BUILD.member && !Cstr.isProxied) {
        // we've never proxied this Constructor before
        // let's add the getters/setters to its prototype before
        // the first time we create an instance of the implementation
        if (BUILD.watchCallback) {
          cmpMeta.$watchers$ = Cstr.watchers;
        }
        proxyComponent(Cstr, cmpMeta, PROXY_FLAGS.proxyState);
        Cstr.isProxied = true;
      }

      const endNewInstance = createTime('createInstance', cmpMeta.$tagName$);
      // ok, time to construct the instance
      // but let's keep track of when we start and stop
      // so that the getters/setters don't incorrectly step on data
      if (BUILD.member) {
        hostRef.$flags$ |= HOST_FLAGS.isConstructingInstance;
      }
      // construct the lazy-loaded component implementation
      // passing the hostRef is very important during
      // construction in order to directly wire together the
      // host element and the lazy-loaded instance
      try {
        new (Cstr as any)(hostRef);
      } catch (e) {
        consoleError(e, elm);
      }

      if (BUILD.member) {
        hostRef.$flags$ &= ~HOST_FLAGS.isConstructingInstance;
      }
      if (BUILD.watchCallback) {
        hostRef.$flags$ |= HOST_FLAGS.isWatchReady;
      }
      endNewInstance();
      fireConnectedCallback(hostRef.$lazyInstance$, elm);
    } else {
      // sync constructor component
      Cstr = elm.constructor as any;

      /**
       * Instead of using e.g. `cmpMeta.$tagName$` we use `elm.localName` to get the tag name of the component.
       * This is because we can't guarantee that the component class is actually registered with the tag name
       * defined in the component class as users can very well also do this:
       *
       * ```html
       * <script type="module">
       *   import { MyComponent } from 'my-stencil-component-library';
       *   customElements.define('my-other-component', MyComponent);
       * </script>
       * ```
       */
      const cmpTag = elm.localName;

      // wait for the CustomElementRegistry to mark the component as ready before setting `isWatchReady`. Otherwise,
      // watchers may fire prematurely if `customElements.get()`/`customElements.whenDefined()` resolves _before_
      // Stencil has completed instantiating the component.
      customElements.whenDefined(cmpTag).then(() => (hostRef.$flags$ |= HOST_FLAGS.isWatchReady));
    }

    if (BUILD.style && Cstr && Cstr.style) {
      /**
       * this component has styles but we haven't registered them yet
       */
      let style: string | undefined;

      if (typeof Cstr.style === 'string') {
        /**
         * in case the component has a `styleUrl` defined, e.g.
         * ```ts
         * @Component({
         *   tag: 'my-component',
         *   styleUrl: 'my-component.css'
         * })
         * ```
         */
        style = Cstr.style;
      } else if (BUILD.mode && typeof Cstr.style !== 'string') {
        /**
         * in case the component has a `styleUrl` object defined, e.g.
         * ```ts
         * @Component({
         *   tag: 'my-component',
         *   styleUrl: {
         *     ios: 'my-component.ios.css',
         *     md: 'my-component.md.css'
         *   }
         * })
         * ```
         */
        hostRef.$modeName$ = computeMode(elm) as string | undefined;
        if (hostRef.$modeName$) {
          style = Cstr.style[hostRef.$modeName$];
        }

        if (BUILD.hydrateServerSide && hostRef.$modeName$) {
          elm.setAttribute('s-mode', hostRef.$modeName$);
        }
      }
      const scopeId = getScopeId(cmpMeta, hostRef.$modeName$);
      if (!styles.has(scopeId)) {
        const endRegisterStyles = createTime('registerStyles', cmpMeta.$tagName$);

        if (BUILD.hydrateServerSide && BUILD.shadowDom && cmpMeta.$flags$ & CMP_FLAGS.shadowNeedsScopedCss) {
          style = scopeCss(style, scopeId, true);
        }
        registerStyle(scopeId, style, !!(cmpMeta.$flags$ & CMP_FLAGS.shadowDomEncapsulation));
        endRegisterStyles();
      }
    }
  }

  // we've successfully created a lazy instance
  const ancestorComponent = hostRef.$ancestorComponent$;
  const schedule = () => scheduleUpdate(hostRef, true);

  if (BUILD.asyncLoading && ancestorComponent && ancestorComponent['s-rc']) {
    // this is the initial load and this component it has an ancestor component
    // but the ancestor component has NOT fired its will update lifecycle yet
    // so let's just cool our jets and wait for the ancestor to continue first

    // this will get fired off when the ancestor component
    // finally gets around to rendering its lazy self
    // fire off the initial update
    ancestorComponent['s-rc'].push(schedule);
  } else {
    schedule();
  }
};

export const fireConnectedCallback = (instance: any, elm?: HTMLElement) => {
  if (BUILD.lazyLoad) {
    safeCall(instance, 'connectedCallback', undefined, elm);
  }
};
