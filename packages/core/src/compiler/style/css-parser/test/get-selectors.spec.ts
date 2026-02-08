import { getCssSelectors } from '../get-css-selectors';

describe('getCssSelectors', () => {
  it('attribute containing selector', () => {
    const s = getCssSelectors('pre[class*="language-"]');

    expect(s.tags).toHaveLength(1);
    expect(s.tags[0]).toBe('pre');

    expect(s.attrs).toHaveLength(1);
    expect(s.attrs[0]).toBe('class');

    expect(s.classNames).toHaveLength(0);
    expect(s.ids).toHaveLength(0);
  });

  it('should get complex selectors', () => {
    const s = getCssSelectors('button.my-button#id[attr="value"]::before > + ~ @ button:not(.label)');

    expect(s.tags).toHaveLength(2);
    expect(s.tags[0]).toBe('button');
    expect(s.tags[1]).toBe('button');

    expect(s.attrs).toHaveLength(1);
    expect(s.attrs[0]).toBe('attr');

    expect(s.classNames).toHaveLength(1);
    expect(s.classNames[0]).toBe('my-button');

    expect(s.ids).toHaveLength(1);
    expect(s.ids[0]).toBe('id');
  });

  it('should not get selectors in :not()', () => {
    const s = getCssSelectors('div:not(.my-class)');

    expect(s.tags).toHaveLength(1);
    expect(s.tags[0]).toBe('div');

    expect(s.classNames).toHaveLength(0);
  });

  it('should get attrs selectors', () => {
    const s = getCssSelectors('[attr-a][attr-b="value"] div[AtTr-c]');

    expect(s.attrs).toHaveLength(3);
    expect(s.attrs[0]).toBe('attr-a');
    expect(s.attrs[1]).toBe('attr-b');
    expect(s.attrs[2]).toBe('attr-c');
  });

  it('should get id selectors', () => {
    const s = getCssSelectors('#id-a div#ID-b');

    expect(s.ids).toHaveLength(2);
    expect(s.ids[0]).toBe('id-a');
    expect(s.ids[1]).toBe('ID-b');
  });

  it('should get class selectors', () => {
    const s = getCssSelectors('.class-a.class-b div.ClAsS-c');

    expect(s.classNames).toHaveLength(3);
    expect(s.classNames[0]).toBe('class-a');
    expect(s.classNames[1]).toBe('class-b');
    expect(s.classNames[2]).toBe('ClAsS-c');
  });
});
