type TagTransformer = (tag: string) => string;

let tagTransformer: TagTransformer | undefined = undefined;

/**
 * Transforms a tag name using the current tag transformer
 * @param tag - the tag to transform e.g. `my-tag`
 * @returns the transformed tag e.g. `new-my-tag`
 */
export function transformTag(tag: string): string {
  if (!tagTransformer) return tag;
  return tagTransformer(tag);
}

/**
 * Sets the tag transformer to be used when rendering custom elements
 * @param transformer the transformer function to use. Must return a string
 * @returns the `tagTransformer` function
 */
export function setTagTransformer(transformer: TagTransformer) {
  if (tagTransformer) {
    console.warn(`
      A tagTransformer has already been set. 
      Overwriting it may lead to error and unexpected results if your components have already been defined.
    `);
  }
  tagTransformer = transformer;
  return tagTransformer;
}

/**
 * Gets the current tag transformer
 * @returns the current tag prefix
 */
export function getTagTransformer() {
  return tagTransformer;
}
