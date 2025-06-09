const fs = require('fs');
const path = require('path');
const hydrate = require('../dist/hydrate');

async function run() {
  const indexPath = path.join(__dirname, 'src', 'index.html');
  const html = fs.readFileSync(indexPath, 'utf8');

  const results = await hydrate.renderToString(html, {
    prettyHtml: true,
  });
  const filePath = path.join(__dirname, '..', 'www-prerender-script', 'prerender', 'index.html');

  const updatedHTML = results.html.replace(/(href|src)="\/prerender\//g, (html) =>
    html.replace('/prerender/', '/www-prerender-script/prerender/'),
  );
  fs.writeFileSync(filePath, updatedHTML);

  results.diagnostics.forEach((d) => {
    console.log(d.level, d.header, d.messageText);
  });
}
run();
