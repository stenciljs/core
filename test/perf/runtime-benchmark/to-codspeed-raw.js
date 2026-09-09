import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const RESULTS_FILE = path.join(__dirname, 'benchmark-results.json');
const OUTPUT_FILE = process.argv[2] || path.join(__dirname, 'benchmark-raw.json');

const BENCHMARK_LABELS = {
  create1k: 'Create 1,000 rows',
  replace1k: 'Replace 1,000 rows',
  update: 'Update every 10th row',
  swap: 'Swap rows',
  select: 'Select row',
  remove: 'Remove row',
  create10k: 'Create 10,000 rows',
  append: 'Append 1,000 rows',
  clear: 'Clear rows',
};

const { latest } = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8'));

const raw = Object.entries(latest.benchmarks).map(([name, stats]) => ({
  name: BENCHMARK_LABELS[name] || name,
  unit: 'ms',
  value: stats.avg,
  range: stats.stddev,
  biggerIsBetter: false,
}));

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(raw, null, 2));
console.log(`Wrote raw benchmark results to ${OUTPUT_FILE}`);
