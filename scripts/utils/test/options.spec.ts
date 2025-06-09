import path from 'path';

import { BuildOptions, getOptions } from '../options';
import * as Vermoji from '../vermoji';

describe('release options', () => {
  describe('getOptions', () => {
    const ROOT_DIR = path.join(__dirname, '../../..');
    // Friday, February 24, 2023 2:42:09.123 PM, GMT
    const FAKE_SYSTEM_TIME_MS = 1677249729123;
    const FAKE_SYSTEM_TIME_S = FAKE_SYSTEM_TIME_MS.toString(10).slice(0, -3);

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(FAKE_SYSTEM_TIME_MS);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns the correct default value', () => {
      const buildOpts = getOptions(ROOT_DIR);

      expect(buildOpts).toEqual<BuildOptions>({
        buildDir: path.join(ROOT_DIR, 'build'),
        // More focused tests for `buildId` can be found in another testing suite in this file
        buildId: expect.any(String),
        bundleHelpersDir: path.join(ROOT_DIR, 'scripts', 'esbuild', 'helpers'),
        changelogPath: path.join(ROOT_DIR, 'CHANGELOG.md'),
        ghRepoName: 'stencil',
        ghRepoOrg: 'ionic-team',
        isCI: false,
        isProd: false,
        isPublishRelease: false,
        isWatch: false,
        nodeModulesDir: path.join(ROOT_DIR, 'node_modules'),
        output: {
          cliDir: path.join(ROOT_DIR, 'cli'),
          compilerDir: path.join(ROOT_DIR, 'compiler'),
          devServerDir: path.join(ROOT_DIR, 'dev-server'),
          internalDir: path.join(ROOT_DIR, 'internal'),
          mockDocDir: path.join(ROOT_DIR, 'mock-doc'),
          screenshotDir: path.join(ROOT_DIR, 'screenshot'),
          sysNodeDir: path.join(ROOT_DIR, 'sys', 'node'),
          testingDir: path.join(ROOT_DIR, 'testing'),
        },
        // reads in package.json, skip it verifying it
        packageJson: expect.any(Object),
        packageJsonPath: path.join(ROOT_DIR, 'package.json'),
        packageLockJsonPath: path.join(ROOT_DIR, 'package-lock.json'),
        rootDir: ROOT_DIR,
        scriptsBuildDir: path.join(ROOT_DIR, 'scripts', 'build'),
        scriptsBundlesDir: path.join(ROOT_DIR, 'scripts', 'esbuild'),
        scriptsDir: path.join(ROOT_DIR, 'scripts'),
        srcDir: path.join(ROOT_DIR, 'src'),
        tag: 'dev',
        typescriptDir: path.join(ROOT_DIR, 'node_modules', 'typescript'),
        typescriptLibDir: path.join(ROOT_DIR, 'node_modules', 'typescript', 'lib'),
        vermoji: '💎',
        // More focused tests for `version` can be found in another testing suite in this file
        version: expect.any(String),
        jqueryVersion: expect.any(String),
        parse5Version: expect.any(String),
        terserVersion: expect.any(String),
        rollupVersion: expect.any(String),
        typescriptVersion: expect.any(String),
      });
    });

    describe('buildId', () => {
      it('defaults the buildId if none is provided', () => {
        const { buildId } = getOptions(ROOT_DIR);

        expect(buildId).toBeDefined();
        expect(buildId).toBe(FAKE_SYSTEM_TIME_S);
      });

      it('uses the provided the buildId', () => {
        const expectedBuildId = 'test-build-id';
        const { buildId } = getOptions(ROOT_DIR, { buildId: expectedBuildId });

        expect(buildId).toBeDefined();
        expect(buildId).toBe(expectedBuildId);
      });
    });

    describe('version', () => {
      it('defaults the version if none is provided', () => {
        const { version } = getOptions(ROOT_DIR);

        expect(version).toBeDefined();
        // Expect a version string with the format 0.0.0-dev-[EPOCH_TIME]-[GIT_SHA_7_CHARS]
        // or, contain a possible pre-release string like 0.0.0-beta.0-dev-[EPOCH_TIME]-[GIT_SHA_7_CHARS]

        expect(version).toMatch(new RegExp(`\\d+\\.\\d+\\.\\d+(-(.{1,}))?-dev.${FAKE_SYSTEM_TIME_S}.\\w{7}`));
      });

      it('uses the provided version', () => {
        const expectedVersion = '3.0.0-dev-1234';
        const { version } = getOptions(ROOT_DIR, { version: expectedVersion });

        expect(version).toBeDefined();
        expect(version).toBe(expectedVersion);
      });
    });

    describe('publish + prod check', () => {
      it("throws an error if 'isPublishRelease' is set, but Stencil is not built for 'isProd'", () => {
        expect(() => getOptions(ROOT_DIR, { isProd: false, isPublishRelease: true })).toThrow(
          'release must also be a prod build',
        );
      });

      it.each<Partial<BuildOptions>>([
        { isProd: false },
        { isPublishRelease: false },
        { isProd: false, isPublishRelease: false },
        { isProd: true, isPublishRelease: false },
        { isProd: true, isPublishRelease: true },
      ])("does not throw an error for other combinations of 'isPublishRelease' and 'isProd'", (buildOpts) => {
        expect(() => getOptions(ROOT_DIR, buildOpts)).not.toThrow();
      });
    });

    describe('vermoji', () => {
      let getVermojiSpy: jest.SpyInstance<ReturnType<typeof Vermoji.getVermoji>, Parameters<typeof Vermoji.getVermoji>>;

      beforeEach(() => {
        getVermojiSpy = jest.spyOn(Vermoji, 'getVermoji');
        getVermojiSpy.mockImplementation((_changelogPath) => '🧀');
      });

      afterEach(() => {
        getVermojiSpy.mockRestore();
      });

      it('defaults to 💎 for non-prod builds', () => {
        expect(getOptions(ROOT_DIR).vermoji).toBe('💎');
      });

      it.each<Partial<BuildOptions>>([
        { isProd: true, vermoji: '🦄' },
        { isProd: false, vermoji: '🦄' },
      ])("uses the provided vermoji, regardless of 'isProd'", () => {
        const expectedVermoji = '🦄';
        const { vermoji } = getOptions(ROOT_DIR, { vermoji: expectedVermoji });
        expect(vermoji).toEqual('🦄');
      });

      it('picks a new vermoji when none is provided for prod builds', () => {
        const { vermoji } = getOptions(ROOT_DIR, { isProd: true });
        expect(vermoji).toEqual('🧀');
      });
    });
  });
});
