// Separate lazy-loadable chunk for Monaco. `editor.api.js` alone can't build a StandaloneEditor -
// `standaloneServices.js` + `features/register.all.js` register its core services/UI.
// `languages/definitions/*` = Monarch syntax highlighting only; `languages/features/typescript`
// layers the real worker-backed language service on top.
//
// rolldown doesn't rewrite Monaco's own `new Worker(new URL('ts.worker.js', import.meta.url))`
// fallback into a real asset URL (unlike Vite/Rollup - verified, the literal string ships as-is),
// so `getWorker` sources the worker via Stencil's `?worker` output target instead - it happens to
// work for a vendored worker (ts.worker.js has no external imports), grabbing the raw `worker`
// export to skip the RPC wrapper `?worker` normally adds. Only 'typescript'/'javascript' are
// wired up; other labels keep the old throw-and-recover behavior.
self.MonacoEnvironment = {
  getWorker: (_workerId, label) => {
    if (label === 'typescript' || label === 'javascript') {
      return import('monaco-editor/language/typescript/ts.worker.js?worker').then((m) => m.worker);
    }
    throw new Error(`stencil-playground-editor: no worker configured for label "${label}"`);
  },
};

import * as monaco from 'monaco-editor/editor/editor.api.js';
import 'monaco-editor/editor/standalone/browser/standaloneServices.js';
import 'monaco-editor/features/register.all.js';
import 'monaco-editor/languages/definitions/typescript/register.js';
import 'monaco-editor/languages/definitions/css/register.js';
import 'monaco-editor/languages/definitions/html/register.js';
import 'monaco-editor/languages/features/typescript/register.js';

export { monaco };
export {
  typescriptDefaults,
  ModuleResolutionKind,
  ScriptTarget,
  JsxEmit,
  getTypeScriptWorker,
} from 'monaco-editor/languages/features/typescript/register.js';

// Types for Monaco's extraLibs, so component snippets resolve `@stencil/core` imports (including
// `/jsx-runtime` and `/signals`) instead of erroring. Copied by build/copy-core-types.js (must run
// before `stencil build`) - see that file for why they're `.txt`, not `.d.ts`.
export { default as stencilCoreDts } from './generated/stencil-core-runtime.txt?format=text';
export { default as stencilCoreCompilerDts } from './generated/stencil-core-compiler.txt?format=text';
export { default as stencilCoreJsxRuntimeDts } from './generated/stencil-core-jsx-runtime.txt?format=text';
export { default as stencilCoreSignalsDts } from './generated/stencil-core-signals.txt?format=text';
export { default as preactSignalsCoreDts } from './generated/preact-signals-core.txt?format=text';
