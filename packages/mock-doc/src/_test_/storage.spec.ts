import { MockWindow } from '../window';

describe('storage', () => {
  let win: MockWindow;
  beforeEach(() => {
    win = new MockWindow();
  });

  it('localStorage should return proper values', () => {
    expect(win.localStorage.getItem('key')).toEqual(null);

    win.localStorage.setItem('key', null);
    expect(win.localStorage.getItem('key')).toEqual('null');

    win.localStorage.setItem('key', undefined);
    expect(win.localStorage.getItem('key')).toEqual('null');

    win.localStorage.setItem('key', 12 as any);
    expect(win.localStorage.getItem('key')).toEqual('12');

    win.localStorage.setItem('key', 'value');
    expect(win.localStorage.getItem('key')).toEqual('value');
  });

  it('should remove value', () => {
    win.localStorage.setItem('key', 'value');
    win.localStorage.removeItem('key');
    expect(win.localStorage.getItem('key')).toEqual(null);
  });

  it('should not crash if removing twice', () => {
    win.localStorage.setItem('key', 'value');
    win.localStorage.removeItem('key');
    win.localStorage.removeItem('key');
    win.localStorage.removeItem('foo');
    expect(win.localStorage.getItem('key')).toEqual(null);
    expect(win.localStorage.getItem('foo')).toEqual(null);
  });

  it('should clear all', () => {
    win.localStorage.setItem('key', 'value');
    win.localStorage.setItem('foo', 'bar');
    expect(win.localStorage.getItem('key')).toEqual('value');
    expect(win.localStorage.getItem('foo')).toEqual('bar');

    win.localStorage.clear();
    expect(win.localStorage.getItem('key')).toEqual(null);
    expect(win.localStorage.getItem('foo')).toEqual(null);
  });

  it('should cast keys to string all', () => {
    win.localStorage.setItem('12', 'value');
    win.localStorage.setItem(12 as any, 'bar');
    expect(win.localStorage.getItem('12')).toEqual('bar');
    expect(win.localStorage.getItem(12 as any)).toEqual('bar');
  });
});
