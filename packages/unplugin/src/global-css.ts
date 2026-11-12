/**
 * Stencil's three virtual global-stylesheet imports - `@import "stencil-hydrate"`,
 * `"stencil-component-globals"` and `"stencil-css-components"` - as real stylesheets.
 *
 * Their CSS, gathered by the project-wide scan (see `scanDocs` in `plugin.ts`), is written to
 * `<dir>/<name>.css` and each specifier resolves to that file, so the bundler handles it like any
 * other stylesheet: wherever it's imported from (partials, Sass, Less) and with whatever
 * `@import` modifiers. Vite doesn't consult plugins when resolving CSS `@import`, so there it's
 * reached through an alias ({@link virtualGlobalStylesheetAlias}); other bundlers go through
 * `resolveId`.
 */
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { buildHydrateCss } from '@stencil/core/compiler';
import type { ComponentGlobalStyle, HydratedFlag, JsonDocsComponent } from '@stencil/core/compiler';

import { processCssFile } from './css.js';
import { collectFiles } from './project-scan.js';

const VIRTUAL_GLOBAL_IMPORTS = [
  'stencil-hydrate',
  'stencil-component-globals',
  'stencil-css-components',
] as const;

const VIRTUAL_GLOBAL_ID_RE = new RegExp(`^(${VIRTUAL_GLOBAL_IMPORTS.join('|')})$`);

/** Matches a mention of any virtual global-stylesheet import name. */
const VIRTUAL_GLOBAL_IMPORT_RE = new RegExp(`\\b(?:${VIRTUAL_GLOBAL_IMPORTS.join('|')})\\b`);

// Less prefixes an `@import (css)` inside a partial with the partial's directory
const VIRTUAL_GLOBAL_SUFFIX_RE = new RegExp(`(?:^|[\\\\/])(${VIRTUAL_GLOBAL_IMPORTS.join('|')})$`);

/**
 * The virtual import a specifier refers to - either exactly, or with a directory prefix, which
 * callers should only accept when no such file exists (see {@link VIRTUAL_GLOBAL_SUFFIX_RE}).
 * @param id a module specifier
 * @returns the virtual import's name, if the specifier ends in one
 */
const getVirtualGlobalImportName = (id: string): string | undefined =>
  VIRTUAL_GLOBAL_SUFFIX_RE.exec(id)?.[1];

/**
 * @param dir the directory {@link writeVirtualGlobalStylesheets} writes to
 * @param name a virtual global-stylesheet import
 * @returns the path of its generated stylesheet
 */
const virtualGlobalStylesheetPath = (dir: string, name: string): string => join(dir, `${name}.css`);

/**
 * A Vite alias sending each virtual import to its generated stylesheet in `dir`.
 * @param dir the directory {@link writeVirtualGlobalStylesheets} writes to
 * @returns the alias entry
 */
export const virtualGlobalStylesheetAlias = (dir: string) => ({
  find: VIRTUAL_GLOBAL_ID_RE,
  replacement: virtualGlobalStylesheetPath(dir, '$1'),
});

/**
 * A webpack-style alias map (`name$` = exact match) sending each virtual import to its generated
 * stylesheet in `dir` - for bundlers whose CSS `@import` resolution skips plugins (rspack).
 * @param dir the directory {@link writeVirtualGlobalStylesheets} writes to
 * @returns the alias map
 */
export const virtualGlobalStylesheetAliasMap = (dir: string): Record<string, string> =>
  Object.fromEntries(
    VIRTUAL_GLOBAL_IMPORTS.map((name) => [`${name}$`, virtualGlobalStylesheetPath(dir, name)]),
  );

/**
 * Tags `stencil-hydrate` hides until hydrated. CSS-only components never hydrate, so including
 * them would hide them for good.
 * @param components every component in the docs registry
 * @returns the real (JS-backed) components' tag names
 */
export const getHydrateTagNames = (components: Iterable<JsonDocsComponent>): Set<string> =>
  new Set([...components].filter((c) => !c.cssOnly).map((c) => c.tag));

