import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as p from '@clack/prompts';
import { generatePackageJsonFields, generateStencilConfig, toPascalCase } from '@stencil/templates';
import * as nypm from 'nypm';
import { addDevDependency, installDependencies } from 'nypm';
import { isCI } from 'std-env';
import ts from 'typescript';
import type { OutputTarget, ValidatedConfig } from '@stencil/core/compiler';
import type { OutputKey } from '@stencil/templates';

import { cancelIfAborted } from './wizard/clack.js';
import { openStencilConfig } from './wizard/config-editor.js';
import { discoverPlugins } from './wizard/discover.js';
import {
  applyPackageJsonFields,
  copyTemplate,
  scaffoldWorkspaceRoot,
  writeGlobalScript,
  writeGlobalStyle,
  writeStencilConfig,
} from './wizard/init/apply.js';
import {
  KNOWN_INTEGRATIONS,
  hasFrameworkTargets,
  needsStencilConfig,
  promptAddCapabilities,
  promptDocs,
  promptFeatures,
  promptIntegrations,
  promptMonorepo,
  promptOutputs,
  promptProjectName,
  promptWorkspaceCoreName,
  withVersionRanges,
} from './wizard/init/steps.js';
import {
  defaultProjectConfig,
  detectWorkspaceRoot,
  isExistingStencilProject,
  toProjectConfig,
} from './wizard/project.js';
import { printSplash } from './wizard/splash.js';
import type { CoreCompiler } from './load-compiler.js';

function outputKeysToTargets(keys: ReadonlyArray<OutputKey>): Array<{ type: string }> {
  const map: Record<OutputKey, string> = {
    loader: 'loader-bundle',
    standalone: 'standalone',
    ssr: 'ssr',
    'ssr-wasm': 'ssr-wasm',
    www: 'www',
  };
  // Empty keys = zero-config default = loader-bundle
  return keys.length > 0 ? keys.map((k) => ({ type: map[k] })) : [{ type: 'loader-bundle' }];
}

