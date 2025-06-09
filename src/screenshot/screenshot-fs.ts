import type * as d from '@stencil/core/internal';
import fs from 'fs';
import path from 'path';

export async function writeScreenshotImage(imagePath: string, screenshotBuf: Buffer) {
  const imageExists = await fileExists(imagePath);
  if (!imageExists) {
    await writeFile(imagePath, screenshotBuf);
  }
}

export async function writeScreenshotData(dataDir: string, screenshotData: d.Screenshot) {
  const filePath = getDataFilePath(dataDir, screenshotData.id);
  const content = JSON.stringify(screenshotData, null, 2);
  await writeFile(filePath, content);
}

export async function readScreenshotData(dataDir: string, screenshotId: string) {
  let rtn: d.Screenshot | null = null;

  try {
    const dataFilePath = getDataFilePath(dataDir, screenshotId);
    const dataContent = await readFile(dataFilePath);
    rtn = JSON.parse(dataContent);
  } catch (e) {}

  return rtn;
}

function getDataFilePath(dataDir: string, screenshotId: string) {
  const fileName = `${screenshotId}.json`;
  return path.join(dataDir, fileName);
}

export function fileExists(filePath: string) {
  return new Promise<boolean>((resolve) => {
    fs.access(filePath, (err: any) => resolve(!err));
  });
}

export function readFile(filePath: string) {
  return new Promise<string>((resolve, reject) => {
    fs.readFile(filePath, 'utf-8', (err: any, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

export function readFileBuffer(filePath: string) {
  return new Promise<Buffer>((resolve, reject) => {
    fs.readFile(filePath, (err: any, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

export function writeFile(filePath: string, data: any) {
  return new Promise<void>((resolve, reject) => {
    fs.writeFile(filePath, data, (err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export function mkDir(filePath: string) {
  return new Promise<void>((resolve) => {
    fs.mkdir(filePath, () => {
      resolve();
    });
  });
}

export function rmDir(filePath: string) {
  return new Promise<void>((resolve) => {
    fs.rmdir(filePath, () => {
      resolve();
    });
  });
}

export async function emptyDir(dir: string) {
  const files = await readDir(dir);

  const promises = files.map(async (fileName) => {
    const filePath = path.join(dir, fileName);
    const isDirFile = await isFile(filePath);
    if (isDirFile) {
      await unlink(filePath);
    }
  });

  await Promise.all(promises);
}

export async function readDir(dir: string) {
  return new Promise<string[]>((resolve) => {
    fs.readdir(dir, (err, files) => {
      if (err) {
        resolve([]);
      } else {
        resolve(files);
      }
    });
  });
}

export async function isFile(itemPath: string) {
  return new Promise<boolean>((resolve) => {
    fs.stat(itemPath, (err, stat) => {
      if (err) {
        resolve(false);
      } else {
        resolve(stat.isFile());
      }
    });
  });
}

export async function unlink(filePath: string) {
  return new Promise<void>((resolve) => {
    fs.unlink(filePath, () => {
      resolve();
    });
  });
}
