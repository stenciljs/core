import color from 'ansi-colors';
import fs from 'fs-extra';
import { join } from 'path';
import semver from 'semver';

import { BuildOptions } from './options';

export const SEMVER_INCREMENTS: ReadonlyArray<string> = [
  'patch',
  'minor',
  'major',
  'prepatch',
  'preminor',
  'premajor',
  'prerelease',
];

export const PRERELEASE_VERSIONS: ReadonlyArray<string> = ['prepatch', 'preminor', 'premajor', 'prerelease'];

/**
 * Helper function to help determine if a version is valid semver
 * @param input the version string to validate
 * @returns true if the `input` is valid semver, false otherwise
 */
export const isValidVersion = (input: string) => Boolean(semver.valid(input));

/**
 * Determines whether or not a version string is valid. A version string is considered to be 'valid' if it meets one of
 * two criteria:
 * - it is a valid semver name (e.g. 'patch', 'major', etc.)
 * - it is a valid semver string (e.g. '1.0.2')
 * @param input the version string to validate
 * @returns true if the string is valid, false otherwise
 */
export const isValidVersionInput = (input: string): boolean =>
  SEMVER_INCREMENTS.indexOf(input) !== -1 || isValidVersion(input);

/**
 * Determines if the provided `version` is a semver pre-release or not
 * @param version the version string to evaluate
 * @returns true if the `version` is a pre-release, false otherwise
 */
export const isPrereleaseVersion = (version: string): boolean =>
  PRERELEASE_VERSIONS.indexOf(version) !== -1 || Boolean(semver.prerelease(version));

/**
 * Determine the 'next' version string for a release. The next version can take one of two formats:
 * 1. An alphabetic string that is a valid semver name (e.g. 'patch', 'major', etc.)
 * 2. A valid semver string (e.g. '1.0.2')
 * The value returned by this function is predicated on the format of `oldVersion`. If `oldVersion` is an alphabetic
 * semver name, a semver name will be returned (e.g. 'major'). If a valid semver string is provided (e.g. 1.0.2), the
 * incremented semver string will be returned (e.g. 2.0.0)
 * @param oldVersion the old/current version of the library
 * @param input the desired increment unit
 * @returns new version's string
 */
export function getNewVersion(oldVersion: string, input: any): string {
  if (!isValidVersionInput(input)) {
    throw new Error(`Version should be either ${SEMVER_INCREMENTS.join(', ')} or a valid semver version.`);
  }

  return SEMVER_INCREMENTS.indexOf(input) === -1 ? input : semver.inc(oldVersion, input);
}

/**
 * Pretty printer for a new version of the library. Generates a new version string based on `inc`
 * @param oldVersion the old/current version of Stencil
 * @param inc the unit of increment for the new version
 * @returns a pretty printed string containing the new version number
 */
export function prettyVersionDiff(oldVersion: string, inc: any): string {
  const newVersion = getNewVersion(oldVersion, inc).split('.');
  const splitOldVersion = oldVersion.split('.');
  let firstVersionChange = false;
  const output = [];

  for (let i = 0; i < newVersion.length; i++) {
    if (newVersion[i] !== splitOldVersion[i] && !firstVersionChange) {
      output.push(`${color.dim.cyan(newVersion[i])}`);
      firstVersionChange = true;
    } else if (newVersion[i].indexOf('-') >= 1) {
      let preVersion = [];
      preVersion = newVersion[i].split('-');
      output.push(`${color.dim.cyan(`${preVersion[0]}-${preVersion[1]}`)}`);
    } else {
      output.push(color.reset.dim(newVersion[i]));
    }
  }
  return output.join(color.reset.dim('.'));
}

/**
 * Write changes to the local CHANGELOG.md on disk.
 *
 * Stencil uses the Angular-variant of conventional commits; commits must be formatted accordingly in order to be added
 * to the changelog properly.
 * @param opts build options to be used to update the changelog
 */
export async function updateChangeLog(opts: BuildOptions): Promise<void> {
  const ccPath = join(opts.nodeModulesDir, '.bin', 'conventional-changelog');
  const ccConfigPath = join(__dirname, 'conventional-changelog-config.js');
  const { execa } = await import('execa');
  // API Docs for conventional-changelog: https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-core#api
  await execa(
    'node',
    [
      ccPath,
      '--preset',
      'angular',
      '--infile',
      opts.changelogPath,
      '--outfile',
      '--same-file',
      '--config',
      ccConfigPath,
    ],
    {
      cwd: opts.rootDir,
    },
  );

  let changelog = await fs.readFile(opts.changelogPath, 'utf8');
  changelog = changelog.replace(/\# \[/, '# ' + opts.vermoji + ' [');
  await fs.writeFile(opts.changelogPath, changelog);
}

/**
 * Generate a GitHub release and create it. This function assumes that the CHANGELOG.md file has been written to disk.
 * @param opts build options to be used to create a GitHub release
 */
export async function postGithubRelease(opts: BuildOptions): Promise<void> {
  const versionTag = `v${opts.version}`;
  const title = `${opts.vermoji} ${opts.version}`;

  const lines = (await fs.readFile(opts.changelogPath, 'utf8')).trim().split('\n');

  let body = '';
  for (let i = 1; i < 500; i++) {
    const currentLine = lines[i];

    if (currentLine == undefined) {
      // we don't test this as `!currentLine`, as an empty string is permitted in the changelog
      break;
    }

    const isMajorOrMinorVersionHeader = currentLine.startsWith('# ');
    const isPatchVersionHeader = currentLine.startsWith('## ');
    if (isMajorOrMinorVersionHeader || isPatchVersionHeader) {
      break;
    }
    body += currentLine + '\n';
  }

  // https://docs.github.com/en/github/administering-a-repository/automation-for-release-forms-with-query-parameters
  const url = new URL(`https://github.com/${opts.ghRepoOrg}/${opts.ghRepoName}/releases/new`);
  url.searchParams.set('tag', versionTag);

  const timestamp = new Date().toISOString().substring(0, 10);

  // this will be automatically encoded for us, no need to call `encodeURIComponent` here. doing so will result in a
  // double encoding, which does not render properly in GitHub
  url.searchParams.set('title', `${title} (${timestamp})`);

  url.searchParams.set('body', body.trim());
  if (opts.tag === 'next' || opts.tag === 'test') {
    url.searchParams.set('prerelease', '1');
  }

  const open = (await import('open')).default;
  await open(url.href);
}