/** Project-wide data the three stylesheets are built from, gathered by `scanDocs`. */
export interface GlobalCssProjectData {
  /** Every component's `@Component({ globalStyle / globalStyleUrl })` entries. */
  componentGlobalStyles: ComponentGlobalStyle[];
  /** `.css` files that define at least one CSS-only component (`@component`-marked). */
  cssOnlyComponentFiles: Set<string>;
  /** Tags hidden until hydrated - see {@link getHydrateTagNames}. */
  tagNames: Set<string>;
  hydratedFlag: HydratedFlag | null;
}

// Processed CSS per ingredient file (a globalStyleUrl / CSS-only-component file) and the files it
// pulled in, keyed on their latest mtime - so regenerating reprocesses only what changed, in any
// bundler's watch mode, without having to be told what changed.
const processedFileCache = new Map<string, { css: string; deps: string[]; mtimeMs: number }>();

const latestMtime = (filePaths: string[]): number => {
  let latest = 0;
  for (const filePath of filePaths) {
    try {
      latest = Math.max(latest, statSync(filePath).mtimeMs);
    } catch {
      // missing - reprocess and let that report it
      return Number.NaN;
    }
  }
  return latest;
};

async function collectFileParts(
  filePaths: Iterable<string>,
  isDev: boolean,
): Promise<{ css: string; deps: string[] }> {
  const parts: string[] = [];
  const deps: string[] = [];
  for (const filePath of filePaths) {
    deps.push(filePath);
    let processed = processedFileCache.get(filePath);
    if (!processed || processed.mtimeMs !== latestMtime([filePath, ...processed.deps])) {
      const result = await processCssFile(filePath, isDev);
      if (!result) continue;
      processed = { ...result, mtimeMs: latestMtime([filePath, ...result.deps]) };
      processedFileCache.set(filePath, processed);
    }
    parts.push(processed.css);
    deps.push(...processed.deps);
  }
  return { css: parts.join('\n'), deps };
}

async function collectComponentGlobalStyles(
  entries: ComponentGlobalStyle[],
  isDev: boolean,
): Promise<{ css: string; deps: string[] }> {
  const inline: string[] = [];
  const filePaths: string[] = [];
  for (const gs of entries) {
    if (gs.styleStr) inline.push(gs.styleStr);
    else if (gs.absolutePath) filePaths.push(gs.absolutePath);
  }
  const { css: fileCss, deps } = await collectFileParts(filePaths, isDev);
  return { css: [...inline, fileCss].filter(Boolean).join('\n'), deps };
}

/**
 * Write each virtual import's CSS to `<dir>/<name>.css` - all three, even when empty, so they
 * always resolve. Files whose content is unchanged are left alone, so they don't trigger HMR.
 * @param dir the directory to write to
 * @param data project-wide data collected by `scanDocs`
 * @param isDev `true` in dev mode (disables minification in the ingredient preprocessing chain)
 * @returns the paths of files that were (re)written, and every ingredient file the CSS came from
 * (register these as watch files)
 */
export async function writeVirtualGlobalStylesheets(
  dir: string,
  data: GlobalCssProjectData,
  isDev: boolean,
): Promise<{ written: string[]; deps: string[] }> {
  const globals = await collectComponentGlobalStyles(data.componentGlobalStyles, isDev);
  const cssOnly = await collectFileParts(data.cssOnlyComponentFiles, isDev);
  const contents: Record<(typeof VIRTUAL_GLOBAL_IMPORTS)[number], string> = {
    'stencil-hydrate': buildHydrateCss(data.hydratedFlag, [...data.tagNames]),
    'stencil-component-globals': globals.css,
    'stencil-css-components': cssOnly.css,
  };

  mkdirSync(dir, { recursive: true });
  const written: string[] = [];
  for (const name of VIRTUAL_GLOBAL_IMPORTS) {
    const filePath = virtualGlobalStylesheetPath(dir, name);
    let existing: string | undefined;
    try {
      existing = readFileSync(filePath, 'utf-8');
    } catch {
      // not written yet
    }
    if (existing !== contents[name]) {
      writeFileSync(filePath, contents[name]);
      written.push(filePath);
    }
  }
  return { written, deps: [...globals.deps, ...cssOnly.deps] };
}

const STYLE_FILE_RE = /\.(css|scss|sass|less|styl|stylus|pcss)$/;

const mentionsVirtualGlobalImport = (abs: string): boolean => {
  try {
    return VIRTUAL_GLOBAL_IMPORT_RE.test(readFileSync(abs, 'utf-8'));
  } catch {
    return false;
  }
};

