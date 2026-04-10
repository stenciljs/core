import type * as d from '@stencil/core';

let tagTransformer: d.TagTransformer | undefined = undefined;

/**
 * Transforms a tag name using the current tag transformer
 * @param tag - the tag to transform e.g. `my-tag`
 * @returns the transformed tag e.g. `new-my-tag`
 */
export function transformTag<T extends string>(tag: T): T {
  if (!tagTransformer) return tag;
  return tagTransformer(tag) as T;
}

/**
 * Sets the tag transformer to be used when rendering custom elements
 * @param transformer the transformer function to use. Must return a string
 */
export function setTagTransformer(transformer: d.TagTransformer) {
  tagTransformer = transformer;
}
