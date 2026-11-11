import { expect, describe, it } from '@stencil/vitest';
import type * as d from '@stencil/core';
import type { SourceMap as RolldownSourceMap } from 'rolldown';

import {
  getInlineSourceMappingUrlLinker,
  getRolldownSourceMapOptions,
  getSourceMappingUrlForEndOfFile,
  getSourceMappingUrlLinker,
  relativizeSourceMap,
  rolldownToStencilSourceMap,
} from '../index';

describe('sourcemaps', () => {
  describe('rolldownToStencilSourceMap', () => {
    it('returns null if the given sourcemap is null', () => {
      expect(rolldownToStencilSourceMap(null)).toBeNull();
    });

    it('returns null if the given sourcemap is undefined', () => {
      expect(rolldownToStencilSourceMap(undefined)).toBeNull();
    });

    it('returns null if the given sourcemap has no file', () => {
      expect(rolldownToStencilSourceMap({ sourcesContent: [] } as RolldownSourceMap)).toBeNull();
    });

    it('transforms a rolldown sourcemap to a stencil sourcemap', () => {
      const rolldownSourceMap: RolldownSourceMap = {
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

      const stencilSourceMap = rolldownToStencilSourceMap(rolldownSourceMap);

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
      expect(getSourceMappingUrlLinker('!some-(pkg)*')).toBe(
        '//# sourceMappingURL=%21some-%28pkg%29%2a',
      );
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
      expect(getSourceMappingUrlForEndOfFile('some-pkg')).toBe(
        '\n//# sourceMappingURL=some-pkg.map',
      );
    });

    it('handles question marks in URLs', () => {
      expect(getSourceMappingUrlForEndOfFile('some-pkg?')).toBe(
        '\n//# sourceMappingURL=some-pkg%3F.map',
      );
    });

    it('handles equal signs in URLs', () => {
      expect(getSourceMappingUrlForEndOfFile('some-pkg=')).toBe(
        '\n//# sourceMappingURL=some-pkg%3D.map',
      );
    });

    it('handles ampersands in URLs', () => {
      expect(getSourceMappingUrlForEndOfFile('some-pkg&')).toBe(
        '\n//# sourceMappingURL=some-pkg%26.map',
      );
    });

    it('handles slashes in URLs', () => {
      expect(getSourceMappingUrlForEndOfFile('some-pkg/')).toBe(
        '\n//# sourceMappingURL=some-pkg%2F.map',
      );
    });

    it('handles exclamation points in URLs', () => {
      expect(getSourceMappingUrlForEndOfFile('some-pkg!')).toBe(
        '\n//# sourceMappingURL=some-pkg%21.map',
      );
    });

    it('handles single quotes in URLs', () => {
      expect(getSourceMappingUrlForEndOfFile("some-'pkg'")).toBe(
        '\n//# sourceMappingURL=some-%27pkg%27.map',
      );
    });

    it('handles parenthesis in URLs', () => {
      expect(getSourceMappingUrlForEndOfFile('some-(pkg)')).toBe(
        '\n//# sourceMappingURL=some-%28pkg%29.map',
      );
    });

    it('handles asterisks in URLs', () => {
      expect(getSourceMappingUrlForEndOfFile('some-pkg*')).toBe(
        '\n//# sourceMappingURL=some-pkg%2a.map',
      );
    });

    it('encodes multiple disallowed characters at once', () => {
      expect(getSourceMappingUrlForEndOfFile('!some-(pkg)*')).toBe(
        '\n//# sourceMappingURL=%21some-%28pkg%29%2a.map',
      );
    });
  });
  describe('getRolldownSourceMapOptions', () => {
    const transform = (exists: boolean) => {
      const config = {
        sourceMap: true,
        sys: { accessSync: () => exists },
      } as unknown as d.ValidatedConfig;
      return getRolldownSourceMapOptions(config).sourcemapPathTransform as (
        relativeSourcePath: string,
        sourcemapPath: string,
      ) => string;
    };

    it('hides the comment when source maps are on', () => {
      const config = { sourceMap: true, sys: {} } as unknown as d.ValidatedConfig;
      expect(getRolldownSourceMapOptions(config).sourcemap).toBe('hidden');
    });

    it('turns source maps off', () => {
      const config = { sourceMap: false, sys: {} } as unknown as d.ValidatedConfig;
      expect(getRolldownSourceMapOptions(config).sourcemap).toBe(false);
    });

    it('makes a source absolute and strips its query', () => {
      expect(transform(true)('../src/cmp.css?tag=cmp-a', '/root/dist/cmp.js.map')).toBe(
        '/root/src/cmp.css',
      );
    });

    it('keeps the id of a virtual module', () => {
      // Rolldown resolves a virtual id against its cwd, relative to the default `dist` dir
      const mapPath = `${process.cwd()}/dist/runtime.js.map`;
      expect(transform(false)('../@stencil/core/app-data', mapPath)).toBe('@stencil/core/app-data');
    });
  });

  describe('relativizeSourceMap', () => {
    const sourceMap: d.SourceMap = {
      file: 'module.js',
      mappings: 'AAAA',
      names: [],
      sources: ['/root/src/cmp.tsx', '@stencil/core/app-data'],
      sourcesContent: ['', ''],
      version: 3,
    };

    it('makes absolute sources relative to the written file', () => {
      expect(
        relativizeSourceMap(sourceMap, '/root/dist/loader-bundle/esm/cmp.entry.js').sources,
      ).toEqual(['../../../src/cmp.tsx', '@stencil/core/app-data']);
      expect(relativizeSourceMap(sourceMap, '/root/www/build/cmp.entry.js').sources).toEqual([
        '../../src/cmp.tsx',
        '@stencil/core/app-data',
      ]);
    });

    it('names the written file', () => {
      expect(relativizeSourceMap(sourceMap, '/root/www/build/cmp.entry.js').file).toBe(
        'cmp.entry.js',
      );
    });
  });
});
