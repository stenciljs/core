const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
fs.accessSync(path.join(distDir, 'cjs'));
fs.accessSync(path.join(distDir, 'endtoend'));
fs.accessSync(path.join(distDir, 'esm'));
fs.accessSync(path.join(distDir, 'loader'));
fs.accessSync(path.join(distDir, 'index.cjs.js'));
fs.accessSync(path.join(distDir, 'index.js'));

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

fs.accessSync(path.join(__dirname, 'dist-react', 'components.ts'));

fs.accessSync(path.join(__dirname, 'docs.json'));
fs.accessSync(path.join(__dirname, 'docs.d.ts'));

console.log('🍄  validated test/end-to-end/dist files\n');
