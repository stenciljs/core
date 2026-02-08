import {
  getInlineSourceMappingUrlLinker,
  getSourceMappingUrlForEndOfFile,
  getSourceMappingUrlLinker,
  rollupToStencilSourceMap,
} from '../index';
import { SourceMap as RollupSourceMap } from 'rollup';

import type * as d from '../../declarations';

describe('sourcemaps', () => {
  describe('rollupToStencilSourceMap', () => {
    it('returns null if the given sourcemap is null', () => {
      expect(rollupToStencilSourceMap(null)).toBeNull();
    });

    it('returns null if the given sourcemap is undefined', () => {
      expect(rollupToStencilSourceMap(undefined)).toBeNull();
    });

    it('returns null if the given sourcemap has no file', () => {
      expect(rollupToStencilSourceMap({ sourcesContent: [] } as RollupSourceMap)).toBeNull();
    });

    it('transforms a rollup sourcemap to a stencil sourcemap', () => {
      const rollupSourceMap: RollupSourceMap = {
        file: 'index.js',
        mappings: ';;AAAA;AAC9D,GAAG,CAAC,CAAC;AACL;;;;',
        names: ['bootstrapLazy'],
        sources: ['"@lazy-external-entrypoint?app-data=conditional"'],
        sourcesContent: [
          '/*\\n Stencil Client Patch Esm v0.0.0-dev.20210825190806 | MIT Licensed | https://stenciljs.com\\n */',
        ],
        version: 3,
        toString: () => 'stub',
        toUrl: () => 'stub',
      };

      const stencilSourceMap = rollupToStencilSourceMap(rollupSourceMap);

      const expectedSourceMap: d.SourceMap = {
        file: 'index.js',
        mappings: ';;AAAA;AAC9D,GAAG,CAAC,CAAC;AACL;;;;',
        names: ['bootstrapLazy'],
        sources: ['"@lazy-external-entrypoint?app-data=conditional"'],
        sourcesContent: [
          '/*\\n Stencil Client Patch Esm v0.0.0-dev.20210825190806 | MIT Licensed | https://stenciljs.com\\n */',
        ],
        version: 3,
      };
      expect(stencilSourceMap).toEqual(expectedSourceMap);
    });
  });

  describe('getSourceMappingUrlLinker', () => {
    it('returns a correctly formatted url', () => {
      expect(getSourceMappingUrlLinker('some-pkg')).toBe('//# sourceMappingURL=some-pkg');
    });

    it('handles question marks in URLs', () => {
      expect(getSourceMappingUrlLinker('some-pkg?')).toBe('//# sourceMappingURL=some-pkg%3F');
    });

    it('handles equal signs in URLs', () => {
      expect(getSourceMappingUrlLinker('some-pkg=')).toBe('//# sourceMappingURL=some-pkg%3D');
    });

    it('handles ampersands in URLs', () => {
      expect(getSourceMappingUrlLinker('some-pkg&')).toBe('//# sourceMappingURL=some-pkg%26');
    });

    it('handles slashes in URLs', () => {
      expect(getSourceMappingUrlLinker('some-pkg/')).toBe('//# sourceMappingURL=some-pkg%2F');
    });

    it('handles exclamation points in URLs', () => {
      expect(getSourceMappingUrlLinker('some-pkg!')).toBe('//# sourceMappingURL=some-pkg%21');
    });

    it('handles single quotes in URLs', () => {
      expect(getSourceMappingUrlLinker("some-'pkg'")).toBe('//# sourceMappingURL=some-%27pkg%27');
    });

    it('handles parenthesis in URLs', () => {
      expect(getSourceMappingUrlLinker('some-(pkg)')).toBe('//# sourceMappingURL=some-%28pkg%29');
    });

    it('handles asterisks in URLs', () => {
      expect(getSourceMappingUrlLinker('some-pkg*')).toBe('//# sourceMappingURL=some-pkg%2a');
    });

    it('encodes multiple disallowed characters at once', () => {
      expect(getSourceMappingUrlLinker('!some-(pkg)*')).toBe('//# sourceMappingURL=%21some-%28pkg%29%2a');
    });
  });

  describe('getInlineSourceMappingUrlLinker', () => {
    it('returns a correctly formatted sourcemap', () => {
      expect(
        getInlineSourceMappingUrlLinker(
          '{"version":3,"file":"sourcemaps.js","sourceRoot":"","sources":["sourcemaps.ts"],"names":[],"mappings":";;AAAA,mCAKgB;"}',
        ),
      ).toBe(
        '//# sourceMappingURL=data:application/json;charset=utf-8;base64,' +
          'eyJ2ZXJzaW9uIjozLCJmaWxlIjoic291cmNlbWFwcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNvdXJjZW1hcHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtQ0FLZ0I7In0=',
      );
    });

    it('handles question marks in sourcemaps', () => {
      expect(
        getInlineSourceMappingUrlLinker(
          '{"version":3,"file":"source?maps.js","sourceRoot":"","sources":["source?maps.ts"],"names":[],"mappings":";;AAAA,mCAKgB;"}',
        ),
      ).toBe(
        '//# sourceMappingURL=data:application/json;charset=utf-8;base64,' +
          'eyJ2ZXJzaW9uIjozLCJmaWxlIjoic291cmNlP21hcHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzb3VyY2U/bWFwcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUtnQjsifQ==',
      );
    });

    it('handles plus signs in sourcemaps', () => {
      expect(
        getInlineSourceMappingUrlLinker(
          '{"version":3,"file":"source+maps.js","sourceRoot":"","sources":["source+maps.ts"],"names":[],"mappings":";;AAAA,mCAKgB;"}',
        ),
      ).toBe(
        '//# sourceMappingURL=data:application/json;charset=utf-8;base64,' +
          'eyJ2ZXJzaW9uIjozLCJmaWxlIjoic291cmNlK21hcHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzb3VyY2UrbWFwcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUtnQjsifQ==',
      );
    });

    it('handles equal signs in sourcemaps', () => {
      expect(
        getInlineSourceMappingUrlLinker(
          '{"version":3,"file":"source=maps.js","sourceRoot":"","sources":["source=maps.ts"],"names":[],"mappings":";;AAAA,mCAKgB;"}',
        ),
      ).toBe(
        '//# sourceMappingURL=data:application/json;charset=utf-8;base64,' +
          'eyJ2ZXJzaW9uIjozLCJmaWxlIjoic291cmNlPW1hcHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzb3VyY2U9bWFwcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUtnQjsifQ==',
      );
    });

    it('handles ampersands in sourcemaps', () => {
      expect(
        getInlineSourceMappingUrlLinker(
          '{"version":3,"file":"source&maps.js","sourceRoot":"","sources":["source&maps.ts"],"names":[],"mappings":";;AAAA,mCAKgB;"}',
        ),
      ).toBe(
        '//# sourceMappingURL=data:application/json;charset=utf-8;base64,' +
          'eyJ2ZXJzaW9uIjozLCJmaWxlIjoic291cmNlJm1hcHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzb3VyY2UmbWFwcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUtnQjsifQ==',
      );
    });

    it('handles slashes in sourcemaps', () => {
      expect(
        getInlineSourceMappingUrlLinker(
          '{"version":3,"file":"source/maps.js","sourceRoot":"","sources":["source/maps.js.ts"],"names":[],"mappings":";;AAAA,mCAKgB;"}',
        ),
      ).toBe(
        '//# sourceMappingURL=data:application/json;charset=utf-8;base64,' +
          'eyJ2ZXJzaW9uIjozLCJmaWxlIjoic291cmNlL21hcHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzb3VyY2UvbWFwcy5qcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUtnQjsifQ==',
      );
    });

    it('handles exclamation points in sourcemaps', () => {
      expect(
        getInlineSourceMappingUrlLinker(
          '{"version":3,"file":"sourcemaps!.js","sourceRoot":"","sources":["sourcemaps!.ts"],"names":[],"mappings":";;AAAA,mCAKgB;"}',
        ),
      ).toBe(
        '//# sourceMappingURL=data:application/json;charset=utf-8;base64,' +
          'eyJ2ZXJzaW9uIjozLCJmaWxlIjoic291cmNlbWFwcyEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzb3VyY2VtYXBzIS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUtnQjsifQ==',
      );
    });

    it('handles single quotes in sourcemaps', () => {
      expect(
        getInlineSourceMappingUrlLinker(
          '{"version":3,"file":"source\'maps.js","sourceRoot":"","sources":["source\'maps.ts"],"names":[],"mappings":";;AAAA,mCAKgB;"}',
        ),
      ).toBe(
        '//# sourceMappingURL=data:application/json;charset=utf-8;base64,' +
          'eyJ2ZXJzaW9uIjozLCJmaWxlIjoic291cmNlJ21hcHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzb3VyY2UnbWFwcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUtnQjsifQ==',
      );
    });

    it('handles parenthesis in sourcemaps', () => {
      expect(
        getInlineSourceMappingUrlLinker(
          '{"version":3,"file":"source()maps.js","sourceRoot":"","sources":["source()maps.ts"],"names":[],"mappings":";;AAAA,mCAKgB;"}',
        ),
      ).toBe(
        '//# sourceMappingURL=data:application/json;charset=utf-8;base64,' +
          'eyJ2ZXJzaW9uIjozLCJmaWxlIjoic291cmNlKCltYXBzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic291cmNlKCltYXBzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbUNBS2dCOyJ9',
      );
    });

    it('handles asterisks in sourcemaps', () => {
      expect(
        getInlineSourceMappingUrlLinker(
          '{"version":3,"file":"source*maps.js","sourceRoot":"","sources":["source*maps.ts"],"names":[],"mappings":";;AAAA,mCAKgB;"}',
        ),
      ).toBe(
        '//# sourceMappingURL=data:application/json;charset=utf-8;base64,' +
          'eyJ2ZXJzaW9uIjozLCJmaWxlIjoic291cmNlKm1hcHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzb3VyY2UqbWFwcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUtnQjsifQ==',
      );
    });

    it('encodes multiple disallowed characters at once', () => {
      expect(
        getInlineSourceMappingUrlLinker(
          '{"version":3,"file":"!source(maps)*.js","sourceRoot":"","sources":["!source(maps)*.ts"],"names":[],"mappings":";;AAAA,mCAKgB;"}',
        ),
      ).toBe(
        '//# sourceMappingURL=data:application/json;charset=utf-8;base64,' +
          'eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIXNvdXJjZShtYXBzKSouanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIhc291cmNlKG1hcHMpKi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUtnQjsifQ==',
      );
    });
  });

  describe('getSourceMappingUrlLinkerWithNewline', () => {
    it('returns a correctly formatted url', () => {
      expect(getSourceMappingUrlForEndOfFile('some-pkg')).toBe('\n//# sourceMappingURL=some-pkg.map');
    });

    it('handles question marks in URLs', () => {
      expect(getSourceMappingUrlForEndOfFile('some-pkg?')).toBe('\n//# sourceMappingURL=some-pkg%3F.map');
    });

    it('handles equal signs in URLs', () => {
      expect(getSourceMappingUrlForEndOfFile('some-pkg=')).toBe('\n//# sourceMappingURL=some-pkg%3D.map');
    });

    it('handles ampersands in URLs', () => {
      expect(getSourceMappingUrlForEndOfFile('some-pkg&')).toBe('\n//# sourceMappingURL=some-pkg%26.map');
    });

    it('handles slashes in URLs', () => {
      expect(getSourceMappingUrlForEndOfFile('some-pkg/')).toBe('\n//# sourceMappingURL=some-pkg%2F.map');
    });

    it('handles exclamation points in URLs', () => {
      expect(getSourceMappingUrlForEndOfFile('some-pkg!')).toBe('\n//# sourceMappingURL=some-pkg%21.map');
    });

    it('handles single quotes in URLs', () => {
      expect(getSourceMappingUrlForEndOfFile("some-'pkg'")).toBe('\n//# sourceMappingURL=some-%27pkg%27.map');
    });

    it('handles parenthesis in URLs', () => {
      expect(getSourceMappingUrlForEndOfFile('some-(pkg)')).toBe('\n//# sourceMappingURL=some-%28pkg%29.map');
    });

    it('handles asterisks in URLs', () => {
      expect(getSourceMappingUrlForEndOfFile('some-pkg*')).toBe('\n//# sourceMappingURL=some-pkg%2a.map');
    });

    it('encodes multiple disallowed characters at once', () => {
      expect(getSourceMappingUrlForEndOfFile('!some-(pkg)*')).toBe('\n//# sourceMappingURL=%21some-%28pkg%29%2a.map');
    });
  });
});
