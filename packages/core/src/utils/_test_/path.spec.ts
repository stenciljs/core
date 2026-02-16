import { join, normalize, normalizeFsPathQuery, normalizePath, relative, resolve } from '../path';

describe('normalizePath', () => {
  it('node module', () => {
    expect(normalizePath('lodash')).toBe('lodash');
    expect(normalizePath('   lodash    ')).toBe('lodash');
    expect(normalizePath('@angular/core')).toBe('@angular/core');
  });

  it('empty', () => {
    expect(normalizePath('')).toBe('.');
    expect(normalizePath('.')).toBe('.');
    expect(normalizePath('..')).toBe('..');
    expect(normalizePath('./')).toBe('.');
    expect(normalizePath('./././')).toBe('.');
  });

  it('relative ./ posix', () => {
    expect(normalizePath('./dir/basename.ext')).toBe('./dir/basename.ext');
    expect(normalizePath('./dir')).toBe('./dir');
  });

  it('relative ./ win32', () => {
    expect(normalizePath('.\\dir\\basename.ext')).toBe('./dir/basename.ext');
    expect(normalizePath('.\\dir')).toBe('./dir');
  });

  it('relative ../ posix', () => {
    expect(normalizePath('../dir/basename.ext')).toBe('../dir/basename.ext');
    expect(normalizePath('../../dir/basename.ext')).toBe('../../dir/basename.ext');
    expect(normalizePath('../dir1/dir2')).toBe('../dir1/dir2');
  });

  it('relative ../ win32', () => {
    expect(normalizePath('..\\dir\\basename.ext')).toBe('../dir/basename.ext');
    expect(normalizePath('..\\..\\dir\\basename.ext')).toBe('../../dir/basename.ext');
    expect(normalizePath('..\\dir1\\dir2')).toBe('../dir1/dir2');
  });

  it('absolute posix', () => {
    expect(normalizePath('/dir/basename.ext')).toBe('/dir/basename.ext');
    expect(normalizePath('/dir')).toBe('/dir');
    expect(normalizePath('/./dir')).toBe('/dir');
  });

  it('relative, no dot', () => {
    expect(normalizePath('foo/bar.ts')).toBe('./foo/bar.ts');
    expect(normalizePath('foo/bar.ts', false)).toBe('foo/bar.ts');
    expect(normalizePath('foo\\bar.ts')).toBe('./foo/bar.ts');
    expect(normalizePath('foo\\bar.ts', false)).toBe('foo/bar.ts');
  });

  it('absolute win32', () => {
    expect(normalizePath('C:\\dir\\basename.ext')).toBe('C:/dir/basename.ext');
    expect(normalizePath('C:\\dir')).toBe('C:/dir');
  });

  it('non-ascii', () => {
    expect(normalizePath('/中文/basename.ext')).toBe('/中文/basename.ext');
    expect(normalizePath('C:\\中文\\basename.ext')).toBe('C:/中文/basename.ext');
  });

  it('remove trailing slash, windows', () => {
    const path = normalizePath(`C:\\Johnny\\B\\Goode\\`);
    expect(path).toBe(`C:/Johnny/B/Goode`);
  });

  it('normalize file, windows', () => {
    const path = normalizePath(`C:\\Johnny\\B\\Goode.js`);
    expect(path).toBe(`C:/Johnny/B/Goode.js`);
  });

  it('not remove trailing slash for root dir, windows', () => {
    const path = normalizePath(`C:\\`);
    expect(path).toBe(`C:/`);
  });

  it('not remove trailing slash for root dir, unix', () => {
    const path = normalizePath(`/`);
    expect(path).toBe(`/`);
  });

  it('remove trailing slash, unix', () => {
    const path = normalizePath(`/Johnny/B/Goode/`);
    expect(path).toBe(`/Johnny/B/Goode`);
  });

  it('normalize file, unix', () => {
    const path = normalizePath(`/Johnny/B/Goode.js`);
    expect(path).toBe(`/Johnny/B/Goode.js`);
  });

  it('normalize file with spaces to trim', () => {
    const path = normalizePath(`    /Johnny/B/Goode.js    `);
    expect(path).toBe(`/Johnny/B/Goode.js`);
  });

  it('throw error when invalid string', () => {
    expect(() => {
      // this test deliberately uses a value whose type does not conform to the function signature's type definition to
      // ensure non-string's throw an error, requiring us to place a type assertion in the function call below
      const path = normalizePath(null as unknown as string);
      expect(path).toBe(`/Johnny/B/Goode.js`);
    }).toThrow();
  });
});

