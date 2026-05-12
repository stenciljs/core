import type * as d from '@stencil/core';

import { buildWarn } from '../../utils';

export const validatePlugins = (config: d.UnvalidatedConfig, diagnostics: d.Diagnostic[]) => {
  const userPlugins = config.plugins;

  if (!config.rolldownPlugins) {
    config.rolldownPlugins = {};
  }
  if (!Array.isArray(userPlugins)) {
    config.plugins = [];
    return;
  }

  const rolldownPlugins = userPlugins.filter((plugin) => {
    return !!(plugin && typeof plugin === 'object' && !plugin.pluginType);
  });

  const hasResolveNode = rolldownPlugins.some((p) => p.name === 'node-resolve');
  const hasCommonjs = rolldownPlugins.some((p) => p.name === 'commonjs');

  if (hasCommonjs) {
    const warn = buildWarn(diagnostics);
    warn.messageText = `Rolldown handles CommonJS natively — remove the commonjs plugin from your "stencil.config.ts" plugins.`;
  }

  if (hasResolveNode) {
    const warn = buildWarn(diagnostics);
    warn.messageText = `Rolldown handles module resolution natively — remove the node-resolve plugin from your "stencil.config.ts" plugins. Use the "nodeResolve" config option to customise resolution.`;
  }

  config.rolldownPlugins.before = [
    ...(config.rolldownPlugins.before || []),
    ...rolldownPlugins.filter(({ name }) => name !== 'node-resolve' && name !== 'commonjs'),
  ];

  config.plugins = userPlugins.filter((plugin) => {
    return !!(plugin && typeof plugin === 'object' && plugin.pluginType);
  });
};
