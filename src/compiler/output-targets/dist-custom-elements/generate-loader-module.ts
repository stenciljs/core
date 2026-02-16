import type * as d from '../../../declarations';
import { STENCIL_INTERNAL_CLIENT_ID } from '../../bundle/entry-alias-ids';

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
  const autoStart = typeof autoLoaderConfig === 'object' ? autoLoaderConfig.autoStart !== false : true;

  // Build component map: { 'my-button': './my-button.js', ... }
  const componentMap = components.map((cmp) => `  '${cmp.tagName}': './${cmp.tagName}.js'`).join(',\n');

  return `
import { transformTag } from '${STENCIL_INTERNAL_CLIENT_ID}';

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
 * @param root - The root element to scan
 * @param lookup - The transformed tag lookup map
 */
async function load(root, lookup) {
  const rootTag = root instanceof Element ? root.tagName.toLowerCase() : '';
  const tags = [...root.querySelectorAll(':not(:defined)')]
    .map(el => el.tagName.toLowerCase())
    .filter(tag => lookup[tag] && !defined.has(tag));

  // Also check the root element itself
  if (rootTag && lookup[rootTag] && !defined.has(rootTag)) {
    tags.push(rootTag);
  }

  // Load unique tags in parallel
  await Promise.allSettled([...new Set(tags)].map(tag => register(tag, lookup)));
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
