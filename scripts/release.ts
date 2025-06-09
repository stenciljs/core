import color from 'ansi-colors';
import fs from 'fs-extra';
import { join } from 'path';

import { runReleaseTasks } from './release-tasks';
import { BuildOptions, getOptions } from './utils/options';
import { getNewVersion } from './utils/release-utils';
import { getLatestVermoji } from './utils/vermoji';

/**
 * Runner for creating a release of Stencil
 * @param rootDir the root directory of the Stencil repository
 * @param args stringified arguments used to influence the release steps that are taken
 * @returns a void promise
 */
export async function release(rootDir: string, args: ReadonlyArray<string>): Promise<void> {
  const buildDir = join(rootDir, 'build');

  if (args.includes('--ci-prepare')) {
    await fs.emptyDir(buildDir);
    const prepareOpts = getOptions(rootDir, {
      isCI: true,
      isPublishRelease: false,
      isProd: true,
    });

    const versionIdx = args.indexOf('--version');
    if (versionIdx === -1 || versionIdx === args.length) {
      console.log(`\n${color.bold.red('No `--version [VERSION]` argument was found. Exiting')}\n`);
      process.exit(1);
    }
    if (prepareOpts.packageJson.version) {
      prepareOpts.version = getNewVersion(prepareOpts.packageJson.version, args[versionIdx + 1]);
    }

    await prepareRelease(prepareOpts, args);
    console.log(`${color.bold.blue('Release Prepared!')}`);
  }

  if (args.includes('--ci-publish')) {
    const prepareOpts = getOptions(rootDir, {
      isCI: true,
      isPublishRelease: false,
      isProd: true,
    });
    // this was bumped already, we just need to copy it from package.json into this field
    if (prepareOpts.packageJson.version) {
      prepareOpts.version = prepareOpts.packageJson.version;
    }

    // we generated a vermoji during the preparation step, let's grab it from the changelog
    prepareOpts.vermoji = getLatestVermoji(prepareOpts.changelogPath);

    const tagIdx = args.indexOf('--tag');
    let newTag = null;
    if (tagIdx === -1 || tagIdx === args.length) {
      console.log(`\n${color.bold.yellow('No `--tag [TAG]` argument was found.')}\n`);
    } else if (args[tagIdx + 1] === 'use_pkg_json_version') {
      console.log(
        `\n${color.bold.green(
          'The default package.json version will be used for the tag. No additional tags will be applied.',
        )}\n`,
      );
    } else {
      newTag = args[tagIdx + 1];
      console.log(`\n${color.bold.green(`Set '--tag' argument to '${newTag}'.`)}\n`);
    }

    console.log(`${color.bold.blue(`Version: ${prepareOpts.version}`)}`);
    console.log(`${color.bold.blue(`Tag: ${newTag}`)}`);

    const publishOpts = getOptions(rootDir, {
      buildId: prepareOpts.buildId,
      version: prepareOpts.version,
      vermoji: prepareOpts.vermoji,
      isCI: prepareOpts.isCI,
      isPublishRelease: true,
      isProd: true,
      tag: newTag ?? undefined,
    });
    return await publishRelease(publishOpts, args);
  }
}

/**
 * Prepares a release of Stencil
 * @param opts build options containing the metadata needed to release a new version of Stencil
 * @param args stringified arguments used to influence the release steps that are taken
 */
async function prepareRelease(opts: BuildOptions, args: ReadonlyArray<string>): Promise<void> {
  const pkg = opts.packageJson;
  const oldVersion = opts.packageJson.version;
  console.log(
    `\nPrepare to publish ${opts.vermoji}  ${color.bold.magenta(pkg.name)} ${color.dim(`(currently ${oldVersion})`)}\n`,
  );

  try {
    await runReleaseTasks(opts, args);
  } catch (err: any) {
    console.log('\n', color.red(err), '\n');
    process.exit(0);
  }
}

/**
 * Initiates publishing a Stencil release.
 * @param opts build options containing the metadata needed to publish a new version of Stencil
 * @param args stringified arguments used to influence the steps that are taken
 * @returns a void promise
 */
async function publishRelease(opts: BuildOptions, args: ReadonlyArray<string>): Promise<void> {
  const pkg = opts.packageJson;
  if (opts.version !== pkg.version) {
    throw new Error(
      `Prepare release data (${opts.version}) and package.json (${pkg.version}) versions do not match. Try re-running release prepare.`,
    );
  }

  console.log(`\nPublish ${opts.vermoji}  ${color.bold.magenta(pkg.name)} ${color.yellow(`${opts.version}`)}\n`);

  try {
    await runReleaseTasks(opts, args);
  } catch (err: any) {
    console.log('\n', color.red(err), '\n');
    process.exit(0);
  }
}
