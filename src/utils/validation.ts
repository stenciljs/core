/**
 * Validates that a component tag meets required naming conventions to be used for a web component
 * @param tag the tag to validate
 * @returns an error message if the tag has an invalid name, undefined if the tag name passes all checks
 */
export const validateComponentTag = (tag: string): string | undefined => {
  // we want to check this first since we call some String.prototype methods below
  if (typeof tag !== 'string') {
    return `Tag "${tag}" must be a string type`;
  }
  if (tag !== tag.trim()) {
    return `Tag can not contain white spaces`;
  }
  if (tag !== tag.toLowerCase()) {
    return `Tag can not contain upper case characters`;
  }
  if (tag.length === 0) {
    return `Received empty tag value`;
  }

  if (tag.indexOf(' ') > -1) {
    return `"${tag}" tag cannot contain a space`;
  }

  if (tag.indexOf(',') > -1) {
    return `"${tag}" tag cannot be used for multiple tags`;
  }

  const invalidChars = tag.replace(/\w|-/g, '');
  if (invalidChars !== '') {
    return `"${tag}" tag contains invalid characters: ${invalidChars}`;
  }

  if (tag.indexOf('-') === -1) {
    return `"${tag}" tag must contain a dash (-) to work as a valid web component`;
  }

  if (tag.indexOf('--') > -1) {
    return `"${tag}" tag cannot contain multiple dashes (--) next to each other`;
  }

  if (tag.indexOf('-') === 0) {
    return `"${tag}" tag cannot start with a dash (-)`;
  }

  if (tag.lastIndexOf('-') === tag.length - 1) {
    return `"${tag}" tag cannot end with a dash (-)`;
  }
  return undefined;
};
