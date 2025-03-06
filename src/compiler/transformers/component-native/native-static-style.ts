import { DEFAULT_STYLE_MODE } from '@utils';
import { scopeCss } from '@utils/shadow-css';
import ts from 'typescript';

import type * as d from '../../../declarations';
import { getScopeId } from '../../style/scope-css';
import { createStyleIdentifier } from '../add-static-style';
import { createStaticGetter } from '../transform-utils';

export const addNativeStaticStyle = (classMembers: ts.ClassElement[], cmp: d.ComponentCompilerMeta) => {
  if (Array.isArray(cmp.styles) && cmp.styles.length > 0) {
    if (cmp.styles.length > 1 || (cmp.styles.length === 1 && cmp.styles[0].modeName !== DEFAULT_STYLE_MODE)) {
      // multiple style modes
      addMultipleModeStyleGetter(classMembers, cmp, cmp.styles);
    } else {
      // single style
      addSingleStyleGetter(classMembers, cmp, cmp.styles[0]);
    }
  }
};

const addMultipleModeStyleGetter = (
  classMembers: ts.ClassElement[],
  cmp: d.ComponentCompilerMeta,
  styles: d.StyleCompiler[],
) => {
  const styleModes: ts.ObjectLiteralElementLike[] = [];

  styles.forEach((style) => {
    /**
     * the order of these if statements must match with
     * - {@link src/compiler/transformers/component-native/native-static-style.ts#addSingleStyleGetter}
     * - {@link src/compiler/transformers/add-static-style.ts#getSingleStyle}
     * - {@link src/compiler/transformers/add-static-style.ts#getMultipleModeStyle}
     */
    if (typeof style.styleStr === 'string') {
      // inline the style string
      // static get style() { return { "ios": "string" }; }
      const styleLiteral = createStyleLiteral(cmp, style);
      const propStr = ts.factory.createPropertyAssignment(style.modeName, styleLiteral);
      styleModes.push(propStr);
    } else if (Array.isArray(style.externalStyles) && style.externalStyles.length > 0) {
      // import generated from @Component() styleUrls option
      // import myTagIosStyle from './import-path.css';
      // static get style() { return { "ios": myTagIosStyle }; }
      const styleUrlIdentifier = createStyleIdentifier(cmp, style);
      const propUrlIdentifier = ts.factory.createPropertyAssignment(style.modeName, styleUrlIdentifier);
      styleModes.push(propUrlIdentifier);
    } else if (typeof style.styleIdentifier === 'string') {
      // direct import already written in the source code
      // import myTagIosStyle from './import-path.css';
      // static get style() { return { "ios": myTagIosStyle }; }
      const styleIdentifier = ts.factory.createIdentifier(style.styleIdentifier);
      const propIdentifier = ts.factory.createPropertyAssignment(style.modeName, styleIdentifier);
      styleModes.push(propIdentifier);
    }
  });

  const styleObj = ts.factory.createObjectLiteralExpression(styleModes, true);

  classMembers.push(createStaticGetter('style', styleObj));
};

const addSingleStyleGetter = (
  classMembers: ts.ClassElement[],
  cmp: d.ComponentCompilerMeta,
  style: d.StyleCompiler,
) => {
  /**
   * the order of these if statements must match with
   * - {@link src/compiler/transformers/component-native/native-static-style.ts#addMultipleModeStyleGetter}
   * - {@link src/compiler/transformers/add-static-style.ts#getSingleStyle}
   * - {@link src/compiler/transformers/add-static-style.ts#getMultipleModeStyle}
   */
  if (typeof style.styleStr === 'string') {
    // inline the style string
    // static get style() { return "string"; }
    const styleLiteral = createStyleLiteral(cmp, style);
    classMembers.push(createStaticGetter('style', styleLiteral));
  } else if (Array.isArray(style.externalStyles) && style.externalStyles.length > 0) {
    // import generated from @Component() styleUrls option
    // import myTagStyle from './import-path.css';
    // static get style() { return myTagStyle; }
    const styleUrlIdentifier = createStyleIdentifier(cmp, style);
    classMembers.push(createStaticGetter('style', styleUrlIdentifier));
  } else if (typeof style.styleIdentifier === 'string') {
    // direct import already written in the source code
    // import myTagStyle from './import-path.css';
    // static get style() { return myTagStyle; }
    const styleIdentifier = ts.factory.createIdentifier(style.styleIdentifier);
    classMembers.push(createStaticGetter('style', styleIdentifier));
  }
};

const createStyleLiteral = (cmp: d.ComponentCompilerMeta, style: d.StyleCompiler) => {
  if (cmp.encapsulation === 'scoped') {
    // scope the css first
    const scopeId = getScopeId(cmp.tagName, style.modeName);
    return ts.factory.createStringLiteral(scopeCss(style.styleStr, scopeId, false));
  }

  return ts.factory.createStringLiteral(style.styleStr);
};
