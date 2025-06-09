import path from 'path';

import { createInMemoryFs, InMemoryFileSystem } from '../../compiler/sys/in-memory-fs';
import { createTestingSystem } from '../testing-sys';
import { expectFilesDoNotExist, expectFilesExist } from '../testing-utils';

describe('testing-utils', () => {
  const MOCK_FILE_PATH = path.join('mock', 'file', 'path', 'to', 'file.ts');
  const MOCK_FILE_CONTENTS = "console.log('hello world!');";

  describe('expectFilesExist', () => {
    let fs: InMemoryFileSystem;

    beforeEach(() => {
      const sys = createTestingSystem();
      fs = createInMemoryFs(sys);
    });

    it('does not throw when no file paths are provided', async () => {
      await fs.writeFile(MOCK_FILE_PATH, MOCK_FILE_CONTENTS);

      expect(() => expectFilesExist(fs, [])).not.toThrow();
    });

    it('does not throw when a provided file path is found', async () => {
      await fs.writeFile(MOCK_FILE_PATH, MOCK_FILE_CONTENTS);

      expect(() => expectFilesExist(fs, [MOCK_FILE_PATH])).not.toThrow();
    });

    it('does not throw when the provided file paths are found', async () => {
      await fs.writeFile(MOCK_FILE_PATH, MOCK_FILE_CONTENTS);

      const anotherFilePath = path.join('another', 'mock', 'file', 'path', 'to', 'some-file.ts');
      await fs.writeFile(anotherFilePath, "console.log('hello world, again!');");

      expect(() => expectFilesExist(fs, [MOCK_FILE_PATH, anotherFilePath])).not.toThrow();
    });

    it('throws an error when an expected file cannot be found', () => {
      const expectedErrorMessage = `The following files were expected, but could not be found:
-${MOCK_FILE_PATH}`;

      expect(() => expectFilesExist(fs, [MOCK_FILE_PATH])).toThrow(expectedErrorMessage);
    });

    it('throws an error when multiple files cannot be found', () => {
      const anotherFilePath = path.join('another', 'mock', 'file', 'path', 'to', 'some-file.ts');

      const expectedErrorMessage = `The following files were expected, but could not be found:
-${MOCK_FILE_PATH}
-${anotherFilePath}`;

      expect(() => expectFilesExist(fs, [MOCK_FILE_PATH, anotherFilePath])).toThrow(expectedErrorMessage);
    });
  });

  describe('expectFilesDoNotExist', () => {
    let fs: InMemoryFileSystem;

    beforeEach(() => {
      const sys = createTestingSystem();
      fs = createInMemoryFs(sys);
    });

    it('does not throw when no file paths are provided', async () => {
      await fs.writeFile(MOCK_FILE_PATH, MOCK_FILE_CONTENTS);

      expect(() => expectFilesDoNotExist(fs, [])).not.toThrow();
    });

    it('does not throw when a provided file path is not found on the file system', () => {
      expect(() => expectFilesDoNotExist(fs, [MOCK_FILE_PATH])).not.toThrow();
    });

    it('does not throw when the provided file paths are not found on the file system', () => {
      expect(() => expectFilesDoNotExist(fs, [MOCK_FILE_PATH, 'mock/file/path/to/nowhere.ts'])).not.toThrow();
    });

    it('throws an error when a file is found on the file system', async () => {
      await fs.writeFile(MOCK_FILE_PATH, MOCK_FILE_CONTENTS);

      const expectedErrorMessage = `The following files were expected to not exist, but do:
-${MOCK_FILE_PATH}`;

      expect(() => expectFilesDoNotExist(fs, [MOCK_FILE_PATH])).toThrow(expectedErrorMessage);
    });

    it('throws an error when multiple files are found on the file system', async () => {
      await fs.writeFile(MOCK_FILE_PATH, MOCK_FILE_CONTENTS);
      const anotherFilePath = path.join('another', 'mock', 'file', 'path', 'to', 'some-file.ts');
      await fs.writeFile(anotherFilePath, MOCK_FILE_CONTENTS);

      const expectedErrorMessage = `The following files were expected to not exist, but do:
-${MOCK_FILE_PATH}
-${anotherFilePath}`;

      expect(() => expectFilesDoNotExist(fs, [MOCK_FILE_PATH, anotherFilePath])).toThrow(expectedErrorMessage);
    });

    it('throws an error only for file paths provided as an argument', async () => {
      await fs.writeFile(MOCK_FILE_PATH, MOCK_FILE_CONTENTS);

      // write this file to the filesystem, but don't check for it
      const anotherFilePath = path.join('another', 'mock', 'file', 'path', 'to', 'some-file.ts');
      await fs.writeFile(anotherFilePath, MOCK_FILE_CONTENTS);

      const expectedErrorMessage = `The following files were expected to not exist, but do:
-${MOCK_FILE_PATH}`;

      expect(() => expectFilesDoNotExist(fs, [MOCK_FILE_PATH])).toThrow(expectedErrorMessage);
    });
  });
});
