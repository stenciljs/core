import { dashToPascalCase, DEFAULT_STYLE_MODE } from '@utils';
import { scopeCss } from '@utils/shadow-css';
import ts from 'typescript';

import type * as d from '../../declarations';
import { getScopeId } from '../style/scope-css';
import { addTagTransformToCssTsAST, createStaticGetter, getExternalStyles } from './transform-utils';

interface StyleIdentifierOptions {
  separateStyles?: boolean;
}

/**
 * Adds static "style" getter within the class
 * ```typescript
 * const MyComponent = class {
 *   static get style() { return "styles"; }
 * }
 * ```
 * @param classMembers a class to existing members of a class. **this parameter will be mutated** rather than returning
 * a cloned version
 * @param cmp the metadata associated with the component being evaluated
 * @param buildCtx the current build context
 */
export const addStaticStyleGetterWithinClass = (
  classMembers: ts.ClassElement[],
  cmp: d.ComponentCompilerMeta,
  buildCtx: d.BuildCtx,
): void => {
  const styleLiteral = getStyleLiteral(cmp, buildCtx);
  if (styleLiteral) {
    classMembers.push(createStaticGetter('style', styleLiteral));
    const sourceMapLiteral = createStyleSourceMapLiteral(cmp, buildCtx);
    if (sourceMapLiteral) {
      classMembers.push(createStaticGetter('sourceMap', sourceMapLiteral));
    }
  }
};

/**
 * Adds static "style" property to the class variable.
 *
 * ```typescript
 * const MyComponent = class {}
 * MyComponent.style = "styles";
 * ```
 *
 * @param styleStatements a list of statements containing style assignments to a class
 * @param cmp the metadata associated with the component being evaluated
 * @param buildCtx the current build context
 */
export const addStaticStylePropertyToClass = (
  styleStatements: ts.Statement[],
  cmp: d.ComponentCompilerMeta,
  buildCtx: d.BuildCtx,
): void => {
  const styleLiteral = getStyleLiteral(cmp, buildCtx);
  if (styleLiteral) {
    const statement = ts.factory.createExpressionStatement(
      ts.factory.createAssignment(
        ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(cmp.componentClassName), 'style'),
        styleLiteral,
      ),
    );
    styleStatements.push(statement);

    const sourceMapLiteral = createStyleSourceMapLiteral(cmp, buildCtx);
    if (sourceMapLiteral) {
      styleStatements.push(
        ts.factory.createExpressionStatement(
          ts.factory.createAssignment(
            ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(cmp.componentClassName), 'sourceMap'),
            sourceMapLiteral,
          ),
        ),
      );
    }
  }
};

export const createStyleSourceMapLiteral = (cmp: d.ComponentCompilerMeta, buildCtx: d.BuildCtx) => {
  if (!buildCtx.config.sourceMapCss) {
    return null;
  }

  const sourceMapModes: ts.ObjectLiteralElementLike[] = [];
  cmp.styles.forEach((style) => {
    if (Array.isArray(style.externalStyles) && style.externalStyles.length > 0) {
      const identifiers = style.sourceMapIdentifiers || [];
      if (identifiers.length === 0) {
        return;
      }
      const value =
        identifiers.length === 1
          ? ts.factory.createIdentifier(identifiers[0])
          : ts.factory.createArrayLiteralExpression(
              identifiers.map((identifier) => ts.factory.createIdentifier(identifier)),
            );
      sourceMapModes.push(ts.factory.createPropertyAssignment(style.modeName, value));
    } else if (typeof style.styleIdentifier === 'string') {
      const sourceMapIdentifier = `${style.styleIdentifier}SourceMap`;
      style.sourceMapIdentifiers = [sourceMapIdentifier];
      sourceMapModes.push(
        ts.factory.createPropertyAssignment(style.modeName, ts.factory.createIdentifier(sourceMapIdentifier)),
      );
    }
  });

  if (sourceMapModes.length === 0) {
    return null;
  }
  if (sourceMapModes.length === 1 && cmp.styles.length === 1 && cmp.styles[0].modeName === DEFAULT_STYLE_MODE) {
    return (sourceMapModes[0] as ts.PropertyAssignment).initializer;
  }
  return ts.factory.createObjectLiteralExpression(sourceMapModes, true);
};

