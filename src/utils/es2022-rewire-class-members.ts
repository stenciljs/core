import { BUILD } from '@app-data';
import { MEMBER_FLAGS } from '@utils/constants';

import type * as d from '../declarations';
import { getPropertyDescriptor } from './get-prop-descriptor';

/**
 * - Re-wires component prototype `get` / `set` with instance `@State` / `@Prop` decorated fields.
 * - Makes sure the initial value from the `Element` is synced to the instance `@Prop` decorated fields.
 *
 * Background:
 * During component init, Stencil loops through any `@Prop()` or `@State()` decorated properties
 * and sets up getters and setters for each (within `src/runtime/proxy-component.ts`) on a component prototype.
 *
 * These accessors sync-up class instances with their `Element` and controls re-renders.
 * With modern JS, compiled classes (e.g. `target: 'es2022'`) compiled Stencil components went from:
 *
 * ```ts
 * class MyComponent {
 *   constructor() {
 *     this.prop1 = 'value1';
 *   }
 * }
 * ```
 * To:
 * ```ts
 * class MyComponent {
 *  prop1 = 'value2';
 *  // ^^ These override the accessors originally set on the prototype
 * }
 * ```
 *
 * @param instance - class instance to re-wire
 * @param hostRef - component reference meta
 */
export const reWireGetterSetter = (instance: any, hostRef: d.HostRef) => {
  const cmpMeta = hostRef.$cmpMeta$;
  const members = Object.entries(cmpMeta.$members$ ?? {});

  members.map(([memberName, [memberFlags]]) => {
    if ((BUILD.state || BUILD.prop) && (memberFlags & MEMBER_FLAGS.Prop || memberFlags & MEMBER_FLAGS.State)) {
      const ogValue = instance[memberName];

      // Get the original Stencil prototype `get` / `set`
      const ogDescriptor =
        getPropertyDescriptor(Object.getPrototypeOf(instance), memberName) ||
        Object.getOwnPropertyDescriptor(instance, memberName);

      if (ogDescriptor) {
        // Re-wire original accessors to the new instance
        Object.defineProperty(instance, memberName, {
          get() {
            return ogDescriptor.get.call(this);
          },
          set(newValue) {
            ogDescriptor.set.call(this, newValue);
          },
          configurable: true,
          enumerable: true,
        });
      }

      if (hostRef.$instanceValues$.has(memberName)) {
        // Sync element value to instance
        instance[memberName] = hostRef.$instanceValues$.get(memberName);
      } else if (!(memberFlags & MEMBER_FLAGS.Getter)) {
        // Only set ogValue if there's no getter.
        // Getters (e.g. from mixins) handle their own default values via backing fields.
        instance[memberName] = ogValue;
      }
    }
  });
};
