const whyIsNodeRunning = require('why-is-node-running');
const hydrate = require('./hydrate');
const mockDoc = require('../../mock-doc');

async function main() {
  const html = `
    <html>
    <head><title>End To End</title></head>
    <body>
      <prerender-cmp></prerender-cmp>
      <slot-cmp>Hello World</slot-cmp>
    </body>
    </html>
  `;
  const opts = {
    prettyHtml: true,
  };
  const results = await hydrate.renderToString(html, opts);

  console.log(results);

  if (results.diagnostics.length > 0) {
    results.diagnostics.forEach((d) => {
      console.error(`🧨  ${d.header}`);
      console.error(`🧨  ${d.messageText}`);
    });
    throw new Error(`validated test/end-to-end/hydrate errors!!`);
  }

  if (results.hydratedCount !== 2) {
    throw new Error(`invalid hydratedCount: ${results.hydratedCount}`);
  }
  if (
    results.components.length !== 2 ||
    results.components[0].tag !== 'prerender-cmp' ||
    results.components[1].tag !== 'slot-cmp'
  ) {
    throw new Error(`invalid components: ${results.components}`);
  }
  if (results.httpStatus !== 200) {
    throw new Error(`invalid httpStatus: ${results.httpStatus}`);
  }
  if (results.anchors.length !== 1 || results.anchors[0].href !== `https://hydrate.stenciljs.com/some-link`) {
    throw new Error(`invalid anchors: ${results.anchors}`);
  }
  if (results.url !== `https://hydrate.stenciljs.com/`) {
    throw new Error(`invalid url: ${results.url}`);
  }
  if (results.title !== `End To End`) {
    throw new Error(`invalid title`);
  }
  if (typeof results.html !== `string`) {
    throw new Error(`missing html`);
  }

  const doc = mockDoc.createDocument(results.html);
  if (doc.title !== 'End To End') {
    throw new Error(`invalid doc.title: ${doc.title}`);
  }
  if (!doc.documentElement.classList.contains('hydrated')) {
    throw new Error(`missing html hydrated`);
  }
  const cmp = doc.querySelector('prerender-cmp');
  if (!cmp) {
    throw new Error(`missing prerender-cmp`);
  }

  clearTimeout(tmr);

  console.log('🛁  validated test/end-to-end/hydrate\n');
}

const tmr = setTimeout(() => {
  console.error(`validated test/end-to-end/hydrate timeout!`);
  process.exit(1);
}, 10000);

main()
  .then(() => {
    whyIsNodeRunning();
  })
  .catch((e) => {
    clearTimeout(tmr);
    console.error('🧨 ' + e + ' 🧨');
    process.exit(1);
  });
