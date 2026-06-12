import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { ValidatedConfig } from '@stencil/core/compiler';

import type { ProjectConfig } from './types.js';

/**
 * Extracts the stable, plugin-relevant fields from a fully-resolved compiler config.
 * @param validated The fully-resolved compiler config.
 * @returns A ProjectConfig with only the fields relevant to plugins and the wizard.
 *  This is a stable subset of the compiler config that won't change between versions.
 */
export function toProjectConfig(validated: ValidatedConfig): ProjectConfig {
  return {
    rootDir: validated.rootDir,
    srcDir: validated.srcDir,
    namespace: validated.namespace,
    fsNamespace: validated.fsNamespace,
    outputTargets: validated.outputTargets ?? [],
    globalScript: validated.globalScript,
    globalStyle: validated.globalStyle,
    compat: validated.compat,
    signalBacking: validated.signalBacking,
  };
}

/**
 * Builds a minimal ProjectConfig when no validated config is available (e.g. new project, no compiler).
 * @param rootDir The root directory of the project.
 * @param overrides Optional fields to override the defaults.
 * @returns A ProjectConfig with reasonable defaults for a new project.
 * */
export function defaultProjectConfig(
  rootDir: string,
  overrides?: Partial<ProjectConfig>,
): ProjectConfig {
  const namespace = overrides?.namespace ?? '';
  return {
    rootDir,
    srcDir: join(rootDir, 'src'),
    namespace,
    fsNamespace: overrides?.fsNamespace ?? namespace.toLowerCase(),
    outputTargets: [],
    ...overrides,
  };
}

/**
 * Returns true if the directory looks like an existing Stencil project:
 * - has an explicit `stencil.config.ts`, OR
 * - has `.tsx` files under `src/` (zero-config project).
 * @param dir The directory to check for an existing Stencil project.
 * @returns A promise that resolves to true if the directory looks like an existing Stencil project, false otherwise.
 */
export async function isExistingStencilProject(dir: string): Promise<boolean> {
  if (existsSync(join(dir, 'stencil.config.ts'))) return true;
  try {
    const entries = await readdir(join(dir, 'src'), { recursive: true, withFileTypes: true });
    return entries.some((e) => e.isFile() && e.name.endsWith('.tsx'));
  } catch {
    return false;
  }
}
