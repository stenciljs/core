import { MockDocument } from '../document';
import { MockElement } from '../node';
import { PROBLEMATIC_SELECTORS } from '../selector';

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
    expect(p.closest('div')).toBe(div);
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
    expect(p.closest('div#my-id')).toBe(null);
  });

  it('matches, tag/class/id', () => {
    const elm = new MockElement(null, 'h1');
    elm.classList.add('my-class');
    elm.id = 'my-id';
    expect(elm.matches('h1.my-class#my-id')).toBe(true);
  });

  it('no matches, tag/class/id', () => {
    const elm = new MockElement(null, 'h1');
    expect(elm.matches('h1.my-class#my-id')).toBe(false);
  });

  it('matches, tag', () => {
    const elm = new MockElement(null, 'h1');
    expect(elm.matches('h1')).toBe(true);
  });

  it('no matches, tag', () => {
    const elm = new MockElement(null, 'h1');
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
    expect(checkbox.id).toBe('checkbox');
  });

  it('find input[checked=true][disabled]', () => {
    const doc = new MockDocument(`
      <input checked="true" disabled id="checkbox">
    `);

    const checkbox = doc.querySelector('input[checked=true][disabled]');
    expect(checkbox.id).toBe('checkbox');
  });

  it('find input[checked=true]', () => {
    const doc = new MockDocument(`
      <input checked="true" id="checkbox">
    `);

    const checkbox = doc.querySelector('input[checked=true]');
    expect(checkbox.id).toBe('checkbox');
  });

  it('find input[checked]', () => {
    const doc = new MockDocument(`
      <input checked id="checkbox">
    `);

    const checkbox = doc.querySelector('input[checked]');
    expect(checkbox.id).toBe('checkbox');
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
    expect(div.outerHTML).toBe('<div>1</div>');
  });

  it('find one tag name', () => {
    const doc = new MockDocument(`
      <div>1</div>
      <nav>2</nav>
    `);

    const div = doc.querySelector('div');
    expect(div.outerHTML).toBe('<div>1</div>');

    const nav = doc.querySelector('nav');
    expect(nav.outerHTML).toBe('<nav>2</nav>');
  });

  it('finds child', () => {
    const doc = new MockDocument(`
      <div>
        <span></span>
      </div>
    `);

    const span = doc.querySelector('div > span');
    expect(span.outerHTML).toBe('<span></span>');
  });

  it('finds child if multiple children', () => {
    const doc = new MockDocument(`
      <div>
        <a></a>
        <span></span>
      </div>
    `);

    const span = doc.querySelector('div > span');
    expect(span.outerHTML).toBe('<span></span>');
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
    expect(span.outerHTML).toBe('<div class="inner"></div>');
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

  it.each(PROBLEMATIC_SELECTORS)("should error for '%p' selector", (selector) => {
    const doc = new MockDocument();

    const expectedMessage = [
      `At present jQuery does not support the ${selector} selector.`,
      'If you need this in your test, consider writing an end-to-end test instead.',
      `Syntax error, unrecognized expression: unsupported pseudo: ${selector.replace(':', '')}`,
    ].join('\n');

    expect(() => doc.querySelector(selector)).toThrow(expectedMessage);
    expect(() => doc.querySelectorAll(selector)).toThrow(expectedMessage);
    expect(() => doc.matches(selector)).toThrow(expectedMessage);
  });

  it('should error for combinations of problematic selectors', () => {
    const doc = new MockDocument();
    expect(() => {
      doc.querySelector(':scope :is');
    }).toThrow(
      [
        `At present jQuery does not support the :scope and :is selectors.`,
        'If you need this in your test, consider writing an end-to-end test instead.',
        `Syntax error, unrecognized expression: unsupported pseudo: scope`,
      ].join('\n'),
    );

    expect(() => {
      doc.querySelector(':is :where');
    }).toThrow(
      [
        `At present jQuery does not support the :where and :is selectors.`,
        'If you need this in your test, consider writing an end-to-end test instead.',
        `Syntax error, unrecognized expression: unsupported pseudo: is`,
      ].join('\n'),
    );

    expect(() => {
      doc.querySelector(':scope :is :where');
    }).toThrow(
      [
        `At present jQuery does not support the :scope, :where and :is selectors.`,
        'If you need this in your test, consider writing an end-to-end test instead.',
        `Syntax error, unrecognized expression: unsupported pseudo: scope`,
      ].join('\n'),
    );
  });
});
