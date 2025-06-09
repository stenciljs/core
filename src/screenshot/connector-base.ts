import type * as d from '@stencil/core/internal';
import { tmpdir } from 'os';
import { join } from 'path';

import { emptyDir, fileExists, mkDir, readDir, readFile, readFileBuffer, rmDir, writeFile } from './screenshot-fs';

export class ScreenshotConnector implements d.ScreenshotConnector {
  rootDir: string;
  cacheDir: string;
  packageDir: string;
  screenshotDirName = 'screenshot';
  imagesDirName = 'images';
  buildsDirName = 'builds';
  masterBuildFileName = 'master.json';
  screenshotCacheFileName = 'screenshot-cache.json';
  logger: d.Logger;
  buildId: string;
  buildMessage: string;
  buildAuthor: string | undefined;
  buildUrl: string | undefined;
  previewUrl: string | undefined;
  buildTimestamp: number;
  appNamespace: string;
  screenshotDir: string;
  imagesDir: string;
  buildsDir: string;
  masterBuildFilePath: string;
  screenshotCacheFilePath: string;
  currentBuildDir: string;
  updateMaster: boolean;
  allowableMismatchedRatio: number | undefined;
  allowableMismatchedPixels: number | undefined;
  pixelmatchThreshold: number | undefined;
  waitBeforeScreenshot: number | undefined;
  pixelmatchModulePath: string | undefined;

  async initBuild(opts: d.ScreenshotConnectorOptions) {
    this.logger = opts.logger;

    this.buildId = opts.buildId;
    this.buildMessage = opts.buildMessage || '';
    this.buildAuthor = opts.buildAuthor;
    this.buildUrl = opts.buildUrl;
    this.previewUrl = opts.previewUrl;
    this.buildTimestamp = typeof opts.buildTimestamp === 'number' ? opts.buildTimestamp : Date.now();
    this.cacheDir = opts.cacheDir;
    this.packageDir = opts.packageDir;
    this.rootDir = opts.rootDir;
    this.appNamespace = opts.appNamespace;
    this.waitBeforeScreenshot = opts.waitBeforeScreenshot;
    this.pixelmatchModulePath = opts.pixelmatchModulePath;

    if (!opts.logger) {
      throw new Error(`logger option required`);
    }

    if (typeof opts.buildId !== 'string') {
      throw new Error(`buildId option required`);
    }

    if (typeof opts.cacheDir !== 'string') {
      throw new Error(`cacheDir option required`);
    }

    if (typeof opts.packageDir !== 'string') {
      throw new Error(`packageDir option required`);
    }

    if (typeof opts.rootDir !== 'string') {
      throw new Error(`rootDir option required`);
    }

    this.updateMaster = !!opts.updateMaster;
    this.allowableMismatchedPixels = opts.allowableMismatchedPixels;
    this.allowableMismatchedRatio = opts.allowableMismatchedRatio;
    this.pixelmatchThreshold = opts.pixelmatchThreshold;

    this.logger.debug(`screenshot build: ${this.buildId}, ${this.buildMessage}, updateMaster: ${this.updateMaster}`);
    this.logger.debug(
      `screenshot, allowableMismatchedPixels: ${this.allowableMismatchedPixels}, allowableMismatchedRatio: ${this.allowableMismatchedRatio}, pixelmatchThreshold: ${this.pixelmatchThreshold}`,
    );

    if (typeof opts.screenshotDirName === 'string') {
      this.screenshotDirName = opts.screenshotDirName;
    }

    if (typeof opts.imagesDirName === 'string') {
      this.imagesDirName = opts.imagesDirName;
    }

    if (typeof opts.buildsDirName === 'string') {
      this.buildsDirName = opts.buildsDirName;
    }

    this.screenshotDir = join(this.rootDir, this.screenshotDirName);
    this.imagesDir = join(this.screenshotDir, this.imagesDirName);
    this.buildsDir = join(this.screenshotDir, this.buildsDirName);
    this.masterBuildFilePath = join(this.buildsDir, this.masterBuildFileName);
    this.screenshotCacheFilePath = join(this.cacheDir, this.screenshotCacheFileName);
    this.currentBuildDir = join(tmpdir(), 'screenshot-build-' + this.buildId);

    this.logger.debug(`screenshotDirPath: ${this.screenshotDir}`);
    this.logger.debug(`imagesDirPath: ${this.imagesDir}`);
    this.logger.debug(`buildsDirPath: ${this.buildsDir}`);
    this.logger.debug(`currentBuildDir: ${this.currentBuildDir}`);
    this.logger.debug(`cacheDir: ${this.cacheDir}`);

    await mkDir(this.screenshotDir);

    await Promise.all([
      mkDir(this.imagesDir),
      mkDir(this.buildsDir),
      mkDir(this.currentBuildDir),
      mkDir(this.cacheDir),
    ]);
  }

