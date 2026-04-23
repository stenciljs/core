import path from 'path';
import { beforeEach, describe, expect, it } from 'vitest';
import type * as d from '@stencil/core';

import { mockLoadConfigInit } from '../../../testing';
import {
  isOutputTargetCopy,
  isOutputTargetDistLazy,
  isOutputTargetSsr,
  isOutputTargetStandalone,
  isOutputTargetWww,
  join,
} from '../../../utils';
import { validateConfig } from '../validate-config';

describe('validateOutputTargetWww', () => {
  // use Node's resolve() here to simulate a user using either Win/Posix separators (depending on the platform these
  // tests are run on)
  const rootDir = path.resolve('/');
  let userConfig: d.Config;

  beforeEach(() => {
    userConfig = {
      rootDir: rootDir,
    };
  });

  it('should have default value', () => {
    const outputTarget: d.OutputTargetWww = {
      type: 'www',
      // use Node's join() here to simulate a user using either Win/Posix separators (depending on the platform these
      // tests are run on) for their input
      dir: path.join('www', 'docs'),
    };
    userConfig.outputTargets = [outputTarget];
    const { config } = validateConfig(userConfig, mockLoadConfigInit());

    expect(config.outputTargets).toEqual([
      {
        dir: '/dist/types',
        empty: true,
        skipInDev: true,
        type: 'types',
      },
      {
        dir: '/dist/stencil-rebundle',
        empty: true,
        skipInDev: true,
        transformAliasedImportPaths: true,
        type: 'stencil-rebundle',
      },
      {
        appDir: join(rootDir, 'www', 'docs'),
        baseUrl: '/',
        buildDir: join(rootDir, 'www', 'docs', 'build'),
        bundleMode: 'lazy',
        dir: join(rootDir, 'www', 'docs'),
        empty: true,
        indexHtml: join(rootDir, 'www', 'docs', 'index.html'),
        serviceWorker: {
          dontCacheBustURLsMatching: /p-\w{8}/,
          globDirectory: join(rootDir, 'www', 'docs'),
          globIgnores: [
            '**/host.config.json',
            '**/*.system.entry.js',
            '**/*.system.js',
            '**/app.js',
            '**/app.esm.js',
            '**/app.css',
          ],
          globPatterns: ['*.html', '**/*.{js,css,json}'],
          swDest: join(rootDir, 'www', 'docs', 'sw.js'),
        },
        type: 'www',
      },
      {
        dir: join(rootDir, 'www', 'docs', 'build'),
        esmDir: join(rootDir, 'www', 'docs', 'build'),
        isBrowserBuild: true,
        type: 'dist-lazy',
      },
      {
        copyAssets: 'dist',
        dir: join(rootDir, 'www', 'docs', 'build'),
        type: 'copy',
      },
      {
        copy: [
          {
            src: 'assets',
            warn: false,
          },
          {
            src: 'manifest.json',
            warn: false,
          },
        ],
        dir: join(rootDir, 'www', 'docs'),
        type: 'copy',
      },
      {
        file: join(rootDir, 'www', 'docs', 'build', 'app.css'),
        type: 'dist-global-styles',
      },
      {
        dir: join(rootDir, 'src'),
        footer: '*Built with [StencilJS](https://stenciljs.com/)*',
        strict: false,
        type: 'docs-readme',
        skipInDev: true,
      },
    ]);
  });

  it('should www with sub directory', () => {
    const outputTarget: d.OutputTargetWww = {
      type: 'www',
      // use Node's join() here to simulate a user using either Win/Posix separators (depending on the platform these
      // tests are run on) for their input
      dir: path.join('www', 'docs'),
    };
    userConfig.outputTargets = [outputTarget];
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    const www = config.outputTargets.find(isOutputTargetWww) as d.OutputTargetWww;

    expect(www.dir).toBe(join(rootDir, 'www', 'docs'));
    expect(www.appDir).toBe(join(rootDir, 'www', 'docs'));
    expect(www.buildDir).toBe(join(rootDir, 'www', 'docs', 'build'));
    expect(www.indexHtml).toBe(join(rootDir, 'www', 'docs', 'index.html'));
  });

  it('should set www values', () => {
    const outputTarget: d.OutputTargetWww = {
      type: 'www',
      dir: 'my-www',
      buildDir: 'my-build',
      indexHtml: 'my-index.htm',
      empty: false,
    };
    userConfig.outputTargets = [outputTarget];
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    const www = config.outputTargets.find(isOutputTargetWww) as d.OutputTargetWww;

    expect(www.type).toBe('www');
    expect(www.dir).toBe(join(rootDir, 'my-www'));
    expect(www.buildDir).toBe(join(rootDir, 'my-www', 'my-build'));
    expect(www.indexHtml).toBe(join(rootDir, 'my-www', 'my-index.htm'));
    expect(www.empty).toBe(false);
  });

  it('should default to add www when outputTargets is undefined', () => {
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    expect(config.outputTargets).toHaveLength(8); // types + stencil-rebundle (auto-gen in prod) + www + dist-lazy + copy×2 + dist-global-styles + docs-readme

    const outputTarget = config.outputTargets.find(isOutputTargetWww) as d.OutputTargetWww;
    expect(outputTarget.dir).toBe(join(rootDir, 'www'));
    expect(outputTarget.buildDir).toBe(join(rootDir, 'www', 'build'));
    expect(outputTarget.indexHtml).toBe(join(rootDir, 'www', 'index.html'));
    expect(outputTarget.empty).toBe(true);
  });

  describe('baseUrl', () => {
    it('baseUrl does not end with / with dir set', () => {
      const outputTarget: d.OutputTargetWww = {
        type: 'www',
        dir: 'my-www',
        baseUrl: '/docs',
      };
      userConfig.outputTargets = [outputTarget];
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      const www = config.outputTargets.find(isOutputTargetWww) as d.OutputTargetWww;

      expect(www.type).toBe('www');
      expect(www.dir).toBe(join(rootDir, 'my-www'));
      expect(www.baseUrl).toBe('/docs/');
      expect(www.appDir).toBe(join(rootDir, 'my-www/docs'));

      expect(www.buildDir).toBe(join(rootDir, 'my-www', 'docs', 'build'));
      expect(www.indexHtml).toBe(join(rootDir, 'my-www', 'docs', 'index.html'));
    });

    it('baseUrl does not end with /', () => {
      const outputTarget: d.OutputTargetWww = {
        type: 'www',
        baseUrl: '/docs',
      };
      userConfig.outputTargets = [outputTarget];
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      const www = config.outputTargets.find(isOutputTargetWww) as d.OutputTargetWww;

      expect(www.type).toBe('www');
      expect(www.dir).toBe(join(rootDir, 'www'));
      expect(www.baseUrl).toBe('/docs/');
      expect(www.appDir).toBe(join(rootDir, 'www/docs'));

      expect(www.buildDir).toBe(join(rootDir, 'www', 'docs', 'build'));
      expect(www.indexHtml).toBe(join(rootDir, 'www', 'docs', 'index.html'));
    });

    it('baseUrl is a full url', () => {
      const outputTarget: d.OutputTargetWww = {
        type: 'www',
        baseUrl: 'https://example.com/docs',
      };
      userConfig.outputTargets = [outputTarget];
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      const www = config.outputTargets.find(isOutputTargetWww) as d.OutputTargetWww;

      expect(www.type).toBe('www');
      expect(www.dir).toBe(join(rootDir, 'www'));
      expect(www.baseUrl).toBe('https://example.com/docs/');
      expect(www.appDir).toBe(join(rootDir, 'www/docs'));

      expect(www.buildDir).toBe(join(rootDir, 'www', 'docs', 'build'));
      expect(www.indexHtml).toBe(join(rootDir, 'www', 'docs', 'index.html'));
    });
  });

  describe('copy', () => {
    it('should add copy tasks', () => {
      const outputTarget: d.OutputTargetWww = {
        type: 'www',
        // use Node's join() here to simulate a user using either Win/Posix separators (depending on the platform these
        // tests are run on) for their input
        dir: path.join('www', 'docs'),
        copy: [
          {
            src: 'index-modules.html',
            dest: 'index-2.html',
          },
        ],
      };
      userConfig.outputTargets = [outputTarget];
      const { config } = validateConfig(userConfig, mockLoadConfigInit());

      const copyTargets = config.outputTargets.filter(isOutputTargetCopy);
      expect(copyTargets).toEqual([
        {
          copyAssets: 'dist',
          dir: join(rootDir, 'www', 'docs', 'build'),
          type: 'copy',
        },
        {
          copy: [
            {
              dest: 'index-2.html',
              src: 'index-modules.html',
            },
            {
              src: 'assets',
              warn: false,
            },
            {
              src: 'manifest.json',
              warn: false,
            },
          ],
          dir: join(rootDir, 'www', 'docs'),
          type: 'copy',
        },
      ]);
    });

    it('should replace copy tasks', () => {
      const outputTarget: d.OutputTargetWww = {
        type: 'www',
        // use Node's join() here to simulate a user using either Win/Posix separators (depending on the platform these
        // tests are run on) for their input
        dir: path.join('www', 'docs'),
        copy: [
          {
            src: 'assets',
            dest: 'assets2',
          },
        ],
      };
      userConfig.outputTargets = [outputTarget];
      const { config } = validateConfig(userConfig, mockLoadConfigInit());

      const copyTargets = config.outputTargets.filter(isOutputTargetCopy);
      expect(copyTargets).toEqual([
        {
          copyAssets: 'dist',
          dir: join(rootDir, 'www', 'docs', 'build'),
          type: 'copy',
        },
        {
          copy: [
            {
              dest: 'assets2',
              src: 'assets',
            },
            {
              src: 'manifest.json',
              warn: false,
            },
          ],
          dir: join(rootDir, 'www', 'docs'),
          type: 'copy',
        },
      ]);
    });

    it('should disable copy tasks', () => {
      const outputTarget: d.OutputTargetWww = {
        type: 'www',
        // use Node's join() here to simulate a user using either Win/Posix separators (depending on the platform these
        // tests are run on) for their input
        dir: path.join('www', 'docs'),
        copy: null,
      };
      userConfig.outputTargets = [outputTarget];
      const { config } = validateConfig(userConfig, mockLoadConfigInit());

      const copyTargets = config.outputTargets.filter(isOutputTargetCopy);
      expect(copyTargets).toEqual([
        {
          copyAssets: 'dist',
          dir: join(rootDir, 'www', 'docs', 'build'),
          type: 'copy',
        },
        {
          copy: [],
          dir: join(rootDir, 'www', 'docs'),
          type: 'copy',
        },
      ]);
    });
  });

  describe('bundleMode', () => {
    it('should default to lazy bundleMode', () => {
      const outputTarget: d.OutputTargetWww = {
        type: 'www',
      };
      userConfig.outputTargets = [outputTarget];
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      const www = config.outputTargets.find(isOutputTargetWww) as d.OutputTargetWww;

      expect(www.bundleMode).toBe('lazy');
      expect(config.outputTargets.some(isOutputTargetDistLazy)).toBe(true);
      expect(config.outputTargets.some(isOutputTargetStandalone)).toBe(false);
    });

    it('should support standalone bundleMode', () => {
      const outputTarget: d.OutputTargetWww = {
        type: 'www',
        bundleMode: 'standalone',
      };
      userConfig.outputTargets = [outputTarget];
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      const www = config.outputTargets.find(isOutputTargetWww) as d.OutputTargetWww;

      expect(www.bundleMode).toBe('standalone');
      expect(config.outputTargets.some(isOutputTargetDistLazy)).toBe(false);
      expect(config.outputTargets.some(isOutputTargetStandalone)).toBe(true);
    });

    it('should configure standalone output with autoLoader', () => {
      const outputTarget: d.OutputTargetWww = {
        type: 'www',
        bundleMode: 'standalone',
      };
      userConfig.outputTargets = [outputTarget];
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      const standalone = config.outputTargets.find(
        isOutputTargetStandalone,
      ) as d.OutputTargetStandalone;
      const www = config.outputTargets.find(isOutputTargetWww) as d.OutputTargetWww;

      expect(standalone).toBeDefined();
      expect(standalone.dir).toBe(www.buildDir);
      expect(standalone.autoLoader).toEqual({
        fileName: 'app', // config.fsNamespace defaults to 'app'
        autoStart: true,
      });
      expect(standalone.externalRuntime).toBe(false);
      expect(standalone.skipInDev).toBe(false);
    });

    it('should use custom namespace for standalone autoLoader fileName', () => {
      const outputTarget: d.OutputTargetWww = {
        type: 'www',
        bundleMode: 'standalone',
      };
      userConfig.outputTargets = [outputTarget];
      userConfig.namespace = 'MyComponents';
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      const standalone = config.outputTargets.find(
        isOutputTargetStandalone,
      ) as d.OutputTargetStandalone;

      expect(standalone.autoLoader).toEqual({
        fileName: 'mycomponents', // fsNamespace is lowercase
        autoStart: true,
      });
    });

    it('should normalize invalid bundleMode to lazy', () => {
      const outputTarget: d.OutputTargetWww = {
        type: 'www',
        // @ts-expect-error - testing invalid value
        bundleMode: 'invalid',
      };
      userConfig.outputTargets = [outputTarget];
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      const www = config.outputTargets.find(isOutputTargetWww) as d.OutputTargetWww;

      expect(www.bundleMode).toBe('lazy');
      expect(config.outputTargets.some(isOutputTargetDistLazy)).toBe(true);
    });
  });

  describe('ssr', () => {
    it('should not add hydrate by default', () => {
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      expect(config.outputTargets.some((o) => o.type === 'ssr')).toBe(false);
      expect(config.outputTargets.some((o) => o.type === 'www')).toBe(true);
    });

    it('should not add hydrate with user www', () => {
      const wwwOutputTarget: d.OutputTargetWww = {
        type: 'www',
      };
      userConfig.outputTargets = [wwwOutputTarget];
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      expect(config.outputTargets.some((o) => o.type === 'ssr')).toBe(false);
      expect(config.outputTargets.some((o) => o.type === 'www')).toBe(true);
    });

    it('should add hydrate with user hydrate and www outputs', () => {
      const wwwOutputTarget: d.OutputTargetWww = {
        type: 'www',
      };
      const hydrateOutputTarget: d.OutputTargetSsr = {
        type: 'ssr',
      };
      userConfig.outputTargets = [wwwOutputTarget, hydrateOutputTarget];
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      expect(config.outputTargets.some((o) => o.type === 'ssr')).toBe(true);
      expect(config.outputTargets.some((o) => o.type === 'www')).toBe(true);
    });

    it('should add hydrate with prerender config', () => {
      userConfig.prerender = true;
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      expect(config.outputTargets.some((o) => o.type === 'ssr')).toBe(true);
      expect(config.outputTargets.some((o) => o.type === 'www')).toBe(true);
    });

    it('should add hydrate with ssr config', () => {
      userConfig.ssr = true;
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      expect(config.outputTargets.some((o) => o.type === 'ssr')).toBe(true);
      expect(config.outputTargets.some((o) => o.type === 'www')).toBe(true);
    });

    it('should add externals and defaults', () => {
      const hydrateOutputTarget: d.OutputTargetSsr = {
        type: 'ssr',
        external: ['lodash', 'left-pad'],
      };
      userConfig.outputTargets = [hydrateOutputTarget];
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      const o = config.outputTargets.find(isOutputTargetSsr) as d.OutputTargetSsr;
      expect(o.external).toContain('lodash');
      expect(o.external).toContain('left-pad');
      expect(o.external).toContain('fs');
      expect(o.external).toContain('path');
      expect(o.external).toContain('crypto');
    });

    it('should add node builtins to external by default', () => {
      userConfig.prerender = true;

      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      const o = config.outputTargets.find(isOutputTargetSsr) as d.OutputTargetSsr;
      expect(o.external).toContain('fs');
      expect(o.external).toContain('path');
      expect(o.external).toContain('crypto');
    });
  });
});
