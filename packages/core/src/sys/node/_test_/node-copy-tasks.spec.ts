import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type * as d from '@stencil/core';

import { nodeCopyTasks } from '../node-copy-tasks';

const IGNORE = ['**/__mocks__/**', '**/dist/**', '**/.ds_store', '**/.gitignore', '**/*.psd'];

describe('nodeCopyTasks', () => {
  let root: string;
  let srcDir: string;
  let outDir: string;

  const write = (...files: string[]) => {
    for (const file of files) {
      const abs = path.join(root, file);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, file);
    }
  };

  const listOut = () =>
    fs
      .readdirSync(outDir, { recursive: true, withFileTypes: true })
      .filter((e) => e.isFile())
      .map((e) => path.relative(outDir, path.join(e.parentPath, e.name)).split(path.sep).join('/'))
      .sort();

  const copy = (task: Partial<d.CopyTask> & { src: string }) =>
    nodeCopyTasks(
      [{ dest: outDir, ignore: IGNORE, warn: true, keepDirStructure: false, ...task }],
      srcDir,
    );

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'stencil-copy-'));
    srcDir = path.join(root, 'src');
    outDir = path.join(root, 'www');
    write(
      'src/assets/icons/a.svg',
      'src/assets/.gitignore',
      'src/assets/icons/.DS_Store',
      'src/assets/__mocks__/m.json',
      'src/assets/vendor/dist/v.js',
      'src/assets/big.psd',
      'node_modules/lib/dist/icons/x.svg',
      'node_modules/lib/dist/lib.css',
    );
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('applies ignore patterns inside a directory copy', async () => {
    const results = await copy({ src: 'assets' });
    expect(results.diagnostics).toEqual([]);
    expect(listOut()).toEqual(['icons/a.svg']);
  });

  it('matches ignore patterns relative to the copied directory', async () => {
    await copy({ src: 'assets/vendor/dist' });
    expect(listOut()).toEqual(['v.js']);
  });

  it('copies an explicitly named file even if it matches an ignore pattern', async () => {
    await copy({ src: 'assets/.gitignore', dest: path.join(outDir, '.gitignore') });
    expect(listOut()).toEqual(['.gitignore']);
  });

  it('applies ignore patterns to a glob copy', async () => {
    await copy({ src: 'assets/**/*', keepDirStructure: true });
    expect(listOut()).toEqual(['assets/icons/a.svg']);
  });

  it('copies everything in a directory with no ignore patterns', async () => {
    await copy({ src: 'assets', ignore: [] });
    expect(listOut()).toEqual([
      '.gitignore',
      '__mocks__/m.json',
      'big.psd',
      'icons/.DS_Store',
      'icons/a.svg',
      'vendor/dist/v.js',
    ]);
  });

  describe('copies from outside srcDir', () => {
    it.each([
      ['a glob', '../node_modules/lib/dist/**/*'],
      ['a directory', '../node_modules/lib/dist'],
    ])('errors instead of writing outside dest when keeping %s structure', async (_, src) => {
      const results = await copy({ src, keepDirStructure: true });
      expect(results.diagnostics).toHaveLength(1);
      expect(results.diagnostics[0].messageText).toContain(`"${src}" would write outside`);
      expect(fs.existsSync(outDir) ? listOut() : []).toEqual([]);
    });

    it('copies a directory into dest without keepDirStructure', async () => {
      const results = await copy({ src: '../node_modules/lib/dist' });
      expect(results.diagnostics).toEqual([]);
      expect(listOut()).toEqual(['icons/x.svg', 'lib.css']);
    });
  });
});
