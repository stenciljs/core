/**
 * Matches JSDoc inline link tags that reference a URL, in either the
 * `{@link url|label}` or `{@link url label}` form.
 */
const JSDOC_URL_LINK_REGEX = /\{@link\s+(https?:\/\/[^\s|}]+)(?:\s*[|\s]\s*([^}]*?))?\s*\}/g;

/**
 * Converts JSDoc inline link tags that reference a URL into markdown links.
 *
 * Documentation output targets (docs-readme, docs-json, docs-vscode) treat their
 * `docs` fields as markdown, so URL-based `{@link}` tags are converted so they
 * render as links.
 *
 * Symbol links like `{@link MyClass#foo}` are left untouched, since resolving them
 * to a URL would require type information the docs generators do not have.
 *
 * @param text the JSDoc text to convert
 * @returns the text with URL-based `{@link}` tags converted to markdown links
 */
export const convertJsdocLinksToMarkdown = (text: string): string => {
  if (!text || !text.includes('{@link')) {
    return text;
  }
  return text.replace(JSDOC_URL_LINK_REGEX, (_match, url: string, label: string) => {
    return `[${label?.trim() || url}](${url})`;
  });
};

/**
 * Converts URL-based `{@link}` tags in the text of JSDoc tag infos (e.g. the texts
 * behind `@deprecated` or `@returns`) into markdown links, so tag-derived docs
 * fields render as links too.
 * @param tags the JSDoc tag infos to convert
 * @returns new tag infos with URL-based `{@link}` tags converted to markdown links
 */
export const convertJsdocTagsToMarkdown = <T extends { text: string }>(tags: readonly T[]): T[] => {
  return tags.map((tag) => ({ ...tag, text: convertJsdocLinksToMarkdown(tag.text) }));
};
