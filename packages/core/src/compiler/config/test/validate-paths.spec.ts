import type * as d from '@stencil/core/declarations';
import { mockCompilerSystem, mockLoadConfigInit, mockLogger } from '@stencil/core/testing';
import { join } from '@utils';
import path from 'path';

import { validateConfig } from '../validate-config';

describe('validatePaths', () => {
  let userConfig: d.Config;
  const logger = mockLogger();
  const sys = mockCompilerSystem();

  // use Node's resolve() here to simulate a user using either Win/Posix separators (depending on the platform these
  // tests are run on)
  const ROOT = path.resolve('/');

  beforeEach(() => {
    userConfig = {
      sys: sys as any,
      logger: logger,
      // use Node's join() here to simulate a user using either Win/Posix separators (depending on the platform these
      // tests are run on) for their input
      rootDir: path.join(ROOT, 'User', 'my-app'),
      namespace: 'Testing',
    };
  });

  it('should set absolute cacheDir', () => {
    // use Node's join() here to simulate a user using either Win/Posix separators (depending on the platform these
    // tests are run on) for their input
    userConfig.cacheDir = path.join(ROOT, 'some', 'custom', 'cache');
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    expect(config.cacheDir).toBe(join(ROOT, 'some', 'custom', 'cache'));
  });

  it('should set relative cacheDir', () => {
    userConfig.cacheDir = 'custom-cache';
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    expect(config.cacheDir).toBe(join(ROOT, 'User', 'my-app', 'custom-cache'));
  });

  it('should set default cacheDir', () => {
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    expect(config.cacheDir).toBe(join(ROOT, 'User', 'my-app', '.stencil'));
  });

  it('should set default wwwIndexHtml and convert to absolute path', () => {
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    expect(path.basename((config.outputTargets as d.OutputTargetWww[])[0].indexHtml!)).toBe('index.html');
    expect(path.isAbsolute((config.outputTargets as d.OutputTargetWww[])[0].indexHtml!)).toBe(true);
  });

  it('should convert a custom wwwIndexHtml to absolute path', () => {
    userConfig.outputTargets = [
      {
        type: 'www',
        // use Node's join() here to simulate a user using either Win/Posix separators (depending on the platform these
        // tests are run on) for their input
        indexHtml: path.join('assets', 'custom-index.html'),
      },
    ] as d.OutputTargetWww[];
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    expect(path.basename((config.outputTargets as d.OutputTargetWww[])[0].indexHtml!)).toBe('custom-index.html');
    expect(path.isAbsolute((config.outputTargets as d.OutputTargetWww[])[0].indexHtml!)).toBe(true);
  });

  it('should set default indexHtmlSrc and convert to absolute path', () => {
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    expect(path.basename(config.srcIndexHtml)).toBe('index.html');
    expect(path.isAbsolute(config.srcIndexHtml)).toBe(true);
  });

  it('should set emptyDist to false', () => {
    userConfig.outputTargets = [
      {
        type: 'www',
        empty: false,
      },
    ] as d.OutputTargetWww[];
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    expect((config.outputTargets as d.OutputTargetWww[])[0].empty).toBe(false);
  });

  it('should set default emptyWWW to true', () => {
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    expect((config.outputTargets as d.OutputTargetWww[])[0].empty).toBe(true);
  });

  it('should set emptyWWW to false', () => {
    userConfig.outputTargets = [
      {
        type: 'www',
        empty: false,
      },
    ] as d.OutputTargetWww[];
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    expect((config.outputTargets as d.OutputTargetWww[])[0].empty).toBe(false);
  });

  it('should set default collection dir and convert to absolute path', () => {
    userConfig.outputTargets = [
      {
        type: 'dist',
      },
    ];
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    expect(path.basename((config.outputTargets as d.OutputTargetDist[])[0].collectionDir!)).toBe('collection');
    expect(path.isAbsolute((config.outputTargets as d.OutputTargetDist[])[0].collectionDir!)).toBe(true);
  });

  it('should set default types dir and convert to absolute path', () => {
    userConfig.outputTargets = [
      {
        type: 'dist',
      },
    ];
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    expect(path.basename((config.outputTargets as d.OutputTargetDist[])[0].typesDir!)).toBe('types');
    expect(path.isAbsolute((config.outputTargets as d.OutputTargetDist[])[0].typesDir!)).toBe(true);
  });

  it('should set default build dir and convert to absolute path', () => {
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    // the path will be normalized by Stencil us use '/', split on that regardless of platform
    const parts = (config.outputTargets as d.OutputTargetDist[])[0].buildDir!.split('/');
    expect(parts[parts.length - 1]).toBe('build');
    expect(parts[parts.length - 2]).toBe('www');
    expect(path.isAbsolute((config.outputTargets as d.OutputTargetDist[])[0].buildDir!)).toBe(true);
  });

  it('should set build dir w/ custom www', () => {
    userConfig.outputTargets = [
      {
        type: 'www',
        dir: 'custom-www',
      },
    ] as d.OutputTargetWww[];
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    // the path will be normalized by Stencil us use '/', split on that regardless of platform
    const parts = (config.outputTargets as d.OutputTargetDist[])[0].buildDir!.split('/');
    expect(parts[parts.length - 1]).toBe('build');
    expect(parts[parts.length - 2]).toBe('custom-www');
    expect(path.isAbsolute((config.outputTargets as d.OutputTargetDist[])[0].buildDir!)).toBe(true);
  });

  it('should set default src dir and convert to absolute path', () => {
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    expect(path.basename(config.srcDir)).toBe('src');
    expect(path.isAbsolute(config.srcDir)).toBe(true);
  });

  it('should set src dir and convert to absolute path', () => {
    userConfig.srcDir = 'app';
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    expect(path.basename(config.srcDir)).toBe('app');
    expect(path.isAbsolute(config.srcDir)).toBe(true);
  });

  it('should convert globalScript to absolute path, if a globalScript property was provided', () => {
    // use Node's join() here to simulate a user using either Win/Posix separators (depending on the platform these
    // tests are run on) for their input
    userConfig.globalScript = path.join('src', 'global', 'index.ts');
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    expect(path.basename(config.globalScript!)).toBe('index.ts');
    expect(path.isAbsolute(config.globalScript!)).toBe(true);
  });

  it('should convert globalStyle string to absolute path array, if a globalStyle property was provided', () => {
    // use Node's join() here to simulate a user using either Win/Posix separators (depending on the platform these
    // tests are run on) for their input
    userConfig.globalStyle = path.join('src', 'global', 'styles.css');
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    expect(path.basename(config.globalStyle!)).toBe('styles.css');
    expect(path.isAbsolute(config.globalStyle!)).toBe(true);
  });
});
