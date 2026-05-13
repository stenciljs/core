export default {
  beforeSsr(doc) {
    doc.documentElement.setAttribute('dir', 'ltr');
  },

  afterSsr(doc, url) {
    doc.title = `Url: ${url.href}`;
  },

  filterUrl() {
    return true;
  },

  prerenderOptions() {
    return {
      prettyHtml: true,
    };
  },
};
