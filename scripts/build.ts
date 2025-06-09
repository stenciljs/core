import { buildCli } from './esbuild/cli';
import { buildCompiler } from './esbuild/compiler';
import { buildDevServer } from './esbuild/dev-server';
import { buildInternal } from './esbuild/internal';
import { buildMockDoc } from './esbuild/mock-doc';
import { buildScreenshot } from './esbuild/screenshot';
import { buildSysNode } from './esbuild/sys-node';
import { buildTesting } from './esbuild/testing';
import { release } from './release';
import { validateBuild } from './test/validate-build';
import { BuildOptions, getOptions } from './utils/options';

// the main entry point for the build
export async function run(rootDir: string, args: ReadonlyArray<string>) {
  const opts = getOptions(process.cwd(), {
    isProd: args.includes('--prod'),
    isCI: args.includes('--ci'),
    isWatch: args.includes('--watch'),
  });

  try {
    if (args.includes('--release')) {
      await release(rootDir, args);
      return;
    }

    if (args.includes('--validate-build')) {
      await validateBuild(rootDir);
      return;
    }
    await buildAll(opts);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

export async function buildAll(opts: BuildOptions) {
  await Promise.all([
    buildCli(opts),
    buildCompiler(opts),
    buildDevServer(opts),
    buildMockDoc(opts),
    buildScreenshot(opts),
    buildSysNode(opts),
    buildTesting(opts),
    buildInternal(opts),
  ]);
}
