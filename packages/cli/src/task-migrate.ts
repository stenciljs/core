import { isAbsolute, join, relative } from 'path';
import ts from 'typescript';
import type * as d from '@stencil/core/compiler';

import { getRulesForVersionUpgrade, type MigrationMatch, type MigrationRule } from './migrations';
import type { ConfigFlags } from './config-flags';
import type { CoreCompiler } from './load-compiler';

interface DetectedMigration {
  filePath: string;
  rule: MigrationRule;
  matches: MigrationMatch[];
}

type MigrationAction = 'run' | 'dry-run' | 'exit';

/**
 * Run the migration task to update Stencil components from v4 to v5 API.
 *
 * @param coreCompiler the Stencil compiler instance
 * @param config the validated Stencil config
 * @param flags CLI flags (includes dryRun option)
 */
export const taskMigrate = async (
  coreCompiler: CoreCompiler,
  config: d.ValidatedConfig,
  flags: ConfigFlags,
): Promise<void> => {
  const logger = config.logger;
  const sys = config.sys;
  const explicitDryRun = flags.dryRun ?? false;
  const autoApply = flags.yes ?? false;

  // Get migration rules for the specified version upgrade
  // Default: from previous major version to current installed version
  const currentMajor = coreCompiler.version.split('.')[0];
  const fromVersion = String(Number(currentMajor) - 1);
  const toVersion = currentMajor;
  const rules = getRulesForVersionUpgrade(fromVersion, toVersion);

  if (rules.length === 0) {
    logger.info(`No migration rules found for ${fromVersion}.x → ${toVersion}.x upgrade.`);
    return;
  }

  logger.info(`${logger.emoji('🔄 ')}Stencil Migration Tool (v${fromVersion} → v${toVersion})`);
  logger.info(`Scanning for components that need migration...`);

  if (explicitDryRun) {
    logger.info(logger.cyan('Dry run mode - no files will be modified'));
  }

  // Get TypeScript files from tsconfig (same approach as the compiler)
  const tsFiles = await getTypeScriptFiles(config, sys, logger);

  if (tsFiles.length === 0) {
    logger.info(`No TypeScript files found. Check your tsconfig.json configuration.`);
    return;
  }

  logger.info(`Found ${tsFiles.length} TypeScript files to scan`);

  // Phase 1: Detect all migrations without applying them
  const detected: DetectedMigration[] = [];

  for (const filePath of tsFiles) {
    const content = await sys.readFile(filePath);
    if (!content) {
      continue;
    }

    for (const rule of rules) {
      const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
      const matches = rule.detect(sourceFile);

      if (matches.length > 0) {
        detected.push({ filePath, rule, matches });
      }
    }
  }

  // If no migrations needed, we're done
  if (detected.length === 0) {
    logger.info('\n' + logger.bold('Migration Summary'));
    logger.info('─'.repeat(40));
    logger.info(logger.green('No migrations needed - your code is up to date!'));
    return;
  }

  // Show what was detected
  printDetectedMigrations(detected, config.rootDir, logger);

  // Determine the action to take
  let action: MigrationAction;

  if (explicitDryRun) {
    // If --dry-run flag was explicitly passed, don't prompt - just show dry-run results
    action = 'dry-run';
  } else if (autoApply) {
    // If --yes/-y flag was passed, auto-apply without prompting (useful for CI)
    action = 'run';
  } else {
    // Prompt user for what to do
    action = await promptForMigrationAction(logger);
  }

  if (action === 'exit') {
    logger.info('\nExiting without making changes.');
    return;
  }

  if (action === 'dry-run') {
    // Just show the summary without applying
    printMigrationSummary(detected, rules, logger);
    if (explicitDryRun) {
      logger.info(logger.yellow('\nRun without --dry-run to apply the migrations.'));
    } else {
      logger.info(logger.yellow('\nRun the migrate command again to apply changes.'));
    }
    return;
  }

  // action === 'run' - Apply the migrations
  logger.info('\nApplying migrations...');

  let appliedCount = 0;
  const appliedFiles = new Set<string>();

  // Group detections by file to process each file once with all its rules
  const byFile = new Map<string, DetectedMigration[]>();
  for (const d of detected) {
    const existing = byFile.get(d.filePath) || [];
    existing.push(d);
    byFile.set(d.filePath, existing);
  }

  for (const [filePath, fileMigrations] of byFile) {
    let content = await sys.readFile(filePath);
    if (!content) {
      continue;
    }

    const relPath = relative(config.rootDir, filePath);
    logger.info(`\n${logger.cyan(relPath)}`);

    // Apply each rule's transformations sequentially (re-parse after each)
    for (const migration of fileMigrations) {
      const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
      // Re-detect on updated content to get fresh positions
      const freshMatches = migration.rule.detect(sourceFile);

      if (freshMatches.length > 0) {
        const transformed = migration.rule.transform(sourceFile, freshMatches);
        content = transformed;
        appliedCount += freshMatches.length;
        logger.info(`  ${logger.green('✓')} ${migration.rule.name}`);
      }
    }

    await sys.writeFile(filePath, content);
    appliedFiles.add(filePath);
  }

  // Print final summary
  logger.info('\n' + logger.bold('Migration Complete'));
  logger.info('─'.repeat(40));
  logger.info(
    logger.green(`✓ Successfully migrated ${appliedCount} item(s) in ${appliedFiles.size} file(s)`),
  );

  // Group by rule for detailed summary
  printRuleSummary(detected, rules, logger);
};

