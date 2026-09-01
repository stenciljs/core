// A single static-import module for Monaco, kept separate from the editor component so it's a
// stable, individually lazy-loadable chunk.
//
// `editor/editor.api.js` alone can't construct a working StandaloneEditor: the ~30 core services
// it needs (hoverService among them) are registered as a side effect of `standaloneServices.js`,
// which only the kitchen-sink `monaco-editor` entry point pulls in transitively. Importing it
// directly here gets the dependency without the rest of that entry point.
//
// `features/register.all.js` adds built-in editor UI (find, folding, bracket matching, etc).
// The 3 `languages/definitions/*/register.js` imports add only Monarch (regex-tokenizer) syntax
// highlighting for the languages this playground edits - not full worker-backed language
// *services* (real IntelliSense/diagnostics), which is a substantially bigger, separately-scoped
// effort. Pulling those in anyway visibly bloated the build (6 vs 200+ stylesheets discovered
// during bundling) for a feature this pass doesn't use.
//
// No web workers are wired up for this pass. Without the throw below, Monaco's eagerly-
// instantiated worker service tries to spin up a worker at a bundler-computed URL that isn't
// actually served, throwing an unhandled rejection despite recovering - failing the lookup up
// front keeps it a clean, synchronous "not configured" instead.
declare global {
  interface Window {
    MonacoEnvironment?: { getWorker: () => never };
  }
}
self.MonacoEnvironment = {
  getWorker: () => {
    throw new Error('stencil-playground-editor: web workers are not configured');
  },
};

import * as monaco from 'monaco-editor/editor/editor.api.js';
import 'monaco-editor/editor/standalone/browser/standaloneServices.js';
import 'monaco-editor/features/register.all.js';
import 'monaco-editor/languages/definitions/typescript/register.js';
import 'monaco-editor/languages/definitions/css/register.js';
import 'monaco-editor/languages/definitions/html/register.js';

export { monaco };
