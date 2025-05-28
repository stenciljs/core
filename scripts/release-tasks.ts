import color from 'ansi-colors';
import Listr, { ListrTask } from 'listr';

import { buildAll } from './build';
import { BuildOptions } from './utils/options';
import { isPrereleaseVersion, isValidVersionInput, SEMVER_INCREMENTS, updateChangeLog } from './utils/release-utils';

/**
 * We have to wrap `execa` in a promise to ensure it works with `Listr`. `Listr` uses rxjs under the hood which
 * seems to have issues with `execa`'s `ResultPromise` as it never resolves a task.
 * @param command command to run
 * @param args    arguments to pass to the command
 * @param options `execa` options
 * @returns a promise that resolves with the stdout and stderr of the command
 */
async function execa(command: string, args: string[], options?: any) {
  /**
   * consecutive imports are cached and don't have an impact on the execution speed
   */
  const { execa: execaOrig } = await import('execa');

  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const run = execaOrig(command, args, options);
    run.then(
      ({ stdout, stderr }) =>
        resolve({
          stdout: stdout as unknown as string,
          stderr: stderr as unknown as string,
        }),
      (err) => reject(err),
    );
  });
}

/**
 * Runs a litany of tasks used to ensure a safe release of a new version of Stencil
 * @param opts build options containing the metadata needed to release a new version of Stencil
 * @param args stringified arguments used to influence the release steps that are taken
 */
