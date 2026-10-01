import { describe, expect, it } from 'vitest';
import type * as d from '@stencil/core';

import { validatePlugins } from '../validate-plugins';

function makeConfig(plugins: any[]): d.UnvalidatedConfig {
  return { plugins } as d.UnvalidatedConfig;
}

describe('validatePlugins', () => {
  it('initialises rolldownPlugins if absent', () => {
    const config = makeConfig([]);
    validatePlugins(config, []);
    expect(config.rolldownPlugins).toBeDefined();
  });

  it('forwards unknown plugins to rolldownPlugins.before', () => {
    const myPlugin = { name: 'my-plugin' };
    const config = makeConfig([myPlugin]);
    validatePlugins(config, []);
    expect(config.rolldownPlugins!.before).toContain(myPlugin);
  });

  it('warns and drops commonjs plugin', () => {
    const config = makeConfig([{ name: 'commonjs' }]);
    const diagnostics: d.Diagnostic[] = [];
    validatePlugins(config, diagnostics);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].messageText).toContain('CommonJS');
    expect(config.rolldownPlugins!.before).toHaveLength(0);
  });

  it('warns and drops node-resolve plugin', () => {
    const config = makeConfig([{ name: 'node-resolve' }]);
    const diagnostics: d.Diagnostic[] = [];
    validatePlugins(config, diagnostics);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].messageText).toContain('node-resolve');
    expect(config.rolldownPlugins!.before).toHaveLength(0);
  });

  it('handles non-array plugins gracefully', () => {
    const config = { plugins: 'not-an-array' } as unknown as d.UnvalidatedConfig;
    validatePlugins(config, []);
    expect(config.plugins).toEqual([]);
  });
});
