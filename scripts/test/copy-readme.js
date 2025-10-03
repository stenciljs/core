/**
 * This script copies a supplemental README file to the location where it will be overwritten
 * during the `docs-readme` output target test. The purpose of this step is to ensure that
 * the file is in a known state before the test runs, avoiding issues with Git detecting
 * unexpected changes to the file.
 *
 * Context:
 * - During the `docs-readme` tests, a README file is overwritten as part of the test process.
 * - The expected result of the test must be tracked by Git; otherwise, Git will detect a "dirty"
 *   state and the test will fail.
 * - This behaviour can be used to our advantage: if the file is overwritten with the supplemental
 *   file but not overwritten back to the expected result, Git will detect a dirty state, causing
 *   the test to fail. This ensures that the correct action is taken by the code being tested.
 *
 * Usage:
 * - This script is executed as part of the `prepare.readmes` npm script.
 * - It copies `readme-supplemental.md` to `readme.md` in the appropriate directory.
 */

const fs = require('fs');
const path = require('path');

// Define source and destination paths
const src = path.resolve(
  __dirname,
  '../../test/docs-readme/custom-readme-output-overwrite/components/styleurls-component/readme-supplemental.md',
);
const dest = path.resolve(
  __dirname,
  '../../test/docs-readme/custom-readme-output-overwrite/components/styleurls-component/readme.md',
);

// Copy the file
try {
  fs.copyFileSync(src, dest);
  console.log(`Copied ${src} to ${dest}`);
} catch (err) {
  console.error(`Error copying file: ${err.message}`);
  process.exit(1);
}
