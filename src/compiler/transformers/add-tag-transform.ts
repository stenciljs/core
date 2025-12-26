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
        const isStringLiteralLike = (expr: ts.Expression): expr is ts.StringLiteral | ts.NoSubstitutionTemplateLiteral =>
          ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr);

        // turns `element.querySelector("my-tag")` into `element.querySelector(`${transformTag("my-tag")}`)`
        if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
          const methodName = node.expression.name.text;

          if (
            (methodName === 'querySelector' || methodName === 'querySelectorAll' || methodName === 'closest') &&
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
                      ts.factory.createIdentifier(TRANSFORM_TAG),
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

        // turns `customElements.get("my-tag")` into `customElements.get(transformTag("my-tag"))`

        if (ts.isCallExpression(node)) {
          const expression = node.expression;
          if (
            ts.isPropertyAccessExpression(expression) && // customElements.get / define / whenDefined
            (((expression.name.text === 'get' ||
              expression.name.text === 'define' ||
              expression.name.text === 'whenDefined') &&
              ts.isIdentifier(expression.expression) &&
              expression.expression.text === 'customElements') ||
              // document.createElement
              (expression.name.text === 'createElement' &&
                ts.isIdentifier(expression.expression) &&
                expression.expression.text === 'document'))
          ) {
            const [firstArg, ...restArgs] = node.arguments;
            if (firstArg) {
              // For literal tags passed directly to customElements.* or document.createElement,
              // leave them unchanged to keep the public-facing tag stable. Non-literals still get wrapped.
              const newFirstArg = isStringLiteralLike(firstArg)
                ? firstArg
                : ts.factory.createCallExpression(ts.factory.createIdentifier(TRANSFORM_TAG), undefined, [firstArg]);

              newNode = ts.factory.updateCallExpression(node, node.expression, node.typeArguments, [
                newFirstArg,
                ...restArgs,
              ]);
            }
          } else {
            node.expression;
          }
        }

        // turns el.tagName === 'my-tag' into el.tagName === transformTag('my-tag')
        // or 'my-tag' == elTag into transformTag('my-tag') == elTag
        // ... this feels like a bit much?

        // if (ts.isBinaryExpression(node)) {
        //   const { left, right, operatorToken } = node;
        //   const stringLiteral = ts.isStringLiteral(left) ? left : ts.isStringLiteral(right) ? right : null;

        //   if (stringLiteral && tagNames.includes(stringLiteral.text)) {
        //     const transformedLiteral = ts.factory.createCallExpression(
        //       ts.factory.createIdentifier(TRANSFORM_TAG),
        //       undefined,
        //       [ts.factory.createStringLiteral(stringLiteral.text)],
        //     );

        //     let newLeft = left;
        //     let newRight = right;

        //     if (stringLiteral === left) {
        //       newLeft = transformedLiteral;
        //     } else {
        //       newRight = transformedLiteral;
        //     }

        //     newNode = ts.factory.updateBinaryExpression(node, newLeft, operatorToken, newRight);
        //   }
        // }

        return ts.visitEachChild(newNode, visitNode, transformCtx);
      };

      tsSourceFile = ts.visitEachChild(tsSourceFile, visitNode, transformCtx);

      return tsSourceFile;
    };
  };
};
