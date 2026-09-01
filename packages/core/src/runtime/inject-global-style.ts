// One shared CSSStyleSheet per distinct CSS text, adopted into every registered root - so N
// components pulling in the same plain-CSS dependency each get it on their own root, without
// re-parsing or duplicating the stylesheet. Registration and injection are order-independent:
// a root registering late still gets caught up, and CSS injected before any root exists still
// applies once one registers - needed since a lazily `import()`ed CSS dependency's top-level code
// runs once, the first time anything imports it, regardless of load order across components.
const styleSheets = new Map<string, CSSStyleSheet>();
const knownRoots = new Set<DocumentOrShadowRoot>();
const adoptedRoots = new WeakMap<CSSStyleSheet, WeakSet<DocumentOrShadowRoot>>();

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
 * Registers a root (a shadow root, or `document`) to receive every plain (non-component) global
 * style, now and in future. Call in `connectedCallback`, paired with `unregisterGlobalStyleTarget`
 * in `disconnectedCallback` so the registry doesn't hold disconnected roots forever.
 * @param root the root to register
 */
export function registerGlobalStyleTarget(root: DocumentOrShadowRoot): void {
  knownRoots.add(root);
  for (const sheet of styleSheets.values()) {
    adopt(root, sheet);
  }
}

/**
 * Removes a root registered via `registerGlobalStyleTarget` - call in `disconnectedCallback`.
 * @param root the root to unregister
 */
export function unregisterGlobalStyleTarget(root: DocumentOrShadowRoot): void {
  knownRoots.delete(root);
}

/**
 * Applies plain (non-component) CSS text to every registered root - respects shadow DOM
 * encapsulation instead of always reaching for the top-level document. Not meant to be called
 * directly: this is what the compiler's CSS-to-ESM output calls for CSS with no Stencil `tag`
 * (i.e. not a component's own `styleUrl`), typically a third-party dependency's CSS import.
 * @param cssText the CSS text to apply
 */
export function injectGlobalStyle(cssText: string): void {
  let sheet = styleSheets.get(cssText);
  if (!sheet) {
    sheet = new CSSStyleSheet();
    sheet.replaceSync(cssText);
    styleSheets.set(cssText, sheet);
  }
  for (const root of knownRoots) {
    adopt(root, sheet);
  }
}
