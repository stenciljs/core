import ts from 'typescript';

import { encapsulationApiRule } from './rules/encapsulation-api';
import { formAssociatedRule } from './rules/form-associated';

/**
 * Build a map of local import names to their original names from @stencil/core.
 * Handles aliased imports like `import { Component as Cmp } from '@stencil/core'`.
 * Also handles multiple imports from @stencil/core (e.g., separate type and value imports).
 *
 * @param sourceFile The TypeScript source file to analyze
 * @returns Map where keys are local names and values are original imported names
 */
export const getStencilCoreImportMap = (sourceFile: ts.SourceFile): Map<string, string> => {
  const importMap = new Map<string, string>();

  for (const statement of sourceFile.statements) {
    if (
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === '@stencil/core'
    ) {
      const namedBindings = statement.importClause?.namedBindings;
      if (namedBindings && ts.isNamedImports(namedBindings)) {
        for (const element of namedBindings.elements) {
          // element.name is the local name (what's used in code)
          // element.propertyName is the original name (if aliased), otherwise undefined
          const localName = element.name.text;
          const originalName = element.propertyName?.text ?? element.name.text;
          importMap.set(localName, originalName);
        }
      }
      // Don't break - there may be multiple imports from @stencil/core
      // (e.g., a type-only import and a value import)
    }
  }

  return importMap;
};

/**
 * Check if a decorator identifier refers to a specific @stencil/core export.
 * Handles aliased imports like `import { Component as Cmp } from '@stencil/core'`.
 *
 * @param decoratorName The identifier used in the decorator
 * @param expectedOriginalName The original export name (e.g., 'Component')
 * @param importMap The import map from getStencilCoreImportMap
 * @returns True if the decorator refers to the expected export
 */
export const isStencilDecorator = (
  decoratorName: string,
  expectedOriginalName: string,
  importMap: Map<string, string>,
): boolean => {
  return importMap.get(decoratorName) === expectedOriginalName;
};

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
const migrationRules: MigrationRule[] = [encapsulationApiRule, formAssociatedRule];

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
