import { createTestingSystem } from '../../../testing/testing-sys';
import { normalizePath } from '../../../utils';
import type { FsItem, FsItems } from '../in-memory-fs';
import { createInMemoryFs, getCommitInstructions, InMemoryFileSystem, shouldIgnore } from '../in-memory-fs';

describe(`in-memory-fs, getCommitInstructions`, () => {
  let items: FsItems;

  beforeEach(() => {
    items = new Map();
  });

  function fsItem(item: any): FsItem {
    const defaultItem: Partial<FsItem> = {
      exists: undefined,
      fileText: undefined,
      size: undefined,
      mtimeMs: undefined,
      isDirectory: undefined,
      isFile: undefined,
      queueCopyFileToDest: undefined,
      queueDeleteFromDisk: undefined,
      queueWriteToDisk: undefined,
      useCache: undefined,
    };
    return Object.assign(defaultItem, item);
  }

  it(`dirsToDelete, sort longest to shortest, windows`, () => {
    const root = normalizePath(`C:\\`);
    const dir1 = normalizePath(`C:\\dir1\\`);
    const dir2 = normalizePath(`C:\\dir1\\dir2\\`);
    const dir3 = normalizePath(`C:\\dir1\\dir2\\dir3\\`);
    items.set(root, fsItem({ queueDeleteFromDisk: true, isDirectory: true }));
    items.set(dir2, fsItem({ queueDeleteFromDisk: true, isDirectory: true }));
    items.set(dir3, fsItem({ queueDeleteFromDisk: true, isDirectory: true }));
    items.set(dir1, fsItem({ queueDeleteFromDisk: true, isDirectory: true }));
    const i = getCommitInstructions(items);
    expect(i.filesToDelete).toEqual([]);
    expect(i.filesToWrite).toEqual([]);
    expect(i.dirsToDelete).toEqual([`C:/dir1/dir2/dir3`, `C:/dir1/dir2`, `C:/dir1`]);
    expect(i.dirsToEnsure).toEqual([]);
    expect(items.get(`C:/dir1`)?.queueDeleteFromDisk).toBe(false);
    expect(items.get(`C:/dir1/dir2`)?.queueDeleteFromDisk).toBe(false);
    expect(items.get(`C:/dir1/dir2/dir3`)?.queueDeleteFromDisk).toBe(false);
  });

  it(`dirsToDelete, sort longest to shortest, unix`, () => {
    const root = normalizePath(`/`);
    const dir1 = normalizePath(`/dir1`);
    const dir2 = normalizePath(`/dir1/dir2/`);
    const dir3 = normalizePath(`/dir1/dir2/dir3/`);
    items.set(root, fsItem({ queueDeleteFromDisk: true, isDirectory: true }));
    items.set(dir2, fsItem({ queueDeleteFromDisk: true, isDirectory: true }));
    items.set(dir1, fsItem({ queueDeleteFromDisk: true, isDirectory: true }));
    items.set(dir3, fsItem({ queueDeleteFromDisk: true, isDirectory: true }));
    const i = getCommitInstructions(items);
    expect(i.filesToDelete).toEqual([]);
    expect(i.filesToWrite).toEqual([]);
    expect(i.dirsToDelete).toEqual([`/dir1/dir2/dir3`, `/dir1/dir2`, `/dir1`]);
    expect(i.dirsToEnsure).toEqual([]);
    expect(items.get(`/dir1`)?.queueDeleteFromDisk).toBe(false);
    expect(items.get(`/dir1/dir2`)?.queueDeleteFromDisk).toBe(false);
    expect(items.get(`/dir1/dir2/dir3`)?.queueDeleteFromDisk).toBe(false);
  });

  it(`ensure dirs, sort shortest to longest, windows`, () => {
    const file2 = normalizePath(`C:\\dir1\\dir2\\dir3\\file2.js`);
    const dir1 = normalizePath(`C:\\dir1\\`);
    const file1 = normalizePath(`C:\\dir1\\dir2\\file1.js`);
    items.set(file2, fsItem({ queueWriteToDisk: true, isFile: true }));
    items.set(dir1, fsItem({ queueWriteToDisk: true, isDirectory: true }));
    items.set(file1, fsItem({ queueWriteToDisk: true, isFile: true }));
    const i = getCommitInstructions(items);
    expect(i.filesToDelete).toEqual([]);
    expect(i.filesToWrite).toEqual([`C:/dir1/dir2/dir3/file2.js`, `C:/dir1/dir2/file1.js`]);
    expect(i.dirsToDelete).toEqual([]);
    expect(i.dirsToEnsure).toEqual([`C:/dir1`, `C:/dir1/dir2`, `C:/dir1/dir2/dir3`]);
    expect(items.get(`C:/dir1`)?.queueDeleteFromDisk).toBe(false);
    expect(items.get(`C:/dir1/dir2/file1.js`)?.queueDeleteFromDisk).toBe(false);
    expect(items.get(`C:/dir1/dir2/dir3/file2.js`)?.queueDeleteFromDisk).toBe(false);
  });

  it(`ensure dirs, sort shortest to longest`, () => {
    items.set(`/`, fsItem({ queueWriteToDisk: true, isDirectory: true }));
    items.set(`/dir1/dir2/dir3/file2.js`, fsItem({ queueWriteToDisk: true, isFile: true }));
    items.set(`/dir1`, fsItem({ queueWriteToDisk: true, isDirectory: true }));
    items.set(`/dir1/dir2/file1.js`, fsItem({ queueWriteToDisk: true, isFile: true }));
    const i = getCommitInstructions(items);
    expect(i.filesToDelete).toEqual([]);
    expect(i.filesToWrite).toEqual([`/dir1/dir2/dir3/file2.js`, `/dir1/dir2/file1.js`]);
    expect(i.dirsToDelete).toEqual([]);
    expect(i.dirsToEnsure).toEqual([`/dir1`, `/dir1/dir2`, `/dir1/dir2/dir3`]);
    expect(items.get(`/dir1`)?.queueDeleteFromDisk).toBe(false);
    expect(items.get(`/dir1/dir2/file1.js`)?.queueDeleteFromDisk).toBe(false);
    expect(items.get(`/dir1/dir2/dir3/file2.js`)?.queueDeleteFromDisk).toBe(false);
  });

  it(`do not delete a files/directory if we also want to ensure it`, () => {
    items.set(`/dir1/file1.js`, fsItem({ queueWriteToDisk: true, queueDeleteFromDisk: true, isFile: true }));
    items.set(`/dir1`, fsItem({ queueDeleteFromDisk: true, isDirectory: true }));
    const i = getCommitInstructions(items);
    expect(i.filesToDelete).toEqual([]);
    expect(i.filesToWrite).toEqual([`/dir1/file1.js`]);
    expect(i.dirsToDelete).toEqual([]);
    expect(i.dirsToEnsure).toEqual([`/dir1`]);
    expect(items.get(`/dir1/file1.js`)?.queueWriteToDisk).toBe(false);
  });

  it(`queueDeleteFromDisk`, () => {
    items.set(`/`, fsItem({ queueDeleteFromDisk: true, isDirectory: true }));
    items.set(`/dir1`, fsItem({ queueDeleteFromDisk: true, isDirectory: true }));
    items.set(`/dir1/file1.js`, fsItem({ queueDeleteFromDisk: true, isFile: true }));
    items.set(`/dir2/file2.js`, fsItem({ queueDeleteFromDisk: true, isFile: true }));
    const i = getCommitInstructions(items);
    expect(i.filesToDelete).toEqual([`/dir1/file1.js`, `/dir2/file2.js`]);
    expect(i.filesToWrite).toEqual([]);
    expect(i.dirsToDelete).toEqual([`/dir1`]);
    expect(i.dirsToEnsure).toEqual([]);
    expect(items.get(`/dir1`)?.queueDeleteFromDisk).toBe(false);
    expect(items.get(`/dir1/file1.js`)?.queueDeleteFromDisk).toBe(false);
    expect(items.get(`/dir2/file2.js`)?.queueDeleteFromDisk).toBe(false);
    expect(items.get(`/dir1`)?.queueDeleteFromDisk).toBe(false);
  });

  it(`write directory to disk`, () => {
    items.set(`/dir1`, fsItem({ isDirectory: true, queueWriteToDisk: true }));
    const i = getCommitInstructions(items);
    expect(i.filesToDelete).toEqual([]);
    expect(i.filesToWrite).toEqual([]);
    expect(i.dirsToDelete).toEqual([]);
    expect(i.dirsToEnsure).toEqual([`/dir1`]);
    expect(items.get(`/dir1`)?.queueWriteToDisk).toBe(false);
  });

  it(`write file queued even if it's also queueDeleteFromDisk`, () => {
    items.set(`/dir1/file1.js`, fsItem({ queueWriteToDisk: true, queueDeleteFromDisk: true, isFile: true }));
    const i = getCommitInstructions(items);
    expect(i.filesToDelete).toEqual([]);
    expect(i.filesToWrite).toEqual([`/dir1/file1.js`]);
    expect(i.dirsToDelete).toEqual([]);
    expect(i.dirsToEnsure).toEqual([`/dir1`]);
    expect(items.get(`/dir1/file1.js`)?.queueWriteToDisk).toBe(false);
  });

  it(`write file queued`, () => {
    items.set(`/dir1/file1.js`, fsItem({ queueWriteToDisk: true, isFile: true }));
    items.set(`/dir1/file2.js`, fsItem({ queueWriteToDisk: true, isFile: true }));
    items.set(`/dir2/file3.js`, fsItem({ queueWriteToDisk: true, isFile: true }));
    const i = getCommitInstructions(items);
    expect(i.filesToDelete).toEqual([]);
    expect(i.filesToWrite).toEqual([`/dir1/file1.js`, `/dir1/file2.js`, `/dir2/file3.js`]);
    expect(i.dirsToDelete).toEqual([]);
    expect(i.dirsToEnsure).toEqual([`/dir1`, `/dir2`]);
    expect(items.get(`/dir1/file1.js`)?.queueWriteToDisk).toBe(false);
    expect(items.get(`/dir1/file2.js`)?.queueWriteToDisk).toBe(false);
    expect(items.get(`/dir2/file3.js`)?.queueWriteToDisk).toBe(false);
  });

  it(`do nothing`, () => {
    const i = getCommitInstructions(items);
    expect(i.filesToDelete).toEqual([]);
    expect(i.filesToWrite).toEqual([]);
    expect(i.dirsToDelete).toEqual([]);
    expect(i.dirsToEnsure).toEqual([]);
  });
});

