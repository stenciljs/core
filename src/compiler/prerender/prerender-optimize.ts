import { catchError, flatOne, isString, join, unique } from '@utils';

import type * as d from '../../declarations';
import { injectModulePreloads } from '../html/inject-module-preloads';
import { minifyCss } from '../optimize/minify-css';
import { optimizeCss } from '../optimize/optimize-css';
import { optimizeJs } from '../optimize/optimize-js';
import { getScopeId } from '../style/scope-css';
import { PrerenderContext } from './prerender-worker-ctx';

export const inlineExternalStyleSheets = async (sys: d.CompilerSystem, appDir: string, doc: Document) => {
  const documentLinks = Array.from(doc.querySelectorAll('link[rel=stylesheet]')) as HTMLLinkElement[];
  if (documentLinks.length === 0) {
    return;
  }

  await Promise.all(
    documentLinks.map(async (link) => {
      const href = link.getAttribute('href');
      if (!href.startsWith('/') || link.getAttribute('media') !== null) {
        return;
      }

      const fsPath = join(appDir, href);

      try {
        let styles = await sys.readFile(fsPath);

        const optimizeResults = await optimizeCss({
          input: styles,
        });

        styles = optimizeResults.output;

        // insert inline <style>
        const inlinedStyles = doc.createElement('style');
        inlinedStyles.innerHTML = styles;
        link.parentNode.insertBefore(inlinedStyles, link);
        link.remove();

        // mark inlinedStyle as tree-shakable
        inlinedStyles.setAttribute('data-styles', '');

        // since it's no longer a critical resource
        link.setAttribute('media', '(max-width: 0px)');
        link.setAttribute('importance', 'low');
        link.setAttribute('onload', `this.media=''`);

        // move <link rel="stylesheet"> to the end of <body>
        doc.body.appendChild(link);
      } catch (e) {}
    }),
  );
};

export const minifyScriptElements = async (doc: Document, addMinifiedAttr: boolean) => {
  const scriptElms = Array.from(doc.querySelectorAll('script')).filter((scriptElm) => {
    if (scriptElm.hasAttribute('src') || scriptElm.hasAttribute(dataMinifiedAttr)) {
      return false;
    }
    const scriptType = scriptElm.getAttribute('type');
    if (typeof scriptType === 'string' && scriptType !== 'module' && scriptType !== 'text/javascript') {
      return false;
    }
    return true;
  });

  if (scriptElms.length === 0) {
    return;
  }

  await Promise.all(
    scriptElms.map(async (scriptElm) => {
      const content = scriptElm.innerHTML.trim();
      if (content.length > 0) {
        const opts: d.OptimizeJsInput = {
          input: content,
          sourceMap: false,
          target: 'latest',
        };

        if (scriptElm.getAttribute('type') !== 'module') {
          opts.target = 'es5';
        }

        const optimizeResults = await optimizeJs(opts);

        if (optimizeResults.diagnostics.length === 0) {
          scriptElm.innerHTML = optimizeResults.output;
        }

        if (addMinifiedAttr) {
          scriptElm.setAttribute(dataMinifiedAttr, '');
        }
      }
    }),
  );
};

export const minifyStyleElements = async (
  sys: d.CompilerSystem,
  appDir: string,
  doc: Document,
  currentUrl: URL,
  addMinifiedAttr: boolean,
) => {
  const styleElms = Array.from(doc.querySelectorAll('style')).filter((styleElm) => {
    if (styleElm.hasAttribute(dataMinifiedAttr)) {
      return false;
    }
    return true;
  });

  await Promise.all(
    styleElms.map(async (styleElm) => {
      const content = styleElm.innerHTML.trim();
      if (content.length > 0) {
        const optimizeResults = await optimizeCss({
          input: content,
          minify: true,
          async resolveUrl(urlProp) {
            const assetUrl = new URL(urlProp, currentUrl);
            const hash = await getAssetFileHash(sys, appDir, assetUrl);
            assetUrl.searchParams.append('v', hash);
            return assetUrl.pathname + assetUrl.search;
          },
        });
        if (optimizeResults.diagnostics.length === 0) {
          styleElm.innerHTML = optimizeResults.output;
        }
        if (addMinifiedAttr) {
          styleElm.setAttribute(dataMinifiedAttr, '');
        }
      }
    }),
  );
};

export const excludeStaticComponents = (
  doc: Document,
  hydrateOpts: d.PrerenderHydrateOptions,
  hydrateResults: d.HydrateResults,
) => {
  const staticComponents = hydrateOpts.staticComponents.filter((tag) => {
    return hydrateResults.components.some((cmp) => cmp.tag === tag);
  });

  if (staticComponents.length > 0) {
    const stencilScriptElm = doc.querySelector('script[data-stencil-namespace]');
    if (stencilScriptElm) {
      const namespace = stencilScriptElm.getAttribute('data-stencil-namespace');
      let scriptContent = excludeComponentScript.replace('__NAMESPACE__', namespace);
      scriptContent = scriptContent.replace('__EXCLUDE__', JSON.stringify(staticComponents));

      const dataOptsScript = doc.createElement('script');
      dataOptsScript.innerHTML = scriptContent;
      dataOptsScript.setAttribute(dataMinifiedAttr, '');

      stencilScriptElm.parentNode.insertBefore(dataOptsScript, stencilScriptElm.nextSibling);
    }
  }
};

