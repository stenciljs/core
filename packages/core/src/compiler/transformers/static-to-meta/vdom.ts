import ts from 'typescript';

import type * as d from '../../../declarations';

export const gatherVdomMeta = (m: d.Module | d.ComponentCompilerMeta, args: ts.NodeArray<ts.Expression>) => {
  m.hasVdomRender = true;

  // Parse vdom tag
  const hTag = args[0];
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
          if (attrName === 'part' && ts.isPropertyAssignment(prop) && ts.isStringLiteral(prop.initializer)) {
            m.htmlParts.push(
              ...prop.initializer.text
                .toLowerCase()
                .split(' ')
                .filter((part) => part.length > 0),
            );
          }
          m.htmlAttrNames.push(attrName);
        }
      });
    }
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