describe(`in-memory-fs`, () => {
  let sys = createTestingSystem();
  let fs: InMemoryFileSystem;

  beforeEach(() => {
    sys = createTestingSystem();
    fs = createInMemoryFs(sys);
  });

  it(`access true`, async () => {
    await fs.writeFile(`/file`, `content`);
    await fs.commit();
    fs.clearCache();

    let result = await fs.access(`/file`);
    expect(result).toBe(true);
    expect(sys.diskReads).toBe(1);

    result = await fs.access(`/file`);
    expect(result).toBe(true);
    expect(sys.diskReads).toBe(1);
  });

  it(`access false`, async () => {
    let result = await fs.access(`/file`);
    await fs.commit();

    expect(result).toBe(false);
    expect(sys.diskReads).toBe(1);

    result = await fs.access(`/file`);
    expect(result).toBe(false);
    expect(sys.diskReads).toBe(1);
  });

  it(`accessSync true`, async () => {
    await fs.writeFile(`/file`, `content`);
    await fs.commit();
    fs.clearCache();

    let result = fs.accessSync(`/file`);
    expect(result).toBe(true);
    expect(sys.diskReads).toBe(1);

    result = fs.accessSync(`/file`);
    expect(result).toBe(true);
    expect(sys.diskReads).toBe(1);
  });

  it(`accessSync false`, async () => {
    let result = fs.accessSync(`/file`);
    expect(result).toBe(false);
    expect(sys.diskReads).toBe(1);

    result = fs.accessSync(`/file`);
    expect(result).toBe(false);
    expect(sys.diskReads).toBe(1);
  });

  it(`copyFile`, async () => {
    await fs.writeFile(`/src/file1.js`, `1`);
    await fs.commit();
    expect(sys.diskWrites).toBe(2);
    sys.diskWrites = 0;
    expect(sys.diskWrites).toBe(0);

    await fs.copyFile(`/src/file1.js`, `/dest/file2.js`);
    const results = await fs.commit();
    expect(sys.diskWrites).toBe(2);
    expect(results.dirsAdded).toEqual([`/dest`]);
    expect(results.dirsDeleted).toEqual([]);
    expect(results.filesWritten).toEqual([]);
    expect(results.filesCopied).toEqual([[`/src/file1.js`, `/dest/file2.js`]]);

    const file = await fs.readFile(`/dest/file2.js`);
    expect(file).toBe(`1`);
  });

  it(`readdir combines both in-memory read w/ inMemoryOnly option and disk readdir reads`, async () => {
    await fs.writeFile(`/dir/file1.js`, `1`);
    await fs.commit();
    await fs.writeFile(`/dir/file2.js`, `2`);
    // NO COMMIT!

    const files = await fs.readdir(`/dir`, { inMemoryOnly: true });
    expect(files).toHaveLength(2);
    expect(files[0].relPath).toBe('file1.js');
    expect(files[1].relPath).toBe('file2.js');
    expect(sys.diskReads).toBe(0);
  });

  it(`readdir does in-memory read w/ inMemoryOnly option, windoz`, async () => {
    await fs.writeFile(`C:\\dir1`, `?`);
    await fs.writeFile(`C:\\dir2`, `?`);
    await fs.writeFile(`C:\\dir1\\dir2\\file1.js`, `1`);
    await fs.writeFile(`C:\\dir1\\dir2\\file2.js`, `2`);
    await fs.writeFile(`C:\\dir1\\dir2\\sub1\\file3.js`, `3`);
    await fs.writeFile(`C:\\dir1\\dir2\\sub2\\file4.js`, `4`);
    await fs.writeFile(`C:\\not-dir\\dir2\\file5.js`, `5`);
    await fs.writeFile(`C:\\not-dir\\dir2\\file6.js`, `6`);
    // NO COMMIT!

    const files = await fs.readdir(`C:\\dir1\\dir2`, { inMemoryOnly: true });
    expect(files).toHaveLength(2);
    expect(files[0].absPath).toBe('C:/dir1/dir2/file1.js');
    expect(files[1].absPath).toBe('C:/dir1/dir2/file2.js');
    expect(sys.diskReads).toBe(0);
  });

  it(`readdir does in-memory read w/ inMemoryOnly option, not recursive`, async () => {
    await fs.writeFile(`/dir1`, `?`);
    await fs.writeFile(`/dir2`, `?`);
    await fs.writeFile(`/dir1/dir2/file1.js`, `1`);
    await fs.writeFile(`/dir1/dir2/file2.js`, `2`);
    await fs.writeFile(`/dir1/dir2/sub1/file3.js`, `3`);
    await fs.writeFile(`/dir1/dir2/sub2/file4.js`, `4`);
    await fs.writeFile(`/not-dir/dir2/file5.js`, `5`);
    await fs.writeFile(`/not-dir/dir2/file6.js`, `6`);
    // NO COMMIT!

    const files = await fs.readdir(`/dir1/dir2`, { inMemoryOnly: true, recursive: false });
    expect(files).toHaveLength(2);
    expect(files[0].absPath).toBe('/dir1/dir2/file1.js');
    expect(files[1].absPath).toBe('/dir1/dir2/file2.js');
    expect(sys.diskReads).toBe(0);
  });

  it(`readdir does in-memory read w/ inMemoryOnly option, recursive`, async () => {
    await fs.writeFile(`/dir1`, `?`);
    await fs.writeFile(`/dir2`, `?`);
    await fs.writeFile(`/dir1/dir2/file1.js`, `1`);
    await fs.writeFile(`/dir1/dir2/file2.js`, `2`);
    await fs.writeFile(`/dir1/dir2/sub1/file3.js`, `3`);
    await fs.writeFile(`/dir1/dir2/sub2/file4.js`, `4`);
    await fs.writeFile(`/not-dir/dir2/file5.js`, `5`);
    await fs.writeFile(`/not-dir/dir2/file6.js`, `6`);
    // NO COMMIT!

    const files = await fs.readdir(`/dir1/dir2`, { inMemoryOnly: true, recursive: true });
    expect(files).toHaveLength(4);
    expect(files[0].absPath).toBe('/dir1/dir2/file1.js');
    expect(files[1].absPath).toBe('/dir1/dir2/file2.js');
    expect(files[2].absPath).toBe('/dir1/dir2/sub1/file3.js');
    expect(files[3].absPath).toBe('/dir1/dir2/sub2/file4.js');
    expect(sys.diskReads).toBe(0);
  });

  it(`readdir does in-memory read w/ inMemoryOnly but does not throw error`, async () => {
    let threwError = false;
    try {
      await fs.readdir(`/dir`, { inMemoryOnly: true });
    } catch (e) {
      threwError = true;
    }
    expect(threwError).toBe(false);
  });

  it(`readdir always does disk reads`, async () => {
    await fs.writeFile(`/dir/file1.js`, `1`);
    await fs.commit();

    let files = await fs.readdir(`/dir`);
    expect(sys.diskReads).toBe(1);
    files = await fs.readdir(`/dir`);
    expect(files).toHaveLength(1);
    expect(sys.diskReads).toBe(2);
  });

  it(`readdir, recursive`, async () => {
    await fs.writeFile(`/dir1/file1.js`, ``);
    await fs.writeFile(`/dir1/file2.js`, ``);
    await fs.writeFile(`/dir1/dir2/file1.js`, ``);
    await fs.writeFile(`/dir1/dir2/file2.js`, ``);
    await fs.writeFile(`/dir2/dir3/file1.js`, ``);
    await fs.writeFile(`/dir2/dir3/dir4/file2.js`, ``);
    await fs.commit();
    fs.clearCache();
    sys.diskReads = 0;

    const items = await fs.readdir(`/dir1`, { recursive: true });
    expect(items).toHaveLength(5);

    expect(items[0].absPath).toBe(`/dir1/dir2`);
    expect(items[0].relPath).toBe(`dir2`);
    expect(items[0].isDirectory).toBe(true);
    expect(items[0].isFile).toBe(false);

    expect(items[1].absPath).toBe(`/dir1/dir2/file1.js`);
    expect(items[2].absPath).toBe(`/dir1/dir2/file2.js`);

    expect(items[3].absPath).toBe(`/dir1/file1.js`);
    expect(items[3].relPath).toBe(`file1.js`);
    expect(items[3].isFile).toBe(true);
    expect(items[3].isDirectory).toBe(false);

    expect(items[4].absPath).toBe(`/dir1/file2.js`);

    expect(sys.diskReads).toBe(7);
  });

  it(`readdir, no recursive`, async () => {
    await fs.writeFile(`/dir1/file1.js`, ``);
    await fs.writeFile(`/dir1/file2.js`, ``);
    await fs.writeFile(`/dir1/dir2/file1.js`, ``);
    await fs.writeFile(`/dir1/dir2/file2.js`, ``);
    await fs.writeFile(`/dir2/dir3/file1.js`, ``);
    await fs.writeFile(`/dir2/dir3/dir4/file2.js`, ``);
    await fs.commit();
    fs.clearCache();
    sys.diskReads = 0;

    const items = await fs.readdir(`/dir1`);
    expect(items).toHaveLength(3);
    expect(items[0].absPath).toBe(`/dir1/dir2`);
    expect(items[0].relPath).toBe(`dir2`);
    expect(items[0].isDirectory).toBe(true);
    expect(items[0].isFile).toBe(false);
    expect(items[1].absPath).toBe(`/dir1/file1.js`);
    expect(items[1].relPath).toBe(`file1.js`);
    expect(items[1].isFile).toBe(true);
    expect(items[1].isDirectory).toBe(false);
    expect(items[2].absPath).toBe(`/dir1/file2.js`);
    expect(sys.diskReads).toBe(4);
    sys.diskReads = 0;

    expect(await fs.access(`/dir1/file1.js`)).toBe(true);
    expect(await fs.access(`/dir1/file2.js`)).toBe(true);
    expect(await fs.access(`/dir1/dir2`)).toBe(true);
    expect(sys.diskReads).toBe(0);
    sys.diskReads = 0;

    expect(await fs.access(`/dir2/dir3/dir4/file2.js`)).toBe(true);
    expect(sys.diskReads).toBe(1);

    const statsFile = await fs.stat(`/dir1/file1.js`);
    expect(statsFile.isFile).toBe(true);

    const statsDir = await fs.stat(`/dir2`);
    expect(statsDir.isDirectory).toBe(true);
  });

  it(`readFile with diskRead and throw error for no file`, async () => {
    try {
      await fs.readFile(`/dir/file.js`);
      await fs.commit();
      expect(true).toBe(false);
    } catch (e) {
      expect(e).toBeDefined();
    }
    expect(sys.diskReads).toBe(1);
  });

  it(`readFile with diskRead`, async () => {
    await fs.writeFile(`/dir/file.js`, `content`);
    await fs.commit();
    fs.clearCache();

    let content: string = '';
    try {
      content = await fs.readFile(`/dir/file.js`);
    } catch (e) {
      expect(true).toBe(false);
    }
    await fs.commit();
    expect(sys.diskReads).toBe(1);
    expect(content).toBe(`content`);

    content = await fs.readFile(`/dir/file.js`);
    await fs.commit();
    expect(sys.diskReads).toBe(1);
    expect(content).toBe(`content`);
  });

  it(`readFile with cache read`, async () => {
    await fs.writeFile(`/dir/file.js`, `content`);
    await fs.commit();
    expect(sys.diskWrites).toBe(2);

    const content = await fs.readFile(`/dir/file.js`);
    await fs.commit();
    expect(sys.diskReads).toBe(0);
    expect(content).toBe(`content`);
  });

  it(`readFileSync with diskRead and throw error for no file`, async () => {
    try {
      fs.readFileSync(`/dir/file.js`);
      expect(true).toBe(false);
    } catch (e) {
      expect(e).toBeDefined();
    }
    expect(sys.diskReads).toBe(1);
  });

  it(`readFileSync with diskRead`, async () => {
    await fs.writeFile(`/dir/file.js`, `content`);
    await fs.commit();
    fs.clearCache();

    let content: string = '';
    try {
      content = fs.readFileSync(`/dir/file.js`);
    } catch (e) {
      expect(true).toBe(false);
    }

    expect(sys.diskReads).toBe(1);
    expect(content).toBe(`content`);

    content = fs.readFileSync(`/dir/file.js`);
    expect(sys.diskReads).toBe(1);
    expect(content).toBe(`content`);
  });

  it(`readFileSync with cache read`, async () => {
    await fs.writeFile(`/dir/file.js`, `content`);
    await fs.commit();

    expect(sys.diskWrites).toBe(2);

    const content = fs.readFileSync(`/dir/file.js`);
    expect(sys.diskReads).toBe(0);
    expect(content).toBe(`content`);
  });

  it(`removeFile`, async () => {
    await fs.writeFile(`/dir/file.js`, `content`);
    await fs.commit();

    expect(await fs.access(`/dir/file.js`)).toBe(true);
    await fs.commit();

    await fs.remove(`/dir/file.js`);
    await fs.commit();

    expect(await fs.access(`/dir/file.js`)).toBe(false);
  });

  it(`removeDir`, async () => {
    await fs.writeFile(`/dir/file.js`, `content`);
    await fs.commit();

    expect(await fs.access(`/dir/file.js`)).toBe(true);

    await fs.remove(`/dir`);
    await fs.commit();

    expect(await fs.access(`/dir/file.js`)).toBe(false);
  });

  it(`stat with disk read`, async () => {
    try {
      await fs.stat(`/dir/file.js`);
    } catch (e) {
      expect(e).toBeDefined();
    }
    expect(sys.diskReads).toBe(1);
  });

  it(`stat with cache read`, async () => {
    await fs.writeFile(`/dir/file.js`, `content`);
    await fs.stat(`/dir/file.js`);
    expect(sys.diskReads).toBe(0);
    await fs.stat(`/dir/file.js`);
    expect(sys.diskReads).toBe(0);
  });

  it(`statSync with disk read`, async () => {
    try {
      fs.statSync(`/dir/file.js`);
    } catch (e) {
      expect(e).toBeDefined();
    }
    expect(sys.diskReads).toBe(1);
  });

  it(`statSync with cache read`, async () => {
    await fs.writeFile(`/dir/file.js`, `content`);
    fs.statSync(`/dir/file.js`);
    expect(sys.diskReads).toBe(0);
    fs.statSync(`/dir/file.js`);
    expect(sys.diskReads).toBe(0);
  });

  it(`writeFile with queued disk write`, async () => {
    await fs.writeFile(`/dir/file1.js`, `content`);
    expect(sys.diskWrites).toBe(0);
    await fs.writeFile(`/dir/file2.js`, `content`);
    expect(sys.diskWrites).toBe(0);

    const content = await fs.readFile(`/dir/file2.js`);
    expect(content).toBe(`content`);
    expect(sys.diskReads).toBe(0);

    let i = await fs.commit();
    expect(sys.diskWrites).toBe(3);
    expect(i.filesWritten).toHaveLength(2);
    expect(i.filesWritten[0]).toBe(`/dir/file1.js`);
    expect(i.filesWritten[1]).toBe(`/dir/file2.js`);

    sys.diskWrites = 0;
    i = await fs.commit();
    expect(sys.diskWrites).toBe(0);
    expect(i.filesWritten).toHaveLength(0);
  });

  it(`writeFile with immediate disk write`, async () => {
    await fs.writeFile(`/dir/file1.js`, `content`, { immediateWrite: true });
    expect(sys.diskWrites).toBe(2);
    await fs.writeFile(`/dir/file2.js`, `content`);
    expect(sys.diskWrites).toBe(2);

    const content = await fs.readFile(`/dir/file2.js`);
    expect(content).toBe(`content`);
    expect(sys.diskReads).toBe(1);

    let i = await fs.commit();
    expect(sys.diskWrites).toBe(4);
    expect(i.filesWritten).toHaveLength(1);
    expect(i.filesWritten[0]).toBe(`/dir/file2.js`);

    sys.diskWrites = 1;
    i = await fs.commit();
    expect(sys.diskWrites).toBe(1);
    expect(i.filesWritten).toHaveLength(0);
  });

  it(`writeFile doesnt rewrite same content`, async () => {
    await fs.writeFile(`/dir/file1.js`, `1`);
    await fs.writeFile(`/dir/file2.js`, `2`);
    await fs.writeFile(`/dir/file2.js`, `2`);
    await fs.writeFile(`/dir/file2.js`, `2`);
    await fs.writeFile(`/dir/file2.js`, `2`);
    await fs.writeFile(`/dir/file2.js`, `2`);

    const i = await fs.commit();
    expect(sys.diskWrites).toBe(3);
    expect(i.filesWritten).toHaveLength(2);
    expect(i.filesWritten[0]).toBe(`/dir/file1.js`);
    expect(i.filesWritten[1]).toBe(`/dir/file2.js`);
  });

  it(`writeFile inMemoryOnly`, async () => {
    sys.diskWrites = 0;
    await fs.writeFile(`/dir/file1.js`, `content`, { inMemoryOnly: true });
    expect(sys.diskWrites).toBe(0);

    const content = await fs.readFile(`/dir/file1.js`);
    expect(content).toBe(`content`);
  });

  it(`clearFileCache`, async () => {
    await fs.writeFile(`/dir/file1.js`, `1`);
    await fs.commit();

    expect(fs.getItem(`/dir/file1.js`).fileText).toBe('1');
    expect(fs.getItem(`/dir/file2.js`).exists).toBe(null);
  });

  it(`clearDirCache`, async () => {
    await fs.writeFile(`/dir1/file1.js`, `1`);
    await fs.writeFile(`/dir1/file2.js`, `2`);
    await fs.writeFile(`/dir1/dir2/file3.js`, `3`);
    await fs.writeFile(`/dir3/file4.js`, `4`);
    await fs.commit();

    fs.clearDirCache(`/dir1`);

    expect(fs.getItem(`/dir1/file1.js`).exists).toBe(null);
    expect(fs.getItem(`/dir1/file2.js`).exists).toBe(null);
    expect(fs.getItem(`/dir1/dir2/file3.js`).exists).toBe(null);
    expect(fs.getItem(`/dir3/file4.js`).fileText).toBe('4');
  });

  it(`clearDirCache windows`, async () => {
    await fs.writeFile(`C:\\dir1\\file1.js`, `1`);
    await fs.writeFile(`C:\\dir1\\file2.js`, `2`);
    await fs.writeFile(`C:\\dir1\\dir2\\file3.js`, `3`);
    await fs.writeFile(`C:\\dir3\\file4.js`, `4`);
    await fs.commit();

    fs.clearDirCache(`C:\\dir1`);

    expect(fs.getItem(`C:\\dir1\\file1.js`).exists).toBe(null);
    expect(fs.getItem(`C:\\dir1\\file2.js`).exists).toBe(null);
    expect(fs.getItem(`C:\\dir1\\dir2\\file3.js`).exists).toBe(null);
    expect(fs.getItem(`C:\\dir3\\file4.js`).fileText).toBe('4');
  });

  describe('fs utils', () => {
    it('not shouldIgnore', () => {
      const filePaths = [
        '/file.ts',
        '/file.tsx',
        '/file.js',
        '/file.jsx',
        '/file.svg',
        '/file.html',
        '/file.txt',
        '/file.md',
        '/file.markdown',
        '/file.json',
        '/file.css',
        '/file.scss',
        '/file.sass',
        '/file.less',
        '/file.styl',
      ];
      filePaths.forEach((filePath) => {
        expect(shouldIgnore(filePath)).toBe(false);
      });
    });

    it('shouldIgnore', () => {
      const filePaths = ['/User/.DS_Store', '/User/.gitignore', '/User/desktop.ini', '/User/thumbs.db'];
      filePaths.forEach((filePath) => {
        expect(shouldIgnore(filePath)).toBe(true);
      });
    });
  });
});
