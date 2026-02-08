import { Component, h, Prop } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

/**
 * Regression tests for:
 * - #6368: input/textarea values containing JSON should not be coerced to objects during change/assignment
 * - #6380: prop typed as a union (e.g. string | number) must not parse a valid JSON string into an object
 */

describe('regression: do not parse JSON strings into objects', () => {
  it('does not parse JSON when assigning to a union prop (string | number)', async () => {
    @Component({ tag: 'cmp-union' })
    class CmpUnion {
      @Prop() value!: string | number;
      render() {
        return (
          <div>
            {typeof this.value}:{String(this.value)}
          </div>
        );
      }
    }

    const json = '{"text":"Hello"}';

    const page = await newSpecPage({
      components: [CmpUnion],
      html: `<cmp-union value='${json}'></cmp-union>`,
    });

    // Expect the prop to remain a string and not be parsed to an object
    expect(page.root?.textContent).toBe(`string:${json}`);
  });

  it('does not parse JSON when assigning to a union prop (string | boolean)', async () => {
    @Component({ tag: 'cmp-union-bool' })
    class CmpUnionBool {
      @Prop() value!: string | boolean;
      render() {
        return (
          <div>
            {typeof this.value}:{String(this.value)}
          </div>
        );
      }
    }

    const json = '{"active":true}';

    const page = await newSpecPage({
      components: [CmpUnionBool],
      html: `<cmp-union-bool value='${json}'></cmp-union-bool>`,
    });

    expect(page.root?.textContent).toBe(`string:${json}`);
  });

  it('does not parse JSON from an <input> value propagated to a mutable string prop', async () => {
    @Component({ tag: 'cmp-input-bind' })
    class CmpInputBind {
      // emulates how frameworks pass raw input values to components
      @Prop({ mutable: true, reflect: true }) value: string = '';

      private onInput = (ev: Event) => {
        const target = ev.target as HTMLInputElement;
        this.value = target.value; // assigning raw value must not parse JSON
      };

      render() {
        return (
          <div>
            <input value={this.value} onInput={this.onInput} />
            <span id="out">
              {typeof this.value}:{this.value}
            </span>
          </div>
        );
      }
    }

    const page = await newSpecPage({
      components: [CmpInputBind],
      html: `<cmp-input-bind></cmp-input-bind>`,
    });

    const input = page.root!.querySelector('input')! as HTMLInputElement;
    const json = '{"a":1}';

    // simulate user typing JSON into the input
    input.value = json;
    // Use a standard 'input' Event to mirror how other hydration tests trigger input handlers
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await page.waitForChanges();

    const out = page.root!.querySelector('#out')! as HTMLSpanElement;
    expect(out.textContent).toBe(`string:${json}`);
  });
});
