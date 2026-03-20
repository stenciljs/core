import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

console.log('Running copy-task validate script');

const utilsExtraFiles = await fs.readdir(path.resolve(__dirname, 'dist', 'utilsExtra'));
assert.equal(
  JSON.stringify(utilsExtraFiles),
  JSON.stringify(['utils.spec.ts', 'utils.ts'])
);

const copiesMockDirIntoCollection = await fs.access(path.resolve(__dirname, 'dist', 'collection', '__mocks__'))
  .then(() => true, () => false);
assert(!copiesMockDirIntoCollection);

console.log(`✅ All assertions passed`);
