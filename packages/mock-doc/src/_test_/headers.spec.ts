import { MockHeaders } from '../headers';

describe('MockHeaders', () => {
  const Headers = MockHeaders;

  it('init from object', () => {
    const headers = new Headers({
      'x-header-a': 1,
      'x-header-A': 2,
      'x-header-b': 3,
    });
    expect(headers.get('x-header-a')).toBe('1, 2');
    expect(headers.get('x-header-b')).toBe('3');
  });

  it('init tuples', () => {
    const headers = new Headers([
      new Set(['x-header-a', '1']),
      ['x-header-b', '2'],
      new Map([
        ['X-header-A', null],
        ['3', null],
      ]).keys(),
      new Set(['x-header-c', '4']),
    ]);
    expect(headers.get('x-header-a')).toBe('1, 3');
    expect(headers.get('x-header-b')).toBe('2');
    expect(headers.get('x-header-c')).toBe('4');
  });

  it('init from Headers', () => {
    const headersA = new Headers({
      'x-header-a': 1,
      'x-header-A': 2,
      'x-header-b': 3,
    });
    const headersB = new Headers(headersA);
    expect(headersB.get('x-header-a')).toBe('1, 2');
    expect(headersB.get('x-header-b')).toBe('3');
  });

  it('append/get', () => {
    const headers = new Headers();
    headers.append('x-header', '1');
    headers.append('x-header', '2');
    headers.append('X-HEADER', '3');
    const output = headers.get('x-header');
    expect(output).toBe('1, 2, 3');
  });

  it('set/get', () => {
    const headers = new Headers();
    headers.set('x-header', '1');
    headers.set('x-header', '2');
    headers.set('X-HEADER', '3');
    const output = headers.get('x-header');
    expect(output).toBe('3');
  });

  it('delete', () => {
    const headers = new Headers();
    headers.append('x-header', '1');
    headers.delete('x-header');
    const output = headers.get('x-header');
    expect(output).toBe(null);
  });

  it('delete different cases', () => {
    const headers = new Headers();
    headers.append('x-header', '1');
    headers.append('X-HEADER', '2');
    headers.append('x-HEAdEr', '3');
    headers.delete('x-header');
    const output1 = headers.get('x-header');
    const output2 = headers.get('X-HEADER');
    const output3 = headers.get('x-HEAdEr');
    expect(output1).toBe(null);
    expect(output2).toBe(null);
    expect(output3).toBe(null);
  });

  it('keys', () => {
    const headers = new Headers();
    headers.append('x-header', '1');
    headers.append('x-header', '2');
    headers.append('X-HEADER', '3');
    const o = Array.from(headers.keys());
    expect(o).toEqual(['x-header']);
  });

  it('values', () => {
    const headers = new Headers();
    headers.append('x-header', '1');
    headers.append('x-header', '2');
    headers.append('X-HEADER', '2');
    const o = Array.from(headers.values());
    expect(o).toEqual(['1', '2', '2']);
  });

  it('entries', () => {
    const headers = new Headers();
    headers.append('x-header-a', '1');
    headers.append('x-header-a', '2');
    headers.append('X-HEADER-A', '3');
    headers.append('x-header-b', 'a');
    headers.append('x-header-b', 'b');
    headers.append('X-HEADER-B', 'c');
    const o1 = Array.from(headers.entries());
    const o2 = Array.from(headers);
    expect(o1).toEqual([
      ['x-header-a', '1, 2, 3'],
      ['x-header-b', 'a, b, c'],
    ]);
    expect(o2).toEqual([
      ['x-header-a', '1, 2, 3'],
      ['x-header-b', 'a, b, c'],
    ]);
  });

  it('forEach', () => {
    const headers = new Headers();
    headers.append('x-header-a', '1');
    headers.append('x-header-a', '2');
    headers.append('X-HEADER-A', '3');
    headers.append('x-header-b', 'a');
    headers.append('x-header-b', 'b');
    headers.append('X-HEADER-B', 'c');
    const o: [string, string][] = [];
    headers.forEach((v, k) => {
      o.push([v, k]);
    });
    expect(o).toEqual([
      ['1, 2, 3', 'x-header-a'],
      ['a, b, c', 'x-header-b'],
    ]);
  });
});
