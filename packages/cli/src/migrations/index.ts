import ts from 'typescript';

import { encapsulationApiRule } from './rules/encapsulation-api';
import { formAssociatedRule } from './rules/form-associated';

/**
 * Represents a match found by a migration rule during detection.
 */
export interface MigrationMatch {
  /** The AST node that matched */
  node: ts.Node;
  /** Human-readable message describing what needs to be migrated */
  message: string;
  /** Line number in the source file (1-indexed) */
  line: number;
  /** Column number in the source file (1-indexed) */
  column: number;
}

/**
 * Interface for pluggable migration rules.
 * Each rule can detect deprecated patterns and transform them to the new API.
 */
export interface MigrationRule {
  /** Unique identifier for the rule */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what this rule migrates */
  description: string;
  /** Source version (e.g., '4.x') */
  fromVersion: string;
  /** Target version (e.g., '5.x') */
  toVersion: string;

  /**
   * Detect if this rule applies to a source file.
   * @param sourceFile The TypeScript source file to check
   * @returns Array of matches found, empty if rule doesn't apply
   */
  detect(sourceFile: ts.SourceFile): MigrationMatch[];

  /**
   * Apply the transformation to a source file.
   * @param sourceFile The TypeScript source file to transform
   * @param matches The matches found during detection
   * @returns The transformed source code as a string
   */
  transform(sourceFile: ts.SourceFile, matches: MigrationMatch[]): string;
}

/**
 * Registry of all available migration rules.
 * Rules are applied in order, so add new rules at the end.
 */
export const migrationRules: MigrationRule[] = [encapsulationApiRule, formAssociatedRule];

/**
 * Get all migration rules for a specific version upgrade.
 * @param fromVersion Source version (e.g., '4')
 * @param toVersion Target version (e.g., '5')
 * @returns Filtered list of applicable rules
 */
export const getRulesForVersionUpgrade = (
  fromVersion: string,
  toVersion: string,
): MigrationRule[] => {
  return migrationRules.filter(
    (rule) => rule.fromVersion.startsWith(fromVersion) && rule.toVersion.startsWith(toVersion),
  );
};