  async pullMasterBuild() {
    /**/
  }

  async getMasterBuild() {
    try {
      const masterBuild = JSON.parse(await readFile(this.masterBuildFilePath));
      return masterBuild;
    } catch (e) {}

    return null;
  }

  async completeBuild(masterBuild: d.ScreenshotBuild) {
    const filePaths = (await readDir(this.currentBuildDir))
      .map((f) => join(this.currentBuildDir, f))
      .filter((f) => f.endsWith('.json'));
    const screenshots = await Promise.all(filePaths.map(async (f) => JSON.parse(await readFile(f)) as d.Screenshot));

    this.sortScreenshots(screenshots);

    if (!masterBuild) {
      masterBuild = {
        id: this.buildId,
        message: this.buildMessage,
        author: this.buildAuthor,
        url: this.buildUrl,
        previewUrl: this.previewUrl,
        appNamespace: this.appNamespace,
        timestamp: this.buildTimestamp,
        screenshots: screenshots,
      };
    }

    const results: d.ScreenshotBuildResults = {
      appNamespace: this.appNamespace,
      masterBuild: masterBuild,
      currentBuild: {
        id: this.buildId,
        message: this.buildMessage,
        author: this.buildAuthor,
        url: this.buildUrl,
        previewUrl: this.previewUrl,
        appNamespace: this.appNamespace,
        timestamp: this.buildTimestamp,
        screenshots: screenshots,
      },
      compare: {
        id: `${masterBuild.id}-${this.buildId}`,
        a: {
          id: masterBuild.id,
          message: masterBuild.message,
          author: masterBuild.author,
          url: masterBuild.url,
          previewUrl: masterBuild.previewUrl,
        },
        b: {
          id: this.buildId,
          message: this.buildMessage,
          author: this.buildAuthor,
          url: this.buildUrl,
          previewUrl: this.previewUrl,
        },
        url: null,
        appNamespace: this.appNamespace,
        timestamp: this.buildTimestamp,
        diffs: [],
      },
    };

    results.currentBuild.screenshots.forEach((screenshot) => {
      screenshot.diff.device = screenshot.diff.device || screenshot.diff.userAgent;
      results.compare.diffs.push(screenshot.diff);
      delete screenshot.diff;
    });

    this.sortCompares(results.compare.diffs);

    await emptyDir(this.currentBuildDir);
    await rmDir(this.currentBuildDir);

    return results;
  }

  async publishBuild(results: d.ScreenshotBuildResults) {
    return results;
  }

  async generateJsonpDataUris(build: d.ScreenshotBuild) {
    if (build && Array.isArray(build.screenshots)) {
      for (let i = 0; i < build.screenshots.length; i++) {
        const screenshot = build.screenshots[i];

        const jsonpFileName = `screenshot_${screenshot.image}.js`;
        const jsonFilePath = join(this.cacheDir, jsonpFileName);
        const jsonpExists = await fileExists(jsonFilePath);

        if (!jsonpExists) {
          const imageFilePath = join(this.imagesDir, screenshot.image);
          const imageBuf = await readFileBuffer(imageFilePath);
          const jsonpContent = `loadScreenshot("${screenshot.image}","data:image/png;base64,${imageBuf.toString(
            'base64',
          )}");`;
          await writeFile(jsonFilePath, jsonpContent);
        }
      }
    }
  }

  async getScreenshotCache() {
    return null as d.ScreenshotCache;
  }

  async updateScreenshotCache(screenshotCache: d.ScreenshotCache, buildResults: d.ScreenshotBuildResults) {
    screenshotCache = screenshotCache || {};
    screenshotCache.timestamp = this.buildTimestamp;
    screenshotCache.lastBuildId = this.buildId;
    screenshotCache.size = 0;
    screenshotCache.items = screenshotCache.items || [];

    if (buildResults && buildResults.compare && Array.isArray(buildResults.compare.diffs)) {
      buildResults.compare.diffs.forEach((diff) => {
        if (typeof diff.cacheKey !== 'string') {
          return;
        }

        if (diff.imageA === diff.imageB) {
          // no need to cache identical matches
          return;
        }

        const existingItem = screenshotCache.items.find((i) => i.key === diff.cacheKey);
        if (existingItem) {
          // already have this cached, but update its timestamp
          existingItem.ts = this.buildTimestamp;
        } else {
          // add this item to the cache
          screenshotCache.items.push({
            key: diff.cacheKey,
            ts: this.buildTimestamp,
            mp: diff.mismatchedPixels,
          });
        }
      });
    }

    // sort so the newest items are on top
    screenshotCache.items.sort((a, b) => {
      if (a.ts > b.ts) return -1;
      if (a.ts < b.ts) return 1;
      if (a.mp > b.mp) return -1;
      if (a.mp < b.mp) return 1;
      return 0;
    });

    // keep only the most recent items
    screenshotCache.items = screenshotCache.items.slice(0, 1000);

    screenshotCache.size = screenshotCache.items.length;

    return screenshotCache;
  }