export async function taskInit(
  coreCompiler?: CoreCompiler,
  strictConfig?: ValidatedConfig,
  loadProjectConfig?: (configPath?: string) => Promise<ValidatedConfig>,
): Promise<void> {
  const cwd = process.cwd();
  const isExistingProject = await isExistingStencilProject(cwd);

  printSplash();
  p.intro(`stencil init`);

  if (process.env.STENCIL_WIZARD_DEV) {
    p.log.warn(`Dev mode: loading wizards from ${process.env.STENCIL_WIZARD_DEV}`);
  }

  if (isCI) {
    p.log.warn('Running in CI - non-interactive mode is not yet supported for `stencil init`.');
    process.exit(1);
  }

  if (isExistingProject) {
    await addCapabilities(cwd, strictConfig);
    return;
  }

  // Phase 1: gather intent

  const projectName = await promptProjectName();
  const namespace = toNamespace(projectName);
  const outputs = await promptOutputs();
  const features = await promptFeatures();
  const docs = await promptDocs();
  const selectedIntegrations = await promptIntegrations();

  let monorepo = false;
  let coreName = '';
  if (hasFrameworkTargets(selectedIntegrations)) {
    monorepo = await promptMonorepo();
    if (monorepo) coreName = await promptWorkspaceCoreName();
  }

  const configSource =
    generateStencilConfig({ namespace, outputs, signals: features.signals, docs }) ??
    (needsStencilConfig(selectedIntegrations)
      ? // outputs is [] here (generateStencilConfig returned null), so loader-bundle is the
        // implicit default. Make it explicit so framework plugins can add alongside it without
        // inadvertently replacing it - which would break the loader-bundle files in package.json.
        `import { Config } from '@stencil/core';\n\nexport const config: Config = {\n  namespace: '${namespace}',\n  outputTargets: [{ type: 'loader-bundle' }],\n};\n`
      : null);

  const summaryLines = [
    `Template:  component-starter`,
    `Name:      ${projectName}`,
    `Namespace: ${namespace}`,
    `Config:    ${configSource ? 'stencil.config.ts' : 'zero-config (loader default)'}`,
  ];
  if (monorepo) {
    summaryLines.push(`Structure: monorepo workspace`);
    summaryLines.push(`Core:      packages/${coreName}/`);
  }
  if (selectedIntegrations.length > 0) {
    summaryLines.push(`Add:       ${selectedIntegrations.map((i) => i.displayName).join(', ')}`);
  }
  p.note(summaryLines.join('\n'), 'Summary');

  // Phase 2: scaffold

  const coreDir = monorepo ? join(cwd, 'packages', coreName) : cwd;

  const s1 = p.spinner();
  s1.start('Scaffolding project files');
  if (monorepo) await scaffoldWorkspaceRoot(cwd, projectName);
  await copyTemplate(coreDir, projectName, namespace, coreCompiler?.version);
  await applyPackageJsonFields(coreDir, generatePackageJsonFields(outputs));
  if (configSource) await writeStencilConfig(coreDir, configSource);
  if (features.globalStyle) await writeGlobalStyle(coreDir);
  if (features.globalScript) await writeGlobalScript(coreDir);
  s1.stop('Project files created');

  // Phase 3: install

  const s2 = p.spinner();
  s2.start('Installing dependencies');
  await installDependencies({ cwd, silent: true });
  s2.stop('Dependencies installed');

  if (selectedIntegrations.length > 0) {
    const s3 = p.spinner();
    const pkgs = selectedIntegrations.map((i) => i.package);
    s3.start(`Installing ${pkgs.join(', ')}`);
    // Integration packages (e.g. output target plugins) are deps of the core package
    await addDevDependency(withVersionRanges(pkgs), { cwd: coreDir, silent: true });
    s3.stop('Integrations installed');
  }

  // Phase 4: re-discover + run plugin wizards

  if (selectedIntegrations.length > 0) {
    const discovered = await discoverPlugins(coreDir);
    const selectedPkgs = new Set(selectedIntegrations.map((i) => i.package));
    // Load the just-written config (or package.json defaults for zero-config) so plugins
    // get the authoritative resolved paths - namespace, srcDir, outputTargets, etc.
    const resolvedValidated =
      loadProjectConfig && configSource
        ? await loadProjectConfig(join(coreDir, 'stencil.config.ts'))
        : coreCompiler
          ? coreCompiler.validateConfig(
              {
                rootDir: coreDir,
                outputTargets: outputKeysToTargets(outputs) as OutputTarget[],
                ...(configSource ? { namespace } : {}),
              },
              {},
            ).config
          : null;
    // Always use coreDir as rootDir — loadConfig's fallback uses sys.getCurrentDirectory()
    // (workspace root) when the config file fails to load, silently ignoring the rootDir we pass.
    const projectConfig = resolvedValidated
      ? { ...toProjectConfig(resolvedValidated), rootDir: coreDir }
      : defaultProjectConfig(coreDir, { namespace });
    for (const d of discovered) {
      if (selectedPkgs.has(d.packageName) && d.plugin.init?.run) {
        await d.plugin.init.run({
          isNewProject: true,
          prompts: p,
          nypm,
          config: projectConfig,
          workspaceRoot: monorepo ? cwd : undefined,
          ts,
          openStencilConfig: () =>
            openStencilConfig(join(projectConfig.rootDir, 'stencil.config.ts')),
        });
      }
    }
  }

  const pm = (await nypm.detectPackageManager(cwd))?.name ?? 'npm';
  const devDir = monorepo ? `packages/${coreName}` : null;
  const devCmd = `${pm} run dev`;
  p.outro(
    devDir
      ? `Your project is ready!\n  cd ${devDir}\n  ${devCmd}`
      : `Your project is ready! Run: ${devCmd}`,
  );
}

async function addCapabilities(cwd: string, strictConfig?: ValidatedConfig): Promise<void> {
  const workspaceRoot = await detectWorkspaceRoot(cwd);

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
    const s = p.spinner();
    const pkgs = toInstall.map((i) => i.package);
    s.start(`Installing ${pkgs.join(', ')}`);
    await addDevDependency(withVersionRanges(pkgs), { cwd, silent: true });
    s.stop('Dependencies installed');
  }

  // Re-discover after install so newly installed packages can run their wizards
  const allDiscovered = toInstall.length > 0 ? await discoverPlugins(cwd) : discovered;
  const newlyInstalledPkgs = new Set(toInstall.map((i) => i.package));
  const toRun = [
    ...allDiscovered.filter((d) => newlyInstalledPkgs.has(d.packageName)),
    ...toConfigure,
  ].filter((d) => d.plugin.init?.run);

  const projectConfig = strictConfig ? toProjectConfig(strictConfig) : defaultProjectConfig(cwd);
  for (const d of toRun) {
    await d.plugin.init!.run({
      isNewProject: false,
      prompts: p,
      nypm,
      config: projectConfig,
      workspaceRoot,
      ts,
      openStencilConfig: () => openStencilConfig(join(projectConfig.rootDir, 'stencil.config.ts')),
    });
  }

  p.outro('Done! Run pnpm run dev to continue.');
}

// Strip npm scope, normalize separators, PascalCase the result.
function toNamespace(name: string): string {
  const base = name.replace(/^@[^/]+\//, '');
  return toPascalCase(base.replace(/[/_]/g, '-'));
}
