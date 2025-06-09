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

  const buildFiles = fs
    .readdirSync(buildDir)
    .filter((f) => !f.includes('system'))
    .filter((f) => !f.includes('css-shim'))
    .filter((f) => !f.includes('dom'))
    .filter((f) => !f.includes('shadow-css'))
    .filter((f) => f !== 'svg')
    .filter((f) => f !== 'swiper');

  buildFiles.forEach((buildFile) => {
    const o = getBuildFileSize(path.join(buildDir, buildFile));
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
  if (fileName.includes('-') && !fileName.includes('entry')) {
    const dotSplt = fileName.split('.');
    const dashSplt = dotSplt[0].split('-');
    dashSplt[dashSplt.length - 1] = 'hash';
    fileName = dashSplt.join('-') + '.' + dotSplt[1];
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