/**
 * Cheap text check of every stylesheet under `root` for a virtual global-stylesheet import -
 * gates the full project scan the generated stylesheets need.
 * @param root the project root
 * @returns whether any stylesheet mentions one
 */
function projectUsesVirtualGlobalImports(root: string): boolean {
  const styleFiles: string[] = [];
  collectFiles(root, (abs) => STYLE_FILE_RE.test(abs), styleFiles);
  return styleFiles.some(mentionsVirtualGlobalImport);
}

/**
 * One plugin instance's generated virtual global stylesheets: where they live, and generating
 * them on first use - so projects that never use them don't pay for the project scan - then
 * regenerating them as sources change.
 * @param prepare loads whatever the stylesheets are built from (config, project scan)
 * @param isDev whether this is a dev build (unminified, and a separate output dir)
 * @returns the stylesheets' controls, one per plugin hook that needs them
 */
export function createVirtualGlobalCss(
  prepare: () => Promise<GlobalCssProjectData>,
  isDev: () => boolean,
) {
  let dir = '';
  let written: ReturnType<typeof writeVirtualGlobalStylesheets> | null = null;
  let deps: string[] = [];
  const write = async () => {
    const result = await writeVirtualGlobalStylesheets(dir, await prepare(), isDev());
    deps = result.deps;
    return result;
  };

  const ensure = () => (written ??= write());
  // regenerate from current sources - ingredient changes are picked up by mtime
  const rewrite = async () => {
    await written;
    written = write();
    return written;
  };
  const refresh = () => (written ? rewrite() : ensure());
  const useDefaultDir = (root: string) => {
    dir ||= resolve(root, 'node_modules', '.stencil', 'virtual-css', isDev() ? 'serve' : 'build');
  };
  const isPath = (id: string) => !!dir && dirname(id) === dir;

  return {
    get dir() {
      return dir;
    },
    /** @returns whether they've been generated yet, i.e. something uses them */
    get started() {
      return !!written;
    },
    /** @returns the ingredient files the last generation drew from */
    get deps() {
      return deps;
    },
    setDir(value: string) {
      dir = value;
    },
    /** Use the default dir under `root`, unless one's already been set. */
    useDefaultDir,
    isPath,
    refresh,

    /**
     * @param id a module specifier
     * @param importer the importing file
     * @returns the generated stylesheet it refers to, if it's a virtual import. A directory-prefixed
     * name (as Less writes `(css)` imports in a partial) only counts when no such file exists.
     */
    async resolveId(id: string, importer?: string): Promise<string | undefined> {
      // Vite's alias has already swapped a JS import's name for its generated path - that's a use
      // too, even if no stylesheet mentions one (e.g. a Storybook preview entry importing them)
      if (isPath(id)) {
        await ensure();
        return id;
      }
      const name = getVirtualGlobalImportName(id);
      if (!name || (name !== id && importer && existsSync(resolve(dirname(importer), id)))) {
        return undefined;
      }
      await ensure();
      return virtualGlobalStylesheetPath(dir, name);
    },

    /**
     * Regenerated on every load, so a watch-mode rebuild sees ingredient changes.
     * @param id a generated stylesheet's path
     * @returns its CSS, and the ingredient files to register as watch files
     */
    async load(id: string): Promise<{ code: string; deps: string[] }> {
      await rewrite();
      return { code: readFileSync(id, 'utf-8'), deps };
    },

    /**
     * For bundlers that read the generated files straight from disk before compiling (webpack,
     * rspack) - (re)write them before every compile, once some stylesheet uses them.
     * @param root the project root
     */
    async forCompile(root: string) {
      if (!written && !projectUsesVirtualGlobalImports(root)) return;
      useDefaultDir(root);
      await refresh();
    },

    /**
     * Vite HMR: generate them once a stylesheet first mentions one, then regenerate on every
     * relevant change.
     * @param file the changed file
     * @returns the generated stylesheets whose content changed
     */
    async hotUpdate(file: string): Promise<string[]> {
      if (!written) {
        if (STYLE_FILE_RE.test(file) && mentionsVirtualGlobalImport(file)) await ensure();
        return [];
      }
      if (!/\.(css|tsx?)$/.test(file)) return [];
      return (await rewrite()).written;
    },
  };
}
