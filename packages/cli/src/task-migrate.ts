import { join, relative } from 'path';
import ts from 'typescript';
import type * as d from '@stencil/core/compiler';

import type { ConfigFlags } from './config-flags';
import type { CoreCompiler } from './load-compiler';
import { migrationRules, type MigrationMatch, type MigrationRule } from './migrations';

interface MigrationResult {
  filePath: string;
  rule: MigrationRule;
  matches: MigrationMatch[];
  transformed: boolean;
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

  logger.info(`${logger.emoji('🔄 ')}Stencil Migration Tool`);
  logger.info(`Scanning for components that need migration...`);

  if (dryRun) {
    logger.info(logger.cyan('Dry run mode - no files will be modified'));
  }

  const srcDir = config.srcDir || join(config.rootDir, 'src');
  const results: MigrationResult[] = [];

  // Find all TypeScript files in the source directory
  const tsFiles = await findTypeScriptFiles(sys, srcDir);

  if (tsFiles.length === 0) {
    logger.info(`No TypeScript files found in ${srcDir}`);
    return;
  }

  logger.info(`Found ${tsFiles.length} TypeScript files to scan`);

  // Process each file
  for (const filePath of tsFiles) {
    const content = await sys.readFile(filePath);
    if (!content) {
      continue;
    }

    // Parse the file with TypeScript
    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

    // Run each migration rule
    for (const rule of migrationRules) {
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
      logger.info(
        logger.yellow('\nRun without --dry-run to apply the migrations'),
      );
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
      const rule = migrationRules.find((r) => r.id === ruleId);
      const count = ruleResults.reduce((sum, r) => sum + r.matches.length, 0);
      logger.info(`  ${rule?.name || ruleId}: ${count} item(s)`);
    }
  }
};

/**
 * Recursively find all TypeScript files in a directory.
 *
 * @param sys the compiler system for file operations
 * @param dir the directory to search
 * @returns array of absolute paths to TypeScript files
 */
async function findTypeScriptFiles(
  sys: d.CompilerSystem,
  dir: string,
): Promise<string[]> {
  const files: string[] = [];

  const items = await sys.readDir(dir);
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = await sys.stat(fullPath);

    if (!stat) continue;

    if (stat.isDirectory) {
      // Skip node_modules and hidden directories
      if (item === 'node_modules' || item.startsWith('.')) {
        continue;
      }
      const subFiles = await findTypeScriptFiles(sys, fullPath);
      files.push(...subFiles);
    } else if (stat.isFile && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
      // Skip declaration files
      if (!item.endsWith('.d.ts')) {
        files.push(fullPath);
      }
    }
  }

  return files;
}
