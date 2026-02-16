/// <reference types="vitest/globals" />

import { expect, describe, it } from '@stencil/vitest';
import { buildError } from '../../../utils';
import { LazyDependencies, NodeLazyRequire } from '../node-lazy-require';
import { NodeResolveModule } from '../node-resolve-module';
import fs from 'graceful-fs';

vi.mock('graceful-fs', () => ({
  default: {
    readFileSync: vi.fn(),
  },
}));

vi.mock('../node-resolve-module', () => ({
  NodeResolveModule: class {
    resolveModule = vi.fn().mockReturnValue('/fake/path/to/jest/package.json');
  },
}));

const mockPackageJson = (version: string) => JSON.stringify({ version });

describe('node-lazy-require', () => {
  describe('NodeLazyRequire', () => {
    describe('ensure', () => {

      const jestTestRange = (maxVersion = '38.0.1'): LazyDependencies => ({
        jest: {
          minVersion: '2.0.7',
          recommendedVersion: '36.0.1',
          maxVersion,
        },
      });

      function setup(versionRange: LazyDependencies) {
        const resolveModule = new NodeResolveModule();
        const nodeLazyRequire = new NodeLazyRequire(resolveModule, versionRange);
        return nodeLazyRequire;
      }

      it.each(['2.0.7', '10.10.10', '38.0.1', '38.0.2', '38.5.17'])(
        'should not error if installed package has a suitable major version (%p)',
        async (testVersion) => {
          const nodeLazyRequire = setup(jestTestRange());
          vi.mocked(fs.readFileSync).mockReturnValue(mockPackageJson(testVersion));
          const diagnostics = await nodeLazyRequire.ensure('.', ['jest']);
          expect(diagnostics.length).toBe(0);
        },
      );

      it.each(['2.0.7', '10.10.10', '36.0.1', '38.0.2', '38.5.17'])(
        'should never error with versions above minVersion if there is no maxVersion supplied (%p)',
        async (testVersion) => {
          const nodeLazyRequire = setup(jestTestRange(undefined));
          vi.mocked(fs.readFileSync).mockReturnValue(mockPackageJson(testVersion));
          const diagnostics = await nodeLazyRequire.ensure('.', ['jest']);
          expect(diagnostics.length).toBe(0);
        },
      );

      it.each(['38', undefined])('should error w/ installed version too low and maxVersion=%p', async (maxVersion) => {
        const range = jestTestRange(maxVersion);
        const nodeLazyRequire = setup(range);
        vi.mocked(fs.readFileSync).mockReturnValue(mockPackageJson('1.1.1'));
        const [error] = await nodeLazyRequire.ensure('.', ['jest']);
        expect(error).toEqual({
          ...buildError([]),
          header: 'Please install supported versions of dev dependencies with either npm or yarn.',
          messageText: `npm install --save-dev jest@${range.jest.recommendedVersion}`,
        });
      });

      it.each(['100.1.1', '38.0.1-alpha.0'])(
        'should error if the installed version of a package is too high (%p)',
        async (version) => {
          const range = jestTestRange();
          const nodeLazyRequire = setup(range);
          vi.mocked(fs.readFileSync).mockReturnValue(mockPackageJson(version));
          const [error] = await nodeLazyRequire.ensure('.', ['jest']);
          expect(error).toEqual({
            ...buildError([]),
            header: 'Please install supported versions of dev dependencies with either npm or yarn.',
            messageText: `npm install --save-dev jest@${range.jest.recommendedVersion}`,
          });
        },
      );
    });
  });
});
