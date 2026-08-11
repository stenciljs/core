import { dirname } from 'path';
import type * as d from '@stencil/core';

import { join, normalizePath, relative } from '../../../../utils';
import { isNodeModulePath } from '../../../sys/resolve/resolve-utils';

// Helpers shared by both merge paths: compiler-ctx-merge.ts (the full
// compiler build) and resolve-import-merge.ts (the stateless transpile()
// path). Neither owns these - they're common ground between the two.

export type DeDupeMember =
  | d.ComponentCompilerProperty
  | d.ComponentCompilerState
  | d.ComponentCompilerMethod
  | d.ComponentCompilerListener
  | d.ComponentCompilerEvent
  | d.ComponentCompilerChangeHandler;

/**
 * Filters `dedupeMembers` down to entries not already present in `staticMembers`
 * (by name, or `methodName` for change handlers) - used so an extending
 * class's own members win over inherited ones.
 *
 * @param dedupeMembers the members to filter
 * @param staticMembers the members to filter against
 * @returns the filtered `dedupeMembers` array
 */
export const deDupeMembers = <T extends DeDupeMember>(dedupeMembers: T[], staticMembers: T[]) => {
  return dedupeMembers.filter(
    (s) =>
      !staticMembers.some((d) => {
        if ((d as d.ComponentCompilerChangeHandler).methodName) {
          return (d as any).methodName === (s as any).methodName;
        }
        return (d as any).name === (s as any).name;
      }),
  );
};

// Prefixes `./` onto a specifier that isn't already explicitly relative.
const ensureRelativeSpecifier = (specifier: string): string => {
  return specifier.startsWith('.') ? specifier : `./${specifier}`;
};

/**
 * Re-anchors inherited members' complex-type references - recorded relative
 * to the file declaring them - so they resolve from the extending
 * component's file instead. Consumers like `components.d.ts` generation
 * always resolve a reference against the component, not the declaring class,
 * so an inherited reference from a different directory would otherwise
 * produce a broken import.
 *
 * `import` refs get their relative path rewritten; `local` refs (a type
 * declared in the extended class's own file) become `import` refs pointing
 * at that file. Also applies to `node_modules`-published collections:
 * `dist/types/` mirrors `dist/collection/` 1:1, so the same math works after
 * swapping one for the other (type-only declarations don't survive
 * compilation to `.js`, so a reference has to point at the `.d.ts` tree).
 *
 * @param members inherited members whose type references should be re-anchored
 * @param extendedClassFileName absolute path of the file declaring the extended class
 * @param cmpSourceFilePath absolute path of the extending component's source file
 * @returns the same members, with their type references re-anchored
 */
export const reanchorInheritedTypeReferences = <
  T extends d.ComponentCompilerProperty | d.ComponentCompilerEvent | d.ComponentCompilerMethod,
>(
  members: T[],
  extendedClassFileName: string,
  cmpSourceFilePath: string,
): T[] => {
  const extendedClassDir = dirname(normalizePath(extendedClassFileName, false));
  const cmpDir = dirname(normalizePath(cmpSourceFilePath, false));
  if (extendedClassDir === cmpDir) {
    // specifiers already resolve correctly from the component's directory
    return members;
  }
  // Only compiled collection dependencies need the `dist/collection` ->
  // `dist/types` swap; a no-op everywhere else (including collections that
  // don't ship a `collection` output target - the path just won't resolve,
  // same as before this existed).
  const isCollectionModule = isNodeModulePath(extendedClassFileName);
  const toDeclarationPath = (path: string) =>
    isCollectionModule ? path.replace('/collection/', '/types/') : path;

  members.forEach((member) => {
    const references = member.complexType?.references;
    if (!references) {
      return;
    }
    Object.values(references).forEach((reference) => {
      if (reference.location === 'import' && reference.path?.startsWith('.')) {
        const typeModulePath = toDeclarationPath(join(extendedClassDir, reference.path));
        reference.path = ensureRelativeSpecifier(relative(cmpDir, typeModulePath));
      } else if (reference.location === 'local') {
        const extendedClassModule = toDeclarationPath(
          normalizePath(extendedClassFileName, false).replace(/\.(tsx|ts|js)$/, ''),
        );
        reference.location = 'import';
        reference.path = ensureRelativeSpecifier(relative(cmpDir, extendedClassModule));
      }
    });
  });
  return members;
};
