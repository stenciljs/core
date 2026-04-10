export const updateCanonicalLink = (doc: Document, href?: string) => {
  // https://webmasters.googleblog.com/2009/02/specify-your-canonical.html
  // <link rel="canonical" href="http://www.example.com/product.php?item=swedish-fish" />
  let canonicalLinkElm = doc.head.querySelector('link[rel="canonical"]');

  if (typeof href === 'string') {
    // have a valid href to add
    if (canonicalLinkElm == null) {
      // don't have a <link> element yet, create one
      canonicalLinkElm = doc.createElement('link');
      canonicalLinkElm.setAttribute('rel', 'canonical');
      doc.head.appendChild(canonicalLinkElm);
    }

    // set the href attribute
    canonicalLinkElm.setAttribute('href', href);
  } else {
    // don't have a href
    if (canonicalLinkElm != null) {
      // but there is a canonical link in the head so let's remove it
      const existingHref = canonicalLinkElm.getAttribute('href');
      if (!existingHref) {
        canonicalLinkElm.parentNode?.removeChild(canonicalLinkElm);
      }
    }
  }
};
