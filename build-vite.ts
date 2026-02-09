/**
 * Modern Vite-based build orchestrator for Stencil v5 (mono-repo)
 *
 * Replaces: scripts/esbuild/* (entire directory)
 *
 * Usage:
 *   tsx build-vite.ts [--prod] [--watch]
 *
 * Or with package.json script:
 *   npm run build:vite
 */

import { build as viteBuild, type InlineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs-extra';

const ROOT_DIR = process.cwd();
const PACKAGES_DIR = resolve(ROOT_DIR, 'packages');

interface PackageBuildConfig {
  name: string;
  /** Package directory name in packages/ */
  packageDir: string;
  /** Additional vite config files to build (relative to package dir) */
  additionalConfigs?: string[];
}

/**
 * All packages in the mono-repo (build order matters for dependencies)
 * Types are generated via vite-plugin-dts in each package's vite.config.ts
 */
const PACKAGES: PackageBuildConfig[] = [
  { name: 'mock-doc', packageDir: 'mock-doc' },
  {
    name: 'core',
    packageDir: 'core',
    additionalConfigs: [
      'vite.compiler-utils.config.ts',
      'vite.runtime.config.ts',
      'vite.client.config.ts',
      'vite.server.config.ts',
      'vite.app-data.config.ts',
      'vite.app-globals.config.ts',
      'vite.testing.config.ts',
    ],
  },
  { name: 'cli', packageDir: 'cli' },
];

async function buildPackage(pkg: PackageBuildConfig, options: { watch?: boolean; mode?: string }) {
  console.log(`\n📦 Building ${pkg.name}...`);

  const packagePath = resolve(PACKAGES_DIR, pkg.packageDir);

  // Build main config
  const mainConfig: InlineConfig = {
    configFile: resolve(packagePath, 'vite.config.ts'),
    mode: options.mode || 'production',
    logLevel: 'info',
    root: packagePath,
  };

  if (options.watch) {
    // TODO: Implement watch mode
    console.warn('Watch mode not yet implemented');
    await viteBuild(mainConfig);
  } else {
    await viteBuild(mainConfig);
  }

  // Build additional configs (e.g., core has multiple runtime bundles)
  if (pkg.additionalConfigs) {
    for (const configPath of pkg.additionalConfigs) {
      console.log(`  ↳ Building ${configPath}...`);
      await viteBuild({
        configFile: resolve(packagePath, configPath),
        mode: options.mode || 'production',
        logLevel: 'info',
        root: packagePath,
      });
    }
  }

  // Post-build steps for core package
  if (pkg.name === 'core') {
    await createCoreMockDocWrapper();
  }

  console.log(`✅ ${pkg.name} built successfully`);
}

/**
 * Create mock-doc.js wrapper for @stencil/core/mock-doc backwards compatibility
 */
async function createCoreMockDocWrapper() {
  const coreDistDir = resolve(PACKAGES_DIR, 'core/dist');
  await fs.writeFile(
    resolve(coreDistDir, 'mock-doc.js'),
    "// Re-export @stencil/mock-doc for backward compatibility\nexport * from '@stencil/mock-doc';\n"
  );
}

async function buildAll(options: { watch?: boolean; isProd?: boolean }) {
  const mode = options.isProd ? 'production' : 'development';

  console.log(`🚀 Building Stencil v5 mono-repo with Vite (${mode} mode)`);
  console.log(`   Packages dir: ${PACKAGES_DIR}`);
  console.log(`   Package count: ${PACKAGES.length}`);

  const startTime = Date.now();

  try {
    // Build packages in order (sequential for now, parallel later when deps resolved)
    // Types are generated via vite-plugin-dts during each build
    for (const pkg of PACKAGES) {
      await buildPackage(pkg, { watch: options.watch, mode });
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✨ All packages built in ${duration}s`);
  } catch (error) {
    console.error('\n❌ Build failed:', error);
    process.exit(1);
  }
}

// Parse CLI args
const args = process.argv.slice(2);
const isProd = args.includes('--prod');
const isWatch = args.includes('--watch');

buildAll({ isProd, watch: isWatch });
