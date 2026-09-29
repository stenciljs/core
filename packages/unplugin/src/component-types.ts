/**
 * `components.d.ts` - the typings `stencil build` writes to `srcDir`, generated here from the
 * project scan with core's own generator, so a project whose dev loop never runs the Stencil
 * compiler (Storybook, a Vite app authoring components from source) still gets them, kept current
 * as sources change. Same generator, same inputs, same order: if `stencil build --watch` runs
 * alongside, both write identical content.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateComponentTypesFile } from '@stencil/core/compiler';
import type { ComponentCompilerMeta, ComponentTypesConfig } from '@stencil/core/compiler';

import { componentMetaRegistry, cssOnlyMetaRegistry } from './project-scan.js';

const byTagName = (a: ComponentCompilerMeta, b: ComponentCompilerMeta) =>
  a.tagName.localeCompare(b.tagName);

/**
 * Write `<srcDir>/components.d.ts` from the current registries, unless its content is unchanged -
 * so an editor's TS server, or a `stencil build --watch`, isn't disturbed for nothing.
 * @param config `srcDir` (absolute) plus the other fields that affect the output
 * @returns whether the file was (re)written
 */
export function writeComponentTypes(config: ComponentTypesConfig): boolean {
  const filePath = join(config.srcDir, 'components.d.ts');
  // core's order: JS-backed components, then CSS-only ones, each sorted by tag
  const content = generateComponentTypesFile(
    [
      ...[...componentMetaRegistry.values()].sort(byTagName),
      ...[...cssOnlyMetaRegistry.values()].sort(byTagName),
    ],
    config,
  );
  let existing: string | undefined;
  try {
    existing = readFileSync(filePath, 'utf-8');
  } catch {
    // not written yet
  }
  if (existing === content) return false;
  writeFileSync(filePath, content);
  return true;
}
