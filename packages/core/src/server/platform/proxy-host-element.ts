import type * as d from '@stencil/core';

import { applySerializers, getValue, parsePropertyValue, setValue } from '../../runtime';
import { SSR_PROP_REF_PREFIX, SSR_PROPS_REGISTRY_KEY } from '../../runtime/runtime-constants';
import { CMP_FLAGS, MEMBER_FLAGS } from '../../utils/constants';
import { toDashCase } from '../../utils/helpers';
import { createShadowRoot } from '../../utils/shadow-root';
import { consoleError, getHostRef } from './index';

// the real global object, outside the SSR factory (where `globalThis` is the mock window)
declare const $stencilNativeGlobal: typeof globalThis;

/**
 * Set up a component's host element on the server: its props (from attributes, values set on
 * the element before it was defined, and `ssrProp()` references), getters/setters and shadow root.
 * @param elm the host element
 * @param cstr the component's constructor
 * @param warn report a problem with the render (to its `diagnostics`)
 */
export function proxyHostElement(
  elm: d.HostElement,
  cstr: d.ComponentConstructor,
  warn: (message: string) => void = () => {},
): void {
  const cmpMeta = cstr.cmpMeta;
  cmpMeta.$watchers$ = cmpMeta.$watchers$ || cstr.watchers;
  cmpMeta.$deserializers$ = cmpMeta.$deserializers$ || cstr.deserializers;
  cmpMeta.$serializers$ = cmpMeta.$serializers$ || cstr.serializers;

  if (typeof elm.componentOnReady !== 'function') {
    elm.componentOnReady = componentOnReady;
  }
  if (typeof elm.forceUpdate !== 'function') {
    elm.forceUpdate = forceUpdate;
  }

  /**
   * Only attach shadow root if there isn't one already and
   * the component is rendering DSD (not scoped) during SSR
   */
  if (
    !elm.shadowRoot &&
    !!(cmpMeta.$flags$ & CMP_FLAGS.shadowDomEncapsulation) &&
    !(cmpMeta.$flags$ & CMP_FLAGS.shadowNeedsScopedCss)
  ) {
    createShadowRoot.call(elm, cmpMeta);
  }

  if (cmpMeta.$members$ != null) {
    const hostRef = getHostRef(elm);

    const members = Object.entries(cmpMeta.$members$);

    members.forEach(([memberName, [memberFlags, metaAttributeName]]) => {
      if (memberFlags & MEMBER_FLAGS.Prop) {
        // hyphenated attribute name
        const attributeName = metaAttributeName || memberName;
        // attribute value
        let attrValue = elm.getAttribute(attributeName);
        // an `ssrProp()` value from a framework template
        const ssrProp = takeSsrProp(elm, attributeName, memberName, warn);
        if (ssrProp) attrValue = null;
        // property value
        const propValue = (elm as any)[memberName];
        let attrPropVal: any;
        // any existing getter/setter applied to class property
        const { get: origGetter, set: origSetter } =
          Object.getOwnPropertyDescriptor((cstr as any).prototype, memberName) || {};

        if (attrValue != null) {
          // incoming value from `an-attribute=....`.

          if (cmpMeta.$deserializers$?.[memberName]) {
            // we have a custom deserializer for this member
            for (const deserializer of cmpMeta.$deserializers$[memberName]) {
              const [[methodName]] = Object.entries(deserializer);
              attrPropVal = (cstr as any).prototype[methodName](attrValue, memberName);
            }
          } else {
            // otherwise, convert from string to correct type
            attrPropVal = parsePropertyValue(attrValue, memberFlags);
          }
        }

        if (ssrProp?.value !== undefined) {
          attrPropVal = ssrProp.value;
        }

        if (propValue !== undefined) {
          // incoming value set on the host element (e.g `element.aProp = ...`)
          // let's add that to our instance values and pull it off the element.
          // This allows any applied getter/setter to kick in instead whilst still getting this value
          attrPropVal = propValue;
          delete (elm as any)[memberName];
        }

        const setFromOutside = ssrProp?.value !== undefined || propValue !== undefined;
        if (
          setFromOutside &&
          typeof attrPropVal === 'object' &&
          attrPropVal !== null &&
          !cmpMeta.$serializers$?.[memberName]
        ) {
          // nothing will carry it to the browser, which has only the HTML
          warn(
            `<${cmpMeta.$tagName$}>'s "${memberName}" prop was given an object on the server, but has ` +
              `no @PropSerialize(), so the browser won't get it: the component will first render ` +
              `there without it. To keep it, use @Prop({ serialize: 'json' }), or a @PropSerialize() / ` +
              `@AttrDeserialize() pair for other formats.`,
          );
        }

        // proxyComponent replaces the prototype setter with its own wrapper. If it has
        // already run for this class (isProxied), origSetter is that wrapper, not the
        // user's setter. Only use origSetter directly on the first instance.
        const userSetter = !(cstr as any).isProxied ? origSetter : undefined;

        if (attrPropVal !== undefined && !userSetter) {
          // No user setter (or subsequent instance): store value directly now.
          // When userSetter exists we defer to $fetchedCbList$ so `this` inside the setter
          // refers to the component instance, not the element.
          hostRef?.$instanceValues$?.set(memberName, attrPropVal);

          // A value set from outside skips `setValue()`, so run the prop's `@PropSerialize()`s
          // here, as the client does for a value set before upgrade. (One from an attribute
          // doesn't need them: the attribute is already there.)
          if (setFromOutside && cmpMeta.$serializers$?.[memberName]) {
            applySerializers(hostRef, cmpMeta, memberName, attrPropVal, undefined);
          }
        }

        const getterSetterDescriptor: PropertyDescriptor = {
          get: function (this: d.RuntimeRef) {
            return getValue(this, memberName);
          },
          set: function (this: d.RuntimeRef, newValue: unknown) {
            setValue(this, memberName, newValue, cmpMeta);
          },
          configurable: true,
          enumerable: true,
        };
        Object.defineProperty(elm, memberName, getterSetterDescriptor);
        Object.defineProperty(elm, metaAttributeName, getterSetterDescriptor);

        hostRef.$fetchedCbList$.push(() => {
          if (userSetter && attrPropVal !== undefined) {
            // Call the user's setter now that `this` is the real instance. Then read back
            // via origGetter to get the processed value (the setter may have transformed it).
            userSetter.apply(hostRef.$lazyInstance$, [attrPropVal]);
            const processedValue = origGetter
              ? origGetter.apply(hostRef.$lazyInstance$)
              : attrPropVal;
            setValue(elm, memberName, processedValue, cmpMeta);
          } else if (!hostRef?.$instanceValues$?.has(memberName)) {
            setValue(
              elm,
              memberName,
              attrPropVal !== undefined ? attrPropVal : hostRef.$lazyInstance$[memberName],
              cmpMeta,
            );
          }

          if (userSetter) {
            // Install an instance-level accessor that routes through the user's setter/getter.
            // We can't rely on the proxyComponent prototype setter here because its read-back
            // path goes through $hostElement$ (i.e. $instanceValues$), which won't reflect
            // values the user's setter stores privately on the instance.
            Object.defineProperty(hostRef.$lazyInstance$, memberName, {
              get: origGetter
                ? function (this: any) {
                    return origGetter.call(this);
                  }
                : function (this: d.RuntimeRef) {
                    return getValue(this, memberName);
                  },
              set: function (this: any, newValue: unknown) {
                userSetter.call(this, newValue);
                newValue = origGetter ? origGetter.call(this) : newValue;
                setValue(elm, memberName, newValue, cmpMeta);
              },
              configurable: true,
              enumerable: true,
            });
          } else {
            Object.defineProperty(hostRef.$lazyInstance$, memberName, getterSetterDescriptor);
          }
        });
      } else if (memberFlags & MEMBER_FLAGS.Method) {
        Object.defineProperty(elm, memberName, {
          value(this: d.HostElement, ...args: any[]) {
            const ref = getHostRef(this);
            return ref?.$onInstancePromise$
              ?.then(() => ref?.$lazyInstance$?.[memberName](...args))
              .catch((e) => {
                consoleError(e, this);
              });
          },
        });
      }
    });
  }
}

