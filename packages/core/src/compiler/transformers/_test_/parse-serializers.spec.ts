import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { getStaticGetter, transpileModule } from './transpile';

describe('parse PropSerialize', () => {
  it('constructs serializers static getters', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() prop1;
        @Prop() prop2;
        @State() state1;

        @PropSerialize('prop1')
        @PropSerialize('prop2')
        onUpdate() {
          console.log('update');
        }

        @PropSerialize('prop1')
        @PropSerialize('state1')
        onStateUpdated() {
          console.log('state updated');
        }
      }
    `);

    // should not include `@State` props
    expect(getStaticGetter(t.outputText, 'serializers')).toEqual([
      { methodName: 'onUpdate', propName: 'prop1' },
      { methodName: 'onUpdate', propName: 'prop2' },
      { methodName: 'onStateUpdated', propName: 'prop1' },
    ]);
  });

  it('should merge extended class serializers meta', async () => {
    const t = transpileModule(
      `
      @Component({tag: 'cmp-a'})
      class CmpA extends Parent {
        @Prop() foo;
        @PropSerialize('foo') 
        fooHandler() {
          return 'CmpA';
        }
      }
      class Parent extends GrandParent {
        @Prop() foo;
        @PropSerialize('foo') 
        anotherFooHandler() {
          return 'Parent';
        }
      }
      class GrandParent {
        @Prop() bar;
        @PropSerialize('bar') 
        barHandler() {
          return 'GrandParent';
        }

        @Prop() foo;
        @PropSerialize('foo') 
        fooHandler() {
          return 'GrandParent';
        }
      }
    `,
      undefined,
      undefined,
      [],
      [],
      [],
      { target: ts.ScriptTarget.ESNext },
    );

    expect(t.serializers).toEqual([
      {
        methodName: 'barHandler',
        propName: 'bar',
      },
      {
        methodName: 'anotherFooHandler',
        propName: 'foo',
      },
      {
        methodName: 'fooHandler',
        propName: 'foo',
      },
    ]);
  });
});

describe("@Prop({ serialize: 'json' })", () => {
  // the output starts with the generated `Build` import, which `getStaticGetter` can't evaluate
  const staticGetter = (output: string, name: string) =>
    getStaticGetter(output.replace(/^import[^;]*;\s*/, ''), name) as any;

  it('generates a JSON serializer / deserializer pair, reflected to the attribute', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop({ serialize: 'json' }) chartData: { x: number }[];
        @Prop({ serialize: 'json' }) items: string[];
        @Prop() other: string;
      }
    `);

    expect(staticGetter(t.outputText, 'serializers')).toEqual([
      { methodName: 'stencilSerializeJson', propName: 'chartData' },
      { methodName: 'stencilSerializeJson', propName: 'items' },
    ]);
    expect(staticGetter(t.outputText, 'deserializers')).toEqual([
      { methodName: 'stencilDeserializeJson', propName: 'chartData' },
      { methodName: 'stencilDeserializeJson', propName: 'items' },
    ]);
    const props = staticGetter(t.outputText, 'properties');
    expect(props.chartData).toMatchObject({ attribute: 'chart-data', reflect: true });
    expect(props.items).toMatchObject({ attribute: 'items', reflect: true });

    // one pair of methods for the class, using an aliased `Build` import
    expect(t.outputText.match(/stencilSerializeJson\(value\)/g)).toHaveLength(1);
    expect(t.outputText).toContain('__stencil_Build.isServer ? JSON.stringify(value) : null');
    expect(t.outputText).toMatch(/^import \{ Build as __stencil_Build \} from "@stencil\/core";/);
  });

  // the test harness throws on the first error diagnostic
  it('reports a format other than json', () => {
    expect(() =>
      transpileModule(`
        @Component({tag: 'cmp-a'})
        export class CmpA {
          @Prop({ serialize: 'yaml' as any }) items: string[];
        }
      `),
    ).toThrow(`@Prop({ serialize }) on "items" must be 'json'`);
  });

  it('reports attribute: null', () => {
    expect(() =>
      transpileModule(`
        @Component({tag: 'cmp-a'})
        export class CmpA {
          @Prop({ serialize: 'json', attribute: null }) items: string[];
        }
      `),
    ).toThrow('needs an attribute to write to');
  });

  it('reports a hand-written serializer for the same prop', () => {
    expect(() =>
      transpileModule(`
        @Component({tag: 'cmp-a'})
        export class CmpA {
          @Prop({ serialize: 'json' }) items: string[];
          @PropSerialize('items')
          mine(value) { return String(value); }
        }
      `),
    ).toThrow(`"items" has both @Prop({ serialize: 'json' }) and its own`);
  });
});
