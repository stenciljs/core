/**
 * The project-wide component scan behind the docs/CEM and the virtual global-stylesheet imports.
 *
 * The registries are module-level on purpose: `getStencilCEM()` is public API called from outside
 * any plugin instance (e.g. a Storybook preset running in Node.js).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, normalize } from 'node:path';
import {
  cmpMetaToDocsComponent,
  generateManifest,
  parseCssOnlyComponents,
  transpile,
} from '@stencil/core/compiler';
import type {
  ComponentCompilerMeta,
  ComponentGlobalStyle,
  CustomElementsManifest,
  JsonDocsComponent,
} from '@stencil/core/compiler';

import { collectStyleDocsForComponent } from './css.js';
import { resolveImportedTypes } from './resolve-types.js';

export const docsRegistry = new Map<string, JsonDocsComponent>();

// The project-wide data `@import "stencil-component-globals"`/`"stencil-css-components"` need,
// populated by the same scanDocs() walk. Tag names for `@import "stencil-hydrate"` come from
// docsRegistry.
export const componentGlobalStyles: ComponentGlobalStyle[] = [];
export const cssOnlyComponentFiles = new Set<string>();

/**
 * A snapshot of the whole docs registry's content, used to detect whether a CSS-only
 * component's docs changed after a re-scan. A `.css` file's tag(s) aren't known until after parsing
 *  - and it may define more than one; compares the whole registry rather than one entry.
 * Cheap in practice: only runs on file save
 *
 * @returns a string that changes whenever any registry entry's content does
 */
export const getRegistrySnapshot = (): string =>
  JSON.stringify([...docsRegistry.entries()].sort(([a], [b]) => a.localeCompare(b)));

/**
 * Returns the current CEM. Only populated when `docs: true` is set.
 * @returns the current CEM, or an empty CEM if `docs: true` was not set.
 */
export function getStencilCEM(): CustomElementsManifest {
  return generateManifest({ components: [...docsRegistry.values()] });
}

const isTsSourceFile = (abs: string): boolean =>
  (abs.endsWith('.tsx') || abs.endsWith('.ts')) && !abs.endsWith('.d.ts');

const isCssFile = (abs: string): boolean => abs.endsWith('.css');

/**
 * Recursively collect file paths matching `matches` under `dir`, pruning
 * `node_modules` and hidden directories (`.git`, `.vite`, etc.) as it goes.
 *
 * `readdirSync(dir, { recursive: true })` can't prune during traversal - it
 * walks everything first and only lets the caller filter the flat result
 * afterward, which is disastrous under a symlink-heavy `node_modules` (e.g.
 * pnpm's `.pnpm` store, which flattens every dependency in the workspace) -
 * it can take minutes just to list, blocking `buildStart` the whole time.
 *
 * @param dir the directory to walk
 * @param matches predicate applied to each file's absolute path
 * @param out accumulator array of absolute file paths, mutated in place
 */
export function collectFiles(dir: string, matches: (abs: string) => boolean, out: string[]): void {
  let entries: import('node:fs').Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(abs, matches, out);
    } else if (entry.isFile() && matches(abs)) {
      out.push(abs);
    }
  }
}

/**
 * Parse a single `.css` file for CSS-only components (pure-CSS custom-element definitions
 * marked with a `@component` JSDoc tag - see `@stencil/core/compiler`'s `parseCssOnlyComponents`)
 * and register each one in the docs registry with `cssOnly: true`.
 * @param file absolute path to the `.css` file
 */
export async function scanCssOnlyDocsFile(file: string): Promise<void> {
  // native separators, so the same file is one registry entry whichever form a watcher reports it in
  const abs = normalize(file);
  let code: string;
  try {
    code = readFileSync(abs, 'utf-8');
  } catch {
    return;
  }
  // Cheap guard, same one parseCssOnlyComponents applies internally - skip the
  // postcss parse cost for the vast majority of .css files that aren't components.
  if (!code.includes('@component')) return;

  const { components } = await parseCssOnlyComponents(abs, code);
  if (components.length > 0) cssOnlyComponentFiles.add(abs);
  for (const item of components) {
    // No resolveImportedTypes call here - a CSS-only component's props are always literal
    // unions/primitives with empty `references`, never an imported TS type to resolve.
    docsRegistry.set(item.tagName, { ...cmpMetaToDocsComponent(item, abs), cssOnly: true });
  }
}

/**
 * Re-scan a changed stylesheet that defines (or used to define) CSS-only components - that changes
 * which ones exist, not just their CSS.
 * @param file the changed file
 */
