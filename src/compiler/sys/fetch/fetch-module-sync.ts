import { isString } from '@utils';

import type * as d from '../../../declarations';
import { InMemoryFileSystem } from '../in-memory-fs';
import { known404Urls } from './fetch-utils';
import { skipFilePathFetch, skipUrlFetch } from './fetch-utils';
import { writeFetchSuccessSync } from './write-fetch-success';

export const fetchModuleSync = (
  sys: d.CompilerSystem,
  inMemoryFs: InMemoryFileSystem,
  pkgVersions: Map<string, string>,
  url: string,
  filePath: string,
) => {
  if (skipFilePathFetch(filePath)) {
    return undefined;
  }

  const content = fetchUrlSync(url);
  if (isString(content)) {
    writeFetchSuccessSync(sys, inMemoryFs, url, filePath, content, pkgVersions);
  }

  return content;
};

export const fetchUrlSync = (url: string) => {
  if (known404Urls.has(url) || skipUrlFetch(url)) {
    return undefined;
  }

  try {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);

    if (xhr.status >= 200 && xhr.status <= 299) {
      return xhr.responseText;
    }
  } catch (e) {}

  known404Urls.add(url);

  return undefined;
};
