import type * as d from '../../../declarations';
import { createSystem } from '../stencil-sys';

describe('stencil system', () => {
  let sys: d.CompilerSystem;
  beforeEach(() => {
    sys = createSystem();
    sys.createDirSync('/');
  });

  it('read/write', async () => {
    await sys.writeFile('/file1', 'file1');
    const content = await sys.readFile('/file1');
    expect(content).toBe('file1');

    const dirStat = await sys.stat('/');
    expect(dirStat.isFile).toBe(false);
    expect(dirStat.isDirectory).toBe(true);

    const fileStat = await sys.stat('/file1');
    expect(fileStat.isFile).toBe(true);
    expect(fileStat.isDirectory).toBe(false);
  });

  it('createDir', async () => {
    const createDirResults = await sys.createDir('/a/b/c');
    expect(createDirResults.basename).toBe('c');
    expect(createDirResults.dirname).toBe('/a/b');
    expect(createDirResults.path).toBe('/a/b/c');
    expect(createDirResults.newDirs).toHaveLength(1);
    expect(createDirResults.newDirs[0]).toBe('/a/b/c');
    expect(createDirResults.error).toBe(null);
  });

  it('createDir recursive', async () => {
    const createDirResults = await sys.createDir('/a/b/c', { recursive: true });
    expect(createDirResults.basename).toBe('c');
    expect(createDirResults.dirname).toBe('/a/b');
    expect(createDirResults.path).toBe('/a/b/c');
    expect(createDirResults.newDirs).toHaveLength(3);
    expect(createDirResults.newDirs).toContain('/a');
    expect(createDirResults.newDirs).toContain('/a/b');
    expect(createDirResults.newDirs).toContain('/a/b/c');
    expect(createDirResults.error).toBe(null);
  });

  it('rename file', async () => {
    await sys.createDir('/dir');
    await sys.writeFile('/dir/file-old', 'content');
    const results = await sys.rename('/dir/file-old', '/dir/file-new');
    expect(results.error).toBe(null);
    expect(results.isDirectory).toBe(false);
    expect(results.isFile).toBe(true);
    expect(results.oldDirs).toHaveLength(0);
    expect(results.newDirs).toHaveLength(0);
    expect(results.oldFiles).toHaveLength(1);
    expect(results.newFiles).toHaveLength(1);
    expect(results.renamed).toEqual([
      {
        oldPath: '/dir/file-old',
        newPath: '/dir/file-new',
        isDirectory: false,
        isFile: true,
      },
    ]);

    expect((await sys.stat('/dir/file-old')).error).toBe(`ENOENT: no such file or directory, statSync '/dir/file-old'`);

    const newStat = await sys.stat('/dir/file-new');
    expect(newStat.isFile).toBe(true);

    const content = await sys.readFile('/dir/file-new');
    expect(content).toBe('content');
  });

  it('rename directory', async () => {
    await sys.createDir('/old');
    const results = await sys.rename('/old', '/new');
    expect(results.error).toBe(null);
    expect(results.isDirectory).toBe(true);
    expect(results.isFile).toBe(false);
    expect(results.oldDirs).toHaveLength(1);
    expect(results.oldDirs).toContain('/old');
    expect(results.newDirs).toHaveLength(1);
    expect(results.newDirs).toContain('/new');
    expect(results.oldFiles).toHaveLength(0);
    expect(results.newFiles).toHaveLength(0);
    expect(results.renamed).toEqual([
      {
        oldPath: '/old',
        newPath: '/new',
        isDirectory: true,
        isFile: false,
      },
    ]);

    const oldStat = await sys.stat('/old');
    expect(oldStat.error).toBe(`ENOENT: no such file or directory, statSync '/old'`);

    const newStat = await sys.stat('/new');
    expect(newStat.isDirectory).toBe(true);
  });

  it('rename directory, deep path', async () => {
    await sys.createDir('/z');
    const results = await sys.rename('/z', '/a/b/c');
    expect(results.error).toBe(null);
    expect(results.isDirectory).toBe(true);
    expect(results.isFile).toBe(false);
    expect(results.oldDirs).toHaveLength(1);
    expect(results.oldDirs).toContain('/z');
    expect(results.newDirs).toHaveLength(3);
    expect(results.newDirs).toContain('/a');
    expect(results.newDirs).toContain('/a/b');
    expect(results.newDirs).toContain('/a/b/c');
    expect(results.oldFiles).toHaveLength(0);
    expect(results.newFiles).toHaveLength(0);
    expect(results.renamed).toEqual([
      {
        oldPath: '/z',
        newPath: '/a/b/c',
        isDirectory: true,
        isFile: false,
      },
    ]);

    const oldStat = await sys.stat('/z');
    expect(oldStat.error).not.toBe(null);

    const newAStat = await sys.stat('/a');
    expect(newAStat.isDirectory).toBe(true);
    const newABStat = await sys.stat('/a/b');
    expect(newABStat.isDirectory).toBe(true);
    const newABCStat = await sys.stat('/a/b/c');
    expect(newABCStat.isDirectory).toBe(true);
  });

  it('get home directory', async () => {
    const homedir = sys.homeDir();
    expect(typeof homedir).toBe('string');
  });

  it('rename directory, with files/subfolders', async () => {
    await sys.createDir('/x/y/z', { recursive: true });
    await sys.createDir('/x/y/y1-dir', { recursive: true });
    await sys.createDir('/x/y/y2-dir', { recursive: true });
    await sys.writeFile('/x/y/y1-dir/y1-file', 'y1-file');
    await sys.writeFile('/x/y/y2-dir/y2-file', 'y2-file');
    await sys.writeFile('/x/x1-file', 'x1-file');
    await sys.writeFile('/x/x2-file', 'x2-file');
    await sys.writeFile('/x/y/z/z1-file', 'z1-file');

    const results = await sys.rename('/x', '/a/b/c');

    const stat1 = await sys.stat('/x');
    expect(stat1.error).toBe(`ENOENT: no such file or directory, statSync '/x'`);
    expect(stat1.isFile).toBe(false);
    expect(stat1.isDirectory).toBe(false);
    expect(stat1.isSymbolicLink).toBe(false);
    expect(stat1.size).toBe(0);

    const stat2 = await sys.stat('/x/y');
    expect(stat2.error).not.toBe(null);

    expect((await sys.stat('/x/y/z')).error).not.toBe(null);

    expect((await sys.stat('/a')).isDirectory).toBe(true);
    expect((await sys.stat('/a/b')).isDirectory).toBe(true);
    expect((await sys.stat('/a/b/c')).isDirectory).toBe(true);
    expect((await sys.stat('/a/b/c/y')).isDirectory).toBe(true);
    expect((await sys.stat('/a/b/c/y/y1-dir')).isDirectory).toBe(true);
    expect((await sys.stat('/a/b/c/y/y2-dir')).isDirectory).toBe(true);

    expect((await sys.stat('/a/b/c/y/y1-dir/y1-file')).isFile).toBe(true);
    expect(await sys.readFile('/a/b/c/y/y1-dir/y1-file')).toBe('y1-file');

    expect((await sys.stat('/a/b/c/y/y2-dir/y2-file')).isFile).toBe(true);
    expect(await sys.readFile('/a/b/c/y/y2-dir/y2-file')).toBe('y2-file');

    expect((await sys.stat('/x/x1-file')).error).not.toBe(null);
    expect((await sys.stat('/a/b/c/x1-file')).isFile).toBe(true);
    expect(await sys.readFile('/a/b/c/x1-file')).toBe('x1-file');

    expect((await sys.stat('/x/x2-file')).error).not.toBe(null);
    expect((await sys.stat('/a/b/c/x2-file')).isFile).toBe(true);
    expect(await sys.readFile('/a/b/c/x2-file')).toBe('x2-file');

    expect((await sys.stat('/x/y/z/z1-file')).error).not.toBe(null);
    expect((await sys.stat('/a/b/c/y/z/z1-file')).isFile).toBe(true);
    expect(await sys.readFile('/a/b/c/y/z/z1-file')).toBe('z1-file');

    expect(results.error).toBe(null);
    expect(results.oldDirs).toEqual(['/x/y/y1-dir', '/x/y/y2-dir', '/x/y/z', '/x/y', '/x']);
    expect(results.oldFiles).toEqual([
      '/x/x1-file',
      '/x/x2-file',
      '/x/y/y1-dir/y1-file',
      '/x/y/y2-dir/y2-file',
      '/x/y/z/z1-file',
    ]);
    expect(results.newDirs).toEqual([
      '/a',
      '/a/b',
      '/a/b/c',
      '/a/b/c/y',
      '/a/b/c/y/y1-dir',
      '/a/b/c/y/y2-dir',
      '/a/b/c/y/z',
    ]);
    expect(results.newFiles).toEqual([
      '/a/b/c/x1-file',
      '/a/b/c/x2-file',
      '/a/b/c/y/y1-dir/y1-file',
      '/a/b/c/y/y2-dir/y2-file',
      '/a/b/c/y/z/z1-file',
    ]);

    expect(results.renamed).toEqual([
      {
        oldPath: '/x',
        newPath: '/a/b/c',
        isDirectory: true,
        isFile: false,
      },
      {
        oldPath: '/x/x1-file',
        newPath: '/a/b/c/x1-file',
        isDirectory: false,
        isFile: true,
      },
      {
        oldPath: '/x/x2-file',
        newPath: '/a/b/c/x2-file',
        isDirectory: false,
        isFile: true,
      },
      {
        oldPath: '/x/y',
        newPath: '/a/b/c/y',
        isDirectory: true,
        isFile: false,
      },
      {
        oldPath: '/x/y/y1-dir',
        newPath: '/a/b/c/y/y1-dir',
        isDirectory: true,
        isFile: false,
      },
      {
        oldPath: '/x/y/y1-dir/y1-file',
        newPath: '/a/b/c/y/y1-dir/y1-file',
        isDirectory: false,
        isFile: true,
      },
      {
        oldPath: '/x/y/y2-dir',
        newPath: '/a/b/c/y/y2-dir',
        isDirectory: true,
        isFile: false,
      },
      {
        oldPath: '/x/y/y2-dir/y2-file',
        newPath: '/a/b/c/y/y2-dir/y2-file',
        isDirectory: false,
        isFile: true,
      },
      {
        oldPath: '/x/y/z',
        newPath: '/a/b/c/y/z',
        isDirectory: true,
        isFile: false,
      },
      {
        oldPath: '/x/y/z/z1-file',
        newPath: '/a/b/c/y/z/z1-file',
        isDirectory: false,
        isFile: true,
      },
    ]);
  });
});