  toJson(masterBuild: d.ScreenshotBuild, screenshotCache: d.ScreenshotCache) {
    const masterScreenshots: { [screenshotId: string]: string } = {};
    if (masterBuild && Array.isArray(masterBuild.screenshots)) {
      masterBuild.screenshots.forEach((masterScreenshot) => {
        masterScreenshots[masterScreenshot.id] = masterScreenshot.image;
      });
    }

    const mismatchCache: { [cacheKey: string]: number } = {};
    if (screenshotCache && Array.isArray(screenshotCache.items)) {
      screenshotCache.items.forEach((cacheItem) => {
        mismatchCache[cacheItem.key] = cacheItem.mp;
      });
    }

    const screenshotBuild: d.ScreenshotBuildData = {
      buildId: this.buildId,
      rootDir: this.rootDir,
      screenshotDir: this.screenshotDir,
      imagesDir: this.imagesDir,
      buildsDir: this.buildsDir,
      masterScreenshots: masterScreenshots,
      cache: mismatchCache,
      currentBuildDir: this.currentBuildDir,
      updateMaster: this.updateMaster,
      allowableMismatchedPixels: this.allowableMismatchedPixels,
      allowableMismatchedRatio: this.allowableMismatchedRatio,
      pixelmatchThreshold: this.pixelmatchThreshold,
      timeoutBeforeScreenshot: this.waitBeforeScreenshot,
      pixelmatchModulePath: this.pixelmatchModulePath,
    };

    return JSON.stringify(screenshotBuild);
  }

  sortScreenshots(screenshots: d.Screenshot[]) {
    return screenshots.sort((a, b) => {
      if (a.desc && b.desc) {
        if (a.desc.toLowerCase() < b.desc.toLowerCase()) return -1;
        if (a.desc.toLowerCase() > b.desc.toLowerCase()) return 1;
      }

      if (a.device && b.device) {
        if (a.device.toLowerCase() < b.device.toLowerCase()) return -1;
        if (a.device.toLowerCase() > b.device.toLowerCase()) return 1;
      }

      if (a.userAgent && b.userAgent) {
        if (a.userAgent.toLowerCase() < b.userAgent.toLowerCase()) return -1;
        if (a.userAgent.toLowerCase() > b.userAgent.toLowerCase()) return 1;
      }

      if (a.width < b.width) return -1;
      if (a.width > b.width) return 1;

      if (a.height < b.height) return -1;
      if (a.height > b.height) return 1;

      if (a.id < b.id) return -1;
      if (a.id > b.id) return 1;

      return 0;
    });
  }

  sortCompares(compares: d.ScreenshotDiff[]) {
    return compares.sort((a, b) => {
      if (a.allowableMismatchedPixels > b.allowableMismatchedPixels) return -1;
      if (a.allowableMismatchedPixels < b.allowableMismatchedPixels) return 1;

      if (a.allowableMismatchedRatio > b.allowableMismatchedRatio) return -1;
      if (a.allowableMismatchedRatio < b.allowableMismatchedRatio) return 1;

      if (a.desc && b.desc) {
        if (a.desc.toLowerCase() < b.desc.toLowerCase()) return -1;
        if (a.desc.toLowerCase() > b.desc.toLowerCase()) return 1;
      }

      if (a.device && b.device) {
        if (a.device.toLowerCase() < b.device.toLowerCase()) return -1;
        if (a.device.toLowerCase() > b.device.toLowerCase()) return 1;
      }

      if (a.userAgent && b.userAgent) {
        if (a.userAgent.toLowerCase() < b.userAgent.toLowerCase()) return -1;
        if (a.userAgent.toLowerCase() > b.userAgent.toLowerCase()) return 1;
      }

      if (a.width < b.width) return -1;
      if (a.width > b.width) return 1;

      if (a.height < b.height) return -1;
      if (a.height > b.height) return 1;

      if (a.id < b.id) return -1;
      if (a.id > b.id) return 1;

      return 0;
    });
  }
}
