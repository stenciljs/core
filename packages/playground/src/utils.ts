export interface PlaygroundFile {
  name: string;
  content: string;
}

/** A compiled project file, keyed by its bare-specifier virtual path - the same flat `name`
 * it has in `PlaygroundFile`. */
export interface CompiledFile {
  virtualPath: string;
  code: string;
  componentTags: string[];
}

// Resolves a `./`/`../` specifier against the importing file's virtual (flat) path - e.g.
// `resolveRelativePath('./sibling', 'my-component.tsx') === 'sibling'`. Non-relative (bare/vendor)
// specifiers return `null` and are left to the vendor import map.
export const resolveRelativePath = (specifier: string, fromVirtualPath: string): string | null => {
  if (!specifier.startsWith('./') && !specifier.startsWith('../')) {
    return null;
  }
  const stack = fromVirtualPath.split('/').slice(0, -1);
  for (const part of specifier.split('/')) {
    if (part === '.' || part === '') continue;
    if (part === '..') stack.pop();
    else stack.push(part);
  }
  return stack.join('/');
};

const SOURCE_EXTENSIONS = ['.tsx', '.ts'];

// Matches a resolved relative import against the known project files, guessing `.tsx`/`.ts`
// when the specifier omitted an extension. Returns the matched virtual path, with any `?query`
// (styleUrl tag/encapsulation data) preserved.
export const resolveProjectImport = (
  specifier: string,
  fromVirtualPath: string,
  knownPaths: Set<string>,
): string | null => {
  const [rawPath, query] = specifier.split('?');
  const resolved = rawPath && resolveRelativePath(rawPath, fromVirtualPath);
  if (!resolved) return null;
  const match = knownPaths.has(resolved)
    ? resolved
    : SOURCE_EXTENSIONS.map((ext) => `${resolved}${ext}`).find((c) => knownPaths.has(c));
  if (!match) return null;
  return query ? `${match}?${query}` : match;
};

export const replaceSpecifier = (code: string, from: string, to: string): string =>
  code.split(`"${from}"`).join(`"${to}"`).split(`'${from}'`).join(`'${to}'`);

const TAG_NAME_RE = /@Component\s*\(\s*\{[^}]*\btag\s*:\s*['"]([^'"]+)['"]/g;
export const findComponentTags = (code: string): string[] =>
  [...code.matchAll(TAG_NAME_RE)].map((m) => m[1]);

// A `styleUrl` component's style import (e.g. `import Style0 from "./cmp.css?tag=my-cmp&..."`)
// is injected into the *compiled* output by a later transform stage, so it never appears in
// `TranspileResults.imports` (populated from the original source's own imports, before that
// injection happens) - has to be found by scanning the compiled code directly instead. The
// `?tag=` query param is unique to Stencil's own style-import convention, safe to key off.
const INJECTED_STYLE_IMPORT_RE = /from\s*["']([^"']+\?tag=[^"']+)["']/g;
export const findInjectedStyleImports = (code: string): string[] =>
  [...code.matchAll(INJECTED_STYLE_IMPORT_RE)].map((m) => m[1]);

// Mirroring the real compiler's virtual `@import "stencil-globals"`/`"stencil-hydrate"` specifiers
const STENCIL_GLOBALS_RE = /@import\s+(?:url\()?\s*['"]stencil-globals['"]\s*\)?[^;]*;?/g;
const STENCIL_HYDRATE_RE = /@import\s+(?:url\()?\s*['"]stencil-hydrate['"]\s*\)?[^;]*;?/g;

export const hasStencilGlobalsImport = (css: string): boolean => css.includes('stencil-globals');
export const hasStencilHydrateImport = (css: string): boolean => css.includes('stencil-hydrate');

// `stencil-globals` becomes the collected component `globalStyleUrl`/`globalStyle` CSS.
export const resolveStencilGlobalsImport = (css: string, collectedCss: string): string =>
  css.replace(STENCIL_GLOBALS_RE, collectedCss);

// `stencil-hydrate` becomes empty: it's FOUC-prevention - not required in the browser preview
export const resolveStencilHydrateImport = (css: string): string =>
  css.replace(STENCIL_HYDRATE_RE, '');

/** The subset of `generateComponentTypes()`'s `TypesModule` return value this needs. */
interface JsxTypesModule {
  tagName: string;
  tagNameAsPascal: string;
  jsx: string;
}

// Wraps generateComponentTypes()'s per-component `.jsx` interfaces into the same
// `declare namespace LocalJSX` + `declare module '@stencil/core'` merge a real project's
// generated components.d.ts uses (see compiler/types/generate-app-types.ts), so Monaco recognizes
// `<my-component>` as a valid JSX intrinsic element with typed props. Simplified vs. the real
// generator: no `Components`/`HTMLElementTagNameMap` namespaces, so the element ref type in JSX
// is plain `HTMLElement`, not a component-specific one.
export const buildIntrinsicElementsDts = (modules: JsxTypesModule[]): string => {
  if (modules.length === 0) return '';
  const jsxInterfaces = modules.map((m) => m.jsx).join('\n');
  const localEntries = modules
    .map((m) => `        "${m.tagName}": ${m.tagNameAsPascal};`)
    .join('\n');
  const mergedEntries = modules
    .map(
      (m) =>
        `            "${m.tagName}": LocalJSX.IntrinsicElements["${m.tagName}"] & JSXBase.HTMLAttributes<HTMLElement>;`,
    )
    .join('\n');
  return `declare namespace LocalJSX {
${jsxInterfaces}
    interface IntrinsicElements {
${localEntries}
    }
}
export {};
declare module '@stencil/core' {
    export namespace JSX {
        interface IntrinsicElements {
${mergedEntries}
        }
    }
}
`;
};
