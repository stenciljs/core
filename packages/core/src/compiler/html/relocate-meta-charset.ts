export const relocateMetaCharset = (doc: Document) => {
  const head = doc.head;

  let charsetElm = head.querySelector('meta[charset]');
  if (charsetElm == null) {
    // doesn't have <meta charset>, so create it
    charsetElm = doc.createElement('meta');
    charsetElm.setAttribute('charset', 'utf-8');
  } else {
    // take the current one out of its existing location
    charsetElm.remove();
  }

  // ensure the <meta charset> is the first node in <head>
  head.insertBefore(charsetElm, head.firstChild);
};
