import type * as d from '@stencil/core/internal';
import { normalizePath } from '@utils';
import { join, relative } from 'path';

import { ScreenshotConnector } from './connector-base';
import { fileExists, readFile, writeFile } from './screenshot-fs';

export class ScreenshotLocalConnector extends ScreenshotConnector {
  override async publishBuild(results: d.ScreenshotBuildResults) {
    if (this.updateMaster || !results.masterBuild) {
      results.masterBuild = {
        id: 'master',
        message: 'Master',
        appNamespace: this.appNamespace,
        timestamp: Date.now(),
        screenshots: [],
      };
    }

    results.currentBuild.screenshots.forEach((currentScreenshot) => {
      const masterHasScreenshot = results.masterBuild.screenshots.some((masterScreenshot) => {
        return currentScreenshot.id === masterScreenshot.id;
      });

      if (!masterHasScreenshot) {
        results.masterBuild.screenshots.push(Object.assign({}, currentScreenshot));
      }
    });

    this.sortScreenshots(results.masterBuild.screenshots);

    await writeFile(this.masterBuildFilePath, JSON.stringify(results.masterBuild, null, 2));

    await this.generateJsonpDataUris(results.currentBuild);

    const compareAppSourceDir = join(this.packageDir, 'screenshot', 'compare');
    const appSrcUrl = normalizePath(relative(this.screenshotDir, compareAppSourceDir));
    const imagesUrl = normalizePath(relative(this.screenshotDir, this.imagesDir));
    const jsonpUrl = normalizePath(relative(this.screenshotDir, this.cacheDir));

    const compareAppHtml = createLocalCompareApp(
      this.appNamespace,
      appSrcUrl,
      imagesUrl,
      jsonpUrl,
      results.masterBuild,
      results.currentBuild,
    );

    const compareAppFileName = 'compare.html';
    const compareAppFilePath = join(this.screenshotDir, compareAppFileName);
    await writeFile(compareAppFilePath, compareAppHtml);

    const gitIgnorePath = join(this.screenshotDir, '.gitignore');
    const gitIgnoreExists = await fileExists(gitIgnorePath);
    if (!gitIgnoreExists) {
      const content = [this.imagesDirName, this.buildsDirName, compareAppFileName];
      await writeFile(gitIgnorePath, content.join('\n'));
    }

    const url = new URL(`file://${compareAppFilePath}`);

    results.compare.url = url.href;

    return results;
  }

  override async getScreenshotCache() {
    let screenshotCache: d.ScreenshotCache = null;

    try {
      screenshotCache = JSON.parse(await readFile(this.screenshotCacheFilePath));
    } catch (e) {}

    return screenshotCache;
  }

  override async updateScreenshotCache(cache: d.ScreenshotCache, buildResults: d.ScreenshotBuildResults) {
    cache = await super.updateScreenshotCache(cache, buildResults);

    await writeFile(this.screenshotCacheFilePath, JSON.stringify(cache, null, 2));

    return cache;
  }
}

function createLocalCompareApp(
  namespace: string,
  appSrcUrl: string,
  imagesUrl: string,
  jsonpUrl: string,
  a: d.ScreenshotBuild,
  b: d.ScreenshotBuild,
) {
  return `<!doctype html>
<html dir="ltr" lang="en">
<head>
  <meta charset="utf-8">
  <title>Local ${namespace || ''} - Stencil Screenshot Visual Diff</title>
  <meta name="viewport" content="viewport-fit=cover, width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta http-equiv="x-ua-compatible" content="IE=Edge">
  <link href="${appSrcUrl}/build/app.css" rel="stylesheet">
  <script type="module" src="${appSrcUrl}/build/app.esm.js"></script>
  <script nomodule src="${appSrcUrl}/build/app.js"></script>
  <link rel="icon" type="image/x-icon" href="${appSrcUrl}/assets/favicon.ico">
</head>
<body>
  <script>
    (function() {
      var app = document.createElement('screenshot-compare');
      app.appSrcUrl = '${appSrcUrl}';
      app.imagesUrl = '${imagesUrl}/';
      app.jsonpUrl = '${jsonpUrl}/';
      app.a = ${JSON.stringify(a)};
      app.b = ${JSON.stringify(b)};
      document.body.appendChild(app);
    })();
  </script>
</body>
</html>`;
}
