const fs = require('fs');
const path = require('path');

const sourceMapReferenceReg = /\/\/# sourceMappingURL=.*\.js\.map/g;
const expectSourceMapReferenceToOccurOnce = (filePath) => {
  fs.accessSync(filePath+'.map');
  const contents = fs.readFileSync(filePath, 'utf-8')

  if (Array.from(contents.matchAll(sourceMapReferenceReg)).length !== 1) {
    throw new Error(`Expected source map reference to occur once in ${filePath}`);
  }
}

const distDir = path.join(__dirname, 'dist');
fs.accessSync(path.join(distDir, 'cjs'));
fs.accessSync(path.join(distDir, 'esm-es5'));
fs.accessSync(path.join(distDir, 'endtoend'));
fs.accessSync(path.join(distDir, 'esm'));
fs.accessSync(path.join(distDir, 'loader'));
fs.accessSync(path.join(distDir, 'index.cjs.js'));
fs.accessSync(path.join(distDir, 'index.js'));

expectSourceMapReferenceToOccurOnce(path.join(distDir, 'cjs/car-list.entry.cjs.js'))
expectSourceMapReferenceToOccurOnce(path.join(distDir, 'esm-es5/car-list.entry.js'))
expectSourceMapReferenceToOccurOnce(path.join(distDir, 'endtoend/car-list.entry.esm.js'));
expectSourceMapReferenceToOccurOnce(path.join(distDir, 'endtoend/car-list.entry.system.js'));
expectSourceMapReferenceToOccurOnce(path.join(distDir, 'esm/car-list.entry.js'));

const collectionDir = path.join(distDir, 'collection');
fs.accessSync(path.join(collectionDir, 'car-list', 'car-data.js'));
fs.accessSync(path.join(collectionDir, 'car-list', 'car-data.js.map'));
fs.accessSync(path.join(collectionDir, 'car-list', 'car-list.css'));
fs.accessSync(path.join(collectionDir, 'car-list', 'car-list.js'));
fs.accessSync(path.join(collectionDir, 'car-list', 'car-list.js.map'));
fs.accessSync(path.join(collectionDir, 'prop-cmp', 'prop-cmp.ios.css'));
fs.accessSync(path.join(collectionDir, 'prop-cmp', 'prop-cmp.md.css'));
fs.accessSync(path.join(collectionDir, 'global.js'));
JSON.parse(fs.readFileSync(path.join(collectionDir, 'collection-manifest.json'), 'utf8'));

expectSourceMapReferenceToOccurOnce(path.join(collectionDir, 'car-list/car-list.js'));

const typesDir = path.join(distDir, 'types');
fs.accessSync(path.join(typesDir, 'components.d.ts'));
fs.accessSync(path.join(typesDir, 'stencil-public-runtime.d.ts'));
fs.accessSync(path.join(typesDir, 'app-root', 'app-root.d.ts'));
fs.accessSync(path.join(typesDir, 'app-root', 'interfaces.d.ts'));
fs.accessSync(path.join(typesDir, 'car-list', 'car-data.d.ts'));
fs.accessSync(path.join(typesDir, 'car-list', 'car-list.d.ts'));

const wwwDir = path.join(__dirname, 'www');
fs.accessSync(path.join(wwwDir, 'build', 'endtoend.js'));
fs.accessSync(path.join(wwwDir, 'build', 'endtoend.esm.js'));
fs.accessSync(path.join(wwwDir, 'build', 'endtoend.esm.js.map'));
fs.accessSync(path.join(wwwDir, 'build', 'endtoend.css'));
fs.accessSync(path.join(wwwDir, 'build', 'assets-a/file-1.txt'));
fs.accessSync(path.join(wwwDir, 'build', 'assets-a/file-2.txt'));
fs.accessSync(path.join(wwwDir, 'build', 'assets-b/file-3.txt'));
fs.accessSync(path.join(wwwDir, 'index.html'));

expectSourceMapReferenceToOccurOnce(path.join(wwwDir, 'build', 'car-list.entry.esm.js'));
expectSourceMapReferenceToOccurOnce(path.join(wwwDir, 'build', 'car-list.entry.system.js'));

fs.accessSync(path.join(__dirname, 'dist-react', 'components.ts'));

fs.accessSync(path.join(__dirname, 'docs.json'));
fs.accessSync(path.join(__dirname, 'docs.d.ts'));

fs.accessSync(path.join(__dirname, 'custom-elements-manifest.json'));

console.log('🍄  validated test/end-to-end/dist files\n');
