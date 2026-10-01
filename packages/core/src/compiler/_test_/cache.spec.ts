import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createNodeSys } from '../../sys/node';
import { mockValidatedConfig } from '../../testing';
import { Cache } from '../cache';
import { createInMemoryFs } from '../sys/in-memory-fs';

const DAY = 1000 * 60 * 60 * 24;

describe('Cache', () => {
  let tmpDir: string;
  let buildCacheDir: string;

  const setMtime = (filePath: string, ageMs: number) => {
    const t = new Date(Date.now() - ageMs);
    fs.utimesSync(filePath, t, t);
  };

  const writeCacheFile = (name: string, ageMs: number) => {
    const filePath = path.join(buildCacheDir, name);
    fs.writeFileSync(filePath, 'cached');
    setMtime(filePath, ageMs);
    return filePath;
  };

  const createCache = async () => {
    const sys = createNodeSys();
    const config = mockValidatedConfig({
      sys,
      cacheDir: tmpDir,
      enableCache: true,
      _isTesting: false,
    });
    const cache = new Cache(config, createInMemoryFs(sys));
    await cache.initCacheDir();
    return cache;
  };

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stencil-cache-test-'));
    buildCacheDir = path.join(tmpDir, '.build');
    fs.mkdirSync(buildCacheDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('commit', () => {
    it('removes files older than a week and keeps newer ones', async () => {
      const stale = writeCacheFile('stale.log', 8 * DAY);
      const fresh = writeCacheFile('fresh.log', 1 * DAY);

      const cache = await createCache();
      await cache.commit();

      expect(fs.existsSync(stale)).toBe(false);
      expect(fs.existsSync(fresh)).toBe(true);
      expect(fs.existsSync(path.join(buildCacheDir, '_README.log'))).toBe(true);
      expect(fs.existsSync(path.join(buildCacheDir, '_last_prune.log'))).toBe(true);
    });

    it('does not prune again within a day of the last prune', async () => {
      const cache = await createCache();
      await cache.commit();

      const stale = writeCacheFile('stale.log', 8 * DAY);
      await cache.commit();

      expect(fs.existsSync(stale)).toBe(true);
    });

    it('prunes again once the last prune is over a day old', async () => {
      const cache = await createCache();
      await cache.commit();
      setMtime(path.join(buildCacheDir, '_last_prune.log'), 2 * DAY);

      const stale = writeCacheFile('stale.log', 8 * DAY);
      await cache.commit();

      expect(fs.existsSync(stale)).toBe(false);
    });

    it('never removes underscore-prefixed files', async () => {
      const readme = writeCacheFile('_README.log', 30 * DAY);

      const cache = await createCache();
      // initCacheDir rewrites the readme; age it again before committing
      setMtime(readme, 30 * DAY);
      await cache.commit();

      expect(fs.existsSync(readme)).toBe(true);
    });
  });
});