describe('normalizeFsPathQuery', () => {
  it('format query', () => {
    const p = normalizeFsPathQuery(`/Johnny/B/Goode.js?format=text`);
    expect(p.filePath).toBe(`/Johnny/B/Goode.js`);
    expect(p.format).toBe('text');
    expect(p.ext).toBe(`js`);
  });

  it('any query', () => {
    const p = normalizeFsPathQuery(`/Johnny/B/Goode.svg?a=1&b=2&c=3`);
    expect(p.filePath).toBe(`/Johnny/B/Goode.svg`);
    expect(p.format).toBe(null);
    expect(p.ext).toBe(`svg`);
  });

  it('no query', () => {
    const p = normalizeFsPathQuery(`/Johnny/B/Goode.js`);
    expect(p.filePath).toBe(`/Johnny/B/Goode.js`);
    expect(p.format).toBe(null);
    expect(p.ext).toBe(`js`);
  });

  it('no ext', () => {
    const p = normalizeFsPathQuery(`/Johnny/B/Goode`);
    expect(p.filePath).toBe(`/Johnny/B/Goode`);
    expect(p.format).toBe(null);
    expect(p.ext).toBe(null);
  });

  describe('wrapped nodejs path functions', () => {
    it('join should always return a POSIX path', () => {
      expect(join('foo')).toBe('foo');
      expect(join('foo/')).toBe('foo');
      expect(join('foo', 'bar')).toBe('foo/bar');
      expect(join('foo', 'bar', '/')).toBe('foo/bar');
      expect(join('foo', '/', 'bar')).toBe('foo/bar');
      expect(join('foo', '/', '/', 'bar')).toBe('foo/bar');
      expect(join('..', 'foo', 'bar.ts')).toBe('../foo/bar.ts');
      expect(join('foo', '..', 'bar.ts')).toBe('bar.ts');
      expect(join('.', 'foo', 'bar.ts')).toBe('foo/bar.ts');
    });

    it('relative should always return a POSIX path', () => {
      expect(relative('.', 'foo/bar')).toBe('foo/bar');
      expect(relative('foo/bar', '..')).toBe('../../..');
      expect(relative('foo', 'foo/bar/file.js')).toBe('bar/file.js');
      expect(relative('foo/bar', 'foo/bar/file.js')).toBe('file.js');
      expect(relative('foo/bar/baz', 'foo/bar/boz')).toBe('../boz');
      expect(relative('foo/bar/file.js', 'foo/bar/file.js')).toBe('.');
      expect(relative('.', '../foo/bar')).toBe('../foo/bar');
    });

    it('resolve should always return a POSIX path', () => {
      expect(resolve('.')).toBe(normalizePath(process.cwd()));
      expect(resolve('foo/bar/baz')).toBe(join(normalizePath(process.cwd()), 'foo/bar/baz'));
      expect(resolve('foo\\bar\\baz')).toBe(join(normalizePath(process.cwd()), 'foo/bar/baz'));
    });

    it('normalize should always return a POSIX path', () => {
      expect(normalize('')).toBe('.');
      expect(normalize('.')).toBe('.');
      expect(normalize('..')).toBe('..');
      expect(normalize('/')).toBe('/');
      expect(normalize('\\')).toBe('/');
      // these examples taken from
      // https://nodejs.org/api/path.html#pathnormalizepath
      expect(normalize('\\temp\\\\foo\\bar\\..\\')).toBe('/temp/foo');
      expect(normalize('/temp/foo//bar/../')).toBe('/temp/foo');
      expect(normalize('/foo/bar//baz/asdf/quux/..')).toBe('/foo/bar/baz/asdf');
    });
  });
});
