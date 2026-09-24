import { setTagTransformer, setMode } from '@stencil/core';

import tagTransformer from './tag-transformer.js';

export const setupApp = () => {
  setTagTransformer(tagTransformer);

  // Set up mode resolution for style-mode tests
  // Mode is determined by: element's mode prop/attr > document mode attr > default 'buford'
  setMode((elm) => {
    if (!elm) return null;
    return (
      (elm as any).colormode ||
      elm.getAttribute('colormode') ||
      (elm as any).mode ||
      elm.getAttribute('mode') ||
      document.documentElement.getAttribute('mode') ||
      'buford'
    );
  });
};

export * from './components';
