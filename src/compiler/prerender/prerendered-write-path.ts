import { join } from '@utils';
import path from 'path';

import type * as d from '../../declarations';

export const getWriteFilePathFromUrlPath = (manager: d.PrerenderManager, inputHref: string) => {
  const baseUrl = new URL(manager.outputTarget.baseUrl, manager.devServerHostUrl);
  const basePathname = baseUrl.pathname.toLowerCase();

  const inputUrl = new URL(inputHref, manager.devServerHostUrl);
  const inputPathname = inputUrl.pathname.toLowerCase();

  const basePathParts = basePathname.split('/');
  const inputPathParts = inputPathname.split('/');

  const isPrerrenderRoot = basePathname === inputPathname;

  let fileName: string;

  if (isPrerrenderRoot) {
    fileName = path.basename(manager.outputTarget.indexHtml);
  } else {
    fileName = 'index.html';
  }

  const pathParts: string[] = [];

  for (let i = 0; i < inputPathParts.length; i++) {
    const basePathPart = basePathParts[i];
    const inputPathPart = inputPathParts[i];

    if (typeof basePathPart === 'string' && basePathPart === inputPathPart) {
      continue;
    }

    if (i === inputPathParts.length - 1) {
      const lastPart = inputPathParts[i].toLowerCase();
      if (lastPart.endsWith('.html') || lastPart.endsWith('.htm')) {
        fileName = inputPathParts[i];
        break;
      }
    }

    pathParts.push(inputPathPart);
  }

  pathParts.push(fileName);

  // figure out the directory where this file will be saved
  return join(manager.outputTarget.appDir, ...pathParts);
};
