// One shared CSSStyleSheet per distinct CSS text, adopted into every registered root - so N
// components pulling in the same side-effect CSS import each get it on their own root, without
// re-parsing or duplicating the stylesheet. Registration and injection are order-independent:
// a root registering late still gets caught up, and CSS injected before any root exists still
// applies once one registers - needed since a lazily `import()`ed CSS dependency's top-level code
// runs once, the first time anything imports it, regardless of load order across components.
const styleSheets = new Map<string, CSSStyleSheet>();
const knownRoots = new Set<DocumentOrShadowRoot>();
const adoptedRoots = new WeakMap<CSSStyleSheet, WeakSet<DocumentOrShadowRoot>>();
// `@font-face` text already adopted onto the real top-level `document` - see `injectSideEffectStyle`.
const knownFontFaces = new Set<string>();

const adopt = (root: DocumentOrShadowRoot, sheet: CSSStyleSheet) => {
  let roots = adoptedRoots.get(sheet);
  if (!roots) {
    roots = new WeakSet();
    adoptedRoots.set(sheet, roots);
  }
  if (!roots.has(root)) {
    roots.add(root);
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
  }
};

/**
 * Registers a root (a shadow root, or `document`) to receive every side-effect CSS import
 * (a plain, non-component `import './foo.css'`), now and in future. Call in `connectedCallback`,
 * paired with `unregisterSideEffectStyleTarget` in `disconnectedCallback` so the registry doesn't
 * hold disconnected roots forever.
 * @param root the root to register
 */
export function registerSideEffectStyleTarget(root: DocumentOrShadowRoot): void {
  knownRoots.add(root);
  for (const sheet of styleSheets.values()) {
    adopt(root, sheet);
  }
}

/**
 * Removes a root registered via `registerSideEffectStyleTarget` - call in `disconnectedCallback`.
 * @param root the root to unregister
 */
export function unregisterSideEffectStyleTarget(root: DocumentOrShadowRoot): void {
  knownRoots.delete(root);
}

// `@font-face` rules can't have nested braces (only descriptor declarations), so a non-nesting
// match is safe.
const FONT_FACE_RE = /@font-face\s*\{[^{}]*\}/g;

/**
 * Splits `@font-face` rules out of a CSS text - exported standalone (from private
 * module state - usually 3rd party node_modules) exported for testing
 * @param cssText the CSS text to split
 * @returns the font-face rules joined together (`null` if there were none) and the remaining CSS
 */
export function splitFontFaces(cssText: string): { fontFaceText: string | null; rest: string } {
  const fontFaces = cssText.match(FONT_FACE_RE);
  if (!fontFaces) return { fontFaceText: null, rest: cssText };
  return { fontFaceText: fontFaces.join('\n'), rest: cssText.replace(FONT_FACE_RE, '') };
}

/**
 * Applies plain (non-component) CSS text to every registered root - respects shadow DOM
 * encapsulation instead of always reaching for the top-level document. Not meant to be called
 * directly: this is what the compiler's CSS-to-ESM output calls for CSS with no Stencil `tag`
 * (i.e. not a component's own `styleUrl`), typically a third-party dependency's CSS import.
 *
 * `@font-face` rules are pulled out and adopted onto top-level `document` not per-root
 * (Chromium (https://issues.chromium.org/issues/41085401) per-root never loads).
 * @param cssText the CSS text to apply
 */
export function injectSideEffectStyle(cssText: string): void {
  const { fontFaceText, rest } = splitFontFaces(cssText);
  if (fontFaceText && !knownFontFaces.has(fontFaceText)) {
    knownFontFaces.add(fontFaceText);
    const fontFaceSheet = new CSSStyleSheet();
    fontFaceSheet.replaceSync(fontFaceText);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, fontFaceSheet];
  }
  if (!rest.trim()) return;

  let sheet = styleSheets.get(rest);
  if (!sheet) {
    sheet = new CSSStyleSheet();
    sheet.replaceSync(rest);
    styleSheets.set(rest, sheet);
  }
  for (const root of knownRoots) {
    adopt(root, sheet);
  }
}
