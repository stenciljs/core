import { Component, Element, forceUpdate, getRenderingRef, h, Host, Prop, setErrorHandler, State } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

import { withSilentWarn } from '../../testing/testing-utils';

describe('render-vdom', () => {
  describe('build conditionals', () => {
    it('vdomText', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        render() {
          return <div>Hello VDOM</div>;
        }
      }

      const { build } = await newSpecPage({ components: [CmpA], strictBuild: true });
      expect(build).toMatchObject({
        vdomAttribute: true,
        vdomXlink: false,
        vdomClass: false,
        vdomStyle: false,
        vdomKey: true,
        vdomRef: false,
        vdomListener: false,
        vdomFunctional: false,
        vdomText: true,
      });
    });

    it('vdomText from identifier', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        render() {
          const text = 'Hello VDOM';
          return <div>{text}</div>;
        }
      }

      const { build } = await newSpecPage({ components: [CmpA], strictBuild: true });
      expect(build).toMatchObject({
        vdomAttribute: true,
        vdomXlink: false,
        vdomClass: false,
        vdomStyle: false,
        vdomKey: true,
        vdomRef: false,
        vdomListener: false,
        vdomFunctional: false,
        vdomText: true,
      });
    });

    it('vdomText from call expression', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        render() {
          const text = () => 'Hello VDOM';
          return <div>{text()}</div>;
        }
      }

      const { build } = await newSpecPage({ components: [CmpA], strictBuild: true });
      expect(build).toMatchObject({
        vdomAttribute: true,
        vdomXlink: false,
        vdomClass: false,
        vdomStyle: false,
        vdomKey: true,
        vdomRef: false,
        vdomListener: false,
        vdomFunctional: false,
        vdomText: true,
      });
    });

    it('vdomText from object access', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        render() {
          const text = { text: 'Hello VDOM' };
          return <div>{text.text}</div>;
        }
      }

      const { build } = await newSpecPage({ components: [CmpA], strictBuild: true });
      expect(build).toMatchObject({
        vdomAttribute: true,
        vdomXlink: false,
        vdomClass: false,
        vdomStyle: false,
        vdomKey: true,
        vdomRef: false,
        vdomListener: false,
        vdomFunctional: false,
        vdomText: true,
      });
    });

    it('vdomClass', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        render() {
          return <div class="hola"></div>;
        }
      }

      const { build } = await newSpecPage({ components: [CmpA], strictBuild: true });
      expect(build).toMatchObject({
        vdomAttribute: true,
        vdomXlink: false,
        vdomClass: true,
        vdomStyle: false,
        vdomKey: true,
        vdomRef: false,
        vdomListener: false,
        vdomFunctional: false,
        vdomText: false,
      });
    });

    it('vdomStyle', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        render() {
          return <div style={{ position: 'relative' }}></div>;
        }
      }

      const { build } = await newSpecPage({ components: [CmpA], strictBuild: true });
      expect(build).toMatchObject({
        vdomAttribute: true,
        vdomXlink: false,
        vdomClass: false,
        vdomStyle: true,
        vdomKey: true,
        vdomRef: false,
        vdomListener: false,
        vdomFunctional: false,
        vdomText: false,
      });
    });

    it('vdomKey', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        render() {
          return <div key={1}></div>;
        }
      }

      const { build } = await newSpecPage({ components: [CmpA], strictBuild: true });
      expect(build).toMatchObject({
        vdomAttribute: true,
        vdomXlink: false,
        vdomClass: false,
        vdomStyle: false,
        vdomKey: true,
        vdomRef: false,
        vdomListener: false,
        vdomFunctional: false,
        vdomText: false,
      });
    });

    it('vdomRef', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        render() {
          return (
            <div
              ref={() => {
                return;
              }}
            ></div>
          );
        }
      }

      const { build } = await newSpecPage({ components: [CmpA], strictBuild: true });
      expect(build).toMatchObject({
        vdomAttribute: true,
        vdomXlink: false,
        vdomClass: false,
        vdomStyle: false,
        vdomKey: true,
        vdomRef: true,
        vdomListener: false,
        vdomFunctional: false,
        vdomText: false,
      });
    });

    it('vdomListener onClick', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        render() {
          return (
            <div
              onClick={() => {
                return;
              }}
            ></div>
          );
        }
      }

      const { build } = await newSpecPage({ components: [CmpA], strictBuild: true });
      expect(build).toMatchObject({
        vdomAttribute: true,
        vdomXlink: false,
        vdomClass: false,
        vdomStyle: false,
        vdomKey: true,
        vdomRef: false,
        vdomListener: true,
        vdomFunctional: false,
        vdomText: false,
      });
    });

    it('vdomListener on-click', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        render() {
          return (
            <div
              on-click={() => {
                return;
              }}
            ></div>
          );
        }
      }

      const { build } = await newSpecPage({ components: [CmpA], strictBuild: true });
      expect(build).toMatchObject({
        vdomAttribute: true,
        vdomXlink: false,
        vdomClass: false,
        vdomStyle: false,
        vdomKey: true,
        vdomRef: false,
        vdomListener: true,
        vdomFunctional: false,
        vdomText: false,
      });
    });

    it('vdomFunctional', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        render() {
          const H = () => {
            return;
          };
          return <H />;
        }
      }

      const { build } = await newSpecPage({ components: [CmpA], strictBuild: true });
      expect(build).toMatchObject({
        vdomAttribute: false,
        vdomXlink: false,
        vdomClass: false,
        vdomStyle: false,
        vdomKey: false,
        vdomRef: false,
        vdomListener: false,
        vdomFunctional: true,
        vdomText: false,
      });
    });

    it('vdomFunctional (2)', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        render() {
          const Tunnel = {
            Provider: () => {
              return;
            },
          };
          return <Tunnel.Provider />;
        }
      }

      const { build } = await newSpecPage({ components: [CmpA], strictBuild: true });
      expect(build).toMatchObject({
        vdomAttribute: false,
        vdomXlink: false,
        vdomClass: false,
        vdomStyle: false,
        vdomKey: false,
        vdomRef: false,
        vdomListener: false,
        vdomFunctional: true,
        vdomText: false,
      });
    });

    it('fallback spread', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        props: any;
        render() {
          return <div {...this.props} role="dialog"></div>;
        }
      }

      const { build } = await newSpecPage({ components: [CmpA], strictBuild: true });
      expect(build).toMatchObject({
        vdomAttribute: true,
        vdomXlink: true,
        vdomClass: true,
        vdomStyle: true,
        vdomKey: true,
        vdomRef: true,
        vdomListener: true,
        vdomFunctional: false,
        vdomText: false,
      });
    });

    it('normal properties', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        prop: any;

        render() {
          return <Host role="hola" onevent="adios"></Host>;
        }
      }

      const { build } = await newSpecPage({ components: [CmpA], strictBuild: true });
      expect(build).toMatchObject({
        vdomAttribute: true,
        vdomXlink: false,
        vdomClass: false,
        vdomStyle: false,
        vdomKey: true,
        vdomRef: false,
        vdomListener: false,
        vdomFunctional: false,
        vdomText: false,
      });
    });

    it('all but style', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        render() {
          const Span = 'span';
          return (
            <Host class={{ hola: true }}>
              <div
                aria-hidden="true"
                onClick={() => {
                  return;
                }}
              >
                Hello VDOM
                <Span
                  ref={() => {
                    return;
                  }}
                  key="adios"
                ></Span>
              </div>
            </Host>
          );
        }
      }

      const { build } = await newSpecPage({ components: [CmpA], strictBuild: true });
      expect(build).toMatchObject({
        vdomAttribute: true,
        vdomXlink: false,
        vdomClass: true,
        vdomStyle: false,
        vdomKey: true,
        vdomRef: true,
        vdomListener: true,
        vdomFunctional: true,
        vdomText: true,
      });
    });
  });

  it('rerender on ref mutation', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      private nuRender = 0;
      @State() valid = false;

      render() {
        this.nuRender++;
        return (
          <div ref={() => (this.valid = true)}>
            {this.valid ? 'true' : 'false'} - {this.nuRender}
          </div>
        );
      }
    }

    const { root } = await withSilentWarn(() =>
      newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      }),
    );

    expect(root).toEqualHtml(`
      <cmp-a><div>true - 2</div></cmp-a>
    `);
  });

  it('not rerender on render() mutation', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      private nuRender = 0;
      @State() valid = false;
      render() {
        this.valid = true;
        this.nuRender++;
        return (
          <div>
            {this.valid ? 'true' : 'false'} - {this.nuRender}
          </div>
        );
      }
    }

    const { root } = await withSilentWarn(() =>
      newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      }),
    );

    expect(root).toEqualHtml(`
      <cmp-a><div>true - 1</div></cmp-a>
    `);
  });

  it('Hello VDOM, re-render, flush', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      @Prop() excitement = '';
      render() {
        return <div>Hello VDOM{this.excitement}</div>;
      }
    }

    const { root, waitForChanges } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
    });

    expect(root).toEqualHtml(`
      <cmp-a><div>Hello VDOM</div></cmp-a>
    `);

    root.excitement = `!`;
    await waitForChanges();

    expect(root).toEqualHtml(`
      <cmp-a><div>Hello VDOM!</div></cmp-a>
    `);

    root.excitement = `!!`;
    await waitForChanges();

    expect(root).toEqualHtml(`
      <cmp-a><div>Hello VDOM!!</div></cmp-a>
    `);
  });

  it('render crash should not remove the content', async () => {
    let didError = false;
    setErrorHandler((_err) => {
      didError = true;
    });
    @Component({ tag: 'cmp-a' })
    class CmpA {
      @Prop() crash = false;
      render() {
        if (this.crash) {
          throw new Error('YOLO');
        }
        return <div>Hello</div>;
      }
    }

    const { root, waitForChanges } = await newSpecPage({
      components: [CmpA],

      html: `<cmp-a></cmp-a>`,
    });

    expect(root).toEqualHtml(`
      <cmp-a><div>Hello</div></cmp-a>
    `);

    expect(didError).toBe(false);
    root.crash = true;
    await waitForChanges();

    expect(root).toEqualHtml(`
      <cmp-a><div>Hello</div></cmp-a>
    `);
    expect(didError).toBe(true);
  });

  it('Hello VDOM, html option', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      render() {
        return <div>Hello VDOM</div>;
      }
    }

    const { root } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
    });

    expect(root).toEqualHtml(`
      <cmp-a><div>Hello VDOM</div></cmp-a>
    `);
  });

  it('<slot> test', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      render() {
        return (
          <a href="#">
            <slot></slot>
          </a>
        );
      }
    }

    const { root } = await newSpecPage({
      components: [CmpA],
      includeAnnotations: true,
      html: `<cmp-a>Hello</cmp-a>`,
    });

    expect(root).toEqualHtml(`
      <cmp-a class="hydrated">
        <!---->
        <a href="#">Hello</a>
      </cmp-a>
    `);
  });

  it('Hello VDOM, body.innerHTML, await flush', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      render() {
        return <div>Hello VDOM</div>;
      }
    }

    const { body, waitForChanges } = await newSpecPage({
      components: [CmpA],
    });

    body.innerHTML = `<cmp-a></cmp-a>`;
    await waitForChanges();

    expect(body).toEqualHtml(`
      <cmp-a><div>Hello VDOM</div></cmp-a>
    `);
  });

  it('should add classes', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      render() {
        return (
          <div
            class={` class1
              class2
              class3 `}
          >
            Hello VDOM
          </div>
        );
      }
    }

    const { body } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
    });

    expect(body).toEqualHtml(`
      <cmp-a><div class="class1 class2 class3">Hello VDOM</div></cmp-a>
    `);
  });

  it('should error when reusing vnodes', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      @Prop() first = '';
      @Prop() middle = '';
      @Prop() last = '';

      private getText(): string {
        return `${this.first} ${this.middle} ${this.last}`;
      }

      render() {
        const name = <b>{this.getText()}</b>;

        return (
          <div>
            <div>Hello, World! I'm {name}</div>
            <div>I repeat, I'm {name}</div>
            <div>One last time, I'm {name}</div>
          </div>
        );
      }
    }

    let error;
    try {
      await newSpecPage({
        components: [CmpA],
        html: `<cmp-a first="Stencil" last="'Don't call me a framework' JS"></cmp-a>`,
      });
    } catch (e) {
      error = e;
    }
    expect(error.message).toContain('JSX');
  });

  it('should render nested arrays', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      @Prop() excitement = '';
      render() {
        const jsx = [<h1>H1</h1>, <h2>h2</h2>, ['Outside', <h3>h3</h3>]];
        return (
          <div>
            Text0
            {jsx}
          </div>
        );
      }
    }
    const { root } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
    });
    expect(root).toEqualHtml(`
      <cmp-a>
        <div>
          Text0
          <h1>H1</h1>
          <h2>h2</h2>
          Outside
          <h3>h3</h3>
        </div>
      </cmp-a>
    `);
  });

  it('should not render booleans', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      @Prop() excitement = '';
      render() {
        return (
          <div>
            {false}
            hola
            {true}
          </div>
        );
      }
    }
    const { root } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
    });
    expect(root).toEqualHtml(`
      <cmp-a>
        <div>
          hola
        </div>
      </cmp-a>
    `);
  });

  describe('getRenderingRef', () => {
    it('returns instance', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        render() {
          const ref = getRenderingRef();
          expect(ref).toBe(this);
          return <MyFunctionalCmp cmp={this} />;
        }
      }
      const MyFunctionalCmp = (props: any) => {
        expect(getRenderingRef()).toBe(props.cmp);
        return <p>MyFunctionalCmp</p>;
      };
      const { root } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });
      expect(root).toEqualHtml(`
        <cmp-a>
          <p>MyFunctionalCmp</p>
        </cmp-a>
      `);
    });

    it('useState hook', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        @State() count = 0;
        render() {
          return <MyFunctionalCmp />;
        }
      }

      const useState = (state: string) => {
        const ref = getRenderingRef();
        return [ref[state], (value: any) => (ref[state] = value)];
      };

      const MyFunctionalCmp = () => {
        const [count, setCount] = useState('count');
        return <p onClick={() => setCount(count + 1)}>{count}</p>;
      };
      const { root, waitForChanges } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });
      expect(root).toEqualHtml(`
        <cmp-a>
          <p>0</p>
        </cmp-a>
      `);
      root.querySelector('p').click();
      await waitForChanges();
      expect(root).toEqualHtml(`
        <cmp-a>
          <p>1</p>
        </cmp-a>
      `);
    });
  });

  describe('forceUpdate', () => {
    it('should trigger re-render', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        private count = 0;
        render() {
          return this.count++;
        }
      }

      const { root, rootInstance, waitForChanges } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });
      await waitForChanges();
      expect(root.textContent).toEqual('0');

      expect(forceUpdate(root)).toBe(true);
      await waitForChanges();
      expect(root.textContent).toEqual('1');

      expect(forceUpdate(rootInstance)).toBe(true);
      await waitForChanges();
      expect(root.textContent).toEqual('2');

      expect(forceUpdate(rootInstance)).toBe(true);
      expect(forceUpdate(root)).toBe(true);
      await waitForChanges();
      await waitForChanges();
      expect(root.textContent).toEqual('3');

      root.remove();
      expect(forceUpdate(root)).toBe(false);
      expect(forceUpdate(rootInstance)).toBe(false);
    });
  });

  describe('input', () => {
    it('should render attributes', async () => {
      @Component({
        tag: 'cmp-a',
      })
      class CmpA {
        render() {
          return (
            <Host>
              <button type="button"></button>
              <button type="submit"></button>
              <input type="text" value="" />
              <input type="number" />
              <input type="password" />
              <input type="email" />
              <input type="date" />
              <input list="my-list" />
            </Host>
          );
        }
      }

      const { root } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });
      expect(root).toEqualHtml(`
        <cmp-a>
          <button type=\"button\"></button>
          <button type=\"submit\"></button>
          <input type=\"text\" value=\"\">
          <input type=\"number\">
          <input type=\"password\">
          <input type=\"email\">
          <input type=\"date\">
          <input list=\"my-list\" />
        </cmp-a>
      `);
    });
  });

  describe('svg', () => {
    it('should not override classes', async () => {
      @Component({
        tag: 'cmp-a',
        styles: ':host{}',
        scoped: true,
      })
      class CmpA {
        @Prop() addClass = false;
        render() {
          return <svg class={{ hello: this.addClass }}></svg>;
        }
      }

      const { root, waitForChanges } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
        includeAnnotations: true,
      });
      expect(root).toEqualHtml(`
    <cmp-a class="hydrated sc-cmp-a-h">
      <svg class="sc-cmp-a"></svg>
    </cmp-a>
    `);

      root.querySelector('svg').classList.add('manual');
      root.addClass = true;
      await waitForChanges();

      expect(root).toEqualHtml(`
      <cmp-a class="hydrated sc-cmp-a-h">
        <svg class="manual hello sc-cmp-a"></svg>
      </cmp-a>
      `);
    });

    it('should update attributes', async () => {
      @Component({
        tag: 'svg-attr',
      })
      class SvgAttr {
        @Prop() isOpen = false;

        render() {
          return (
            <div>
              <div>
                {this.isOpen ? (
                  <svg viewBox="0 0 54 54">
                    <rect transform="rotate(45 27 27)" y="22" width="54" height="10" rx="2" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 54 54">
                    <rect y="0" width="54" height="10" rx="2" />
                  </svg>
                )}
              </div>
            </div>
          );
        }
      }

      const { root, waitForChanges } = await newSpecPage({
        components: [SvgAttr],
        html: `<svg-attr></svg-attr>`,
      });

      const rect = root.querySelector('rect');
      expect(rect.getAttribute('transform')).toBe(null);

      root.isOpen = true;
      await waitForChanges();
      expect(rect.getAttribute('transform')).toBe('rotate(45 27 27)');

      root.isOpen = false;
      await waitForChanges();
      expect(rect.getAttribute('transform')).toBe(null);
    });

    it('should render foreignObject properly', async () => {
      @Component({
        tag: 'cmp-a',
      })
      class CmpA {
        render() {
          return (
            <svg class="is-svg">
              <foreignObject class="is-svg">
                <div class="is-html">hello</div>
                <svg class="is-svg">
                  <feGaussianBlur class="is-svg"></feGaussianBlur>
                  <foreignObject class="is-svg">
                    <foreignObject class="is-html"></foreignObject>
                    <div class="is-html">Still outside svg</div>
                  </foreignObject>
                </svg>
                <feGaussianBlur class="is-html">bye</feGaussianBlur>
              </foreignObject>
              <text class="is-svg">Hello</text>
              <text class="is-svg">Bye</text>
            </svg>
          );
        }
      }

      const { root } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      for (const el of Array.from(root.querySelectorAll('.is-html'))) {
        expect(el.namespaceURI).toEqual('http://www.w3.org/1999/xhtml');
      }
      for (const el of Array.from(root.querySelectorAll('.is-svg'))) {
        expect(el.namespaceURI).toEqual('http://www.w3.org/2000/svg');
      }

      expect(root).toEqualHtml(`
      <cmp-a>
        <svg class=\"is-svg\">
          <foreignObject class=\"is-svg\">
            <div class=\"is-html\">
              hello
            </div>
            <svg class=\"is-svg\">
              <feGaussianBlur class=\"is-svg\"></feGaussianBlur>
              <foreignObject class=\"is-svg\">
                <foreignobject class=\"is-html\"></foreignobject>
                <div class=\"is-html\">
                  Still outside svg
                </div>
              </foreignObject>
            </svg>
            <fegaussianblur class=\"is-html\">
              bye
            </fegaussianblur>
          </foreignObject>
          <text class=\"is-svg\">Hello</text>
          <text class=\"is-svg\">Bye</text>
        </svg>
      </cmp-a>`);
    });
  });

  describe('native elements', () => {
    it('should render <input> correctly', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        render() {
          return <input min={0} max={10} value={5} />;
        }
      }

      const { root } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      expect(root).toEqualHtml(`
        <cmp-a>
          <input max=\"10\" min=\"0\" value=\"5\">
        </cmp-a>`);
    });
  });

  describe('ref property', () => {
    it('should set on Host', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        selfRef: HTMLElement;
        @Element() el: HTMLElement;

        render() {
          return <Host ref={(el) => (this.selfRef = el)}></Host>;
        }
      }

      const { root, rootInstance } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      expect(rootInstance.el).toEqual(root);
      expect(rootInstance.el).toEqual(rootInstance.selfRef);
    });

    it('should set and reset', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        divRef: HTMLElement;
        @Prop() visible = true;
        render() {
          return this.visible && <div ref={(el) => (this.divRef = el)}>Hello VDOM</div>;
        }
      }

      const { root, rootInstance, waitForChanges } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      expect(rootInstance.divRef).toEqual(root.querySelector('div'));
      root.visible = false;
      await waitForChanges();

      expect(rootInstance.divRef).toEqual(null);
    });

    it('should set once', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        divRef: HTMLElement;
        counter = 0;
        setRef = () => {
          this.counter++;
        };

        render() {
          return <div ref={this.setRef}>Hello VDOM</div>;
        }
      }

      const { root, rootInstance, waitForChanges } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      expect(rootInstance.counter).toEqual(1);
      forceUpdate(root);
      await waitForChanges();

      expect(rootInstance.counter).toEqual(1);
    });

    it('should set once (2)', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        counter = 0;
        setRef = (el: HTMLDivElement | null) => {
          if (el !== null) {
            this.counter++;
          }
        };
        @Prop() state = true;

        render() {
          return this.state ? <div ref={this.setRef}>Hello VDOM</div> : <div>Hello VDOM</div>;
        }
      }

      const { root, rootInstance, waitForChanges } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      expect(rootInstance.counter).toEqual(1);

      root.state = false;
      await waitForChanges();
      expect(rootInstance.counter).toEqual(1);

      root.state = true;
      await waitForChanges();
      expect(rootInstance.counter).toEqual(2);
    });

    it('should not call ref cb w/ null when children are reordered', async () => {
      // this test is a regression test ensuring that the algorithm for matching
      // up children across rerenders works correctly when a basic transposition is
      // done (the elements at the ends of the children swap places).
      @Component({ tag: 'cmp-a' })
      class CmpA {
        divRef: HTMLElement;
        @Prop() state = true;

        renderA() {
          return (
            <div class="a" ref={(el) => (this.divRef = el)}>
              A
            </div>
          );
        }

        renderB() {
          return <div>B</div>;
        }

        render() {
          return this.state
            ? [this.renderB(), <div>middle</div>, this.renderA()]
            : [this.renderA(), <div>middle</div>, this.renderB()];
        }
      }

      const { root, rootInstance, waitForChanges } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });
      // ref should be set correctly after the first render
      expect(rootInstance.divRef).toEqual(root.querySelector('.a'));
      root.state = false;
      await waitForChanges();
      // We've changed the state and forced a re-render. This tests one of the
      // ways in which children can be re-ordered that the `updateChildren` algo
      // can handle without having `key` attrs set.
      expect(rootInstance.divRef).toEqual(root.querySelector('.a'));
    });

    it('should not call ref cb w/ null when children w/ keys are reordered', async () => {
      // this test is a regression test ensuring that the algorithm for matching
      // up children across rerenders works correctly in a situation in which it
      // needs to use the `key` attribute to disambiguate them. At present, if the
      // `key` attribute is _not_ present in this case then this test will fail
      // because without the `key` Stencil's child-identity heuristic falls over.
      @Component({ tag: 'cmp-a' })
      class CmpA {
        divRef: HTMLElement;
        @Prop() state = true;

        renderA() {
          return (
            <div key="a" class="a" ref={(el) => (this.divRef = el)}>
              A
            </div>
          );
        }

        renderB() {
          return <div>B</div>;
        }

        render() {
          return this.state ? [this.renderB(), this.renderA()] : [this.renderA()];
        }
      }

      const { root, rootInstance, waitForChanges } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      // ref should be set correctly after the first render
      expect(rootInstance.divRef).toEqual(root.querySelector('.a'));
      root.state = false;
      await waitForChanges();
      // We've changed the state and forced a re-render where the algorithm for
      // reconciling children will have to use the `key` attribute to find the
      // equivalent VNode on the re-render. So if that is all working correctly
      // then the value of our `divRef` property should be set correctly after
      // the rerender.
      //
      // The reordering that is conditionally done in the `render` method of the
      // test component above is specifically the type of edge case that the
      // parts of the `updateChildren` algorithm which _don't_ use the `key` attr
      // have trouble with.
      //
      // This is essentially a regression test for the issue described in
      // https://github.com/stenciljs/core/issues/3253
      expect(rootInstance.divRef).toEqual(root.querySelector('.a'));
    });
  });
});
