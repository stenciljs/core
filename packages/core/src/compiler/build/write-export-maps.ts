import type * as d from '@stencil/core';

import {
  isOutputTargetAssets,
  isOutputTargetGlobalStyle,
  isOutputTargetLoaderBundle,
  isOutputTargetSsr,
  isOutputTargetStandalone,
  isOutputTargetTypes,
  isString,
  join,
  normalizePath,
  parsePackageJson,
  relative,
} from '../../utils';

/** The conditions Stencil owns on the entries it generates, in the order they're written. */
type ExportConditions = { types?: string; import?: string; require?: string };

type JsonObject = Record<string, unknown>;

const OWNED_CONDITIONS = ['types', 'import', 'require'];

const isJsonObject = (v: unknown): v is JsonObject =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Write the `exports` map entry points into the project's `package.json`.
 *
 * - `exports["."]`: an `import` / `types` target that exists on disk is left alone
 *   (respects user customization), otherwise a default is set (loader-bundle > standalone)
 * - every other generated entry is owned by Stencil and rewritten on each build
 * - per-component entries whose component no longer exists are removed
 * - entries Stencil doesn't generate are left untouched
 *
 * @param config The validated Stencil config
 * @param compilerCtx The compiler context
 * @param buildCtx The build context containing the components to generate export maps for
 */
export const writeExportMaps = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
): Promise<void> => {
  const loaderBundle = config.outputTargets.find(isOutputTargetLoaderBundle);
  const standalone = config.outputTargets.find(isOutputTargetStandalone);
  const ssr = config.outputTargets.find(isOutputTargetSsr);
  const types = config.outputTargets.find(isOutputTargetTypes);

  if (!loaderBundle && !standalone && !ssr) {
    return;
  }

  const source = await readPackageJsonSource(config, compilerCtx);
  const pkg: unknown = source ? parsePackageJson(source, config.packageJsonFilePath).data : null;
  if (!source || !isJsonObject(pkg)) {
    return;
  }

  let exportMap = toExportMap(pkg.exports);

  if (loaderBundle || standalone) {
    const root = getRootExport(
      config,
      compilerCtx,
      exportMap['.'],
      loaderBundle,
      standalone,
      types,
    );
    // a new root entry goes first, by convention
    exportMap = '.' in exportMap ? { ...exportMap, '.': root } : { '.': root, ...exportMap };
  }

  const generated = getGeneratedExports(config, buildCtx, loaderBundle, standalone, ssr, types);

  if (standalone?.dir) {
    removeStaleComponentExports(exportMap, generated, toRelativePath(config, standalone.dir));
  }

  for (const [key, entry] of Object.entries(generated)) {
    exportMap[key] = isString(entry) ? entry : mergeConditions(exportMap[key], entry);
  }

  pkg.exports = exportMap;

  const eol = source.includes('\r\n') ? '\r\n' : '\n';
  const indent = /^([ \t]+)"/m.exec(source)?.[1] ?? 2;
  let output = JSON.stringify(pkg, null, indent);
  if (/\n\s*$/.test(source)) {
    output += '\n';
  }
  output = output.replace(/\n/g, eol);

  if (output !== source) {
    await compilerCtx.fs.writeFile(config.packageJsonFilePath, output, { immediateWrite: true });
  }
};

const readPackageJsonSource = async (config: d.ValidatedConfig, compilerCtx: d.CompilerCtx) => {
  try {
    return await compilerCtx.fs.readFile(config.packageJsonFilePath);
  } catch {
    return undefined;
  }
};

/**
 * Normalize a `package.json` `exports` value into its subpath-keyed form.
 * @param current The current `exports` value
 * @returns A new subpath-keyed `exports` object
 */
const toExportMap = (current: unknown): JsonObject => {
  if (isString(current)) {
    return { '.': current };
  }
  if (!isJsonObject(current)) {
    return {};
  }
  // a conditions-only object is shorthand for the root entry
  const keys = Object.keys(current);
  return keys.length > 0 && keys.every((key) => !key.startsWith('.'))
    ? { '.': current }
    : { ...current };
};