export async function runReleaseTasks(opts: BuildOptions, args: ReadonlyArray<string>): Promise<void> {
  const rootDir = opts.rootDir;
  const pkg = opts.packageJson;
  const tasks: ListrTask[] = [];
  const newVersion = opts.version;
  const isDryRun = args.includes('--dry-run') || opts.version.includes('dryrun');
  let tagPrefix: string;

  if (isDryRun) {
    console.log(color.bold.yellow(`\n  🏃‍ Dry Run!\n`));
  }

  if (!opts.isPublishRelease) {
    /**
     * For automated and manual releases, always verify that the version provided to the release scripts is a valid
     * semver 'word' (e.g. 'major', 'minor', etc.) or version (e.g. 1.0.0)
     */
    tasks.push({
      title: 'Validate version',
      task: () => {
        if (!isValidVersionInput(opts.version)) {
          throw new Error(`Version should be either ${SEMVER_INCREMENTS.join(', ')}, or a valid semver version.`);
        }
      },
      skip: () => isDryRun,
    });
  }

  if (opts.isPublishRelease) {
    tasks.push({
      title: 'Check for pre-release version',
      task: () => {
        if (!pkg.private && isPrereleaseVersion(newVersion) && !opts.tag) {
          throw new Error(
            'You must specify a dist-tag using --tag when publishing a pre-release version. This prevents accidentally tagging unstable versions as "latest". https://docs.npmjs.com/cli/dist-tag',
          );
        }
      },
    });
  }

  tasks.push({
    /**
     * When we both pre-release and release, it's beneficial to ensure that the tag does not already exist in git.
     * Doing so ought to catch out of the ordinary circumstances that ought to be investigated.
     */
    title: 'Check git tag existence',
    task: () =>
      execa('git', ['fetch'])
        // Retrieve the prefix for a version string - https://docs.npmjs.com/cli/v7/using-npm/config#tag-version-prefix
        .then(() => execa('npm', ['config', 'get', 'tag-version-prefix']))
        .then(
          ({ stdout }) => (tagPrefix = stdout),
          () => {},
        )
        // verify that a tag for the new version string does not already exist by checking the output of
        // `git rev-parse --verify`
        .then(() => execa('git', ['rev-parse', '--quiet', '--verify', `refs/tags/${tagPrefix}${newVersion}`]))
        .then(
          ({ stdout }) => {
            if (stdout) {
              throw new Error(`Git tag \`${tagPrefix}${newVersion}\` already exists.`);
            }
          },
          (err) => {
            // Command fails with code 1 and no output if the tag does not exist, even though `--quiet` is provided
            // https://github.com/sindresorhus/np/pull/73#discussion_r72385685
            if (err.stdout !== '' || err.stderr !== '') {
              throw err;
            }
          },
        ),
    skip: () => isDryRun,
  });

  tasks.push(
    {
      title: `Install npm dependencies ${color.dim('(npm ci)')}`,
      task: () => execa('npm', ['ci'], { cwd: rootDir }),
      // for pre-releases, this step will occur in GitHub after the PR has been created.
      // for actual releases, we'll need to build + bundle stencil in order to publish it to npm.
      skip: () => !opts.isPublishRelease,
    },
    {
      title: `Transpile Stencil ${color.dim('(tsc.prod)')}`,
      task: () => execa('npm', ['run', 'tsc.prod'], { cwd: rootDir }),
      // for pre-releases, this step will occur in GitHub after the PR has been created.
      // for actual releases, we'll need to build + bundle stencil in order to publish it to npm.
      skip: () => !opts.isPublishRelease,
    },
    {
      title: `Bundle @stencil/core ${color.dim('(' + opts.buildId + ')')}`,
      task: () => buildAll(opts),
      // for pre-releases, this step will occur in GitHub after the PR has been created.
      // for actual releases, we'll need to build + bundle stencil in order to publish it to npm.
      skip: () => !opts.isPublishRelease,
    },
  );

  if (!opts.isPublishRelease) {
    tasks.push(
      {
        title: `Set package.json version to ${color.bold.yellow(opts.version)}`,
        task: async () => {
          // use `--no-git-tag-version` to ensure that the tag for the release is not prematurely created
          await execa('npm', ['version', '--no-git-tag-version', opts.version], { cwd: rootDir });
        },
      },
      {
        title: `Generate ${opts.version} Changelog ${opts.vermoji}`,
        task: async () => {
          await updateChangeLog(opts);
        },
      },
    );
  }

  if (opts.isPublishRelease) {
    tasks.push(
      {
        title: 'Publish @stencil/core to npm',
        task: () => {
          const cmd = 'npm';
          const cmdArgs = ['publish'].concat(opts.tag ? ['--tag', opts.tag] : []).concat(['--provenance']);

          if (isDryRun) {
            return console.log(`[dry-run] ${cmd} ${cmdArgs.join(' ')}`);
          }
          return execa(cmd, cmdArgs, { cwd: rootDir });
        },
      },
      {
        title: 'Tagging the latest git commit',
        task: () => {
          const cmd = 'git';
          const cmdArgs = ['tag', `v${opts.version}`];

          if (isDryRun) {
            return console.log(`[dry-run] ${cmd} ${cmdArgs.join(' ')}`);
          }
          return execa(cmd, cmdArgs, { cwd: rootDir });
        },
      },
      {
        title: 'Pushing git tags',
        task: () => {
          const cmd = 'git';
          const cmdArgs = ['push', '--tags'];

          if (isDryRun) {
            return console.log(`[dry-run] ${cmd} ${cmdArgs.join(' ')}`);
          }
          return execa(cmd, cmdArgs, { cwd: rootDir });
        },
      },
    );
  }

  const listr = new Listr(tasks);

  try {
    await listr.run();
  } catch (err: any) {
    console.log(`\n🤒  ${color.red(err)}\n`);
    console.log(err);
    process.exit(1);
  }
  if (opts.isPublishRelease) {
    console.log(
      `\n ${opts.vermoji}  ${color.bold.magenta(pkg.name)} ${color.bold.yellow(newVersion)} published!! ${
        opts.vermoji
      }\n`,
    );
  } else {
    console.log(
      `\n ${opts.vermoji}  ${color.bold.magenta(pkg.name)} ${color.bold.yellow(
        newVersion,
      )} prepared, check the diffs and commit ${opts.vermoji}\n`,
    );
  }
}
