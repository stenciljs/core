import { existsSync } from 'node:fs';
import { join } from 'node:path';
import * as p from '@clack/prompts';
import { installDependencies } from 'nypm';
import { isCI } from 'std-env';

import { discoverPlugins } from './wizard/discover.js';
import { patchPackageJson } from './wizard/init/apply.js';
import { printSplash } from './wizard/splash.js';

export async function taskAdd(packages: string[]): Promise<void> {
  const cwd = process.cwd();

  printSplash();
  p.intro('stencil add');

  if (isCI) {
    p.log.warn('Running in CI - non-interactive mode is not yet supported for `stencil add`.');
    process.exit(1);
  }

  if (!existsSync(join(cwd, 'stencil.config.ts'))) {
    p.log.error('No stencil.config.ts found. Run `stencil init` to set up a new project first.');
    process.exit(1);
  }

  if (packages.length === 0) {
    p.log.error('Usage: stencil add <package> [package...]');
    process.exit(1);
  }

  await patchPackageJson(cwd, packages);

  const s = p.spinner();
  s.start(`Installing ${packages.join(', ')}`);
  await installDependencies({ cwd, silent: true });
  s.stop('Installed');

  const discovered = await discoverPlugins(cwd);
  const installedSet = new Set(packages);
  const context = { rootDir: cwd, isNewProject: false };

  for (const d of discovered) {
    if (installedSet.has(d.packageName) && d.plugin.init?.run) {
      await d.plugin.init.run(context);
    }
  }

  p.outro('Done!');
}
