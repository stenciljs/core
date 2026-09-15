export default (tagName: string) => {
  if (tagName.endsWith('-tag-transform')) {
    return tagName.replace('-tag-transform', '-tag-is-transformed');
  }
  return tagName;
};
