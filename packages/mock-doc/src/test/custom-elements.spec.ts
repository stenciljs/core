import { createWindow } from '../window';

describe('customElements', () => {
  it('attributeChangedCallback, removeAttribute', () => {
    let attrName: string = '';
    let oldValue: string = '';
    let newValue: string = '';
    let called = 0;

    customElements.define(
      'cmp-a',
      class extends HTMLElement {
        attributeChangedCallback(name: string, oldVal: string, newVal: string) {
          attrName = name;
          oldValue = oldVal;
          newValue = newVal;
          called++;
        }
        static get observedAttributes() {
          return ['attr-a', 'attr-b'];
        }
      },
    );

    const cmpA = document.createElement('CMP-a');
    cmpA.setAttribute('attr-a', 'value-a');
    expect(attrName).toBe('attr-a');
    expect(oldValue).toBe(null);
    expect(newValue).toBe('value-a');
    expect(called).toBe(1);

    document.body.appendChild(cmpA);

    cmpA.removeAttribute('attr-a');
    expect(attrName).toBe('attr-a');
    expect(oldValue).toBe('value-a');
    expect(newValue).toBe(null);
    expect(called).toBe(2);
  });

  it('attributeChangedCallback, setAttribute', () => {
    let attrName: string = '';
    let oldValue: string = '';
    let newValue: string = '';
    let called = 0;

    customElements.define(
      'cmp-a',
      class extends HTMLElement {
        attributeChangedCallback(name: string, oldVal: string, newVal: string) {
          attrName = name;
          oldValue = oldVal;
          newValue = newVal;
          called++;
        }
        static get observedAttributes() {
          return ['attr-a', 'attr-b'];
        }
      },
    );

    const cmpA = document.createElement('cmp-a');
    document.body.appendChild(cmpA);
    expect(attrName).toBe('');
    expect(called).toBe(0);

    cmpA.setAttribute('attr-a', 'value-a');
    expect(attrName).toBe('attr-a');
    expect(oldValue).toBe(null);
    expect(newValue).toBe('value-a');
    expect(called).toBe(1);

    cmpA.setAttribute('attr-a', 'value-a');
    expect(attrName).toBe('attr-a');
    expect(oldValue).toBe(null);
    expect(newValue).toBe('value-a');
    expect(called).toBe(1);

    cmpA.setAttribute('attr-a', 'value-b');
    expect(attrName).toBe('attr-a');
    expect(oldValue).toBe('value-a');
    expect(newValue).toBe('value-b');
    expect(called).toBe(2);

    cmpA.setAttribute('attr-b', 'value-a');
    expect(attrName).toBe('attr-b');
    expect(oldValue).toBe(null);
    expect(newValue).toBe('value-a');
    expect(called).toBe(3);
  });

  it('connectedCallback, innerHTML', () => {
    let connectedInc = 0;
    let disconnectedInc = 0;

    customElements.define(
      'cmp-a',
      class extends HTMLElement {
        connectedCallback() {
          connectedInc++;
        }
        disconnectedCallback() {
          disconnectedInc++;
        }
      },
    );

    expect(connectedInc).toBe(0);
    expect(disconnectedInc).toBe(0);

    document.body.innerHTML = `
      <div>
        <cmp-a></cmp-a>
      </div>
    `;

    expect(connectedInc).toBe(1);
    expect(disconnectedInc).toBe(0);

    expect(document.body.outerHTML).toEqualHtml(`
      <body>
        <div>
          <cmp-a></cmp-a>
        </div>
      </body>
    `);

    document.body.innerHTML = '';
    expect(connectedInc).toBe(1);
    expect(disconnectedInc).toBe(1);
    expect(document.body.outerHTML).toEqualHtml(``);
  });

  it('connectedCallback, multiple appendChild', () => {
    let connectedInc = 0;

    customElements.define(
      'cmp-a',
      class extends HTMLElement {
        connectedCallback() {
          connectedInc++;
        }
      },
    );

    expect(connectedInc).toBe(0);
    const cmpA1 = document.createElement('cmp-a');
    const cmpA2 = document.createElement('cmp-a');
    expect(connectedInc).toBe(0);
    document.body.appendChild(cmpA1);
    expect(connectedInc).toBe(1);
    document.body.appendChild(cmpA2);
    expect(connectedInc).toBe(2);
    expect(document.body.outerHTML).toEqualHtml(`
      <body>
        <cmp-a></cmp-a>
        <cmp-a></cmp-a>
      </body>
    `);
  });

  it('connectedCallback, insertBefore null', () => {
    let connectedInc = 0;

    customElements.define(
      'cmp-a',
      class extends HTMLElement {
        connectedCallback() {
          connectedInc++;
        }
      },
    );

    expect(connectedInc).toBe(0);
    const cmpA = document.createElement('cmp-a');
    expect(connectedInc).toBe(0);
    document.body.insertBefore(cmpA, null);
    expect(connectedInc).toBe(1);
    expect(document.body.outerHTML).toEqualHtml(`<body><cmp-a></cmp-a></body>`);
  });

  it('connectedCallback, insertBefore elm', () => {
    let connectedInc = 0;

    customElements.define(
      'cmp-a',
      class extends HTMLElement {
        connectedCallback() {
          connectedInc++;
        }
      },
    );

    expect(connectedInc).toBe(0);
    const ref = document.createElement('div');
    document.body.insertBefore(ref, null);
    const cmpA = document.createElement('cmp-a');
    document.body.insertBefore(cmpA, ref);
    expect(connectedInc).toBe(1);
    expect(document.body.outerHTML).toEqualHtml(`<body><cmp-a></cmp-a><div></div></body>`);
  });

  it('appendChild nested, scoped to mocked window', () => {
    let connectedInc = 0;
    let disconnectedInc = 0;
    const win = createWindow() as any;

    win.customElements.define(
      'cmp-a',
      class extends win.HTMLElement {
        connectedCallback() {
          connectedInc++;
        }
        disconnectedCallback() {
          disconnectedInc++;
        }
      },
    );

    expect(connectedInc).toBe(0);
    expect(disconnectedInc).toBe(0);

    const parentElm = win.document.createElement('div');
    const cmpA = win.document.createElement('cmp-a');
    parentElm.appendChild(cmpA);
    win.document.body.appendChild(parentElm);

    expect(connectedInc).toBe(1);
    expect(disconnectedInc).toBe(0);

    expect(win.document.body.outerHTML).toEqualHtml(`<body><div><cmp-a></cmp-a></div></body>`);

    win.document.body.removeChild(parentElm);
    expect(connectedInc).toBe(1);
    expect(disconnectedInc).toBe(1);
  });
});
