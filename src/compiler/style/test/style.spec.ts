// @ts-nocheck
/* eslint-disable jest/no-test-prefixes, jest/no-commented-out-tests -- this file needs to be brought up to date at some point */
// TODO(STENCIL-464): remove // @ts-nocheck as part of getting these tests to pass
import { Compiler, Config } from '@stencil/core/compiler';
import { mockConfig } from '@stencil/core/testing';
import path from 'path';

// TODO(STENCIL-464): investigate getting these tests to run again
xdescribe('component-styles', () => {
  jest.setTimeout(20000);
  let compiler: Compiler;
  let config: Config;
  const root = path.resolve('/');

  beforeEach(async () => {
    config = mockConfig({
      minifyCss: true,
      minifyJs: true,
      hashFileNames: true,
    });
    compiler = new Compiler(config);
    await compiler.fs.writeFile(path.join(root, 'src', 'index.html'), `<cmp-a></cmp-a>`);
    await compiler.fs.commit();
  });

  it('should add mode styles to hashed filename/minified builds', async () => {
    compiler.config.hashedFileNameLength = 2;
    await compiler.fs.writeFiles({
      [path.join(root, 'src', 'cmp-a.tsx')]: `@Component({
        tag: 'cmp-a',
        styleUrls: {
          ios: 'cmp-a.ios.css',
          md: 'cmp-a.md.css'
        }
      })
      export class CmpA {}`,

      [path.join(root, 'src', 'cmp-a.ios.css')]: `body{font-family:Helvetica}`,
      [path.join(root, 'src', 'cmp-a.md.css')]: `body{font-family:Roboto}`,
    });
    await compiler.fs.commit();

    const r = await compiler.build();
    expect(r.diagnostics).toHaveLength(0);

    let hasIos = false;
    let hasMd = false;

    r.filesWritten.forEach((f) => {
      const content = compiler.fs.readFileSync(f);
      if (content.includes(`body{font-family:Helvetica}`)) {
        hasIos = true;
      } else if (content.includes(`body{font-family:Roboto}`)) {
        hasMd = true;
      }
    });

    expect(hasIos).toBe(true);
    expect(hasMd).toBe(true);
  });

  it('should add default styles to hashed filename/minified builds', async () => {
    compiler.config.sys.generateContentHash = function () {
      return 'hashed';
    };

    await compiler.fs.writeFiles({
      [path.join(root, 'src', 'cmp-a.tsx')]: `@Component({ tag: 'cmp-a', styleUrl: 'cmp-a.css' }) export class CmpA {}`,
      [path.join(root, 'src', 'cmp-a.css')]: `body{color:red}`,
    });
    await compiler.fs.commit();

    const r = await compiler.build();
    expect(r.diagnostics).toHaveLength(0);

    const content = await compiler.fs.readFile(path.join(root, 'www', 'build', 'p-hashed.entry.js'));
    expect(content).toContain(`body{color:red}`);
  });
});