const getStyleLiteral = (cmp: d.ComponentCompilerMeta, buildCtx: d.BuildCtx) => {
  if (Array.isArray(cmp.styles) && cmp.styles.length > 0) {
    if (cmp.styles.length > 1 || (cmp.styles.length === 1 && cmp.styles[0].modeName !== DEFAULT_STYLE_MODE)) {
      // multiple style modes
      return getMultipleModeStyle(cmp, cmp.styles, buildCtx);
    } else {
      // single style
      return getSingleStyle(cmp, cmp.styles[0], buildCtx);
    }
  }
  return null;
};

const getMultipleModeStyle = (cmp: d.ComponentCompilerMeta, styles: d.StyleCompiler[], buildCtx: d.BuildCtx) => {
  const styleModes: ts.ObjectLiteralElementLike[] = [];

  styles.forEach((style) => {
    /**
     * the order of these if statements must match with
     * - {@link src/compiler/transformers/component-native/native-static-style.ts#addSingleStyleGetter}
     * - {@link src/compiler/transformers/component-native/native-static-style.ts#addMultipleModeStyleGetter}
     * - {@link src/compiler/transformers/add-static-style.ts#getMultipleModeStyle}
     */
    if (typeof style.styleStr === 'string') {
      // inline the style string
      // static get style() { return { ios: "string" }; }
      const styleLiteral = createStyleLiteral(cmp, style, buildCtx);
      const propStr = ts.factory.createPropertyAssignment(style.modeName, styleLiteral);
      styleModes.push(propStr);
    } else if (Array.isArray(style.externalStyles) && style.externalStyles.length > 0) {
      // import generated from @Component() styleUrls option
      // import myTagIosStyle from './import-path.css';
      // static get style() { return { ios: myTagIosStyle }; }
      const styleUrlIdentifier = createStyleIdentifier(cmp, style, { separateStyles: buildCtx.config.sourceMapCss });
      const propUrlIdentifier = ts.factory.createPropertyAssignment(style.modeName, styleUrlIdentifier);
      styleModes.push(propUrlIdentifier);
    } else if (typeof style.styleIdentifier === 'string') {
      // direct import already written in the source code
      // import myTagIosStyle from './import-path.css';
      // static get style() { return { ios: myTagIosStyle }; }
      const styleIdentifier = ts.factory.createIdentifier(style.styleIdentifier);
      const propIdentifier = ts.factory.createPropertyAssignment(style.modeName, styleIdentifier);
      styleModes.push(propIdentifier);
    }
  });

  return ts.factory.createObjectLiteralExpression(styleModes, true);
};

const getSingleStyle = (cmp: d.ComponentCompilerMeta, style: d.StyleCompiler, buildCtx: d.BuildCtx) => {
  /**
   * the order of these if statements must match with
   * - {@link src/compiler/transformers/component-native/native-static-style.ts#addSingleStyleGetter}
   * - {@link src/compiler/transformers/component-native/native-static-style.ts#addMultipleModeStyleGetter}
   * - {@link src/compiler/transformers/add-static-style.ts#getSingleStyle}
   */
  if (typeof style.styleStr === 'string') {
    // inline the style string
    // static get style() { return "string"; }
    return createStyleLiteral(cmp, style, buildCtx);
  }

  if (Array.isArray(style.externalStyles) && style.externalStyles.length > 0) {
    // import generated from @Component() styleUrls option
    // import myTagStyle from './import-path.css';
    // static get style() { return myTagStyle; }
    return createStyleIdentifier(cmp, style, { separateStyles: buildCtx.config.sourceMapCss });
  }

  if (typeof style.styleIdentifier === 'string') {
    // direct import already written in the source code
    // import myTagStyle from './import-path.css';
    // static get style() { return myTagStyle; }
    return ts.factory.createIdentifier(style.styleIdentifier);
  }

  return null;
};

const addTagTransform = (cssCode: string, buildCtx: d.BuildCtx) => {
  if (!buildCtx.config.extras.additionalTagTransformers) {
    return ts.factory.createNoSubstitutionTemplateLiteral(cssCode);
  }
  const tagNames = buildCtx.components.map((c) => c.tagName);
  return addTagTransformToCssTsAST(cssCode, tagNames);
};

