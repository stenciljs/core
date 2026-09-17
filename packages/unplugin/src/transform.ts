/**
 * Component transpilation and base-class discovery.
 *
 * `transformStencil` is the main entry point: it calls `transpileSync` with
 * `componentExport: 'customelement'` so each component self-registers when
 * imported. Two code paths come out:
 *
 *  - **Component** (`@Component` present): full customelement output with
 *    `defineCustomElement`, optional HMR snippet appended in dev mode.
 *  - **Decorated base class** (`@Prop`/`@State`/etc. but no `@Component`):
 *    returned as-is — the compiler's `isStencilBaseClass` check already injects
 *    `extends HTMLElement` via `updateNativeBaseClass`.
 *
 * `makeResolver` supplies the `resolveImport` callback that `transpileSync`
 * uses during metadata collection. It serves two purposes at once: returning
 * raw source so the compiler can merge inherited props/states into the
 * component's metadata, and calling `onBaseClass` so the plugin can
 * pre-transform and cache the file before the bundler's resolveId hook fires.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { cmpMetaToDocsComponent, transpileSync } from '@stencil/core/compiler';
import type { BuildOverrides, JsonDocsComponent } from '@stencil/core/compiler';
import type { SupportedFramework } from 'unplugin';

import type { StencilPluginOptions } from './options.js';

const SOURCE_EXTS = ['.tsx', '.ts', '.js'];

// TypeScript JsxEmit enum values — stable across TS versions.
const JSX_EMIT: Record<string, number> = {
  react: 2,
  'react-jsx': 4,
  'react-jsxdev': 5,
  preserve: 1,
  'react-native': 3,
};

type JsxOpts = { jsx?: number; jsxImportSource?: string };

let cachedTsConfigJsx: JsxOpts | undefined;

function readJsxOptsFromTsConfig(cwd: string): JsxOpts {
  if (cachedTsConfigJsx !== undefined) return cachedTsConfigJsx;
  const tsconfigPath = join(cwd, 'tsconfig.json');
  if (!existsSync(tsconfigPath)) return (cachedTsConfigJsx = {});
  try {
    const raw = readFileSync(tsconfigPath, 'utf-8');
    const stripped = raw.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const tsconfig = JSON.parse(stripped);
    const co = tsconfig?.compilerOptions ?? {};
    const jsxStr: string | undefined = co.jsx?.toLowerCase();
    if (jsxStr && jsxStr in JSX_EMIT) {
      return (cachedTsConfigJsx = {
        jsx: JSX_EMIT[jsxStr],
        jsxImportSource: co.jsxImportSource,
      });
    }
  } catch {
    // ignore unreadable / malformed tsconfig
  }
  return (cachedTsConfigJsx = {});
}

// Detects classic JSX mode: `import { …, h, … } from '@stencil/core'`
const IMPORTS_H_RE = /import\s+\{[^}]*\bh\b[^}]*\}\s+from\s+['"]@stencil\/core['"]/;

/* Resolve jsx/jsxImportSource for transpileSync.
 * Priority: tsconfig.json > source heuristic (h import → classic; otherwise automatic runtime). */
function resolveJsxOpts(code: string, cwd: string): JsxOpts {
  const fromTsConfig = readJsxOptsFromTsConfig(cwd);
  if (fromTsConfig.jsx !== undefined) return fromTsConfig;
  if (IMPORTS_H_RE.test(code)) {
    return { jsx: JSX_EMIT['react'] }; // jsxFactory: 'h' auto-applied by transpile-module
  }
  return { jsx: JSX_EMIT['react-jsx'], jsxImportSource: '@stencil/core' };
}

/**
 * Resolve an import specifier to an absolute path, trying source extensions
 * and the TypeScript ESM `.js` → `.ts`/`.tsx` remap.
 * @param specifier - the import specifier (relative or extensionless)
 * @param importer - absolute path of the importing file
 * @returns absolute path to the resolved file, or `null` if nothing found on disk
 */
export function resolveSpecifier(specifier: string, importer: string): string | null {
  const base = resolve(dirname(importer), specifier);
  // Vite normalizes module IDs to forward slashes; we must match that so
  // virtual-module keys stay consistent on Windows.
  const norm = (p: string) => p.replace(/\\/g, '/');

  if (existsSync(base)) return norm(base);

  for (const ext of SOURCE_EXTS) {
    const candidate = base + ext;
    if (existsSync(candidate)) return norm(candidate);
  }

  // TypeScript ESM: `./foo.js` may physically be `./foo.ts` or `./foo.tsx`
  if (base.endsWith('.js')) {
    const stem = base.slice(0, -3);
    for (const ext of ['.ts', '.tsx']) {
      const candidate = stem + ext;
      if (existsSync(candidate)) return norm(candidate);
    }
  }

  return null;
}

