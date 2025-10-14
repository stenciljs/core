import { MockPartList } from '../part-list';
import { MockDocument } from '../document';
import { MockElement } from '../node';

describe('part-list', () => {
  let partList: MockPartList;
  beforeEach(() => {
    const doc = new MockDocument();
    const el = new MockElement(doc, 'div');
    partList = new MockPartList(el as any);
  });

  it('add and remove parts', () => {
    partList.add('one');
    partList.add('two', 'three');
    partList.add(null);
    partList.add(undefined);
    partList.add(1 as any, 2 as any);
    expect(partList.toString()).toEqual('one two three null undefined 1 2');

    expect(partList.contains('one')).toBe(true);
    expect(partList.contains('two')).toBe(true);
    expect(partList.contains('three')).toBe(true);
    expect(partList.contains('null')).toBe(true);
    expect(partList.contains(null)).toBe(true);
    expect(partList.contains('undefined')).toBe(true);
    expect(partList.contains('1')).toBe(true);
    expect(partList.contains(2 as any)).toBe(true);

    partList.remove('one');
    partList.remove('two', 'three');
    partList.remove(null);
    partList.remove(undefined);
    partList.remove(1 as any, 2 as any);

    expect(partList.toString()).toEqual('');
  });

  it('should throw if empty', () => {
    expect(() => {
      partList.add('');
    }).toThrow();
    expect(() => {
      partList.remove('');
    }).toThrow();
  });

  it('should throw if has spaces', () => {
    expect(() => {
      partList.add('');
    }).toThrow();
    expect(() => {
      partList.remove(' ');
    }).toThrow();
  });
});