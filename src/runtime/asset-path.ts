import { plt, win } from '@platform';

export const getAssetPath = (path: string) => {
  const assetUrl = new URL(path, plt.$resourcesUrl$);
  return assetUrl.origin !== win.location.origin ? assetUrl.href : assetUrl.pathname;
};

export const setAssetPath = (path: string) => (plt.$resourcesUrl$ = path);