/**
 * Print the detected migrations to the console.
 */
function printDetectedMigrations(
  detected: DetectedMigration[],
  rootDir: string,
  logger: d.Logger,
): void {
  logger.info('\n' + logger.bold('Migrations Found'));
  logger.info('─'.repeat(40));

  for (const { filePath, rule, matches } of detected) {
    const relPath = relative(rootDir, filePath);
    logger.info(`\n${logger.cyan(relPath)}`);
    logger.info(`  ${logger.yellow(`[${rule.id}]`)} ${rule.name}`);

    for (const match of matches) {
      logger.info(`    Line ${match.line}: ${match.message}`);
    }
  }
}

/**
 * Prompt the user for which migration action to take.
 */
async function promptForMigrationAction(logger: d.Logger): Promise<MigrationAction> {
  const { prompt } = await import('prompts');

  logger.info(''); // blank line before prompt

  const response = await prompt({
    name: 'action',
    type: 'select',
    message: 'What would you like to do?',
    choices: [
      { title: 'Run migration', value: 'run', description: 'Apply all migrations to your files' },
      {
        title: 'Dry run',
        value: 'dry-run',
        description: 'Preview changes without modifying files',
      },
      { title: 'Exit', value: 'exit', description: 'Exit without making changes' },
    ],
  });

  // Handle Ctrl+C or escape
  if (response.action === undefined) {
    return 'exit';
  }

  return response.action as MigrationAction;
}

/**
 * Print migration summary.
 */
function printMigrationSummary(
  detected: DetectedMigration[],
  rules: MigrationRule[],
  logger: d.Logger,
): void {
  const totalMatches = detected.reduce((sum, d) => sum + d.matches.length, 0);
  const filesAffected = new Set(detected.map((d) => d.filePath)).size;

  logger.info('\n' + logger.bold('Migration Summary'));
  logger.info('─'.repeat(40));
  logger.info(`Found ${totalMatches} item(s) to migrate in ${filesAffected} file(s)`);

  printRuleSummary(detected, rules, logger);
}

/**
 * Print summary grouped by rule.
 */
function printRuleSummary(
  detected: DetectedMigration[],
  rules: MigrationRule[],
  logger: d.Logger,
): void {
  const byRule = new Map<string, DetectedMigration[]>();
  for (const d of detected) {
    const existing = byRule.get(d.rule.id) || [];
    existing.push(d);
    byRule.set(d.rule.id, existing);
  }

  if (byRule.size > 0) {
    logger.info('\nBy migration rule:');
    for (const [ruleId, ruleDetections] of byRule) {
      const rule = rules.find((r) => r.id === ruleId);
      const count = ruleDetections.reduce((sum, d) => sum + d.matches.length, 0);
      logger.info(`  ${rule?.name || ruleId}: ${count} item(s)`);
    }
  }
}

/**
 * Get TypeScript files using the project's tsconfig.json.
 * Uses the same approach as the Stencil compiler.
 *
 * @param config the validated Stencil config
 * @param sys the compiler system for file operations
 * @param logger the logger for output
 * @returns array of absolute paths to TypeScript files
 */
async function getTypeScriptFiles(
  config: d.ValidatedConfig,
  sys: d.CompilerSystem,
  logger: d.Logger,
): Promise<string[]> {
  // Determine tsconfig path - check stencil config first, fall back to default
  let tsconfigPath: string;
  if (config.tsconfig) {
    tsconfigPath = isAbsolute(config.tsconfig)
      ? config.tsconfig
      : join(config.rootDir, config.tsconfig);
  } else {
    tsconfigPath = join(config.rootDir, 'tsconfig.json');
  }

  logger.debug(`Using tsconfig: ${tsconfigPath}`);

  // Check if tsconfig exists
  const tsconfigContent = await sys.readFile(tsconfigPath);
  if (!tsconfigContent) {
    logger.error(`tsconfig not found: ${tsconfigPath}`);
    return [];
  }

  // Parse the tsconfig using TypeScript's native parser
  // Use ts.sys directly for readDirectory since it handles glob patterns correctly
  const host: ts.ParseConfigFileHost = {
    ...ts.sys,
    readFile: (p) => {
      if (p === tsconfigPath) {
        return tsconfigContent;
      }
      return ts.sys.readFile(p);
    },
    onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
      logger.error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
    },
  };

  const results = ts.getParsedCommandLineOfConfigFile(tsconfigPath, {}, host);

  if (!results) {
    logger.error(`Failed to parse tsconfig: ${tsconfigPath}`);
    return [];
  }

  if (results.errors && results.errors.length > 0) {
    for (const err of results.errors) {
      logger.warn(ts.flattenDiagnosticMessageText(err.messageText, '\n'));
    }
  }

  // Filter to only .ts and .tsx files (excluding .d.ts)
  const files = results.fileNames.filter(
    (f) => (f.endsWith('.ts') || f.endsWith('.tsx')) && !f.endsWith('.d.ts'),
  );

  return files;
}
