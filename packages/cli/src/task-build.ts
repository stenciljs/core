import { relative } from 'path';
import type * as d from '@stencil/core/compiler';

import { printCheckVersionResults, startCheckVersion } from './check-version';
import { startupCompilerLog } from './logs';
import { detectMigrations, taskMigrate, type MigrationDetectionResult } from './task-migrate';
import { runPrerenderTask } from './task-prerender';
import { taskWatch } from './task-watch';
import { telemetryBuildFinishedAction } from './telemetry/telemetry';
import type { ConfigFlags } from './config-flags';
import type { CoreCompiler } from './load-compiler';

export const taskBuild = async (
  coreCompiler: CoreCompiler,
  config: d.ValidatedConfig,
  flags: ConfigFlags,
) => {
  if (flags.watch) {
    // watch build
    await taskWatch(coreCompiler, config, flags);
    return;
  }

  // one-time build
  let exitCode = 0;

  try {
    startupCompilerLog(coreCompiler, config);

    const versionChecker = startCheckVersion(config, coreCompiler.version, flags);

    const compiler = await coreCompiler.createCompiler(config);
    const results = await compiler.build();

    await telemetryBuildFinishedAction(config.sys, config, coreCompiler, results, flags);

    await compiler.destroy();

    if (results.hasError) {
      // Check if there are migrations that might help fix the errors
      const migrationResult = await detectMigrations(coreCompiler, config);

      if (migrationResult.hasMigrations) {
        // Show what migrations are available and prompt user
        const action = await promptForMigrationOnBuildError(config, migrationResult);

        if (action === 'run') {
          // Run migrations and re-run build
          await taskMigrate(coreCompiler, config, { ...flags, dryRun: false });
          config.logger.info('\nRe-running build after migrations...\n');

          // Re-run the build
          const newCompiler = await coreCompiler.createCompiler(config);
          const newResults = await newCompiler.build();
          await newCompiler.destroy();

          if (!newResults.hasError) {
            // Build succeeded after migration
            exitCode = 0;
            if (flags.prerender) {
              const prerenderDiagnostics = await runPrerenderTask(
                coreCompiler,
                config,
                newResults.hydrateAppFilePath,
                newResults.componentGraph,
                undefined,
              );
              config.logger.printDiagnostics(prerenderDiagnostics);
              if (prerenderDiagnostics.some((d) => d.level === 'error')) {
                exitCode = 1;
              }
            }
          } else {
            exitCode = 1;
          }
        } else if (action === 'dry-run') {
          // Show what would be migrated
          await taskMigrate(coreCompiler, config, { ...flags, dryRun: true });
          exitCode = 1;
        } else {
          // User chose to exit
          exitCode = 1;
        }
      } else {
        exitCode = 1;
      }
    } else if (flags.prerender) {
      const prerenderDiagnostics = await runPrerenderTask(
        coreCompiler,
        config,
        results.hydrateAppFilePath,
        results.componentGraph,
        undefined,
      );
      config.logger.printDiagnostics(prerenderDiagnostics);

      if (prerenderDiagnostics.some((d) => d.level === 'error')) {
        exitCode = 1;
      }
    }

    await printCheckVersionResults(versionChecker);
  } catch (e) {
    exitCode = 1;
    config.logger.error(e);
  }

  if (exitCode > 0) {
    return config.sys.exit(exitCode);
  }
};

type MigrationAction = 'run' | 'dry-run' | 'exit';

/**
 * Prompt the user about available migrations when a build fails.
 * Shows what migrations are available and lets them choose to run them.
 * @param config the Stencil config
 * @param migrationResult the result of migration detection with available migrations
 * @returns the user's chosen action for handling migrations
 */
async function promptForMigrationOnBuildError(
  config: d.ValidatedConfig,
  migrationResult: MigrationDetectionResult,
): Promise<MigrationAction> {
  const logger = config.logger;

  // Show migration availability message
  logger.info('');
  logger.info(logger.bold(logger.yellow('Migrations Available')));
  logger.info('─'.repeat(40));
  logger.info(
    `Found ${migrationResult.totalMatches} item(s) in ${migrationResult.filesAffected} file(s) that can be automatically migrated.`,
  );

  // Show summary of what can be migrated
  for (const migration of migrationResult.migrations) {
    const relPath = relative(config.rootDir, migration.filePath);
    logger.info(`  ${logger.cyan(relPath)}: ${migration.matches.length} item(s)`);
  }

  logger.info('');
  logger.info('These migrations may help resolve the build errors above.');

  // Import prompts dynamically
  const { prompt } = await import('prompts');

  const response = await prompt({
    name: 'action',
    type: 'select',
    message: 'What would you like to do?',
    choices: [
      {
        title: 'Run migration',
        value: 'run',
        description: 'Apply migrations and re-run build',
      },
      {
        title: 'Dry run',
        value: 'dry-run',
        description: 'Preview changes without modifying files',
      },
      {
        title: 'Exit',
        value: 'exit',
        description: 'Exit without making changes',
      },
    ],
  });

  // Handle Ctrl+C or escape
  if (response.action === undefined) {
    return 'exit';
  }

  return response.action as MigrationAction;
}
