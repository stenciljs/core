import { builtinModules } from 'node:module';
import { join } from 'node:path';

import type { BuildOptions as ESBuildOptions, Plugin } from 'esbuild';
import { replace } from 'esbuild-plugin-replace';
import fs from 'fs-extra';
import ts from 'typescript';

import { getBanner } from '../utils/banner';
import { type BuildOptions, createReplaceData } from '../utils/options';
import { writePkgJson } from '../utils/write-pkg-json';
import { externalAlias, getBaseEsbuildOptions, getEsbuildAliases, getFirstOutputFile, runBuilds } from './utils';
import { createContentTypeData } from './utils/content-types';

const CONNECTOR_NAME = 'connector.html';

/**
 * Runs esbuild to bundle the `dev-server` submodule
 *
 * @param opts build options
 * @returns a promise for this bundle's build output
 */
export async function buildDevServer(opts: BuildOptions) {
  // create dir of not existing already
  await fs.ensureDir(opts.output.devServerDir);
  // clear out rollup stuff
  await fs.emptyDir(opts.output.devServerDir);

  const inputDir = join(opts.buildDir, 'dev-server');

  // create public d.ts
  let dts = await fs.readFile(join(opts.buildDir, 'dev-server', 'index.d.ts'), 'utf8');
  dts = dts.replace('../declarations', '../internal/index');
  await fs.writeFile(join(opts.output.devServerDir, 'index.d.ts'), dts);

  // write package.json
  writePkgJson(opts, opts.output.devServerDir, {
    name: '@stencil/core/dev-server',
    description: 'Stencil Development Server which communicates with the Stencil Compiler.',
    main: 'index.js',
    types: 'index.d.ts',
  });

  // copy static files
  await fs.copy(join(opts.srcDir, 'dev-server', 'static'), join(opts.output.devServerDir, 'static'));

  // copy server-worker-thread.js
  await fs.copy(
    join(opts.srcDir, 'dev-server', 'server-worker-thread.js'),
    join(opts.output.devServerDir, 'server-worker-thread.js'),
  );

  // copy template files
  await fs.copy(join(opts.srcDir, 'dev-server', 'templates'), join(opts.output.devServerDir, 'templates'));

  // open-in-editor's visualstudio.vbs file
  const visualstudioVbsSrc = join(opts.nodeModulesDir, 'open-in-editor', 'lib', 'editors', 'visualstudio.vbs');
  const visualstudioVbsDesc = join(opts.output.devServerDir, 'visualstudio.vbs');
  await fs.copy(visualstudioVbsSrc, visualstudioVbsDesc);

  // copy open's xdg-open file
  const xdgOpenSrcPath = join(opts.nodeModulesDir, 'open', 'xdg-open');
  const xdgOpenDestPath = join(opts.output.devServerDir, 'xdg-open');
  await fs.copy(xdgOpenSrcPath, xdgOpenDestPath);

  const external = [...builtinModules];
  const devServerAliases = {
    ...getEsbuildAliases(),
    glob: '../../sys/node/glob.js',
    '@stencil/core/mock-doc': '../../mock-doc/index.cjs',
  };
  const devServerIndexEsbuildOptions = {
    ...getBaseEsbuildOptions(),
    alias: devServerAliases,
    entryPoints: [join(inputDir, 'index.js')],
    outfile: join(opts.output.devServerDir, 'index.js'),
    external: ['@dev-server-process', ...external],
    format: 'cjs',
    platform: 'node',
    write: false,
    plugins: [serverProcessAliasPlugin(), replace(createReplaceData(opts))],
    banner: {
      js: getBanner(opts, `Stencil Dev Server`, true),
    },
  } satisfies ESBuildOptions;

  const devServerProcessEsbuildOptions = {
    ...getBaseEsbuildOptions(),
    alias: {
      ...devServerAliases,
      glob: '../../sys/node/glob.js',
      '@stencil/core/mock-doc': '../../mock-doc/index.cjs',
      '@sys-api-node': '../sys/node/index.js',
    },
    entryPoints: [join(inputDir, 'server-process.js')],
    outfile: join(opts.output.devServerDir, 'server-process.js'),
    external: [...external, '../sys/node/index.js'],
    format: 'cjs',
    platform: 'node',
    write: false,
    plugins: [
      esm2CJSPlugin(),
      contentTypesPlugin(opts),
      replace(createReplaceData(opts)),
      externalAlias('graceful-fs', '../sys/node/graceful-fs.js'),
    ],
    banner: {
      js: getBanner(opts, `Stencil Dev Server Process`, true),
    },
  } satisfies ESBuildOptions;

  const connectorAlias = {
    glob: '../../sys/node/glob.js',
    '@stencil/core/dev-server/client': join(inputDir, 'client', 'index.js'),
    '@stencil/core/mock-doc': '../../mock-doc/index.cjs',
  };
  const connectorEsbuildOptions = {
    ...getBaseEsbuildOptions(),
    alias: connectorAlias,
    entryPoints: [join(inputDir, 'dev-server-client', 'index.js')],
    outfile: join(opts.output.devServerDir, CONNECTOR_NAME),
    format: 'cjs',
    platform: 'node',
    write: false,
    plugins: [appErrorCssPlugin(opts), clientConnectorPlugin(opts), replace(createReplaceData(opts))],
  } satisfies ESBuildOptions;

  await fs.ensureDir(join(opts.output.devServerDir, 'client'));
  // copy dev server client dts files
  await fs.copy(join(opts.buildDir, 'dev-server', 'client'), join(opts.output.devServerDir, 'client'), {
    filter: (src) => {
      if (src.endsWith('.d.ts')) {
        return true;
      }
      const stats = fs.statSync(src);
      if (stats.isDirectory()) {
        return true;
      }
      return false;
    },
  });

  // write package.json
  writePkgJson(opts, join(opts.output.devServerDir, 'client'), {
    name: '@stencil/core/dev-server/client',
    description: 'Stencil Dev Server Client.',
    main: 'index.js',
    types: 'index.d.ts',
  });

  const devServerClientEsbuildOptions = {
    ...getBaseEsbuildOptions(),
    entryPoints: [join(opts.buildDir, 'dev-server', 'client', 'index.js')],
    outfile: join(opts.output.devServerDir, 'client', 'index.js'),
    format: 'esm',
    platform: 'node',
    plugins: [appErrorCssPlugin(opts), replace(createReplaceData(opts))],
    banner: {
      js: getBanner(opts, `Stencil Dev Server Client`, true),
    },
  } satisfies ESBuildOptions;

  return runBuilds(
    [
      devServerIndexEsbuildOptions,
      devServerProcessEsbuildOptions,
      connectorEsbuildOptions,
      devServerClientEsbuildOptions,
    ],
    opts,
  );
}

