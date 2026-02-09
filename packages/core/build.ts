/**
 * Build script for @stencil/core
 *
 * Runs all vite configs in parallel for faster builds.
 * Turborepo handles cross-package orchestration.
 */

import { build as viteBuild } from 'vite';
import { resolve } from 'path';
import fs from 'fs-extra';

const __dirname = import.meta.dirname;

const configs = [
  'vite.config.ts',
  'vite.compiler-utils.config.ts',
  'vite.runtime.config.ts',
  'vite.client.config.ts',
  'vite.server.config.ts',
  'vite.app-data.config.ts',
  'vite.app-globals.config.ts',
  'vite.testing.config.ts',
];

const isWatch = process.argv.includes('--watch');

async function build() {
  console.log(`📦 Building @stencil/core (${configs.length} configs${isWatch ? ', watch mode' : ''})...`);

  if (isWatch) {
    // In watch mode, run sequentially to avoid console chaos
    for (const config of configs) {
      await viteBuild({
        configFile: resolve(__dirname, config),
        logLevel: 'info',
        build: { watch: {} },
      });
    }
  } else {
    // In build mode, run all configs in parallel
    await Promise.all(
      configs.map((config) =>
        viteBuild({
          configFile: resolve(__dirname, config),
          logLevel: 'warn', // Quieter output for parallel builds
        })
      )
    );
  }

  // Create mock-doc wrapper for backwards compatibility
  await fs.writeFile(
    resolve(__dirname, 'dist/mock-doc.js'),
    "// Re-export @stencil/mock-doc for backward compatibility\nexport * from '@stencil/mock-doc';\n"
  );

  console.log('✅ @stencil/core built successfully');
}

build().catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
