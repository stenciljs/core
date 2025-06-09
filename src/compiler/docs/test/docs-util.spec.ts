import { isHexColor, MarkdownTable } from '../../docs/readme/docs-util';

describe('markdown-table', () => {
  it('header', () => {
    const t = new MarkdownTable();
    t.addHeader(['Column 1', 'Column 22', 'Column\n333']);
    t.addRow(['Text 1', 'Text 2']);
    const o = t.toMarkdown();
    expect(o).toEqual([
      '| Column 1 | Column 22 | Column 333 |',
      '| -------- | --------- | ---------- |',
      '| Text 1   | Text 2    |            |',
    ]);
  });

  it('longest column', () => {
    const t = new MarkdownTable();
    t.addRow(['Text aa', 'Text b', 'Text c']);
    t.addRow(['Text a', 'Text bb', 'Text c']);
    t.addRow(['Text a', 'Text bb', 'Text cc']);
    const o = t.toMarkdown();
    expect(o).toEqual([
      '| Text aa | Text b  | Text c  |',
      '| Text a  | Text bb | Text c  |',
      '| Text a  | Text bb | Text cc |',
    ]);
  });

  it('3 columns', () => {
    const t = new MarkdownTable();
    t.addRow(['Text 1', 'Text 2', 'Text 3']);
    const o = t.toMarkdown();
    expect(o).toEqual(['| Text 1 | Text 2 | Text 3 |']);
  });

  it('one column', () => {
    const t = new MarkdownTable();
    t.addRow(['Text']);
    const o = t.toMarkdown();
    expect(o).toEqual(['| Text |']);
  });

  it('do nothing', () => {
    const t = new MarkdownTable();
    const o = t.toMarkdown();
    expect(o).toEqual([]);
  });
});

describe('isHexColor', () => {
  it('should return true for valid hex colors', () => {
    expect(isHexColor('#FFF')).toBe(true);
    expect(isHexColor('#FFFFFF')).toBe(true);
    expect(isHexColor('#000000')).toBe(true);
    expect(isHexColor('#f0f0f0')).toBe(true);
    expect(isHexColor('#aBcDeF')).toBe(true);
  });

  it('should return false for invalid hex colors', () => {
    expect(isHexColor('FFF')).toBe(false);
    expect(isHexColor('#GGGGGG')).toBe(false);
    expect(isHexColor('#FF')).toBe(false);
    expect(isHexColor('#FFFFFFF')).toBe(false);
    expect(isHexColor('#FF0000FF')).toBe(false);
  });

  it('should return false for non-string inputs', () => {
    expect(isHexColor('123')).toBe(false);
    expect(isHexColor('true')).toBe(false);
    expect(isHexColor('{}')).toBe(false);
    expect(isHexColor('[]')).toBe(false);
  });
});
