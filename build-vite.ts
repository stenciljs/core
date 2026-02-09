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
  /** How types are generated: 'vite-plugin-dts' | 'tsc' | 'stub' */
  typeGeneration: 'vite-plugin-dts' | 'tsc' | 'stub';
}

/**
 * All packages in the mono-repo (build order matters for dependencies)
 */
const PACKAGES: PackageBuildConfig[] = [
  { name: 'mock-doc', packageDir: 'mock-doc', typeGeneration: 'tsc' },
  {
    name: 'core',
    packageDir: 'core',
    typeGeneration: 'vite-plugin-dts',
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
  { name: 'cli', packageDir: 'cli', typeGeneration: 'stub' },
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
 * Generate TypeScript declarations for packages that don't use vite-plugin-dts
 */
async function generateDeclarations(pkg: PackageBuildConfig) {
  const packagePath = resolve(PACKAGES_DIR, pkg.packageDir);

  switch (pkg.typeGeneration) {
    case 'vite-plugin-dts':
      // Types already generated during Vite build
      console.log(`  ✅ ${pkg.name}: types generated via vite-plugin-dts`);
      break;

    case 'tsc': {
      const tsconfigPath = resolve(packagePath, 'tsconfig.json');
      if (!fs.existsSync(tsconfigPath)) {
        console.log(`  ⚠️  ${pkg.name}: no tsconfig.json, skipping`);
        return;
      }
      try {
        execSync(`npx tsc --project tsconfig.json`, {
          cwd: packagePath,
          stdio: 'pipe',
        });
        console.log(`  ✅ ${pkg.name}: types generated via tsc`);
      } catch (error) {
        console.warn(`  ⚠️  ${pkg.name}: tsc failed:`, (error as Error).message);
      }
      break;
    }

    case 'stub':
      await createCliDeclarations();
      console.log(`  ✅ ${pkg.name}: stub types created`);
      break;
  }
}

/**
 * Create stub declarations for CLI package
 * TODO: Add vite-plugin-dts to CLI and remove this
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

export const BOOLEAN_CLI_FLAGS: readonly string[];
export function createConfigFlags(init?: Partial<ConfigFlags>): ConfigFlags;
export function parseFlags(args: string[]): ConfigFlags;
export function run(options?: { args?: string[] }): Promise<void>;
export function runTask(task: string, config: unknown): Promise<void>;
`;

  await fs.writeFile(resolve(cliDistDir, 'index.d.ts'), cliDeclaration);
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

    // Generate declarations for packages that need post-build type generation
    console.log('\n📝 TypeScript declarations...');
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
