import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const e2eDir = path.join(__dirname, '..', '..', 'integration', 'e2e');

const distDir = path.join(e2eDir, 'dist');

// loader-bundle output (lazy-loaded bundles + loader infrastructure)
const loaderBundleDir = path.join(distDir, 'loader-bundle');
fs.accessSync(path.join(loaderBundleDir, 'cjs'));
fs.accessSync(path.join(loaderBundleDir, 'endtoend'));
fs.accessSync(path.join(loaderBundleDir, 'esm'));

// loader entry point (in v5, loader is accessed via esm/loader.js, no separate loader directory)
fs.accessSync(path.join(loaderBundleDir, 'esm', 'loader.js'));
fs.accessSync(path.join(loaderBundleDir, 'cjs', 'loader.cjs'));
fs.accessSync(path.join(loaderBundleDir, 'index.cjs'));
fs.accessSync(path.join(loaderBundleDir, 'index.js'));

// stencil-rebundle output (was collection)
const rebundleDir = path.join(distDir, 'stencil-rebundle');
fs.accessSync(path.join(rebundleDir, 'car-list', 'car-data.js'));
fs.accessSync(path.join(rebundleDir, 'car-list', 'car-data.js.map'));
fs.accessSync(path.join(rebundleDir, 'car-list', 'car-list.css'));
fs.accessSync(path.join(rebundleDir, 'car-list', 'car-list.js'));
fs.accessSync(path.join(rebundleDir, 'car-list', 'car-list.js.map'));
fs.accessSync(path.join(rebundleDir, 'prop-cmp', 'prop-cmp.ios.css'));
fs.accessSync(path.join(rebundleDir, 'prop-cmp', 'prop-cmp.md.css'));
fs.accessSync(path.join(rebundleDir, 'global.js'));
JSON.parse(fs.readFileSync(path.join(rebundleDir, 'collection-manifest.json'), 'utf8'));

// types output
const typesDir = path.join(distDir, 'types');
fs.accessSync(path.join(typesDir, 'components.d.ts'));
fs.accessSync(path.join(typesDir, 'stencil-public-runtime.d.ts'));
fs.accessSync(path.join(typesDir, 'loader.d.ts'));
fs.accessSync(path.join(typesDir, 'app-root', 'app-root.d.ts'));
fs.accessSync(path.join(typesDir, 'app-root', 'interfaces.d.ts'));
fs.accessSync(path.join(typesDir, 'car-list', 'car-data.d.ts'));
fs.accessSync(path.join(typesDir, 'car-list', 'car-list.d.ts'));

// www output
const wwwDir = path.join(e2eDir, 'www');
fs.accessSync(path.join(wwwDir, 'build', 'endtoend.js'));
fs.accessSync(path.join(wwwDir, 'build', 'endtoend.js.map'));
fs.accessSync(path.join(wwwDir, 'build', 'endtoend.css'));
// Assets in www now go to build/assets/ subdirectory (v5 change)
fs.accessSync(path.join(wwwDir, 'build', 'assets', 'assets-a', 'file-1.txt'));
fs.accessSync(path.join(wwwDir, 'build', 'assets', 'assets-a', 'file-2.txt'));
fs.accessSync(path.join(wwwDir, 'build', 'assets', 'assets-b', 'file-3.txt'));
fs.accessSync(path.join(wwwDir, 'index.html'));

fs.accessSync(path.join(e2eDir, 'dist-react', 'components.ts'));

fs.accessSync(path.join(e2eDir, 'docs.json'));
fs.accessSync(path.join(e2eDir, 'docs.d.ts'));

fs.accessSync(path.join(e2eDir, 'custom-elements-manifest.json'));

// ========================================
// Unified assets output (v5)
// ========================================
const assetsDir = path.join(distDir, 'assets');
fs.accessSync(assetsDir);

// Global styles in unified location
fs.accessSync(path.join(assetsDir, 'endtoend.css'));

// Component assets copied to unified location
// car-detail and car-list both have assetsDirs: ['assets-a']
// dom-api has assetsDirs: ['assets-b']
fs.accessSync(path.join(assetsDir, 'assets-a'));
fs.accessSync(path.join(assetsDir, 'assets-a', 'file-1.txt'));
fs.accessSync(path.join(assetsDir, 'assets-a', 'file-2.txt'));
fs.accessSync(path.join(assetsDir, 'assets-b'));
fs.accessSync(path.join(assetsDir, 'assets-b', 'file-3.txt'));

// Backwards compat: Global styles also copied to loader-bundle browser dir
// (copyToLoaderBrowser: true is the default)
fs.accessSync(path.join(loaderBundleDir, 'endtoend', 'endtoend.css'));

console.log('✅ validated build outputs: dist files\n');
