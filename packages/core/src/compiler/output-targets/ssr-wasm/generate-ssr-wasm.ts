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
import { MODE_RESOLVER_DECLARATION } from '../ssr/ssr-factory-closure';
import { postProcessSsrCode } from '../ssr/write-ssr-outputs';

const execFileAsync = promisify(execFile);

// Timers for QuickJS-ng, which has none (Extism doesn't provide setTimeout, setInterval, etc.).
// Must run before the IIFE so $nativeSetTimeout and the mock-doc window capture these. Every
// timer in the bundle goes through them: the render-abort guard, and mock-doc's window timers,
// requestAnimationFrame and requestIdleCallback that components use.
//
// Timers run on a virtual clock. While a render is in progress, a pump fires them in due-time
// order, letting pending promise work run first. Nothing waits in real time.
//
// - Timers due at or after the render's `timeout` never fire. That includes the render-abort
//   guard (due exactly at `timeout`), so it can't fire while work is still in progress.
// - When no timer can fire, the pump stops. A render that's still waiting then ends with the
//   outro's error result, as it would with no timers at all.
// - Firing a callback synchronously instead would trip the abort guard at the start of every
//   render, and loop forever on setInterval.
const SSR_WASM_TIMER_POLYFILL = /* js */ `
if (typeof globalThis !== "undefined" && typeof globalThis.setTimeout !== "function") {
  (function() {
    var timers = [];
    var nextId = 1;
    var now = 0;
    var render = null;
    var pumping = false;

    function add(fn, delay, args, interval) {
      delay = Math.max(0, Number(delay) || 0);
      var timer = { id: nextId++, due: now + delay, delay: delay, fn: fn, args: args, interval: interval };
      timers.push(timer);
      if (render && !pumping) pump();
      return timer.id;
    }

    function clear(id) {
      for (var i = 0; i < timers.length; i++) {
        if (timers[i].id === id) {
          timers.splice(i, 1);
          return;
        }
      }
    }

    function nextTimer() {
      var next = null;
      for (var i = 0; i < timers.length; i++) {
        if (!next || timers[i].due < next.due || (timers[i].due === next.due && timers[i].id < next.id)) next = timers[i];
      }
      return next;
    }

    async function pump() {
      pumping = true;
      var current = render;
      try {
        while (render === current && current && !current.done) {
          // let the work that's already queued (and anything it queues) run first
          for (var i = 0; i < 100 && !current.done; i++) await null;
          if (render !== current || current.done) return;
          var next = nextTimer();
          if (!next) return;
          if (next.due >= current.budget || ++current.fired > 10000) {
            current.onBudgetExceeded();
            return;
          }
          now = next.due;
          if (next.interval) next.due = now + Math.max(next.delay, 1);
          else clear(next.id);
          if (typeof next.fn === "function") {
            try {
              next.fn.apply(globalThis, next.args);
            } catch (e) {
              if (typeof console !== "undefined") console.error(e);
            }
          }
        }
      } finally {
        pumping = false;
      }
    }

    globalThis.setTimeout = function(fn, delay) { return add(fn, delay, Array.prototype.slice.call(arguments, 2), false); };
    globalThis.setInterval = function(fn, delay) { return add(fn, delay, Array.prototype.slice.call(arguments, 2), true); };
    globalThis.clearTimeout = clear;
    globalThis.clearInterval = clear;

    // Used by the outro around each renderToString call.
    globalThis.__stencilSsrWasmTimers = {
      start: function(budget, onBudgetExceeded) {
        timers.length = 0;
        now = 0;
        render = { budget: budget, fired: 0, done: false, onBudgetExceeded: onBudgetExceeded };
        return render;
      },
      stop: function(r) {
        r.done = true;
        if (render === r) {
          render = null;
          timers.length = 0;
        }
      }
    };
  })();
}
`;

// Polyfill AbortController/AbortSignal, not available in QuickJS-ng.
// Must run before the IIFE. Actual polyfill, no no-op.
const SSR_WASM_ABORT_CONTROLLER_POLYFILL = /* js */ `
if (typeof globalThis !== "undefined" && typeof globalThis.AbortController !== "function") {
  function StencilPolyfillAbortSignal() {
    this.aborted = false;
    this.reason = undefined;
    this._listeners = [];
  }
  StencilPolyfillAbortSignal.prototype.addEventListener = function(type, listener, options) {
    if (type !== "abort" || typeof listener !== "function") return;
    this._listeners.push({ listener: listener, once: !!(options && options.once) });
  };
  StencilPolyfillAbortSignal.prototype.removeEventListener = function(type, listener) {
    if (type !== "abort") return;
    this._listeners = this._listeners.filter(function(entry) { return entry.listener !== listener; });
  };
  StencilPolyfillAbortSignal.prototype.dispatchEvent = function(event) {
    var signal = this;
    signal._listeners.slice().forEach(function(entry) { entry.listener.call(signal, event); });
    signal._listeners = signal._listeners.filter(function(entry) { return !entry.once; });
    return true;
  };
  function StencilPolyfillAbortController() {
    this.signal = new StencilPolyfillAbortSignal();
  }
  StencilPolyfillAbortController.prototype.abort = function(reason) {
    if (this.signal.aborted) return;
    this.signal.aborted = true;
    this.signal.reason = reason;
    this.signal.dispatchEvent({ type: "abort" });
  };
  globalThis.AbortController = StencilPolyfillAbortController;
  globalThis.AbortSignal = StencilPolyfillAbortSignal;
}
`;

