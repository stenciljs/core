export default (tagName) => {
  if ((tagName.includes('tag-transform') || tagName === 'nested-child-tag') && !tagName.includes('tag-transformed')) {
    return tagName.replace('tag-', 'tag-transformed');
  }
  return tagName;
};
