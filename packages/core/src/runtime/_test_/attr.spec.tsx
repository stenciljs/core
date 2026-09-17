import { Component, Element, h, Host, Prop } from '@stencil/core';
import { expect, describe, it } from '@stencil/vitest';

import { newSpecPage } from '../../testing';

describe('attribute', () => {
  it('multi-word attribute', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      @Prop() multiWord: string;
      render() {
        return `${this.multiWord}`;
      }
    }

    const { root } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a multi-word="multi-word"></cmp-a>`,
    });

    expect(root).toEqualHtml(`
      <cmp-a multi-word="multi-word">
        multi-word
      </cmp-a>
    `);

    expect(root.textContent).toBe('multi-word');
    expect(root.multiWord).toBe('multi-word');
  });

  it('custom attribute name', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      @Prop({ attribute: 'some-customName' }) customAttr: string;
      render() {
        return `${this.customAttr}`;
      }
    }

    const { root } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a some-customName="some-customName"></cmp-a>`,
    });

    expect(root).toEqualHtml(`
      <cmp-a some-customname="some-customName">
        some-customName
      </cmp-a>
    `);

    expect(root.textContent).toBe('some-customName');
    expect(root.customAttr).toBe('some-customName');
  });

  describe('already set', () => {
    it('set boolean, "false"', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        @Prop() bool: boolean;
        render() {
          return `${this.bool}`;
        }
      }

      const { root } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a bool="false"></cmp-a>`,
      });

      expect(root).toEqualHtml(`
        <cmp-a bool="false">
          false
        </cmp-a>
      `);

      expect(root.textContent).toBe('false');
      expect(root.bool).toBe(false);

      // reset
      root.setAttribute('bool', '');
      expect(root.bool).toBe(true);

      // check setAttribute
      root.setAttribute('bool', 'false');
      expect(root.bool).toBe(false);
    });

    it('set boolean, undefined when missing attribute', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        @Prop() bool: boolean;
        render() {
          return `${this.bool}`;
        }
      }

      const { root } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      expect(root).toEqualHtml(`
        <cmp-a>
          undefined
        </cmp-a>
      `);

      expect(root.textContent).toBe('undefined');
      expect(root.bool).toBe(undefined);
    });

    it('set boolean, "true"', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        @Prop() bool: boolean;
        render() {
          return `${this.bool}`;
        }
      }

      const { root } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a bool="true"></cmp-a>`,
      });

      expect(root).toEqualHtml(`
        <cmp-a bool="true">
          true
        </cmp-a>
      `);

      expect(root.textContent).toBe('true');
      expect(root.bool).toBe(true);

      // reset
      root.removeAttribute('bool');
      expect(root.bool).toBe(false);

      // check setAttribute
      root.setAttribute('bool', 'true');
      expect(root.bool).toBe(true);
    });

    it('set boolean true from no attribute value', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        @Prop() bool: boolean;
        render() {
          return `${this.bool}`;
        }
      }

      const { root } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a bool></cmp-a>`,
      });

      expect(root).toEqualHtml(`
        <cmp-a bool>
          true
        </cmp-a>
      `);

      expect(root.textContent).toBe('true');
      expect(root.bool).toBe(true);

      // reset
      root.removeAttribute('bool');
      expect(root.bool).toBe(false);

      // check setAttribute
      (root as HTMLElement).setAttribute('bool', '');
      expect(root.bool).toBe(true);
    });

    it('set boolean true from empty string', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        @Prop() bool: boolean;
        render() {
          return `${this.bool}`;
        }
      }

      const { root } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a bool=""></cmp-a>`,
      });

      expect(root).toEqualHtml(`
        <cmp-a bool>
          true
        </cmp-a>
      `);

      expect(root.textContent).toBe('true');
      expect(root.bool).toBe(true);

      // reset
      root.removeAttribute('bool');
      expect(root.bool).toBe(false);

      // check setAttribute
      root.setAttribute('bool', '');
      expect(root.bool).toBe(true);
    });

    it('set boolean true from any other string apart from "false"', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        @Prop() bool: boolean;
        render() {
          return `${this.bool}`;
        }
      }

      const { root } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a bool="nice"></cmp-a>`,
      });

      expect(root).toEqualHtml(`
        <cmp-a bool="nice">
          true
        </cmp-a>
      `);

      expect(root.textContent).toBe('true');
      expect(root.bool).toBe(true);

      // reset
      root.removeAttribute('bool');
      expect(root.bool).toBe(false);

      // check setAttribute
      root.setAttribute('bool', 'anything');
      expect(root.bool).toBe(true);
    });

    it('set zero', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        @Prop() num: number;
        render() {
          return `${this.num}`;
        }
      }

      const { root } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a num="0"></cmp-a>`,
      });

      expect(root).toEqualHtml(`
        <cmp-a num="0">
          0
        </cmp-a>
      `);

      expect(root.textContent).toBe('0');
      expect(root.num).toBe(0);
    });

    it('set number', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        @Prop() num: number;
        render() {
          return `${this.num}`;
        }
      }

      const { root } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a num="88"></cmp-a>`,
      });

      expect(root).toEqualHtml(`
        <cmp-a num="88">
          88
        </cmp-a>
      `);

      expect(root.textContent).toBe('88');
      expect(root.num).toBe(88);
    });

    it('set string', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        @Prop() str: string;
        render() {
          return `${this.str}`;
        }
      }

      const { root } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a str="string"></cmp-a>`,
      });

      expect(root).toEqualHtml(`
        <cmp-a str="string">
          string
        </cmp-a>
      `);

      expect(root.textContent).toBe('string');
      expect(root.str).toBe('string');
    });

    it('set empty string', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        @Prop() str: string;
        render() {
          return `${this.str}`;
        }
      }

      const { root } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a str=""></cmp-a>`,
      });

      expect(root).toEqualHtml(`
        <cmp-a str></cmp-a>
      `);

      expect(root.textContent).toBe('');
      expect(root.str).toBe('');
    });
  });

  describe('reflect', () => {
    it('should reflect properties as attributes', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        @Element() el: any;

        @Prop({ reflect: true }) str = 'single';
        @Prop({ reflect: true }) nu = 2;
        @Prop({ reflect: true }) undef: string;
        @Prop({ reflect: true }) null: string = null;
        @Prop({ reflect: true }) bool = false;
        @Prop({ reflect: true }) otherBool = true;
        @Prop({ reflect: true }) disabled = false;

        @Prop({ reflect: true, mutable: true }) dynamicStr: string;
        @Prop({ reflect: true }) dynamicNu: number;
        private _getset = 'prop via getter';
        @Prop({ reflect: true })
        get getSet() {
          return this._getset;
        }
        set getSet(newVal: string) {
          this._getset = newVal;
        }

        componentWillLoad() {
          this.dynamicStr = 'value';
          this.el.dynamicNu = 123;
        }
      }

      const { root, waitForChanges } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      expect(root).toEqualHtml(`
        <cmp-a str="single" nu="2" other-bool dynamic-str="value" dynamic-nu="123" get-set="prop via getter"></cmp-a>
      `);

      root.str = 'second';
      root.nu = -12.2;
      root.undef = 'no undef';
      root.null = 'no null';
      root.bool = true;
      root.otherBool = false;
      root.getSet = 'prop set via setter';

      await waitForChanges();

      expect(root).toEqualHtml(`
        <cmp-a str="second" nu="-12.2" dynamic-str="value" dynamic-nu="123" get-set="prop set via setter" undef="no undef" null="no null" bool></cmp-a>
      `);
    });

    it('should remove a reflected boolean attribute when set to false, even if pre-existing markup wrote it as a literal string', async () => {
      // https://github.com/stenciljs/core/issues/6828
      @Component({ tag: 'cmp-reflect-bool-literal' })
      class CmpReflectBoolLiteral {
        @Prop({ reflect: true, mutable: true }) flag = false;
      }

      const { root, waitForChanges } = await newSpecPage({
        components: [CmpReflectBoolLiteral],
        html: `<cmp-reflect-bool-literal flag="true"></cmp-reflect-bool-literal>`,
      });

      expect(root.flag).toBe(true);

      root.flag = false;
      await waitForChanges();

      expect(root.hasAttribute('flag')).toBe(false);
    });

    it('should reflect properties as attributes with strict build', async () => {
      @Component({ tag: 'cmp-a', encapsulation: { type: 'shadow' } })
      class CmpA {
        @Prop({ reflect: true }) foo = 'bar';

        render() {
          return <div>Hello world</div>;
        }
      }

      const { root } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
        strictBuild: true,
      });

      expect(root).toEqualHtml(`
        <cmp-a foo="bar">
          <mock:shadow-root>
            <div>
              Hello world
            </div>
          </mock:shadow-root>
        </cmp-a>
      `);
    });

    it('should reflect draggable', async () => {
      @Component({ tag: 'cmp-draggable', encapsulation: { type: 'shadow' } })
      class CmpABC {
        @Prop() foo = false;

        render() {
          return (
            <Host>
              <div draggable={this.foo}></div>
              <img draggable={this.foo} />
            </Host>
          );
        }
      }

      const { root, waitForChanges } = await newSpecPage({
        components: [CmpABC],
        html: `<cmp-draggable></cmp-draggable>`,
      });

      expect(root).toEqualHtml(`
        <cmp-draggable>
          <mock:shadow-root>
            <div draggable="false"></div>
            <img draggable="false">
          </mock:shadow-root>
        </cmp-draggable>
      `);

      root.foo = true;
      await waitForChanges();

      expect(root).toEqualHtml(`
      <cmp-draggable>
        <mock:shadow-root>
          <div draggable="true"></div>
          <img draggable="true">
        </mock:shadow-root>
      </cmp-draggable>
    `);
    });
    it('should correctly reflect boolean | undefined prop when toggled between true and undefined', async () => {
      @Component({ tag: 'cmp-reflect-bool-toggle', encapsulation: { type: 'shadow' } })
      class CmpReflectBoolToggle {
        @Prop({ reflect: true, mutable: true }) active: boolean | undefined = undefined;

        render() {
          return <div>{String(this.active)}</div>;
        }
      }

      const { root, waitForChanges } = await newSpecPage({
        components: [CmpReflectBoolToggle],
        html: `<cmp-reflect-bool-toggle></cmp-reflect-bool-toggle>`,
      });

      // undefined: no attribute
      expect(root.hasAttribute('active')).toBe(false);
      expect(root.active).toBeUndefined();

      // undefined → true: attribute appears
      root.active = true;
      await waitForChanges();
      expect(root.hasAttribute('active')).toBe(true);
      expect(root.active).toBe(true);

      // true → undefined: attribute removed, prop must stay undefined (not coerced to false)
      root.active = undefined;
      await waitForChanges();
      expect(root.hasAttribute('active')).toBe(false);
      expect(root.active).toBeUndefined();

      // undefined → true again: recovers correctly
      root.active = true;
      await waitForChanges();
      expect(root.hasAttribute('active')).toBe(true);
      expect(root.active).toBe(true);

      // external removeAttribute while prop is true: must update prop to false
      root.removeAttribute('active');
      await waitForChanges();
      expect(root.active).toBe(false);
    });

    it('should keep a reflected any-typed prop set to true, rather than the empty attribute it reflects as', async () => {
      @Component({ tag: 'cmp-reflect-any-true', encapsulation: { type: 'shadow' } })
      class CmpReflectAnyTrue {
        @Prop({ reflect: true, mutable: true }) value: any;

        render() {
          return <div>{String(this.value)}</div>;
        }
      }

      const { root, waitForChanges } = await newSpecPage({
        components: [CmpReflectAnyTrue],
        html: `<cmp-reflect-any-true></cmp-reflect-any-true>`,
      });

      root.value = true;
      await waitForChanges();

      expect(root.getAttribute('value')).toBe('');
      expect(root.value).toBe(true);
    });

    it('should keep a reflected any-typed prop set to false when markup seeded the attribute', async () => {
      @Component({ tag: 'cmp-reflect-any-false', encapsulation: { type: 'shadow' } })
      class CmpReflectAnyFalse {
        @Prop({ reflect: true, mutable: true }) value: any;

        render() {
          return <div>{String(this.value)}</div>;
        }
      }

      const { root, waitForChanges } = await newSpecPage({
        components: [CmpReflectAnyFalse],
        html: `<cmp-reflect-any-false value="seed"></cmp-reflect-any-false>`,
      });

      expect(root.value).toBe('seed');

      root.value = false;
      await waitForChanges();

      // reflecting `false` removes the attribute, which must not null out the prop
      expect(root.hasAttribute('value')).toBe(false);
      expect(root.value).toBe(false);
    });

    it('should keep an object assigned to a reflected any-typed prop', async () => {
      @Component({ tag: 'cmp-reflect-any-object', encapsulation: { type: 'shadow' } })
      class CmpReflectAnyObject {
        @Prop({ reflect: true, mutable: true }) value: any;

        render() {
          return <div>{JSON.stringify(this.value)}</div>;
        }
      }

      const { root, waitForChanges } = await newSpecPage({
        components: [CmpReflectAnyObject],
        html: `<cmp-reflect-any-object></cmp-reflect-any-object>`,
      });

      const obj = { id: 7 };
      root.value = obj;
      await waitForChanges();

      // complex values are never written to an attribute, so there's no round trip to corrupt the prop
      expect(root.hasAttribute('value')).toBe(false);
      expect(root.value).toBe(obj);
    });

    it('should still write an external attribute change through to a reflected any-typed prop', async () => {
      @Component({ tag: 'cmp-reflect-any-external', encapsulation: { type: 'shadow' } })
      class CmpReflectAnyExternal {
        @Prop({ reflect: true, mutable: true }) value: any;

        render() {
          return <div>{String(this.value)}</div>;
        }
      }

      const { root, waitForChanges } = await newSpecPage({
        components: [CmpReflectAnyExternal],
        html: `<cmp-reflect-any-external></cmp-reflect-any-external>`,
      });

      root.value = true;
      await waitForChanges();
      expect(root.value).toBe(true);

      // an external write of something other than the reflected form still wins
      root.setAttribute('value', 'hello');
      await waitForChanges();
      expect(root.value).toBe('hello');
      expect(root.getAttribute('value')).toBe('hello');

      // and removing it externally still clears the prop
      root.removeAttribute('value');
      await waitForChanges();
      expect(root.value).toBe(null);
    });

    it('should keep booleans on a reflected any-typed prop that connectedCallback seeded with an id', async () => {
      // the shape `ion-radio` uses: an `any` prop reflected to the attribute, falling back to a
      // generated id when the consumer leaves it unset
      @Component({ tag: 'cmp-reflect-any-seeded', encapsulation: { type: 'shadow' } })
      class CmpReflectAnySeeded {
        @Prop({ reflect: true, mutable: true }) value: any;

        connectedCallback() {
          if (this.value === undefined) {
            this.value = 'seeded-id';
          }
        }

        render() {
          return <div>{String(this.value)}</div>;
        }
      }

      const { root, waitForChanges } = await newSpecPage({
        components: [CmpReflectAnySeeded],
        html: `<cmp-reflect-any-seeded></cmp-reflect-any-seeded>`,
      });

      expect(root.value).toBe('seeded-id');
      expect(root.getAttribute('value')).toBe('seeded-id');

      root.value = false;
      await waitForChanges();
      expect(root.value).toBe(false);

      root.value = true;
      await waitForChanges();
      expect(root.value).toBe(true);

      root.value = 0;
      await waitForChanges();
      expect(root.value).toBe(0);
    });

    it('should apply an external attribute change to a reflected any-typed prop holding a complex value', async () => {
      @Component({ tag: 'cmp-reflect-any-complex-ext', encapsulation: { type: 'shadow' } })
      class CmpReflectAnyComplexExt {
        @Prop({ reflect: true, mutable: true }) value: any;

        render() {
          return <div>x</div>;
        }
      }

      const { root, waitForChanges } = await newSpecPage({
        components: [CmpReflectAnyComplexExt],
        html: `<cmp-reflect-any-complex-ext></cmp-reflect-any-complex-ext>`,
      });

      root.value = {
        valueOf: () => 5,
        toString: () => 'x',
      };
      await waitForChanges();

      // a complex value is never reflected, so this change can only be external and must reach the
      // prop even though it matches the value's string form
      root.setAttribute('value', 'x');
      await waitForChanges();
      expect(root.value).toBe('x');
    });
  });
});
