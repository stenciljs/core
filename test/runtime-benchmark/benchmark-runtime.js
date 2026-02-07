const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawnSync } = require('child_process');

const RUNS_PER_BENCHMARK = 5;
const STENCIL_BIN = path.join(__dirname, '..', '..', 'bin', 'stencil');
const STENCIL_PKG = path.join(__dirname, '..', '..', 'package.json');
const WWW_DIR = path.join(__dirname, 'www');
const RESULTS_FILE = path.join(__dirname, 'benchmark-results.json');
const SUMMARY_FILE = path.join(__dirname, 'benchmark-results.md');

function getStencilVersion() {
  const pkg = JSON.parse(fs.readFileSync(STENCIL_PKG, 'utf-8'));
  return pkg.version;
}

let puppeteer;

async function loadPuppeteer() {
  // Try to load puppeteer from the root project
  try {
    puppeteer = require('puppeteer');
  } catch (e) {
    console.error('Puppeteer not found. Run npm install from the root directory.');
    process.exit(1);
  }
}

function buildProject() {
  console.log('Building project...');
  const result = spawnSync('node', [STENCIL_BIN, 'build'], {
    cwd: __dirname,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    console.error('Build failed');
    process.exit(1);
  }
}

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(WWW_DIR, req.url === '/' ? 'index.html' : req.url);
      const ext = path.extname(filePath);
      const contentTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
      };

      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
        } else {
          res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
          res.end(content);
        }
      });
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      console.log(`Server running on port ${port}`);
      resolve({ server, port });
    });
  });
}

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

function generateMarkdown(results, history) {
  const { benchmarks } = results;

  let md = `# Stencil Runtime Performance Benchmark

**Last Run:** ${results.timestamp}
**Stencil:** ${results.stencilVersion} | **Node:** ${results.nodeVersion} | **Platform:** ${results.platform} (${results.arch})

## Latest Results

| Operation              |        Avg |        Min |        Max |    StdDev |
|------------------------|------------|------------|------------|-----------|
`;

  for (const [name, stats] of Object.entries(benchmarks)) {
    const label = (BENCHMARK_LABELS[name] || name).padEnd(22);
    const avg = `**${stats.avg.toFixed(2)}ms**`.padStart(10);
    const min = `${stats.min.toFixed(2)}ms`.padStart(10);
    const max = `${stats.max.toFixed(2)}ms`.padStart(10);
    const stddev = `${stats.stddev.toFixed(2)}ms`.padStart(9);
    md += `| ${label} | ${avg} | ${min} | ${max} | ${stddev} |\n`;
  }

  md += `
## History

| Date       | Stencil  | Create 1k |  Replace 1k |    Update | Create 10k | Node     |
|------------|----------|-----------|-------------|-----------|------------|----------|
`;

  // Add history rows (most recent first, limit to 10)
  const recentHistory = [...history].reverse().slice(0, 10);
  for (const entry of recentHistory) {
    const date = new Date(entry.timestamp).toLocaleDateString().padEnd(10);
    const stencil = (entry.stencilVersion || '-').padEnd(8);
    const b = entry.benchmarks;
    const c1k = `${b.create1k?.avg.toFixed(1) || '-'}ms`.padStart(9);
    const r1k = `${b.replace1k?.avg.toFixed(1) || '-'}ms`.padStart(11);
    const upd = `${b.update?.avg.toFixed(1) || '-'}ms`.padStart(9);
    const c10k = `${b.create10k?.avg.toFixed(1) || '-'}ms`.padStart(10);
    const node = entry.nodeVersion.padEnd(8);
    md += `| ${date} | ${stencil} | ${c1k} | ${r1k} | ${upd} | ${c10k} | ${node} |\n`;
  }

  return md;
}

async function runBenchmark(page, fn) {
  const times = [];

  for (let i = 0; i < RUNS_PER_BENCHMARK; i++) {
    // Reset state before each run
    await page.evaluate(() => document.querySelector('#perf').clear());
    await page
      .waitForSelector('#perf table tbody:empty, #perf table tbody:not(:has(tr))', { timeout: 5000 })
      .catch(() => {});

    // Small delay to ensure clean state
    await new Promise((r) => setTimeout(r, 50));

    const start = await page.evaluate(() => performance.now());
    await fn(page);

    // Wait for render to complete
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

    const end = await page.evaluate(() => performance.now());
    times.push(end - start);
  }

  return times;
}

function calculateStats(times) {
  const sorted = [...times].sort((a, b) => a - b);
  const sum = times.reduce((a, b) => a + b, 0);
  const avg = sum / times.length;
  const variance = times.reduce((acc, t) => acc + Math.pow(t - avg, 2), 0) / times.length;
  const stddev = Math.sqrt(variance);

  return {
    runs: times.map((t) => Math.round(t * 100) / 100),
    min: Math.round(sorted[0] * 100) / 100,
    max: Math.round(sorted[sorted.length - 1] * 100) / 100,
    avg: Math.round(avg * 100) / 100,
    median: Math.round(sorted[Math.floor(sorted.length / 2)] * 100) / 100,
    stddev: Math.round(stddev * 100) / 100,
  };
}

function formatMs(ms) {
  return `${ms.toFixed(2)}ms`;
}

function printStats(label, stats) {
  console.log(`\n${label}:`);
  console.log(`  Runs:   ${stats.runs.map(formatMs).join(', ')}`);
  console.log(`  Min:    ${formatMs(stats.min)}`);
  console.log(`  Max:    ${formatMs(stats.max)}`);
  console.log(`  Avg:    ${formatMs(stats.avg)}`);
  console.log(`  Median: ${formatMs(stats.median)}`);
  console.log(`  StdDev: ${formatMs(stats.stddev)}`);
}