function componentOnReady(this: d.HostElement) {
  return getHostRef(this)?.$onReadyPromise$;
}

function forceUpdate(this: d.HostElement) {
  /**/
}

/**
 * Read and remove an `ssrProp()` reference: a value a framework template passed to this prop,
 * which reached the server as an attribute pointing into the `ssrProp()` registry. Templates bind
 * it under the prop name, which HTML lower-cases (`chartData` -> `chartdata`), or dash-cased
 * (`chart-data`); complex props usually have no attribute name of their own.
 * @param elm the component's host element
 * @param attributeName the prop's attribute name
 * @param memberName the prop's name
 * @param warn report a problem with the render
 * @returns `undefined` if there's no reference, otherwise its value (`undefined` if it's gone)
 */
const takeSsrProp = (
  elm: d.HostElement,
  attributeName: string,
  memberName: string,
  warn: (message: string) => void,
): { value: unknown } | undefined => {
  for (const name of new Set([attributeName, memberName, toDashCase(memberName)])) {
    const attr = elm.getAttribute(name);
    if (!attr?.startsWith(SSR_PROP_REF_PREFIX)) continue;
    elm.removeAttribute(name);

    const id = attr.slice(SSR_PROP_REF_PREFIX.length);
    const nativeGlobal =
      typeof $stencilNativeGlobal !== 'undefined' ? $stencilNativeGlobal : globalThis;
    const registry: Map<string, { value: unknown }> | undefined = (nativeGlobal as any)[
      Symbol.for(SSR_PROPS_REGISTRY_KEY)
    ];
    const entry = registry?.get(id);
    registry?.delete(id);
    if (!entry) {
      warn(
        `<${elm.tagName.toLowerCase()}>'s "${memberName}" was passed with ssrProp(), but its value ` +
          `isn't available here: it's only available to renderToString() in the same process, ` +
          `for a short time after the template ran.`,
      );
    }
    return { value: entry?.value };
  }
  return undefined;
};