const excludeComponentScript = `
(function(){
var s=document.querySelector('[data-stencil-namespace="__NAMESPACE__"]');
s&&((s['data-opts']=s['data-opts']||{}).exclude=__EXCLUDE__);
})();
`
  .replace(/\n/g, '')
  .trim();

export const addModulePreloads = (
  doc: Document,
  hydrateOpts: d.PrerenderHydrateOptions,
  hydrateResults: d.HydrateResults,
  componentGraph: Map<string, string[]>,
) => {
  if (!componentGraph) {
    return false;
  }

  const staticComponents = hydrateOpts.staticComponents || [];

  const cmpTags = hydrateResults.components.filter((cmp) => !staticComponents.includes(cmp.tag));

  const modulePreloads = unique(
    flatOne(cmpTags.map((cmp) => getScopeId(cmp.tag, cmp.mode)).map((scopeId) => componentGraph.get(scopeId) || [])),
  );

  injectModulePreloads(doc, modulePreloads);
  return true;
};

export const removeModulePreloads = (doc: Document) => {
  const links = doc.querySelectorAll('link[rel="modulepreload"]');
  for (let i = links.length - 1; i >= 0; i--) {
    const href = links[i].getAttribute('href');
    if (href && href.includes('/p-')) {
      links[i].remove();
    }
  }
};

export const removeStencilScripts = (doc: Document) => {
  const stencilScripts = doc.querySelectorAll('script[data-stencil]');
  for (let i = stencilScripts.length - 1; i >= 0; i--) {
    stencilScripts[i].remove();
  }
};

export const hasStencilScript = (doc: Document) => {
  return !!doc.querySelector('script[data-stencil]');
};

export const hashAssets = async (
  sys: d.CompilerSystem,
  prerenderCtx: PrerenderContext,
  diagnostics: d.Diagnostic[],
  hydrateOpts: d.PrerenderHydrateOptions,
  appDir: string,
  doc: Document,
  currentUrl: URL,
) => {
  // do one at a time to prevent too many opened files and memory usage issues
  // hash id is cached in each worker, so shouldn't have to do this for every page

  // update the stylesheet content first so the hash url()s are apart of the file's hash too
  const links = Array.from(doc.querySelectorAll('link[rel=stylesheet][href]')) as HTMLLinkElement[];

  for (const link of links) {
    const href = link.getAttribute('href');
    if (isString(href) && href.length > 0) {
      const stylesheetUrl = new URL(href, currentUrl);
      if (currentUrl.host === stylesheetUrl.host) {
        try {
          const filePath = join(appDir, stylesheetUrl.pathname);
          if (prerenderCtx.hashedFile.has(filePath)) {
            continue;
          }
          prerenderCtx.hashedFile.add(filePath);

          let css = await sys.readFile(filePath);
          if (isString(css) && css.length > 0) {
            css = await minifyCss({
              css,
              async resolveUrl(urlProp) {
                const assetUrl = new URL(urlProp, stylesheetUrl);
                const hash = await getAssetFileHash(sys, appDir, assetUrl);
                assetUrl.searchParams.append('v', hash);
                return assetUrl.pathname + assetUrl.search;
              },
            });
            sys.writeFileSync(filePath, css);
          }
        } catch (e: any) {
          catchError(diagnostics, e);
        }
      }
    }
  }

  await hashAsset(sys, hydrateOpts, appDir, doc, currentUrl, 'link[rel="stylesheet"]', ['href']);
  await hashAsset(sys, hydrateOpts, appDir, doc, currentUrl, 'link[rel="prefetch"]', ['href']);
  await hashAsset(sys, hydrateOpts, appDir, doc, currentUrl, 'link[rel="preload"]', ['href']);
  await hashAsset(sys, hydrateOpts, appDir, doc, currentUrl, 'link[rel="modulepreload"]', ['href']);
  await hashAsset(sys, hydrateOpts, appDir, doc, currentUrl, 'link[rel="icon"]', ['href']);
  await hashAsset(sys, hydrateOpts, appDir, doc, currentUrl, 'link[rel="apple-touch-icon"]', ['href']);
  await hashAsset(sys, hydrateOpts, appDir, doc, currentUrl, 'link[rel="manifest"]', ['href']);
  await hashAsset(sys, hydrateOpts, appDir, doc, currentUrl, 'script', ['src']);
  await hashAsset(sys, hydrateOpts, appDir, doc, currentUrl, 'img', ['src', 'srcset']);
  await hashAsset(sys, hydrateOpts, appDir, doc, currentUrl, 'picture > source', ['srcset']);

  const pageStates = Array.from(
    doc.querySelectorAll('script[data-stencil-static="page.state"][type="application/json"]'),
  ) as HTMLScriptElement[];
  if (pageStates.length > 0) {
    await Promise.all(
      pageStates.map(async (pageStateScript) => {
        const pageState = JSON.parse(pageStateScript.textContent);
        if (pageState && Array.isArray(pageState.ast)) {
          for (const node of pageState.ast) {
            if (Array.isArray(node)) {
              await hashPageStateAstAssets(sys, hydrateOpts, appDir, currentUrl, pageStateScript, node);
            }
          }
          pageStateScript.textContent = JSON.stringify(pageState);
        }
      }),
    );
  }
};

