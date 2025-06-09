import { join } from 'path';

import * as build from './build';

// This path is relative to the final location of the compiled script, not its TypeScript source
const stencilProjectRoot = join(__dirname, '..');
const args = process.argv.slice(2);
build.run(stencilProjectRoot, args);
