import { describe, expect, it, beforeAll, beforeEach, afterEach } from 'vitest';
import type * as d from '@stencil/core';

import {
  createTestCompiler,
  prepareTestCompiler,
  type PreparedTestCompiler,
} from '../../../testing/compiler';
import { join } from '../../../utils';
import { getLazyBuildConditionals } from '../../output-targets/dist-lazy/lazy-build-conditionals';

describe('build-conditionals', () => {
  let setup: PreparedTestCompiler;
  let compiler: d.Compiler;
  let config: d.ValidatedConfig;
  // `createTestCompiler`'s default rootDir comes from the in-memory sys ('/'), which
  // may not match `path.resolve('/')` on Windows (drive-lettered) - read it back from
  // the actual validated config instead of assuming it up front. Use Stencil's own
  // `join` (always forward-slash) rather than native `path.join`, to match exactly
  // what the compiler itself uses internally when writing output.
  let root: string;

  beforeAll(async () => {
    setup = await prepareTestCompiler();
  });

  beforeEach(async () => {
    const result = await createTestCompiler({ setup });
    compiler = result.compiler;
    config = result.config;
    root = config.rootDir;
    await compiler.fs.writeFile(join(root, 'src', 'index.html'), `<cmp-a></cmp-a>`);
    await compiler.fs.commit();
  });
  afterEach(async () => {
    await compiler.destroy();
  });

  it('should set svg/slot/shadow build conditionals', async () => {
    await compiler.fs.writeFiles({
      [join(root, 'src', 'cmp-a.tsx')]: `
        import { icon, slot } from './icon';
        @Component({ tag: 'cmp-a', encapsulation: { type: 'shadow' } }) export class CmpA {
          render() { return <div>{icon()}{slot()}</div>; }
        }`,
      [join(root, 'src', 'slot.tsx')]: `export default () => <slot/>;`,
      [join(root, 'src', 'icon.tsx')]: `
        import slot from './slot';
        export const icon = () => <svg/>;
        export { slot };
      `,
    });
    await compiler.fs.commit();

    const r = await compiler.build();
    expect(r.diagnostics).toHaveLength(0);
    expect(getLazyBuildConditionals(config, r.components)).toEqual(
      expect.objectContaining({ shadowDom: true, slot: true, svg: true, vdomRender: true }),
    );
  });

  it('should set slot build conditionals, not import unused svg import', async () => {
    await compiler.fs.writeFiles({
      [join(root, 'src', 'cmp-a.tsx')]: `
        import icon from './icon';
        @Component({ tag: 'cmp-a', encapsulation: { type: 'shadow' } }) export class CmpA {
          render() { return <div><slot/></div>; }
        }`,
      [join(root, 'src', 'icon.tsx')]: `export default () => <svg/>;`,
    });
    await compiler.fs.commit();

    const r = await compiler.build();
    expect(r.diagnostics).toHaveLength(0);
    expect(getLazyBuildConditionals(config, r.components)).toEqual(
      expect.objectContaining({ shadowDom: true, slot: true, svg: false, vdomRender: true }),
    );
  });

  it('should set slot build conditionals', async () => {
    await compiler.fs.writeFiles({
      [join(root, 'src', 'cmp-a.tsx')]: `@Component({ tag: 'cmp-a' }) export class CmpA {
        render() { return <div><slot/></div>; }
      }`,
    });
    await compiler.fs.commit();

    const r = await compiler.build();
    expect(r.diagnostics).toHaveLength(0);
    expect(getLazyBuildConditionals(config, r.components)).toEqual(
      expect.objectContaining({ shadowDom: false, slot: true, svg: false, vdomRender: true }),
    );
  });

  it('should set vdom build conditionals', async () => {
    await compiler.fs.writeFiles({
      [join(root, 'src', 'cmp-a.tsx')]: `@Component({ tag: 'cmp-a' }) export class CmpA {
        render() { return <div>Hello World</div>; }
      }`,
    });
    await compiler.fs.commit();

    const r = await compiler.build();
    expect(r.diagnostics).toHaveLength(0);
    expect(getLazyBuildConditionals(config, r.components)).toEqual(
      expect.objectContaining({ shadowDom: false, slot: false, svg: false, vdomRender: true }),
    );
  });

  it('should not set vdom build conditionals', async () => {
    await compiler.fs.writeFiles({
      [join(root, 'src', 'cmp-a.tsx')]: `@Component({ tag: 'cmp-a' }) export class CmpA {
        render() { return 'Hello World'; }
      }`,
    });
    await compiler.fs.commit();

    const r = await compiler.build();
    expect(r.diagnostics).toHaveLength(0);
    expect(getLazyBuildConditionals(config, r.components)).toEqual(
      expect.objectContaining({ shadowDom: false, slot: false, svg: false, vdomRender: false }),
    );
  });
});
