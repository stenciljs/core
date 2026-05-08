import path from 'path';
import { createTestCompiler } from '@stencil/core/testing';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import type * as d from '@stencil/core';

import { getLazyBuildConditionals } from '../../output-targets/dist-lazy/lazy-build-conditionals';

describe('build-conditionals', () => {
  let compiler: d.Compiler;
  let config: d.ValidatedConfig;
  const root = path.resolve('/');

  beforeEach(async () => {
    const result = await createTestCompiler();
    compiler = result.compiler;
    config = result.config;
    await compiler.fs.writeFile(path.join(root, 'src', 'index.html'), `<cmp-a></cmp-a>`);
    await compiler.fs.commit();
  });
  afterEach(async () => {
    await compiler.destroy();
  });

  it('should set svg/slot/shadow build conditionals', async () => {
    await compiler.fs.writeFiles({
      [path.join(root, 'src', 'cmp-a.tsx')]: `
        import { icon, slot } from './icon';
        @Component({ tag: 'cmp-a', encapsulation: { type: 'shadow' } }) export class CmpA {
          render() { return <div>{icon()}{slot()}</div>; }
        }`,
      [path.join(root, 'src', 'slot.tsx')]: `export default () => <slot/>;`,
      [path.join(root, 'src', 'icon.tsx')]: `
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
      [path.join(root, 'src', 'cmp-a.tsx')]: `
        import icon from './icon';
        @Component({ tag: 'cmp-a', encapsulation: { type: 'shadow' } }) export class CmpA {
          render() { return <div><slot/></div>; }
        }`,
      [path.join(root, 'src', 'icon.tsx')]: `export default () => <svg/>;`,
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
      [path.join(root, 'src', 'cmp-a.tsx')]: `@Component({ tag: 'cmp-a' }) export class CmpA {
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
      [path.join(root, 'src', 'cmp-a.tsx')]: `@Component({ tag: 'cmp-a' }) export class CmpA {
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
      [path.join(root, 'src', 'cmp-a.tsx')]: `@Component({ tag: 'cmp-a' }) export class CmpA {
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
