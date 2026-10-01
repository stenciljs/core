import { basename } from 'path';
import type * as d from '@stencil/core';

import { join } from '../utils';
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
        this.logger.debug(
          `cache had ${this.failed} failed ops, skip disk ops for remainder of build`,
        );
      }
      return null;
    }

    let result: string | null;
    try {
      result = await this.cacheFs.readFile(this.getCacheFilePath(key));
      this.failed = 0;
      this.skip = false;
    } catch {
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
    } catch {
      this.failed++;
      return false;
    }
  }

  async has(key: string) {
    const val = await this.get(key);
    return typeof val === 'string';
  }

  async createKey(domain: string, ...args: any[]) {
    if (!this.config.enableCache) {
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
      await this.pruneExpired();
    }
  }

  /**
   * Remove cache files last written over a week ago. Runs at most once a day,
   * throttled by the mtime of a marker file in the cache dir.
   */
  private async pruneExpired() {
    if (!this.buildCacheDir) {
      return;
    }

    const now = Date.now();
    const markerPath = join(this.buildCacheDir, PRUNE_MARKER);
    const marker = await this.sys.stat(markerPath);
    if (marker.isFile && marker.mtimeMs && now - marker.mtimeMs < ONE_DAY) {
      return;
    }

    const filePaths = await this.sys.readDir(this.buildCacheDir);
    let removed = 0;
    await Promise.all(
      filePaths.map(async (filePath) => {
        if (basename(filePath).startsWith('_')) {
          return;
        }
        const { isFile, mtimeMs } = await this.sys.stat(filePath);
        if (isFile && mtimeMs && now - mtimeMs > ONE_WEEK) {
          await this.sys.removeFile(filePath);
          this.cacheFs.clearFileCache(filePath);
          removed++;
        }
      }),
    );

    this.logger.debug(`cache prune: removed ${removed} of ${filePaths.length} files`);
    await this.sys.writeFile(markerPath, '');
  }

  clear() {
    if (this.cacheFs != null) {
      this.cacheFs.clearCache();
    }
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
const PRUNE_MARKER = '_last_prune.log';

const CACHE_DIR_README = `# Stencil Cache Directory

This directory contains files which the compiler has
cached for faster builds. To disable caching, please set
"enableCache: false" within the stencil config.

To change the cache directory, please update the
"cacheDir" property within the stencil config.
`;
