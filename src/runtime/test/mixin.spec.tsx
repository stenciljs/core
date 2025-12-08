import { Component, h, MixedInCtor, Mixin, Prop, State } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

describe('mixin', () => {
  it('can call a constructor with args', async () => {
    const MyMixin = <B extends MixedInCtor>(Base: B) => {
      class Test extends Base {
        constructor(...args: any[]) {
          super(...args);
        }

        @State() test = 'testing!!';
      }
      return Test;
    };

    @Component({ tag: 'arg-test' })
    class CmpA extends Mixin(MyMixin) {
      @Prop() value: string;

      render() {
        return (
          <code>
            {this.value.trim()} {this.test}
          </code>
        );
      }
    }

    const { root } = await newSpecPage({
      components: [CmpA],
      html: `<arg-test value="#005a00"></arg-test>`,
    });

    expect(root).not.toBeFalsy();
  });

  it('can initialize with a @Prop with an initial value', async () => {
    const MyMixin = <B extends MixedInCtor>(Base: B) => {
      class Test extends Base {
        @Prop({ mutable: true }) testProp = 'ABC';
      }
      return Test;
    };

    @Component({
      tag: 'mixin-test',
    })
    class MixinTest extends Mixin(MyMixin) {
      render() {
        return <code>{this.testProp}</code>;
      }
    }

    const { root } = await newSpecPage({
      components: [MyMixin, MixinTest],
      html: `<mixin-test></mixin-test>`,
    });

    expect(root).toEqualHtml(`
      <mixin-test>
        <code>ABC</code>
      </mixin-test>
    `);
  });
});
