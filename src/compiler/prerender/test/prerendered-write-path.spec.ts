import { mockValidatedConfig } from '@stencil/core/testing';
import { join, resolve } from '@utils';

import type * as d from '../../../declarations';
import { validateWww } from '../../config/outputs/validate-www';
import { getWriteFilePathFromUrlPath } from '../prerendered-write-path';

describe('prerender-utils', () => {
  const rootDir = resolve('/');

  describe('getWriteFilePathFromUrlPath', () => {
    let manager: d.PrerenderManager;
    let config: d.ValidatedConfig;

    beforeEach(() => {
      config = mockValidatedConfig();
      const outputTargets = validateWww(config, [], []);

      manager = {
        config: config,
        outputTarget: outputTargets[0] as any,
        devServerHostUrl: 'http://localhost:3333/',
        diagnostics: [],
        hydrateAppFilePath: null,
        isDebug: true,
        logCount: 0,
        maxConcurrency: 1,
        prerenderUrlWorker: null,
        prerenderConfig: null,
        prerenderConfigPath: null,
        urlsCompleted: null,
        urlsPending: null,
        urlsProcessing: null,
        resolve: null,
        templateId: null,
        componentGraphPath: null,
        staticSite: false,
      };
    });

    it('/subdir, custom indexHtml', () => {
      const inputUrl = 'http://stenciljs.com/subdir';
      manager.outputTarget.baseUrl = 'http://stenciljs.com/';
      manager.outputTarget.indexHtml = 'my-index.htm';
      const filePath = getWriteFilePathFromUrlPath(manager, inputUrl);
      expect(filePath).toBe(join(rootDir, 'www', 'subdir', 'index.html'));
    });

    it('/docs/my-index.htm, custom indexHtml', () => {
      const inputUrl = 'http://stenciljs.com/docs/my-index.htm';
      manager.outputTarget.baseUrl = 'http://stenciljs.com/docs/';
      manager.outputTarget.indexHtml = 'my-index.htm';
      const filePath = getWriteFilePathFromUrlPath(manager, inputUrl);
      expect(filePath).toBe(join(rootDir, 'www', 'my-index.htm'));
    });

    it('/docs/index.html', () => {
      const inputUrl = 'http://stenciljs.com/docs/index.html';
      manager.outputTarget.baseUrl = 'http://stenciljs.com/docs/';
      const filePath = getWriteFilePathFromUrlPath(manager, inputUrl);
      expect(filePath).toBe(join(rootDir, 'www', 'index.html'));
    });

    it('/docs/', () => {
      const inputUrl = 'http://stenciljs.com/docs/';
      manager.outputTarget.baseUrl = 'http://stenciljs.com/docs/';
      const filePath = getWriteFilePathFromUrlPath(manager, inputUrl);
      expect(filePath).toBe(join(rootDir, 'www', 'index.html'));
    });

    it('/docs', () => {
      const inputUrl = 'http://stenciljs.com/docs';
      manager.outputTarget.baseUrl = 'http://stenciljs.com/docs';
      const filePath = getWriteFilePathFromUrlPath(manager, inputUrl);
      expect(filePath).toBe(join(rootDir, 'www', 'index.html'));
    });

    it('custom indexHtml', () => {
      const inputUrl = 'http://stenciljs.com/';
      manager.outputTarget.baseUrl = 'http://stenciljs.com/';
      manager.outputTarget.indexHtml = 'my-index.htm';
      const filePath = getWriteFilePathFromUrlPath(manager, inputUrl);
      expect(filePath).toBe(join(rootDir, '/www/my-index.htm'));
    });

    it('/index.html', () => {
      const inputUrl = 'http://stenciljs.com/index.html';
      manager.outputTarget.baseUrl = 'http://stenciljs.com/';
      const filePath = getWriteFilePathFromUrlPath(manager, inputUrl);
      expect(filePath).toBe(join(rootDir, 'www', 'index.html'));
    });

    it('default root, full input path, full path baseUrl', () => {
      const inputUrl = 'http://stenciljs.com/';
      manager.outputTarget.baseUrl = 'http://stenciljs.com/';
      const filePath = getWriteFilePathFromUrlPath(manager, inputUrl);
      expect(filePath).toBe(join(rootDir, 'www', 'index.html'));
    });

    it('default root, full input path', () => {
      const inputUrl = 'http://stenciljs.com/';
      manager.outputTarget.baseUrl = '/';
      const filePath = getWriteFilePathFromUrlPath(manager, inputUrl);
      expect(filePath).toBe(join(rootDir, 'www', 'index.html'));
    });

    it('default root, no full input path', () => {
      const inputUrl = '/';
      manager.outputTarget.baseUrl = '/';
      const filePath = getWriteFilePathFromUrlPath(manager, inputUrl);
      expect(filePath).toBe(join(rootDir, 'www', 'index.html'));
    });
  });
});