const createStyleLiteral = (cmp: d.ComponentCompilerMeta, style: d.StyleCompiler, buildCtx: d.BuildCtx) => {
  if (cmp.encapsulation === 'scoped') {
    // scope the css first
    const scopeId = getScopeId(cmp.tagName, style.modeName);
    return addTagTransform(scopeCss(style.styleStr, scopeId, false), buildCtx);
  }

  return addTagTransform(style.styleStr, buildCtx);
};

/**
 * Helper method to create a style identifier for a component. The method
 * ensures that duplicate styles are removed and that the order of the styles is
 * preserved. It also ensures that the style identifier is unique.
 *
 * @param cmp the metadata associated with the component being evaluated
 * @param style style meta data
 * @param options controls whether each external style remains a separate runtime entry
 * @returns an expression to be applied to the `style` property of a component class
 */
export const createStyleIdentifier = (
  cmp: d.ComponentCompilerMeta,
  style: d.StyleCompiler,
  options: StyleIdentifierOptions = {},
) => {
  const separateStyles = options.separateStyles === true;
  const externalStyles = getExternalStyles(style);
  /**
   * Set a styleIdentifier which will be propagated to the component and
   * later picked up by rollup when it injects the parsed CSS directly into
   * the component, see `compilerCtx.worker.transformCssToEsm` in
   * `src/compiler/bundle/ext-transforms-plugin.ts`
   */
  style.styleIdentifier = dashToPascalCase(cmp.tagName.charAt(0).toLowerCase() + cmp.tagName.substring(1));
  if (style.modeName !== DEFAULT_STYLE_MODE) {
    style.styleIdentifier += dashToPascalCase(style.modeName);
  }
  style.styleIdentifier += 'Style';
  if (separateStyles) {
    style.sourceMapIdentifiers = Object.keys(externalStyles).map(
      (externalStyleId) => `${style.styleIdentifier}SourceMap${externalStyleId}`,
    );
  }
  return createIdentifierFromStyleIdentifier(style.styleIdentifier, Object.keys(externalStyles), options);
};

/**
 * Creates an expression to be assigned to the `style` property of a component class. For example
 * given the following component:
 *
 * ```ts
 * @Component({
 *  styleUrls: ['my-component.css', 'my-component.ios.css']
 *  tag: 'cmp',
 * })
 * export class MyComponent {
 *   // ...
 * }
 * ```
 *
 * it would generate the following expression:
 *
 * ```ts
 * import MyComponentStyle0 from './my-component.css';
 * import MyComponentStyle1 from './my-component.ios.css';
 * export class MyComponent {
 *   // ...
 * }
 * MyComponent.style = [MyComponentStyle0(), MyComponentStyle1()];
 * ```
 *
 * Note: style imports are made in [`createEsmStyleImport`](src/compiler/transformers/style-imports.ts).
 *
 * @param styleIdentifier identifier to be used for the style
 * @param externalStyleIds numeric ids of the external styles
 * @param options controls whether each external style remains a separate runtime entry
 * @returns an expression to be assigned to the `style` property of a component class
 */
const createIdentifierFromStyleIdentifier = (
  styleIdentifier: string,
  externalStyleIds: string[],
  options: StyleIdentifierOptions = {},
): ts.CallExpression | ts.ArrayLiteralExpression | ts.BinaryExpression => {
  const separateStyles = options.separateStyles === true;
  const id = externalStyleIds[0];

  if (externalStyleIds.length === 1) {
    return ts.factory.createCallExpression(ts.factory.createIdentifier(styleIdentifier + id), undefined, []);
  }

  if (!separateStyles) {
    return ts.factory.createBinaryExpression(
      createIdentifierFromStyleIdentifier(styleIdentifier, [id]),
      ts.SyntaxKind.PlusToken,
      createIdentifierFromStyleIdentifier(styleIdentifier, externalStyleIds.slice(1)),
    );
  }

  return ts.factory.createArrayLiteralExpression(
    externalStyleIds.map((externalStyleId) =>
      ts.factory.createCallExpression(ts.factory.createIdentifier(styleIdentifier + externalStyleId), undefined, []),
    ),
  );
};
