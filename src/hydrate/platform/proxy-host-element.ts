import { consoleError, getHostRef } from '@platform';
import { getValue, parsePropertyValue, setValue } from '@runtime';
import { CMP_FLAGS, createShadowRoot, MEMBER_FLAGS } from '@utils';

import type * as d from '../../declarations';

export function proxyHostElement(elm: d.HostElement, cstr: d.ComponentConstructor): void {
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
        const attrValue = elm.getAttribute(attributeName);
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
            for (const methodName of cmpMeta.$deserializers$[memberName]) {
              attrPropVal = (cstr as any).prototype[methodName](attrValue, memberName);
            }
          } else {
            // otherwise, convert from string to correct type
            attrPropVal = parsePropertyValue(attrValue, memberFlags, !!(cmpMeta.$flags$ & CMP_FLAGS.formAssociated));
          }
        }

        if (propValue !== undefined) {
          // incoming value set on the host element (e.g `element.aProp = ...`)
          // let's add that to our instance values and pull it off the element.
          // This allows any applied getter/setter to kick in instead whilst still getting this value
          attrPropVal = propValue;
          delete (elm as any)[memberName];
        }

        if (attrPropVal !== undefined) {
          // value set via attribute/prop on the host element
          if (origSetter) {
            // we have an original setter, so let's set the value via that.
            origSetter.apply(elm, [attrPropVal]);
            attrPropVal = origGetter ? origGetter.apply(elm) : attrPropVal;
          }
          hostRef?.$instanceValues$?.set(memberName, attrPropVal);
        }

        // element
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
          if (!hostRef?.$instanceValues$?.has(memberName)) {
            setValue(
              elm,
              memberName,
              attrPropVal !== undefined ? attrPropVal : hostRef.$lazyInstance$[memberName],
              cmpMeta,
            );
          }
          Object.defineProperty(hostRef.$lazyInstance$, memberName, getterSetterDescriptor);
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
