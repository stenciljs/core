import { existsSync } from 'node:fs';
import { join } from 'node:path';
import * as p from '@clack/prompts';
import { toPascalCase } from '@stencil/templates';
import { installDependencies } from 'nypm';
import { isCI } from 'std-env';

import { cancelIfAborted } from './wizard/clack.js';
import { discoverPlugins } from './wizard/discover.js';
import { copyTemplate, patchPackageJson, applyConfigPatches } from './wizard/init/apply.js';
import { promptProjectName, promptIntegrations } from './wizard/init/steps.js';
import { printSplash } from './wizard/splash.js';

export async function taskInit(): Promise<void> {
  const cwd = process.cwd();
  const isExistingProject = existsSync(join(cwd, 'stencil.config.ts'));

  printSplash();
  p.intro('stencil init');

  if (isCI) {
    p.log.warn('Running in CI — non-interactive mode is not yet supported for `stencil init`.');
    process.exit(1);
  }

  if (isExistingProject) {
    p.log.warn('Existing Stencil project detected. Add-capabilities mode is not yet implemented.');
    process.exit(1);
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

// Strip npm scope, normalize separators, PascalCase the result.
function toNamespace(name: string): string {
  const base = name.replace(/^@[^/]+\//, '');
  return toPascalCase(base.replace(/[/_]/g, '-'));
}
