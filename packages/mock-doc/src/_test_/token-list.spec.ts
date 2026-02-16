import { MockTokenList } from '../token-list';
import { MockDocument } from '../document';
import { MockElement } from '../node';

describe('token-list', () => {
  let tokenList: MockTokenList;
  beforeEach(() => {
    const doc = new MockDocument();
    const el = new MockElement(doc, 'div');
    tokenList = new MockTokenList(el as any, 'class');
  });

  it('add and remove tokens', () => {
    tokenList.add('one');
    tokenList.add('two', 'three');
    tokenList.add(null);
    tokenList.add(undefined);
    tokenList.add(1 as any, 2 as any);
    expect(tokenList.toString()).toEqual('one two three null undefined 1 2');

    expect(tokenList.contains('one')).toBe(true);
    expect(tokenList.contains('two')).toBe(true);
    expect(tokenList.contains('three')).toBe(true);
    expect(tokenList.contains('null')).toBe(true);
    expect(tokenList.contains(null)).toBe(true);
    expect(tokenList.contains('undefined')).toBe(true);
    expect(tokenList.contains('1')).toBe(true);
    expect(tokenList.contains(2 as any)).toBe(true);

    tokenList.remove('one');
    tokenList.remove('two', 'three');
    tokenList.remove(null);
    tokenList.remove(undefined);
    tokenList.remove(1 as any, 2 as any);

    expect(tokenList.toString()).toEqual('');
  });

  it('should throw if empty', () => {
    expect(() => {
      tokenList.add('');
    }).toThrow();
    expect(() => {
      tokenList.remove('');
    }).toThrow();
  });

  it('should throw if has spaces', () => {
    expect(() => {
      tokenList.add('');
    }).toThrow();
    expect(() => {
      tokenList.remove(' ');
    }).toThrow();
  });
});
