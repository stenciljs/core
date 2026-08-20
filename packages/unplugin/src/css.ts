/**
 * CSS pipeline for Stencil component stylesheets.
 *
 * When the Stencil compiler emits a style import such as
 * `./foo.css?tag=my-cmp&encapsulation=shadow`, `resolveStencilCss` rewrites it
 * to a `\0stencil-css:` virtual module ID. The bundler then calls `load`, which
 * reads the real file and runs it through any installed preprocessors in order:
 * Sass/Less → PostCSS → lightningcss → scoped-selector rewrite (for scoped
 * encapsulation). The result is returned as `export default () => "…css…"` so
 * the bundler treats it as a normal JS module dependency.
 *
 * Each preprocessor step is silently skipped if the relevant peer dep is absent.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getScopeId, scopeCss } from '@stencil/core/compiler';
import { isPackageExists } from 'local-pkg';

// Matches Stencil's emitted style imports: `./foo.css?tag=my-cmp&…`
const STENCIL_CSS_RE = /\.(?:css|scss|sass|less|styl)\?[^/]*\btag=/;
const STENCIL_CSS_PREFIX = '\0stencil-css:';

// Evaluated once at startup — avoids repeated filesystem probes per CSS file.
const PKG = {
  sass: isPackageExists('sass'),
  less: isPackageExists('less'),
  postcss: isPackageExists('postcss') && isPackageExists('postcss-load-config'),
  lightningcss: isPackageExists('lightningcss'),
};

/**
 * Rewrites a Stencil CSS import to a `\0stencil-css:` virtual module ID.
 * The file extension is stored dotless as `__ext` so Vite's `CSS_LANGS_RE`
 * never matches the virtual ID and tries to own the module itself.
 * @param specifier - the raw import specifier from the component source
 * @param importer - absolute path of the importing file
 * @returns virtual module ID, or `null` for non-Stencil CSS imports
 */
export function resolveStencilCss(specifier: string, importer: string): string | null {
  if (!STENCIL_CSS_RE.test(specifier)) return null;
  const [base, query] = specifier.split('?');
  const absBase = resolve(dirname(importer), base);
  const ext = extname(absBase);
  const stem = absBase.slice(0, absBase.length - ext.length);
  return `${STENCIL_CSS_PREFIX}${stem}?${query}&__ext=${encodeURIComponent(ext.slice(1))}`;
}

export function isStencilCss(id: string): boolean {
  return id.startsWith(STENCIL_CSS_PREFIX);
}

/**
 * Extracts the real CSS file path from a `\0stencil-css:` virtual module ID.
 * @param id - virtual module ID produced by `resolveStencilCss`
 * @returns absolute file path, or `null` if not a Stencil CSS virtual module
 */
export function getRealCssPath(id: string): string | null {
  if (!id.startsWith(STENCIL_CSS_PREFIX)) return null;
  const withoutPrefix = id.slice(STENCIL_CSS_PREFIX.length);
  const qIdx = withoutPrefix.indexOf('?');
  const stem = qIdx === -1 ? withoutPrefix : withoutPrefix.slice(0, qIdx);
  const query = qIdx === -1 ? '' : withoutPrefix.slice(qIdx + 1);
  const ext = decodeURIComponent(new URLSearchParams(query).get('__ext') ?? 'css');
  return `${stem}.${ext}`;
}

async function compileSass(
  source: string,
  filePath: string,
  indented: boolean,
): Promise<{ css: string; deps: string[] }> {
  const sass = await import('sass');
  const mainUrl = `file://${filePath}`;
  const result = sass.compileString(source, {
    url: new URL(mainUrl),
    syntax: indented ? 'indented' : 'scss',
  });
  const deps = result.loadedUrls
    .filter((u) => u.protocol === 'file:' && u.href !== mainUrl)
    .map((u) => fileURLToPath(u));
  return { css: result.css, deps };
}

