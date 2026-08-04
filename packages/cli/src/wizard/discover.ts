import { readFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { getPackageInfo } from 'local-pkg';

import type { StencilWizardPlugin } from './types.js';

export interface DiscoveredPlugin {
  packageName: string;
  plugin: StencilWizardPlugin;
}

type ModuleLoader = (url: string) => Promise<Record<string, unknown>>;

function toStringRecord(val: unknown): Record<string, string> {
  return val !== null && typeof val === 'object' ? (val as Record<string, string>) : {};
}

async function readJson(filePath: string) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function loadOne(rootDir: string, packageName: string, loader: ModuleLoader) {
  // resolved via node's module resolution (not a plain rootDir/node_modules join) so
  // hoisted deps in npm/pnpm/yarn workspaces are found regardless of where they land
  const info = await getPackageInfo(packageName, { paths: [rootDir] });
  if (!info) return null;
  const wizardEntry = (info.packageJson.stencil as { wizard?: string } | undefined)?.wizard;
  if (!wizardEntry) return null;

  const wizardPath = join(info.rootPath, wizardEntry);
  let mod: Record<string, unknown>;
  try {
    mod = await loader(pathToFileURL(wizardPath).href);
  } catch {
    console.warn(
      `[stencil] ${packageName} declares stencil.wizard but the module failed to load: ${wizardPath}`,
    );
    return null;
  }

  const plugin = mod.wizard;
  if (!plugin || typeof plugin !== 'object') {
    console.warn(
      `[stencil] ${packageName} declares stencil.wizard but does not export a 'wizard' object`,
    );
    return null;
  }

  return { packageName, plugin: plugin as StencilWizardPlugin };
}

/**
 * Scans the project's declared dependencies for packages that expose a
 * `stencil.wizard` entry in their `package.json` and dynamically imports
 * each matching module.
 *
 * @param rootDir - Absolute path to the project root (where `package.json` lives).
 * @param loader  - Module loader; injectable for testing. Defaults to `import()`.
 * @returns Array of successfully loaded plugins, in dependency declaration order.
 */
export async function discoverPlugins(
  rootDir: string,
  loader: ModuleLoader = (url) => import(url) as Promise<Record<string, unknown>>,
) {
  const pkg = await readJson(join(rootDir, 'package.json'));
  if (!pkg) return [];

  const depNames = [
    ...new Set([
      ...Object.keys(toStringRecord(pkg.dependencies)),
      ...Object.keys(toStringRecord(pkg.devDependencies)),
    ]),
  ];

  const results = await Promise.allSettled(depNames.map((name) => loadOne(rootDir, name, loader)));

  const plugins = results
    .filter(
      (r): r is PromiseFulfilledResult<DiscoveredPlugin> =>
        r.status === 'fulfilled' && r.value !== null,
    )
    .map((r) => r.value);

  // Dev escape hatch: inject local wizard files without needing node_modules.
  // Accepts a comma-separated list of paths, e.g.:
  //   STENCIL_WIZARD_DEV=../react-output-target/wizard.js,../vue-output-target/wizard.js
  const devEnv = process.env.STENCIL_WIZARD_DEV;
  if (devEnv) {
    const devPaths = devEnv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const devPath of devPaths) {
      const devPlugin = await loadDevPlugin(resolve(rootDir, devPath), loader);
      if (devPlugin) {
        const idx = plugins.findIndex((p) => p.packageName === devPlugin.packageName);
        if (idx >= 0) plugins.splice(idx, 1, devPlugin);
        else plugins.unshift(devPlugin);
      }
    }
  }

  return plugins;
}

async function findDevPackageName(wizardPath: string) {
  const dir = dirname(wizardPath);
  for (const candidate of [dir, resolve(dir, '..')]) {
    const pkg = await readJson(join(candidate, 'package.json'));
    if (typeof pkg?.name === 'string') return pkg.name;
  }
  return basename(dir);
}

async function loadDevPlugin(wizardPath: string, loader: ModuleLoader) {
  const packageName = await findDevPackageName(wizardPath);

  let mod: Record<string, unknown>;
  try {
    mod = await loader(pathToFileURL(wizardPath).href);
  } catch {
    console.warn(`[stencil] STENCIL_WIZARD_DEV: failed to load ${wizardPath}`);
    return null;
  }

  const plugin = mod.wizard;
  if (!plugin || typeof plugin !== 'object') {
    console.warn(`[stencil] STENCIL_WIZARD_DEV: ${wizardPath} does not export a 'wizard' object`);
    return null;
  }

  return { packageName, plugin: plugin as StencilWizardPlugin };
}
