import { join } from '@utils';

import type * as d from '../declarations';
import { InMemoryFileSystem } from './sys/in-memory-fs';

export class Cache implements d.Cache {
  private failed = 0;
  private skip = false;
  private sys: d.CompilerSystem;
  private logger: d.Logger;
  private buildCacheDir: string;

  constructor(
    private config: d.ValidatedConfig,
    private cacheFs: InMemoryFileSystem,
  ) {
    this.sys = config.sys;
    this.logger = config.logger;
  }

  async initCacheDir() {
    if (this.config._isTesting || !this.config.cacheDir) {
      return;
    }

    this.buildCacheDir = join(this.config.cacheDir, '.build');

    if (!this.config.enableCache || !this.cacheFs) {
      this.config.logger.info(`cache optimizations disabled`);
      this.clearDiskCache();
      return;
    }

    this.config.logger.debug(`cache enabled, cacheDir: ${this.buildCacheDir}`);

    try {
      const readmeFilePath = join(this.buildCacheDir, '_README.log');
      await this.cacheFs.writeFile(readmeFilePath, CACHE_DIR_README);
    } catch (e) {
      this.logger.error(`Cache, initCacheDir: ${e}`);
      this.config.enableCache = false;
    }
  }

  async get(key: string) {
    if (!this.config.enableCache || this.skip) {
      return null;
    }

    if (this.failed >= MAX_FAILED) {
      if (!this.skip) {
        this.skip = true;
        this.logger.debug(`cache had ${this.failed} failed ops, skip disk ops for remainder of build`);
      }
      return null;
    }

    let result: string | null;
    try {
      result = await this.cacheFs.readFile(this.getCacheFilePath(key));
      this.failed = 0;
      this.skip = false;
    } catch (e: unknown) {
      this.failed++;
      result = null;
    }

    return result;
  }

  async put(key: string, value: string) {
    if (!this.config.enableCache) {
      return false;
    }

    try {
      await this.cacheFs.writeFile(this.getCacheFilePath(key), value);
      return true;
    } catch (e: unknown) {
      this.failed++;
      return false;
    }
  }

  async has(key: string) {
    const val = await this.get(key);
    return typeof val === 'string';
  }

  async createKey(domain: string, ...args: any[]) {
    if (!this.config.enableCache || !this.sys.generateContentHash) {
      return domain + Math.random() * 9999999;
    }

    const hash = await this.sys.generateContentHash(JSON.stringify(args), 32);
    return domain + '_' + hash;
  }

  async commit() {
    if (this.config.enableCache) {
      this.skip = false;
      this.failed = 0;
      await this.cacheFs.commit();
      await this.clearExpiredCache();
    }
  }

  clear() {
    if (this.cacheFs != null) {
      this.cacheFs.clearCache();
    }
  }

  async clearExpiredCache() {
    if (this.cacheFs == null || this.sys.cacheStorage == null) {
      return;
    }

    const now = Date.now();

    const lastClear = (await this.sys.cacheStorage.get(EXP_STORAGE_KEY)) as number;
    if (lastClear != null) {
      const diff = now - lastClear;
      if (diff < ONE_DAY) {
        return;
      }

      const fs = this.cacheFs.sys;
      const cachedFileNames = await fs.readDir(this.buildCacheDir);
      const cachedFilePaths = cachedFileNames.map((f) => join(this.buildCacheDir, f));

      let totalCleared = 0;

      const promises = cachedFilePaths.map(async (filePath) => {
        const stat = await fs.stat(filePath);
        const lastModified = stat.mtimeMs;

        if (lastModified && now - lastModified > ONE_WEEK) {
          await fs.removeFile(filePath);
          totalCleared++;
        }
      });

      await Promise.all(promises);

      this.logger.debug(`clearExpiredCache, cachedFileNames: ${cachedFileNames.length}, totalCleared: ${totalCleared}`);
    }

    this.logger.debug(`clearExpiredCache, set last clear`);
    await this.sys.cacheStorage.set(EXP_STORAGE_KEY, now);
  }

  async clearDiskCache() {
    if (this.cacheFs != null) {
      const hasAccess = await this.cacheFs.access(this.buildCacheDir);
      if (hasAccess) {
        await this.cacheFs.remove(this.buildCacheDir);
        await this.cacheFs.commit();
      }
    }
  }

  private getCacheFilePath(key: string): string {
    return join(this.buildCacheDir, key) + '.log';
  }

  getMemoryStats(): string | null {
    if (this.cacheFs != null) {
      return this.cacheFs.getMemoryStats();
    }
    return null;
  }
}

const MAX_FAILED = 100;
const ONE_DAY = 1000 * 60 * 60 * 24;
const ONE_WEEK = ONE_DAY * 7;
const EXP_STORAGE_KEY = `last_clear_expired_cache`;

const CACHE_DIR_README = `# Stencil Cache Directory

This directory contains files which the compiler has
cached for faster builds. To disable caching, please set
"enableCache: false" within the stencil config.

To change the cache directory, please update the
"cacheDir" property within the stencil config.
`;
