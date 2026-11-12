import { describe, expectTypeOf, it } from 'vitest';

import type {
  BuildCtx,
  CompilerCtx,
  Config,
  OutputTargetCustom,
  Plugin,
  PluginCtx,
  PluginTransformResults,
} from '../index';

describe('@stencil/core/compiler public types', () => {
  it('exposes the types needed to author a plugin', () => {
    const plugin: Plugin = {
      pluginType: 'css',
      transform: (sourceText: string, _id: string, ctx: PluginCtx): PluginTransformResults =>
        ctx.diagnostics.length ? sourceText : { code: sourceText, dependencies: [] },
    };
    expectTypeOf<Config['plugins']>().toExtend<unknown[] | undefined>();
    expectTypeOf(plugin).toExtend<NonNullable<Config['plugins']>[number]>();
  });

  it('exposes the types needed to author a custom output target', () => {
    expectTypeOf<Parameters<OutputTargetCustom['generator']>[1]>().toEqualTypeOf<CompilerCtx>();
    expectTypeOf<Parameters<OutputTargetCustom['generator']>[2]>().toEqualTypeOf<BuildCtx>();
  });
});
