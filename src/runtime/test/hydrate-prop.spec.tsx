import { Component, h, Prop } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

import { MEMBER_FLAGS } from '../../utils';

describe('hydrate prop types', () => {
  it('handles various prop types during both server and client hydration', async () => {
    function Clamp(lowerBound: number, upperBound: number): any {
      const clamp = (value: number) => Math.max(lowerBound, Math.min(value, upperBound));
      return () => {
        const key = Symbol();
        return {
          get() {
            return this[key];
          },
          set(newValue: number) {
            this[key] = clamp(newValue);
          },
          configurable: true,
          enumerable: true,
        };
      };
    }

    @Component({ tag: 'cmp-a' })
    class CmpA {
      constructor() {
        // required for tests ('cos testing re-uses the same instance across tests but resets the flags)
        // eslint-disable-next-line prefer-rest-params
        arguments[0].$cmpMeta$.$members$.clamped[0] |= MEMBER_FLAGS.Setter;
      }
      @Prop({ mutable: true }) boolean: boolean;
      @Prop({ mutable: true }) str: string;
      @Prop({ mutable: true }) num: number;
      private _accessor: number;
      @Prop()
      get accessor() {
        return this._accessor || 0;
      }
      set accessor(newVal) {
        this._accessor = newVal;
      }
      @Clamp(0, 10)
      @Prop({ mutable: true })
      clamped: number;

      componentWillRender() {
        this.num += 100;
        this.str += ' world';
        this.boolean = !this.boolean;
        this.accessor += 100;
      }

      render() {
        return `${this.boolean}-${this.str}-${this.num}-${this.accessor}-${this.clamped}`;
      }
    }

    const serverHydrated = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a num="1" clamped="11" str="hello" boolean="false" accessor="1"></cmp-a>`,
      hydrateServerSide: true,
    });

    expect(serverHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated" boolean="false" clamped="11" class="hydrated" num="1" s-id="1" str="hello" accessor="1">
        <!--r.1-->
        <!--t.1.0.0.0-->
        false-hello world world-201-101-10
      </cmp-a>
    `);

    const clientHydrated = await newSpecPage({
      components: [CmpA],
      html: serverHydrated.root.outerHTML,
      hydrateClientSide: true,
    });
    expect(clientHydrated.root['s-id']).toBe('1');
    expect(clientHydrated.root['s-cr'].nodeType).toBe(8);
    expect(clientHydrated.root['s-cr']['s-cn']).toBe(true);

    expect(clientHydrated.root).toEqualHtml(`
      <cmp-a accessor="1" boolean="false" clamped="11" class="hydrated" num="1" str="hello">
        <!--r.1-->
        false-hello world world-201-101-10
      </cmp-a>
    `);
  });
});
