import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as p from '@clack/prompts';
import * as nypm from 'nypm';
import { addDevDependency } from 'nypm';
import { isCI } from 'std-env';
import type { ValidatedConfig } from '@stencil/core/compiler';

import { discoverPlugins, type DiscoveredPlugin } from './wizard/discover.js';
import {
  KNOWN_INTEGRATIONS,
  type KnownIntegration,
  promptAddCapabilities,
  promptCustomPackages,
} from './wizard/init/steps.js';
import { defaultProjectConfig, detectWorkspaceRoot, toProjectConfig } from './wizard/project.js';
import { printSplash } from './wizard/splash.js';

async function getInstalledPackageNames(rootDir: string): Promise<Set<string>> {
  try {
    const pkg = JSON.parse(await readFile(join(rootDir, 'package.json'), 'utf8')) as Record<
      string,
      unknown
    >;
    const keys = (v: unknown) =>
      Object.keys(v !== null && typeof v === 'object' ? (v as Record<string, string>) : {});
    return new Set([...keys(pkg.dependencies), ...keys(pkg.devDependencies)]);
  } catch {
    return new Set();
  }
}

interface PackageSelections {
  packagesToInstall: string[];
  pluginsToReconfigure: DiscoveredPlugin[];
}

async function selectInteractive(cwd: string): Promise<PackageSelections> {
  const discovered = await discoverPlugins(cwd);
  const installed = await getInstalledPackageNames(cwd);
  const installable = KNOWN_INTEGRATIONS.filter((i) => !installed.has(i.package));
  const configurable = discovered.filter((d) => d.plugin.init != null);

  let toInstall: KnownIntegration[] = [];
  let toConfigure: DiscoveredPlugin[] = [];

  if (installable.length > 0 || configurable.length > 0) {
    const result = await promptAddCapabilities(installable, configurable);
    toInstall = result.toInstall;
    toConfigure = result.toConfigure;
  } else {
    p.log.info('All known integrations are already installed.');
  }

  const customPackages = await promptCustomPackages();

  return {
    packagesToInstall: [...toInstall.map((i) => i.package), ...customPackages],
    pluginsToReconfigure: toConfigure,
  };
}

export async function taskAdd(packages: string[], strictConfig?: ValidatedConfig): Promise<void> {
  const cwd = process.cwd();

  printSplash();
  p.intro('stencil add');

  if (isCI) {
    p.log.warn('Running in CI - non-interactive mode is not yet supported for `stencil add`.');
    process.exit(1);
  }

  let packagesToInstall: string[] = packages;
  let pluginsToReconfigure: DiscoveredPlugin[] = [];

  if (packages.length === 0) {
    ({ packagesToInstall, pluginsToReconfigure } = await selectInteractive(cwd));
  }

  if (packagesToInstall.length === 0 && pluginsToReconfigure.length === 0) {
    p.outro('Nothing to do.');
    return;
  }

  if (packagesToInstall.length > 0) {
    if (process.env.STENCIL_WIZARD_DEV) {
      p.log.warn(
        `Dev mode: skipping install, loading wizard from ${process.env.STENCIL_WIZARD_DEV}`,
      );
    } else {
      const s = p.spinner();
      s.start(`Installing ${packagesToInstall.join(', ')}`);
      await addDevDependency(packagesToInstall, { cwd, silent: true });
      s.stop('Installed');
    }
  }

  const config = strictConfig ? toProjectConfig(strictConfig) : defaultProjectConfig(cwd);
  const workspaceRoot = await detectWorkspaceRoot(cwd);
  const context = { isNewProject: false, prompts: p, nypm, config, workspaceRoot };

  if (packagesToInstall.length > 0) {
    const discovered = await discoverPlugins(cwd);
    const installedSet = new Set(packagesToInstall);
    for (const d of discovered) {
      if (installedSet.has(d.packageName) && d.plugin.init?.run) {
        await d.plugin.init.run(context);
      }
    }
  }

  for (const d of pluginsToReconfigure) {
    if (d.plugin.init?.run) {
      await d.plugin.init.run(context);
    }
  }

  p.outro('Done!');
}
