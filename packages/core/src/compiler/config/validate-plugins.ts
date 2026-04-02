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
    warn.messageText = `Stencil already uses "@rolldown/plugin-commonjs", please remove it from your "stencil.config.ts" plugins.
    You can configure the commonjs settings using the "commonjs" property in "stencil.config.ts`;
  }

  if (hasResolveNode) {
    const warn = buildWarn(diagnostics);
    warn.messageText = `Stencil already uses "@rolldown/plugin-commonjs", please remove it from your "stencil.config.ts" plugins.
    You can configure the commonjs settings using the "commonjs" property in "stencil.config.ts`;
  }

  config.rolldownPlugins.before = [
    ...(config.rolldownPlugins.before || []),
    ...rolldownPlugins.filter(({ name }) => name !== 'node-resolve' && name !== 'commonjs'),
  ];

  config.plugins = userPlugins.filter((plugin) => {
    return !!(plugin && typeof plugin === 'object' && plugin.pluginType);
  });
};
