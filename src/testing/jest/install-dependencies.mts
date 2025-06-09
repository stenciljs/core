import { exec } from 'node:child_process';
import fss from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path'
import url from 'node:url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
let found = false;

const jestAdapters = (await fs.readdir(__dirname))
  .filter((file) => file.startsWith('jest-'))
  .filter((file) => fss.statSync(path.join(__dirname, file)).isDirectory());

/**
 * Loop through directories start with 'jest-', e.g. `jest-27-and-under`, `jest-28`, etc.
 */
for (const dir of jestAdapters) {
  found = true;

  const jestDir = path.join(__dirname, dir);
  console.log(`→ Installing dependencies in ${jestDir}...`);
  await new Promise<void>((resolve, reject) => {
    exec('npm ci', { cwd: jestDir }, (err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
  console.log('Done 🎉');
}

/**
 * If no directories were found and processed, print an error and exit
 */
if (!found) {
  console.error('Error: No jest directories were found');
  process.exit(1);
}
