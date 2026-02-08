import { buildError, relative } from '@utils';

import type * as d from '../../declarations';

export const pluginHelper = (config: d.ValidatedConfig, builtCtx: d.BuildCtx, platform: string) => {
  return {
    name: 'pluginHelper',
    resolveId(importee: string, importer: string): null {
      if (/\0/.test(importee)) {
        // ignore IDs with null character, these belong to other plugins
        return null;
      }

      if (importee.endsWith('/')) {
        importee = importee.slice(0, -1);
      }

      if (builtIns.has(importee)) {
        let fromMsg = '';
        if (importer) {
          fromMsg = ` from ${relative(config.rootDir, importer)}`;
        }
        const diagnostic = buildError(builtCtx.diagnostics);
        diagnostic.header = `Node Polyfills Required`;
        diagnostic.messageText = `For the import "${importee}" to be bundled${fromMsg}, ensure the "rollup-plugin-node-polyfills" plugin is installed and added to the stencil config plugins (${platform}). Please see the bundling docs for more information.
        Further information: https://stenciljs.com/docs/module-bundling`;
      }
      return null;
    },
  };
};

const builtIns = new Set([
  'child_process',
  'cluster',
  'dgram',
  'dns',
  'module',
  'net',
  'readline',
  'repl',
  'tls',

  'assert',
  'console',
  'constants',
  'domain',
  'events',
  'path',
  'punycode',
  'querystring',
  '_stream_duplex',
  '_stream_passthrough',
  '_stream_readable',
  '_stream_writable',
  '_stream_transform',
  'string_decoder',
  'sys',
  'tty',

  'crypto',
  'fs',

  'Buffer',
  'buffer',
  'global',
  'http',
  'https',
  'os',
  'process',
  'stream',
  'timers',
  'url',
  'util',
  'vm',
  'zlib',
]);
