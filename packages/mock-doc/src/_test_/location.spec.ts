import { describe, it, expect, beforeEach } from '@stencil/vitest';

import { MockWindow } from '../window';

describe('location default', () => {
  it('has a valid href before any navigation, like a real browser tab', () => {
    const win = new MockWindow(`<html></html>`);
    expect(win.location.href).toBe('http://localhost/');
    expect(win.location.origin).toBe('http://localhost');
  });

  it('supports relative URL resolution against the default href', () => {
    const win = new MockWindow(`<html></html>`);
    expect(new URL('/foo', win.location.href).href).toBe('http://localhost/foo');
  });
});

describe('location.href', () => {
  let win: MockWindow;
  beforeEach(() => {
    win = new MockWindow(`
      <html>
        <head>
        </head>
      </head>
      `);
    win.location.href = 'http://stencil:secret@stenciljs.com:3000/path/to/page?var=var#hash';
  });

  it('window.location.href', () => {
    expect(win.location.href).toBe(
      'http://stencil:secret@stenciljs.com:3000/path/to/page?var=var#hash',
    );
  });
  it('window.location.protocol', () => {
    expect(win.location.protocol).toBe('http:');
  });
  it('window.location.host', () => {
    expect(win.location.host).toBe('stenciljs.com:3000');
  });
  it('window.location.hostname', () => {
    expect(win.location.hostname).toBe('stenciljs.com');
  });
  it('window.location.port', () => {
    expect(win.location.port).toBe('3000');
  });
  it('window.location.pathname', () => {
    expect(win.location.pathname).toBe('/path/to/page');
  });
  it('window.location.search', () => {
    expect(win.location.search).toBe('?var=var');
  });
  it('window.location.hash', () => {
    expect(win.location.hash).toBe('#hash');
  });
  it('window.location.username', () => {
    expect(win.location.username).toBe('stencil');
  });
  it('window.location.password', () => {
    expect(win.location.password).toBe('secret');
  });
  it('window.location.origin', () => {
    expect(win.location.origin).toBe('http://stenciljs.com:3000');
  });
});

describe('location', () => {
  let win: MockWindow;
  beforeEach(() => {
    win = new MockWindow(`
      <html>
        <head>
        </head>
      </head>
      `);
    win.location = 'http://stencil:secret@stenciljs.com:3000/path/to/page?var=var#hash';
  });

  it('window.location.href', () => {
    expect(win.location.href).toBe(
      'http://stencil:secret@stenciljs.com:3000/path/to/page?var=var#hash',
    );
  });
  it('window.location.protocol', () => {
    expect(win.location.protocol).toBe('http:');
  });
  it('window.location.host', () => {
    expect(win.location.host).toBe('stenciljs.com:3000');
  });
  it('window.location.hostname', () => {
    expect(win.location.hostname).toBe('stenciljs.com');
  });
  it('window.location.port', () => {
    expect(win.location.port).toBe('3000');
  });
  it('window.location.pathname', () => {
    expect(win.location.pathname).toBe('/path/to/page');
  });
  it('window.location.search', () => {
    expect(win.location.search).toBe('?var=var');
  });
  it('window.location.hash', () => {
    expect(win.location.hash).toBe('#hash');
  });
  it('window.location.username', () => {
    expect(win.location.username).toBe('stencil');
  });
  it('window.location.password', () => {
    expect(win.location.password).toBe('secret');
  });
  it('window.location.origin', () => {
    expect(win.location.origin).toBe('http://stenciljs.com:3000');
  });
});
