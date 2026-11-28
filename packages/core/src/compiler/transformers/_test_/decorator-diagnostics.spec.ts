import { describe, expect, it } from 'vitest';

import { transpileSync } from '../../transpile';

const errors = (code: string) =>
  transpileSync(code, { file: '/src/cmp.tsx', componentExport: 'customelement' })
    .diagnostics.filter((d) => d.level === 'error')
    .map((d) => d.messageText);

describe('decorator argument diagnostics', () => {
  it('reports a @Watch() argument that is not a string', () => {
    expect(
      errors(`
        import { Component, Prop, Watch } from '@stencil/core';
        const SEVEN = 7;
        const NEG = -1;
        @Component({ tag: 'cmp-a' })
        export class CmpA {
          @Prop() value: string;
          @Watch(SEVEN) onSeven() {}
          @Watch(NEG) onNeg() {}
          @Watch('value') onValue() {}
        }
      `),
    ).toEqual([
      '@Watch() expects the name of a member as a string, received 7.',
      '@Watch() expects the name of a member as a string, received -1.',
    ]);
  });

  it('reports a @Listen() argument that is not a string', () => {
    expect(
      errors(`
        import { Component, Listen } from '@stencil/core';
        const N = 3;
        @Component({ tag: 'cmp-a' })
        export class CmpA {
          @Listen(N) onN() {}
        }
      `),
    ).toEqual(['@Listen() expects an event name as a string, received 3.']);
  });

  it('reports computed member names Stencil cannot use', () => {
    expect(
      errors(`
        import { Component, Element, Event, EventEmitter, Listen, Method, Prop, State } from '@stencil/core';
        let KEY = 'value';
        const OK = 'ok';
        const EV = 'ping';
        @Component({ tag: 'cmp-a' })
        export class CmpA {
          @Prop() [KEY]: string;
          @State() [OK] = 1;
          @Event() [EV]: EventEmitter;
          @Element() [EV + 'El']: HTMLElement;
          @Method() async [EV + 'Method']() {}
          @Listen('click') [EV + 'Click']() {}
        }
      `),
    ).toEqual([
      "The computed name `[KEY]` of this @Prop() can't be resolved at compile time. Use a `const` string or enum member.",
      '@Event() does not support a computed member name (`[EV]`). Use a plain name.',
      "@Element() does not support a computed member name (`[EV + 'El']`). Use a plain name.",
      "@Method() does not support a computed member name (`[EV + 'Method']`). Use a plain name.",
      "@Listen() does not support a computed member name (`[EV + 'Click']`). Use a plain name.",
    ]);
  });

  it('keeps the other diagnostics of a file when a decorator argument cannot be read', () => {
    expect(
      errors(`
        import { Component, Prop, Watch, resolveVar } from '@stencil/core';
        const NUM = 1;
        @Component({ tag: 'nodash' })
        export class CmpA {
          @Prop() private p: string;
          @Watch(resolveVar(NUM)) onNum() {}
        }
      `),
    ).toEqual([
      expect.stringContaining('"nodash" tag must contain a dash'),
      expect.stringContaining('cannot be "private" nor "protected"'),
      'resolveVar() cannot resolve the value of "NUM" at compile time. Only const variables and object properties with string literal values are supported.',
    ]);
  });
});
