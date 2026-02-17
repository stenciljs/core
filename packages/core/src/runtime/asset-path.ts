import { plt, win } from 'virtual:platform';

export const getAssetPath = (path: string) => {
  const base = plt.$resourcesUrl$ || new URL('.', import.meta.url).href;
  const assetUrl = new URL(path, base);
  return assetUrl.origin !== win.location.origin ? assetUrl.href : assetUrl.pathname;
};

export const setAssetPath = (path: string) => (plt.$resourcesUrl$ = path);