import ts from 'typescript';

import type { MigrationMatch, MigrationRule } from '../index';

/**
 * Migration rule for the @Component encapsulation API change.
 *
 * Migrates:
 * - `shadow: true` → `encapsulation: { type: 'shadow' }`
 * - `shadow: { delegatesFocus: true }` → `encapsulation: { type: 'shadow', delegatesFocus: true }`
 * - `scoped: true` → `encapsulation: { type: 'scoped' }`
 */
export const encapsulationApiRule: MigrationRule = {
  id: 'encapsulation-api',
  name: 'Encapsulation API',
  description: 'Migrate shadow/scoped properties to new encapsulation API',
  fromVersion: '4.x',
  toVersion: '5.x',

  detect(sourceFile: ts.SourceFile): MigrationMatch[] {
    const matches: MigrationMatch[] = [];

    const visit = (node: ts.Node) => {
      // Look for @Component decorator
      if (ts.isDecorator(node) && ts.isCallExpression(node.expression)) {
        const decoratorName = node.expression.expression;
        if (ts.isIdentifier(decoratorName) && decoratorName.text === 'Component') {
          const [arg] = node.expression.arguments;
          if (arg && ts.isObjectLiteralExpression(arg)) {
            // Check for deprecated properties
            for (const prop of arg.properties) {
              if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
                const propName = prop.name.text;
                if (propName === 'shadow' || propName === 'scoped') {
                  const { line, character } = sourceFile.getLineAndCharacterOfPosition(
                    prop.getStart(),
                  );
                  matches.push({
                    node: prop,
                    message: `Deprecated '${propName}' property found - migrate to 'encapsulation' API`,
                    line: line + 1,
                    column: character + 1,
                  });
                }
              }
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return matches;
  },

  transform(sourceFile: ts.SourceFile, matches: MigrationMatch[]): string {
    if (matches.length === 0) {
      return sourceFile.getFullText();
    }

    let text = sourceFile.getFullText();

    // Process matches in reverse order to preserve positions
    const sortedMatches = [...matches].sort((a, b) => {
      const posA = (a.node as ts.Node).getStart();
      const posB = (b.node as ts.Node).getStart();
      return posB - posA;
    });

    for (const match of sortedMatches) {
      const prop = match.node as ts.PropertyAssignment;
      const propName = (prop.name as ts.Identifier).text;
      const start = prop.getStart();
      const end = prop.getEnd();

      let replacement: string;

      if (propName === 'shadow') {
        if (prop.initializer.kind === ts.SyntaxKind.TrueKeyword) {
          replacement = "encapsulation: { type: 'shadow' }";
        } else if (ts.isObjectLiteralExpression(prop.initializer)) {
          // Extract options from the object
          const options: string[] = [];
          for (const innerProp of prop.initializer.properties) {
            if (ts.isPropertyAssignment(innerProp) && ts.isIdentifier(innerProp.name)) {
              const optName = innerProp.name.text;
              const optValue = innerProp.initializer.getText();
              options.push(`${optName}: ${optValue}`);
            }
          }
          if (options.length > 0) {
            replacement = `encapsulation: { type: 'shadow', ${options.join(', ')} }`;
          } else {
            replacement = "encapsulation: { type: 'shadow' }";
          }
        } else {
          // shadow: false or other - just remove it
          replacement = '';
        }
      } else if (propName === 'scoped') {
        if (prop.initializer.kind === ts.SyntaxKind.TrueKeyword) {
          replacement = "encapsulation: { type: 'scoped' }";
        } else {
          // scoped: false - just remove it
          replacement = '';
        }
      } else {
        continue;
      }

      // Handle trailing comma
      let endPos = end;
      const afterProp = text.slice(end).match(/^\s*,/);
      if (afterProp && replacement === '') {
        endPos = end + afterProp[0].length;
      } else if (afterProp && replacement !== '') {
        // Keep the comma
      } else if (!afterProp && replacement !== '') {
        // Check if there's a comma before this prop that we should handle
      }

      text = text.slice(0, start) + replacement + text.slice(endPos);
    }

    return text;
  },
};
