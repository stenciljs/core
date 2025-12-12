/**
 * Collects all used selectors (tags, class names, ids, attributes) from a given DOM element and its children.
 * Mainly used during SSR / prerendering to determine which CSS rules are necessary.
 *
 * @param elm The root element from which to start collecting used selectors.
 * @returns The set of used selectors found within the element and its descendants.
 */
export const getUsedSelectors = (elm: Element) => {
  const usedSelectors: UsedSelectors = {
    attrs: new Set(),
    classNames: new Set(),
    ids: new Set(),
    tags: new Set(),
  };
  collectUsedSelectors(usedSelectors, elm);
  return usedSelectors;
};

const collectUsedSelectors = (usedSelectors: UsedSelectors, elm: Element) => {
  if (elm != null && elm.nodeType === 1) {
    // tags
    const children = elm.children;
    const tagName = elm.nodeName.toLowerCase();
    usedSelectors.tags.add(tagName);

    // attributes
    const attributes = elm.attributes;
    for (let i = 0, l = attributes.length; i < l; i++) {
      const attr = attributes.item(i);
      const attrName = attr.name.toLowerCase();

      usedSelectors.attrs.add(attrName);

      if (attrName === 'class') {
        // classes
        const classList = elm.classList;
        for (let i = 0, l = classList.length; i < l; i++) {
          usedSelectors.classNames.add(classList.item(i));
        }
      } else if (attrName === 'id') {
        // ids
        usedSelectors.ids.add(attr.value);
      }
    }

    // drill down
    if (children) {
      for (let i = 0, l = children.length; i < l; i++) {
        collectUsedSelectors(usedSelectors, children[i]);
      }
    }
  }
};

export interface UsedSelectors {
  tags: Set<string>;
  classNames: Set<string>;
  ids: Set<string>;
  attrs: Set<string>;
}
