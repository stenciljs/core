import { promisify } from 'util';
import fs from 'graceful-fs';

export const copyFile = promisify(fs.copyFile);
export const mkdir = promisify(fs.mkdir);
export const readdir = promisify(fs.readdir);
export const stat = promisify(fs.stat);