/**
 * Transpile a `.tsx`/`.ts` file for use in a bundler.
 *
 * Returns `{ code, map, tagName }` for Stencil component or base-class files,
 * `null` for everything else (plain TS utilities, non-TS files, etc.).
 * `tagName` is empty string for base classes with no `@Component`.
 *
 * `onBaseClass` is called for every file the compiler resolves via
 * `resolveImport` during metadata collection. The plugin uses this to
 * pre-transform those files before the bundler's resolveId hook fires.
 * @param code - source file contents
 * @param id - absolute file path
 * @param options - plugin options
 * @param dev - `true` in dev/watch mode (enables HMR snippet)
 * @param framework - active unplugin framework
 * @param onBaseClass - called for each file in the inheritance chain with its abs path and raw source
 * @param configOverrides - pass stencil config option overrides to the transpiler
 * @returns transformed output, or `null` if the file is not a Stencil file
 */
export function transformStencil(
  code: string,
  id: string,
  options: StencilPluginOptions,
  dev = false,
  framework: SupportedFramework | '' = '',
  onBaseClass?: (absPath: string, rawCode: string) => void,
  configOverrides?: BuildOverrides,
): {
  code: string;
  map: string | null;
  tagName: string;
  docsComponent: JsonDocsComponent | null;
} | null {
  if (!id.endsWith('.tsx') && !id.endsWith('.ts')) return null;
  if (id.endsWith('.d.ts')) return null;

  // Cheap regex guard — avoids paying transpileSync cost for plain TS files.
  if (!/(@Component|@Prop|@State|@Event|@Method|@Watch|@Listen)\s*[(\s]/.test(code)) return null;

  const specPage = options.mode === 'spec-page';
  const jsxOpts = resolveJsxOpts(code, process.cwd());
  const result = transpileSync(code, {
    ...jsxOpts,
    ...options.transpileOptions,
    file: id,
    ...(specPage
      ? {
          componentExport: null,
          componentMetadata: 'compilerstatic' as const,
          coreImportPath: '@stencil/core/testing',
          // No CSS loader is wired for spec-page mode - `newSpecPage()` tests are
          // behavioral and don't need real stylesheets. `null` skips the style assignment entirely.
          style: null,
        }
      : { componentExport: 'customelement' as const }),
    styleImportData: 'queryparams',
    resolveImport: makeResolver(onBaseClass),
    buildOverrides: {
      ...configOverrides,
      ...options.transpileOptions?.buildOverrides,
      ...(dev && !specPage ? { hotModuleReplacement: true, isDev: true } : {}),
    },
  });

  if (result.diagnostics.some((d) => d.level === 'error')) {
    const msgs = result.diagnostics
      .filter((d) => d.level === 'error')
      .map((d) => d.messageText)
      .join('\n');
    throw new Error(`[@stencil/unplugin] transpile error in ${id}:\n${msgs}`);
  }

  if (!result.data?.length) {
    // No @Component — this is a base class or mixin factory. Return the
    // compiled output; for decorated classes the compiler's isStencilBaseClass
    // check already injected `extends HTMLElement`. Plain classes without
    // decorators are handled via the baseClassRegistry virtual-module path.
    if (!/@Component\s*[(\s]/.test(code)) {
      return { code: result.code, map: result.map ?? null, tagName: '', docsComponent: null };
    }
    return null;
  }

  const tagName = result.data[0].tagName;
  const className = result.data[0].componentClassName;

  let out = result.code;
  if (!specPage) {
    // customelement mode strips the export keyword, so re-export the class
    // ourselves — consumers import it by name, and
    // hmrStandalone needs it in the re-imported module in dev mode
    const namedExport = `\nexport{${className}};`;
    out = dev
      ? result.code + namedExport + buildHmrSnippet(tagName, className, framework)
      : result.code + namedExport;
  }

  const docsComponent = cmpMetaToDocsComponent(result.data[0], id);

  return { code: out, map: result.map ?? null, tagName, docsComponent };
}

/**
 * Transpile a base-class file with `transformAsBaseClass: true` so the
 * compiler injects `extends HTMLElement` into any class without an existing
 * heritage clause, regardless of whether it carries Stencil decorators.
 *
 * The result is cached in `baseClassRegistry` (in plugin.ts) and served as a
 * virtual module, ensuring the bundler always sees the injected version even
 * for plain lifecycle-only classes that the `transform` hook would otherwise skip.
 * @param rawCode - raw source of the base-class file
 * @param absPath - absolute path to the file (used as `file` for source maps)
 * @param options - plugin options forwarded to `transpileSync`
 * @returns compiled JS output
 */
export function transpileBaseClass(
  rawCode: string,
  absPath: string,
  options: StencilPluginOptions,
): string {
  const result = transpileSync(rawCode, {
    ...options.transpileOptions,
    file: absPath,
    componentExport: 'customelement',
    styleImportData: 'queryparams',
    transformAsBaseClass: true,
  });
  return result.code;
}

/* Builds the HMR client snippet appended to component output in dev mode.
 *
 * Two strategies depending on bundler:
 * - Vite / Farm: server sends a `stencil:hmr` WebSocket event via
 *   `handleHotUpdate`; the client calls `el['s-hmr'](version)` which triggers
 *   a cache-busted re-import and forced re-render.
 * - webpack / rspack / bun: use the `module.hot` re-execution pattern —
 *   `dispose` marks the reload with a flag, `accept` re-runs the module, and
 *   the new prototype is patched onto existing instances in-place. */
function buildHmrSnippet(
  tagName: string,
  className: string,
  framework: SupportedFramework | '',
): string {
  const tag = JSON.stringify(tagName);

  if (framework === 'webpack' || framework === 'rspack' || framework === 'bun') {
    const hotExpr =
      framework === 'bun'
        ? 'import.meta.hot'
        : "(typeof module !== 'undefined' && module.hot) || import.meta.webpackHot";

    return (
      `\n${className}.__stencil_module__ = import.meta.url;` +
      `\nvar _sHot = ${hotExpr};` +
      `\nif (_sHot) {` +
      `\n  if (_sHot.data && _sHot.data.stencilHmr) {` +
      `\n    var _sCtor = customElements.get(${tag});` +
      `\n    if (_sCtor) Object.getOwnPropertyNames(${className}.prototype).forEach(function(k) {` +
      `\n      if (k !== 'constructor') Object.defineProperty(_sCtor.prototype, k, Object.getOwnPropertyDescriptor(${className}.prototype, k));` +
      `\n    });` +
      `\n    document.querySelectorAll(${tag}).forEach(function(el) { el.connectedCallback && el.connectedCallback(); });` +
      `\n  }` +
      `\n  _sHot.dispose(function(data) { data.stencilHmr = true; });` +
      `\n  _sHot.accept();` +
      `\n}`
    );
  }

  // Vite and Farm both implement the Vite HMR API.
  // The s-hmr guard prevents ?s-hmr= re-imports from stacking up additional listeners.
  return (
    `\n${className}.__stencil_module__ = import.meta.url;` +
    `\nif (import.meta.hot && !import.meta.url.includes('s-hmr=')) {` +
    `\n  import.meta.hot.accept(() => {});` +
    `\n  import.meta.hot.on('stencil:hmr', function({ tagName }) {` +
    `\n    if (tagName === ${tag}) {` +
    `\n      var v = Date.now().toString(36);` +
    `\n      document.querySelectorAll(${tag}).forEach(function(el) { el['s-hmr'] && el['s-hmr'](v); });` +
    `\n    }` +
    `\n  });` +
    `\n}`
  );
}

/* Builds the `resolveImport` callback for `transpileSync`.
 *
 * The compiler calls this for every import it encounters while walking the
 * inheritance chain during metadata collection. The callback returns the raw
 * source so the compiler can merge inherited props/states/events into the
 * component's metadata. As a side-effect it calls `onBaseClass` with the same
 * raw source, giving the plugin a chance to pre-transform and cache the file
 * before the bundler's resolveId hook fires for it. */
function makeResolver(onBaseClass?: (absPath: string, rawCode: string) => void) {
  return (specifier: string, currentImporter: string): { code: string; path: string } | null => {
    const absPath = resolveSpecifier(specifier, currentImporter);
    if (!absPath) return null;

    const code = readFileSync(absPath, 'utf-8');
    onBaseClass?.(absPath, code);
    return { code, path: absPath };
  };
}
