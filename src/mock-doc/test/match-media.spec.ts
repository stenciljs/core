import { MockWindow } from '../window';

describe('matchMedia', () => {
  let win: MockWindow;
  let media: ReturnType<MockWindow['matchMedia']>;
  beforeEach(() => {
    win = new MockWindow(`
      <html>
        <head>
        </head>
      </head>
      `);
    media = win.matchMedia('(prefers-color-scheme: dark)');
  });

  it('MediaQueryList.media', () => {
    expect(media.media).toBe('(prefers-color-scheme: dark)');
  });
  it('MediaQueryList.matches', () => {
    expect(media.matches).toBe(false);
  });
  it('MediaQueryList.addListener', () => {
    expect(media.addListener).toBeDefined();
  });
  it('MediaQueryList.removeListener', () => {
    expect(media.removeListener).toBeDefined();
  });
  it('MediaQueryList.addEventListener', () => {
    expect(media.addEventListener).toBeDefined();
  });
  it('MediaQueryList.removeEventListener', () => {
    expect(media.removeEventListener).toBeDefined();
  });
  it('MediaQueryList.dispatchEvent', () => {
    expect(media.dispatchEvent).toBeDefined();
  });
  it('MediaQueryList.onchange', () => {
    expect(media.onchange).toBe(null);
  });
});