/**
 * Load CSS files and export them as a string
 * @param opts build options
 * @returns an esbuild plugin
 */
function appErrorCssPlugin(opts: BuildOptions): Plugin {
  return {
    name: 'appErrorCss',
    setup(build) {
      build.onResolve({ filter: /app-error\.css$/ }, () => ({
        path: join(opts.srcDir, 'dev-server', 'client', 'app-error.css'),
      }));
      build.onLoad({ filter: /app-error\.css$/ }, async (args) => {
        const code = await fs.readFile(args.path, 'utf8');
        const css = code.replace(/\n/g, ' ').trim();
        const minified = css.replace(/  /g, ' ');
        return { contents: `export default ${JSON.stringify(minified)};` };
      });
    },
  };
}

/**
 * Transform connector client script into a HTML file
 * @param opts build options
 * @returns an esbuild plugin
 */
function clientConnectorPlugin(opts: BuildOptions): Plugin {
  return {
    name: 'clientConnectorPlugin',
    setup(build) {
      build.onEnd(async (buildResult) => {
        const bundle = buildResult.outputFiles?.find((b) => b.path.endsWith(CONNECTOR_NAME));
        if (!bundle) {
          throw "Couldn't find build result!";
        }
        let code = Buffer.from(bundle.contents).toString();

        const tsResults = ts.transpileModule(code, {
          compilerOptions: {
            target: ts.ScriptTarget.ES5,
          },
        });

        if (tsResults.diagnostics?.length) {
          throw new Error(tsResults.diagnostics as any);
        }

        code = tsResults.outputText;
        code = intro + code + outro;

        if (opts.isProd) {
          const { minify } = await import('terser');
          const minifyResults = await minify(code, {
            compress: { hoist_vars: true, hoist_funs: true, ecma: 5 },
            format: { ecma: 5 },
          });
          if (minifyResults.code) {
            code = minifyResults.code;
          }
        }

        code = banner + code + footer;
        code = code.replace(/__VERSION:STENCIL__/g, opts.version);
        return fs.writeFile(bundle.path, code);
      });
    },
  };
}

/**
 * esbuild plugin to support alias of dynamic import. Transforming a path within a dynamic import
 * does not seem to be supported yet.
 * @see https://github.com/evanw/esbuild/issues/700
 * @returns an esbuild plugin
 */
function serverProcessAliasPlugin(): Plugin {
  return {
    name: 'serverProcessAlias',
    setup(build) {
      build.onEnd(async (buildResult) => {
        const bundle = getFirstOutputFile(buildResult);
        let code = Buffer.from(bundle.contents).toString();
        code = code.replace('await import("@dev-server-process")', '(await import("./server-process.js")).default');
        return fs.writeFile(bundle.path, code);
      });
    },
  };
}

/**
 * The `open` NPM package is build as ESM module and uses ESM runtime features like `import.meta.url`.
 * This plugin transforms this into CJS compliant code.
 * @returns an esbuild plugin
 */
function esm2CJSPlugin(): Plugin {
  return {
    name: 'esm2CJS',
    setup(build) {
      build.onEnd(async (buildResult) => {
        const bundle = getFirstOutputFile(buildResult);
        let code = Buffer.from(bundle.contents).toString();
        code = code.replace('import_meta.url', 'new (require("url").URL)("file:" + __filename).href');
        return fs.writeFile(bundle.path, code);
      });
    },
  };
}

/**
 * Populates the `content-types-db.json` file with the content types of the `mime-db` package.
 * @param opts build options
 * @returns an esbuild plugin
 */
function contentTypesPlugin(opts: BuildOptions): Plugin {
  return {
    name: 'contentTypesPlugin',
    setup(build) {
      build.onLoad({ filter: /content-types-db\.json$/ }, async () => {
        const contents = await createContentTypeData(opts);
        return { contents };
      });
    },
  };
}

const banner = `<!doctype html><html><head><meta charset="utf-8"><title>Stencil Dev Server Connector __VERSION:STENCIL__ &#9889</title><style>body{background:black;color:white;font:18px monospace;text-align:center}</style></head><body>

Stencil Dev Server Connector __VERSION:STENCIL__ &#9889;

<script>`;

const intro = `(function(iframeWindow, appWindow, config, exports) {
"use strict";
`;

const outro = `
})(window, window.parent, window.__DEV_CLIENT_CONFIG__, {});
`;

const footer = `\n</script></body></html>`;
