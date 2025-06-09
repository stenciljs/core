import { DEFAULT_STYLE_MODE, join, normalizePath, relative } from '@utils';
import { dirname, isAbsolute } from 'path';

import type * as d from '../../declarations';

export const normalizeStyles = (tagName: string, componentFilePath: string, styles: d.StyleCompiler[]) => {
  styles.forEach((style) => {
    if (style.modeName === DEFAULT_STYLE_MODE) {
      style.styleId = tagName.toUpperCase();
    } else {
      style.styleId = `${tagName.toUpperCase()}#${style.modeName}`;
    }

    if (Array.isArray(style.externalStyles)) {
      style.externalStyles.forEach((externalStyle) => {
        normalizeExternalStyle(componentFilePath, externalStyle);
      });
    }
  });
};

const normalizeExternalStyle = (componentFilePath: string, externalStyle: d.ExternalStyleCompiler) => {
  if (
    typeof externalStyle.originalComponentPath !== 'string' ||
    externalStyle.originalComponentPath.trim().length === 0
  ) {
    return;
  }

  // get the absolute path of the directory which the component is sitting in
  const componentDir = dirname(componentFilePath);

  if (isAbsolute(externalStyle.originalComponentPath)) {
    // this path is absolute already!
    // add to our list of style absolute paths
    externalStyle.absolutePath = normalizePath(externalStyle.originalComponentPath);

    // if this is an absolute path already, let's convert it to be relative
    externalStyle.relativePath = normalizePath(relative(componentDir, externalStyle.originalComponentPath));
  } else {
    // this path is relative to the component
    // add to our list of style relative paths
    externalStyle.relativePath = normalizePath(externalStyle.originalComponentPath);

    // create the absolute path to the style file
    externalStyle.absolutePath = normalizePath(join(componentDir, externalStyle.originalComponentPath));
  }
};
