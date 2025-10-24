import { mockBuildCtx, mockValidatedConfig } from '@stencil/core/testing';
import * as util from '@utils';

import { getTextDocs } from '@utils';
import type * as d from '../../declarations';
import { stubDiagnostic } from '../../dev-server/test/Diagnostic.stub';

describe('util', () => {
  describe('generatePreamble', () => {
    it('generates a comment with a single line preamble', () => {
      const testConfig = mockValidatedConfig({ preamble: 'I am Stencil' });

      const result = util.generatePreamble(testConfig);

      expect(result).toBe(`/*!
 * I am Stencil
 */`);
    });

    it('generates a comment with a multi-line preamble', () => {
      const testConfig = mockValidatedConfig({ preamble: 'I am Stencil\nHear me roar' });

      const result = util.generatePreamble(testConfig);

      expect(result).toBe(`/*!
 * I am Stencil
 * Hear me roar
 */`);
    });

    it('returns an empty string if no preamble is provided', () => {
      const testConfig = mockValidatedConfig();

      const result = util.generatePreamble(testConfig);

      expect(result).toBe('');
    });

    it('returns an empty string a null preamble is provided', () => {
      const testConfig = mockValidatedConfig({ preamble: undefined });

      const result = util.generatePreamble(testConfig);

      expect(result).toBe('');
    });

    it('returns an empty string if an empty preamble is provided', () => {
      const testConfig = mockValidatedConfig({ preamble: '' });

      const result = util.generatePreamble(testConfig);

      expect(result).toBe('');
    });
  });

  describe('hasDependency', () => {
    let buildCtx: d.BuildCtx;

    beforeEach(() => {
      buildCtx = mockBuildCtx();
    });

    it("returns false when the packageJson field isn't set on the build context", () => {
      // this cast is done to specifically test the case where this is not the
      // expected type
      buildCtx.packageJson = null as unknown as d.PackageJsonData;

      expect(util.hasDependency(buildCtx, 'a-non-existent-pkg')).toBe(false);
    });

    it('returns false if a project has no dependencies', () => {
      buildCtx.packageJson.dependencies = undefined;

      expect(util.hasDependency(buildCtx, 'a-non-existent-pkg')).toBe(false);
    });

    it('returns false if a project has an empty list of dependencies', () => {
      buildCtx.packageJson.dependencies = {};

      expect(util.hasDependency(buildCtx, 'a-non-existent-pkg')).toBe(false);
    });

    it("returns false for '@stencil/core'", () => {
      buildCtx.packageJson.dependencies = { '@stencil/core': '2.0.0' };

      expect(util.hasDependency(buildCtx, '@stencil/core')).toBe(false);
    });

    it('returns true for a dependency match', () => {
      buildCtx.packageJson.dependencies = {
        'existent-pkg1': '1.0.0',
        'existent-pkg2': '2.0.0',
        'existent-pkg3': '3.0.0',
      };

      expect(util.hasDependency(buildCtx, 'existent-pkg2')).toBe(true);
    });

    it('is case sensitive in its lookup', () => {
      buildCtx.packageJson.dependencies = {
        'existent-pkg1': '1.0.0',
        'existent-pkg2': '2.0.0',
        'existent-pkg3': '3.0.0',
      };

      expect(util.hasDependency(buildCtx, 'EXISTENT-PKG2')).toBe(false);
    });
  });

  describe('isDtsFile', () => {
    it('should return true for .d.ts files', () => {
      expect(util.isDtsFile('.d.ts')).toEqual(true);
      expect(util.isDtsFile('foo.d.ts')).toEqual(true);
      expect(util.isDtsFile('foo/bar.d.ts')).toEqual(true);
    });

    it('should return false for all other file types', () => {
      expect(util.isDtsFile('.k.ts')).toEqual(false);
      expect(util.isDtsFile('foo.d.doc')).toEqual(false);
      expect(util.isDtsFile('foo/bar.txt')).toEqual(false);
      expect(util.isDtsFile('foo.spec.ts')).toEqual(false);
    });

    it('should be case insensitive', () => {
      expect(util.isDtsFile('foo/bar.D.tS')).toEqual(true);
    });
  });

  it('createJsVarName', () => {
    expect(util.createJsVarName('./scoped-style-import.css?tag=my-button&encapsulation=scoped')).toBe(
      'scopedStyleImportCss',
    );
    expect(util.createJsVarName('./scoped-style-import.css#hash')).toBe('scopedStyleImportCss');
    expect(util.createJsVarName('./scoped-style-import.css&data')).toBe('scopedStyleImportCss');
    expect(util.createJsVarName('./scoped-style-import.css=data')).toBe('scopedStyleImportCss');
    expect(util.createJsVarName('@ionic/core')).toBe('ionicCore');
    expect(util.createJsVarName('@ionic\\core')).toBe('ionicCore');
    expect(util.createJsVarName('88mph')).toBe('_88mph');
    expect(util.createJsVarName('Doc.brown&')).toBe('docBrown');
    expect(util.createJsVarName('  Doc!  Brown?  ')).toBe('docBrown');
    expect(util.createJsVarName('doc---Brown')).toBe('docBrown');
    expect(util.createJsVarName('doc-brown')).toBe('docBrown');
    expect(util.createJsVarName('DocBrown')).toBe('docBrown');
    expect(util.createJsVarName('Doc')).toBe('doc');
    expect(util.createJsVarName('doc')).toBe('doc');
    expect(util.createJsVarName('AB')).toBe('aB');
    expect(util.createJsVarName('Ab')).toBe('ab');
    expect(util.createJsVarName('a')).toBe('a');
    expect(util.createJsVarName('A')).toBe('a');
    expect(util.createJsVarName('    ')).toBe('');
    expect(util.createJsVarName('')).toBe('');
  });

  describe('parsePackageJson', () => {
    const mockPackageJsonPath = '/mock/path/package.json';

    it('returns a parse error if parsing cannot complete', () => {
      // improperly formatted JSON - note the lack of ':'
      const diagnostic = util.parsePackageJson('{ "someJson" "value"}', mockPackageJsonPath);

      const expectedDiagnostic: d.Diagnostic = stubDiagnostic({
        absFilePath: mockPackageJsonPath,
        header: 'Error Parsing JSON',
        messageText: expect.stringMatching(/.*in JSON at position 13/),
        type: 'build',
      });

      expect(diagnostic).toEqual<util.ParsePackageJsonResult>({
        diagnostic: expectedDiagnostic,
        data: null,
        filePath: mockPackageJsonPath,
      });
    });

    it('returns the parsed data from the provided json', () => {
      const diagnostic = util.parsePackageJson('{ "someJson": "value"}', mockPackageJsonPath);

      expect(diagnostic).toEqual<util.ParsePackageJsonResult>({
        diagnostic: null,
        data: {
          someJson: 'value',
        },
        filePath: mockPackageJsonPath,
      });
    });
  });

  describe('addDocBlock', () => {
    let str: string;
    let docs: d.CompilerJsDoc;

    beforeEach(() => {
      str = 'interface Foo extends Components.Foo, HTMLStencilElement {';
      docs = {
        tags: [{ name: 'deprecated', text: 'only for testing' }],
        text: 'Lorem ipsum',
      };
    });

    it('adds a doc block to the string', () => {
      expect(util.addDocBlock(str, docs)).toEqual(`/**
 * Lorem ipsum
 * @deprecated only for testing
 */
interface Foo extends Components.Foo, HTMLStencilElement {`);
    });

    it('indents the doc block correctly', () => {
      str = '    ' + str;
      expect(util.addDocBlock(str, docs, 4)).toEqual(`    /**
     * Lorem ipsum
     * @deprecated only for testing
     */
    interface Foo extends Components.Foo, HTMLStencilElement {`);
    });

    it('excludes the @internal tag', () => {
      docs.tags.push({ name: 'internal' });
      expect(util.addDocBlock(str, docs).includes('@internal')).toBeFalsy();
    });

    it('excludes empty lines', () => {
      docs.text = '';
      str = '    ' + str;
      expect(util.addDocBlock(str, docs, 4)).toEqual(`    /**
     * @deprecated only for testing
     */
    interface Foo extends Components.Foo, HTMLStencilElement {`);
    });

    it.each<[d.CompilerJsDoc | undefined]>([[undefined], [{ tags: [], text: '' }]])(
      'does not add a doc block when docs are empty (%j)',
      (docs) => {
        expect(util.addDocBlock(str, docs)).toEqual(str);
      },
    );
  });

  describe('isTsFile', () => {
    it.each(['.ts', 'foo.ts', 'foo.bar.ts', 'foo/bar.ts'])(
      'returns true for a file ending with .ts (%s)',
      (fileName) => {
        expect(util.isTsFile(fileName)).toEqual(true);
      },
    );

    it.each(['.tsx', 'foo.tsx', 'foo.bar.tsx', 'foo/bar.tsx'])(
      'returns false for a file ending with .tsx (%s)',
      (fileName) => {
        expect(util.isTsFile(fileName)).toEqual(false);
      },
    );

    it.each(['foo.js', 'foo.doc', 'foo.css', 'foo.html'])(
      'returns false for other a file with another extension (%s)',
      (fileName) => {
        expect(util.isTsFile(fileName)).toEqual(false);
      },
    );

    it('returns false for .d.ts and .d.tsx files', () => {
      expect(util.isTsFile('foo/bar.d.ts')).toEqual(false);
      expect(util.isTsFile('foo/bar.d.tsx')).toEqual(false);
    });

    it('returns true for a file named "spec.ts"', () => {
      expect(util.isTsFile('spec.ts')).toEqual(true);
    });

    it('returns true for a file named "d.ts"', () => {
      expect(util.isTsFile('d.ts')).toEqual(true);
    });

    it.each(['foo.tS', 'foo.Ts', 'foo.TS'])('returns true for non-lowercase extensions (%s)', (fileName) => {
      expect(util.isTsFile(fileName)).toEqual(true);
    });
  });

  describe('isJsFile', () => {
    it.each(['.js', 'foo.js', 'foo.bar.js', 'foo/bar.js'])(
      'returns true for a file ending with .js (%s)',
      (fileName) => {
        expect(util.isJsFile(fileName)).toEqual(true);
      },
    );

    it.each(['.jsx', 'foo.txt', 'foo/bar.css', 'foo.bar.html'])(
      'returns false for other a file with another extension (%s)',
      (fileName) => {
        expect(util.isJsFile(fileName)).toEqual(false);
      },
    );

    it('returns true for a file named "spec.js"', () => {
      expect(util.isJsFile('spec.js')).toEqual(true);
    });

    it.each(['foo.jS', 'foo.Js', 'foo.JS'])('returns true for non-lowercase extensions (%s)', (fileName) => {
      expect(util.isJsFile(fileName)).toEqual(true);
    });
  });

  describe('getTextDocs', () => {
    let docs: d.CompilerJsDoc;

    beforeEach(() => {
      docs = {
        tags: [],
        text: '',
      };
    });
    it('returns empty string for null or undefined', () => {
      expect(getTextDocs(null)).toBe('');
      expect(getTextDocs(undefined)).toBe('');
    });

    it('returns only main text if no tags', () => {
      docs = {
        text: 'Some doc text.',
        tags: [],
      };
      expect(getTextDocs(docs)).toBe('Some doc text.');
    });

    it('replaces line breaks in main text with spaces', () => {
      docs = {
        text: 'Line 1\nLine 2\r\nLine 3',
        tags: [],
      };
      expect(getTextDocs(docs)).toBe('Line 1 Line 2 Line 3');
    });

    it('filters out internal tags and escapes "*/" in text and tags', () => {
      docs = {
        text: 'This text ends with */ sequence.',
        tags: [
          { name: 'internal', text: 'should be removed' },
          { name: 'default', text: "'*/*'" },
          { name: 'deprecated', text: 'Use something else' },
        ],
      };

      const result = getTextDocs(docs);

      // Should replace "*/" with "*\/" (single backslash)
      expect(result).toContain('This text ends with *\\/ sequence.');

      // @internal tag filtered out
      expect(result).not.toContain('@internal');

      // @default and @deprecated tags included and escaped
      expect(result).toContain("@default '*\\/*'");
      expect(result).toContain('@deprecated Use something else');

      // Main text and tags separated by new lines
      const lines = result.split('\n');
      expect(lines[0]).toBe('This text ends with *\\/ sequence.');
      expect(lines).toContain("@default '*\\/*'");
      expect(lines).toContain('@deprecated Use something else');
    });

    it('trims the result', () => {
      docs = {
        text: '  Some text with spaces  ',
        tags: [],
      };
      expect(getTextDocs(docs)).toBe('Some text with spaces');
    });
  });
});
