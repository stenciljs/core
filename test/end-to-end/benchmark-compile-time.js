const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const COLD_RUNS = 5;
const WARM_RUNS = 5;
const STENCIL_BIN = path.join(__dirname, '..', '..', 'bin', 'stencil');
const CACHE_DIR = path.join(__dirname, '.stencil');
const RESULTS_FILE = path.join(__dirname, 'benchmark-results.json');
const SUMMARY_FILE = path.join(__dirname, 'benchmark-results.md');

function clearCache() {
  if (fs.existsSync(CACHE_DIR)) {
    fs.rmSync(CACHE_DIR, { recursive: true, force: true });
  }
}

function runBuild() {
  const start = performance.now();

  const result = spawnSync('node', [STENCIL_BIN, 'build', '--config', './stencil.build.config.ts'], {
    cwd: __dirname,
    stdio: 'pipe',
    encoding: 'utf-8',
  });

  const duration = performance.now() - start;

  if (result.status !== 0) {
    console.error('Build failed:', result.stderr);
    process.exit(1);
  }

  return duration;
}

function calculateStats(times) {
  const sorted = [...times].sort((a, b) => a - b);
  const sum = times.reduce((a, b) => a + b, 0);
  const avg = sum / times.length;
  const variance = times.reduce((acc, t) => acc + Math.pow(t - avg, 2), 0) / times.length;
  const stddev = Math.sqrt(variance);

  return {
    runs: times,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg,
    stddev,
    median: sorted[Math.floor(sorted.length / 2)],
  };
}

function formatMs(ms) {
  return `${(ms / 1000).toFixed(2)}s`;
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

function generateMarkdown(results, history) {
  const { cold, warm } = results;

  const fmtValue = (ms) => formatMs(ms).padStart(8);

  let md = `# Stencil Compile Time Benchmark

**Last Run:** ${results.timestamp}
**Node:** ${results.nodeVersion} | **Platform:** ${results.platform} (${results.arch})

## Latest Results

### Cold Builds (no cache)

| Metric   |    Value |
|----------|----------|
| Min      | ${fmtValue(cold.min)} |
| Max      | ${fmtValue(cold.max)} |
| **Avg**  | **${formatMs(cold.avg)}** |
| Median   | ${fmtValue(cold.median)} |
| StdDev   | ${fmtValue(cold.stddev)} |

### Warm Builds (with cache)

| Metric   |    Value |
|----------|----------|
| Min      | ${fmtValue(warm.min)} |
| Max      | ${fmtValue(warm.max)} |
| **Avg**  | **${formatMs(warm.avg)}** |
| Median   | ${fmtValue(warm.median)} |
| StdDev   | ${fmtValue(warm.stddev)} |

## History

| Date       | Cold Avg | Warm Avg | Node     |
|------------|----------|----------|----------|
`;

  // Add history rows (most recent first, limit to 10)
  const recentHistory = [...history].reverse().slice(0, 10);
  for (const entry of recentHistory) {
    const date = new Date(entry.timestamp).toLocaleDateString().padEnd(10);
    const coldAvg = formatMs(entry.cold.avg).padStart(8);
    const warmAvg = formatMs(entry.warm.avg).padStart(8);
    const node = entry.nodeVersion.padEnd(8);
    md += `| ${date} | ${coldAvg} | ${warmAvg} | ${node} |\n`;
  }

  return md;
}

async function main() {
  console.log('Stencil Compilation Time Benchmark');
  console.log('===================================');
  console.log(`Cold runs: ${COLD_RUNS}, Warm runs: ${WARM_RUNS}`);

  // Cold builds (no cache)
  console.log('\nRunning cold builds (no cache)...');
  const coldTimes = [];
  for (let i = 0; i < COLD_RUNS; i++) {
    clearCache();
    process.stdout.write(`  Run ${i + 1}/${COLD_RUNS}... `);
    const duration = runBuild();
    coldTimes.push(duration);
    console.log(formatMs(duration));
  }

  // Warm builds (with cache)
  console.log('\nRunning warm builds (with cache)...');
  clearCache(); // Start fresh, then keep cache

  // Do one build to warm the cache
  console.log('  Warming cache...');
  runBuild();

  const warmTimes = [];
  for (let i = 0; i < WARM_RUNS; i++) {
    process.stdout.write(`  Run ${i + 1}/${WARM_RUNS}... `);
    const duration = runBuild();
    warmTimes.push(duration);
    console.log(formatMs(duration));
  }

  // Calculate stats
  const coldStats = calculateStats(coldTimes);
  const warmStats = calculateStats(warmTimes);

  // Print results
  printStats('Cold Build Stats', coldStats);
  printStats('Warm Build Stats', warmStats);

  // Save results
  const results = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    cold: coldStats,
    warm: warmStats,
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

  // Save JSON
  fs.writeFileSync(RESULTS_FILE, JSON.stringify({ latest: results, history }, null, 2));

  // Save Markdown summary
  fs.writeFileSync(SUMMARY_FILE, generateMarkdown(results, history));

  console.log(`\nResults saved to:`);
  console.log(`  ${RESULTS_FILE}`);
  console.log(`  ${SUMMARY_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