/**
 * Build an entry with Stencil's conditions first (`types` has to precede `import` / `require`
 * to be picked up by TypeScript), followed by any other conditions already on the entry.
 * @param current The entry's current value
 * @param owned The conditions to set; any owned condition left out is removed
 * @returns The merged entry
 */
const mergeConditions = (
  current: unknown,
  owned: Record<keyof ExportConditions, unknown> | ExportConditions,
): JsonObject => {
  const others = isJsonObject(current)
    ? Object.entries(current).filter(([key]) => !OWNED_CONDITIONS.includes(key))
    : [];
  const { types, import: importPath, require: requirePath } = owned;
  return Object.fromEntries([
    ...Object.entries({ types, import: importPath, require: requirePath }).filter(
      ([, value]) => value !== undefined,
    ),
    ...others,
  ]);
};

/**
 * Get the root export `exports["."]`.
 *
 * @param config The validated Stencil config
 * @param compilerCtx The compiler context
 * @param current The current root entry
 * @param loaderBundle The loader-bundle output target, if it exists
 * @param standalone The standalone output target, if it exists
 * @param types The types output target, if it exists
 * @returns The root entry to write
 */
const getRootExport = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  current: unknown,
  loaderBundle: d.OutputTargetLoaderBundle | undefined,
  standalone: d.OutputTargetStandalone | undefined,
  types: d.OutputTargetTypes | undefined,
) => {
  // a string target is only kept if it exists, nested conditions are always the author's own
  const isUsable = (target: unknown) =>
    isString(target) ? compilerCtx.fs.accessSync(join(config.rootDir, target)) : target != null;

  if (isString(current) && isUsable(current)) {
    return current;
  }
  const existing = isJsonObject(current) ? current : {};

  // Without a src/index.ts, the loader-bundle's own index.js/index.d.ts are just an
  // empty auto-generated stub - the real entry point is the esm/loader.js it forwards to.
  const hasSrcIndex = compilerCtx.fs.accessSync(join(config.srcDir, 'index.ts'));
  const rootUsesEmptyLoaderIndex = !!loaderBundle && !hasSrcIndex;

  const conditions: Record<keyof ExportConditions, unknown> = {
    types: existing.types,
    import: existing.import,
    require: existing.require,
  };

  if (!isUsable(existing.import)) {
    // Priority: loader-bundle > standalone
    const primaryDir = loaderBundle?.dir ?? standalone?.dir;
    if (primaryDir) {
      const entryFile = rootUsesEmptyLoaderIndex ? join('esm', 'loader.js') : 'index.js';
      conditions.import = toRelativePath(config, join(primaryDir, entryFile));

      if (loaderBundle?.cjs) {
        const cjsEntryFile = rootUsesEmptyLoaderIndex ? join('cjs', 'loader.cjs') : 'index.cjs';
        conditions.require = toRelativePath(config, join(loaderBundle.dir, cjsEntryFile));
      }
    }
  }

  if (types?.dir && !isUsable(existing.types)) {
    // index.d.ts only exists when there's a src/index.ts - otherwise point at the entry
    // types the primary output generates (loader-bundle > standalone, as above)
    const typesFile = hasSrcIndex ? 'index.d.ts' : loaderBundle ? 'loader.d.ts' : 'standalone.d.ts';
    conditions.types = toRelativePath(config, join(types.dir, typesFile));
  }

  return mergeConditions(existing, conditions);
};

/**
 * Get every non-root entry Stencil generates for the configured output targets.
 *
 * @param config The validated Stencil config
 * @param buildCtx The build context containing the components to generate export maps for
 * @param loaderBundle The loader-bundle output target, if it exists
 * @param standalone The standalone output target, if it exists
 * @param ssr The ssr output target, if it exists
 * @param types The types output target, if it exists
 * @returns The generated entries, keyed by subpath
 */
