import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { rolldown } from 'rolldown';
import type * as d from '@stencil/core';
import type { InputOptions, RolldownOutput } from 'rolldown';

import {
  buildWarn,
  createOnWarnFn,
  generatePreamble,
  hasError,
  isRolldownError,
  join,
  loadRolldownDiagnostics,
} from '../../../utils';
import { STENCIL_APP_DATA_ID, STENCIL_SSR_FACTORY_ID } from '../../bundle/entry-alias-ids';
import { optimizeModule } from '../../optimize/optimize-module';
import { generateSsrFactory } from '../ssr/generate-ssr-app';
import { MODE_RESOLUTION_CHAIN_DECLARATION } from '../ssr/ssr-factory-closure';
import { postProcessSsrCode } from '../ssr/write-ssr-outputs';

const execFileAsync = promisify(execFile);

// Polyfill timer APIs not available in QuickJS-ng (extism explicitly does not provide
// setTimeout, setInterval, etc.). Must run before the IIFE so $nativeSetTimeout and
// the mock-doc window setup both capture defined values instead of undefined.
// No-ops are correct: the only setTimeout use in the bundle is the render-abort guard,
// which we do not want firing synchronously.
const SSR_WASM_TIMER_POLYFILL = `
if (typeof globalThis !== "undefined") {
  if (typeof globalThis.setTimeout !== "function") globalThis.setTimeout = function() { return 0; };
  if (typeof globalThis.clearTimeout !== "function") globalThis.clearTimeout = function() {};
  if (typeof globalThis.setInterval !== "function") globalThis.setInterval = function() { return 0; };
  if (typeof globalThis.clearInterval !== "function") globalThis.clearInterval = function() {};
}
`;

// TypeScript interface file required by extism-js.
// Must declare a 'main' module — extism-js uses this as the plugin entry point.
// All functions are (): void — data flows via Host.inputString()/Host.outputString(),
// not as WASM return values. Use I32/I64/F32/F64 only for direct primitive returns.
const SSR_WASM_INTERFACE = `declare module "main" {
  export function renderToString(): void;
  export function setTagTransformer(): void;
  export function resetSsrDocData(): void;
}\n`;

// Extism host entry points appended as rolldown `outro` inside the IIFE.
// `Host` is a global provided by the Extism/QuickJS-ng runtime — no import needed.
// Functions reference bundled symbols by name via closure — resolved lazily at call
// time, so QuickJS-ng sees the fully-initialised IIFE scope rather than an eager
// snapshot taken during IIFE setup (which QuickJS-ng resolves incorrectly).
// setTagTransformer accepts [{from: string, to: string}] and builds a tag transformer.
const SSR_WASM_OUTRO = `
module.exports = {
  renderToString: async function() {
    try {
      if (typeof renderToString !== 'function') {
        Host.outputString(JSON.stringify({ __error: 'renderToString is ' + typeof renderToString }));
        return;
      }
      var inp = JSON.parse(Host.inputString());
      var result = await renderToString(inp.html, inp.options);
      Host.outputString(JSON.stringify(result));
    } catch(e) {
      Host.outputString(JSON.stringify({ __error: String(e) }));
    }
  },
  setTagTransformer: function() {
    var mappings = JSON.parse(Host.inputString());
    setTagTransformer(function(tag) {
      var m = mappings.find(function(x) { return x.from === tag; });
      return m ? m.to : tag;
    });
  },
  resetSsrDocData: function() {
    resetSsrDocData();
  }
};
`;