const hashAsset = async (
  sys: d.CompilerSystem,
  hydrateOpts: d.PrerenderHydrateOptions,
  appDir: string,
  doc: Document,
  currentUrl: URL,
  selector: string,
  srcAttrs: string[],
) => {
  const elms = Array.from(doc.querySelectorAll(selector));

  // do one at a time to prevent too many opened files and memory usage issues
  for (const elm of elms) {
    for (const attrName of srcAttrs) {
      const srcValues = getAttrUrls(attrName, elm.getAttribute(attrName));
      for (const srcValue of srcValues) {
        const assetUrl = new URL(srcValue.src, currentUrl);
        if (assetUrl.hostname === currentUrl.hostname) {
          if (hydrateOpts.hashAssets === 'querystring' && !assetUrl.searchParams.has('v')) {
            try {
              const hash = await getAssetFileHash(sys, appDir, assetUrl);
              if (isString(hash)) {
                assetUrl.searchParams.append('v', hash);
                const attrValue = setAttrUrls(assetUrl, srcValue.descriptor);
                elm.setAttribute(attrName, attrValue);
              }
            } catch (e) {}
          }
        }
      }
    }
  }
};

const hashPageStateAstAssets = async (
  sys: d.CompilerSystem,
  hydrateOpts: d.PrerenderHydrateOptions,
  appDir: string,
  currentUrl: URL,
  pageStateScript: HTMLScriptElement,
  node: any[],
) => {
  const tagName = node[0];
  const attrs = node[1];

  if (isString(tagName)) {
    if (attrs) {
      if (tagName === 'img' || tagName === 'source') {
        for (const attrName of ['src', 'srcset']) {
          const srcValues = getAttrUrls(attrName, attrs[attrName]);
          for (const srcValue of srcValues) {
            const assetUrl = new URL(srcValue.src, currentUrl);
            if (assetUrl.hostname === currentUrl.hostname) {
              if (hydrateOpts.hashAssets === 'querystring' && !assetUrl.searchParams.has('v')) {
                try {
                  const hash = await getAssetFileHash(sys, appDir, assetUrl);
                  if (isString(hash)) {
                    assetUrl.searchParams.append('v', hash);
                    const attrValue = setAttrUrls(assetUrl, srcValue.descriptor);
                    attrs[attrName] = attrValue;
                  }
                } catch (e) {}
              }
            }
          }
        }
      }
    }

    for (let i = 2, l = node.length; i < l; i++) {
      if (Array.isArray(node[i])) {
        await hashPageStateAstAssets(sys, hydrateOpts, appDir, currentUrl, pageStateScript, node[i]);
      }
    }
  }
};

export const getAttrUrls = (attrName: string, attrValue: string) => {
  const srcValues: { src: string; descriptor?: string }[] = [];
  if (isString(attrValue)) {
    if (attrName.toLowerCase() === 'srcset') {
      attrValue
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a.length > 0)
        .forEach((src) => {
          const spaceSplt = src.split(' ');
          if (spaceSplt[0].length > 0) {
            srcValues.push({ src: spaceSplt[0], descriptor: spaceSplt[1] });
          }
        });
    } else {
      srcValues.push({ src: attrValue });
    }
  }
  return srcValues;
};

export const setAttrUrls = (url: URL, descriptor: string) => {
  let src = url.pathname + url.search;
  if (isString(descriptor)) {
    src += ' ' + descriptor;
  }
  return src;
};

const hashedAssets = new Map<string, Promise<string | null>>();

const getAssetFileHash = async (sys: d.CompilerSystem, appDir: string, assetUrl: URL) => {
  let p = hashedAssets.get(assetUrl.pathname);
  if (!p) {
    const assetFilePath = join(appDir, assetUrl.pathname);
    p = sys.generateFileHash(assetFilePath, 10);
    hashedAssets.set(assetUrl.pathname, p);
  }
  return p;
};

const dataMinifiedAttr = 'data-m';
