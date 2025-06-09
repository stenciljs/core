import { execSync } from 'child_process';
import { readFileSync } from 'fs-extra';
import { join } from 'path';

import { getVermoji } from './vermoji';
import { PackageData } from './write-pkg-json';

/**
 * Retrieves information used during a 'process' that requires knowledge of various project file paths, Stencil version
 * information, and GitHub repo metadata. A 'process' may include, but is not limited to:
 * - generating a new release
 * - regenerating a license file
 * - validating a build
 * @param rootDir the root directory of the project
 * @param inputOpts any build options to override manually
 * @returns an entity containing various fields to be used by some process
 */
export function getOptions(rootDir: string, inputOpts: Partial<BuildOptions> = {}): BuildOptions {
  const srcDir = join(rootDir, 'src');
  const packageJsonPath = join(rootDir, 'package.json');
  const packageLockJsonPath = join(rootDir, 'package-lock.json');
  const changelogPath = join(rootDir, 'CHANGELOG.md');
  const nodeModulesDir = join(rootDir, 'node_modules');
  const typescriptDir = join(nodeModulesDir, 'typescript');
  const typescriptLibDir = join(typescriptDir, 'lib');
  const buildDir = join(rootDir, 'build');
  const scriptsDir = join(rootDir, 'scripts');
  const scriptsBuildDir = join(scriptsDir, 'build');
  const scriptsBundlesDir = join(scriptsDir, 'esbuild');
  const bundleHelpersDir = join(scriptsBundlesDir, 'helpers');
  const packageJson: PackageData = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  const buildId = inputOpts.buildId ?? getBuildId();
  const version = inputOpts.version ?? getDevVersionId({ buildId, semverVersion: packageJson?.version });

  const vermoji =
    inputOpts.isProd && !inputOpts.vermoji
      ? getVermoji(inputOpts.changelogPath ?? changelogPath)
      : inputOpts.vermoji ?? '💎';

  const typescriptPkg = require(join(typescriptDir, 'package.json'));
  const typescriptVersion = typescriptPkg.version;

  const terserPkg = getPkg(nodeModulesDir, 'terser');
  const terserVersion = terserPkg.version;

  const rollupPkg = getPkg(nodeModulesDir, 'rollup');
  const rollupVersion = rollupPkg.version;

  const parse5Pkg = getPkg(nodeModulesDir, 'parse5');
  const parse5Version = parse5Pkg.version;

  const jqueryPkg = getPkg(nodeModulesDir, 'jquery');
  const jqueryVersion = jqueryPkg.version;

  const opts: BuildOptions = {
    ghRepoOrg: 'ionic-team',
    ghRepoName: 'stencil',
    rootDir,
    srcDir,
    packageJsonPath,
    packageLockJsonPath,
    changelogPath,
    nodeModulesDir,
    typescriptDir,
    typescriptLibDir,
    packageJson,
    buildDir,
    scriptsDir,
    scriptsBuildDir,
    scriptsBundlesDir,
    bundleHelpersDir,
    output: {
      cliDir: join(rootDir, 'cli'),
      compilerDir: join(rootDir, 'compiler'),
      devServerDir: join(rootDir, 'dev-server'),
      internalDir: join(rootDir, 'internal'),
      mockDocDir: join(rootDir, 'mock-doc'),
      screenshotDir: join(rootDir, 'screenshot'),
      sysNodeDir: join(rootDir, 'sys', 'node'),
      testingDir: join(rootDir, 'testing'),
    },
    version,
    buildId,
    isProd: false,
    isCI: false,
    isWatch: false,
    isPublishRelease: false,
    vermoji,
    tag: 'dev',
    jqueryVersion,
    parse5Version,
    rollupVersion,
    terserVersion,
    typescriptVersion,
  };

  Object.assign(opts, inputOpts);

  if (opts.isPublishRelease) {
    if (!opts.isProd) {
      throw new Error('release must also be a prod build');
    }
  }

  return opts;
}

/**
 * Generates an object containing versioning information of various packages
 * installed at build time
 *
 * **NOTE** this will mutate the `opts` parameter, adding information about
 * the versions used for various dependencies
 *
 * @param opts the options being used during a build
 * @returns an object that contains package names/versions installed at the time a build was invoked
 */
