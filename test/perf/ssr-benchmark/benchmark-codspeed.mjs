// CodSpeed entry: one benchmark per page and shadow mode, run in-process by tinybench.
// Outside CodSpeed it runs as plain tinybench and prints a table.
//
//   pnpm build && node benchmark-codspeed.mjs
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withCodSpeed } from '@codspeed/tinybench-plugin';
import { Bench } from 'tinybench';

import { PAGES } from './pages.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { renderToString } = await import(
  pathToFileURL(path.join(__dirname, 'dist', 'ssr', 'index.js')).href
);

const bench = withCodSpeed(new Bench({ time: 500, warmupTime: 200 }));

for (const [name, page] of Object.entries(PAGES)) {
  for (const mode of ['declarative-shadow-dom', 'scoped']) {
    bench.add(`ssr ${name} (${mode === 'scoped' ? 'scoped' : 'dsd'})`, async () => {
      await renderToString(page.html, {
        fullDocument: page.fullDocument,
        serializeShadowRoot: mode,
        prettyHtml: false,
      });
    });
  }
}

await bench.run();
console.table(bench.table());
