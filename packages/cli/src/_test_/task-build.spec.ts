import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const stdEnv = vi.hoisted(() => ({ isCI: false }));

vi.mock('std-env', () => ({
  get isCI() {
    return stdEnv.isCI;
  },
}));
vi.mock('@clack/prompts', () => ({
  select: vi.fn(),
  isCancel: vi.fn(() => false),
}));

import * as clack from '@clack/prompts';
import { promptForMigration } from '../task-build';

describe('promptForMigration', () => {
  const identity = (s: string) => s;
  const logger = { info: vi.fn(), bold: identity, yellow: identity, cyan: identity };
  const config = { logger, rootDir: '/project' } as any;
  const migrationResult = {
    hasMigrations: true,
    totalMatches: 1,
    filesAffected: 1,
    migrations: [{ filePath: '/project/stencil.config.ts', matches: [{}] }],
  } as any;

  const originalIsTTY = process.stdin.isTTY;
  const setStdinTTY = (value: boolean | undefined) =>
    Object.defineProperty(process.stdin, 'isTTY', { value, configurable: true });

  beforeEach(() => {
    vi.clearAllMocks();
    stdEnv.isCI = false;
  });

  afterEach(() => {
    setStdinTTY(originalIsTTY);
  });

  it('prompts when stdin is a terminal', async () => {
    setStdinTTY(true);
    vi.mocked(clack.select).mockResolvedValue('run');

    await expect(promptForMigration(config, migrationResult, 'pre-build')).resolves.toBe('run');
    expect(clack.select).toHaveBeenCalledTimes(1);
  });

  it("doesn't prompt when stdin isn't a terminal - it exits with instructions", async () => {
    setStdinTTY(undefined);

    await expect(promptForMigration(config, migrationResult, 'pre-build')).resolves.toBe('exit');
    expect(clack.select).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('stencil migrate'));
  });

  it("doesn't prompt in CI, even with a terminal", async () => {
    setStdinTTY(true);
    stdEnv.isCI = true;

    await expect(promptForMigration(config, migrationResult, 'post-error')).resolves.toBe('exit');
    expect(clack.select).not.toHaveBeenCalled();
  });
});