// TypeScript interface file required by extism-js.
// Must declare a 'main' module - extism-js uses this as the plugin entry point.
// All functions are (): void - data flows via Host.inputString()/Host.outputString(),
// not as WASM return values. Use I32/I64/F32/F64 only for direct primitive returns.
const SSR_WASM_INTERFACE = /* ts */ `declare module "main" {
  export function renderToString(): void;
  export function setTagTransformer(): void;
  export function resetSsrDocData(): void;
}\n`;

// Extism host entry points appended as rolldown `outro` inside the IIFE.
// `Host` is a global provided by the Extism/QuickJS-ng runtime - no import needed.
// Functions reference bundled symbols by name via closure - resolved lazily at call
// time, so QuickJS-ng sees the fully-initialized IIFE scope rather than an eager
// snapshot taken during IIFE setup (which QuickJS-ng resolves incorrectly).
// setTagTransformer accepts [{from: string, to: string}] and builds a tag transformer.
const SSR_WASM_OUTRO = /* js */ `
// Whether a renderToString call is in progress. Still true at the start of a call means the last
// call ended with its render waiting on work that never resolved (see below).
var $stencilWasmRenderInProgress = false;

module.exports = {
  renderToString: async function() {
    try {
      if ($stencilWasmRenderInProgress && typeof resetReusableWindows === 'function') {
        // That render will never finish, so it would hold its reusable window and queue forever.
        resetReusableWindows();
      }
      if (typeof renderToString !== 'function') {
        Host.outputString(JSON.stringify({ __error: 'renderToString is ' + typeof renderToString }));
        return;
      }
      var inp = JSON.parse(Host.inputString());
      // If hydration never settles (a Promise nothing will resolve, or a timer due after the
      // timeout), the call doesn't hang - it runs out of scheduled work and returns whatever
      // was last written here. Write an error up front so that's a real error instead of
      // silence, then overwrite it once renderToString() actually resolves.
      Host.outputString(JSON.stringify({ __error: 'renderToString did not complete - a component may be waiting on work that never resolves' }));
      var opts = inp.options || {};
      // A plugin instance runs one call at a time, so its renders can always share one window
      // (see the reuseWindow option). Skips re-evaluating the whole platform on every call.
      if (typeof opts.reuseWindow !== 'boolean') opts.reuseWindow = true;
      var budget = typeof opts.timeout === 'number' ? opts.timeout : 15000;
      var timers = globalThis.__stencilSsrWasmTimers;
      var render = timers && timers.start(budget, function() {
        Host.outputString(JSON.stringify({ __error: 'renderToString did not complete within the ' + budget + 'ms timeout - a component may be waiting on work that never resolves, on a timer due after the timeout, or on timers it schedules forever' }));
      });
      var result;
      $stencilWasmRenderInProgress = true;
      try {
        result = await renderToString(inp.html, opts);
      } finally {
        $stencilWasmRenderInProgress = false;
        if (render) timers.stop(render);
      }
      // renderToString reports some failures (e.g. input that isn't an HTML string) as an
      // error diagnostic with no html, rather than throwing. Surface those as __error, as
      // documented, so hosts only need one failure check.
      if (!result || typeof result.html !== 'string') {
        var diagnostics = (result && result.diagnostics) || [];
        var firstError = diagnostics.find(function(d) { return d.level === 'error'; });
        Host.outputString(JSON.stringify({
          __error: firstError ? firstError.messageText : 'renderToString returned no html',
          diagnostics: diagnostics
        }));
        return;
      }
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
    // Platforms register components under their transformed tags when they're set up, so the
    // reused windows' platforms have to be set up again.
    if (typeof resetReusableWindows === 'function') resetReusableWindows();
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
      // No externals - everything must be self-contained in the WASM binary
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
            const searchPattern = `const ${MODE_RESOLVER_DECLARATION}`;
            if (!code.includes(searchPattern)) return null;
            return code.replaceAll(searchPattern, '');
          },
        },
      ],
      treeshake: false,
      // ES2020 max - QuickJS-ng constraint for extism-js compatibility
      transform: { target: 'es2020' },
      onwarn: createOnWarnFn(buildCtx.diagnostics),
      checks: { pluginTimings: config.logLevel === 'debug' },
    };

    const rolldownBuild = await rolldown(rolldownOptions);
    const rolldownOutput = await rolldownBuild.generate({
      banner:
        generatePreamble(config) + SSR_WASM_TIMER_POLYFILL + SSR_WASM_ABORT_CONTROLLER_POLYFILL,
      outro: SSR_WASM_OUTRO,
      format: 'iife',
      // IIFE supplies `exports` as its parameter, which the bundled CJS code needs.
      // The global name is unused - extism-js reads module.exports from inside the IIFE.
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
        `ssr-wasm: extism-js not found - index.js was written but index.wasm was not generated. ` +
        `Install extism-js: https://github.com/extism/js-pdk`;
    } else {
      warn.messageText = `ssr-wasm: extism-js compile failed: ${e.message}`;
    }
  }
};
