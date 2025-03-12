import { isJsFile, isTsFile } from '@utils';

describe('resolve-utils', () => {
  describe('isTsFile', () => {
    it.each(['.ts', 'foo.ts', 'foo.bar.ts', 'foo/bar.ts'])(
      'returns true for a file ending with .ts (%s)',
      (fileName) => {
        expect(isTsFile(fileName)).toEqual(true);
      },
    );

    it.each(['.tsx', 'foo.tsx', 'foo.bar.tsx', 'foo/bar.tsx'])(
      'returns false for a file ending with .tsx (%s)',
      (fileName) => {
        expect(isTsFile(fileName)).toEqual(false);
      },
    );

    it.each(['foo.js', 'foo.doc', 'foo.css', 'foo.html'])(
      'returns false for other a file with another extension (%s)',
      (fileName) => {
        expect(isTsFile(fileName)).toEqual(false);
      },
    );

    it('returns false for .d.ts and .d.tsx files', () => {
      expect(isTsFile('foo/bar.d.ts')).toEqual(false);
      expect(isTsFile('foo/bar.d.tsx')).toEqual(false);
    });

    it('returns true for a file named "spec.ts"', () => {
      expect(isTsFile('spec.ts')).toEqual(true);
    });

    it('returns true for a file named "d.ts"', () => {
      expect(isTsFile('d.ts')).toEqual(true);
    });

    it.each(['foo.tS', 'foo.Ts', 'foo.TS', 'foo.d.Ts', 'foo.d.tS', 'foo.d.TS', 'foo.D.TS'])(
      'returns false for non-lowercase extensions (%s)',
      (fileName) => {
        expect(isTsFile(fileName)).toEqual(false);
      },
    );
  });

  describe('isJsFile', () => {
    it.each(['.js', 'foo.js', 'foo.bar.js', 'foo/bar.js'])(
      'returns true for a file ending with .js (%s)',
      (fileName) => {
        expect(isJsFile(fileName)).toEqual(true);
      },
    );

    it.each(['.jsx', 'foo.txt', 'foo/bar.css', 'foo.bar.html'])(
      'returns false for other a file with another extension (%s)',
      (fileName) => {
        expect(isJsFile(fileName)).toEqual(false);
      },
    );

    it('returns true for a file named "spec.js"', () => {
      expect(isJsFile('spec.js')).toEqual(true);
    });

    it.each(['foo.jS', 'foo.Js', 'foo.JS'])('returns false for non-lowercase extensions (%s)', (fileName) => {
      expect(isJsFile(fileName)).toEqual(false);
    });
  });
});
