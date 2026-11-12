import { dirname, isAbsolute } from 'path';
import ts from 'typescript';
import type * as d from '@stencil/core';

import { DEFAULT_STYLE_MODE, join, normalizePath, sortBy } from '../../../utils';
import { normalizeStyles } from '../../style/normalize-styles';
import { ConvertIdentifier, getStaticValue } from '../transform-utils';

export const parseStaticStyles = (
  compilerCtx: d.CompilerCtx,
  tagName: string,
  componentFilePath: string,
  isCollectionDependency: boolean,
  staticMembers: ts.ClassElement[],
) => {
  const styles: d.StyleCompiler[] = [];
  const styleUrlsProp = isCollectionDependency ? 'styleUrls' : 'originalStyleUrls';
  const parsedStyleUrls = getStaticValue(staticMembers, styleUrlsProp) as d.CompilerModeStyles;

  let parsedStyle = getStaticValue(staticMembers, 'styles');

  if (parsedStyle) {
    if (typeof parsedStyle === 'string') {
      // styles: 'div { padding: 10px }'
      parsedStyle = parsedStyle.trim();
      if (parsedStyle.length > 0) {
        styles.push({
          modeName: DEFAULT_STYLE_MODE,
          styleId: null,
          styleStr: parsedStyle,
          styleIdentifier: null,
          externalStyles: [],
        });
        compilerCtx.styleModeNames.add(DEFAULT_STYLE_MODE);
      }
    } else if ((parsedStyle as ConvertIdentifier).__identifier) {
      styles.push(parseStyleIdentifier(parsedStyle, DEFAULT_STYLE_MODE));
      compilerCtx.styleModeNames.add(DEFAULT_STYLE_MODE);
    } else if (typeof parsedStyle === 'object') {
      Object.keys(parsedStyle).forEach((modeName) => {
        const parsedStyleMode = parsedStyle[modeName];
        if (typeof parsedStyleMode === 'string') {
          styles.push({
            modeName: modeName,
            styleId: null,
            styleStr: parsedStyleMode,
            styleIdentifier: null,
            externalStyles: [],
          });
        } else {
          styles.push(parseStyleIdentifier(parsedStyleMode, modeName));
        }
        compilerCtx.styleModeNames.add(modeName);
      });
    }
  }

  if (parsedStyleUrls && typeof parsedStyleUrls === 'object') {
    Object.keys(parsedStyleUrls).forEach((modeName) => {
      const externalStyles: d.ExternalStyleCompiler[] = [];
      const styleObj = parsedStyleUrls[modeName];
      styleObj.forEach((styleUrl) => {
        if (typeof styleUrl === 'string' && styleUrl.trim().length > 0) {
          externalStyles.push({
            absolutePath: null,
            relativePath: null,
            originalComponentPath: styleUrl.trim(),
          });
        }
      });

      if (externalStyles.length > 0) {
        const style: d.StyleCompiler = {
          modeName: modeName,
          styleId: null,
          styleStr: null,
          styleIdentifier: null,
          externalStyles: externalStyles,
        };

        styles.push(style);
        compilerCtx.styleModeNames.add(modeName);
      }
    });
  }

  normalizeStyles(tagName, componentFilePath, styles);

  return sortBy(styles, (s) => s.modeName);
};

export const parseGlobalStyles = (
  componentFilePath: string,
  staticMembers: ts.ClassElement[],
): d.ComponentGlobalStyle[] => {
  const globalStyles: d.ComponentGlobalStyle[] = [];

  const inlineStyle = getStaticValue(staticMembers, 'globalStyle');
  if (typeof inlineStyle === 'string' && inlineStyle.trim().length > 0) {
    globalStyles.push({ absolutePath: null, styleStr: inlineStyle.trim() });
  }

  const styleUrl = getStaticValue(staticMembers, 'originalGlobalStyleUrl') as string | undefined;
  if (typeof styleUrl === 'string' && styleUrl.trim().length > 0) {
    const url = styleUrl.trim();
    const componentDir = dirname(componentFilePath);
    const absolutePath = isAbsolute(url)
      ? normalizePath(url)
      : normalizePath(join(componentDir, url));
    globalStyles.push({ absolutePath, styleStr: null });
  }

  return globalStyles;
};

const parseStyleIdentifier = (parsedStyle: ConvertIdentifier, modeName: string) => {
  const style: d.StyleCompiler = {
    modeName: modeName,
    styleId: null,
    styleStr: null,
    styleIdentifier: parsedStyle.__escapedText,
    externalStyles: [],
  };
  return style;
};
