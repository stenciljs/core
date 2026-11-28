import { readFileSync } from 'node:fs';
import { dirname, resolve as resolvePath } from 'node:path';
import type * as d from '@stencil/core';

import { isOutputTargetDocs, normalizeFsPath } from '../../utils';
import { runPluginTransformsEsmImports } from '../plugin/plugin';

/**
 * Run a stylesheet through the plugin (e.g. Sass) and CSS-to-ESM transforms, memoized in
 * `compilerCtx.cssTransformCache` so every consumer of the same stylesheet shares one computation.
 *
 * @param config a user-supplied configuration
 * @param compilerCtx the current compiler context
 * @param buildCtx the current build context
 * @param id the stylesheet's path, annotated with its import data as query params - the cache key
 * @param data the import data serialized into `id`
 * @returns the cache entry, or `null` if the stylesheet could not be read
 */
export const transformStylesheet = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  id: string,
  data: d.ImportData,
): Promise<d.CssTransformCacheEntry | null> => {
  if (compilerCtx.cssTransformCache.has(id)) {
    return compilerCtx.cssTransformCache.get(id) ?? null;
  }
  if (!compilerCtx.worker) {
    return null;
  }

  const filePath = normalizeFsPath(id);
  const code = await compilerCtx.fs.readFile(filePath);
  if (typeof code !== 'string') {
    compilerCtx.cssTransformCache.set(id, null);
    return null;
  }

  const pluginTransforms = await runPluginTransformsEsmImports(
    config,
    compilerCtx,
    buildCtx,
    code,
    filePath,
  );
  const cssInput = data.tag
    ? pluginTransforms.code
    : inlineRelativeCssUrlAssets(pluginTransforms.code, filePath);
  const cssTransformOutput = await compilerCtx.worker.transformCssToEsm({
    file: pluginTransforms.id,
    input: cssInput,
    tag: data.tag,
    tags: buildCtx.components.map((c) => c.tagName),
    addTagTransformers: !!buildCtx.config.compat.additionalTagTransformers,
    encapsulation: data.encapsulation,
    mode: data.mode,
    sourceMap: config.sourceMap,
    minify: config.minifyCss,
    autoprefixer: config.autoprefixCss,
    // Extract docs if any docs output targets are configured
    docs: config.outputTargets.some(isOutputTargetDocs),
  });
  const entry: d.CssTransformCacheEntry = {
    pluginTransformId: pluginTransforms.id,
    pluginTransformCode: pluginTransforms.code,
    pluginTransformDependencies: pluginTransforms.dependencies,
    pluginTransformDiagnostics: pluginTransforms.diagnostics,
    cssTransformOutput,
  };
  compilerCtx.cssTransformCache.set(id, entry);
  return entry;
};

/**
 * 3rd-party stylesheets with relative `url(./font.ttf)` (font-face `src`, a background-image, ...)
 * have nowhere to resolve that path once this CSS is self-injected as a CSSStyleSheet:
 * there's no bundler output location for it to be relative *to*.
 * Inlining the referenced file as a `data:` URI sidesteps needing one - no separate asset
 * to serve, works the same regardless of how/where the final bundle is deployed.
 */
const CSS_URL_RE = /url\(\s*(['"]?)([^'"()]+)\1\s*\)/g;

const CSS_URL_ASSET_MIME_TYPES: Record<string, string> = {
  ttf: 'font/ttf',
  otf: 'font/otf',
  woff: 'font/woff',
  woff2: 'font/woff2',
  eot: 'application/vnd.ms-fontobject',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

// 3rd party css import handling: inline relative url() assets to avoid needing a separate asset to serve
const inlineRelativeCssUrlAssets = (cssText: string, cssFilePath: string): string =>
  cssText.replace(CSS_URL_RE, (original, _quote: string, url: string) => {
    // already a data: URI, an absolute URL, or root-relative - nothing to inline
    if (/^(data:|[a-z][a-z0-9+.-]*:|\/\/|\/)/i.test(url)) {
      return original;
    }
    const cleanUrl = url.split(/[?#]/)[0];
    const ext = cleanUrl.split('.').pop()?.toLowerCase();
    const mimeType = ext && CSS_URL_ASSET_MIME_TYPES[ext];
    if (!mimeType) {
      return original;
    }
    try {
      const assetPath = resolvePath(dirname(cssFilePath), cleanUrl);
      const base64 = readFileSync(assetPath).toString('base64');
      return `url("data:${mimeType};base64,${base64}")`;
    } catch {
      // referenced file doesn't exist, or isn't readable - leave the original reference as-is
      // rather than failing the whole build over one unresolved asset
      return original;
    }
  });
