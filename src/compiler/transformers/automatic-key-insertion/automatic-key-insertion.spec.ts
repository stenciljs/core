import { transpileModule } from '../test/transpile';
import { formatCode } from '../test/utils';
import * as keyInsertionUtils from './utils';

function transpile(code: string) {
  return transpileModule(code, null, null, []);
}

describe('automatic key insertion', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should add a key to one JSX opener', async () => {
    jest.spyOn(keyInsertionUtils, 'deriveJSXKey').mockReturnValue('test-key');
    const t = transpile(`
    @Component({tag: 'cmp-a'})
      export class CmpA {
        render() {
          return <div>test</div>
      }
    }`);

    expect(await formatCode(t.outputText)).toBe(
      `export class CmpA {
  render() {
    return h('div', { key: 'test-key' }, 'test');
  }
  static get is() {
    return 'cmp-a';
  }
}
`,
    );
  });

  it('should add a key to nested JSX', async () => {
    jest.spyOn(keyInsertionUtils, 'deriveJSXKey').mockReturnValueOnce('key1').mockReturnValueOnce('key2');
    const t = transpile(`
    @Component({tag: 'cmp-a'})
      export class CmpA {
        render() {
          return <div>test<img src="image.png" /></div>
      }
    }`);

    expect(await formatCode(t.outputText)).toBe(
      `export class CmpA {
  render() {
    return h('div', { key: 'key1' }, 'test', h('img', { key: 'key2', src: 'image.png' }));
  }
  static get is() {
    return 'cmp-a';
  }
}
`,
    );
  });

  it('should add a key to one JSX opener w/ existing attr', async () => {
    jest.spyOn(keyInsertionUtils, 'deriveJSXKey').mockReturnValue('test-key');
    const t = transpile(`
    @Component({tag: 'cmp-a'})
      export class CmpA {
        render() {
          return <div class="foo">test</div>
      }
    }`);

    expect(await formatCode(t.outputText)).toBe(
      `export class CmpA {
  render() {
    return h('div', { key: 'test-key', class: 'foo' }, 'test');
  }
  static get is() {
    return 'cmp-a';
  }
}
`,
    );
  });

  it('should add a key to a self-closing JSX element', async () => {
    jest.spyOn(keyInsertionUtils, 'deriveJSXKey').mockReturnValue('img-key');
    const t = transpile(`
     @Component({tag: 'cmp-a'})
      export class CmpA {
        render() {
          return <img />
      }
    }`);

    expect(await formatCode(t.outputText)).toBe(
      `export class CmpA {
  render() {
    return h('img', { key: 'img-key' });
  }
  static get is() {
    return 'cmp-a';
  }
}
`,
    );
  });

  it('should add a key to a self-closing JSX element w/ existing attr', async () => {
    jest.spyOn(keyInsertionUtils, 'deriveJSXKey').mockReturnValue('img-key');
    const t = transpile(`
     @Component({tag: 'cmp-a'})
      export class CmpA {
        render() {
          return <img src="my-img.png" />
      }
    }`);

    expect(await formatCode(t.outputText)).toBe(
      `export class CmpA {
  render() {
    return h('img', { key: 'img-key', src: 'my-img.png' });
  }
  static get is() {
    return 'cmp-a';
  }
}
`,
    );
  });

  it('should add unique keys to multiple JSX elements', async () => {
    jest.spyOn(keyInsertionUtils, 'deriveJSXKey').mockReturnValueOnce('first-key').mockReturnValueOnce('second-key');
    const t = transpile(`
     @Component({tag: 'cmp-a'})
      export class CmpA {
        render() {
          return <div><img src="my-img.png" /></div>
      }
    }`);

    expect(await formatCode(t.outputText)).toBe(
      `export class CmpA {
  render() {
    return h('div', { key: 'first-key' }, h('img', { key: 'second-key', src: 'my-img.png' }));
  }
  static get is() {
    return 'cmp-a';
  }
}
`,
    );
  });

  it('should respect an existing key', async () => {
    jest.spyOn(keyInsertionUtils, 'deriveJSXKey').mockReturnValue('never-key');
    const t = transpile(`
     @Component({tag: 'cmp-a'})
      export class CmpA {
        render() {
          return <div key="my-key">hey</div>
      }
    }`);

    expect(await formatCode(t.outputText)).toBe(
      `export class CmpA {
  render() {
    return h('div', { key: 'my-key' }, 'hey');
  }
  static get is() {
    return 'cmp-a';
  }
}
`,
    );
  });

  it('should respect an existing key in a loop', async () => {
    jest.spyOn(keyInsertionUtils, 'deriveJSXKey').mockReturnValueOnce('once-key');
    const t = transpile(`
     @Component({tag: 'cmp-a'})
     export class CmpA {
        render() {
          return (
            <div>
              {this.todos.map((todo) => (
                <div key={todo}>{ todo }</div>
              ))}
            </div>
          )
      }
    }`);
    expect(await formatCode(t.outputText)).toBe(
      `export class CmpA {
  render() {
    return h(
      'div',
      { key: 'once-key' },
      this.todos.map((todo) => h('div', { key: todo }, todo)),
    );
  }
  static get is() {
    return 'cmp-a';
  }
}
`,
    );
  });

  it('should not add a static key to dynamic elements', async () => {
    jest.spyOn(keyInsertionUtils, 'deriveJSXKey').mockReturnValueOnce('once-key');
    const t = transpile(`
     @Component({tag: 'cmp-a'})
     export class CmpA {
        render() {
          return (
            <div>
              {this.todos.map((todo) => (
                <div>{ todo }</div>
              ))}
            </div>
          )
      }
    }`);
    expect(await formatCode(t.outputText)).toBe(
      `export class CmpA {
  render() {
    return h(
      'div',
      { key: 'once-key' },
      this.todos.map((todo) => h('div', null, todo)),
    );
  }
  static get is() {
    return 'cmp-a';
  }
}
`,
    );
  });

  it('should not transform JSX inside of a ternary', async () => {
    jest.spyOn(keyInsertionUtils, 'deriveJSXKey').mockReturnValue('shouldnt-see-key');
    const t = transpile(`
     @Component({tag: 'cmp-a'})
     export class CmpA {
       yes = false;
       render() {
         return this.yes ? <span>yes</span> : <span>no</span>
       }
     }`);
    expect(await formatCode(t.outputText)).toBe(
      `export class CmpA {
  constructor() {
    this.yes = false;
  }
  render() {
    return this.yes ? h('span', null, 'yes') : h('span', null, 'no');
  }
  static get is() {
    return 'cmp-a';
  }
}
`,
    );
  });

  it('should add a key to a conditionally-rendered static element', async () => {
    jest
      .spyOn(keyInsertionUtils, 'deriveJSXKey')
      .mockReturnValueOnce('my-best-key')
      .mockReturnValueOnce('my-worst-key');
    const t = transpile(`
     @Component({tag: 'cmp-a'})
     export class CmpA {
       yes = false;
       render() {
         return (
           <div>
             { someConditional && <span>inner</span> }
           </div>
         )
       }
     }`);
    expect(await formatCode(t.outputText)).toBe(
      `export class CmpA {
  constructor() {
    this.yes = false;
  }
  render() {
    return h('div', { key: 'my-best-key' }, someConditional && h('span', { key: 'my-worst-key' }, 'inner'));
  }
  static get is() {
    return 'cmp-a';
  }
}
`,
    );
  });

  it('should not add a key to an IIFE in JSX', async () => {
    jest
      .spyOn(keyInsertionUtils, 'deriveJSXKey')
      .mockReturnValueOnce('my-best-key')
      .mockReturnValueOnce('my-worst-key');
    const t = transpile(`
     @Component({tag: 'cmp-a'})
     export class CmpA {
       yes = false;
       render() {
         return (
           <div>
             { (() => <div>foo</div>)() }
           </div>
         )
       }
     }`);
    expect(await formatCode(t.outputText)).toBe(
      `export class CmpA {
  constructor() {
    this.yes = false;
  }
  render() {
    return h('div', { key: 'my-best-key' }, (() => h('div', null, 'foo'))());
  }
  static get is() {
    return 'cmp-a';
  }
}
`,
    );
  });

  it('should not add a key within function arguments in JSX', async () => {
    jest
      .spyOn(keyInsertionUtils, 'deriveJSXKey')
      .mockReturnValueOnce('my-best-key')
      .mockReturnValueOnce('my-worst-key');
    const t = transpile(`
     @Component({tag: 'cmp-a'})
     export class CmpA {
       yes = false;
       render() {
         return (
           <div>
             { func(<div>foo</div>) }
           </div>
         )
       }
     }`);
    expect(await formatCode(t.outputText)).toBe(
      `export class CmpA {
  constructor() {
    this.yes = false;
  }
  render() {
    return h('div', { key: 'my-worst-key' }, func(h('div', null, 'foo')));
  }
  static get is() {
    return 'cmp-a';
  }
}
`,
    );
  });

  it('should not transform JSX in methods with multiple returns', async () => {
    jest.spyOn(keyInsertionUtils, 'deriveJSXKey').mockReturnValue('shouldnt-see-key');
    const t = transpile(`
     @Component({tag: 'cmp-a'})
     export class CmpA {
       booleo = false;
       render() {
         if (this.booleo) {
           return <div>early!</div>;
         }
         return <div>late!</div>;
       }
     }`);
    expect(await formatCode(t.outputText)).toBe(
      `export class CmpA {
  constructor() {
    this.booleo = false;
  }
  render() {
    if (this.booleo) {
      return h('div', null, 'early!');
    }
    return h('div', null, 'late!');
  }
  static get is() {
    return 'cmp-a';
  }
}
`,
    );
  });

  it('should not edit a non-stencil class', async () => {
    jest.spyOn(keyInsertionUtils, 'deriveJSXKey').mockReturnValue("shouldn't see this!");
    const t = transpile(`
      export class CmpA {
        render() {
          return <div>hey</div>
      }
    }`);

    expect(await formatCode(t.outputText)).toBe(
      `export class CmpA {
  render() {
    return h('div', null, 'hey');
  }
}
`,
    );
  });
});
