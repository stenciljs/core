import { setTagTransformer, setMode } from '@stencil/core';

import tagTransformer from './tag-transformer.js';

export const setupApp = () => {
  setTagTransformer(tagTransformer);

  setMode((elm) => {
    if (!elm) return null;
    return (elm as any).colormode || elm.getAttribute('colormode');
  });
};

export * from './components';