export function createReplaceData(opts: BuildOptions): Record<string, any> {
  const CACHE_BUSTER = 7;

  const typescriptPkg = require(join(opts.typescriptDir, 'package.json'));
  const transpileId = typescriptPkg.name + typescriptPkg.version + '_' + CACHE_BUSTER;

  const terserPkg = getPkg(opts.nodeModulesDir, 'terser');
  const minifyJsId = terserPkg.name + terserPkg.version + '_' + CACHE_BUSTER;

  const rollupPkg = getPkg(opts.nodeModulesDir, 'rollup');
  const bundlerId = rollupPkg.name + rollupPkg.version + '_' + CACHE_BUSTER;

  const autoprefixerPkg = getPkg(opts.nodeModulesDir, 'autoprefixer');
  const postcssPkg = getPkg(opts.nodeModulesDir, 'postcss');

  const optimizeCssId =
    autoprefixerPkg.name + autoprefixerPkg.version + '_' + postcssPkg.name + postcssPkg.version + '_' + CACHE_BUSTER;

  return {
    __BUILDID__: opts.buildId,
    '__BUILDID:BUNDLER__': bundlerId,
    '__BUILDID:MINIFYJS__': minifyJsId,
    '__BUILDID:OPTIMIZECSS__': optimizeCssId,
    '__BUILDID:TRANSPILE__': transpileId,

    '__VERSION:STENCIL__': opts.version,
    '__VERSION:PARSE5__': opts.parse5Version,
    '__VERSION:ROLLUP__': opts.rollupVersion,
    '__VERSION:JQUERY__': opts.jqueryVersion,
    '__VERSION:TERSER__': opts.terserVersion,
    '__VERSION:TYPESCRIPT__': opts.typescriptVersion,

    __VERMOJI__: opts.vermoji,
  };
}

type VersionedPackageData = PackageData & { version: string };

/**
 * Retrieves a package from the `node_modules` directory in the given `opts` parameter
 * @param nodeModulesDir the node modules directory to search
 * @param pkgName the name of the NPM package to retrieve
 * @returns information about the retrieved package
 */
function getPkg(nodeModulesDir: string, pkgName: string): VersionedPackageData {
  const packageJson = require(join(nodeModulesDir, pkgName, 'package.json'));
  if (!packageJson.version) {
    throw Error(`Didn't find a version in the packageJson for ${pkgName}!`);
  }
  return packageJson;
}

export interface BuildOptions {
  buildDir: string;
  bundleHelpersDir: string;
  ghRepoName: string;
  ghRepoOrg: string;
  nodeModulesDir: string;
  rootDir: string;
  scriptsBuildDir: string;
  scriptsBundlesDir: string;
  scriptsDir: string;
  srcDir: string;
  typescriptDir: string;
  typescriptLibDir: string;

  output: {
    cliDir: string;
    compilerDir: string;
    devServerDir: string;
    internalDir: string;
    mockDocDir: string;
    screenshotDir: string;
    sysNodeDir: string;
    testingDir: string;
  };

  buildId: string;
  changelogPath: string;
  isCI: boolean;
  isProd: boolean;
  isPublishRelease: boolean;
  isWatch: boolean;
  jqueryVersion: string;
  packageJson: PackageData;
  packageJsonPath: string;
  packageLockJsonPath: string;
  parse5Version: string;
  rollupVersion: string;
  tag: string;
  terserVersion: string;
  typescriptVersion: string;
  vermoji: string;
  version: string;
}

/**
 * Generate a build identifier, which is the Epoch Time in seconds
 * @returns the generated build ID
 */
function getBuildId(): string {
  return Date.now().toString(10).slice(0, -3);
}

/**
 * Describes the contents of a version string for Stencil used in 'non-production' builds (e.g. a one-off dev build)
 */
interface DevVersionContents {
  /**
   * The build identifier string, used to uniquely identify when the build was generated
   */
  buildId: string;
  /**
   * A semver-compliant string to add to the one-off build version sting, used to identify a base version of Stencil
   * that was used in the build.
   */
  semverVersion: string | undefined;
}

/**
 * Helper function to return the first seven characters of a git SHA
 *
 * We use the first seven characters for two reasons:
 * 1. Seven characters _should_ be enough to uniquely ID a commit in Stencil
 * 2. It matches the number of characters used in our CHANGELOG.md
 *
 * @returns the seven character SHA
 */
function getSevenCharGitSha(): string {
  return execSync('git rev-parse HEAD').toString().trim().slice(0, 7);
}

/**
 * Helper function to generate a dev build version string of the format:
 *
 * [BASE_VERSION]-dev.[BUILD_IDENTIFIER].[GIT_SHA]
 *
 * where:
 * - BASE_VERSION is the version of Stencil currently assigned in `package.json`
 * - BUILD_IDENTIFIER is a unique identifier for this particular build
 * - GIT_SHA is the SHA of the HEAD of the branch this build was created from
 *
 * @param devVersionContents an object containing the necessary arguments to build a dev-version identifier
 * @returns the generated version string
 */
function getDevVersionId(devVersionContents: DevVersionContents): string {
  const { buildId, semverVersion } = devVersionContents;
  // if `package.json#package` is empty, default to a value that doesn't imply any particular version of Stencil
  const version = semverVersion ?? '0.0.0';
  // '-' and '-dev.' are a magic substrings that may get checked on startup of a Stencil process.
  return version + '-dev.' + buildId + '.' + getSevenCharGitSha();
}
