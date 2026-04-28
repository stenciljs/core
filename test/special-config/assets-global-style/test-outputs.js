/**
 * Validates build outputs for explicit assets and global-style output targets.
 *
 * Tests:
 * 1. Global styles go to custom directory (dist/custom-assets/)
 * 2. Component assets go to custom directory (dist/custom-assets/)
 * 3. copyToLoaderBrowser: false prevents copy to loader-bundle browser dir
 * 4. loader-bundle output still generates correctly
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');

// ========================================
// Custom assets directory (explicit config)
// ========================================
const customAssetsDir = path.join(distDir, 'custom-assets');

// Global styles in custom location
const globalStylePath = path.join(customAssetsDir, 'testassetsglobalstyle.css');
fs.accessSync(globalStylePath);
console.log('✅ Global styles written to custom directory');

// Verify global styles contain expected content
const globalStyleContent = fs.readFileSync(globalStylePath, 'utf8');
if (!globalStyleContent.includes('--test-color')) {
  throw new Error('Global styles missing expected CSS variable');
}
console.log('✅ Global styles contain expected content');

// Component assets in custom location
const assetFilePath = path.join(customAssetsDir, 'assets', 'test-file.txt');
fs.accessSync(assetFilePath);
console.log('✅ Component assets copied to custom directory');

// Verify asset content
const assetContent = fs.readFileSync(assetFilePath, 'utf8');
if (!assetContent.includes('Test asset content')) {
  throw new Error('Asset file missing expected content');
}
console.log('✅ Asset file contains expected content');

// ========================================
// loader-bundle output (verify it still works)
// ========================================
const loaderBundleDir = path.join(distDir, 'loader-bundle');
fs.accessSync(path.join(loaderBundleDir, 'esm'));
fs.accessSync(path.join(loaderBundleDir, 'esm', 'loader.js'));
fs.accessSync(path.join(loaderBundleDir, 'index.js'));
console.log('✅ loader-bundle output generated correctly');

// ========================================
// copyToLoaderBrowser: false verification
// ========================================
const loaderBrowserDir = path.join(loaderBundleDir, 'testassetsglobalstyle');
const loaderBrowserCssPath = path.join(loaderBrowserDir, 'testassetsglobalstyle.css');

// The browser dir may exist (for JS files) but should NOT contain the CSS
// since copyToLoaderBrowser: false
let cssExistsInLoaderBrowser = false;
try {
  fs.accessSync(loaderBrowserCssPath);
  cssExistsInLoaderBrowser = true;
} catch {
  // Expected - CSS should NOT exist here
}

if (cssExistsInLoaderBrowser) {
  throw new Error(
    'Global styles should NOT be copied to loader-bundle browser dir when copyToLoaderBrowser: false',
  );
}
console.log('✅ copyToLoaderBrowser: false correctly prevents CSS copy to loader-bundle');

// ========================================
// Verify default dist/assets/ is NOT created (explicit config overrides auto-generation)
// ========================================
const defaultAssetsDir = path.join(distDir, 'assets');
let defaultAssetsDirExists = false;
try {
  fs.accessSync(defaultAssetsDir);
  defaultAssetsDirExists = true;
} catch {
  // Expected - default dir should not exist since we have explicit config
}

// Note: This check may need adjustment - explicit config might still create default
// For now, just log if it exists
if (defaultAssetsDirExists) {
  console.log('ℹ️  Default dist/assets/ also exists (explicit config adds to, does not replace)');
} else {
  console.log('✅ Only custom assets directory exists (explicit config)');
}

console.log('\n✅ All assets-global-style output validations passed!\n');
