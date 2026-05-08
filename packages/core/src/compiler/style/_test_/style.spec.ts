import path from 'path';
import { createTestCompiler } from '@stencil/core/testing';
import { describe, it, beforeEach, expect } from 'vitest';

describe('component-styles', () => {
  let compiler: Awaited<ReturnType<typeof createTestCompiler>>['compiler'];
  const root = path.resolve('/');

  beforeEach(async () => {
    const result = await createTestCompiler({
      config: {
        minifyCss: true,
        minifyJs: true,
        hashFileNames: true,
      },
    });
    compiler = result.compiler;
    await compiler.fs.writeFile(path.join(root, 'src', 'index.html'), `<cmp-a></cmp-a>`);
    await compiler.fs.commit();
  });

  it('should add mode styles to hashed filename/minified builds', async () => {
    const result = await createTestCompiler({
      config: {
        minifyCss: true,
        minifyJs: true,
        hashFileNames: true,
      },
    });
    const compiler2 = result.compiler;
    compiler2.config.hashedFileNameLength = 2;
    await compiler2.fs.writeFile(path.join(root, 'src', 'index.html'), `<cmp-a></cmp-a>`);
    await compiler2.fs.writeFiles({
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
    await compiler2.fs.commit();

    const r = await compiler2.build();
    expect(r.diagnostics).toHaveLength(0);

    let hasIos = false;
    let hasMd = false;

    r.outputs
      .flatMap((o) => o.files)
      .forEach((f) => {
        const content = compiler2.fs.readFileSync(f);
        if (content.includes(`body{font-family:Helvetica}`)) {
          hasIos = true;
        }
        if (content.includes(`body{font-family:Roboto}`)) {
          hasMd = true;
        }
      });

    expect(hasIos).toBe(true);
    expect(hasMd).toBe(true);
  });

  it('should add default styles to hashed filename/minified builds', async () => {
    const result = await createTestCompiler({
      config: {
        minifyCss: true,
        minifyJs: true,
        hashFileNames: true,
      },
    });
    const compiler2 = result.compiler;
    compiler2.config.sys.generateContentHash = function () {
      return 'hashed';
    };

    await compiler2.fs.writeFile(path.join(root, 'src', 'index.html'), `<cmp-a></cmp-a>`);
    await compiler2.fs.writeFiles({
      [path.join(root, 'src', 'cmp-a.tsx')]:
        `@Component({ tag: 'cmp-a', styleUrl: 'cmp-a.css' }) export class CmpA {}`,
      [path.join(root, 'src', 'cmp-a.css')]: `body{color:red}`,
    });
    await compiler2.fs.commit();

    const r = await compiler2.build();
    expect(r.diagnostics).toHaveLength(0);

    const content = await compiler2.fs.readFile(
      path.join(root, 'www', 'build', 'p-hashed.entry.js'),
    );
    expect(content).toContain(`body{color:red}`);
  });
});
