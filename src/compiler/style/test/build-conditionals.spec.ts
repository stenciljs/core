// @ts-nocheck
// TODO(STENCIL-463): as part of getting these tests to pass, remove // @ts-nocheck
import { Compiler, Config } from '@stencil/core/compiler';
import { mockConfig } from '@stencil/core/testing';
import path from 'path';

// TODO(STENCIL-463): investigate getting these tests to pass again
describe.skip('build-conditionals', () => {
  jest.setTimeout(20000);
  let compiler: Compiler;
  let config: Config;
  const root = path.resolve('/');

  beforeEach(async () => {
    config = mockConfig();
    compiler = new Compiler(config);
    await compiler.fs.writeFile(path.join(root, 'src', 'index.html'), `<cmp-a></cmp-a>`);
    await compiler.fs.commit();
  });

  it('should import function svg/slot build conditionals, remove on rebuild, and add back on rebuild', async () => {
    compiler.config.watch = true;
    await compiler.fs.writeFiles({
      [path.join(root, 'src', 'cmp-a.tsx')]: `
        import {icon, slot} from './icon';
        @Component({ tag: 'cmp-a', shadow: true }) export class CmpA {
          render() {
            return <div>{icon()}{slot()}</div>
          }
        }`,
      [path.join(root, 'src', 'slot.tsx')]: `
        export default () => <slot/>;
      `,
      [path.join(root, 'src', 'icon.tsx')]: `
        import slot from './slot';
        export const icon = () => <svg/>;
        export { slot };
      `,
    });
    await compiler.fs.commit();

    let r = await compiler.build();
    let rebuildListener = compiler.once('buildFinish');

    expect(r.diagnostics).toHaveLength(0);
    expect(r.buildConditionals).toEqual({
      shadow: true,
      slot: true,
      svg: true,
      vdom: true,
    });

    await compiler.fs.writeFiles(
      {
        [path.join(root, 'src', 'cmp-a.tsx')]: `@Component({ tag: 'cmp-a' }) export class CmpA {}`,
      },
      { clearFileCache: true },
    );
    await compiler.fs.commit();

    compiler.trigger('fileUpdate', path.join(root, 'src', 'cmp-a.tsx'));

    r = await rebuildListener;

    expect(r.diagnostics).toHaveLength(0);
    expect(r.buildConditionals).toEqual({
      shadow: false,
      slot: false,
      svg: false,
      vdom: false,
    });

    await compiler.fs.writeFiles(
      {
        [path.join(root, 'src', 'cmp-a.tsx')]: `
      import {icon, slot} from './icon';
      @Component({ tag: 'cmp-a', shadow: true }) export class CmpA {
        render() {
          return <div>{icon()}{slot()}</div>
        }
      }`,
      },
      { clearFileCache: true },
    );
    await compiler.fs.commit();

    rebuildListener = compiler.once('buildFinish');

    compiler.trigger('fileUpdate', path.join(root, 'src', 'cmp-a.tsx'));

    r = await rebuildListener;

    expect(r.diagnostics).toHaveLength(0);
    expect(r.buildConditionals).toEqual({
      shadow: true,
      slot: true,
      svg: true,
      vdom: true,
    });
  });

  it('should set slot build conditionals, not import unused svg import', async () => {
    await compiler.fs.writeFiles({
      [path.join(root, 'src', 'cmp-a.tsx')]: `
        import icon from './icon';
        @Component({ tag: 'cmp-a', shadow: true }) export class CmpA {
          render() {
            return <div><slot/></div>
          }
        }`,
      [path.join(root, 'src', 'icon.tsx')]: `
        export default () => <svg/>;
      `,
    });
    await compiler.fs.commit();

    const r = await compiler.build();
    expect(r.diagnostics).toHaveLength(0);
    expect(r.buildConditionals).toEqual({
      shadow: true,
      slot: true,
      svg: false,
      vdom: true,
    });
  });

  it('should set slot build conditionals', async () => {
    await compiler.fs.writeFiles({
      [path.join(root, 'src', 'cmp-a.tsx')]: `@Component({ tag: 'cmp-a' }) export class CmpA {
        render() {
          return <div><slot/></div>
        }
      }`,
    });
    await compiler.fs.commit();

    const r = await compiler.build();
    expect(r.diagnostics).toHaveLength(0);
    expect(r.buildConditionals).toEqual({
      shadow: false,
      slot: true,
      svg: false,
      vdom: true,
    });
  });

  it('should set vdom build conditionals', async () => {
    await compiler.fs.writeFiles({
      [path.join(root, 'src', 'cmp-a.tsx')]: `@Component({ tag: 'cmp-a' }) export class CmpA {
        render() {
          return <div>Hello World</div>
        }
      }`,
    });
    await compiler.fs.commit();

    const r = await compiler.build();
    expect(r.diagnostics).toHaveLength(0);
    expect(r.buildConditionals).toEqual({
      shadow: false,
      slot: false,
      svg: false,
      vdom: true,
    });
  });

  it('should not set vdom build conditionals', async () => {
    await compiler.fs.writeFiles({
      [path.join(root, 'src', 'cmp-a.tsx')]: `@Component({ tag: 'cmp-a' }) export class CmpA {
        render() {
          return 'Hello World';
        }
      }`,
    });
    await compiler.fs.commit();

    const r = await compiler.build();
    expect(r.diagnostics).toHaveLength(0);
    expect(r.buildConditionals).toEqual({
      shadow: false,
      slot: false,
      svg: false,
      vdom: false,
    });
  });
});
