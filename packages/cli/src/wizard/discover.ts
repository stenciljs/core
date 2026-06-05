import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import type { StencilWizardPlugin } from './types.js';

export interface DiscoveredPlugin {
  packageName: string;
  plugin: StencilWizardPlugin;
}

type ModuleLoader = (url: string) => Promise<Record<string, unknown>>;

function toStringRecord(val: unknown): Record<string, string> {
  return val !== null && typeof val === 'object' ? (val as Record<string, string>) : {};
}

async function readJson(filePath: string): Promise<Record<string, unknown> | null> {
  try {
    return JSON.parse(await readFile(filePath, 'utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function loadOne(
  rootDir: string,
  packageName: string,
  loader: ModuleLoader,
): Promise<DiscoveredPlugin | null> {
  const depPkg = await readJson(join(rootDir, 'node_modules', packageName, 'package.json'));
  const wizardEntry = (depPkg?.stencil as { wizard?: string } | undefined)?.wizard;
  if (!wizardEntry) return null;

  const wizardPath = join(rootDir, 'node_modules', packageName, wizardEntry);
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
): Promise<DiscoveredPlugin[]> {
  const pkg = await readJson(join(rootDir, 'package.json'));
  if (!pkg) return [];

  const depNames = [
    ...new Set([
      ...Object.keys(toStringRecord(pkg.dependencies)),
      ...Object.keys(toStringRecord(pkg.devDependencies)),
    ]),
  ];

  const results = await Promise.allSettled(depNames.map((name) => loadOne(rootDir, name, loader)));

  return results
    .filter(
      (r): r is PromiseFulfilledResult<DiscoveredPlugin> =>
        r.status === 'fulfilled' && r.value !== null,
    )
    .map((r) => r.value);
}
