const fs = require('fs');
const path = require('path');
const hydrate = require('./dist/hydrate');

async function run() {
  const html = `
    <html>
      <hello-world></hello-world>
    </html>
  `;

  const results = await hydrate.renderToString(html, {
    prettyHtml: true,
    title: 'Hello World',
  });

  const filePath = path.join(__dirname, 'www', 'index.html');
  fs.writeFileSync(filePath, results.html);
}
run();
