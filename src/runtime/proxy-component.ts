import { BUILD } from '@app-data';
import { consoleDevWarn, getHostRef, parsePropertyValue, plt } from '@platform';
import { CMP_FLAGS } from '@utils';

import type * as d from '../declarations';
import { HOST_FLAGS, MEMBER_FLAGS } from '../utils/constants';
import { FORM_ASSOCIATED_CUSTOM_ELEMENT_CALLBACKS, PROXY_FLAGS } from './runtime-constants';
import { getValue, setValue } from './set-value';

/**
 * Attach a series of runtime constructs to a compiled Stencil component
 * constructor, including getters and setters for the `@Prop` and `@State`
 * decorators, callbacks for when attributes change, and so on.
 *
 * On a lazy loaded component, this is wired up to both the class instance
 * and the element separately. A `hostRef` keeps the 2 in sync.
 *
 * On a traditional component, this is wired up to the element only.
 *
 * @param Cstr the constructor for a component that we need to process
 * @param cmpMeta metadata collected previously about the component
 * @param flags a number used to store a series of bit flags
 * @returns a reference to the same constructor passed in (but now mutated)
 */
export const proxyComponent = (
  Cstr: d.ComponentConstructor,
  cmpMeta: d.ComponentRuntimeMeta,
  flags: number,
): d.ComponentConstructor => {
  const prototype = (Cstr as any).prototype;

  if (BUILD.isTesting) {
    if (prototype.__stencilAugmented) {
      // @ts-expect-error - we don't want to re-augment the prototype. This happens during spec tests.
      return;
    }
    prototype.__stencilAugmented = true;
  }

  /**
   * proxy form associated custom element lifecycle callbacks
   * @ref https://web.dev/articles/more-capable-form-controls#lifecycle_callbacks
   */
  if (BUILD.formAssociated && cmpMeta.$flags$ & CMP_FLAGS.formAssociated && flags & PROXY_FLAGS.isElementConstructor) {
    FORM_ASSOCIATED_CUSTOM_ELEMENT_CALLBACKS.forEach((cbName) => {
      const originalFormAssociatedCallback = prototype[cbName];
      Object.defineProperty(prototype, cbName, {
        value(this: d.HostElement, ...args: any[]) {
          const hostRef = getHostRef(this);
          const instance: d.ComponentInterface = BUILD.lazyLoad ? hostRef.$lazyInstance$ : this;
          if (!instance) {
            hostRef.$onReadyPromise$.then((asyncInstance: d.ComponentInterface) => {
              const cb = asyncInstance[cbName];
              typeof cb === 'function' && cb.call(asyncInstance, ...args);
            });
          } else {
            // Use the method on `instance` if `lazyLoad` is set, otherwise call the original method to avoid an infinite loop.
            const cb = BUILD.lazyLoad ? instance[cbName] : originalFormAssociatedCallback;
            typeof cb === 'function' && cb.call(instance, ...args);
          }
        },
      });
    });
  }

  if ((BUILD.member && cmpMeta.$members$) || (BUILD.watchCallback && (cmpMeta.$watchers$ || Cstr.watchers))) {
    if (BUILD.watchCallback && Cstr.watchers && !cmpMeta.$watchers$) {
      cmpMeta.$watchers$ = Cstr.watchers;
    }
    // It's better to have a const than two Object.entries()
    const members = Object.entries(cmpMeta.$members$ ?? {});
    members.map(([memberName, [memberFlags]]) => {
      // is this member a `@Prop` or it's a `@State`
      // AND either native component-element or it's a lazy class instance
      if (
        (BUILD.prop || BUILD.state) &&
        (memberFlags & MEMBER_FLAGS.Prop ||
          ((!BUILD.lazyLoad || flags & PROXY_FLAGS.proxyState) && memberFlags & MEMBER_FLAGS.State))
      ) {
        // preserve any getters / setters that already exist on the prototype;
        // we'll call them via our new accessors. On a lazy component, this would only be called on the class instance.
        const { get: origGetter, set: origSetter } = Object.getOwnPropertyDescriptor(prototype, memberName) || {};
        if (origGetter) cmpMeta.$members$[memberName][0] |= MEMBER_FLAGS.Getter;
        if (origSetter) cmpMeta.$members$[memberName][0] |= MEMBER_FLAGS.Setter;

        if (flags & PROXY_FLAGS.isElementConstructor || !origGetter) {
          // if it's an Element (native or proxy)
          // OR it's a lazy class instance and doesn't have a getter
          Object.defineProperty(prototype, memberName, {
            get(this: d.RuntimeRef) {
              if (BUILD.lazyLoad) {
                if ((cmpMeta.$members$[memberName][0] & MEMBER_FLAGS.Getter) === 0) {
                  // no getter - let's return value now
                  return getValue(this, memberName);
                }
                const ref = getHostRef(this);
                const instance = ref ? ref.$lazyInstance$ : prototype;
                if (!instance) return;
                return instance[memberName];
              }
              if (!BUILD.lazyLoad) {
                return origGetter ? origGetter.apply(this) : getValue(this, memberName);
              }
            },
            configurable: true,
            enumerable: true,
          });
        }

        Object.defineProperty(prototype, memberName, {
          set(this: d.RuntimeRef, newValue) {
            const ref = getHostRef(this);

            // only during dev
            if (BUILD.isDev) {
              if (
                // we are proxying the instance (not element)
                (flags & PROXY_FLAGS.isElementConstructor) === 0 &&
                // if the class has a setter, then the Element can update instance values, so ignore
                (cmpMeta.$members$[memberName][0] & MEMBER_FLAGS.Setter) === 0 &&
                // the element is not constructing
                (ref && ref.$flags$ & HOST_FLAGS.isConstructingInstance) === 0 &&
                // the member is a prop
                (memberFlags & MEMBER_FLAGS.Prop) !== 0 &&
                // the member is not mutable
                (memberFlags & MEMBER_FLAGS.Mutable) === 0
              ) {
                consoleDevWarn(
                  `@Prop() "${memberName}" on <${cmpMeta.$tagName$}> is immutable but was modified from within the component.\nMore information: https://stenciljs.com/docs/properties#prop-mutability`,
                );
              }
            }

            if (origSetter) {
              // Lazy class instance or native component-element only:
              // we have an original setter, so we need to set our value via that.

              // do we have a value already?
              const currentValue =
                memberFlags & MEMBER_FLAGS.State
                  ? this[memberName as keyof d.RuntimeRef]
                  : ref.$hostElement$[memberName as keyof d.HostElement];

              if (typeof currentValue === 'undefined' && ref.$instanceValues$.get(memberName)) {
                // no host value but a value already set on the hostRef,
                // this means the setter was added at run-time (e.g. via a decorator).
                // We want any value set on the element to override the default class instance value.
                newValue = ref.$instanceValues$.get(memberName);
              } else if (!ref.$instanceValues$.get(memberName) && currentValue) {
                // on init get make sure the hostRef matches the element (via prop / attr)

                // the prop `set()` doesn't necessarily fire during `constructor()`,
                // so no initial value gets set in the hostRef.
                // This means watchers fire even though the value hasn't changed.
                // So if there's a current value and no initial value, let's set it now.
                ref.$instanceValues$.set(memberName, currentValue);
              }
              // this sets the value via the `set()` function which
              // *might* not end up changing the underlying value
              origSetter.apply(this, [parsePropertyValue(newValue, memberFlags)]);
              // if it's a State property, we need to get the value from the instance
              newValue =
                memberFlags & MEMBER_FLAGS.State
                  ? this[memberName as keyof d.RuntimeRef]
                  : ref.$hostElement$[memberName as keyof d.HostElement];
              setValue(this, memberName, newValue, cmpMeta);
              return;
            }

            if (!BUILD.lazyLoad) {
              // we can set the value directly now if it's a native component-element
              setValue(this, memberName, newValue, cmpMeta);
              return;
            }

            if (BUILD.lazyLoad) {
              // Lazy class instance OR proxy Element with no setter:
              // set the element value directly now
              if (
                (flags & PROXY_FLAGS.isElementConstructor) === 0 ||
                (cmpMeta.$members$[memberName][0] & MEMBER_FLAGS.Setter) === 0
              ) {
                setValue(this, memberName, newValue, cmpMeta);
                // if this is a value set on an Element *before* the instance has initialized (e.g. via an html attr)...
                if (flags & PROXY_FLAGS.isElementConstructor && !ref.$lazyInstance$) {
                  // wait for lazy instance...
                  ref.$onReadyPromise$.then(() => {
                    // check if this instance member has a setter doesn't match what's already on the element
                    if (
                      cmpMeta.$members$[memberName][0] & MEMBER_FLAGS.Setter &&
                      ref.$lazyInstance$[memberName] !== ref.$instanceValues$.get(memberName)
                    ) {
                      // this catches cases where there's a run-time only setter (e.g. via a decorator)
                      // *and* no initial value, so the initial setter never gets called
                      ref.$lazyInstance$[memberName] = newValue;
                    }
                  });
                }
                return;
              }

              // lazy element with a setter
              // we might need to wait for the lazy class instance to be ready
              // before we can set it's value via it's setter function
              const setterSetVal = () => {
                const currentValue = ref.$lazyInstance$[memberName];
                if (!ref.$instanceValues$.get(memberName) && currentValue) {
                  // on init get make sure the hostRef matches class instance

                  // the prop `set()` doesn't fire during `constructor()`:
                  // no initial value gets set in the hostRef.
                  // This means watchers fire even though the value hasn't changed.
                  // So if there's a current value and no initial value, let's set it now.
                  ref.$instanceValues$.set(memberName, currentValue);
                }
                // this sets the value via the `set()` function which
                // might not end up changing the underlying value
                ref.$lazyInstance$[memberName] = parsePropertyValue(newValue, memberFlags);
                setValue(this, memberName, ref.$lazyInstance$[memberName], cmpMeta);
              };

              if (ref.$lazyInstance$) {
                setterSetVal();
              } else {
                // the class is yet to be loaded / defined so queue an async call
                ref.$onReadyPromise$.then(() => setterSetVal());
              }
            }
          },
        });
      } else if (
        BUILD.lazyLoad &&
        BUILD.method &&
        flags & PROXY_FLAGS.isElementConstructor &&
        memberFlags & MEMBER_FLAGS.Method
      ) {
        // proxyComponent - method
        Object.defineProperty(prototype, memberName, {
          value(this: d.HostElement, ...args: any[]) {
            const ref = getHostRef(this);
            return ref?.$onInstancePromise$?.then(() => ref.$lazyInstance$?.[memberName](...args));
          },
        });
      }
    });

    if (BUILD.observeAttribute && (!BUILD.lazyLoad || flags & PROXY_FLAGS.isElementConstructor)) {
      const attrNameToPropName = new Map();

      prototype.attributeChangedCallback = function (attrName: string, oldValue: string, newValue: string) {
        plt.jmp(() => {
          const propName = attrNameToPropName.get(attrName);

          //  In a web component lifecycle the attributeChangedCallback runs prior to connectedCallback
          //  in the case where an attribute was set inline.
          //  ```html
          //    <my-component some-attribute="some-value"></my-component>
          //  ```
          //
          //  There is an edge case where a developer sets the attribute inline on a custom element and then
          //  programmatically changes it before it has been upgraded as shown below:
          //
          //  ```html
          //    <!-- this component has _not_ been upgraded yet -->
          //    <my-component id="test" some-attribute="some-value"></my-component>
          //    <script>
          //      // grab non-upgraded component
          //      el = document.querySelector("#test");
          //      el.someAttribute = "another-value";
          //      // upgrade component
          //      customElements.define('my-component', MyComponent);
          //    </script>
          //  ```
          //  In this case if we do not un-shadow here and use the value of the shadowing property, attributeChangedCallback
          //  will be called with `newValue = "some-value"` and will set the shadowed property (this.someAttribute = "another-value")
          //  to the value that was set inline i.e. "some-value" from above example. When
          //  the connectedCallback attempts to un-shadow it will use "some-value" as the initial value rather than "another-value"
          //
          //  The case where the attribute was NOT set inline but was not set programmatically shall be handled/un-shadowed
          //  by connectedCallback as this attributeChangedCallback will not fire.
          //
          //  https://developers.google.com/web/fundamentals/web-components/best-practices#lazy-properties
          //
          //  TODO(STENCIL-16) we should think about whether or not we actually want to be reflecting the attributes to
          //  properties here given that this goes against best practices outlined here
          //  https://developers.google.com/web/fundamentals/web-components/best-practices#avoid-reentrancy
          if (this.hasOwnProperty(propName) && BUILD.lazyLoad) {
            newValue = this[propName];
            delete this[propName];
          } else if (
            prototype.hasOwnProperty(propName) &&
            typeof this[propName] === 'number' &&
            // cast type to number to avoid TS compiler issues
            this[propName] == (newValue as unknown as number)
          ) {
            // if the propName exists on the prototype of `Cstr`, this update may be a result of Stencil using native
            // APIs to reflect props as attributes. Calls to `setAttribute(someElement, propName)` will result in
            // `propName` to be converted to a `DOMString`, which may not be what we want for other primitive props.
            return;
          } else if (propName == null) {
            // At this point we should know this is not a "member", so we can treat it like watching an attribute
            // on a vanilla web component
            const hostRef = getHostRef(this);
            const flags = hostRef?.$flags$;

            // We only want to trigger the callback(s) if:
            // 1. The instance is ready
            // 2. The watchers are ready
            // 3. The value has changed
            if (
              flags &&
              !(flags & HOST_FLAGS.isConstructingInstance) &&
              flags & HOST_FLAGS.isWatchReady &&
              newValue !== oldValue
            ) {
              const elm = BUILD.lazyLoad ? hostRef.$hostElement$ : this;
              const instance = BUILD.lazyLoad ? hostRef.$lazyInstance$ : (elm as any);
              const entry = cmpMeta.$watchers$?.[attrName];
              entry?.forEach((callbackName) => {
                if (instance[callbackName] != null) {
                  instance[callbackName].call(instance, newValue, oldValue, attrName);
                }
              });
            }

            return;
          }

          const propDesc = Object.getOwnPropertyDescriptor(prototype, propName);
          // test whether this property either has no 'getter' or if it does, does it also have a 'setter'
          // before attempting to write back to component props
          newValue = newValue === null && typeof this[propName] === 'boolean' ? (false as any) : newValue;
          if (newValue !== this[propName] && (!propDesc.get || !!propDesc.set)) {
            this[propName] = newValue;
          }
        });
      };

      // Create an array of attributes to observe
      // This list in comprised of all strings used within a `@Watch()` decorator
      // on a component as well as any Stencil-specific "members" (`@Prop()`s and `@State()`s).
      // As such, there is no way to guarantee type-safety here that a user hasn't entered
      // an invalid attribute.
      Cstr.observedAttributes = Array.from(
        new Set([
          ...Object.keys(cmpMeta.$watchers$ ?? {}),
          ...members
            .filter(([_, m]) => m[0] & MEMBER_FLAGS.HasAttribute)
            .map(([propName, m]) => {
              const attrName = m[1] || propName;
              attrNameToPropName.set(attrName, propName);
              if (BUILD.reflect && m[0] & MEMBER_FLAGS.ReflectAttr) {
                cmpMeta.$attrsToReflect$?.push([propName, attrName]);
              }

              return attrName;
            }),
        ]),
      );
    }
  }

  return Cstr;
};
