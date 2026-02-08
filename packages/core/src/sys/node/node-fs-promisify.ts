import fs from 'graceful-fs';
import { promisify } from 'util';

export const copyFile = promisify(fs.copyFile);
export const mkdir = promisify(fs.mkdir);
export const readdir = promisify(fs.readdir);
export const readFile = promisify(fs.readFile);
export const stat = promisify(fs.stat);
