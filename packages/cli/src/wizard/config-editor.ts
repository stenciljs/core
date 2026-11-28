import { readFile, writeFile } from 'node:fs/promises';
import ts from 'typescript';

import type { StencilConfigEditor } from './types';

type ListLiteral = ts.ArrayLiteralExpression | ts.ObjectLiteralExpression;

export async function openStencilConfig(configPath: string): Promise<StencilConfigEditor> {
  let text = await readFile(configPath, 'utf8');

  const parse = () => ts.createSourceFile(configPath, text, ts.ScriptTarget.Latest, true);

  const nodeText = (node: ts.Node) => text.slice(node.getStart(), node.getEnd());

  const splice = (start: number, end: number, replacement: string) => {
    text = text.slice(0, start) + replacement + text.slice(end);
  };

  // Leading whitespace of the line containing `pos`.
  const indentAt = (pos: number) => {
    const lineStart = text.lastIndexOf('\n', pos - 1) + 1;
    return text.slice(lineStart, pos).match(/^\s*/)?.[0] ?? '';
  };

  // Callers build multi-line expressions indented relative to their own start, with no idea
  // what depth they'll be spliced in at - so every continuation line needs shifting too.
  const reindent = (code: string, indent: string) => code.replace(/\n/g, `\n${indent}`);

  const listItems = (list: ListLiteral): ts.NodeArray<ts.Node> =>
    ts.isArrayLiteralExpression(list) ? list.elements : list.properties;

  const isMultiLine = (list: ListLiteral) => {
    const [first] = listItems(list);
    return !!first && text.slice(list.getStart(), first.getStart()).includes('\n');
  };

  const findProp = (obj: ts.ObjectLiteralExpression, name: string) =>
    obj.properties.find(
      (p): p is ts.PropertyAssignment =>
        ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === name,
    );

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
      if (ts.isObjectLiteralExpression(node) && findProp(node, 'namespace')) {
        found = node;
        return;
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
    return found;
  }

  function requireConfigObject() {
    const configObj = findConfigObject(parse());
    if (!configObj) throw new Error('Could not find Stencil config object in stencil.config.ts');
    return configObj;
  }

  function findArray(propName: string) {
    const sf = parse();
    const configObj = findConfigObject(sf);
    if (configObj) {
      // Direct properties only - nested objects can have same-named arrays (e.g. `plugins`).
      const init = findProp(configObj, propName)?.initializer;
      return init && ts.isArrayLiteralExpression(init) ? init : undefined;
    }

    let found: ts.ArrayLiteralExpression | undefined;
    const visit = (node: ts.Node) => {
      if (found) return;
      if (
        ts.isPropertyAssignment(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === propName &&
        ts.isArrayLiteralExpression(node.initializer)
      ) {
        found = node.initializer;
        return;
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
    return found;
  }

  /**
   * Insert `code` as a new item of an array / object literal, matching the list's own layout
   * (one item per line, or all on one line).
   * @param list - The array or object literal to insert into.
   * @param code - Source of the new item, indented relative to its own start.
   * @param anchor - Item to insert after. Defaults to the last one.
   */
  function insertItem(list: ListLiteral, code: string, anchor?: ts.Node) {
    const items = listItems(list);
    const [open, close] = ts.isArrayLiteralExpression(list) ? '[]' : '{}';
    const multiLine = isMultiLine(list);

    // An inline list can't take a multi-line item without leaving its continuation lines
    // dangling at the wrong depth, and an empty object reads badly inline - break those out
    // to one item per line.
    const breakOut =
      !multiLine &&
      (code.includes('\n') || (items.length === 0 && ts.isObjectLiteralExpression(list)));
    if (breakOut) {
      const baseIndent = indentAt(list.getStart());
      const indent = baseIndent + '  ';
      const lines = items.map(nodeText);
      const at = anchor ? items.indexOf(anchor) + 1 : lines.length;
      lines.splice(at, 0, reindent(code, indent));
      splice(
        list.getStart(),
        list.getEnd(),
        `${open}\n${indent}${lines.join(`,\n${indent}`)},\n${baseIndent}${close}`,
      );
      return;
    }

    if (items.length === 0) {
      splice(list.getEnd() - 1, list.getEnd() - 1, code);
      return;
    }

    anchor ??= items[items.length - 1];
    let pos = anchor.getEnd();
    const trailingComma = text.slice(pos).match(/^\s*,/);
    if (trailingComma) pos += trailingComma[0].length;
    // The anchor has a comma whenever more items follow it (or the file uses trailing commas),
    // and then the new item needs one too.
    const before = trailingComma ? '' : ',';
    const after = trailingComma ? ',' : '';

    if (multiLine) {
      const indent = indentAt(items[0].getStart());
      splice(pos, pos, `${before}\n${indent}${reindent(code, indent)}${after}`);
    } else {
      splice(pos, pos, `${before} ${code}${after}`);
    }
  }

  function removeItem(arr: ts.ArrayLiteralExpression, element: ts.Expression) {
    const idx = arr.elements.indexOf(element);
    let start = element.getStart();
    let end = element.getEnd();

    if (isMultiLine(arr)) {
      // Remove the whole line: from the preceding newline to the end of the trailing comma.
      start = text.lastIndexOf('\n', start);
      end += text.slice(end).match(/^\s*,/)?.[0].length ?? 0;
    } else if (idx < arr.elements.length - 1) {
      // Not the last element — consume the trailing comma+space.
      end += text.slice(end).match(/^,\s*/)?.[0].length ?? 0;
    } else if (idx > 0) {
      // Last element (not the only one) — consume the preceding comma+space.
      start -= text.slice(0, start).match(/,\s*$/)?.[0].length ?? 0;
    }
    splice(start, end, '');
  }

  function hasImport(moduleSpecifier: string) {
    return parse().statements.some(
      (s) =>
        ts.isImportDeclaration(s) &&
        ts.isStringLiteral(s.moduleSpecifier) &&
        s.moduleSpecifier.text === moduleSpecifier,
    );
  }

  // contains / add / replace / remove for a top-level array property of the config.
  function arrayProp(propName: string) {
    const findElement = (arr: ts.ArrayLiteralExpression | undefined, substring: string) =>
      arr?.elements.find((element) => nodeText(element).includes(substring));

    return {
      contains(substring: string) {
        const arr = findArray(propName);
        return arr ? nodeText(arr).includes(substring) : false;
      },

      add(expression: string) {
        const arr = findArray(propName);
        if (arr) {
          insertItem(arr, expression);
        } else {
          insertItem(requireConfigObject(), `${propName}: [\n  ${reindent(expression, '  ')},\n]`);
        }
      },

      replace(substring: string, expression: string) {
        const element = findElement(findArray(propName), substring);
        if (!element) return false;
        splice(
          element.getStart(),
          element.getEnd(),
          reindent(expression, indentAt(element.getStart())),
        );
        return true;
      },

      remove(substring: string) {
        const arr = findArray(propName);
        const element = findElement(arr, substring);
        if (!arr || !element) return false;
        removeItem(arr, element);
        return true;
      },
    };
  }

  const outputTargets = arrayProp('outputTargets');
  const plugins = arrayProp('plugins');

  return {
    hasImport,

    addImport(moduleSpecifier, namedImports) {
      if (hasImport(moduleSpecifier)) return;

      const lastImport = parse().statements.filter(ts.isImportDeclaration).pop();
      const decl = `import { ${namedImports.join(', ')} } from '${moduleSpecifier}';`;
      if (lastImport) {
        splice(lastImport.getEnd(), lastImport.getEnd(), `\n${decl}`);
      } else {
        text = `\n${decl}\n${text}`;
      }
    },

    outputTargetsContains: outputTargets.contains,
    addOutputTarget: outputTargets.add,
    replaceOutputTarget: outputTargets.replace,
    removeOutputTarget: outputTargets.remove,

    pluginsContains: plugins.contains,
    addPlugin: plugins.add,
    replacePlugin: plugins.replace,
    removePlugin: plugins.remove,

    setProperty(name, expression) {
      const configObj = requireConfigObject();

      const existing = findProp(configObj, name);
      if (existing) {
        splice(existing.initializer.getStart(), existing.initializer.getEnd(), expression);
        return;
      }

      // After `namespace` when there is one, otherwise last.
      insertItem(configObj, `${name}: ${expression}`, findProp(configObj, 'namespace'));
    },

    async save() {
      await writeFile(configPath, text, 'utf8');
    },
  };
}
