import ts from 'typescript';
import type * as d from '../../declarations';
import { getModuleFromSourceFile } from './transform-utils';
import { addCoreRuntimeApi, RUNTIME_APIS, TRANSFORM_TAG } from './core-runtime-apis';
import { parse, SelectorType, stringify } from 'css-what';

export const addTagTransform = (
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
): ts.TransformerFactory<ts.SourceFile> => {
  return (transformCtx) => {
    return (tsSourceFile) => {
      const moduleFile = getModuleFromSourceFile(compilerCtx, tsSourceFile);
      const tagNames = buildCtx.components.map((cmp) => cmp.tagName);

      addCoreRuntimeApi(moduleFile, RUNTIME_APIS.transformTag);

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
              const parsed = parse(selectorText); // from css-what

              const placeholders: string[] = [];
              let modified = false;

              // Replace tag tokens with placeholder tokens and record tag names
              const transformed = parsed.map((subSelector) =>
                subSelector.map((token) => {
                  if (token.type === SelectorType.Tag && tagNames.includes(token.name)) {
                    const idx = placeholders.length;
                    placeholders.push(token.name);
                    modified = true;
                    return { ...token, name: `___EXPR_${idx}___` }; // safe placeholder
                  }
                  return token;
                }),
              );

              if (modified) {
                // stringify will produce a selector like "div > ___EXPR_0___ + ___EXPR_1___[attr]"
                const selectorWithPlaceholders = stringify(transformed);

                // Split into [literal, idx, literal, idx, literal, ...]
                const splitParts = selectorWithPlaceholders.split(/___EXPR_(\d+)___/);

                // If no placeholders for whatever reason, fallback to original literal
                if (!splitParts || splitParts.length === 0) {
                  // fallback — keep original string literal
                  newNode = ts.factory.updateCallExpression(node, node.expression, node.typeArguments, [
                    ts.factory.createStringLiteral(selectorText),
                    ...node.arguments.slice(1),
                  ]);
                } else {
                  // Build TemplateExpression: head + spans
                  const firstLiteral = splitParts[0] ?? '';
                  const head = ts.factory.createTemplateHead(firstLiteral);

                  const spans: ts.TemplateSpan[] = [];
                  for (let i = 1; i < splitParts.length; i += 2) {
                    const idxStr = splitParts[i];
                    const literalAfter = splitParts[i + 1] ?? '';
                    const exprIndex = Number(idxStr);
                    const tagName = placeholders[exprIndex];

                    // transformTag("tagName")
                    const callExpr = ts.factory.createCallExpression(
                      ts.factory.createIdentifier('transformTag'),
                      undefined,
                      [ts.factory.createStringLiteral(tagName)],
                    );

                    const isLast = i + 1 >= splitParts.length - 1;
                    const literalNode = isLast
                      ? ts.factory.createTemplateTail(literalAfter)
                      : ts.factory.createTemplateMiddle(literalAfter);

                    spans.push(ts.factory.createTemplateSpan(callExpr, literalNode));
                  }

                  const templateExpr = ts.factory.createTemplateExpression(head, spans);

                  // Replace the original selector arg with the template expression
                  newNode = ts.factory.updateCallExpression(node, node.expression, node.typeArguments, [
                    templateExpr,
                    ...node.arguments.slice(1),
                  ]);
                }
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
              ts.factory.createIdentifier(TRANSFORM_TAG),
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
                ts.factory.createIdentifier(TRANSFORM_TAG),
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
