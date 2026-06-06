import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as p from '@clack/prompts';
import { toPascalCase } from '@stencil/templates';
import { installDependencies } from 'nypm';
import { isCI } from 'std-env';

import { cancelIfAborted } from './wizard/clack.js';
import { discoverPlugins } from './wizard/discover.js';
import { copyTemplate, patchPackageJson, applyConfigPatches } from './wizard/init/apply.js';
import {
  KNOWN_INTEGRATIONS,
  promptProjectName,
  promptIntegrations,
  promptAddCapabilities,
} from './wizard/init/steps.js';
import { printSplash } from './wizard/splash.js';

export async function taskInit(): Promise<void> {
  const cwd = process.cwd();
  const isExistingProject = existsSync(join(cwd, 'stencil.config.ts'));

  printSplash();
  p.intro('stencil init');

  if (isCI) {
    p.log.warn('Running in CI - non-interactive mode is not yet supported for `stencil init`.');
    process.exit(1);
  }

  if (isExistingProject) {
    await addCapabilities(cwd);
    return;
  }

  // ── Phase 1: gather intent ─────────────────────────────────────────────────

  const projectName = await promptProjectName();
  const namespace = toNamespace(projectName);
  const selectedIntegrations = await promptIntegrations();

  const summaryLines = [
    `Template:  component-starter`,
    `Name:      ${projectName}`,
    `Namespace: ${namespace}`,
  ];
  if (selectedIntegrations.length > 0) {
    summaryLines.push(`Add:       ${selectedIntegrations.map((i) => i.displayName).join(', ')}`);
  }
  p.note(summaryLines.join('\n'), 'Summary');

  const confirmed = await p.confirm({ message: 'Scaffold project in current directory?' });
  cancelIfAborted(confirmed);
  if (!confirmed) {
    p.cancel('Cancelled.');
    process.exit(0);
  }

  // ── Phase 2: scaffold ──────────────────────────────────────────────────────

  const s1 = p.spinner();
  s1.start('Scaffolding project files');
  await copyTemplate(cwd, projectName, namespace);
  s1.stop('Project files created');

  if (selectedIntegrations.length > 0) {
    await patchPackageJson(
      cwd,
      selectedIntegrations.map((i) => i.package),
    );
  }

  // ── Phase 3: install ───────────────────────────────────────────────────────

  const s2 = p.spinner();
  s2.start('Installing dependencies');
  await installDependencies({ cwd, silent: true });
  s2.stop('Dependencies installed');

  // ── Phase 4: re-discover + apply config patches ───────────────────────────

  if (selectedIntegrations.length > 0) {
    const discovered = await discoverPlugins(cwd);
    const withPatches = discovered.filter((d) => d.plugin.init?.configPatch);
    if (withPatches.length > 0) {
      await applyConfigPatches(cwd, withPatches);
    }
  }

  p.outro('Your project is ready! Run: pnpm run dev');
}

async function addCapabilities(cwd: string): Promise<void> {
  const raw = JSON.parse(await readFile(join(cwd, 'package.json'), 'utf8')) as Record<
    string,
    unknown
  >;
  const installed = new Set([
    ...Object.keys((raw.dependencies ?? {}) as Record<string, string>),
    ...Object.keys((raw.devDependencies ?? {}) as Record<string, string>),
  ]);

  // Already-installed packages with wizard init contributions
  const discovered = await discoverPlugins(cwd);
  const configurable = discovered.filter((d) => d.plugin.init);

  // Known integrations not yet present
  const installable = KNOWN_INTEGRATIONS.filter((i) => !installed.has(i.package));

  if (installable.length === 0 && configurable.length === 0) {
    p.log.info('All known integrations are already installed and configured.');
    p.outro('Nothing to do.');
    return;
  }

  const { toInstall, toConfigure } = await promptAddCapabilities(installable, configurable);

  if (toInstall.length === 0 && toConfigure.length === 0) {
    p.outro('No changes made.');
    return;
  }

  const summaryLines: string[] = [];
  for (const i of toInstall) summaryLines.push(`Install:   ${i.displayName}`);
  for (const d of toConfigure) summaryLines.push(`Configure: ${d.plugin.init!.displayName}`);
  p.note(summaryLines.join('\n'), 'Summary');

  const confirmed = await p.confirm({ message: 'Apply changes?' });
  cancelIfAborted(confirmed);
  if (!confirmed) {
    p.cancel('Cancelled.');
    process.exit(0);
  }

  if (toInstall.length > 0) {
    await patchPackageJson(
      cwd,
      toInstall.map((i) => i.package),
    );
    const s = p.spinner();
    s.start('Installing dependencies');
    await installDependencies({ cwd, silent: true });
    s.stop('Dependencies installed');
  }

  // Re-discover after install so newly installed packages can contribute config patches
  const allDiscovered = toInstall.length > 0 ? await discoverPlugins(cwd) : discovered;
  const newlyInstalledPkgs = new Set(toInstall.map((i) => i.package));
  const toPatch = [
    ...allDiscovered.filter((d) => newlyInstalledPkgs.has(d.packageName)),
    ...toConfigure,
  ].filter((d) => d.plugin.init?.configPatch);

  if (toPatch.length > 0) {
    await applyConfigPatches(cwd, toPatch);
  }

  p.outro('Done! Run pnpm run dev to continue.');
}

// Strip npm scope, normalize separators, PascalCase the result.
function toNamespace(name: string): string {
  const base = name.replace(/^@[^/]+\//, '');
  return toPascalCase(base.replace(/[/_]/g, '-'));
}
