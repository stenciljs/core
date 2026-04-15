import { basename, dirname, extname } from 'path';
import ts from 'typescript';
import type * as d from '@stencil/core';

import { DEFAULT_STYLE_MODE, join } from '../../../utils';
import { ConvertIdentifier, convertValueToLiteral, createStaticGetter } from '../transform-utils';

export const styleToStatic = (
  newMembers: ts.ClassElement[],
  componentOptions: d.ComponentOptions,
  sourceFile?: ts.SourceFile,
  transformOpts?: d.TransformOptions,
) => {
  const defaultModeStyles: string[] = [];

  if (componentOptions.styleUrls) {
    if (Array.isArray(componentOptions.styleUrls)) {
      defaultModeStyles.push(...normalizeStyleUrl(componentOptions.styleUrls));
    } else {
      defaultModeStyles.push(...normalizeStyleUrl(componentOptions.styleUrls[DEFAULT_STYLE_MODE]));
    }
  }

  if (componentOptions.styleUrl) {
    defaultModeStyles.push(...normalizeStyleUrl(componentOptions.styleUrl));
  }

  let styleUrls: d.CompilerModeStyles = {};
  if (componentOptions.styleUrls && !Array.isArray(componentOptions.styleUrls)) {
    styleUrls = normalizeStyleUrls(componentOptions.styleUrls);
  }

  if (defaultModeStyles.length > 0) {
    styleUrls[DEFAULT_STYLE_MODE] = defaultModeStyles;
  }

  // When style: 'inline' is set and we have a resolver, read and inline the CSS
  const shouldInlineStyles =
    transformOpts?.style === 'inline' &&
    transformOpts?.resolveStyle &&
    sourceFile &&
    Object.keys(styleUrls).length > 0;

  // DEBUG
  if (process.env.DEBUG_INLINE_STYLES) {
    console.log('[styleToStatic] transformOpts?.style:', transformOpts?.style);
    console.log('[styleToStatic] has resolveStyle:', !!transformOpts?.resolveStyle);
    console.log('[styleToStatic] has sourceFile:', !!sourceFile);
    console.log('[styleToStatic] styleUrls keys:', Object.keys(styleUrls));
    console.log('[styleToStatic] shouldInlineStyles:', shouldInlineStyles);
  }

  if (shouldInlineStyles) {
    const containingFile = sourceFile.fileName;
    const resolveStyle = transformOpts.resolveStyle!;

    // Check if we have multiple modes
    const modes = Object.keys(styleUrls);
    const hasMultipleModes =
      modes.length > 1 || (modes.length === 1 && modes[0] !== DEFAULT_STYLE_MODE);

    if (hasMultipleModes) {
      // Multiple modes: create an object with mode -> css content
      const modeStyles: Record<string, string> = {};
      for (const mode of modes) {
        const urls = styleUrls[mode];
        const cssContents: string[] = [];
        for (const url of urls) {
          const cssPath = useCss(url);
          const content = resolveStyle(cssPath, containingFile);
          if (content != null) {
            cssContents.push(content);
          }
        }
        if (cssContents.length > 0) {
          modeStyles[mode] = cssContents.join('\n');
        }
      }
      if (Object.keys(modeStyles).length > 0) {
        newMembers.push(createStaticGetter('styles', convertValueToLiteral(modeStyles)));
      }
    } else {
      // Single mode (default): inline as a string
      const urls = styleUrls[DEFAULT_STYLE_MODE] || [];
      const cssContents: string[] = [];

      // DEBUG
      if (process.env.DEBUG_INLINE_STYLES) {
        console.log('[styleToStatic] Single mode - containingFile:', containingFile);
        console.log('[styleToStatic] Single mode - urls:', urls);
      }
      for (const url of urls) {
        const cssPath = useCss(url);
        const content = resolveStyle(cssPath, containingFile);

        // DEBUG
        if (process.env.DEBUG_INLINE_STYLES) {
          console.log('[styleToStatic] url:', url);
          console.log('[styleToStatic] cssPath:', cssPath);
          console.log('[styleToStatic] content:', content ? `(${content.length} chars)` : 'null');
        }

        if (content != null) {
          cssContents.push(content);
        }
      }
      if (cssContents.length > 0) {
        const combinedCss = cssContents.join('\n');
        // DEBUG
        if (process.env.DEBUG_INLINE_STYLES) {
          console.log('[styleToStatic] Adding styles getter with', combinedCss.length, 'chars');
        }
        newMembers.push(createStaticGetter('styles', ts.factory.createStringLiteral(combinedCss)));
      } else if (process.env.DEBUG_INLINE_STYLES) {
        console.log('[styleToStatic] NO cssContents to add!');
      }
    }
    // Don't add styleUrls when inlining - we've converted them to styles
    if (process.env.DEBUG_INLINE_STYLES) {
      console.log('[styleToStatic] Returning early after inline processing');
    }
    return;
  }

  // Normal path: add styleUrls for later resolution by bundler
  if (Object.keys(styleUrls).length > 0) {
    const originalStyleUrls = convertValueToLiteral(styleUrls);
    newMembers.push(createStaticGetter('originalStyleUrls', originalStyleUrls));

    const norlizedStyleExt = normalizeExtension(styleUrls);
    const normalizedStyleExp = convertValueToLiteral(norlizedStyleExt);
    newMembers.push(createStaticGetter('styleUrls', normalizedStyleExp));
  }

  if (typeof componentOptions.styles === 'string') {
    const styles = componentOptions.styles.trim();
    if (styles.length > 0) {
      // @Component({
      //   styles: ":host {...}"
      // })
      newMembers.push(createStaticGetter('styles', ts.factory.createStringLiteral(styles)));
    }
  } else if (componentOptions.styles) {
    const convertIdentifier = componentOptions.styles as any as ConvertIdentifier;
    if (convertIdentifier.__identifier) {
      // import styles from './styles.css';
      // @Component({
      //   styles
      // })
      const stylesIdentifier = convertIdentifier.__escapedText;
      newMembers.push(createStaticGetter('styles', ts.factory.createIdentifier(stylesIdentifier)));
    } else if (typeof convertIdentifier === 'object') {
      // import ios from './ios.css';
      // import md from './md.css';
      // @Component({
      //   styles: {
      //     ios
      //     md
      //   }
      // })
      if (Object.keys(convertIdentifier).length > 0) {
        newMembers.push(createStaticGetter('styles', convertValueToLiteral(convertIdentifier)));
      }
    }
  }
};

const normalizeExtension = (styleUrls: d.CompilerModeStyles) => {
  const compilerStyleUrls: d.CompilerModeStyles = {};
  Object.keys(styleUrls).forEach((key) => {
    compilerStyleUrls[key] = styleUrls[key].map((s) => useCss(s));
  });
  return compilerStyleUrls;
};

const useCss = (stylePath: string) => {
  const sourceFileDir = dirname(stylePath);
  const sourceFileExt = extname(stylePath);
  const sourceFileName = basename(stylePath, sourceFileExt);
  return join(sourceFileDir, sourceFileName + '.css');
};

const normalizeStyleUrls = (styleUrls: d.ModeStyles): d.CompilerModeStyles => {
  const compilerStyleUrls: d.CompilerModeStyles = {};
  Object.keys(styleUrls).forEach((key) => {
    compilerStyleUrls[key] = normalizeStyleUrl(styleUrls[key]);
  });
  return compilerStyleUrls;
};

const normalizeStyleUrl = (style: string | string[] | undefined) => {
  if (Array.isArray(style)) {
    return style;
  }
  if (style) {
    return [style];
  }
  return [];
};