export const generateSsrWasmApp = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  outputTargets: d.OutputTargetSsrWasm[],
) => {
  try {
    const packageDir = join(config.sys.getCompilerExecutingPath(), '..', '..');
    const input = join(packageDir, 'runtime', 'server', 'runner.mjs');
    const appData = join(packageDir, 'runtime', 'app-data', 'index.js');

    const rolldownOptions: InputOptions = {
      ...config.rolldownConfig,
      // No externals — everything must be self-contained in the WASM binary
      external: [],
      input,
      plugins: [
        {
          name: 'ssrWasmPlugin',
          resolveId: {
            filter: { id: /^@stencil\/core\/runtime\/(server\/ssr-factory|app-data)$/ },
            handler(id) {
              if (id === STENCIL_SSR_FACTORY_ID) return STENCIL_SSR_FACTORY_ID;
              if (id === STENCIL_APP_DATA_ID) return appData;
              return null;
            },
          },
          load: {
            filter: { id: /^@stencil\/core\/runtime\/server\/ssr-factory$/ },
            handler(id) {
              if (id === STENCIL_SSR_FACTORY_ID) {
                return generateSsrFactory(config, compilerCtx, buildCtx);
              }
              return null;
            },
          },
          transform(code, _id) {
            const searchPattern = `const ${MODE_RESOLUTION_CHAIN_DECLARATION}`;
            if (!code.includes(searchPattern)) return null;
            return code.replaceAll(searchPattern, '');
          },
        },
      ],
      treeshake: false,
      // ES2020 max — QuickJS-ng constraint for extism-js compatibility
      transform: { target: 'es2020' },
      onwarn: createOnWarnFn(buildCtx.diagnostics),
      checks: { pluginTimings: config.logLevel === 'debug' },
    };

    const rolldownBuild = await rolldown(rolldownOptions);
    const rolldownOutput = await rolldownBuild.generate({
      banner: generatePreamble(config) + SSR_WASM_TIMER_POLYFILL,
      outro: SSR_WASM_OUTRO,
      format: 'iife',
      // IIFE supplies `exports` as its parameter, which the bundled CJS code needs.
      // The global name is unused — extism-js reads module.exports from inside the IIFE.
      name: 'StencilSsrWasm',
      file: 'index.js',
    });

    await Promise.all(
      outputTargets.map((outputTarget) =>
        writeSsrWasmOutput(config, compilerCtx, buildCtx, outputTarget, rolldownOutput),
      ),
    );
  } catch (e) {
    if (!buildCtx.hasError && isRolldownError(e)) {
      loadRolldownDiagnostics(config, compilerCtx, buildCtx, e);
    }
  }
};

export const writeSsrWasmOutput = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  outputTarget: d.OutputTargetSsrWasm,
  rolldownOutput: RolldownOutput,
) => {
  const dir = outputTarget.dir!;

  for (const output of rolldownOutput.output) {
    if (output.type !== 'chunk') continue;

    let code = postProcessSsrCode(config, compilerCtx, output.code);

    if (outputTarget.minify) {
      const optimizeResults = await optimizeModule(config, compilerCtx, {
        input: code,
        isCore: output.isEntry,
        minify: true,
      });
      buildCtx.diagnostics.push(...optimizeResults.diagnostics);
      if (!hasError(optimizeResults.diagnostics) && typeof optimizeResults.output === 'string') {
        code = optimizeResults.output;
      }
    }

    const jsPath = join(dir, 'index.js');
    const interfacePath = join(dir, 'plugin.d.ts');
    const wasmPath = join(dir, 'index.wasm');

    await Promise.all([
      compilerCtx.fs.writeFile(jsPath, code, { immediateWrite: true }),
      compilerCtx.fs.writeFile(interfacePath, SSR_WASM_INTERFACE, { immediateWrite: true }),
    ]);

    await compileToWasm(buildCtx, jsPath, interfacePath, wasmPath);
  }
};

const compileToWasm = async (
  buildCtx: d.BuildCtx,
  jsPath: string,
  interfacePath: string,
  wasmPath: string,
) => {
  try {
    await execFileAsync('extism-js', [jsPath, '-i', interfacePath, '-o', wasmPath]);
  } catch (e: any) {
    const warn = buildWarn(buildCtx.diagnostics);
    if (e.code === 'ENOENT') {
      warn.messageText =
        `ssr-wasm: extism-js not found — index.js was written but index.wasm was not generated. ` +
        `Install extism-js: https://github.com/extism/js-pdk`;
    } else {
      warn.messageText = `ssr-wasm: extism-js compile failed: ${e.message}`;
    }
  }
};
