// SSR benchmark: `renderToString` of the `ssr` build in this folder, per page and shadow mode.
//
//   pnpm test                                     # build, then benchmark (node --expose-gc)
//   node --expose-gc benchmark-ssr.mjs [--renders 100] [--warmup 20] [--only list-50:scoped] [--json out.json]
//
// Reports ms per render (median / p95 / min) and memory: the heap still retained after the timed
// renders and a forced GC (should not grow with render count), and the process's peak RSS.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { PAGES } from './pages.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { values: args } = parseArgs({
  options: {
    renders: { type: 'string', default: '100' },
    warmup: { type: 'string', default: '20' },
    only: { type: 'string' },
    json: { type: 'string' },
  },
});

const RENDERS = Number(args.renders);
const WARMUP = Number(args.warmup);
const MODES = ['declarative-shadow-dom', 'scoped'];

const hydratePath = path.join(__dirname, 'dist', 'ssr', 'index.js');
if (!fs.existsSync(hydratePath)) {
  console.error(`Missing ${hydratePath}: run \`pnpm build\` first.`);
  process.exit(1);
}
const gc = globalThis.gc;
if (!gc) console.warn('Run with --expose-gc for retained-heap numbers.');

const loadStart = performance.now();
const { renderToString } = await import(pathToFileURL(hydratePath).href);
const loadMs = performance.now() - loadStart;

const quantile = (sorted, q) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
const round = (n) => Math.round(n * 100) / 100;

const render = async (page, mode) => {
  const { html, diagnostics } = await renderToString(page.html, {
    fullDocument: page.fullDocument,
    serializeShadowRoot: mode,
    prettyHtml: false,
  });
  const errors = diagnostics.filter((d) => d.level === 'error');
  if (errors.length)
    throw new Error(`render failed: ${errors.map((d) => d.messageText).join('; ')}`);
  return html;
};

const results = [];
for (const [name, page] of Object.entries(PAGES)) {
  for (const mode of MODES) {
    const id = `${name}:${mode === 'scoped' ? 'scoped' : 'dsd'}`;
    if (args.only && !args.only.split(',').includes(id)) continue;

    const firstStart = performance.now();
    const html = await render(page, mode);
    const firstMs = performance.now() - firstStart;
    for (let i = 0; i < WARMUP; i++) await render(page, mode);

    gc?.();
    const heapBefore = process.memoryUsage().heapUsed;
    const times = [];
    for (let i = 0; i < RENDERS; i++) {
      const start = performance.now();
      await render(page, mode);
      times.push(performance.now() - start);
    }
    gc?.();
    const retainedKb = (process.memoryUsage().heapUsed - heapBefore) / 1024;

    times.sort((a, b) => a - b);
    const row = {
      id,
      medianMs: round(quantile(times, 0.5)),
      p95Ms: round(quantile(times, 0.95)),
      minMs: round(times[0]),
      firstMs: round(firstMs),
      htmlKb: round(html.length / 1024),
      retainedKb: gc ? round(retainedKb) : null,
    };
    results.push(row);
    console.log(
      `${id.padEnd(28)} median ${String(row.medianMs).padStart(7)} ms  p95 ${String(row.p95Ms).padStart(7)} ms  first ${String(row.firstMs).padStart(7)} ms  html ${String(row.htmlKb).padStart(7)} KB${gc ? `  retained ${String(row.retainedKb).padStart(8)} KB` : ''}`,
    );
  }
}

const summary = {
  node: process.version,
  renders: RENDERS,
  warmup: WARMUP,
  loadMs: round(loadMs),
  peakRssMb: round(process.resourceUsage().maxRSS / 1024),
  results,
};
console.log(`load ${summary.loadMs} ms, peak RSS ${summary.peakRssMb} MB`);
if (args.json) fs.writeFileSync(args.json, JSON.stringify(summary, null, 2) + '\n');
