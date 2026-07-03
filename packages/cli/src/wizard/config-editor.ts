import { readFile, writeFile } from 'node:fs/promises';
import ts from 'typescript';

import type { StencilConfigEditor } from './types';

export async function openStencilConfig(configPath: string): Promise<StencilConfigEditor> {
  const initial = await readFile(configPath, 'utf8');
  let text = initial;

  const parse = () => ts.createSourceFile(configPath, text, ts.ScriptTarget.Latest, true);

  function findArray(sf: ts.SourceFile, propName: string): ts.ArrayLiteralExpression | undefined {
    let found: ts.ArrayLiteralExpression | undefined;
    const visit = (node: ts.Node) => {
      if (
        !found &&
        ts.isPropertyAssignment(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === propName &&
        ts.isArrayLiteralExpression(node.initializer)
      ) {
        found = node.initializer;
      } else {
        ts.forEachChild(node, visit);
      }
    };
    visit(sf);
    return found;
  }

  function findConfigObject(sf: ts.SourceFile): ts.ObjectLiteralExpression | undefined {
    // Try 1: variable named 'config' with object literal initializer
    for (const stmt of sf.statements) {
      if (ts.isVariableStatement(stmt)) {
        for (const decl of stmt.declarationList.declarations) {
          if (
            ts.isIdentifier(decl.name) &&
            decl.name.text === 'config' &&
            decl.initializer &&
            ts.isObjectLiteralExpression(decl.initializer)
          ) {
            return decl.initializer;
          }
        }
      }
    }
    // Try 2: first object literal with a 'namespace' property
    let found: ts.ObjectLiteralExpression | undefined;
    const visit = (node: ts.Node) => {
      if (found) return;
      if (ts.isObjectLiteralExpression(node)) {
        const hasNamespace = node.properties.some(
          (p) =>
            ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === 'namespace',
        );
        if (hasNamespace) {
          found = node;
          return;
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
    return found;
  }

  function appendToArray(arr: ts.ArrayLiteralExpression, code: string): void {
    if (arr.elements.length === 0) {
      const insertPos = arr.getEnd() - 1; // before ]
      text = text.slice(0, insertPos) + code + text.slice(insertPos);
      return;
    }

    const lastElem = arr.elements[arr.elements.length - 1];
    let insertPos = lastElem.getEnd();
    const trailingComma = text.slice(insertPos).match(/^\s*,/);
    if (trailingComma) insertPos += trailingComma[0].length;

    // Detect multi-line vs inline from the array opening bracket to its first element
    const firstElemStart = arr.elements[0].getStart();
    const isMultiLine = text.slice(arr.getStart(), firstElemStart).includes('\n');

    if (isMultiLine) {
      const lineStart = text.lastIndexOf('\n', firstElemStart) + 1;
      const indent = text.slice(lineStart, firstElemStart).match(/^\s+/)?.[0] ?? '  ';
      text = `${text.slice(0, insertPos)},\n${indent}${code}${text.slice(insertPos)}`;
    } else {
      text = `${text.slice(0, insertPos)}, ${code}${text.slice(insertPos)}`;
    }
  }

  function addArrayProp(sf: ts.SourceFile, propName: string, code: string): void {
    const configObj = findConfigObject(sf);
    if (!configObj) throw new Error('Could not find Stencil config object in stencil.config.ts');

    let propIndent = '  ';
    if (configObj.properties.length > 0) {
      const firstPropStart = configObj.properties[0].getStart();
      const lineStart = text.lastIndexOf('\n', firstPropStart) + 1;
      propIndent = text.slice(lineStart, firstPropStart).match(/^\s+/)?.[0] ?? '  ';
    }
    const elemIndent = propIndent + '  ';
    const newProp = `${propName}: [\n${elemIndent}${code},\n${propIndent}]`;

    const lastProp = configObj.properties[configObj.properties.length - 1];
    if (lastProp) {
      let insertPos = lastProp.getEnd();
      const trailingComma = text.slice(insertPos).match(/^\s*,/);
      if (trailingComma) insertPos += trailingComma[0].length;
      text = `${text.slice(0, insertPos)},\n${propIndent}${newProp}${text.slice(insertPos)}`;
    } else {
      // Empty config object
      const insertPos = configObj.getEnd() - 1; // before }
      text = `${text.slice(0, insertPos)}\n${propIndent}${newProp},\n${text.slice(insertPos)}`;
    }
  }

  return {
    hasImport(moduleSpecifier) {
      return parse().statements.some(
        (s) =>
          ts.isImportDeclaration(s) &&
          ts.isStringLiteral(s.moduleSpecifier) &&
          s.moduleSpecifier.text === moduleSpecifier,
      );
    },

    addImport(moduleSpecifier, namedImports) {
      const sf = parse();
      const alreadyPresent = sf.statements.some(
        (s) =>
          ts.isImportDeclaration(s) &&
          ts.isStringLiteral(s.moduleSpecifier) &&
          s.moduleSpecifier.text === moduleSpecifier,
      );
      if (alreadyPresent) return;

      let insertPos = 0;
      for (const s of sf.statements) {
        if (ts.isImportDeclaration(s)) insertPos = s.getEnd();
      }
      const decl = `\nimport { ${namedImports.join(', ')} } from '${moduleSpecifier}';`;
      text =
        insertPos > 0
          ? text.slice(0, insertPos) + decl + text.slice(insertPos)
          : decl + '\n' + text;
    },

    outputTargetsContains(substring) {
      const arr = findArray(parse(), 'outputTargets');
      return arr ? text.slice(arr.getStart(), arr.getEnd()).includes(substring) : false;
    },

    addOutputTarget(expression) {
      const sf = parse();
      const arr = findArray(sf, 'outputTargets');
      if (arr) {
        appendToArray(arr, expression);
      } else {
        addArrayProp(sf, 'outputTargets', expression);
      }
    },

    pluginsContains(substring) {
      const arr = findArray(parse(), 'plugins');
      return arr ? text.slice(arr.getStart(), arr.getEnd()).includes(substring) : false;
    },

    addPlugin(expression) {
      const sf = parse();
      const arr = findArray(sf, 'plugins');
      if (arr) {
        appendToArray(arr, expression);
      } else {
        addArrayProp(sf, 'plugins', expression);
      }
    },

    async save() {
      await writeFile(configPath, text, 'utf8');
    },
  };
}
