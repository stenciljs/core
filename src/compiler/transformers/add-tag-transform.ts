import ts from 'typescript';
import type * as d from '../../declarations';
import { getModuleFromSourceFile } from './transform-utils';
import { addCoreRuntimeApi, RUNTIME_APIS } from './core-runtime-apis';
import { parse, SelectorType, stringify } from 'css-what';

export const addTagTransform = (
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
): ts.TransformerFactory<ts.SourceFile> => {
  return (transformCtx) => {
    return (tsSourceFile) => {
      const moduleFile = getModuleFromSourceFile(compilerCtx, tsSourceFile);
      addCoreRuntimeApi(moduleFile, RUNTIME_APIS.transformTag);
      const tagNames = buildCtx.components.map((cmp) => cmp.tagName);

      const visitNode = (node: ts.Node): any => {
        let newNode: ts.Node = node;

        // turns `element.querySelector("my-tag")` into `element.querySelector(`${transformTag("my-tag")}`)`
        if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
          const methodName = node.expression.name.text;

          if (
            (methodName === 'querySelector' || methodName === 'querySelectorAll' || methodName === 'createElement') &&
            node.arguments.length > 0
          ) {
            const selectorArgument = node.arguments[0];

            if (ts.isStringLiteral(selectorArgument)) {
              const selectorText = selectorArgument.text;
              const parsed = parse(selectorText); // from "css-what"

              let modified = false;

              const transformedSelectors = parsed.map((subSelector) => {
                return subSelector.map((token) => {
                  if (token.type === SelectorType.Tag && tagNames.includes(token.name)) {
                    modified = true;
                    // Replace tag name with `${transformTag("tag")}`
                    return {
                      ...token,
                      name: `\${transformTag("${token.name}")}`,
                    };
                  }
                  return token;
                });
              });

              if (modified) {
                // Reconstruct the selector string, now containing embedded template pieces
                const selectorWithTemplates = stringify(transformedSelectors);

                // Split selector into static + dynamic template parts
                // e.g. "div > ${transformTag("my-tag")} + ${transformTag("other-tag")}"
                const templateRegex = /\$\{([^}]+)\}/g;
                const parts: (string | ts.Expression)[] = [];

                let lastIndex = 0;
                let match: RegExpExecArray | null;

                while ((match = templateRegex.exec(selectorWithTemplates))) {
                  const before = selectorWithTemplates.slice(lastIndex, match.index);
                  if (before) parts.push(before);
                  parts.push(ts.factory.createIdentifier(match[1].trim())); // expression inside ${...}
                  lastIndex = match.index + match[0].length;
                }

                const after = selectorWithTemplates.slice(lastIndex);
                if (after) parts.push(after);

                // Convert to template literal: `...${...}...`
                const templateHead = ts.factory.createTemplateHead(typeof parts[0] === 'string' ? parts[0] : '');

                const templateSpans: ts.TemplateSpan[] = [];
                for (let i = 1; i < parts.length; i += 2) {
                  const expr = parts[i] as ts.Expression;
                  const text = parts[i + 1] as string | undefined;
                  templateSpans.push(
                    ts.factory.createTemplateSpan(
                      expr,
                      i + 1 >= parts.length
                        ? ts.factory.createTemplateTail(text || '')
                        : ts.factory.createTemplateMiddle(text || ''),
                    ),
                  );
                }

                const templateExpr = ts.factory.createTemplateExpression(templateHead, templateSpans);

                // Replace the argument with the new template expression
                newNode = ts.factory.updateCallExpression(node, node.expression, node.typeArguments, [
                  templateExpr,
                  ...node.arguments.slice(1),
                ]);
              }
            }
          }
        }

        // turns `"my-tag"` into `transformTag("my-tag")`
        if (ts.isStringLiteral(node)) {
          const tagName = node.text;
          if (tagNames.some((tag) => tag.toUpperCase() === tagName)) {
            // Replace "tagName" with transformTag("tagName")
            const transformedTagCall = ts.factory.createCallExpression(
              ts.factory.createIdentifier('transformTag'),
              undefined,
              [ts.factory.createStringLiteral(tagName)],
            );

            return transformedTagCall;
          }
        }

        // turns `customElements.get("my-tag")` into `customElements.get(transformTag("my-tag"))`
        if (ts.isCallExpression(node)) {
          const expression = node.expression;
          if (
            ts.isPropertyAccessExpression(expression) &&
            (expression.name.text === 'get' || expression.name.text === 'define') &&
            ts.isIdentifier(expression.expression) &&
            expression.expression.text === 'customElements'
          ) {
            const [firstArg, ...restArgs] = node.arguments;
            if (firstArg) {
              // Wrap the argument in transformTag(...)
              const newFirstArg = ts.factory.createCallExpression(
                ts.factory.createIdentifier('transformTag'),
                undefined,
                [firstArg],
              );

              newNode = ts.factory.updateCallExpression(node, node.expression, node.typeArguments, [
                newFirstArg,
                ...restArgs,
              ]);
            }
          }
        }

        return ts.visitEachChild(newNode, visitNode, transformCtx);
      };

      tsSourceFile = ts.visitEachChild(tsSourceFile, visitNode, transformCtx);

      return tsSourceFile;
    };
  };
};
