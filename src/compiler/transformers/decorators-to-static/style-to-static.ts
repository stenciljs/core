import { DEFAULT_STYLE_MODE, join } from '@utils';
import { basename, dirname, extname } from 'path';
import ts from 'typescript';

import type * as d from '../../../declarations';
import { ConvertIdentifier, convertValueToLiteral, createStaticGetter } from '../transform-utils';

export const styleToStatic = (newMembers: ts.ClassElement[], componentOptions: d.ComponentOptions) => {
  const defaultModeStyles = [];

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
