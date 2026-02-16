import { expect, describe, it } from '@stencil/vitest';
import { Component, h, Prop } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

// Augment JSX to allow attr:* and prop:* prefixed attributes
declare module '@stencil/core' {
  export namespace JSXBase {
    interface HTMLAttributes<T = HTMLElement> {
      [key: `attr:${string}`]: any;
      [key: `prop:${string}`]: any;
    }
    interface InputHTMLAttributes<T = HTMLInputElement> {
      [key: `attr:${string}`]: any;
      [key: `prop:${string}`]: any;
    }
  }
}

describe('attr: and prop: prefix', () => {
  describe('attr: prefix', () => {
    it('should set attribute using attr: prefix', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        render() {
          return <div attr:something="test label" />;
        }
      }

      const { root } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      const div = root.querySelector('div');
      expect(div.getAttribute('something')).toBe('test label');
    });

    it('should set numeric and stringified values as attributes', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        render() {
          return <div attr:something-else="button" attr:a-number="0" />;
        }
      }

      const { root } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      const div = root.querySelector('div');
      expect(div.getAttribute('something-else')).toBe('button');
      expect(div.getAttribute('a-number')).toBe('0');
    });

    it('should set boolean true as empty string attribute', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        render() {
          return <div attr:boolean={true} />;
        }
      }

      const { root } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      const div = root.querySelector('div');
      expect(div.getAttribute('boolean')).toBe('');
      expect(div.hasAttribute('boolean')).toBe(true);
    });

    it('should remove attribute when value is false', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        @Prop() show = false;
        render() {
          return <div attr:boolean={this.show} />;
        }
      }

      const { root, waitForChanges } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      const div = root.querySelector('div');
      expect(div.hasAttribute('boolean')).toBe(false);

      root.show = true;
      await waitForChanges();
      expect(div.getAttribute('boolean')).toBe('');
      root.show = false;
      await waitForChanges();
      expect(div.hasAttribute('boolean')).toBe(false);
    });

    it('should force attribute even for properties that exist on element', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        render() {
          return <input attr:value="500px" type="text" />;
        }
      }

      const { root } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      const input = root.querySelector('input');
      expect(input.getAttribute('value')).toBe('500px');
      expect(input.value).toBe('500px'); // property remains unset
    });

    it('should update attribute on re-render', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        @Prop() label = 'initial';
        render() {
          return <div attr:some-label={this.label} />;
        }
      }

      const { root, waitForChanges } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      const div = root.querySelector('div');
      expect(div.getAttribute('some-label')).toBe('initial');

      root.label = 'updated';
      await waitForChanges();
      expect(div.getAttribute('some-label')).toBe('updated');
    });

    it('should use the correct attribute name for camelCase properties on Stencil components', async () => {
      @Component({ tag: 'cmp-child' })
      class CmpChild {
        @Prop() overlayIndex: number;
        @Prop({ attribute: 'custom-attr-name' }) customAttr: string;
        render() {
          return (
            <div>
              overlayIndex: {this.overlayIndex}, customAttr: {this.customAttr}
            </div>
          );
        }
      }

      @Component({ tag: 'cmp-parent' })
      class CmpParent {
        render() {
          return (
            <div>
              <cmp-child attr:overlayIndex={42} attr:customAttr="test" />
            </div>
          );
        }
      }

      const { root } = await newSpecPage({
        components: [CmpParent, CmpChild],
        html: `<cmp-parent></cmp-parent>`,
      });

      const child = root.querySelector<any>('cmp-child');
      // Should use kebab-case attribute name from metadata
      expect(child.getAttribute('overlay-index')).toBe('42');
      expect(child.overlayIndex).toBe(42);

      // Should use custom attribute name from @Prop decorator
      expect(child.getAttribute('custom-attr-name')).toBe('test');
      expect(child.customAttr).toBe('test');

      // Should not set incorrect camelCase attribute names
      expect(child.hasAttribute('overlayIndex')).toBe(false);
      expect(child.hasAttribute('customAttr')).toBe(false);
    });

    it('should convert camelCase to kebab-case for non-Stencil elements', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        render() {
          return <div attr:dataTestId="test-123" attr:ariaLabel="Test Label" attr:customAttribute="value" />;
        }
      }

      const { root } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      const div = root.querySelector('div');
      // Should convert camelCase to kebab-case
      expect(div.getAttribute('data-test-id')).toBe('test-123');
      expect(div.getAttribute('aria-label')).toBe('Test Label');
      expect(div.getAttribute('custom-attribute')).toBe('value');

      // Should not set camelCase versions
      expect(div.hasAttribute('dataTestId')).toBe(false);
      expect(div.hasAttribute('ariaLabel')).toBe(false);
      expect(div.hasAttribute('customAttribute')).toBe(false);
    });
  });

  describe('prop: prefix', () => {
    it('should set property using prop: prefix', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        render() {
          return <input prop:value="test value" />;
        }
      }

      const { root } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      const input = root.querySelector('input');
      expect(input.value).toBe('test value');
    });

    it('should set complex types as properties', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        render() {
          const data = { foo: 'bar', items: [1, 2, 3] };
          return <div prop:customData={data} />;
        }
      }

      const { root } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      const div = root.querySelector('div') as any;
      expect(div.customData).toEqual({ foo: 'bar', items: [1, 2, 3] });
      expect(div.customData.foo).toBe('bar');
    });

    it('should set array as property', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        render() {
          return <div prop:items={[1, 2, 3]} />;
        }
      }

      const { root } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      const div = root.querySelector('div') as any;
      expect(Array.isArray(div.items)).toBe(true);
      expect(div.items).toEqual([1, 2, 3]);
    });

    it('should not set attribute when using prop: prefix', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        render() {
          return <div prop:customProp="test" />;
        }
      }

      const { root } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      const div = root.querySelector('div') as any;
      expect(div.customProp).toBe('test');
      expect(div.hasAttribute('customProp')).toBe(false);
      expect(div.hasAttribute('custom-prop')).toBe(false);
    });

    it('should update property on re-render', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        @Prop() data = { count: 0 };
        render() {
          return <div prop:myData={this.data} />;
        }
      }

      const { root, waitForChanges } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      const div = root.querySelector('div') as any;
      expect(div.myData).toEqual({ count: 0 });

      root.data = { count: 42 };
      await waitForChanges();
      expect(div.myData).toEqual({ count: 42 });
    });

    it('should set null as property', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        @Prop() value: string | null = null;
        render() {
          return <div prop:myProp={this.value} />;
        }
      }

      const { root } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      const div = root.querySelector('div') as any;
      expect(div.myProp).toBe(null);
    });
  });

  describe('mixed usage', () => {
    it('should work with both attr: and prop: alongside normal attributes', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        render() {
          return <div id="normal-id" class="normal-class" attr:role="button" prop:customData={{ value: 123 }} />;
        }
      }

      const { root } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      const div = root.querySelector('div') as any;
      expect(div.id).toBe('normal-id');
      expect(div.className).toBe('normal-class');
      expect(div.getAttribute('role')).toBe('button');
      expect(div.customData).toEqual({ value: 123 });
    });

    it('should handle multiple attr: and prop: prefixes', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        render() {
          return <div attr:aria-label="Label" attr:role="button" prop:propOne="a" prop:propTwo="b" />;
        }
      }

      const { root } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      const div = root.querySelector('div') as any;
      expect(div.getAttribute('aria-label')).toBe('Label');
      expect(div.getAttribute('role')).toBe('button');
      expect(div.propOne).toBe('a');
      expect(div.propTwo).toBe('b');
    });

    it('should work on Stencil components with props', async () => {
      @Component({ tag: 'cmp-child' })
      class CmpChild {
        @Prop() normalProp: string;
        @Prop() complexData: any;
        render() {
          return (
            <div>
              {this.normalProp} - {JSON.stringify(this.complexData)}
            </div>
          );
        }
      }

      @Component({ tag: 'cmp-parent' })
      class CmpParent {
        render() {
          return <cmp-child normalProp="via-normal" prop:complexData={{ test: 'data' }} />;
        }
      }

      const { root } = await newSpecPage({
        components: [CmpParent, CmpChild],
        html: `<cmp-parent></cmp-parent>`,
      });

      const child = root.querySelector<any>('cmp-child');
      expect(child.normalProp).toBe('via-normal');
      expect(child.complexData).toEqual({ test: 'data' });
      expect(child.textContent.trim()).toBe('via-normal - {"test":"data"}');
    });

    it('should re-render correctly with prefixed attributes', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        @Prop() attrValue = 'initial';
        @Prop() propValue = { count: 0 };
        render() {
          return <div attr:aria-label={this.attrValue} prop:customProp={this.propValue} />;
        }
      }

      const { root, waitForChanges } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      const div = root.querySelector('div') as any;
      expect(div.getAttribute('aria-label')).toBe('initial');
      expect(div.customProp).toEqual({ count: 0 });

      root.attrValue = 'updated';
      root.propValue = { count: 42 };
      await waitForChanges();

      expect(div.getAttribute('aria-label')).toBe('updated');
      expect(div.customProp).toEqual({ count: 42 });
    });
  });
});
