import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { join, dirname, relative } from 'node:path';
import { getTemplatePath } from '@stencil/templates';

import type { DiscoveredPlugin } from '../discover.js';

/**
 * Copy component-starter template into rootDir, interpolating project name and namespace.
 *
 * @param rootDir - Destination directory (typically `process.cwd()`).
 * @param projectName - Value to substitute for `{{PROJECT_NAME}}` placeholders.
 * @param namespace - Value to substitute for `{{NAMESPACE}}` placeholders.
 */
export async function copyTemplate(
  rootDir: string,
  projectName: string,
  namespace: string,
): Promise<void> {
  const templateDir = getTemplatePath('component-starter');
  const entries = await readdir(templateDir, { recursive: true, withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const srcPath = join(entry.parentPath, entry.name);
    const destPath = join(rootDir, relative(templateDir, srcPath));

    await mkdir(dirname(destPath), { recursive: true });

    const content = (await readFile(srcPath, 'utf8'))
      .replace(/\{\{PROJECT_NAME\}\}/g, projectName)
      .replace(/\{\{NAMESPACE\}\}/g, namespace);

    await writeFile(destPath, content, 'utf8');
  }
}

/**
 * Inject integration package names into the project's package.json devDependencies.
 * Versions are set to 'latest' so the subsequent install resolves them from the registry.
 *
 * @param rootDir - Absolute path to the project root.
 * @param integrations - npm package names to add as devDependencies.
 */
export async function patchPackageJson(rootDir: string, integrations: string[]): Promise<void> {
  if (integrations.length === 0) return;

  const pkgPath = join(rootDir, 'package.json');
  const pkg = JSON.parse(await readFile(pkgPath, 'utf8')) as Record<string, unknown>;
  const devDeps = (pkg.devDependencies ?? {}) as Record<string, string>;

  for (const name of integrations) {
    devDeps[name] = 'latest';
  }
  pkg.devDependencies = devDeps;

  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
}

/**
 * Prepend import lines from plugin config patches to stencil.config.ts.
 *
 * @param rootDir - Absolute path to the project root.
 * @param plugins - Discovered plugins whose `init.configPatch.imports` will be prepended.
 */
export async function applyConfigPatches(
  rootDir: string,
  plugins: DiscoveredPlugin[],
): Promise<void> {
  const imports = plugins.flatMap((d) => d.plugin.init?.configPatch?.imports ?? []);
  if (imports.length === 0) return;

  const configPath = join(rootDir, 'stencil.config.ts');
  const existing = await readFile(configPath, 'utf8');
  await writeFile(configPath, imports.join('\n') + '\n' + existing, 'utf8');
}
