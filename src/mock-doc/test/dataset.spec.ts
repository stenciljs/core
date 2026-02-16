import { createDocument } from '../document';

describe('dataset', () => {
  const doc = createDocument();
  let elm: HTMLElement;

  beforeEach(() => {
    elm = doc.createElement('div');
  });

  it('get dataset object', () => {
    elm.dataset.milesPerHour = '88';
    expect(elm.dataset).toEqual({
      milesPerHour: '88',
    });
  });

  it('get dataset from attr set', () => {
    elm.setAttribute('data-miles-per-hour', '88');
    expect(elm.dataset.milesPerHour).toBe('88');
  });

  it('get dataset', () => {
    elm.dataset.milesPerHour = 88 as any;
    expect(elm.dataset.milesPerHour).toBe('88');
  });

  it('set data dash case attr with bracket notation', () => {
    elm.dataset['milesPerHour'] = '88';
    expect(elm.getAttribute('data-miles-per-hour')).toBe('88');
  });

  it('set data dash case attr', () => {
    elm.dataset.milesPerHour = '88';
    expect(elm.getAttribute('data-miles-per-hour')).toBe('88');
    expect(elm.dataset).toEqual({
      milesPerHour: '88',
    });
  });

  it('set data attr', () => {
    elm.dataset.mph = '88';
    expect(elm.getAttribute('data-mph')).toBe('88');
  });

  it('set data attr with bracket notation', () => {
    elm.dataset['mph'] = '88';
    expect(elm.getAttribute('data-mph')).toBe('88');
  });
});