async function main() {
  await loadPuppeteer();

  console.log('Stencil Runtime Performance Benchmark');
  console.log('=====================================');
  console.log(`Runs per benchmark: ${RUNS_PER_BENCHMARK}\n`);

  // Build the project
  buildProject();

  // Start server
  const { server, port } = await startServer();

  // Launch browser
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle0' });

    // Wait for component to be ready
    await page.waitForSelector('#perf');
    await page.evaluate(() => customElements.whenDefined('perf-rows'));

    const benchmarks = {};

    // Create 1,000 rows
    console.log('\nRunning: Create 1,000 rows...');
    benchmarks.create1k = calculateStats(
      await runBenchmark(page, async (p) => {
        await p.evaluate(() => document.querySelector('#perf').run());
      }),
    );
    printStats('Create 1,000 rows', benchmarks.create1k);

    // Replace 1,000 rows
    console.log('\nRunning: Replace 1,000 rows...');
    // First create rows, then measure replacement
    await page.evaluate(() => document.querySelector('#perf').run());
    benchmarks.replace1k = calculateStats(
      await runBenchmark(page, async (p) => {
        await p.evaluate(() => document.querySelector('#perf').run());
      }),
    );
    printStats('Replace 1,000 rows', benchmarks.replace1k);

    // Update every 10th row
    console.log('\nRunning: Update every 10th row...');
    benchmarks.update = calculateStats(
      await runBenchmark(page, async (p) => {
        await p.evaluate(() => document.querySelector('#perf').run());
        await p.evaluate(() => new Promise((r) => requestAnimationFrame(r)));
        await p.evaluate(() => document.querySelector('#perf').update());
      }),
    );
    printStats('Update every 10th row', benchmarks.update);

    // Swap rows
    console.log('\nRunning: Swap rows...');
    benchmarks.swap = calculateStats(
      await runBenchmark(page, async (p) => {
        await p.evaluate(() => document.querySelector('#perf').run());
        await p.evaluate(() => new Promise((r) => requestAnimationFrame(r)));
        await p.evaluate(() => document.querySelector('#perf').swapRows());
      }),
    );
    printStats('Swap rows', benchmarks.swap);

    // Select row
    console.log('\nRunning: Select row...');
    benchmarks.select = calculateStats(
      await runBenchmark(page, async (p) => {
        await p.evaluate(() => document.querySelector('#perf').run());
        await p.evaluate(() => new Promise((r) => requestAnimationFrame(r)));
        await p.evaluate(() => document.querySelector('#perf').selectRow(5));
      }),
    );
    printStats('Select row', benchmarks.select);

    // Remove row
    console.log('\nRunning: Remove row...');
    benchmarks.remove = calculateStats(
      await runBenchmark(page, async (p) => {
        await p.evaluate(() => document.querySelector('#perf').run());
        await p.evaluate(() => new Promise((r) => requestAnimationFrame(r)));
        await p.evaluate(() => document.querySelector('#perf').removeRow(5));
      }),
    );
    printStats('Remove row', benchmarks.remove);

    // Create 10,000 rows
    console.log('\nRunning: Create 10,000 rows...');
    benchmarks.create10k = calculateStats(
      await runBenchmark(page, async (p) => {
        await p.evaluate(() => document.querySelector('#perf').runLots());
      }),
    );
    printStats('Create 10,000 rows', benchmarks.create10k);

    // Append 1,000 rows
    console.log('\nRunning: Append 1,000 rows to 1,000...');
    benchmarks.append = calculateStats(
      await runBenchmark(page, async (p) => {
        await p.evaluate(() => document.querySelector('#perf').run());
        await p.evaluate(() => new Promise((r) => requestAnimationFrame(r)));
        await p.evaluate(() => document.querySelector('#perf').add());
      }),
    );
    printStats('Append 1,000 rows', benchmarks.append);

    // Clear rows
    console.log('\nRunning: Clear 1,000 rows...');
    benchmarks.clear = calculateStats(
      await runBenchmark(page, async (p) => {
        await p.evaluate(() => document.querySelector('#perf').run());
        await p.evaluate(() => new Promise((r) => requestAnimationFrame(r)));
        await p.evaluate(() => document.querySelector('#perf').clear());
      }),
    );
    printStats('Clear rows', benchmarks.clear);

    // Save results
    const results = {
      timestamp: new Date().toISOString(),
      stencilVersion: getStencilVersion(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      benchmarks,
    };

    // Load existing results if present
    let history = [];
    if (fs.existsSync(RESULTS_FILE)) {
      try {
        const existing = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8'));
        history = existing.history || [];
      } catch (e) {
        // Ignore parse errors, start fresh
      }
    }

    history.push(results);

    fs.writeFileSync(RESULTS_FILE, JSON.stringify({ latest: results, history }, null, 2));
    fs.writeFileSync(SUMMARY_FILE, generateMarkdown(results, history));

    console.log(`\n\nResults saved to:`);
    console.log(`  ${RESULTS_FILE}`);
    console.log(`  ${SUMMARY_FILE}`);

    // Print summary table
    console.log('\n=== Summary (avg ms) ===');
    console.log('Operation            | Time');
    console.log('---------------------|--------');
    for (const [name, stats] of Object.entries(benchmarks)) {
      console.log(`${name.padEnd(20)} | ${formatMs(stats.avg)}`);
    }
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
