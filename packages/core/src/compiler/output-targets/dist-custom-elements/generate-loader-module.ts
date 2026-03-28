import type * as d from '@stencil/core';

import { STENCIL_INTERNAL_CLIENT_PLATFORM_ID } from '../../bundle/entry-alias-ids';

/**
 * Generate the auto-loader module content that will be bundled via Rollup.
 * This loader uses MutationObserver to lazily load and define custom elements
 * as they appear in the DOM.
 *
 * @param components - The list of components to include in the loader
 * @param outputTarget - The output target configuration
 * @returns The generated loader module source code
 */
export const generateLoaderModule = (
  components: d.ComponentCompilerMeta[],
  outputTarget: d.OutputTargetDistCustomElements,
): string => {
  const autoLoaderConfig = outputTarget.autoLoader;
  const autoStart =
    typeof autoLoaderConfig === 'object' ? autoLoaderConfig.autoStart !== false : true;

  // Build component map: { 'my-button': './my-button.js', ... }
  const componentMap = components
    .map((cmp) => `  '${cmp.tagName}': './${cmp.tagName}.js'`)
    .join(',\n');

  return `
import { transformTag } from '${STENCIL_INTERNAL_CLIENT_PLATFORM_ID}';

/**
 * Component map built at compile time.
 * Maps original tag names to their module paths.
 */
const components = {
${componentMap}
};

/**
 * Set of tags that have already been loaded/registered.
 * Prevents duplicate loading attempts.
 */
const defined = new Set();

/**
 * MutationObserver instance for watching DOM changes.
 */
let observer;

/**
 * Build a lookup map using transformed tag names.
 * This is called at runtime to account for any tag transformers
 * that may have been set via setTagTransformer().
 */
function getTransformedLookup() {
  const lookup = {};
  for (const [tag, path] of Object.entries(components)) {
    lookup[transformTag(tag)] = { originalTag: tag, path };
  }
  return lookup;
}

/**
 * Scan a root element for undefined custom elements and load them.
 *
 * Before any modules are imported we do two things to guarantee the documented
 * Stencil lifecycle ordering (componentWillLoad top-down, componentDidLoad
 * bottom-up) regardless of module-load race conditions:
 *
 * 1. Pre-mark every not-yet-upgraded Stencil element with empty \`s-p\`/\`s-rc\`
 *    arrays so the runtime's connectedCallback ancestor walk can always find a
 *    parent element even before it has been upgraded.
 *
 * 2. For every child Stencil element, push a Promise into its nearest Stencil
 *    ancestor's \`s-p\` array. That Promise resolves only after the child's full
 *    initial lifecycle completes (\`componentDidLoad\`). This prevents the
 *    ancestor from calling its own \`componentDidLoad\` before all its
 *    descendants are ready — even when a descendant's module loads *after* the
 *    ancestor has already started rendering.
 *
 * @param root - The root element to scan
 * @param lookup - The transformed tag lookup map
 */
async function load(root, lookup) {
  const tags = new Set();
  const elements = [];

  // Collect the root element itself if it's a Stencil component.
  if (root instanceof Element) {
    const rootTag = root.tagName.toLowerCase();
    if (lookup[rootTag]) {
      if (!root['s-p']) root['s-p'] = [];
      if (!root['s-rc']) root['s-rc'] = [];
      if (!defined.has(rootTag)) tags.add(rootTag);
      elements.push(root);
    }
  }

  // Collect all not-yet-upgraded descendants that are known Stencil components.
  root.querySelectorAll(':not(:defined)').forEach(el => {
    const tag = el.tagName.toLowerCase();
    if (lookup[tag]) {
      if (!el['s-p']) el['s-p'] = [];
      if (!el['s-rc']) el['s-rc'] = [];
      if (!defined.has(tag)) tags.add(tag);
      elements.push(el);
    }
  });

  // For each child Stencil element, find its nearest Stencil ancestor element
  // and push a lifecycle promise into that ancestor's s-p array. The promise
  // resolves when the child's componentDidLoad fires (via $onReadyPromise$).
  // This ensures the ancestor waits for the child even when the child's module
  // loads after the ancestor has already begun its own lifecycle.
  for (const el of elements) {
    const tag = el.tagName.toLowerCase();
    let ancestor = el.parentElement;
    while (ancestor) {
      if (lookup[ancestor.tagName.toLowerCase()]) {
        // Push a placeholder promise that resolves after the child is ready.
        // customElements.whenDefined resolves after the element has been
        // upgraded (constructor + connectedCallback have run synchronously),
        // at which point __stencil__getHostRef and $onReadyPromise$ are set.
        ancestor['s-p'].push(
          customElements.whenDefined(tag).then(() => el['s-rp'])
        );
        break;
      }
      ancestor = ancestor.parentElement;
    }
  }

  // Load all unique tags in parallel — lifecycle ordering is handled by the
  // pre-marked s-p/s-rc arrays and the wired-up ready promises above.
  await Promise.allSettled([...tags].map(tag => register(tag, lookup)));
}

/**
 * Register a single component by importing its module.
 * @param transformedTag - The transformed tag name (as it appears in the DOM)
 * @param lookup - The transformed tag lookup map
 */
async function register(transformedTag, lookup) {
  // Skip if already defined or being defined
  if (defined.has(transformedTag) || customElements.get(transformedTag)) {
    defined.add(transformedTag);
    return;
  }

  // Mark as being processed to prevent duplicate attempts
  defined.add(transformedTag);
  const { path } = lookup[transformedTag];

  try {
    const module = await import(path);
    // Call defineCustomElement if exported (handles component + dependencies)
    if (typeof module.defineCustomElement === 'function') {
      module.defineCustomElement();
    }
  } catch (e) {
    console.error(\`[Stencil Loader] Failed to load <\${transformedTag}>\`, e);
    // Remove from defined set to allow retry
    defined.delete(transformedTag);
  }
}

/**
 * Start the auto-loader, scanning the DOM and watching for changes.
 * @param root - The root element to observe (default: document.body)
 */
export function start(root = document.body) {
  const lookup = getTransformedLookup();

  // Disconnect any existing observer
  if (observer) {
    observer.disconnect();
  }

  // Create MutationObserver to watch for new elements
  observer = new MutationObserver(mutations => {
    for (const { addedNodes } of mutations) {
      for (const node of addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          load(node, lookup);
        }
      }
    }
  });

  // Initial scan of existing DOM
  load(root, lookup);

  // Start observing for new elements
  observer.observe(root, { subtree: true, childList: true });
}

/**
 * Stop the auto-loader and disconnect the MutationObserver.
 */
export function stop() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}
${autoStart ? '\n// Auto-start the loader\nstart();' : ''}
`.trim();
};
