import { isAbsolute, join, relative } from 'path';
import ts from 'typescript';
import type * as d from '@stencil/core/compiler';

import { getRulesForVersionUpgrade, type MigrationMatch, type MigrationRule } from './migrations';
import type { ConfigFlags } from './config-flags';
import type { CoreCompiler } from './load-compiler';

interface MigrationResult {
  filePath: string;
  rule: MigrationRule;
  matches: MigrationMatch[];
  transformed: boolean;
}

/**
 * Represents a detected migration that can be applied.
 */
export interface DetectedMigration {
  filePath: string;
  rule: MigrationRule;
  matches: MigrationMatch[];
}

/**
 * Result of migration detection.
 */
export interface MigrationDetectionResult {
  /** Whether any migrations were detected */
  hasMigrations: boolean;
  /** Total number of items that need migration */
  totalMatches: number;
  /** Number of files affected */
  filesAffected: number;
  /** The detected migrations */
  migrations: DetectedMigration[];
  /** The migration rules that were checked */
  rules: MigrationRule[];
}

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
  const dryRun = flags.dryRun ?? false;

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

  if (dryRun) {
    logger.info(logger.cyan('Dry run mode - no files will be modified'));
  }

  // Get TypeScript files from tsconfig (same approach as the compiler)
  const tsFiles = await getTypeScriptFiles(config, sys, logger);

  if (tsFiles.length === 0) {
    logger.info(`No TypeScript files found. Check your tsconfig.json configuration.`);
    return;
  }

  logger.info(`Found ${tsFiles.length} TypeScript files to scan`);

  const results: MigrationResult[] = [];

  // Process each file
  for (const filePath of tsFiles) {
    let content = await sys.readFile(filePath);
    if (!content) {
      continue;
    }

    // Run each migration rule - re-parse after each transformation to get fresh positions
    for (const rule of rules) {
      const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
      const matches = rule.detect(sourceFile);

      if (matches.length > 0) {
        const relPath = relative(config.rootDir, filePath);
        logger.info(`\n${logger.cyan(relPath)}`);
        logger.info(`  ${logger.yellow(`[${rule.id}]`)} ${rule.name}`);

        for (const match of matches) {
          logger.info(`    Line ${match.line}: ${match.message}`);
        }

        if (!dryRun) {
          // Apply the transformation
          const transformed = rule.transform(sourceFile, matches);
          await sys.writeFile(filePath, transformed);
          // Update content for next rule to use fresh positions
          content = transformed;
          results.push({ filePath, rule, matches, transformed: true });
          logger.info(`  ${logger.green('✓')} Migrated`);
        } else {
          results.push({ filePath, rule, matches, transformed: false });
        }
      }
    }
  }

  // Print summary
  logger.info('\n' + logger.bold('Migration Summary'));
  logger.info('─'.repeat(40));

  const totalMatches = results.reduce((sum, r) => sum + r.matches.length, 0);
  const filesAffected = new Set(results.map((r) => r.filePath)).size;

  if (totalMatches === 0) {
    logger.info(logger.green('No migrations needed - your code is up to date!'));
  } else {
    logger.info(`Found ${totalMatches} item(s) to migrate in ${filesAffected} file(s)`);

    if (dryRun) {
      logger.info(logger.yellow('\nRun without --dry-run to apply the migrations'));
    } else {
      logger.info(logger.green(`\n✓ Successfully migrated ${totalMatches} item(s)`));
    }
  }

  // Group results by rule for detailed summary
  const byRule = new Map<string, MigrationResult[]>();
  for (const result of results) {
    const existing = byRule.get(result.rule.id) || [];
    existing.push(result);
    byRule.set(result.rule.id, existing);
  }

  if (byRule.size > 0) {
    logger.info('\nBy migration rule:');
    for (const [ruleId, ruleResults] of byRule) {
      const rule = rules.find((r) => r.id === ruleId);
      const count = ruleResults.reduce((sum, r) => sum + r.matches.length, 0);
      logger.info(`  ${rule?.name || ruleId}: ${count} item(s)`);
    }
  }
};

/**
 * Detect available migrations without applying them.
 * Used by the build task to check if migrations might help fix build errors.
 *
 * @param coreCompiler the Stencil compiler instance
 * @param config the validated Stencil config
 * @returns detection result with migration information
 */
export const detectMigrations = async (
  coreCompiler: CoreCompiler,
  config: d.ValidatedConfig,
): Promise<MigrationDetectionResult> => {
  const sys = config.sys;
  const logger = config.logger;

  // Get migration rules for the specified version upgrade
  const currentMajor = coreCompiler.version.split('.')[0];
  const fromVersion = String(Number(currentMajor) - 1);
  const toVersion = currentMajor;
  const rules = getRulesForVersionUpgrade(fromVersion, toVersion);

  if (rules.length === 0) {
    return {
      hasMigrations: false,
      totalMatches: 0,
      filesAffected: 0,
      migrations: [],
      rules: [],
    };
  }

  // Get TypeScript files from tsconfig
  const tsFiles = await getTypeScriptFiles(config, sys, logger);

  if (tsFiles.length === 0) {
    return {
      hasMigrations: false,
      totalMatches: 0,
      filesAffected: 0,
      migrations: [],
      rules,
    };
  }

  const migrations: DetectedMigration[] = [];

  // Detect migrations in each file
  for (const filePath of tsFiles) {
    const content = await sys.readFile(filePath);
    if (!content) {
      continue;
    }

    for (const rule of rules) {
      const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
      const matches = rule.detect(sourceFile);

      if (matches.length > 0) {
        migrations.push({ filePath, rule, matches });
      }
    }
  }

  const totalMatches = migrations.reduce((sum, m) => sum + m.matches.length, 0);
  const filesAffected = new Set(migrations.map((m) => m.filePath)).size;

  return {
    hasMigrations: migrations.length > 0,
    totalMatches,
    filesAffected,
    migrations,
    rules,
  };
};

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

  // Also include the stencil config file - it's typically not in tsconfig includes
  // but it can contain deprecated config options that need migration
  const configFile = config.configPath;
  if (configFile && (configFile.endsWith('.ts') || configFile.endsWith('.mts'))) {
    if (!files.includes(configFile)) {
      files.push(configFile);
    }
  }

  return files;
}
