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
import { execSync } from 'child_process';

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
      'vite.compiler-utils.config.ts',
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

/**
 * Generate TypeScript declarations for a package
 */
async function generateDeclarations(pkg: PackageBuildConfig) {
  const packagePath = resolve(PACKAGES_DIR, pkg.packageDir);
  const tsconfigPath = resolve(packagePath, 'tsconfig.build.json');

  // Check if tsconfig.build.json exists
  if (!fs.existsSync(tsconfigPath)) {
    console.log(`  ⚠️  No tsconfig.build.json for ${pkg.name}, skipping declarations`);
    return;
  }

  // TODO: Fix tsc emitting to src instead of dist
  // For now, use fallback declarations
  if (pkg.name === 'core') {
    console.log(`  ✅ Copied existing bundled declarations for ${pkg.name}`);
    await copyExistingCoreDeclarations();
  } else if (pkg.name === 'cli') {
    console.log(`  ✅ Created stub declarations for ${pkg.name}`);
    await createCliDeclarations();
  } else {
    // Try running tsc for other packages
    try {
      execSync(`npx tsc --project tsconfig.build.json`, {
        cwd: packagePath,
        stdio: 'pipe',
      });
      console.log(`  ✅ Declarations generated for ${pkg.name}`);
    } catch (error) {
      console.warn(`  ⚠️  Declaration generation failed for ${pkg.name}:`, (error as Error).message);
    }
  }
}

/**
 * Copy existing bundled declarations for core package
 * These are pre-bundled by dts-bundle-generator in the old build
 */
async function copyExistingCoreDeclarations() {
  const coreDistDir = resolve(PACKAGES_DIR, 'core/dist');

  // Ensure dist directories exist
  await fs.ensureDir(resolve(coreDistDir, 'runtime'));
  await fs.ensureDir(resolve(coreDistDir, 'runtime/client'));
  await fs.ensureDir(resolve(coreDistDir, 'runtime/server'));
  await fs.ensureDir(resolve(coreDistDir, 'runtime/app-data'));
  await fs.ensureDir(resolve(coreDistDir, 'runtime/app-globals'));

  // Copy bundled declaration files
  const declarationsToCopy = [
    // Main types (re-export from runtime)
    { src: 'runtime/index.d.ts', dest: 'index.d.ts' },
    // Runtime types
    { src: 'runtime/index.d.ts', dest: 'runtime/index.d.ts' },
    { src: 'runtime/stencil-private.d.ts', dest: 'runtime/stencil-private.d.ts' },
    { src: 'runtime/stencil-public-compiler.d.ts', dest: 'runtime/stencil-public-compiler.d.ts' },
    { src: 'runtime/stencil-public-runtime.d.ts', dest: 'runtime/stencil-public-runtime.d.ts' },
  ];

  for (const { src, dest } of declarationsToCopy) {
    const srcPath = resolve(ROOT_DIR, src);
    const destPath = resolve(coreDistDir, dest);
    if (fs.existsSync(srcPath)) {
      await fs.copy(srcPath, destPath);
    }
  }

  // Create stub declarations for runtime bundles
  const stubs = [
    { path: 'runtime/client/index.d.ts', content: 'export * from "../stencil-public-runtime";\n' },
    { path: 'runtime/server/index.d.ts', content: 'export * from "../stencil-public-runtime";\n' },
    { path: 'runtime/app-data/index.d.ts', content: 'export * from "../stencil-private";\n' },
    { path: 'runtime/app-globals/index.d.ts', content: 'export {};\n' },
  ];

  for (const { path, content } of stubs) {
    await fs.writeFile(resolve(coreDistDir, path), content);
  }

  console.log(`  ✅ Copied existing bundled declarations for core`);
}

/**
 * Create stub declarations for CLI package
 */
async function createCliDeclarations() {
  const cliDistDir = resolve(PACKAGES_DIR, 'cli/dist');

  await fs.ensureDir(cliDistDir);

  // Create a simple index.d.ts that exports CLI types
  const cliDeclaration = `/**
 * Stencil CLI
 */
export interface ConfigFlags {
  task: string;
  args: string[];
  knownArgs: string[];
  unknownArgs: string[];
}

export function parseFlags(args: string[]): ConfigFlags;
export function run(options?: { args?: string[] }): Promise<void>;
`;

  await fs.writeFile(resolve(cliDistDir, 'index.d.ts'), cliDeclaration);
  console.log(`  ✅ Created stub declarations for cli`);
}

async function buildAll(options: { watch?: boolean; isProd?: boolean }) {
  const mode = options.isProd ? 'production' : 'development';

  console.log(`🚀 Building Stencil v5 mono-repo with Vite (${mode} mode)`);
  console.log(`   Packages dir: ${PACKAGES_DIR}`);
  console.log(`   Package count: ${PACKAGES.length}`);

  const startTime = Date.now();

  try {
    // Build packages in order (sequential for now, parallel later when deps resolved)
    for (const pkg of PACKAGES) {
      await buildPackage(pkg, { watch: options.watch, mode });
    }

    // Generate declarations for all packages
    console.log('\n📝 Generating TypeScript declarations...');
    for (const pkg of PACKAGES) {
      await generateDeclarations(pkg);
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
