import { describe, it, expect } from '@stencil/vitest';
import { MockDocument } from '../document';

describe('selector', () => {
  it('closest', () => {
    const doc = new MockDocument(`
      <div>
        <span>
          <p></p>
        </span>
      </div>
    `);

    const p = doc.querySelector('p');
    const div = doc.querySelector('div');
    expect(p?.closest('div')).toBe(div);
  });

  it('no closest', () => {
    const doc = new MockDocument(`
      <div>
        <span>
          <p></p>
        </span>
      </div>
    `);

    const p = doc.querySelector('p');
    expect(p?.closest('div#my-id')).toBe(null);
  });

  it('matches, tag/class/id', () => {
    const doc = new MockDocument();
    const elm = doc.createElement('h1');
    elm.classList.add('my-class');
    elm.id = 'my-id';
    expect(elm.matches('h1.my-class#my-id')).toBe(true);
  });

  it('no matches, tag/class/id', () => {
    const doc = new MockDocument();
    const elm = doc.createElement('h1');
    expect(elm.matches('h1.my-class#my-id')).toBe(false);
  });

  it('matches, tag', () => {
    const doc = new MockDocument();
    const elm = doc.createElement('h1');
    expect(elm.matches('h1')).toBe(true);
  });

  it('no matches, tag', () => {
    const doc = new MockDocument();
    const elm = doc.createElement('h1');
    expect(elm.matches('div')).toBe(false);
  });

  it('not find input.checked.a.b', () => {
    const doc = new MockDocument(`
      <input class="checked a c" id="checkbox">
    `);

    const checkbox = doc.querySelector('input.checked.a.b');
    expect(checkbox).toBe(null);
  });

  it('find input.checked', () => {
    const doc = new MockDocument(`
      <input class="checked" id="checkbox">
    `);

    const checkbox = doc.querySelector('input.checked');
    expect(checkbox?.id).toBe('checkbox');
  });

  it('find input[checked=true][disabled]', () => {
    const doc = new MockDocument(`
      <input checked="true" disabled id="checkbox">
    `);

    const checkbox = doc.querySelector('input[checked=true][disabled]');
    expect(checkbox?.id).toBe('checkbox');
  });

  it('find input[checked=true]', () => {
    const doc = new MockDocument(`
      <input checked="true" id="checkbox">
    `);

    const checkbox = doc.querySelector('input[checked=true]');
    expect(checkbox?.id).toBe('checkbox');
  });

  it('find input[checked]', () => {
    const doc = new MockDocument(`
      <input checked id="checkbox">
    `);

    const checkbox = doc.querySelector('input[checked]');
    expect(checkbox?.id).toBe('checkbox');
  });

  it('find all tag names', () => {
    const doc = new MockDocument(`
      <div>1</div>
      <nav>2</nav>
    `);

    const elms = doc.querySelectorAll('a,div,nav');
    expect(elms.length).toBe(2);
  });

  it('find first tag name', () => {
    const doc = new MockDocument(`
      <div>1</div>
      <nav>2</nav>
    `);

    const div = doc.querySelector('a,div,nav');
    expect(div?.outerHTML).toBe('<div>1</div>');
  });

  it('find one tag name', () => {
    const doc = new MockDocument(`
      <div>1</div>
      <nav>2</nav>
    `);

    const div = doc.querySelector('div');
    expect(div?.outerHTML).toBe('<div>1</div>');

    const nav = doc.querySelector('nav');
    expect(nav?.outerHTML).toBe('<nav>2</nav>');
  });

  it('finds child', () => {
    const doc = new MockDocument(`
      <div>
        <span></span>
      </div>
    `);

    const span = doc.querySelector('div > span');
    expect(span?.outerHTML).toBe('<span></span>');
  });

  it('finds child if multiple children', () => {
    const doc = new MockDocument(`
      <div>
        <a></a>
        <span></span>
      </div>
    `);

    const span = doc.querySelector('div > span');
    expect(span?.outerHTML).toBe('<span></span>');
  });

  it('finds child if multiple selectors', () => {
    const doc = new MockDocument(`
      <div>
        <a></a>
        <span>
          <div></div>
          <div class="inner"></div>
        </span>
      </div>
    `);

    const span = doc.querySelector('div > span > .inner');
    expect(span?.outerHTML).toBe('<div class="inner"></div>');
  });

  it('not find child if does not exist', () => {
    const doc = new MockDocument(`
      <div>
        <a></a>
        <span>
          <div></div>
          <div class="inner"></div>
        </span>
      </div>
    `);

    const span = doc.querySelector('div > span > .none');
    expect(span).toBeFalsy();
  });

  it(':not()', () => {
    const doc = new MockDocument(`
      <a nope>
        <b><b>
      </a>
    `);
    const q1 = doc.querySelector('a:not([nope]) b');
    expect(q1).toBe(null);
  });

  it('descendent, two deep', () => {
    const doc = new MockDocument();
    const div = doc.createElement('div');
    const span = doc.createElement('span');
    span.classList.add('c');
    const a = doc.createElement('a');
    const b = doc.createElement('b');
    div.appendChild(span);
    span.appendChild(a);
    a.appendChild(b);

    const q1 = div.querySelector('span b');
    expect(q1.tagName).toBe('B');

    const q2 = div.querySelector('span.c b');
    expect(q2.tagName).toBe('B');
  });

  it('descendent, one deep', () => {
    const doc = new MockDocument();
    const div = doc.createElement('div');
    const span = doc.createElement('span');
    span.classList.add('c');
    const a = doc.createElement('a');
    div.appendChild(span);
    span.appendChild(a);

    const q1 = div.querySelector('span a');
    expect(q1.tagName).toBe('A');

    const q2 = div.querySelector('span.c a');
    expect(q2.tagName).toBe('A');
  });

  // Tests for selectors that previously didn't work with jQuery
  describe('modern CSS selectors', () => {
    it(':scope selector', () => {
      const doc = new MockDocument(`
        <div id="parent">
          <span class="child">direct</span>
          <div>
            <span class="nested">nested</span>
          </div>
        </div>
      `);

      const parent = doc.querySelector('#parent');
      // :scope > span should only match direct children
      const directChildren = parent?.querySelectorAll(':scope > span');
      expect(directChildren?.length).toBe(1);
      expect(directChildren?.[0].textContent).toBe('direct');
    });

    it(':is() selector', () => {
      const doc = new MockDocument(`
        <div>
          <h1>heading 1</h1>
          <h2>heading 2</h2>
          <p>paragraph</p>
        </div>
      `);

      const headings = doc.querySelectorAll(':is(h1, h2)');
      expect(headings?.length).toBe(2);
    });

    it(':where() selector', () => {
      const doc = new MockDocument(`
        <article>
          <p class="intro">intro</p>
          <p>normal</p>
        </article>
        <section>
          <p class="intro">section intro</p>
        </section>
      `);

      // :where() has zero specificity but should still match
      const intros = doc.querySelectorAll(':where(article, section) .intro');
      expect(intros.length).toBe(2);
    });

    it(':is() with complex selectors', () => {
      const doc = new MockDocument(`
        <div class="card">
          <button>card button</button>
        </div>
        <div class="modal">
          <button>modal button</button>
        </div>
        <div class="other">
          <button>other button</button>
        </div>
      `);

      const buttons = doc.querySelectorAll(':is(.card, .modal) button');
      expect(buttons.length).toBe(2);
    });

    it('combines :scope with other selectors', () => {
      const doc = new MockDocument(`
        <ul id="list">
          <li class="item">1</li>
          <li class="item active">2</li>
          <li class="item">3</li>
        </ul>
      `);

      const list = doc.querySelector('#list');
      const activeItems = list?.querySelectorAll(':scope > .item.active');
      expect(activeItems?.length).toBe(1);
      expect(activeItems?.[0].textContent).toBe('2');
    });
  });
});
