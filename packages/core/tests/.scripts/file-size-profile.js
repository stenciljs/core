const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const brotli = require('brotli');

let totalBrotli = 0;
let totalGzip = 0;
let totalMinify = 0;

module.exports = function fileSizeProfile(appName, buildDir, output) {
  output.push(``, `## ${appName}`);
  output.push(``);
  output.push('`' + path.relative(path.join(__dirname, '..'), buildDir) + '`');
  output.push(``);
  output.push(`| File                                     | Brotli   | Gzipped  | Minified |`);
  output.push(`|------------------------------------------|----------|----------|----------|`);

  totalBrotli = 0;
  totalGzip = 0;
  totalMinify = 0;

  const processedFiles = new Map(); // Track unique file paths

  const buildFiles = fs
    .readdirSync(buildDir)
    .filter((f) => {
      const fullPath = path.join(buildDir, f);
      return fs.statSync(fullPath).isFile();
    })
    .filter((f) => !f.includes('system'))
    .filter((f) => !f.includes('css-shim'))
    .filter((f) => !f.includes('dom'))
    .filter((f) => !f.includes('shadow-css'))
    .filter((f) => !f.endsWith('.map') && !f.endsWith('.map.js'))
    .filter((f) => !f.endsWith('.system.js'))
    .filter((f) => f !== 'svg')
    .filter((f) => f !== 'swiper');

  buildFiles.forEach((buildFile) => {
    const fullPath = path.join(buildDir, buildFile);
    const realPath = fs.realpathSync(fullPath); // Resolve symlinks

    if (processedFiles.has(realPath)) {
      return; // Skip already processed files
    }

    processedFiles.set(realPath, true);
    const o = getBuildFileSize(fullPath);
    if (o) {
      output.push(o);
    }
  });

  // render SUM
  output.push(render('**TOTAL**', totalBrotli, totalGzip, totalMinify));

  output.push(``, ``);
};

function getBuildFileSize(filePath) {
  try {
    if (filePath.endsWith('css')) {
      return null;
    }

    const content = fs.readFileSync(filePath);
    let fileName = path.basename(filePath);

    let brotliSize;
    let gzipSize;
    let minifiedSize;

    if (content.length > 0) {
      if (content.includes('SystemJS')) {
        return null;
      }

      const brotliResult = brotli.compress(content);
      brotliSize = brotliResult ? brotliResult.length : 0;
      gzipSize = zlib.gzipSync(content, { level: 9 }).length;
      minifiedSize = fs.statSync(filePath).size;
    } else {
      brotliSize = gzipSize = minifiedSize = 0;
    }

    if (minifiedSize === 0) {
      return null;
    }

    totalBrotli += brotliSize;
    totalGzip += gzipSize;
    totalMinify += minifiedSize;

    return render(fileName, brotliSize, gzipSize, minifiedSize);
  } catch (e) {
    console.error(e);
    return '';
  }
}

function render(fileName, brotliSize, gzipSize, minifiedSize) {
  if (!fileName.includes('entry')) {
    // Replace hash-like patterns (6+ alphanumeric characters, often with underscores/mixed case)
    // Matches patterns like: BKTJo, BzdVKK6O, 3yrFD0, Cc5x6M82, pv_ODqr_, BtC, DfQ_W
    fileName = fileName.replace(/-[A-Za-z0-9_]{4,}(?=[-.]|$)/g, '-hash');

    // Clean up edge cases where hash appears at the start after period
    // e.g., "hash.transition-BzdVKK6O" -> "hash.transition-hash"
    fileName = fileName.replace(/\.(transition|bundle)-[A-Za-z0-9_]{4,}($|\.)/g, '.$1-hash$2');
  }
  return `| ${fileName.padEnd(40)} | ${getFileSize(brotliSize).padEnd(8)} | ${getFileSize(gzipSize).padEnd(
    8,
  )} | ${getFileSize(minifiedSize).padEnd(8)} |`;
}

function getFileSize(bytes) {
  if (bytes === 0) {
    return '-';
  }
  if (bytes < 1024) {
    return `${bytes}B`;
  }
  return `${(bytes / 1024).toFixed(2)}KB`;
}
