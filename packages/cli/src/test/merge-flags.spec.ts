import type { Config } from '@stencil/core';
import { describe, it, expect } from 'vitest';
import { createConfigFlags, type ConfigFlags } from '../config-flags';
import { mergeFlags } from '../merge-flags';

describe('mergeFlags', () => {
  const createFlags = (overrides: Partial<ConfigFlags> = {}): ConfigFlags => {
    return createConfigFlags(overrides);
  };

  describe('devMode (--dev / --prod)', () => {
    it('sets devMode to false when --prod is true', () => {
      const config: Config = {};
      const flags = createFlags({ prod: true });

      const result = mergeFlags(config, flags);

      expect(result.devMode).toBe(false);
    });

    it('sets devMode to true when --dev is true', () => {
      const config: Config = {};
      const flags = createFlags({ dev: true });

      const result = mergeFlags(config, flags);

      expect(result.devMode).toBe(true);
    });

    it('--prod takes precedence over --dev when both are set', () => {
      const config: Config = {};
      const flags = createFlags({ prod: true, dev: true });

      const result = mergeFlags(config, flags);

      expect(result.devMode).toBe(false);
    });

    it('preserves config devMode when neither flag is set', () => {
      const config: Config = { devMode: true };
      const flags = createFlags({});

      const result = mergeFlags(config, flags);

      expect(result.devMode).toBe(true);
    });
  });

  describe('logLevel (--verbose / --debug / --logLevel)', () => {
    it('sets logLevel to debug when --debug is true', () => {
      const config: Config = {};
      const flags = createFlags({ debug: true });

      const result = mergeFlags(config, flags);

      expect(result.logLevel).toBe('debug');
    });

    it('sets logLevel to debug when --verbose is true', () => {
      const config: Config = {};
      const flags = createFlags({ verbose: true });

      const result = mergeFlags(config, flags);

      expect(result.logLevel).toBe('debug');
    });

    it('sets logLevel from --logLevel flag', () => {
      const config: Config = {};
      const flags = createFlags({ logLevel: 'warn' });

      const result = mergeFlags(config, flags);

      expect(result.logLevel).toBe('warn');
    });

    it('--debug takes precedence over --logLevel', () => {
      const config: Config = {};
      const flags = createFlags({ debug: true, logLevel: 'error' });

      const result = mergeFlags(config, flags);

      expect(result.logLevel).toBe('debug');
    });

    it('preserves config logLevel when no flags are set', () => {
      const config: Config = { logLevel: 'info' };
      const flags = createFlags({});

      const result = mergeFlags(config, flags);

      expect(result.logLevel).toBe('info');
    });
  });

  describe('watch (--watch)', () => {
    it('sets watch to true when --watch is true', () => {
      const config: Config = {};
      const flags = createFlags({ watch: true });

      const result = mergeFlags(config, flags);

      expect(result.watch).toBe(true);
    });

    it('sets watch to false when --watch is false', () => {
      const config: Config = { watch: true };
      const flags = createFlags({ watch: false });

      const result = mergeFlags(config, flags);

      expect(result.watch).toBe(false);
    });

    it('preserves config watch when flag is not set', () => {
      const config: Config = { watch: true };
      const flags = createFlags({});

      const result = mergeFlags(config, flags);

      expect(result.watch).toBe(true);
    });
  });

  describe('buildDocs (--docs)', () => {
    it('sets buildDocs from --docs flag', () => {
      const config: Config = {};
      const flags = createFlags({ docs: true });

      const result = mergeFlags(config, flags);

      expect(result.buildDocs).toBe(true);
    });
  });

  describe('buildDist (--esm)', () => {
    it('sets buildDist from --esm flag', () => {
      const config: Config = {};
      const flags = createFlags({ esm: true });

      const result = mergeFlags(config, flags);

      expect(result.buildDist).toBe(true);
    });
  });

  describe('profile (--profile)', () => {
    it('sets profile from --profile flag', () => {
      const config: Config = {};
      const flags = createFlags({ profile: true });

      const result = mergeFlags(config, flags);

      expect(result.profile).toBe(true);
    });
  });

  describe('writeLog (--log)', () => {
    it('sets writeLog from --log flag', () => {
      const config: Config = {};
      const flags = createFlags({ log: true });

      const result = mergeFlags(config, flags);

      expect(result.writeLog).toBe(true);
    });
  });

  describe('enableCache (--cache)', () => {
    it('sets enableCache from --cache flag', () => {
      const config: Config = {};
      const flags = createFlags({ cache: true });

      const result = mergeFlags(config, flags);

      expect(result.enableCache).toBe(true);
    });

    it('can disable cache with --cache false', () => {
      const config: Config = { enableCache: true };
      const flags = createFlags({ cache: false });

      const result = mergeFlags(config, flags);

      expect(result.enableCache).toBe(false);
    });
  });

  describe('ci (--ci)', () => {
    it('sets ci from --ci flag', () => {
      const config: Config = {};
      const flags = createFlags({ ci: true });

      const result = mergeFlags(config, flags);

      expect(result.ci).toBe(true);
    });
  });

  describe('ssr (--ssr)', () => {
    it('sets ssr from --ssr flag', () => {
      const config: Config = {};
      const flags = createFlags({ ssr: true });

      const result = mergeFlags(config, flags);

      expect(result.ssr).toBe(true);
    });
  });

  describe('prerender (--prerender)', () => {
    it('sets prerender from --prerender flag', () => {
      const config: Config = {};
      const flags = createFlags({ prerender: true });

      const result = mergeFlags(config, flags);

      expect(result.prerender).toBe(true);
    });
  });

  describe('docsJsonPath (--docsJson)', () => {
    it('sets docsJsonPath from --docsJson flag', () => {
      const config: Config = {};
      const flags = createFlags({ docsJson: './docs.json' });

      const result = mergeFlags(config, flags);

      expect(result.docsJsonPath).toBe('./docs.json');
    });
  });

  describe('statsJsonPath (--stats)', () => {
    it('sets statsJsonPath from --stats flag (string)', () => {
      const config: Config = {};
      const flags = createFlags({ stats: './stats.json' });

      const result = mergeFlags(config, flags);

      expect(result.statsJsonPath).toBe('./stats.json');
    });

    it('sets statsJsonPath from --stats flag (boolean)', () => {
      const config: Config = {};
      const flags = createFlags({ stats: true });

      const result = mergeFlags(config, flags);

      expect(result.statsJsonPath).toBe(true);
    });
  });

  describe('generateServiceWorker (--serviceWorker)', () => {
    it('sets generateServiceWorker from --serviceWorker flag', () => {
      const config: Config = {};
      const flags = createFlags({ serviceWorker: true });

      const result = mergeFlags(config, flags);

      expect(result.generateServiceWorker).toBe(true);
    });
  });

  describe('e2eTests (--e2e)', () => {
    it('sets e2eTests from --e2e flag', () => {
      const config: Config = {};
      const flags = createFlags({ e2e: true });

      const result = mergeFlags(config, flags);

      expect(result.e2eTests).toBe(true);
    });
  });

  describe('maxConcurrentWorkers (--maxWorkers)', () => {
    it('sets maxConcurrentWorkers from --maxWorkers flag', () => {
      const config: Config = {};
      const flags = createFlags({ maxWorkers: 4 });

      const result = mergeFlags(config, flags);

      expect(result.maxConcurrentWorkers).toBe(4);
    });

    it('does not set maxConcurrentWorkers when --maxWorkers is a string', () => {
      const config: Config = {};
      // maxWorkers can be a string like "50%" but only number values are merged
      const flags = createFlags({ maxWorkers: '50%' as unknown as number });

      const result = mergeFlags(config, flags);

      expect(result.maxConcurrentWorkers).toBeUndefined();
    });
  });

  describe('dev server options', () => {
    it('sets devServerAddress from --address flag', () => {
      const config: Config = {};
      const flags = createFlags({ address: '0.0.0.0' });

      const result = mergeFlags(config, flags);

      expect(result.devServerAddress).toBe('0.0.0.0');
    });

    it('sets devServerPort from --port flag', () => {
      const config: Config = {};
      const flags = createFlags({ port: 4444 });

      const result = mergeFlags(config, flags);

      expect(result.devServerPort).toBe(4444);
    });

    it('sets devServerOpen from --open flag', () => {
      const config: Config = {};
      const flags = createFlags({ open: true });

      const result = mergeFlags(config, flags);

      expect(result.devServerOpen).toBe(true);
    });
  });

  describe('config preservation', () => {
    it('preserves existing config values not affected by flags', () => {
      const config: Config = {
        namespace: 'my-app',
        srcDir: './src',
        taskQueue: 'async',
      };
      const flags = createFlags({ dev: true });

      const result = mergeFlags(config, flags);

      expect(result.namespace).toBe('my-app');
      expect(result.srcDir).toBe('./src');
      expect(result.taskQueue).toBe('async');
      expect(result.devMode).toBe(true);
    });

    it('does not mutate the original config', () => {
      const config: Config = { devMode: false };
      const flags = createFlags({ dev: true });

      const result = mergeFlags(config, flags);

      expect(config.devMode).toBe(false);
      expect(result.devMode).toBe(true);
    });
  });
});