export async function rescanIfCssOnlyComponent(file: string): Promise<void> {
  if (!isCssFile(file)) return;
  // Vite reports `/`-separated paths even on Windows, where the registry holds native ones
  const abs = normalize(file);
  try {
    if (readFileSync(abs, 'utf-8').includes('@component') || cssOnlyComponentFiles.has(abs)) {
      await scanCssOnlyDocsFile(abs);
    }
  } catch {
    // deleted/unreadable - keep what's known
  }
}

/**
 * Scan a changed directory for `.css` files not yet known as CSS-only components - a watcher
 * may report a file added to a watched directory as the directory itself.
 * @param dir the changed path - ignored unless it's a directory
 */
export async function rescanNewCssOnlyComponents(dir: string): Promise<void> {
  try {
    if (!statSync(dir).isDirectory()) return;
  } catch {
    return;
  }
  const cssFiles: string[] = [];
  collectFiles(dir, isCssFile, cssFiles);
  await Promise.all(cssFiles.filter((f) => !cssOnlyComponentFiles.has(f)).map(scanCssOnlyDocsFile));
}

/**
 * Re-derives one component's docs from its `.tsx` / `.ts` source and merges the result into the
 * docs registry.
 *
 * @param tag the custom-element tag name to refresh
 * @param filePath absolute path to the component's `.tsx`/`.ts` source
 * @returns `true` if the registry entry's content actually changed
 */
export async function refreshComponentDocs(tag: string, filePath: string): Promise<boolean> {
  const prevSnapshot = JSON.stringify(docsRegistry.get(tag));
  try {
    const code = readFileSync(filePath, 'utf-8');
    const result = await transpile(code, { file: filePath, componentExport: 'customelement' });

    for (const item of result.data ?? []) {
      if (!item.tagName) continue;
      await collectStyleDocsForComponent(item, filePath);
      const component = cmpMetaToDocsComponent(item, filePath);
      resolveImportedTypes(component, filePath);
      docsRegistry.set(item.tagName, component);
    }
  } catch {
    return false; // stale docs are acceptable on transpile error
  }
  return JSON.stringify(docsRegistry.get(tag)) !== prevSnapshot;
}

/**
 * Scan the project for component source files (`.tsx`/`.ts`) and CSS-only components
 * (`.css`), pre-populating the docs registry, `componentGlobalStyles`, and
 * `cssOnlyComponentFiles` - the project-wide data the virtual global-stylesheet imports need
 * (see `global-css.ts`), gathered eagerly so it doesn't depend on module-graph visitation order.
 * @param filter A function to filter which `.tsx`/`.ts` files should be included - not applied
 * to `.css` files, since the default `include` (`/\.tsx?$/`) would otherwise exclude all of them.
 * @param collectStyleDocs Whether to also collect CSS custom-property docs for each component's
 * stylesheet(s) - the extra parse cost only pays off when `options.docs` is set.
 * @returns A promise that resolves when the scan is complete.
 */
export async function scanDocs(
  filter: (id: string) => boolean,
  collectStyleDocs: boolean,
): Promise<void> {
  // module-level, so a later plugin instance in the same process (e.g. Vite restarting its dev
  // server after a config change) must start over rather than append
  componentGlobalStyles.length = 0;
  const cwd = process.cwd();
  const allFiles: string[] = [];
  collectFiles(cwd, (abs) => isTsSourceFile(abs) || isCssFile(abs), allFiles);

  const tsxFiles = allFiles.filter((abs) => isTsSourceFile(abs) && filter(abs));
  const cssFiles = allFiles.filter(isCssFile);

  await Promise.all([
    ...tsxFiles.map(async (abs) => {
      let code: string;
      try {
        code = readFileSync(abs, 'utf-8');
      } catch {
        return;
      }
      if (!/(@Component|@Prop|@State|@Event|@Method|@Watch|@Listen)\s*[(\s]/.test(code)) return;
      const result = await transpile(code, { file: abs, componentExport: 'customelement' });
      for (const item of (result.data ?? []) as ComponentCompilerMeta[]) {
        if (!item.tagName) continue;
        if (collectStyleDocs) await collectStyleDocsForComponent(item, abs);
        const component = cmpMetaToDocsComponent(item, abs);
        resolveImportedTypes(component, abs);
        docsRegistry.set(item.tagName, component);
        if (item.globalStyles?.length) componentGlobalStyles.push(...item.globalStyles);
      }
    }),
    ...cssFiles.map(scanCssOnlyDocsFile),
  ]);
}