async function compileLess(
  source: string,
  filePath: string,
): Promise<{ css: string; deps: string[] }> {
  const less = await import('less');
  const result = await less.default.render(source, {
    filename: filePath,
    paths: [dirname(filePath)],
  });
  return { css: result.css, deps: result.imports ?? [] };
}

// Cache PostCSS config per directory to avoid repeated filesystem lookups.
const postcssConfigCache = new Map<
  string,
  { plugins: unknown[]; options: Record<string, unknown> } | null
>();

async function runPostCss(css: string, filePath: string): Promise<string> {
  const dir = dirname(filePath);
  let config = postcssConfigCache.get(dir);

  if (config === undefined) {
    try {
      const { default: loadConfig } = await import('postcss-load-config');
      const loaded = await loadConfig({}, dir);
      config = {
        plugins: loaded.plugins as unknown[],
        options: loaded.options as Record<string, unknown>,
      };
    } catch {
      config = null;
    }
    postcssConfigCache.set(dir, config);
  }

  if (!config?.plugins.length) return css;

  const { default: postcss } = await import('postcss');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await postcss(config.plugins as any[]).process(css, {
    ...config.options,
    from: filePath,
  });
  return result.css;
}

async function runLightningCss(css: string, filePath: string, minify: boolean): Promise<string> {
  const { transform } = await import('lightningcss');
  const result = transform({
    filename: filePath,
    code: Buffer.from(css),
    minify,
  });
  return result.code.toString();
}

/**
 * Loads a Stencil CSS virtual module.
 *
 * Processing order:
 * 1. Read raw file
 * 2. Preprocessor: Sass/SCSS (`sass`) or Less (`less`) if installed
 * 3. PostCSS with `postcss.config.*` if `postcss` + `postcss-load-config` are installed
 * 4. lightningcss if installed — syntax lowering, vendor prefixes, minification in prod
 * 5. Scoped selector rewrite for `encapsulation: 'scoped'`
 *
 * Each step is skipped silently if the relevant peer dep is not installed.
 * Returns `export default "css string"` so bundlers treat the import as a JS module.
 * @param id - virtual module id produced by `resolveStencilCss`
 * @param isDev - `true` in dev mode (disables minification)
 * @returns ESM string export of the processed CSS, or `null` if not a Stencil CSS virtual module
 */
export async function loadStencilCss(
  id: string,
  isDev = true,
): Promise<{ code: string; deps: string[] } | null> {
  if (!id.startsWith(STENCIL_CSS_PREFIX)) return null;

  const withoutPrefix = id.slice(STENCIL_CSS_PREFIX.length);
  const qIdx = withoutPrefix.indexOf('?');
  const stem = qIdx === -1 ? withoutPrefix : withoutPrefix.slice(0, qIdx);
  const query = qIdx === -1 ? '' : withoutPrefix.slice(qIdx + 1);
  const params = new URLSearchParams(query);
  const tag = params.get('tag') ?? '';
  const encapsulation = params.get('encapsulation') ?? 'none';
  const ext = decodeURIComponent(params.get('__ext') ?? 'css');
  const filePath = `${stem}.${ext}`;

  if (!existsSync(filePath)) return { code: 'export default () => ""', deps: [] };

  let css = readFileSync(filePath, 'utf-8');
  let deps: string[] = [];

  if (PKG.sass && (ext === 'scss' || ext === 'sass')) {
    const r = await compileSass(css, filePath, ext === 'sass');
    css = r.css;
    deps = r.deps;
  } else if (PKG.less && ext === 'less') {
    const r = await compileLess(css, filePath);
    css = r.css;
    deps = r.deps;
  }

  if (PKG.postcss) css = await runPostCss(css, filePath);
  if (PKG.lightningcss) css = await runLightningCss(css, filePath, !isDev);

  if (encapsulation === 'scoped' && tag) {
    css = scopeCss(css, getScopeId(tag), false);
  }

  return { code: `export default () => ${JSON.stringify(css)};`, deps };
}
