import { defineCustomElements } from 'component-library/loader';

defineCustomElements()
  .then(() => {
    if (typeof window !== 'undefined') {
      window.__STENCIL_COMPONENT_LIBRARY_READY__ = true;
    }
  })
  .catch((err) => {
    if (typeof window !== 'undefined') {
      window.__STENCIL_COMPONENT_LIBRARY_READY__ = false;
      console.error('defineCustomElements failed', err);
    }
    throw err;
  });