const getGeneratedExports = (
  config: d.ValidatedConfig,
  buildCtx: d.BuildCtx,
  loaderBundle: d.OutputTargetLoaderBundle | undefined,
  standalone: d.OutputTargetStandalone | undefined,
  ssr: d.OutputTargetSsr | undefined,
  types: d.OutputTargetTypes | undefined,
) => {
  const generated: Record<string, ExportConditions | string> = {};

  // Points directly to esm/loader.js (no separate loader directory)
  if (loaderBundle) {
    generated['./loader'] = {
      types: types?.dir ? toRelativePath(config, join(types.dir, 'loader.d.ts')) : undefined,
      import: toRelativePath(config, join(loaderBundle.dir, 'esm', 'loader.js')),
      require: loaderBundle.cjs
        ? toRelativePath(config, join(loaderBundle.dir, 'cjs', 'loader.cjs'))
        : undefined,
    };
  }

  if (standalone?.dir) {
    const outDir = toRelativePath(config, standalone.dir);

    // The standalone output's own index.js, so its runtime helpers (`setTagTransformer`,
    // `setNonce`, ...) stay reachable when `loader-bundle` holds the root export.
    generated['./standalone'] = { types: `${outDir}/index.d.ts`, import: `${outDir}/index.js` };

    for (const cmp of buildCtx.components) {
      generated[`./${cmp.tagName}`] = {
        types: `${outDir}/${cmp.tagName}.d.ts`,
        import: `${outDir}/${cmp.tagName}.js`,
      };
    }
  }

  if (ssr?.dir) {
    const outDir = toRelativePath(config, ssr.dir);
    generated['./ssr'] = {
      types: `${outDir}/index.d.ts`,
      import: `${outDir}/index.js`,
      require: ssr.cjs ? `${outDir}/index.cjs` : undefined,
    };
  }

  if (loaderBundle || standalone) {
    const globalStyles = config.outputTargets.filter(isOutputTargetGlobalStyle);
    const assetsDir = (config.outputTargets.find(isOutputTargetAssets) ?? globalStyles[0])?.dir;
    if (assetsDir) {
      generated['./assets/*'] = `${toRelativePath(config, assetsDir)}/*`;
    }
    // a global stylesheet written outside the assets dir isn't covered by the wildcard
    for (const globalStyle of globalStyles) {
      if (globalStyle.dir && globalStyle.fileName && globalStyle.dir !== assetsDir) {
        generated[`./assets/${globalStyle.fileName}`] = toRelativePath(
          config,
          join(globalStyle.dir, globalStyle.fileName),
        );
      }
    }
  }

  return generated;
};

/**
 * Remove per-component entries Stencil generated for components that no longer exist.
 * Only an entry in the exact shape Stencil writes (`./<tag>` → `<standalone dir>/<tag>.js`)
 * is removed, so entries added by the author are left alone.
 *
 * @param exportMap The export map to remove entries from
 * @param generated The entries generated by this build
 * @param standaloneDir The standalone output directory, relative to the project root
 */
const removeStaleComponentExports = (
  exportMap: JsonObject,
  generated: Record<string, unknown>,
  standaloneDir: string,
) => {
  for (const [key, entry] of Object.entries(exportMap)) {
    const name = key.slice(2);
    if (!key.startsWith('./') || !name.includes('-') || key in generated) {
      continue;
    }
    const target = isJsonObject(entry) ? entry.import : entry;
    if (target === `${standaloneDir}/${name}.js`) {
      delete exportMap[key];
    }
  }
};

/**
 * Get a path relative to the project root, in the `./`-prefixed form `exports` targets require.
 * @param config The validated Stencil config
 * @param path The absolute path
 * @returns The relative path
 */
const toRelativePath = (config: d.ValidatedConfig, path: string) => {
  const relativePath = normalizePath(relative(config.rootDir, path));
  return relativePath.startsWith('./') || relativePath.startsWith('../')
    ? relativePath
    : './' + relativePath;
};
