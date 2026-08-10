import ts from 'typescript';

import type * as d from '../../../declarations';

/**
 * Attempt to resolve an expression to a statically-known string value.
 * Handles plain string literals directly. For anything else, falls back to the type checker.
 *
 * @param expr the expression to resolve
 * @param typeChecker the type checker for the program being compiled, if available
 * @returns the statically-known string value, or `undefined` if it can't be determined
 */
const resolveStaticStringValue = (expr: ts.Expression, typeChecker?: ts.TypeChecker): string | undefined => {
  if (ts.isStringLiteralLike(expr)) {
    return expr.text;
  }
  if (typeChecker) {
    const type = typeChecker.getTypeAtLocation(expr);
    if (type.isStringLiteral()) {
      return type.value;
    }
  }
  return undefined;
};

export const gatherVdomMeta = (
  m: d.Module | d.ComponentCompilerMeta,
  args: ts.NodeArray<ts.Expression>,
  typeChecker?: ts.TypeChecker,
) => {
  m.hasVdomRender = true;

  // Parse vdom tag
  const hTag = args[0];
  const isSlotTag = ts.isStringLiteral(hTag) && hTag.text === 'slot';
  if (!ts.isStringLiteral(hTag) && (!ts.isIdentifier(hTag) || hTag.text !== 'Host')) {
    m.hasVdomFunctional = true;
  }

  // Parse attributes
  if (args.length > 1) {
    const objectLiteral = args[1];
    if (ts.isCallExpression(objectLiteral) || ts.isIdentifier(objectLiteral)) {
      m.hasVdomAttribute = true;
      m.hasVdomClass = true;
      m.hasVdomKey = true;
      m.hasVdomListener = true;
      m.hasVdomPropOrAttr = true;
      m.hasVdomRef = true;
      m.hasVdomStyle = true;
      m.hasVdomXlink = true;
    } else if (ts.isObjectLiteralExpression(objectLiteral)) {
      let slotName: string | undefined;
      let hasDynamicSlotName = false;
      objectLiteral.properties.forEach((prop) => {
        m.hasVdomAttribute = true;
        if (ts.isSpreadAssignment(prop) || ts.isComputedPropertyName(prop.name)) {
          m.hasVdomClass = true;
          m.hasVdomKey = true;
          m.hasVdomListener = true;
          m.hasVdomPropOrAttr = true;
          m.hasVdomRef = true;
          m.hasVdomStyle = true;
          m.hasVdomXlink = true;
          hasDynamicSlotName = isSlotTag || hasDynamicSlotName;
        } else if (prop.name && (prop.name as any).text && (prop.name as any).text.length > 0) {
          const attrName = (prop.name as any).text;
          if (attrName === 'key') {
            m.hasVdomKey = true;
          } else if (attrName === 'ref') {
            m.hasVdomRef = true;
          } else if (attrName === 'class' || attrName === 'className') {
            m.hasVdomClass = true;
          } else if (attrName === 'style') {
            m.hasVdomStyle = true;
          } else if (/^on(-|[A-Z])/.test(attrName)) {
            m.hasVdomListener = true;
          } else if (attrName.startsWith('xlink')) {
            m.hasVdomXlink = true;
            m.hasVdomPropOrAttr = true;
          } else {
            m.hasVdomPropOrAttr = true;
          }
          ts.SyntaxKind.StringLiteral;
          if (attrName === 'part' && ts.isPropertyAssignment(prop)) {
            const partValue = resolveStaticStringValue(prop.initializer, typeChecker);
            if (partValue !== undefined) {
              m.htmlParts.push(...partValue.split(' ').filter((part) => part.length > 0));
            }
          }
          if (isSlotTag && attrName === 'name' && ts.isPropertyAssignment(prop)) {
            const resolvedSlotName = resolveStaticStringValue(prop.initializer, typeChecker);
            if (resolvedSlotName !== undefined) {
              slotName = resolvedSlotName;
            } else {
              hasDynamicSlotName = true;
            }
          }
          m.htmlAttrNames.push(attrName);
        }
      });
      if (isSlotTag && !hasDynamicSlotName) {
        m.htmlSlots.push(slotName ?? '');
      }
    } else if (isSlotTag) {
      // e.g. `h('slot', null)`, no attributes to derive a name from
      m.htmlSlots.push('');
    }
  } else if (isSlotTag) {
    // e.g. `h('slot')`, no attributes argument at all
    m.htmlSlots.push('');
  }

  // Parse children
  if (!m.hasVdomText) {
    for (let i = 2; i < args.length; i++) {
      const arg = args[i];
      if (!ts.isCallExpression(arg) || !ts.isIdentifier(arg.expression) || arg.expression.text !== 'h') {
        m.hasVdomText = true;
        break;
      }
    }
  }
};
